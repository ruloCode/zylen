/**
 * ShopItemForm — React Native port. Create/edit modal for shop rewards.
 * Same validation and predefined-item (translation-key) logic as the web;
 * the web's light parchment panel is adapted to the app's dark surfaces.
 */

import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, AlertCircle } from 'lucide-react-native';
import { IconSelector, HABIT_ICONS } from '@/features/habits/components/IconSelector';
import { Input, Select, TextArea } from '@/components/atoms';
import { useLocale } from '@/hooks/useLocale';
import type { ShopItem } from '@/types';
import { SHOP_CONFIG } from '@/constants/config';

interface ShopItemFormProps {
  /** Item to edit (if editing), undefined for new item */
  item?: ShopItem;
  /** Called when form is submitted with valid data */
  onSubmit: (data: Omit<ShopItem, 'id'>) => void;
  /** Called when user cancels the form */
  onCancel: () => void;
}

export function ShopItemForm({ item, onSubmit, onCancel }: ShopItemFormProps) {
  const { t } = useLocale();

  // Check if item uses translation keys
  const isTranslationKey = (text: string): boolean => {
    return text?.startsWith('shop.items.') || false;
  };

  // Check if this is a predefined/default item
  const isPredefinedItem = item ? isTranslationKey(item.name) : false;

  // Get initial values - translate if it's a translation key
  const getInitialName = (): string => {
    if (!item?.name) return '';
    return isTranslationKey(item.name) ? t(item.name) : item.name;
  };

  const getInitialDescription = (): string => {
    if (!item?.description) return '';
    return isTranslationKey(item.description) ? t(item.description) : item.description;
  };

  // Form state
  const [name, setName] = useState(getInitialName());
  const [description, setDescription] = useState(getInitialDescription());
  const [cost, setCost] = useState(item?.cost || 50);
  const [iconName, setIconName] = useState(item?.iconName || 'Candy');
  const [category, setCategory] = useState<'food' | 'leisure' | 'shopping' | 'other'>(
    item?.category || 'other'
  );

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when item prop changes
  useEffect(() => {
    if (item) {
      setName(isTranslationKey(item.name) ? t(item.name) : item.name);
      setDescription(isTranslationKey(item.description) ? t(item.description) : item.description);
      setCost(item.cost);
      setIconName(item.iconName);
      setCategory(item.category || 'other');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, t]);

  /**
   * Validate form fields
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = t('shopManager.errors.nameRequired');
    } else if (name.length < 3) {
      newErrors.name = t('shopManager.errors.nameTooShort');
    } else if (name.length > 50) {
      newErrors.name = t('shopManager.errors.nameTooLong');
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = t('shopManager.errors.descriptionRequired');
    } else if (description.length > 200) {
      newErrors.description = t('shopManager.errors.descriptionTooLong');
    }

    // Cost validation
    if (cost < SHOP_CONFIG.minItemCost) {
      newErrors.cost = t('shopManager.errors.costTooLow', { min: SHOP_CONFIG.minItemCost });
    } else if (cost > SHOP_CONFIG.maxItemCost) {
      newErrors.cost = t('shopManager.errors.costTooHigh', { max: SHOP_CONFIG.maxItemCost });
    }

    // Icon validation
    if (!iconName) {
      newErrors.icon = t('shopManager.errors.iconRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle field blur (mark as touched)
   */
  const handleBlur = (field: string): void => {
    setTouched({ ...touched, [field]: true });
    validate();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (): void => {
    // Mark all fields as touched
    setTouched({
      name: true,
      description: true,
      cost: true,
      icon: true,
      category: true,
    });

    if (!validate()) {
      return;
    }

    // If editing a predefined item, preserve the translation keys
    // Otherwise use the actual values
    const submitData = {
      name: isPredefinedItem && item ? item.name : name.trim(),
      description: isPredefinedItem && item ? item.description : description.trim(),
      cost,
      iconName,
      category,
      available: true,
    };

    onSubmit(submitData);
  };

  const isEditing = !!item;
  const SelectedIcon = HABIT_ICONS[iconName];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/60 p-4">
        <Pressable
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('actions.cancel')}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full max-w-lg"
          style={{ maxHeight: '92%' }}
        >
          <View className="overflow-hidden rounded-3xl border-2 border-gold-300/40 bg-charcoal-500">
            {/* Header with Gold Gradient */}
            <View className="overflow-hidden rounded-t-3xl">
              <LinearGradient
                colors={['#F9A410', '#EF8109']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-1 flex-row items-center gap-3">
                  <Sparkles size={24} color="#FFFFFF" />
                  <Text className="text-2xl font-bold text-white">
                    {isEditing ? t('shopManager.editItem') : t('shopManager.createItem')}
                  </Text>
                </View>
                <Pressable
                  onPress={onCancel}
                  className="rounded-xl p-2 active:bg-white/20"
                  accessibilityRole="button"
                  accessibilityLabel={t('actions.cancel')}
                >
                  <X size={24} color="#FFFFFF" />
                </Pressable>
              </LinearGradient>
            </View>

            {/* Form */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24, gap: 20 }}
            >
              {/* Warning for predefined items */}
              {isPredefinedItem && (
                <View className="flex-row items-start gap-3 rounded-xl border border-warning-500/30 bg-warning-500/10 p-4">
                  <AlertCircle size={20} color="#F0B429" style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="mb-1 text-sm font-semibold text-white">
                      {t('shopManager.defaultItemTitle')}
                    </Text>
                    <Text className="text-sm text-white/60">
                      {t('shopManager.defaultItemBody')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Item Name */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-white">
                  {t('shopManager.itemName')}
                  {isPredefinedItem && (
                    <Text className="text-xs font-normal text-white/50">
                      {'  '}
                      {t('shopManager.defaultItemReadOnly')}
                    </Text>
                  )}
                </Text>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder={t('shopManager.itemNamePlaceholder')}
                  disabled={isPredefinedItem}
                  error={errors.name}
                  touched={touched.name}
                  aria-label={t('shopManager.itemName')}
                />
                {touched.name && errors.name && (
                  <Text className="mt-2 text-sm font-medium text-danger-500" accessibilityRole="alert">
                    {errors.name}
                  </Text>
                )}
              </View>

              {/* Description */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-white">
                  {t('shopManager.description')}
                  {isPredefinedItem && (
                    <Text className="text-xs font-normal text-white/50">
                      {'  '}
                      {t('shopManager.defaultItemReadOnly')}
                    </Text>
                  )}
                </Text>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder={t('shopManager.descriptionPlaceholder')}
                  rows={3}
                  disabled={isPredefinedItem}
                  error={errors.description}
                  touched={touched.description}
                  aria-label={t('shopManager.description')}
                />
                {touched.description && errors.description && (
                  <Text
                    className="mt-2 text-sm font-medium text-danger-500"
                    accessibilityRole="alert"
                  >
                    {errors.description}
                  </Text>
                )}
              </View>

              {/* Cost */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-white">
                  {t('shopManager.cost')}
                </Text>
                <Input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('cost')}
                  error={errors.cost}
                  touched={touched.cost}
                  aria-label={t('shopManager.cost')}
                />
                <Text className="mt-2 text-xs text-white/60">
                  {t('shopManager.costDescription', {
                    min: SHOP_CONFIG.minItemCost,
                    max: SHOP_CONFIG.maxItemCost,
                  })}
                </Text>
                {touched.cost && errors.cost && (
                  <Text className="mt-2 text-sm font-medium text-danger-500" accessibilityRole="alert">
                    {errors.cost}
                  </Text>
                )}
              </View>

              {/* Category */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-white">
                  {t('shopManager.category')}
                </Text>
                <Select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as 'food' | 'leisure' | 'shopping' | 'other')
                  }
                  onBlur={() => handleBlur('category')}
                  options={[
                    { value: 'food', label: t('shopManager.categories.food') },
                    { value: 'leisure', label: t('shopManager.categories.leisure') },
                    { value: 'shopping', label: t('shopManager.categories.shopping') },
                    { value: 'other', label: t('shopManager.categories.other') },
                  ]}
                  aria-label={t('shopManager.category')}
                />
              </View>

              {/* Icon Selection */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-white">
                  {t('shopManager.icon')}
                </Text>
                <View className="mb-3 flex-row items-center gap-3 rounded-xl border border-gold-200/50 bg-white/5 p-4">
                  <View className="overflow-hidden rounded-xl">
                    <LinearGradient
                      colors={['#FAB62E', '#F9A410']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: 12 }}
                    >
                      {SelectedIcon && <SelectedIcon size={24} color="#FFFFFF" />}
                    </LinearGradient>
                  </View>
                  <Text className="text-sm font-medium text-white">
                    {t('shopManager.selectedIcon')}
                  </Text>
                </View>
                <IconSelector selectedIcon={iconName} onSelectIcon={setIconName} />
                {touched.icon && errors.icon && (
                  <Text className="mt-2 text-sm font-medium text-danger-500" accessibilityRole="alert">
                    {errors.icon}
                  </Text>
                )}
              </View>

              {/* Submit Buttons */}
              <View className="flex-row gap-3 pt-4">
                <Pressable
                  onPress={onCancel}
                  accessibilityRole="button"
                  className="flex-1 items-center rounded-xl border-2 border-white/20 bg-white/5 px-6 py-3 active:bg-white/10"
                >
                  <Text className="font-semibold text-white">{t('actions.cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  accessibilityRole="button"
                  className="flex-1 items-center rounded-xl bg-teal-500 px-6 py-3 active:opacity-80"
                >
                  <Text className="font-semibold text-white">
                    {isEditing ? t('actions.saveChanges') : t('actions.create')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
