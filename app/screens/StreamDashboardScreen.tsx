
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { moderationService, Moderator, BannedUser } from '@/app/services/moderationService';
import { supabase } from '@/app/integrations/supabase/client';
import BadgeEditorModal from '@/components/BadgeEditorModal';

const BADGE_COLORS = [
  '#FF1493', // Deep Pink
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#9370DB', // Medium Purple
  '#00CED1', // Dark Turquoise
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#FF6347', // Tomato
];

interface VIPMember {
  id: string;
  subscriber_id: string;
  started_at: string;
  renewed_at: string;
  status: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function StreamDashboardScreen() {
  const { user } = useAuth();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [vipMembers, setVipMembers] = useState<VIPMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // VIP Club state
  const [clubName, setClubName] = useState('VIP');
  const [badgeColor, setBadgeColor] = useState(BADGE_COLORS[0]);
  const [showBadgeEditor, setShowBadgeEditor] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [mods, banned] = await Promise.all([
        moderationService.getModerators(user.id),
        moderationService.getBannedUsers(user.id),
      ]);
      setModerators(mods);
      setBannedUsers(banned);

      // Fetch VIP club data
      await fetchVIPClubData();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const fetchVIPClubData = async () => {
    if (!user) return;

    try {
      // Fetch fan club settings
      const { data: fanClubData } = await supabase
        .from('fan_clubs')
        .select('club_name, badge_color')
        .eq('streamer_id', user.id)
        .single();

      if (fanClubData) {
        setClubName(fanClubData.club_name);
        setBadgeColor(fanClubData.badge_color);
      }

      // Fetch VIP members from club_subscriptions
      const { data: membersData } = await supabase
        .from('club_subscriptions')
        .select(`
          *,
          profiles:subscriber_id(username, display_name, avatar_url)
        `)
        .eq('creator_id', user.id)
        .order('started_at', { ascending: false });

      if (membersData) {
        setVipMembers(membersData);
        
        // Calculate revenue
        const activeMembers = membersData.filter((m: VIPMember) => m.status === 'active').length;
        const monthlyEarnings = activeMembers * 2.10; // $2.10 per member (70% of $3)
        setMonthlyRevenue(monthlyEarnings);
        
        // Calculate total revenue (simplified - would need transaction history for accuracy)
        const totalEarnings = membersData.reduce((sum: number, m: VIPMember) => {
          if (m.status === 'active') {
            return sum + 2.10;
          }
          return sum;
        }, 0);
        setTotalRevenue(totalEarnings);
      }
    } catch (error) {
      console.error('Error fetching VIP club data:', error);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await moderationService.searchUsersByUsername(searchUsername);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddModerator = async (userId: string, username: string) => {
    if (!user) return;

    // Check if already a moderator
    if (moderators.some((mod) => mod.user_id === userId)) {
      Alert.alert('Redan moderator', `${username} är redan en moderator.`);
      return;
    }

    // Check limit
    if (moderators.length >= 30) {
      Alert.alert('Gräns nådd', 'Du kan ha maximalt 30 moderatorer.');
      return;
    }

    const result = await moderationService.addModerator(user.id, userId);
    if (result.success) {
      Alert.alert('Framgång', `${username} har lagts till som moderator.`);
      setSearchUsername('');
      setSearchResults([]);
      fetchData();
    } else {
      Alert.alert('Fel', result.error || 'Misslyckades med att lägga till moderator.');
    }
  };

  const handleRemoveModerator = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Ta bort moderator',
      `Är du säker på att du vill ta bort ${username} som moderator?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            const result = await moderationService.removeModerator(user.id, userId);
            if (result.success) {
              Alert.alert('Framgång', `${username} har tagits bort som moderator.`);
              fetchData();
            } else {
              Alert.alert('Fel', result.error || 'Misslyckades med att ta bort moderator.');
            }
          },
        },
      ]
    );
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Avbanna användare',
      `Är du säker på att du vill avbanna ${username}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Avbanna',
          onPress: async () => {
            const result = await moderationService.unbanUser(user.id, userId);
            if (result.success) {
              Alert.alert('Framgång', `${username} har avbannats.`);
              fetchData();
            } else {
              Alert.alert('Fel', result.error || 'Misslyckades med att avbanna användare.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveVIPMember = async (memberId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Ta bort VIP-medlem',
      `Är du säker på att du vill ta bort ${username} från din VIP-klubb?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('club_subscriptions')
              .update({ status: 'canceled' })
              .eq('id', memberId);

            if (error) {
              Alert.alert('Fel', 'Misslyckades med att ta bort medlem');
            } else {
              Alert.alert('Framgång', `${username} har tagits bort från din VIP-klubb`);
              fetchData();
            }
          },
        },
      ]
    );
  };

  const handleSendAnnouncement = async () => {
    if (!user) return;

    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      Alert.alert('Fel', 'Vänligen ange både titel och meddelande');
      return;
    }

    setIsSendingAnnouncement(true);

    try {
      // Get all active VIP members
      const activeMembers = vipMembers.filter(m => m.status === 'active');

      // Create notifications for each member
      const notifications = activeMembers.map(member => ({
        type: 'admin_announcement',
        sender_id: user.id,
        receiver_id: member.subscriber_id,
        message: `${announcementTitle}: ${announcementMessage}`,
        category: 'admin',
        read: false,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      Alert.alert('Framgång', `Meddelande skickat till ${activeMembers.length} VIP-medlemmar`);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
    } catch (error) {
      console.error('Error sending announcement:', error);
      Alert.alert('Fel', 'Misslyckades med att skicka meddelande');
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const handleRequestPayout = () => {
    router.push('/screens/WithdrawScreen');
  };

  if (isLoading) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stream Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Laddar dashboard...</Text>
        </View>
      </View>
    );
  }

  const activeVIPMembers = vipMembers.filter(m => m.status === 'active');

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stream Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gradientEnd}
            colors={[colors.gradientEnd]}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snabbåtgärder</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/screens/PerformanceGrowthScreen' as any)}
            >
              <IconSymbol
                ios_icon_name="chart.bar.xaxis"
                android_material_icon_name="bar_chart"
                size={32}
                color={colors.gradientEnd}
              />
              <Text style={styles.quickActionText}>Analys</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/screens/FanClubManagementScreen' as any)}
            >
              <IconSymbol
                ios_icon_name="heart.circle.fill"
                android_material_icon_name="favorite"
                size={32}
                color={colors.gradientEnd}
              />
              <Text style={styles.quickActionText}>Fan Club</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/screens/BlockedUsersScreen' as any)}
            >
              <IconSymbol
                ios_icon_name="hand.raised.circle.fill"
                android_material_icon_name="block"
                size={32}
                color={colors.gradientEnd}
              />
              <Text style={styles.quickActionText}>Blockerade</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VIP Club Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="star"
                size={20}
                color="#FFD700"
              />
              <Text style={styles.sectionTitle}>VIP-klubb översikt</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowBadgeEditor(true)}
            >
              <IconSymbol
                ios_icon_name="pencil"
                android_material_icon_name="edit"
                size={14}
                color={colors.text}
              />
              <Text style={styles.editButtonText}>Redigera märke</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.clubOverviewCard}>
            <View style={styles.clubInfoRow}>
              <View style={styles.clubInfoItem}>
                <Text style={styles.clubInfoLabel}>Klubbnamn</Text>
                <View style={[styles.badgePreview, { backgroundColor: badgeColor }]}>
                  <IconSymbol
                    ios_icon_name="heart.fill"
                    android_material_icon_name="favorite"
                    size={14}
                    color={colors.text}
                  />
                  <Text style={styles.badgePreviewText}>{clubName}</Text>
                </View>
              </View>
              <View style={styles.clubInfoItem}>
                <Text style={styles.clubInfoLabel}>Månadspris</Text>
                <Text style={styles.clubInfoValue}>$3.00</Text>
              </View>
            </View>

            <View style={styles.clubInfoRow}>
              <View style={styles.clubInfoItem}>
                <Text style={styles.clubInfoLabel}>Totalt medlemmar</Text>
                <Text style={styles.clubInfoValue}>{activeVIPMembers.length}</Text>
              </View>
              <View style={styles.clubInfoItem}>
                <Text style={styles.clubInfoLabel}>Din andel (70%)</Text>
                <Text style={styles.clubInfoValue}>${monthlyRevenue.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* VIP Members List */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="group"
              size={20}
              color={colors.text}
            />
            <Text style={styles.sectionTitle}>VIP-medlemmar ({activeVIPMembers.length})</Text>
          </View>

          {activeVIPMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="person.2.slash"
                android_material_icon_name="people_outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>Inga VIP-medlemmar ännu</Text>
              <Text style={styles.emptySubtext}>
                Medlemmar kommer att visas här när de prenumererar
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {activeVIPMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  {member.profiles?.avatar_url ? (
                    <Image source={{ uri: member.profiles.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <View style={styles.memberHeader}>
                      <Text style={styles.memberName}>
                        {member.profiles?.display_name}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.badgeText}>{clubName}</Text>
                      </View>
                    </View>
                    <Text style={styles.memberUsername}>
                      @{member.profiles?.username}
                    </Text>
                    <Text style={styles.memberDate}>
                      Gick med: {new Date(member.started_at).toLocaleDateString('sv-SE')}
                    </Text>
                    <Text style={styles.memberDate}>
                      Förnyas: {new Date(member.renewed_at).toLocaleDateString('sv-SE')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveVIPMember(
                        member.id,
                        member.profiles?.username || 'Användare'
                      )
                    }
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.gradientEnd}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Member Earnings Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="attach_money"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.sectionTitle}>Intjäningsöversikt</Text>
          </View>

          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Totala intäkter (70%)</Text>
              <Text style={styles.earningsValue}>${totalRevenue.toFixed(2)}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Plattformsavgift (30%)</Text>
              <Text style={styles.earningsValue}>
                ${(totalRevenue * 0.3 / 0.7).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.earningsRow, styles.earningsTotalRow]}>
              <Text style={styles.earningsTotalLabel}>Skaparintäkter saldo</Text>
              <Text style={styles.earningsTotalValue}>${totalRevenue.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.payoutButton}
              onPress={handleRequestPayout}
            >
              <IconSymbol
                ios_icon_name="arrow.down.circle.fill"
                android_material_icon_name="download"
                size={20}
                color={colors.text}
              />
              <Text style={styles.payoutButtonText}>Begär utbetalning</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol
              ios_icon_name="megaphone.fill"
              android_material_icon_name="notifications"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.sectionTitle}>Skicka meddelande</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Skicka ett meddelande till alla aktiva VIP-medlemmar
          </Text>

          <View style={styles.announcementForm}>
            <TextInput
              style={styles.input}
              placeholder="Meddelandetitel"
              placeholderTextColor={colors.placeholder}
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Meddelandetext"
              placeholderTextColor={colors.placeholder}
              value={announcementMessage}
              onChangeText={setAnnouncementMessage}
              maxLength={500}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                isSendingAnnouncement && styles.sendButtonDisabled,
              ]}
              onPress={handleSendAnnouncement}
              disabled={isSendingAnnouncement}
            >
              {isSendingAnnouncement ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="paperplane.fill"
                    android_material_icon_name="send"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.sendButtonText}>Skicka till alla medlemmar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Moderator Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.sectionTitle}>Lägg till moderator</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Sök efter användarnamn för att lägga till en moderator ({moderators.length}/30)
          </Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Sök användarnamn..."
              placeholderTextColor={colors.placeholder}
              value={searchUsername}
              onChangeText={setSearchUsername}
              onSubmitEditing={handleSearchUsers}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchUsers}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={colors.text}
                />
              )}
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.searchResultItem}
                  onPress={() => handleAddModerator(result.id, result.username)}
                >
                  {result.avatar_url ? (
                    <Image source={{ uri: result.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{result.display_name}</Text>
                    <Text style={styles.searchResultUsername}>@{result.username}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add_circle"
                    size={24}
                    color={colors.gradientEnd}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Current Moderators Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="group"
              size={20}
              color={colors.text}
            />
            <Text style={styles.sectionTitle}>Nuvarande moderatorer ({moderators.length})</Text>
          </View>

          {moderators.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="person.2.slash"
                android_material_icon_name="people_outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>Inga moderatorer ännu</Text>
              <Text style={styles.emptySubtext}>
                Lägg till moderatorer för att hjälpa till att hantera dina streams
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {moderators.map((mod) => (
                <View key={mod.id} style={styles.listItem}>
                  {mod.profiles?.avatar_url ? (
                    <Image source={{ uri: mod.profiles.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{mod.profiles?.display_name}</Text>
                    <Text style={styles.listItemUsername}>@{mod.profiles?.username}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveModerator(mod.user_id, mod.profiles?.username || 'Användare')
                    }
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.gradientEnd}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Banned Users Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="block"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.sectionTitle}>Bannade användare ({bannedUsers.length})</Text>
          </View>

          {bannedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={48}
                color="#4CAF50"
              />
              <Text style={styles.emptyText}>Inga bannade användare</Text>
              <Text style={styles.emptySubtext}>
                Användare du bannar kommer att visas här
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {bannedUsers.map((banned) => (
                <View key={banned.id} style={styles.listItem}>
                  {banned.profiles?.avatar_url ? (
                    <Image source={{ uri: banned.profiles.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{banned.profiles?.display_name}</Text>
                    <Text style={styles.listItemUsername}>@{banned.profiles?.username}</Text>
                    {banned.reason && (
                      <Text style={styles.banReason}>Anledning: {banned.reason}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.unbanButton}
                    onPress={() =>
                      handleUnbanUser(banned.user_id, banned.profiles?.username || 'Användare')
                    }
                  >
                    <Text style={styles.unbanButtonText}>Avbanna</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Badge Editor Modal */}
      {user && (
        <BadgeEditorModal
          visible={showBadgeEditor}
          onClose={() => setShowBadgeEditor(false)}
          userId={user.id}
          currentBadgeName={clubName}
          currentBadgeColor={badgeColor}
          onUpdate={fetchData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gradientEnd,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  clubOverviewCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  clubInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  clubInfoItem: {
    flex: 1,
  },
  clubInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  clubInfoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgePreviewText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: colors.gradientEnd,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  searchResultUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  listItemInfo: {
    flex: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  listItemUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  memberUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  memberDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  banReason: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  unbanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unbanButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionButton: {
    width: '30%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  earningsCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  earningsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  earningsTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  earningsTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gradientEnd,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gradientEnd,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  payoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  announcementForm: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gradientEnd,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
