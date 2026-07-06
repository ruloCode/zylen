/**
 * ShopItemManager — React Native port. CRUD list for the shop rewards:
 * create/edit via ShopItemForm, delete with a native confirm (Alert.alert).
 */

import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Edit, Trash2, Plus, Sparkles, Package } from 'lucide-react-native';
import { ShopItemForm } from './ShopItemForm';
import { GlassCard } from '@/components/ui';
import { useShop } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { HABIT_ICONS } from '@/features/habits/components/IconSelector';
import type { ShopItem } from '@/types';

const ACCENT_GREEN = 'rgb(155,215,50)';

// Category chip styling (dark-surface adaptation of the web palette)
const categoryColors: Record<string, { container: string; text: string }> = {
  food: { container: 'border-gold-300/40 bg-gold-500/15', text: 'text-gold-300' },
  leisure: { container: 'border-teal-300/40 bg-teal-500/15', text: 'text-teal-300' },
  shopping: { container: 'border-white/20 bg-white/10', text: 'text-white' },
  other: { container: 'border-white/20 bg-white/10', text: 'text-white/80' },
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
  const handleCreate = (): void => {
    setEditingItem(undefined);
    setShowForm(true);
  };

  /**
   * Handle editing an existing item
   */
  const handleEdit = (item: ShopItem): void => {
    setEditingItem(item);
    setShowForm(true);
  };

  /**
   * Handle deleting an item (web: window.confirm -> native: Alert.alert)
   */
  const handleDelete = (item: ShopItem): void => {
    const displayName = getDisplayName(item);

    Alert.alert(t('actions.delete'), t('shopManager.confirmDelete', { name: displayName }), [
      { text: t('actions.cancel'), style: 'cancel' },
      {
        text: t('actions.delete'),
        style: 'destructive',
        onPress: () => {
          deleteShopItem(item.id);
          toast.success(t('shop.toast.itemDeleted', { name: displayName }));
        },
      },
    ]);
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = (data: Omit<ShopItem, 'id'>): void => {
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
  const handleFormCancel = (): void => {
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
    return isTranslationKey(item.name);
  };

  return (
    <View>
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Sparkles size={28} color="#F9A410" />
            <Text className="text-2xl font-bold text-white">{t('shopManager.title')}</Text>
          </View>
          <Text className="mt-2 text-sm text-white">{t('shopManager.subtitle')}</Text>
        </View>
        <Pressable
          onPress={handleCreate}
          accessibilityRole="button"
          className="shrink-0 flex-row items-center gap-2 rounded-xl bg-teal-500 px-4 py-3 active:opacity-80"
        >
          <Plus size={20} color="#FFFFFF" />
          <Text className="font-semibold text-white">{t('shopManager.addItem')}</Text>
        </Pressable>
      </View>

      {/* Items List */}
      <View className="gap-3">
        {shopItems.length === 0 ? (
          <GlassCard className="items-center border-2 border-gold-200/30 py-16">
            <Package size={64} color="rgba(255,255,255,0.6)" />
            <Text className="mb-2 mt-4 text-lg text-white">{t('shopManager.noItems')}</Text>
            <Text className="mb-6 text-sm text-white/80">{t('shopManager.createFirstHint')}</Text>
            <Pressable
              onPress={handleCreate}
              accessibilityRole="button"
              className="overflow-hidden rounded-xl active:opacity-80"
            >
              <LinearGradient
                colors={['#F9A410', '#EF8109']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 24, paddingVertical: 12 }}
              >
                <Text className="font-semibold text-white">{t('shopManager.addFirstItem')}</Text>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        ) : (
          shopItems.map((item) => {
            const Icon = HABIT_ICONS[item.iconName] || HABIT_ICONS.Target;
            const displayName = getDisplayName(item);
            const displayDescription = getDisplayDescription(item);
            const isDefault = isPredefined(item);
            const categoryColor = categoryColors[item.category || 'other'];

            return (
              <GlassCard
                key={item.id}
                className="flex-row items-center gap-4 rounded-xl border-2 border-gold-200/20 p-4"
              >
                {/* Icon */}
                <View className="shrink-0 overflow-hidden rounded-xl">
                  <LinearGradient
                    colors={['#FAB62E', '#F9A410']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 12 }}
                  >
                    <Icon size={28} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                {/* Info */}
                <View className="min-w-0 flex-1">
                  <View className="mb-1 flex-row flex-wrap items-center gap-2">
                    <Text className="text-lg font-bold text-white" numberOfLines={1}>
                      {displayName}
                    </Text>
                    {isDefault && (
                      <View className="rounded-full border border-teal-300/40 bg-teal-500/15 px-2 py-0.5">
                        <Text className="text-xs font-semibold text-teal-300">
                          {t('shopManager.default')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="mb-2 text-sm text-white" numberOfLines={2}>
                    {displayDescription}
                  </Text>
                  <View className="flex-row flex-wrap items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <Sparkles size={16} color={ACCENT_GREEN} />
                      <Text className="text-sm font-bold" style={{ color: ACCENT_GREEN }}>
                        {item.cost} {t('common.points')}
                      </Text>
                    </View>
                    {item.category && (
                      <View
                        className={`rounded-full border px-2 py-1 ${categoryColor.container}`}
                      >
                        <Text className={`text-xs font-semibold ${categoryColor.text}`}>
                          {t(`shopManager.categories.${item.category}`)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View className="shrink-0 flex-row items-center gap-2">
                  <Pressable
                    onPress={() => handleEdit(item)}
                    accessibilityRole="button"
                    accessibilityLabel={t('actions.edit')}
                    className="rounded-lg p-2.5 active:bg-teal-500/20"
                  >
                    <Edit size={20} color="#2DD4BF" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    accessibilityRole="button"
                    accessibilityLabel={t('actions.delete')}
                    className="rounded-lg p-2.5 active:bg-danger-500/20"
                  >
                    <Trash2 size={20} color="rgb(217,83,79)" />
                  </Pressable>
                </View>
              </GlassCard>
            );
          })
        )}
      </View>

      {/* Form Modal */}
      {showForm && (
        <ShopItemForm item={editingItem} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
      )}
    </View>
  );
}
