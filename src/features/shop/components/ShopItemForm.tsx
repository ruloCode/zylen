import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

  // Form state
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
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
      setName(item.name);
      setDescription(item.description);
      setCost(item.cost);
      setIconName(item.iconName);
      setCategory(item.category || 'other');
    }
  }, [item]);

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

    // Submit the data
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      cost,
      iconName,
      category,
      available: true,
    });
  };

  const isEditing = !!item;
  const SelectedIcon = HABIT_ICONS[iconName];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? t('shopManager.editItem') : t('shopManager.createItem')}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label={t('actions.cancel')}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Item Name */}
          <div>
            <label htmlFor="item-name" className="block text-sm font-semibold text-gray-900 mb-2">
              {t('shopManager.itemName')}
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder={t('shopManager.itemNamePlaceholder')}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
                touched.name && errors.name
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-white'
              )}
              aria-invalid={touched.name && !!errors.name}
              aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
            />
            {touched.name && errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              {t('shopManager.description')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder={t('shopManager.descriptionPlaceholder')}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none',
                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
                touched.description && errors.description
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-white'
              )}
              aria-invalid={touched.description && !!errors.description}
              aria-describedby={touched.description && errors.description ? 'description-error' : undefined}
            />
            {touched.description && errors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.description}
              </p>
            )}
          </div>

          {/* Cost */}
          <div>
            <label htmlFor="cost" className="block text-sm font-semibold text-gray-900 mb-2">
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
                'w-full px-4 py-3 rounded-xl border-2 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
                touched.cost && errors.cost
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-white'
              )}
              aria-invalid={touched.cost && !!errors.cost}
              aria-describedby={touched.cost && errors.cost ? 'cost-error' : undefined}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('shopManager.costDescription', { min: SHOP_CONFIG.minItemCost, max: SHOP_CONFIG.maxItemCost })}
            </p>
            {touched.cost && errors.cost && (
              <p id="cost-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.cost}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
              {t('shopManager.category')}
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              onBlur={() => handleBlur('category')}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="food">{t('shopManager.categories.food')}</option>
              <option value="leisure">{t('shopManager.categories.leisure')}</option>
              <option value="shopping">{t('shopManager.categories.shopping')}</option>
              <option value="other">{t('shopManager.categories.other')}</option>
            </select>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t('shopManager.icon')}
            </label>
            <div className="mb-3 flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="bg-teal-100 p-3 rounded-xl">
                {SelectedIcon && <SelectedIcon className="w-6 h-6 text-teal-600" />}
              </div>
              <span className="text-sm text-gray-700">{t('shopManager.selectedIcon')}: {iconName}</span>
            </div>
            <IconSelector selectedIcon={iconName} onSelectIcon={setIconName} />
            {touched.icon && errors.icon && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {errors.icon}
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
            >
              {isEditing ? t('actions.saveChanges') : t('actions.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
