/**
 * Social Slice
 * Manages friend relationships, user search, and friend requests
 */

import type { StateCreator } from 'zustand';
import type { FriendProfile, FriendRequest, UserSearchResult } from '@/types/social';
import * as SocialService from '@/services/supabase/social.service';

export interface SocialSlice {
  // State
  friends: FriendProfile[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  searchResults: UserSearchResult[];
  isLoading: boolean;
  error: string | null;

  // Actions
  searchUsers: (searchTerm: string) => Promise<void>;
  sendFriendRequest: (friendUsername: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  loadFriends: (userId?: string) => Promise<void>;
  loadPendingRequests: () => Promise<void>;
  loadSentRequests: () => Promise<void>;
  clearSearchResults: () => void;
  clearError: () => void;
}

export const createSocialSlice: StateCreator<SocialSlice> = (set, get) => ({
  // Initial state
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  searchResults: [],
  isLoading: false,
  error: null,

  // Search users by username
  searchUsers: async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const results = await SocialService.searchUsers(searchTerm);
      set({ searchResults: results, isLoading: false });
    } catch (error: any) {
      console.error('Error searching users:', error);
      set({
        error: error.message || 'Failed to search users',
        isLoading: false,
        searchResults: [],
      });
    }
  },

  // Send a friend request
  sendFriendRequest: async (friendUsername: string) => {
    set({ isLoading: true, error: null });
    try {
      await SocialService.sendFriendRequest(friendUsername);

      // Reload sent requests to show the new request
      await get().loadSentRequests();

      // Update search results to reflect new status
      set((state) => ({
        searchResults: state.searchResults.map((user) =>
          user.username === friendUsername
            ? { ...user, friendshipStatus: 'request_sent' as const }
            : user
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      set({
        error: error.message || 'Failed to send friend request',
        isLoading: false,
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  // Accept a friend request
  acceptFriendRequest: async (friendshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      await SocialService.acceptFriendRequest(friendshipId);

      // Move from pending to friends
      const acceptedRequest = get().pendingRequests.find(
        (req) => req.friendshipId === friendshipId
      );

      if (acceptedRequest) {
        // Reload friends list and pending requests
        await Promise.all([get().loadFriends(), get().loadPendingRequests()]);
      }

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      set({
        error: error.message || 'Failed to accept friend request',
        isLoading: false,
      });
      throw error;
    }
  },

  // Reject a friend request
  rejectFriendRequest: async (friendshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      await SocialService.rejectFriendRequest(friendshipId);

      // Remove from pending requests
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(
          (req) => req.friendshipId !== friendshipId
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      set({
        error: error.message || 'Failed to reject friend request',
        isLoading: false,
      });
      throw error;
    }
  },

  // Remove a friend
  removeFriend: async (friendshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      await SocialService.removeFriend(friendshipId);

      // Remove from friends list
      set((state) => ({
        friends: state.friends.filter(
          (friend) => friend.friendshipId !== friendshipId
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error removing friend:', error);
      set({
        error: error.message || 'Failed to remove friend',
        isLoading: false,
      });
      throw error;
    }
  },

  // Load friends list
  loadFriends: async (userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const friends = await SocialService.getFriendsList(userId);
      set({ friends, isLoading: false });
    } catch (error: any) {
      console.error('Error loading friends:', error);
      set({
        error: error.message || 'Failed to load friends',
        isLoading: false,
        friends: [],
      });
    }
  },

  // Load pending friend requests (received)
  loadPendingRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const pendingRequests = await SocialService.getPendingFriendRequests();
      set({ pendingRequests, isLoading: false });
    } catch (error: any) {
      console.error('Error loading pending requests:', error);
      set({
        error: error.message || 'Failed to load pending requests',
        isLoading: false,
        pendingRequests: [],
      });
    }
  },

  // Load sent friend requests
  loadSentRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const sentRequests = await SocialService.getSentFriendRequests();
      set({ sentRequests, isLoading: false });
    } catch (error: any) {
      console.error('Error loading sent requests:', error);
      set({
        error: error.message || 'Failed to load sent requests',
        isLoading: false,
        sentRequests: [],
      });
    }
  },

  // Clear search results
  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
});
