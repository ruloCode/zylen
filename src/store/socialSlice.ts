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
  socialLoading: boolean;
  socialError: string | null;

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
  socialLoading: false,
  socialError: null,

  // Search users by username
  searchUsers: async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ socialLoading: true, socialError: null });
    try {
      const results = await SocialService.searchUsers(searchTerm);
      set({ searchResults: results, socialLoading: false });
    } catch (error: any) {
      console.error('Error searching users:', error);
      set({
        socialError: error.message || 'Failed to search users',
        socialLoading: false,
        searchResults: [],
      });
    }
  },

  // Send a friend request
  sendFriendRequest: async (friendUsername: string) => {
    set({ socialLoading: true, socialError: null });
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
        socialLoading: false,
      }));
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      set({
        socialError: error.message || 'Failed to send friend request',
        socialLoading: false,
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  // Accept a friend request
  acceptFriendRequest: async (friendshipId: string) => {
    set({ socialLoading: true, socialError: null });
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

      set({ socialLoading: false });
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      set({
        socialError: error.message || 'Failed to accept friend request',
        socialLoading: false,
      });
      throw error;
    }
  },

  // Reject a friend request
  rejectFriendRequest: async (friendshipId: string) => {
    set({ socialLoading: true, socialError: null });
    try {
      await SocialService.rejectFriendRequest(friendshipId);

      // Remove from pending requests
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(
          (req) => req.friendshipId !== friendshipId
        ),
        socialLoading: false,
      }));
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      set({
        socialError: error.message || 'Failed to reject friend request',
        socialLoading: false,
      });
      throw error;
    }
  },

  // Remove a friend
  removeFriend: async (friendshipId: string) => {
    set({ socialLoading: true, socialError: null });
    try {
      await SocialService.removeFriend(friendshipId);

      // Remove from friends list
      set((state) => ({
        friends: state.friends.filter(
          (friend) => friend.friendshipId !== friendshipId
        ),
        socialLoading: false,
      }));
    } catch (error: any) {
      console.error('Error removing friend:', error);
      set({
        socialError: error.message || 'Failed to remove friend',
        socialLoading: false,
      });
      throw error;
    }
  },

  // Load friends list
  loadFriends: async (userId?: string) => {
    set({ socialLoading: true, socialError: null });
    try {
      const friends = await SocialService.getFriendsList(userId);
      set({ friends, socialLoading: false });
    } catch (error: any) {
      console.error('Error loading friends:', error);
      set({
        socialError: error.message || 'Failed to load friends',
        socialLoading: false,
        friends: [],
      });
    }
  },

  // Load pending friend requests (received)
  loadPendingRequests: async () => {
    set({ socialLoading: true, socialError: null });
    try {
      const pendingRequests = await SocialService.getPendingFriendRequests();
      set({ pendingRequests, socialLoading: false });
    } catch (error: any) {
      console.error('Error loading pending requests:', error);
      set({
        socialError: error.message || 'Failed to load pending requests',
        socialLoading: false,
        pendingRequests: [],
      });
    }
  },

  // Load sent friend requests
  loadSentRequests: async () => {
    set({ socialLoading: true, socialError: null });
    try {
      const sentRequests = await SocialService.getSentFriendRequests();
      set({ sentRequests, socialLoading: false });
    } catch (error: any) {
      console.error('Error loading sent requests:', error);
      set({
        socialError: error.message || 'Failed to load sent requests',
        socialLoading: false,
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
    set({ socialError: null });
  },
});
