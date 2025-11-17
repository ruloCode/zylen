// Barrel export for all types
export * from './habit';
export * from './lifeArea';
export * from './streak';
export * from './shop';
export * from './user';
export * from './chat';
export * from './onboarding';
export * from './rootHabit';
export * from './achievement';

// App-wide utility types
export interface AppState {
  isInitialized: boolean;
  lastSyncedAt?: Date;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: LoadingState;
}
