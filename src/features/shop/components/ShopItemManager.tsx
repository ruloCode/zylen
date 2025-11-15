import React, { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { ShopItemForm } from './ShopItemForm';
import { useShop } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { HABIT_ICONS } from '@/features/habits/components/IconSelector';
import type { ShopItem } from '@/types';

export function ShopItemManager() {
  const { t } = useLocale();
  const { shopItems, addShopItem, updateShopItem, deleteShopItem } = useShop();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | undefined>(undefined);

  /**
   * Handle creating a new item
   */
  const handleCreate = () => {
    setEditingItem(undefined);
    setShowForm(true);
  };

  /**
   * Handle editing an existing item
   */
  const handleEdit = (item: ShopItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  /**
   * Handle deleting an item
   */
  const handleDelete = (item: ShopItem) => {
    if (confirm(t('shopManager.confirmDelete', { name: item.name }))) {
      deleteShopItem(item.id);
    }
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = (data: Omit<ShopItem, 'id'>) => {
    if (editingItem) {
      // Update existing item
      updateShopItem(editingItem.id, data);
    } else {
      // Create new item
      addShopItem({
        id: crypto.randomUUID(),
        ...data,
      });
    }

    // Close form
    setShowForm(false);
    setEditingItem(undefined);
  };

  /**
   * Handle form cancel
   */
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(undefined);
  };

  /**
   * Check if item name is a translation key
   */
  const isTranslationKey = (name: string): boolean => {
    return name.startsWith('shop.items.');
  };

  /**
   * Get display name for item (translate if it's a key, otherwise use as-is)
   */
  const getDisplayName = (item: ShopItem): string => {
    return isTranslationKey(item.name) ? t(item.name) : item.name;
  };

  /**
   * Get display description for item
   */
  const getDisplayDescription = (item: ShopItem): string => {
    return isTranslationKey(item.description) ? t(item.description) : item.description;
  };

  /**
   * Check if item is predefined (default)
   */
  const isPredefined = (item: ShopItem): boolean => {
    return item.id.startsWith('default-');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('shopManager.title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('shopManager.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} />
          {t('shopManager.addItem')}
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {shopItems.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <p className="text-gray-500">{t('shopManager.noItems')}</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
            >
              {t('shopManager.addFirstItem')}
            </button>
          </div>
        ) : (
          shopItems.map((item) => {
            const Icon = HABIT_ICONS[item.iconName] || HABIT_ICONS.Target;
            const displayName = getDisplayName(item);
            const displayDescription = getDisplayDescription(item);
            const isDefault = isPredefined(item);

            return (
              <div
                key={item.id}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
              >
                {/* Icon */}
                <div className="bg-teal-100 p-3 rounded-xl flex-shrink-0">
                  <Icon className="w-6 h-6 text-teal-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
                    {isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {t('shopManager.default')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{displayDescription}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm font-semibold text-gold-600">
                      {item.cost} {t('common.points')}
                    </span>
                    {item.category && (
                      <span className="text-xs text-gray-500">
                        {t(`shopManager.categories.${item.category}`)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={t('actions.edit')}
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                    title={t('actions.delete')}
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <ShopItemForm
          item={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}
