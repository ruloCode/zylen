/**
 * OnboardingCarousel — React Native port.
 *
 * Pre-auth marketing flow shown to unauthenticated users reaching /onboarding
 * from the Welcome splash. Five slides: 4 feature intro slides + a final auth
 * slide (Google + email/password — signs up new users and signs in returning
 * ones). After successful auth the AuthGate's normal redirect leads the user
 * into the existing multi-step onboarding/profile setup.
 *
 * Native: horizontal FlatList with pagingEnabled (swipeable) + progress dots;
 * per-slide background art rendered inside each page.
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import toast from '@/lib/toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { ROUTES } from '@/constants';
import { img } from '@/assets/registry';
import { cn } from '@/utils';

const PORTAL_BG = '/login-bg.png';

/**
 * Per-slide background art (index = step). Slides without a dedicated image
 * fall back to PORTAL_BG.
 */
const SLIDE_BG: (string | undefined)[] = [
  '/onboarding-1.png',
  '/onboarding-2.png',
  '/onboarding-3.png',
  '/onboarding-4.png',
];

interface CarouselSlide {
  title: string;
  accent: string;
  desc: string;
}

/** Dots indicator (5 steps). */
function Dots({ active }: { active: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          className={
            i === active
              ? 'h-2 w-5 rounded-full bg-[#4aa8ff]'
              : 'h-2 w-2 rounded-full bg-white/25'
          }
        />
      ))}
    </View>
  );
}

/** Google "G" logo (inline SVG, same paths as the web). */
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

