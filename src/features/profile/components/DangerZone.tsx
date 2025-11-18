import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLocale } from '@/hooks/useLocale';
import { StorageService } from '@/services/storage';

export function DangerZone() {
  const { t, language } = useLocale();
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

  const handleConfirmReset = () => {
    if (!isConfirmValid) return;

    // Clear all localStorage data
    StorageService.clear();

    // Reload the app to restart from onboarding
    window.location.reload();
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
      <div className="glass-card p-4 md:p-6 border border-red-500/50">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg border border-red-400/30">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-400">
                {t('profile.dangerZone.title')}
              </h3>
              <p className="text-sm text-white/70">
                {t('profile.dangerZone.description')}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-red-500/30" />

          {/* Reset Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-white">
                {t('profile.dangerZone.resetTitle')}
              </p>
              <p className="text-sm text-white/70">
                {t('profile.dangerZone.resetDescription')}
              </p>
            </div>
            <Button
              variant="danger"
              size="md"
              onClick={handleOpenModal}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              {t('profile.dangerZone.resetButton')}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        showCloseButton={false}
      >
        <div className="space-y-6">
          {/* Warning Header */}
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-500/20 rounded-full border border-red-400/30">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-red-400">
                {t('profile.resetModal.title')}
              </h3>
              <p className="text-white/80 mt-1">
                {t('profile.resetModal.subtitle')}
              </p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
            <p className="font-semibold text-red-400 mb-3">
              {t('profile.resetModal.warning')}
            </p>
            <ul className="space-y-2">
              {dataToDelete.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-white/80"
                >
                  <X className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-3">
            <label className="block">
              <span className="font-semibold text-white">
                {t('profile.resetModal.inputLabel', {
                  text: requiredText,
                })}
              </span>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={requiredText}
                className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-white/5 text-white placeholder-white/50 focus:border-red-400 focus:ring-4 focus:ring-red-400/20 outline-none transition-all font-mono text-lg"
                autoFocus
              />
            </label>
            {confirmText && !isConfirmValid && (
              <p className="text-sm text-red-400">
                {t('profile.resetModal.inputError')}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="ghost-warm"
              size="lg"
              onClick={handleCloseModal}
              className="flex-1"
            >
              {t('actions.cancel')}
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={handleConfirmReset}
              disabled={!isConfirmValid}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4" />
              {t('profile.resetModal.confirmButton')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
