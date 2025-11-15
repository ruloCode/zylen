import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { IconSelector, HABIT_ICONS } from '@/features/habits/components/IconSelector';
import { useLocale } from '@/hooks/useLocale';
import type { ShopItem } from '@/types';
import { cn } from '@/utils/cn';
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
  const isPredefinedItem = item?.id?.startsWith('default-') || false;

  // Get initial values - translate if it's a translation key
  const getInitialName = () => {
    if (!item?.name) return '';
    return isTranslationKey(item.name) ? t(item.name) : item.name;
  };

  const getInitialDescription = () => {
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
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validate();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="glass-card border-2 border-gold-300/40 rounded-3xl shadow-2xl max-w-lg w-full my-8 max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Header with Gold Gradient */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-5 flex items-center justify-between rounded-t-3xl shadow-glow-gold">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            <h2 className="text-2xl font-bold text-white">
              {isEditing ? t('shopManager.editItem') : t('shopManager.createItem')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            aria-label={t('actions.cancel')}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-parchment-50/95 backdrop-blur-xl">
          {/* Warning for predefined items */}
          {isPredefinedItem && (
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-charcoal-500 mb-1">Default Item</p>
                <p className="text-gray-600">
                  You can modify the cost, icon, and category. Name and description will remain as defined in translations.
                </p>
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label htmlFor="item-name" className="block text-sm font-semibold text-charcoal-500 mb-2">
              {t('shopManager.itemName')}
              {isPredefinedItem && <span className="ml-2 text-xs text-gray-500">(Read-only for default items)</span>}
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder={t('shopManager.itemNamePlaceholder')}
              disabled={isPredefinedItem}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:shadow-glow-gold',
                'bg-white/80 backdrop-blur-sm',
                isPredefinedItem && 'opacity-60 cursor-not-allowed bg-gray-100',
                touched.name && errors.name
                  ? 'border-danger bg-danger/5'
                  : 'border-parchment-300 hover:border-gold-400'
              )}
              aria-invalid={touched.name && !!errors.name}
              aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
            />
            {touched.name && errors.name && (
              <p id="name-error" className="mt-2 text-sm text-danger font-medium" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-charcoal-500 mb-2">
              {t('shopManager.description')}
              {isPredefinedItem && <span className="ml-2 text-xs text-gray-500">(Read-only for default items)</span>}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder={t('shopManager.descriptionPlaceholder')}
              rows={3}
              disabled={isPredefinedItem}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none',
                'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:shadow-glow-gold',
                'bg-white/80 backdrop-blur-sm',
                isPredefinedItem && 'opacity-60 cursor-not-allowed bg-gray-100',
                touched.description && errors.description
                  ? 'border-danger bg-danger/5'
                  : 'border-parchment-300 hover:border-gold-400'
              )}
              aria-invalid={touched.description && !!errors.description}
              aria-describedby={touched.description && errors.description ? 'description-error' : undefined}
            />
            {touched.description && errors.description && (
              <p id="description-error" className="mt-2 text-sm text-danger font-medium" role="alert">
                {errors.description}
              </p>
            )}
          </div>

          {/* Cost */}
          <div>
            <label htmlFor="cost" className="block text-sm font-semibold text-charcoal-500 mb-2">
              {t('shopManager.cost')}
            </label>
            <input
              id="cost"
              type="number"
              min={SHOP_CONFIG.minItemCost}
              max={SHOP_CONFIG.maxItemCost}
              step={5}
              value={cost}
              onChange={(e) => setCost(parseInt(e.target.value) || 0)}
              onBlur={() => handleBlur('cost')}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:shadow-glow-gold',
                'bg-white/80 backdrop-blur-sm',
                touched.cost && errors.cost
                  ? 'border-danger bg-danger/5'
                  : 'border-parchment-300 hover:border-gold-400'
              )}
              aria-invalid={touched.cost && !!errors.cost}
              aria-describedby={touched.cost && errors.cost ? 'cost-error' : undefined}
            />
            <p className="mt-2 text-xs text-gray-600">
              {t('shopManager.costDescription', { min: SHOP_CONFIG.minItemCost, max: SHOP_CONFIG.maxItemCost })}
            </p>
            {touched.cost && errors.cost && (
              <p id="cost-error" className="mt-2 text-sm text-danger font-medium" role="alert">
                {errors.cost}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-charcoal-500 mb-2">
              {t('shopManager.category')}
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              onBlur={() => handleBlur('category')}
              className="w-full px-4 py-3 rounded-xl border-2 border-parchment-300 bg-white/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:shadow-glow-gold hover:border-gold-400"
            >
              <option value="food">{t('shopManager.categories.food')}</option>
              <option value="leisure">{t('shopManager.categories.leisure')}</option>
              <option value="shopping">{t('shopManager.categories.shopping')}</option>
              <option value="other">{t('shopManager.categories.other')}</option>
            </select>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-charcoal-500 mb-2">
              {t('shopManager.icon')}
            </label>
            <div className="mb-3 flex items-center gap-3 p-4 bg-gradient-to-br from-gold-100/50 to-teal-100/50 backdrop-blur-sm rounded-xl border border-gold-200/50">
              <div className="icon-gradient-gold p-3 rounded-xl shadow-glow-gold">
                {SelectedIcon && <SelectedIcon className="w-6 h-6 text-white" />}
              </div>
              <span className="text-sm font-medium text-charcoal-500">
                {t('shopManager.selectedIcon')}: <span className="text-gold-700">{iconName}</span>
              </span>
            </div>
            <IconSelector selectedIcon={iconName} onSelectIcon={setIconName} />
            {touched.icon && errors.icon && (
              <p className="mt-2 text-sm text-danger font-medium" role="alert">
                {errors.icon}
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-200 bg-white/80"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold shadow-glow-teal hover:shadow-glow-teal transition-all duration-200 hover:scale-105"
            >
              {isEditing ? t('actions.saveChanges') : t('actions.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