export function OnboardingCarousel() {
  const { signInWithOAuth, signUpWithPassword, signInWithPassword } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const slides = t('onboardingCarousel.slides', {
    returnObjects: true,
  }) as unknown as CarouselSlide[];
  const totalSlides = slides.length + 1; // + auth slide
  const authIndex = slides.length;

  const listRef = useRef<FlatList<number>>(null);
  const passwordRef = useRef<TextInput>(null);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const busy = submitting || oauthLoading;

  const pages = Array.from({ length: totalSlides }, (_, i) => i);

  const scrollTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, totalSlides - 1));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    setStep(clamped);
  };

  const goToAuth = () => scrollTo(authIndex);
  const next = () => scrollTo(step + 1);

  // Updates on every scroll frame (not just momentum end) so the FIXED
  // footer's dots track the drag and it hides promptly entering the auth slide.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== step) setStep(index);
  };

  const handleGoogle = async () => {
    if (oauthLoading) return;
    setOauthLoading(true);
    try {
      const res = await signInWithOAuth('google');
      // Cancelling the browser resolves success=false with no error — stay quiet.
      if (!res.success && res.error) {
        toast.error(res.error);
      }
    } finally {
      setOauthLoading(false);
    }
  };

  const handleEmailContinue = async () => {
    if (busy) return; // keyboard "go" bypasses the button's disabled state
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error(t('auth.enterEmail'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    setSubmitting(true);
    try {
      // Try to create the account; if the email already exists, sign in instead,
      // so the same form works for new and returning users. (The native
      // AuthContext surfaces the raw Supabase message instead of the web's
      // errorCode, so detect the "already registered" case from it.)
      let res = await signUpWithPassword(value, password);
      let returning = false;
      if (!res.success && /already (registered|exists)|user_already_exists/i.test(res.error ?? '')) {
        returning = true;
        res = await signInWithPassword(value, password);
      }
      if (res.success) toast.success(returning ? t('auth.welcomeBack') : t('auth.accountCreated'));
      else toast.error(res.error ?? t('errors.authenticationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSlide = (index: number) => {
    const isAuthSlide = index === authIndex;
    const bg = SLIDE_BG[index] ?? PORTAL_BG;
    const slide: CarouselSlide | undefined = slides[index];

    return (
      <View style={{ width }} className="flex-1 bg-[#0a1622]">
        {/* ── Portal background ── */}
        <View className="absolute inset-0">
          <Image
            source={img(bg)}
            contentFit="cover"
            contentPosition="top"
            style={{ width: '100%', height: '100%' }}
          />
          <LinearGradient
            colors={
              isAuthSlide
                ? ['rgba(10,22,34,0.35)', 'rgba(10,22,34,0.10)', '#0a1622']
                : ['rgba(10,22,34,0.65)', 'rgba(10,22,34,0.35)', '#0a1622']
            }
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,22,34,0.7)', '#0a1622']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
          />
        </View>

        {/* ── Content ── */}
        <View
          className="mx-auto w-full max-w-md flex-1 px-6 pb-8"
          style={{ paddingTop: insets.top + 56 }}
        >
          {isAuthSlide ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className="flex-1"
            >
              {/* Logo + tagline are baked into the background image — reserve their zone */}
              <View className="flex-1" style={{ minHeight: height * 0.36 }} />

              {/* Google */}
              <Pressable
                onPress={() => void handleGoogle()}
                disabled={busy}
                accessibilityRole="button"
                className={cn(
                  'w-full flex-row items-center justify-center gap-3 rounded-2xl bg-white py-3.5 active:bg-white/95',
                  busy && 'opacity-60'
                )}
              >
                {oauthLoading ? <ActivityIndicator size="small" color="#1a1a1a" /> : <GoogleLogo />}
                <Text className="text-[15px] font-semibold text-[#1a1a1a]">
                  {t('auth.continueWithGoogle')}
                </Text>
              </Pressable>

              {/* Divider */}
              <View className="my-5 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-white/10" />
                <Text className="text-xs text-white/45">{t('auth.orContinueWith')}</Text>
                <View className="h-px flex-1 bg-white/10" />
              </View>

              {/* Email + Continue */}
              <View className="gap-3">
                <View className="justify-center">
                  <View className="absolute left-4 z-10">
                    <Mail size={18} color="#2dd4bf" />
                  </View>
                  <TextInput
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white"
                  />
                </View>
                <View className="justify-center">
                  <View className="absolute left-4 z-10">
                    <Lock size={18} color="#2dd4bf" />
                  </View>
                  <TextInput
                    ref={passwordRef}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={() => void handleEmailContinue()}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-white"
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? t('auth.hidePassword') : t('auth.showPassword')
                    }
                    hitSlop={8}
                    className="absolute right-0 z-10 h-full w-12 items-center justify-center active:opacity-70"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="rgba(255,255,255,0.5)" />
                    ) : (
                      <Eye size={18} color="rgba(255,255,255,0.5)" />
                    )}
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => void handleEmailContinue()}
                  disabled={busy}
                  accessibilityRole="button"
                  className={cn(
                    'w-full overflow-hidden rounded-2xl active:opacity-90',
                    busy && 'opacity-60'
                  )}
                >
                  <LinearGradient
                    colors={['#2dd4bf', '#3b82f6']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    className="w-full flex-row items-center justify-center gap-2 py-3.5"
                  >
                    {submitting && <ActivityIndicator size="small" color="#FFFFFF" />}
                    <Text className="text-[15px] font-semibold text-white">
                      {t('auth.createAccount')}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Sign in */}
              <View className="mt-4 flex-row items-center justify-center">
                <Text className="text-sm text-white/65">{t('welcome.haveAccount')} </Text>
                <Pressable
                  onPress={() => router.push(ROUTES.LOGIN)}
                  accessibilityRole="button"
                  hitSlop={8}
                  className="px-1 py-2 active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-[#4aa8ff]">
                    {t('welcome.signIn')}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <>
              <View className="flex-1 min-h-[40px]" />

              <View className="items-center">
                {/* Readability scrim: soft dark panel behind the copy so text
                    stays legible over bright areas of the artwork. */}
                <View className="items-center rounded-[40px] bg-[rgba(5,9,13,0.55)] px-6 py-8">
                  <Text className="text-center text-[26px] font-extrabold leading-tight">
                    <Text className="text-white">{slide?.title} </Text>
                    <Text className="text-[#7cc4ff]">{slide?.accent}</Text>
                  </Text>
                  <Text className="mt-4 px-2 text-center text-[15px] leading-relaxed text-white/90">
                    {slide?.desc}
                  </Text>
                </View>
              </View>

              <View className="flex-1 min-h-[40px]" />

              {/* Reserve the zone occupied by the FIXED footer (dots + CTA) */}
              <View style={{ height: 116 }} />
            </>
          )}
        </View>
      </View>
    );
  };

  const isAuthSlide = step === authIndex;

  return (
    <View className="flex-1 bg-[#0a1622]">
      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(item) => String(item)}
        renderItem={({ item }) => renderSlide(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        bounces={false}
      />

      {/* FIXED footer: dots + CTA stay put while the slides swipe underneath.
          Hidden on the auth slide (it brings its own form/CTA). */}
      {!isAuthSlide && (
        <View
          className="absolute inset-x-0 z-10 items-center px-6"
          style={{ bottom: insets.bottom + 24 }}
          pointerEvents="box-none"
        >
          <View className="w-full max-w-md">
            <View className="mb-5">
              <Dots active={Math.min(step, authIndex - 1)} />
            </View>
            <Pressable
              onPress={next}
              accessibilityRole="button"
              className="w-full overflow-hidden rounded-2xl active:opacity-90"
            >
              <LinearGradient
                colors={['#2dd4bf', '#3b82f6']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                className="w-full flex-row items-center justify-center gap-2 py-3.5"
              >
                <Text className="text-[15px] font-semibold text-white">
                  {t('onboardingCarousel.next')}
                </Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      )}

      {/* Skip (hidden on auth slide) */}
      {!isAuthSlide && (
        <View
          className="absolute right-5 z-20"
          style={{ top: insets.top + 20 }}
        >
          <Pressable onPress={goToAuth} accessibilityRole="button" hitSlop={8}>
            <Text className="text-sm font-semibold text-white/70">
              {t('onboardingCarousel.skip')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default OnboardingCarousel;
