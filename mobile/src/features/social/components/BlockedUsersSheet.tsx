/**
 * BlockedUsersSheet — gestión de usuarios bloqueados (ajustes del perfil).
 * Lista get_blocked_users con acción de desbloquear; desbloquear NO restaura
 * la alianza (habría que volver a solicitarla).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Ban, X } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { img } from '@/assets/registry';
import * as ModerationService from '@/services/supabase/moderation.service';
import type { BlockedUser } from '@/services/supabase/moderation.service';

const AVATAR_GRADIENT = ['rgba(20,184,166,0.2)', 'rgba(15,118,110,0.1)'] as const;

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

interface BlockedUsersSheetProps {
  onClose: () => void;
}

export function BlockedUsersSheet({ onClose }: BlockedUsersSheetProps) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Feedback inline: el host de toasts (árbol raíz) no se ve bajo un Modal.
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async (isCancelled?: () => boolean) => {
    try {
      const users = await ModerationService.getBlockedUsers();
      if (!isCancelled?.()) setBlocked(users);
    } catch {
      if (!isCancelled?.()) setHasError(true);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleUnblock = async (user: BlockedUser) => {
    if (busyId) return;
    setBusyId(user.userId);
    setHasError(false);
    try {
      await ModerationService.unblockUser(user.userId);
      // La fila desaparece: ese es el feedback de éxito.
      setBlocked((prev) => prev.filter((b) => b.userId !== user.userId));
    } catch {
      setHasError(true);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('actions.close')}
        />
        <View
          className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-charcoal-500"
          style={{ maxHeight: '80%' }}
          accessibilityViewIsModal
          accessibilityLabel={t('moderation.blockedUsers')}
        >
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-white/20" />
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('actions.close')}
            className="absolute right-4 top-4 z-20 h-9 w-9 items-center justify-center rounded-xl bg-black/40 active:bg-black/60"
          >
            <X size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <ScrollView
            className="px-5 pt-2"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            <View className="mb-1 flex-row items-center gap-2">
              <Ban size={18} color="#f87171" />
              <Text className="text-lg font-extrabold text-white">
                {t('moderation.blockedUsers')}
              </Text>
            </View>
            <Text className="mb-4 text-[12.5px] leading-snug text-white/55">
              {t('moderation.blockedNote')}
            </Text>

            {hasError && (
              <View
                className="mb-3 flex-row items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2.5"
                accessibilityRole="alert"
              >
                <AlertCircle size={15} color="#f87171" />
                <Text className="flex-1 text-[12.5px] font-semibold text-red-300">
                  {t('errors.general')}
                </Text>
              </View>
            )}

            {loading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#2dd4bf" />
              </View>
            ) : blocked.length === 0 ? (
              <View className="items-center py-10">
                <Text className="text-center text-sm text-white/50">
                  {t('moderation.noBlockedUsers')}
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {blocked.map((user) => (
                  <View
                    key={user.userId}
                    className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <LinearGradient
                      colors={AVATAR_GRADIENT}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {user.avatarUrl ? (
                        <Image
                          source={avatarSource(user.avatarUrl)}
                          accessibilityLabel={user.username}
                          contentFit="cover"
                          contentPosition="top"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Text className="text-sm font-bold text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </LinearGradient>
                    <Text
                      numberOfLines={1}
                      className="min-w-0 flex-1 text-sm font-bold text-white"
                    >
                      @{user.username}
                    </Text>
                    <Pressable
                      onPress={() => void handleUnblock(user)}
                      disabled={busyId === user.userId}
                      accessibilityRole="button"
                      className="min-h-[36px] flex-row items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-3 active:bg-white/[0.12]"
                    >
                      {busyId === user.userId ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-xs font-bold text-white/80">
                          {t('moderation.unblock')}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default BlockedUsersSheet;
