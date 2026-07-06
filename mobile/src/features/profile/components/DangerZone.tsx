/**
 * DangerZone — React Native port.
 *
 * Full data reset with the web's typed-confirmation modal (the user must type
 * ELIMINAR/DELETE). The web clears localStorage and reloads the page; on
 * native we clear the kv-backed storage and sign out — the AuthGate then
 * routes back to the public flow, the closest equivalent of a fresh start.
 */

import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/features/auth/context/AuthContext';
import { StorageService } from '@/services/storage';

const RED_400 = '#F56565';
const WHITE = '#FFFFFF';

export function DangerZone() {
  const { t, language } = useLocale();
  const { signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Confirmation text based on language
  const requiredText = language === 'es' ? 'ELIMINAR' : 'DELETE';
  const isConfirmValid = confirmText === requiredText;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setConfirmText(''); // Reset input when opening
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConfirmText('');
  };

  const handleConfirmReset = async () => {
    if (!isConfirmValid) return;

    // Clear all locally persisted data (web: localStorage.clear())
    StorageService.clear();
    setIsModalOpen(false);

    // Web reloads the app; on native, signing out restarts the flow
    // (AuthGate redirects to /welcome → onboarding).
    await signOut();
  };

  const dataToDelete = [
    t('profile.dangerZone.deleteList.habits'),
    t('profile.dangerZone.deleteList.streaks'),
    t('profile.dangerZone.deleteList.progress'),
    t('profile.dangerZone.deleteList.purchases'),
    t('profile.dangerZone.deleteList.profile'),
    t('profile.dangerZone.deleteList.settings'),
  ];

  return (
    <>
      <View className="rounded-2xl border border-danger-500/50 bg-[hsl(var(--glass-bg)/0.65)] p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row items-center gap-3">
            <View className="rounded-lg border border-danger-400/30 bg-danger-500/20 p-2">
              <AlertTriangle size={24} color={RED_400} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-bold text-danger-400">
                {t('profile.dangerZone.title')}
              </Text>
              <Text className="text-sm text-white/70">
                {t('profile.dangerZone.description')}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="border-t border-danger-500/30" />

          {/* Reset Button */}
          <View className="gap-3">
            <View>
              <Text className="font-semibold text-white">
                {t('profile.dangerZone.resetTitle')}
              </Text>
              <Text className="text-sm text-white/70">
                {t('profile.dangerZone.resetDescription')}
              </Text>
            </View>
            <Button variant="danger" size="md" onClick={handleOpenModal}>
              <Trash2 size={16} color={WHITE} />
              <Text className="text-base font-semibold text-destructive-foreground">
                {t('profile.dangerZone.resetButton')}
              </Text>
            </Button>
          </View>
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        showCloseButton={false}
      >
        <View className="gap-6">
          {/* Warning Header */}
          <View className="flex-row items-start gap-3">
            <View className="rounded-full border border-danger-400/30 bg-danger-500/20 p-3">
              <AlertTriangle size={32} color={RED_400} />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-danger-400">
                {t('profile.resetModal.title')}
              </Text>
              <Text className="mt-1 text-white/80">{t('profile.resetModal.subtitle')}</Text>
            </View>
          </View>

          {/* Warning Box */}
          <View className="rounded-xl border-2 border-danger-500/50 bg-danger-500/10 p-4">
            <Text className="mb-3 font-semibold text-danger-400">
              {t('profile.resetModal.warning')}
            </Text>
            <View className="gap-2">
              {dataToDelete.map((item, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <X size={16} color={RED_400} />
                  <Text className="flex-1 text-sm text-white/80">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Confirmation Input */}
          <View className="gap-3">
            <Text className="font-semibold text-white">
              {t('profile.resetModal.inputLabel', { text: requiredText })}
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={requiredText}
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-4 py-3 font-mono text-lg text-white"
            />
            {confirmText.length > 0 && !isConfirmValid && (
              <Text className="text-sm text-danger-400">
                {t('profile.resetModal.inputError')}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="gap-3 pt-4">
            <Button
              variant="danger"
              size="lg"
              onClick={() => void handleConfirmReset()}
              disabled={!isConfirmValid}
            >
              <Trash2 size={16} color={WHITE} />
              <Text className="text-lg font-semibold text-destructive-foreground">
                {t('profile.resetModal.confirmButton')}
              </Text>
            </Button>
            <Button variant="ghost" size="lg" onClick={handleCloseModal}>
              {t('actions.cancel')}
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}
