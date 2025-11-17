/**
 * Social Service
 * Handles friend relationships, user search, and social features
 */

import { supabase } from '@/lib/supabase';
import type {
  FriendProfile,
  FriendRequest,
  UserSearchResult,
} from '@/types/social';
import type { PublicUserProfile } from '@/types/user';

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_username_available', {
      p_username: username,
    });

    if (error) throw error;
    return data as boolean;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw new Error('Failed to check username availability');
  }
}

/**
 * Generate username suggestions based on a name
 */
export async function generateUsernameSuggestions(
  name: string,
  count: number = 5
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc(
      'generate_username_suggestions',
      {
        p_name: name,
        p_count: count,
      }
    );

    if (error) throw error;
    return data as string[];
  } catch (error) {
    console.error('Error generating username suggestions:', error);
    return [];
  }
}

/**
 * Update user's username
 */
export async function updateUsername(
  userId: string,
  username: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating username:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('Username is already taken');
    }
    throw new Error('Failed to update username');
  }
}

/**
 * Search users by username
 */
export async function searchUsers(
  searchTerm: string,
  limit: number = 20
): Promise<UserSearchResult[]> {
  try {
    const { data, error } = await supabase.rpc('search_users_by_username', {
      p_search_term: searchTerm,
      p_limit: limit,
    });

    if (error) throw error;

    return (data || []).map((user: any) => ({
      id: user.id,
      username: user.username,
      level: user.level,
      avatarUrl: user.avatar_url,
      currentStreak: user.current_streak,
      totalXPEarned: user.total_xp_earned,
      friendshipStatus: user.friendship_status,
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(friendUsername: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('send_friend_request', {
      p_friend_username: friendUsername,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error sending friend request:', error);
    if (error.message?.includes('User not found')) {
      throw new Error('User not found');
    } else if (error.message?.includes('already exists')) {
      throw new Error('Friendship already exists');
    } else if (error.message?.includes('Cannot add yourself')) {
      throw new Error('Cannot add yourself as a friend');
    }
    throw new Error('Failed to send friend request');
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('accept_friend_request', {
      p_friendship_id: friendshipId,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error accepting friend request:', error);
    throw new Error('Failed to accept friend request');
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('reject_friend_request', {
      p_friendship_id: friendshipId,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error rejecting friend request:', error);
    throw new Error('Failed to reject friend request');
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(friendshipId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('remove_friend', {
      p_friendship_id: friendshipId,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error removing friend:', error);
    throw new Error('Failed to remove friend');
  }
}

/**
 * Get list of friends
 */
export async function getFriendsList(userId?: string): Promise<FriendProfile[]> {
  try {
    const { data, error } = await supabase.rpc('get_friend_list', {
      p_user_id: userId || null,
    });

    if (error) throw error;

    return (data || []).map((friend: any) => ({
      friendshipId: friend.friendship_id,
      userId: friend.user_id,
      username: friend.username,
      level: friend.level,
      avatarUrl: friend.avatar_url,
      currentStreak: friend.current_streak,
      longestStreak: friend.longest_streak,
      totalXPEarned: friend.total_xp_earned,
      points: friend.points,
      friendshipStatus: friend.friendship_status,
      friendshipCreatedAt: new Date(friend.friendship_created_at),
    }));
  } catch (error) {
    console.error('Error fetching friends list:', error);
    throw new Error('Failed to fetch friends list');
  }
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingFriendRequests(): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase.rpc('get_pending_friend_requests');

    if (error) throw error;

    return (data || []).map((request: any) => ({
      friendshipId: request.friendship_id,
      userId: request.user_id,
      username: request.username,
      level: request.level,
      avatarUrl: request.avatar_url,
      currentStreak: request.current_streak,
      totalXPEarned: request.total_xp_earned,
      createdAt: new Date(request.created_at),
    }));
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw new Error('Failed to fetch pending friend requests');
  }
}

/**
 * Get sent friend requests
 */
export async function getSentFriendRequests(): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase.rpc('get_sent_friend_requests');

    if (error) throw error;

    return (data || []).map((request: any) => ({
      friendshipId: request.friendship_id,
      userId: request.user_id,
      username: request.username,
      level: request.level,
      avatarUrl: request.avatar_url,
      currentStreak: request.current_streak,
      totalXPEarned: request.total_xp_earned,
      createdAt: new Date(request.created_at),
    }));
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    throw new Error('Failed to fetch sent friend requests');
  }
}

/**
 * Get public profile by username
 */
export async function getPublicProfile(
  username: string
): Promise<PublicUserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('v_user_public_profile')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      username: data.username,
      level: data.level,
      avatarUrl: data.avatar_url,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      totalXPEarned: data.total_xp_earned,
      points: data.points,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('Error fetching public profile:', error);
    throw new Error('Failed to fetch public profile');
  }
}

/**
 * Get mutual friends count
 */
export async function getMutualFriendsCount(
  userId: string,
  friendId: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_mutual_friends_count', {
      p_user_id: userId,
      p_friend_id: friendId,
    });

    if (error) throw error;
    return data as number;
  } catch (error) {
    console.error('Error getting mutual friends count:', error);
    return 0;
  }
}
