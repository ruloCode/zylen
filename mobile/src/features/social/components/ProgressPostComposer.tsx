/**
 * ProgressPostComposer — sheet para publicar una foto de progreso.
 *
 * Galería o cámara → preview → caption (≤280) → publicar. La subida
 * comprime en el cliente (posts.service) y el RPC create_progress_post
 * emite el evento al feed del círculo. Rate limit: 10 posts / 24h.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, Send, Target, X } from 'lucide-react-native';
import toast from '@/lib/toast';
import { useLocale } from '@/hooks/useLocale';
import { useCommunity, useHabits } from '@/store';

const TEAL_GRADIENT = ['#2dd4bf', '#0d9488'] as const;
const MAX_CAPTION = 280;

interface ProgressPostComposerProps {
  onClose: () => void;
}

export function ProgressPostComposer({ onClose }: ProgressPostComposerProps) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { publishProgressPost } = useCommunity();
  const { habits } = useHabits();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [habitId, setHabitId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Solo hábitos completados HOY pueden llevar evidencia con bonus
  const completedToday = habits.filter((habit) => habit.completedToday);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    const uri = result.assets?.[0]?.uri;
    if (!result.canceled && uri) setPhotoUri(uri);
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      const uri = result.assets?.[0]?.uri;
      if (!result.canceled && uri) setPhotoUri(uri);
    } catch (error) {
      console.warn('Camera unavailable:', error);
    }
  };

  const handlePublish = async () => {
    if (!photoUri || publishing) return;
    setPublishing(true);
    try {
      const result = await publishProgressPost(
        photoUri,
        caption.trim(),
        habitId ?? undefined
      );
      if (!result.ok) {
        if (result.reason === 'evidence_already_posted') {
          toast.error(t('community.posts.evidenceAlready'));
        } else if (result.reason === 'habit_not_completed_today') {
          toast.error(t('community.posts.habitNotCompleted'));
        } else {
          toast.error(t('community.posts.rateLimited'));
        }
        return;
      }
      if (result.bonusXP > 0) {
        toast.success(t('community.posts.publishedWithBonus', { xp: result.bonusXP }));
      } else {
        toast.success(t('community.posts.published'));
      }
      onClose();
    } catch (error) {
      console.error('Error publishing progress post:', error);
      toast.error(t('community.posts.publishError'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('actions.close')}
        />
        <View
          className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-charcoal-500"
          style={{ maxHeight: '92%' }}
          accessibilityViewIsModal
          accessibilityLabel={t('community.posts.composerTitle')}
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
            keyboardShouldPersistTaps="handled"
          >
            <Text className="text-lg font-extrabold text-white">
              {t('community.posts.composerTitle')}
            </Text>
            <Text className="mt-0.5 text-xs leading-relaxed text-white/55">
              {t('community.posts.composerSubtitle')}
            </Text>

            {/* Foto / selección */}
            {photoUri ? (
              <View className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <View style={{ width: '100%', aspectRatio: 4 / 3 }}>
                  <Image
                    source={{ uri: photoUri }}
                    contentFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
                <Pressable
                  onPress={() => setPhotoUri(null)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('community.posts.changePhoto')}
                  className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60 active:bg-black/80"
                >
                  <X size={16} color="#ffffff" />
                </Pressable>
              </View>
            ) : (
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => void pickFromGallery()}
                  accessibilityRole="button"
                  className="flex-1 items-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] py-7 active:bg-white/[0.08]"
                >
                  <ImageIcon size={22} color="#5eead4" />
                  <Text className="text-xs font-semibold text-white/80">
                    {t('community.posts.gallery')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void pickFromCamera()}
                  accessibilityRole="button"
                  className="flex-1 items-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] py-7 active:bg-white/[0.08]"
                >
                  <Camera size={22} color="#5eead4" />
                  <Text className="text-xs font-semibold text-white/80">
                    {t('community.posts.camera')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Evidencia de un hábito completado hoy → bonus */}
            {completedToday.length > 0 && (
              <View className="mt-4">
                <View className="mb-2 flex-row items-center gap-1.5">
                  <Target size={13} color="hsl(40, 95%, 58%)" />
                  <Text className="text-xs font-bold text-white/80">
                    {t('community.posts.evidencePrompt')}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {completedToday.map((habit) => {
                    const selected = habitId === habit.id;
                    return (
                      <Pressable
                        key={habit.id}
                        onPress={() => setHabitId(selected ? null : habit.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={`rounded-full border px-3 py-1.5 active:scale-95 ${
                          selected
                            ? 'border-gold-500/60 bg-gold-500/20'
                            : 'border-white/15 bg-white/[0.05]'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-semibold ${
                            selected ? 'text-gold-400' : 'text-white/70'
                          }`}
                        >
                          {habit.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text className="mt-2 text-[11px] leading-relaxed text-white/45">
                  {habitId
                    ? t('community.posts.evidenceBonusHint')
                    : t('community.posts.evidenceHint')}
                </Text>
              </View>
            )}

            {/* Caption */}
            <View className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={t('community.posts.captionPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                maxLength={MAX_CAPTION}
                accessibilityLabel={t('community.posts.captionPlaceholder')}
                className="min-h-[48px] text-sm leading-relaxed text-white"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="mt-1 self-end text-[10px] tabular-nums text-white/35">
                {caption.length}/{MAX_CAPTION}
              </Text>
            </View>

            {/* Publicar */}
            <Pressable
              disabled={!photoUri || publishing}
              onPress={() => void handlePublish()}
              accessibilityRole="button"
              className={`mt-4 overflow-hidden rounded-2xl active:scale-[0.98] ${
                !photoUri || publishing ? 'opacity-50' : ''
              }`}
            >
              <LinearGradient
                colors={TEAL_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                }}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={16} color="#FFFFFF" />
                )}
                <Text className="text-sm font-bold text-white">
                  {t('community.posts.publish')}
                </Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default ProgressPostComposer;
