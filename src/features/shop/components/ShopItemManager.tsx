import React, { useState } from 'react';
import { Edit, Trash2, Plus, Sparkles, Package } from 'lucide-react';
import { ShopItemForm } from './ShopItemForm';
import { useShop } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { HABIT_ICONS } from '@/features/habits/components/IconSelector';
import type { ShopItem } from '@/types';

// Category color mapping
const categoryColors: Record<string, string> = {
  food: 'bg-gold-100 text-gold-700 border-gold-300',
  leisure: 'bg-teal-100 text-teal-700 border-teal-300',
  shopping: 'bg-parchment-200 text-white border-parchment-300',
  other: 'bg-gray-100 text-gray-700 border-gray-300',
};

export function ShopItemManager() {
  const { t } = useLocale();
  const toast = useToast();
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
    const displayName = getDisplayName(item);

    if (confirm(t('shopManager.confirmDelete', { name: displayName }))) {
      deleteShopItem(item.id);
      toast.success(t('shop.toast.itemDeleted', { name: displayName }));
    }
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = (data: Omit<ShopItem, 'id'>) => {
    const displayName = isTranslationKey(data.name) ? t(data.name) : data.name;

    if (editingItem) {
      // Update existing item
      updateShopItem(editingItem.id, data);
      toast.success(t('shop.toast.itemUpdated', { name: displayName }));
    } else {
      // Create new item
      addShopItem({
        id: crypto.randomUUID(),
        ...data,
      });
      toast.success(t('shop.toast.itemAdded', { name: displayName }));
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
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-gold-500" />
            {t('shopManager.title')}
          </h2>
          <p className="text-sm text-white mt-2">{t('shopManager.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold shadow-glow-teal transition-all duration-200 hover:scale-105"
        >
          <Plus size={20} />
          {t('shopManager.addItem')}
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {shopItems.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl border-2 border-gold-200/30">
            <Package className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <p className="text-white text-lg mb-2">{t('shopManager.noItems')}</p>
            <p className="text-white/80 text-sm mb-6">Create your first reward to get started</p>
            <button
              onClick={handleCreate}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold shadow-glow-gold transition-all duration-200 hover:scale-105"
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
            const categoryColor = categoryColors[item.category || 'other'];

            return (
              <div
                key={item.id}
                className="glass-card rounded-xl p-5 flex items-center gap-4 border-2 border-gold-200/20 hover:border-gold-300/40 transition-all duration-200 group"
              >
                {/* Icon */}
                <div className="icon-gradient-gold p-3 rounded-xl flex-shrink-0 shadow-glow-gold group-hover:scale-110 transition-transform duration-200">
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-white">{displayName}</h3>
                    {isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 text-xs font-semibold border border-teal-300">
                        {t('shopManager.default')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white mb-2">{displayDescription}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[rgb(155,215,50)] flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      {item.cost} {t('common.points')}
                    </span>
                    {item.category && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${categoryColor}`}>
                        {t(`shopManager.categories.${item.category}`)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2.5 rounded-lg hover:bg-teal-100 transition-all duration-200 group/edit"
                    title={t('actions.edit')}
                  >
                    <Edit className="w-5 h-5 text-teal-600 group-hover/edit:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2.5 rounded-lg hover:bg-danger/10 transition-all duration-200 group/delete"
                    title={t('actions.delete')}
                  >
                    <Trash2 className="w-5 h-5 text-danger group-hover/delete:scale-110 transition-transform" />
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
