/**
 * NativeWind cssInterop registrations for third-party components.
 *
 * NativeWind only compiles `className` on core RN components; anything else
 * silently drops the prop unless it's registered here. Without this,
 * `<LinearGradient className="flex-row py-3.5">` renders an unstyled column
 * with no padding (the broken auth CTAs). Import this module once, before
 * any screen renders (app/_layout.tsx).
 */
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

cssInterop(LinearGradient, { className: 'style' });
