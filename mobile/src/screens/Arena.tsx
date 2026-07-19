import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Swords,
  Gem,
  ChevronRight,
  Check,
  Lock,
  ShieldCheck,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { kv } from '@/lib/kvStorage';
import { useUser, useArena, useFocus } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import {
  GAME_CONFIG,
  FOCUS_CONFIG,
  ROUTES,
  ARENA_WEAPONS,
  ARENA_GEMS,
  MAX_EQUIPPED_GEMS,
  tierRewardMultiplier,
  AVATAR_OPTIONS,
  WEB_APP_ORIGIN,
} from '@/constants';
import { GEM_SPECIES } from '@/types/focus';
import {
  encodeGems,
  speciesMeta,
  totalGems,
} from '@/features/focus/utils/gemAssets';
import { getIcon } from '@/components/atoms/icons/iconMaps';

const GAME_ORIGIN = new URL(GAME_CONFIG.url).origin;

/** glass-card recipe (PORTING.md) */
const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

interface GameMessage {
  source?: string;
  event?: string;
  wave?: number;
  tier?: number;
  room?: string;
}

/**
 * The game posts results with `window.top.postMessage(payload, appOrigin)`
 * where appOrigin comes from its `?origin=` URL param. Inside a WebView the
 * game IS the top frame, so we pass the game's own origin: the message
 * self-delivers on its window, and this injected listener forwards it over
 * the react-native-webview bridge.
 */
const BRIDGE_JS = `
(function () {
  window.addEventListener('message', function (e) {
    try {
      var d = e.data;
      if (d && d.source === 'everlight-game') {
        window.ReactNativeWebView.postMessage(JSON.stringify(d));
      }
    } catch (err) {}
  });
})();
true;
`;

function todayRewardKey(): string {
  return `${GAME_CONFIG.rewardCounterKeyPrefix}${new Date().toISOString().slice(0, 10)}`;
}
function getRewardedToday(): number {
  return Number(kv.getItem(todayRewardKey()) ?? 0);
}

/**
 * Arena — armory pre-lobby (tier ladder + weapons/gems bought with habit
 * points, persisted in Supabase) + the embedded co-op game (WebView).
 * Victories report their tier back via the postMessage bridge; the app
 * unlocks the next arena and grants tier-scaled XP/points through the
 * existing user RPCs (daily-capped). Functional twin of ../pages/Arena.tsx.
 */
