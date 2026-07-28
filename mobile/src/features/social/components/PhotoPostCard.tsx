/**
 * PhotoPostCard — post de foto de progreso dentro del feed de Aliados.
 *
 * Cabecera (avatar + nombre + hora + borrar si es propio), la foto (signed
 * URL del bucket privado; cacheKey = path para que el caché sobreviva la
 * rotación de firmas), caption y la barra de reacciones.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Flag, ShieldCheck, Target, Trash2 } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { formatRelativeShort } from '@/utils/date';
import { img } from '@/assets/registry';
import * as ModerationService from '@/services/supabase/moderation.service';
import type { ActivityEvent, PostReactionKind } from '@/types/community';
import { ReactionBar } from './ReactionBar';
import { ReportSheet } from './ReportSheet';

const AVATAR_GRADIENT = ['rgba(20,184,166,0.2)', 'rgba(15,118,110,0.1)'] as const;

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

interface PhotoPostCardProps {
  event: ActivityEvent;
  /** Signed URL de la foto (undefined mientras se firma). */
  imageUrl?: string;
  /** Avatar propio para eventos del caller (el RPC trae el del perfil). */
  ownAvatarUrl?: string;
  onReact: (postId: string, kind: PostReactionKind) => void;
  onDelete: (postId: string) => void;
  onImagePress?: (url: string) => void;
  /** Verificar evidencia de un aliado (solo posts con hábito, no propios). */
  onVerify?: (postId: string) => void;
}

export function PhotoPostCard({
  event,
  imageUrl,
  ownAvatarUrl,
  onReact,
  onDelete,
  onImagePress,
  onVerify,
}: PhotoPostCardProps) {
  const { t, language } = useLocale();
  const [reportOpen, setReportOpen] = useState(false);
  const postId = event.postId;
  if (!postId) return null;

  const avatarUrl = event.isCurrentUser ? ownAvatarUrl : event.avatarUrl;
  const relative = formatRelativeShort(event.createdAt, language);
  const caption = event.payload.caption ?? '';
  const habitName = event.payload.habit_name;
  const isEvidence = !!habitName;
  const canVerify = isEvidence && !event.verified && !event.isCurrentUser && !!onVerify;

  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      {/* Cabecera */}
      <View className="mb-2.5 flex-row items-center gap-2.5">
        <LinearGradient
          colors={AVATAR_GRADIENT}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarUrl ? (
            <Image
              source={avatarSource(avatarUrl)}
              accessibilityLabel={event.username}
              contentFit="cover"
              contentPosition="top"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Text className="text-sm font-bold text-white">
              {event.username.charAt(0).toUpperCase()}
            </Text>
          )}
        </LinearGradient>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-bold text-white">
            {event.isCurrentUser ? t('leaderboard.you') : event.username}{' '}
            <Text className="font-normal text-white/60">
              {t('community.activity.types.progressPhoto')}
            </Text>
          </Text>
          <Text className="text-[11px] text-white/40">
            {relative || t('community.activity.justNow')}
          </Text>
        </View>
        {event.isCurrentUser ? (
          <Pressable
            onPress={() => onDelete(postId)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('community.posts.delete')}
            className="rounded-lg p-1.5 active:bg-red-500/10"
          >
            <Trash2 size={15} color="rgba(248,113,113,0.75)" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setReportOpen(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('moderation.reportPost')}
            className="rounded-lg p-1.5 active:bg-white/10"
          >
            <Flag size={14} color="rgba(255,255,255,0.35)" />
          </Pressable>
        )}
      </View>

      {/* Foto */}
      <Pressable
        onPress={imageUrl && onImagePress ? () => onImagePress(imageUrl) : undefined}
        disabled={!imageUrl || !onImagePress}
        accessibilityRole={imageUrl ? 'imagebutton' : 'image'}
        accessibilityLabel={caption || t('community.posts.photoAlt')}
        className="overflow-hidden rounded-xl"
      >
        <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: 'rgba(255,255,255,0.04)' }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl, cacheKey: event.imagePath }}
              contentFit="cover"
              transition={150}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <ActivityIndicator size="small" color="#2dd4bf" />
            </View>
          )}
        </View>
      </Pressable>

      {/* Evidencia: chip del hábito + estado de verificación */}
      {isEvidence && (
        <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
          <View className="flex-row items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2.5 py-1">
            <Target size={11} color="hsl(40, 95%, 58%)" />
            <Text className="text-[11px] font-bold text-gold-400">
              {t('community.posts.evidenceOf', { habit: habitName })}
            </Text>
          </View>
          {event.verified && (
            <View className="flex-row items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1">
              <ShieldCheck size={11} color="#6ee7b7" />
              <Text className="text-[11px] font-bold text-emerald-300">
                {event.verifiedByUsername
                  ? t('community.posts.verifiedBy', { username: event.verifiedByUsername })
                  : t('community.posts.verified')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Caption */}
      {!!caption && (
        <Text className="mt-2 text-[13px] leading-snug text-white/85">{caption}</Text>
      )}

      <ReactionBar
        reactions={event.reactions}
        onReact={(kind) => onReact(postId, kind)}
        reactLabel={(kind) => t('community.posts.reactWith', { reaction: kind })}
      />

      {/* Verificar la evidencia de un aliado (bonus para ambos) */}
      {canVerify && (
        <Pressable
          onPress={() => onVerify?.(postId)}
          accessibilityRole="button"
          className="mt-2.5 flex-row items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 py-2.5 active:bg-emerald-500/20"
        >
          <ShieldCheck size={15} color="#6ee7b7" />
          <Text className="text-[12.5px] font-bold text-emerald-300">
            {t('community.posts.verifyCta')}
          </Text>
        </Pressable>
      )}

      {reportOpen && (
        <ReportSheet
          title={t('moderation.reportPost')}
          onClose={() => setReportOpen(false)}
          onSubmit={(reason, details) =>
            ModerationService.reportContent({
              reportedUserId: event.userId,
              contentType: 'post',
              contentId: postId,
              reason,
              details,
            }).then(() => undefined)
          }
        />
      )}
    </View>
  );
}

export default PhotoPostCard;
