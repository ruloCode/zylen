/**
 * Login Page — React Native port.
 *
 * Immersive portal-themed entry point for unauthenticated users.
 * Google OAuth (native auth session) + email/password.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import toast from '@/lib/toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';
import { ROUTES } from '@/constants';
import { img } from '@/assets/registry';
import { cn } from '@/utils';

const LOGIN_BG = '/login-bg.png';

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

export function Login() {
  const { user, loading, signInWithOAuth, signInWithPassword, signUpWithPassword } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const busy = submitting || oauthLoading;

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, loading, router]);

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

  const handleEmailSubmit = async () => {
    if (busy) return; // keyboard "go" bypasses the button's disabled state
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError(t('auth.enterEmail'));
      emailRef.current?.focus();
      return;
    }
    if (password.length < 6) {
      setPasswordError(t('auth.passwordTooShort'));
      passwordRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res =
        mode === 'signup'
          ? await signUpWithPassword(value, password)
          : await signInWithPassword(value, password);
      if (res.success) {
        toast.success(mode === 'signup' ? t('auth.accountCreated') : t('auth.welcomeBack'));
        // Navigation happens via the auth state effect once the session is set.
      } else {
        toast.error(res.error ?? t('errors.authenticationFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a1622]">
        <View className="items-center">
          <ActivityIndicator size="large" color="#4aa8ff" />
          <Text className="mt-4 font-medium text-white">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a1622]">
      {/* ── Portal background ── */}
      <View className="absolute inset-0">
        <Image
          source={img(LOGIN_BG)}
          contentFit="cover"
          contentPosition="top"
          style={{ width: '100%', height: '100%' }}
        />
        <LinearGradient
          colors={['rgba(10,22,34,0.35)', 'rgba(10,22,34,0.10)', '#0a1622']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={['transparent', '#0a1622']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' }}
        />
      </View>

      {/* Language switcher */}
      <View className="absolute right-5 z-20 opacity-80" style={{ top: insets.top + 20 }}>
        <LanguageSwitcher variant="compact" />
      </View>

      {/* ── Content ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="mx-auto w-full max-w-md flex-1 px-6"
            style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }}
          >
            {/* Logo + tagline are baked into the background image — reserve their zone */}
            <View style={{ minHeight: height * 0.34 }} />

            {/* Spacer reveals the portal */}
            <View className="flex-1 min-h-[120px]" />

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

            {/* Email + Password */}
            <View className="gap-3">
              <View>
                <View className="justify-center">
                  <View className="absolute left-4 z-10">
                    <Mail size={18} color="#2dd4bf" />
                  </View>
                  <TextInput
                    ref={emailRef}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className={cn(
                      'w-full rounded-2xl border bg-white/[0.04] py-3.5 pl-11 pr-4 text-white',
                      emailError ? 'border-danger-500/70' : 'border-white/10'
                    )}
                  />
                </View>
                {emailError && (
                  <Text accessibilityRole="alert" className="mt-1.5 pl-1 text-xs text-danger-500">
                    {emailError}
                  </Text>
                )}
              </View>
              <View>
                <View className="justify-center">
                  <View className="absolute left-4 z-10">
                    <Lock size={18} color="#2dd4bf" />
                  </View>
                  <TextInput
                    ref={passwordRef}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                    returnKeyType="go"
                    onSubmitEditing={() => void handleEmailSubmit()}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className={cn(
                      'w-full rounded-2xl border bg-white/[0.04] py-3.5 pl-11 pr-12 text-white',
                      passwordError ? 'border-danger-500/70' : 'border-white/10'
                    )}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
                {passwordError && (
                  <Text accessibilityRole="alert" className="mt-1.5 pl-1 text-xs text-danger-500">
                    {passwordError}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => void handleEmailSubmit()}
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
                    {mode === 'signup' ? t('auth.createAccount') : t('auth.signIn')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Toggle sign in / sign up */}
            <View className="mt-4 flex-row items-center justify-center">
              <Text className="text-sm text-white/65">
                {mode === 'signup' ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
              </Text>
              <Pressable
                onPress={() => {
                  setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
                  emailRef.current?.focus();
                }}
                accessibilityRole="button"
                hitSlop={8}
                className="px-1 py-2 active:opacity-70"
              >
                <Text className="text-sm font-semibold text-[#4aa8ff]">
                  {mode === 'signup' ? t('auth.signIn') : t('auth.register')}
                </Text>
              </Pressable>
            </View>

            {/* Terms */}
            <Text className="mt-5 text-center text-[11px] leading-relaxed text-white/40">
              {t('auth.termsPrefix')}{' '}
              <Text className="text-[#4aa8ff]/80">{t('auth.termsOfService')}</Text>{' '}
              {t('auth.and')}{' '}
              <Text className="text-[#4aa8ff]/80">{t('auth.privacyPolicy')}</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default Login;