export function Arena() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { user, updateXP, updatePoints } = useUser();
  const {
    arenaProgress, arenaLoading, loadArenaProgress,
    purchaseArenaItem, equipArenaGear, completeArenaTier,
  } = useArena();

  const { focusStats, loadFocusData } = useFocus();

  const [view, setView] = useState<'armory' | 'playing'>('armory');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { void loadArenaProgress(); }, [loadArenaProgress]);
  useEffect(() => { void loadFocusData(); }, [loadFocusData]);

  // The co-op game plays in landscape; the armory (and the rest of the app)
  // stays portrait. Restores portrait on back-to-armory AND on unmount.
  useEffect(() => {
    if (view !== 'playing') return undefined;
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [view]);

  // Focus gems grown per species -> in-game buffs (species:count entries share
  // the `gems` URL param with the armory gear names; the game tells them apart).
  const speciesCounts = focusStats?.speciesCounts ?? {};
  const focusGemsParam = encodeGems(speciesCounts);
  const focusGemsTotal = totalGems(speciesCounts);

  // graceful defaults so the armory renders even before/without progress
  const progress = arenaProgress ?? {
    tier: 1, weaponId: 'staff_novice', gems: [] as string[],
    ownedWeapons: ['staff_novice'], ownedGems: [] as string[],
  };
  const tier = selectedTier ?? progress.tier;
  const points = user?.points ?? 0;

  const gameSrc = useMemo(() => {
    if (!user || view !== 'playing') return null;
    const room = `el-${user.id.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()}`;
    const params = new URLSearchParams({
      room,
      name: user.name.slice(0, 16),
      // Inside a WebView the game is the top frame: passing its own origin
      // makes window.top.postMessage self-deliver (captured by BRIDGE_JS).
      origin: GAME_ORIGIN,
      rxp: String(Math.round(GAME_CONFIG.victoryXP * tierRewardMultiplier(tier))),
      rpts: String(Math.round(GAME_CONFIG.victoryPoints * tierRewardMultiplier(tier))),
      tier: String(tier),
      weapon: progress.weaponId,
      gems: [...progress.gems, focusGemsParam].filter(Boolean).join(','),
      level: String(Math.max(1, user.level || 1)),   // the hero enters at their real Everlight level
      // in-arena hero model mirrors the chosen app avatar (Dani → 'f', Rulo → 'm')
      skin: AVATAR_OPTIONS.find((o) => o.url === user.avatarUrl)?.id === 'dani' ? 'f' : 'm',
    });
    if (user.avatarUrl) {
      // The game fetches the bust over HTTP — resolve against the deployed web app.
      params.set('avatar', new URL(user.avatarUrl, WEB_APP_ORIGIN).href);
    }
    if (user.heroModelUrl) {
      // forged 3D hero — the game loads this GLB instead of the standard skin
      params.set('model', user.heroModelUrl);
    }
    return `${GAME_CONFIG.url}?${params.toString()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view, tier, progress.weaponId, progress.gems.join(','), focusGemsParam]);

  const handleVictory = useCallback(async (wonTier: number) => {
    // persist the ladder first — unlock is independent from the daily reward cap
    const newTier = await completeArenaTier(wonTier);
    if (newTier) setSelectedTier(null); // keep pointing at the new max
    const rewarded = getRewardedToday();
    if (rewarded >= GAME_CONFIG.maxRewardedVictoriesPerDay) {
      toast(t('arena.dailyCapReached'));
      return;
    }
    kv.setItem(todayRewardKey(), String(rewarded + 1));
    const mult = tierRewardMultiplier(wonTier);
    const xp = Math.round(GAME_CONFIG.victoryXP * mult);
    const pts = Math.round(GAME_CONFIG.victoryPoints * mult);
    try {
      await Promise.all([updateXP(xp), updatePoints(pts)]);
      toast.success(t('arena.victoryReward', { xp, points: pts }));
    } catch {
      toast.error(t('arena.rewardError'));
    }
  }, [t, updateXP, updatePoints, completeArenaTier]);

  const onGameMessage = useCallback((event: WebViewMessageEvent) => {
    let data: GameMessage;
    try {
      data = JSON.parse(event.nativeEvent.data) as GameMessage;
    } catch {
      return;
    }
    if (data?.source !== 'everlight-game') return;
    if (data.event === 'victory') void handleVictory(data.tier ?? tier);
    // defeat screen's "Ir a la Armería" → back to the gear pre-lobby
    if (data.event === 'armory') { setView('armory'); setLoaded(false); }
  }, [handleVictory, tier]);

  const buy = async (type: 'weapon' | 'gem', id: string, cost: number) => {
    if (points < cost) { toast.error(t('arena.armory.insufficient')); return; }
    const ok = await purchaseArenaItem(type, id);
    if (ok) toast.success(t('arena.armory.purchased'));
    else toast.error(t('arena.armory.purchaseError'));
  };

  const equipWeapon = (id: string) => void equipArenaGear(id, progress.gems);
  const toggleGem = (id: string) => {
    const gems = progress.gems.includes(id)
      ? progress.gems.filter((g) => g !== id)
      : [...progress.gems, id].slice(-MAX_EQUIPPED_GEMS);
    void equipArenaGear(progress.weaponId, gems);
  };

  // ---------- playing view: edge-to-edge fullscreen WebView ----------
  // No header/safe-area padding: the game canvas bleeds to every edge and the
  // status bar is hidden. A single floating button (offset by the notch inset)
  // is the only chrome, so nothing eats into the landscape play area.
  if (view === 'playing') {
    return (
      <View className="flex-1 bg-black">
        <StatusBar hidden />
        {gameSrc && (
          <WebView
            source={{ uri: gameSrc }}
            injectedJavaScript={BRIDGE_JS}
            onMessage={onGameMessage}
            onLoadEnd={() => setLoaded(true)}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            // the game is a WebGL canvas: never let the WebView bounce/zoom
            bounces={false}
            scrollEnabled={false}
            setBuiltInZoomControls={false}
            style={{ flex: 1, backgroundColor: '#000' }}
          />
        )}
        {!loaded && (
          <View className="absolute inset-0 items-center justify-center gap-3 bg-background">
            <ActivityIndicator size="large" color="#2dd4bf" />
            <Text className="text-sm font-medium text-white/70">{t('arena.loading')}</Text>
          </View>
        )}
        <Pressable
          onPress={() => { setView('armory'); setLoaded(false); }}
          accessibilityLabel={t('arena.armory.back')}
          hitSlop={12}
          className={`absolute h-9 w-9 items-center justify-center rounded-full ${glass}`}
          style={{ top: Math.max(insets.top, 8) + 4, left: Math.max(insets.left, 8) + 4 }}
        >
          <ArrowLeft size={18} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

  // ---------- armory view ----------
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: 32,
        paddingHorizontal: 16,
      }}
    >
      <View className="mb-4 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.push(ROUTES.DASHBOARD)}
          accessibilityLabel={t('actions.back')}
          className={`h-9 w-9 shrink-0 items-center justify-center rounded-full ${glass}`}
        >
          <ArrowLeft size={18} color="#ffffff" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-extrabold leading-tight text-white">
            {t('arena.armory.title')}
          </Text>
          <Text className="text-xs text-white/60">{t('arena.armory.subtitle')}</Text>
        </View>
        <View className={`${glass} px-3 py-1.5`}>
          <Text className="text-sm font-bold text-gold-400">◆ {points}</Text>
        </View>
      </View>

      {/* Focus-gem powers (grown in "Enfoque del día") */}
      <View className={`${glass} mb-4 flex-row items-center gap-2.5 px-3 py-2.5`}>
        {focusGemsTotal >= FOCUS_CONFIG.arena.shieldUnlockGems ? (
          <ShieldCheck size={16} color="#5eead4" />
        ) : (
          <Gem size={15} color="#5eead4" />
        )}
        {focusGemsTotal > 0 ? (
          <>
            <Text className="text-[11px] font-bold text-white/80">
              {t('arena.gemPowerActive')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-auto">
              <View className="flex-row items-center gap-2">
                {GEM_SPECIES.filter((s) => (speciesCounts[s] ?? 0) > 0).map((s) => {
                  const meta = speciesMeta(s);
                  const Icon = getIcon(meta.iconName);
                  return (
                    <View key={s} className="shrink-0 flex-row items-center gap-0.5">
                      <Icon size={13} color={meta.color} />
                      <Text className="text-[11px] font-bold tabular-nums text-white/70">
                        {speciesCounts[s]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </>
        ) : (
          <Pressable onPress={() => router.push(ROUTES.FOCUS)} className="flex-1">
            <Text className="text-left text-[11px] font-semibold text-white/55">
              {t('arena.gemPowerNone')}
            </Text>
          </Pressable>
        )}
      </View>

      {arenaLoading && !arenaProgress ? (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color="#2dd4bf" />
        </View>
      ) : (
        <>
          {/* tier ladder */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-bold text-white">{t('arena.armory.selectTier')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2 pb-1">
                {Array.from({ length: Math.min(progress.tier + 2, 12) }, (_, i) => i + 1).map((n) => {
                  const unlocked = n <= progress.tier;
                  return (
                    <Pressable
                      key={n}
                      disabled={!unlocked}
                      onPress={() => setSelectedTier(n)}
                      className={`h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                        n === tier
                          ? 'border-teal-400 bg-teal-500/25'
                          : 'border-white/10 bg-[hsl(var(--glass-bg)/0.65)]'
                      }`}
                    >
                      {unlocked ? (
                        <Text
                          className={`text-sm font-extrabold ${
                            n === tier ? 'text-teal-200' : 'text-white/80'
                          }`}
                        >
                          {n}
                        </Text>
                      ) : (
                        <Lock size={14} color="rgba(255,255,255,0.25)" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Text className="mt-1.5 text-[11px] text-white/50">
              {t('arena.armory.tierHint', {
                xp: Math.round(GAME_CONFIG.victoryXP * tierRewardMultiplier(tier)),
                points: Math.round(GAME_CONFIG.victoryPoints * tierRewardMultiplier(tier)),
              })}
            </Text>
          </View>

          {/* weapons */}
          <View className="mb-5">
            <View className="mb-2 flex-row items-center gap-1.5">
              <Swords size={15} color="#5eead4" />
              <Text className="text-sm font-bold text-white">{t('arena.armory.weapons')}</Text>
            </View>
            <View className="gap-2">
              {ARENA_WEAPONS.map((w) => {
                const owned = progress.ownedWeapons.includes(w.id);
                const equipped = progress.weaponId === w.id;
                return (
                  <View key={w.id} className={`${glass} flex-row items-center gap-3 p-3`}>
                    <Text className="w-9 text-center text-2xl">{w.emoji}</Text>
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-bold text-white">{t(`arena.gear.${w.id}.name`)}</Text>
                      <Text className="text-[11px] leading-snug text-white/55">{t(`arena.gear.${w.id}.desc`)}</Text>
                    </View>
                    {equipped ? (
                      <View className="shrink-0 flex-row items-center gap-1">
                        <Check size={14} color="#5eead4" />
                        <Text className="text-xs font-bold text-teal-300">{t('arena.armory.equipped')}</Text>
                      </View>
                    ) : owned ? (
                      <Pressable
                        onPress={() => equipWeapon(w.id)}
                        className="shrink-0 rounded-lg bg-teal-600/60 px-3 py-1.5"
                      >
                        <Text className="text-xs font-bold text-white">{t('arena.armory.equip')}</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => void buy('weapon', w.id, w.cost)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 ${
                          points >= w.cost ? 'bg-gold-500/80' : 'bg-white/10'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            points >= w.cost ? 'text-black' : 'text-white/40'
                          }`}
                        >
                          ◆ {w.cost}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* gems */}
          <View className="mb-6">
            <View className="mb-2 flex-row items-center gap-1.5">
              <Gem size={15} color="#d8b4fe" />
              <Text className="text-sm font-bold text-white">{t('arena.armory.gems')}</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {ARENA_GEMS.map((g) => {
                const owned = progress.ownedGems.includes(g.id);
                const equipped = progress.gems.includes(g.id);
                return (
                  <View
                    key={g.id}
                    className={`${glass} w-[48%] p-3 ${equipped ? 'border-purple-400/60' : ''}`}
                  >
                    <View className="mb-1 flex-row items-center gap-2">
                      <Text className="text-lg">{g.emoji}</Text>
                      <Text className="flex-1 text-xs font-bold leading-tight text-white">
                        {t(`arena.gear.${g.id}.name`)}
                      </Text>
                    </View>
                    <Text className="mb-2 text-[10.5px] leading-snug text-white/55">
                      {t(`arena.gear.${g.id}.desc`)}
                    </Text>
                    {owned ? (
                      <Pressable
                        onPress={() => toggleGem(g.id)}
                        className={`w-full rounded-lg py-1.5 ${
                          equipped ? 'bg-purple-500/50' : 'bg-white/10'
                        }`}
                      >
                        <Text
                          className={`text-center text-[11px] font-bold ${
                            equipped ? 'text-white' : 'text-white/70'
                          }`}
                        >
                          {equipped ? t('arena.armory.unequip') : t('arena.armory.equip')}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => void buy('gem', g.id, g.cost)}
                        className={`w-full rounded-lg py-1.5 ${
                          points >= g.cost ? 'bg-gold-500/80' : 'bg-white/10'
                        }`}
                      >
                        <Text
                          className={`text-center text-[11px] font-bold ${
                            points >= g.cost ? 'text-black' : 'text-white/40'
                          }`}
                        >
                          ◆ {g.cost}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
            <Text className="mt-1.5 text-[10.5px] text-white/45">
              {t('arena.armory.gemSlots', { max: MAX_EQUIPPED_GEMS })}
            </Text>
          </View>

          <Pressable onPress={() => setView('playing')}>
            <LinearGradient
              colors={['#9333ea', '#0d9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text className="text-base font-extrabold text-white">
                {t('arena.armory.enter', { tier })}
              </Text>
              <ChevronRight size={18} color="#ffffff" />
            </LinearGradient>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
