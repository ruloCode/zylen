/**
 * GemCreatorSheet — bottom sheet to create a focus gem: name + either a
 * linked habit (species auto-derives from its life area and locks) or a
 * free-form activity + species pick.
 *
 * Species follow Forest-style progression: two are free, the rest are
 * bought with points (Esencia) right from the picker.
 *
 * RN port: a transparent Modal anchored to the bottom; the unlock confirm
 * renders as an absolute overlay inside the same Modal (nesting two native
 * modals is flaky on Android).
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, Gem, Check, Link2, Lock } from 'lucide-react-native';
import toast from '@/lib/toast';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { useFocus, useHabits, useLifeAreas, useUser } from '@/store';
import type { FocusGem, GemSpecies } from '@/types/focus';
import { GEM_SPECIES } from '@/types/focus';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { Select } from '@/components/atoms';
import { gemStageImageSource, speciesMeta } from '../utils/gemAssets';

interface GemCreatorSheetProps {
  onClose: () => void;
  onCreated: (gem: FocusGem) => void;
}

const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

export function GemCreatorSheet({ onClose, onCreated }: GemCreatorSheetProps) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { createFocusGem, focusSpecies, unlockFocusSpecies } = useFocus();
  const { habits } = useHabits();
  const { getLifeAreaById } = useLifeAreas();
  const { user } = useUser();

  const [name, setName] = useState('');
  const [habitId, setHabitId] = useState<string>('');
  const [activity, setActivity] = useState('');
  const [species, setSpecies] = useState<GemSpecies>('career');
  const [saving, setSaving] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<GemSpecies | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const speciesState = useMemo(
    () => new Map(focusSpecies.map((s) => [s.key, s])),
    [focusSpecies]
  );
  const isUnlocked = (key: GemSpecies) =>
    speciesState.get(key)?.unlocked ?? true;
  const priceOf = (key: GemSpecies) => speciesState.get(key)?.price ?? 0;

  // A linked habit derives (and locks) the species from its life area.
  const derivedSpecies = useMemo<GemSpecies | null>(() => {
    if (!habitId) return null;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return null;
    const area = getLifeAreaById(habit.lifeArea);
    const key = String(area?.area ?? habit.lifeArea).toLowerCase();
    return (GEM_SPECIES as string[]).includes(key)
      ? (key as GemSpecies)
      : null;
  }, [habitId, habits, getLifeAreaById]);

  const effectiveSpecies = derivedSpecies ?? species;
  const effectiveLocked = !isUnlocked(effectiveSpecies);
  const canSave = name.trim().length > 0 && !saving && !effectiveLocked;

  const points = user?.points ?? 0;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      const gem = await createFocusGem({
        name: name.trim().slice(0, 40),
        species: effectiveSpecies,
        habitId: habitId || undefined,
        activity: habitId ? undefined : activity.trim().slice(0, 80) || undefined,
      });
      onCreated(gem);
    } catch {
      toast.error(t('focus.errors.createFailed'));
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockTarget || unlocking) return;
    const price = priceOf(unlockTarget);
    if (points < price) {
      toast.error(t('focus.creator.insufficientPoints'));
      return;
    }
    try {
      setUnlocking(true);
      await unlockFocusSpecies(unlockTarget);
      toast.success(t('focus.creator.unlocked'));
      if (!derivedSpecies) setSpecies(unlockTarget);
      setUnlockTarget(null);
    } catch {
      toast.error(t('focus.creator.unlockFailed'));
    } finally {
      setUnlocking(false);
    }
  };

  const onSpeciesTap = (key: GemSpecies) => {
    if (derivedSpecies !== null) return;
    if (isUnlocked(key)) {
      setSpecies(key);
    } else {
      setUnlockTarget(key);
    }
  };

  const habitOptions = [
    { value: '', label: t('focus.creator.noHabit') },
    ...habits.map((h) => ({ value: h.id, label: h.name })),
  ];

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        {/* Backdrop press closes the sheet */}
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('actions.cancel')}
        />

        {/* Sheet */}
        <View
          className="max-h-[90%] w-full rounded-t-3xl border border-white/10 bg-charcoal-500"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20 }}
          >
            {/* Header */}
            <View className="mb-5 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20">
                <Gem size={20} color="#5eead4" />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-lg font-bold text-white">
                  {t('focus.creator.title')}
                </Text>
              </View>
              <View className={cn(glass, 'px-2.5 py-1')}>
                <Text className="text-xs font-bold text-gold-400">
                  ◆ {points}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="h-9 w-9 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
                accessibilityLabel={t('actions.cancel')}
              >
                <X size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wide text-white/70">
                {t('focus.creator.name')}
              </Text>
              <TextInput
                autoFocus
                maxLength={40}
                value={name}
                onChangeText={setName}
                placeholder={t('focus.creator.namePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white"
              />
            </View>

            {/* Optional habit link */}
            <View className="mb-4">
              <View className="flex-row items-center gap-1.5">
                <Link2 size={12} color="rgba(255,255,255,0.7)" />
                <Text className="text-xs font-bold uppercase tracking-wide text-white/70">
                  {t('focus.creator.linkHabit')}
                </Text>
              </View>
              <View className="mt-1.5">
                <Select
                  value={habitId}
                  onValueChange={setHabitId}
                  options={habitOptions}
                  placeholder={t('focus.creator.noHabit')}
                  aria-label={t('focus.creator.linkHabit')}
                  className="rounded-2xl border border-white/10 bg-white/5"
                />
              </View>
            </View>

            {/* Free-form activity (only without a habit) */}
            {!habitId && (
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wide text-white/70">
                  {t('focus.creator.activity')}
                </Text>
                <TextInput
                  maxLength={80}
                  value={activity}
                  onChangeText={setActivity}
                  placeholder={t('focus.creator.activityPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white"
                />
              </View>
            )}

            {/* Species */}
            <View className="mb-6">
              <Text className="text-xs font-bold uppercase tracking-wide text-white/70">
                {t('focus.creator.species')}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {GEM_SPECIES.map((key) => {
                  const meta = speciesMeta(key);
                  const Icon = getIcon(meta.iconName);
                  const active = effectiveSpecies === key;
                  const unlocked = isUnlocked(key);
                  const dimmed = derivedSpecies !== null && !active;
                  return (
                    <Pressable
                      key={key}
                      disabled={derivedSpecies !== null}
                      onPress={() => onSpeciesTap(key)}
                      className={cn(
                        'relative items-center gap-1 rounded-2xl p-2.5',
                        active ? 'border-2 bg-white/10' : 'border border-white/10 bg-white/5',
                        dimmed && 'opacity-30',
                        !unlocked && !dimmed && 'opacity-70'
                      )}
                      style={[
                        { flexBasis: '30%', flexGrow: 1 },
                        active ? { borderColor: meta.color } : null,
                      ]}
                    >
                      {!unlocked && (
                        <View className="absolute right-1.5 top-1.5">
                          <Lock size={11} color="rgba(255,255,255,0.5)" />
                        </View>
                      )}
                      <Icon size={18} color={unlocked ? meta.color : '#8a9499'} />
                      <Text className="text-center text-[11px] font-bold leading-tight text-white">
                        {t(meta.i18nKey)}
                      </Text>
                      {!unlocked && (
                        <Text className="text-[10px] font-bold text-gold-400">
                          ◆ {priceOf(key)}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {derivedSpecies && !effectiveLocked && (
                <Text className="mt-1.5 text-[11px] text-white/45">
                  {t('focus.creator.speciesLocked')}
                </Text>
              )}
              {/* Linked habit's species still locked: offer the unlock inline */}
              {derivedSpecies && effectiveLocked && (
                <Pressable
                  onPress={() => setUnlockTarget(derivedSpecies)}
                  className="mt-2 w-full flex-row items-center justify-center gap-1.5 rounded-xl border border-gold-500/40 bg-gold-500/15 py-2.5"
                >
                  <Lock size={12} color="#FBCB6A" />
                  <Text className="text-xs font-bold text-gold-300">
                    {t('focus.creator.unlockCta', {
                      species: t(speciesMeta(derivedSpecies).i18nKey),
                      price: priceOf(derivedSpecies),
                    })}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Create CTA (web: .btn-primary) */}
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className={cn(
                'w-full flex-row items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 active:opacity-90',
                !canSave && 'opacity-40'
              )}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Check size={20} color="#ffffff" />
              )}
              <Text className="text-base font-bold text-white">
                {t('focus.creator.create')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Unlock confirm — overlay inside the same modal */}
        {unlockTarget && (
          <View
            className="absolute inset-0 items-center justify-center bg-black/70 px-6"
            style={StyleSheet.absoluteFill}
          >
            <View className="w-full max-w-sm items-center rounded-3xl border border-white/10 bg-charcoal-500 p-6">
              <Image
                source={gemStageImageSource(unlockTarget, 4)}
                contentFit="contain"
                style={{ width: 96, height: 96, marginBottom: 8 }}
                accessibilityElementsHidden
              />
              <Text className="mb-1 text-center text-lg font-bold text-white">
                {t('focus.creator.unlockTitle', {
                  species: t(speciesMeta(unlockTarget).i18nKey),
                })}
              </Text>
              <Text className="mb-4 text-center text-sm text-white/65">
                {t('focus.creator.unlockBody', {
                  price: priceOf(unlockTarget),
                })}
              </Text>
              <View className="w-full gap-2">
                <Pressable
                  onPress={handleUnlock}
                  disabled={unlocking || points < priceOf(unlockTarget)}
                  className={cn(
                    'w-full flex-row items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 active:opacity-90',
                    (unlocking || points < priceOf(unlockTarget)) && 'opacity-40'
                  )}
                >
                  {unlocking ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-base font-bold text-white">
                      ◆ {priceOf(unlockTarget)}
                    </Text>
                  )}
                  <Text className="text-base font-bold text-white">
                    · {t('focus.creator.unlock')}
                  </Text>
                </Pressable>
                {points < priceOf(unlockTarget) && (
                  <Text className="text-center text-xs font-semibold text-danger-300">
                    {t('focus.creator.insufficientPoints')}
                  </Text>
                )}
                <Pressable
                  onPress={() => setUnlockTarget(null)}
                  className="w-full items-center rounded-2xl bg-white/10 py-2.5 active:bg-white/15"
                >
                  <Text className="text-sm font-bold text-white/70">
                    {t('actions.cancel')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
