/**
 * Custom Error Classes for Supabase Services
 *
 * This file defines custom error types for better error handling
 * across all Supabase service operations.
 */

/**
 * Base service error class
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public service: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends ServiceError {
  constructor(message: string = 'User not authenticated') {
    super(message, 'AUTH_ERROR', 'Auth');
    this.name = 'AuthError';
  }
}

/**
 * User Service Errors
 */
export class UserServiceError extends ServiceError {
  constructor(message: string, code: string = 'USER_ERROR') {
    super(message, code, 'UserService');
    this.name = 'UserServiceError';
  }
}

export const USER_ERROR_CODES = {
  NOT_AUTHENTICATED: 'USER_NOT_AUTHENTICATED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  UPDATE_FAILED: 'USER_UPDATE_FAILED',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
} as const;

/**
 * Habits Service Errors
 */
export class HabitsServiceError extends ServiceError {
  constructor(message: string, code: string = 'HABIT_ERROR') {
    super(message, code, 'HabitsService');
    this.name = 'HabitsServiceError';
  }
}

export const HABIT_ERROR_CODES = {
  NOT_FOUND: 'HABIT_NOT_FOUND',
  ALREADY_COMPLETED: 'HABIT_ALREADY_COMPLETED',
  COMPLETION_NOT_FOUND: 'COMPLETION_NOT_FOUND',
  INVALID_LIFE_AREA: 'INVALID_LIFE_AREA',
  CREATE_FAILED: 'HABIT_CREATE_FAILED',
  UPDATE_FAILED: 'HABIT_UPDATE_FAILED',
  DELETE_FAILED: 'HABIT_DELETE_FAILED',
} as const;

/**
 * Life Areas Service Errors
 */
export class LifeAreasServiceError extends ServiceError {
  constructor(message: string, code: string = 'LIFE_AREA_ERROR') {
    super(message, code, 'LifeAreasService');
    this.name = 'LifeAreasServiceError';
  }
}

export const LIFE_AREA_ERROR_CODES = {
  NOT_FOUND: 'LIFE_AREA_NOT_FOUND',
  UPDATE_FAILED: 'LIFE_AREA_UPDATE_FAILED',
  CREATE_FAILED: 'LIFE_AREA_CREATE_FAILED',
  DELETE_FAILED: 'LIFE_AREA_DELETE_FAILED',
} as const;

/**
 * Streaks Service Errors
 */
export class StreaksServiceError extends ServiceError {
  constructor(message: string, code: string = 'STREAK_ERROR') {
    super(message, code, 'StreaksService');
    this.name = 'StreaksServiceError';
  }
}

export const STREAK_ERROR_CODES = {
  NOT_FOUND: 'STREAK_NOT_FOUND',
  UPDATE_FAILED: 'STREAK_UPDATE_FAILED',
} as const;

/**
 * Shop Service Errors
 */
export class ShopServiceError extends ServiceError {
  constructor(message: string, code: string = 'SHOP_ERROR') {
    super(message, code, 'ShopService');
    this.name = 'ShopServiceError';
  }
}

export const SHOP_ERROR_CODES = {
  ITEM_NOT_FOUND: 'SHOP_ITEM_NOT_FOUND',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  ITEM_UNAVAILABLE: 'ITEM_UNAVAILABLE',
  PURCHASE_FAILED: 'PURCHASE_FAILED',
} as const;

/**
 * Shop Items Service Errors
 */
export class ShopItemsServiceError extends ServiceError {
  constructor(message: string, code: string = 'SHOP_ITEMS_ERROR') {
    super(message, code, 'ShopItemsService');
    this.name = 'ShopItemsServiceError';
  }
}

export const SHOP_ITEMS_ERROR_CODES = {
  NOT_FOUND: 'SHOP_ITEM_NOT_FOUND',
  CREATE_FAILED: 'SHOP_ITEM_CREATE_FAILED',
  UPDATE_FAILED: 'SHOP_ITEM_UPDATE_FAILED',
  DELETE_FAILED: 'SHOP_ITEM_DELETE_FAILED',
} as const;

/**
 * Stats Service Errors
 */
export class StatsServiceError extends ServiceError {
  constructor(message: string, code: string = 'STATS_ERROR') {
    super(message, code, 'StatsService');
    this.name = 'StatsServiceError';
  }
}

export const STATS_ERROR_CODES = {
  FETCH_FAILED: 'STATS_FETCH_FAILED',
} as const;
