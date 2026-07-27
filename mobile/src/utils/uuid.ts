import * as Crypto from 'expo-crypto';

/**
 * Hermes-safe UUID v4. `crypto.randomUUID()` does not exist in the React
 * Native runtime (it only passes typecheck because tsconfig includes lib DOM).
 */
export function uuid(): string {
  return Crypto.randomUUID();
}
