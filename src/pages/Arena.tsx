import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Swords, Gem, ChevronRight, Check, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
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
} from '@/constants';
import { GEM_SPECIES } from '@/types/focus';
import {
  encodeGems,
  speciesMeta,
  totalGems,
} from '@/features/focus/utils/gemAssets';
import { getIcon } from '@/components/atoms/icons/iconMaps';

const GAME_ORIGIN = new URL(GAME_CONFIG.url).origin;

interface GameMessage {
  source?: string;
  event?: string;
  wave?: number;
  tier?: number;
  room?: string;
}

function todayRewardKey(): string {
  return `${GAME_CONFIG.rewardCounterKeyPrefix}${new Date().toISOString().slice(0, 10)}`;
}
function getRewardedToday(): number {
  return Number(localStorage.getItem(todayRewardKey()) ?? 0);
}

/**
 * Arena — armory pre-lobby (tier ladder + weapons/gems bought with habit
 * points, persisted in Supabase) + the embedded co-op game. Victories report
 * their tier back via postMessage; the app unlocks the next arena and grants
 * tier-scaled XP/points through the existing user RPCs (daily-capped).
 */
export function Arena() {
  const navigate = useNavigate();
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
      origin: window.location.origin,
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
      params.set('avatar', new URL(user.avatarUrl, window.location.origin).href);
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
    localStorage.setItem(todayRewardKey(), String(rewarded + 1));
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

  useEffect(() => {
    function onMessage(event: MessageEvent<GameMessage>) {
      if (event.origin !== GAME_ORIGIN) return;
      if (event.data?.source !== 'everlight-game') return;
      if (event.data.event === 'victory') void handleVictory(event.data.tier ?? tier);
      // defeat screen's "Ir a la Armería" → back to the gear pre-lobby
      if (event.data.event === 'armory') { setView('armory'); setLoaded(false); }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
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

  // ---------- playing view: fullscreen iframe ----------
  if (view === 'playing') {
    return (
      <div className="fixed inset-0 z-40 bg-[hsl(var(--background))] flex flex-col">
        <div className="flex items-center gap-3 px-4 h-12 shrink-0">
          <button
            type="button"
            onClick={() => { setView('armory'); setLoaded(false); }}
            aria-label={t('arena.armory.back')}
            className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-sans normal-case text-base font-bold text-white truncate">
            {t('arena.title')} · {t('arena.armory.tierLabel', { tier })}
          </h1>
        </div>
        <div className="relative flex-1 min-h-0">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
              <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
              <p className="text-sm font-medium">{t('arena.loading')}</p>
            </div>
          )}
          {gameSrc && (
            <iframe
              src={gameSrc}
              title={t('arena.title')}
              className="w-full h-full border-0"
              allow="autoplay; gamepad; fullscreen"
              onLoad={() => setLoaded(true)}
            />
          )}
        </div>
      </div>
    );
  }

  // ---------- armory view ----------
  return (
    <div className="max-w-md mx-auto px-4 pb-8 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <header className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          aria-label={t('actions.back')}
          className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-sans normal-case text-xl font-extrabold text-white leading-tight">
            {t('arena.armory.title')}
          </h1>
          <p className="text-white/60 text-xs">{t('arena.armory.subtitle')}</p>
        </div>
        <span className="ml-auto glass-card px-3 py-1.5 text-gold-400 text-sm font-bold whitespace-nowrap">
          ◆ {points}
        </span>
      </header>

      {/* Focus-gem powers (grown in "Enfoque del día") */}
      <div className="glass-card px-3 py-2.5 mb-4 flex items-center gap-2.5">
        {focusGemsTotal >= FOCUS_CONFIG.arena.shieldUnlockGems ? (
          <ShieldCheck size={16} className="text-teal-300 shrink-0" />
        ) : (
          <Gem size={15} className="text-teal-300 shrink-0" />
        )}
        {focusGemsTotal > 0 ? (
          <>
            <span className="text-white/80 text-[11px] font-bold whitespace-nowrap">
              {t('arena.gemPowerActive')}
            </span>
            <div className="ml-auto flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GEM_SPECIES.filter((s) => (speciesCounts[s] ?? 0) > 0).map((s) => {
                const meta = speciesMeta(s);
                const Icon = getIcon(meta.iconName);
                return (
                  <span key={s} className="flex items-center gap-0.5 shrink-0">
                    <Icon size={13} style={{ color: meta.color }} />
                    <span className="text-white/70 text-[11px] font-bold tabular-nums">
                      {speciesCounts[s]}
                    </span>
                  </span>
                );
              })}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate(ROUTES.FOCUS)}
            className="text-white/55 text-[11px] font-semibold text-left"
          >
            {t('arena.gemPowerNone')}
          </button>
        )}
      </div>

      {arenaLoading && !arenaProgress ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
      ) : (
        <>
          {/* tier ladder */}
          <section className="mb-5">
            <h2 className="text-white font-bold text-sm mb-2">{t('arena.armory.selectTier')}</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {Array.from({ length: Math.min(progress.tier + 2, 12) }, (_, i) => i + 1).map((n) => {
                const unlocked = n <= progress.tier;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setSelectedTier(n)}
                    className={`shrink-0 w-12 h-12 rounded-xl font-extrabold text-sm flex items-center justify-center border ${
                      n === tier
                        ? 'bg-teal-500/25 border-teal-400 text-teal-200'
                        : unlocked
                          ? 'glass-card text-white/80'
                          : 'glass-card text-white/25'
                    }`}
                  >
                    {unlocked ? n : <Lock size={14} />}
                  </button>
                );
              })}
            </div>
            <p className="text-white/50 text-[11px] mt-1.5">
              {t('arena.armory.tierHint', {
                xp: Math.round(GAME_CONFIG.victoryXP * tierRewardMultiplier(tier)),
                points: Math.round(GAME_CONFIG.victoryPoints * tierRewardMultiplier(tier)),
              })}
            </p>
          </section>

          {/* weapons */}
          <section className="mb-5">
            <h2 className="text-white font-bold text-sm mb-2 flex items-center gap-1.5">
              <Swords size={15} className="text-teal-300" /> {t('arena.armory.weapons')}
            </h2>
            <div className="space-y-2">
              {ARENA_WEAPONS.map((w) => {
                const owned = progress.ownedWeapons.includes(w.id);
                const equipped = progress.weaponId === w.id;
                return (
                  <div key={w.id} className="glass-card p-3 flex items-center gap-3">
                    <span className="text-2xl w-9 text-center shrink-0">{w.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-bold">{t(`arena.gear.${w.id}.name`)}</p>
                      <p className="text-white/55 text-[11px] leading-snug">{t(`arena.gear.${w.id}.desc`)}</p>
                    </div>
                    {equipped ? (
                      <span className="shrink-0 flex items-center gap-1 text-teal-300 text-xs font-bold"><Check size={14} /> {t('arena.armory.equipped')}</span>
                    ) : owned ? (
                      <button type="button" onClick={() => equipWeapon(w.id)} className="shrink-0 text-xs font-bold text-white bg-teal-600/60 rounded-lg px-3 py-1.5">
                        {t('arena.armory.equip')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void buy('weapon', w.id, w.cost)}
                        className={`shrink-0 text-xs font-bold rounded-lg px-3 py-1.5 ${points >= w.cost ? 'bg-gold-500/80 text-navy-900 text-black' : 'bg-white/10 text-white/40'}`}
                      >
                        ◆ {w.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* gems */}
          <section className="mb-6">
            <h2 className="text-white font-bold text-sm mb-2 flex items-center gap-1.5">
              <Gem size={15} className="text-purple-300" /> {t('arena.armory.gems')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {ARENA_GEMS.map((g) => {
                const owned = progress.ownedGems.includes(g.id);
                const equipped = progress.gems.includes(g.id);
                return (
                  <div key={g.id} className={`glass-card p-3 ${equipped ? 'border border-purple-400/60' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{g.emoji}</span>
                      <p className="text-white text-xs font-bold leading-tight">{t(`arena.gear.${g.id}.name`)}</p>
                    </div>
                    <p className="text-white/55 text-[10.5px] leading-snug mb-2">{t(`arena.gear.${g.id}.desc`)}</p>
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => toggleGem(g.id)}
                        className={`w-full text-[11px] font-bold rounded-lg py-1.5 ${equipped ? 'bg-purple-500/50 text-white' : 'bg-white/10 text-white/70'}`}
                      >
                        {equipped ? t('arena.armory.unequip') : t('arena.armory.equip')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void buy('gem', g.id, g.cost)}
                        className={`w-full text-[11px] font-bold rounded-lg py-1.5 ${points >= g.cost ? 'bg-gold-500/80 text-black' : 'bg-white/10 text-white/40'}`}
                      >
                        ◆ {g.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-white/45 text-[10.5px] mt-1.5">{t('arena.armory.gemSlots', { max: MAX_EQUIPPED_GEMS })}</p>
          </section>

          <button
            type="button"
            onClick={() => setView('playing')}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-extrabold text-white text-base bg-gradient-to-r from-purple-600 to-teal-600 shadow-glow-gold"
          >
            {t('arena.armory.enter', { tier })} <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}
