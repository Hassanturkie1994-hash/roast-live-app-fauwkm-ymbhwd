
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  total_streaming_hours: number;
  premium_active: boolean;
  role: string;
}

export default function AdminUsersListScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ type: 'active' | 'total' | 'vip' }>();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());

  const fetchActiveUsers = useCallback(async () => {
    try {
      // Get users who have been active in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: activeViewers } = await supabase
        .from('stream_viewers')
        .select('user_id')
        .is('left_at', null)
        .gte('joined_at', fiveMinutesAgo);

      const { data: activeStreamers } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('status', 'live');

      const activeIds = new Set<string>();
      
      if (activeViewers) {
        activeViewers.forEach(v => activeIds.add(v.user_id));
      }
      
      if (activeStreamers) {
        activeStreamers.forEach(s => activeIds.add(s.broadcaster_id));
      }

      setActiveUserIds(activeIds);
      return activeIds;
    } catch (error) {
      console.error('Error fetching active users:', error);
      return new Set<string>();
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, created_at, followers_count, following_count, total_streaming_hours, premium_active, role')
        .order('created_at', { ascending: false });

      if (params.type === 'vip') {
        query = query.eq('premium_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const activeIds = await fetchActiveUsers();

      let usersList = data || [];

      if (params.type === 'active') {
        usersList = usersList.filter(u => activeIds.has(u.id));
      }

      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.type, fetchActiveUsers]);

  useEffect(() => {
    fetchUsers();

    // Refresh active users every 30 seconds
    const interval = setInterval(() => {
      if (params.type === 'active') {
        fetchActiveUsers();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUsers, params.type, fetchActiveUsers]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserPress = (userId: string) => {
    router.push({
      pathname: '/screens/PublicProfileScreen',
      params: { userId },
    });
  };

  const getTitle = () => {
    switch (params.type) {
      case 'active':
        return 'Active Users';
      case 'vip':
        return 'VIP Subscribers';
      default:
        return 'All Users';
    }
  };

  const renderUser = ({ item }: { item: UserProfile }) => {
    const isActive = activeUserIds.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleUserPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userLeft}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          )}
          
          {params.type === 'active' && isActive && (
            <View style={styles.activeIndicator} />
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
              {item.display_name || item.username}
            </Text>
            {item.premium_active && (
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={16}
                color="#FFD700"
              />
            )}
            {item.role && item.role !== 'USER' && (
              <View style={[styles.roleBadge, { backgroundColor: colors.gradientEnd }]}>
                <Text style={styles.roleBadgeText}>{item.role}</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
            @{item.username}
          </Text>

          <View style={styles.userStats}>
            <View style={styles.userStat}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.userStatText, { color: colors.textSecondary }]}>
                {item.followers_count || 0} followers
              </Text>
            </View>
            
            {item.total_streaming_hours > 0 && (
              <View style={styles.userStat}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={[styles.userStatText, { color: colors.textSecondary }]}>
                  {item.total_streaming_hours.toFixed(1)}h streamed
                </Text>
              </View>
            )}
          </View>
        </View>

        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron_right"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getTitle()}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border }]}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="cancel"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Header */}
      <View style={[styles.statsHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.statsText, { color: colors.text }]}>
          Showing {filteredUsers.length} {params.type === 'active' ? 'active' : params.type === 'vip' ? 'VIP' : 'total'} users
        </Text>
        {params.type === 'active' && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, { color: colors.textSecondary }]}>Live now</Text>
          </View>
        )}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandPrimary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="person.slash"
              android_material_icon_name="person_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  userLeft: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00FF00',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 14,
    fontWeight: '400',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStatText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
