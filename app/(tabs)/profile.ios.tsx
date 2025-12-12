
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <IconSymbol ios_icon_name="gearshape" android_material_icon_name="settings" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: '#333' }]}>
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={50} color="#666" />
            </View>
          </View>
          
          <Text style={[styles.name, { color: theme.colors.text }]}>HaSss</Text>
          <Text style={[styles.username, { color: '#666' }]}>@hassan040</Text>
          <Text style={[styles.bio, { color: theme.colors.text }]}>Hhhhhhhh</Text>
          <Text style={[styles.link, { color: '#8B0000' }]}>roastlive.com/@hassan040</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: '#666' }]}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: '#666' }]}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: '#666' }]}>Posts</Text>
            </View>
          </View>
        </View>

        {/* Saldo Balance */}
        <TouchableOpacity style={styles.saldoCard}>
          <View style={styles.saldoLeft}>
            <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color="#8B0000" />
            <Text style={[styles.saldoLabel, { color: theme.colors.text }]}>Saldo Balance</Text>
          </View>
          <View style={styles.saldoRight}>
            <Text style={[styles.saldoAmount, { color: '#8B0000' }]}>100.00 SEK</Text>
            <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol ios_icon_name="bookmark.fill" android_material_icon_name="bookmark" size={20} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Saved Streams</Text>
          <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={20} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Stream History</Text>
          <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color="#666" />
        </TouchableOpacity>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.editProfileButtonText}>EDIT PROFILE</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton}>
          <IconSymbol ios_icon_name="square.and.arrow.up" android_material_icon_name="share" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Post/Story Buttons */}
        <View style={styles.postStoryContainer}>
          <TouchableOpacity style={styles.postStoryButton}>
            <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color={theme.colors.text} />
            <Text style={[styles.postStoryButtonText, { color: theme.colors.text }]}>Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postStoryButton}>
            <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color={theme.colors.text} />
            <Text style={[styles.postStoryButtonText, { color: theme.colors.text }]}>Story</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tabActive}>
            <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={20} color="#8B0000" />
            <Text style={[styles.tabText, styles.tabTextActive]}>LIVE REPLAYS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color="#666" />
            <Text style={[styles.tabText, { color: '#666' }]}>POSTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={20} color="#666" />
            <Text style={[styles.tabText, { color: '#666' }]}>STORIES</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={80} color="#333" />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No live replays yet</Text>
          <Text style={[styles.emptyStateSubtext, { color: '#666' }]}>
            Your past livestreams will appear here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    marginBottom: 8,
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  saldoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  saldoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saldoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  saldoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saldoAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  editProfileButton: {
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  shareButton: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  postStoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  postStoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  postStoryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  tabActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
    borderBottomWidth: 3,
    borderBottomColor: '#8B0000',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#8B0000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
