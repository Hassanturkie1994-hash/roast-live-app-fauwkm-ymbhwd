
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/app/integrations/supabase/client';
import { pushNotificationService } from '@/app/services/pushNotificationService';

type SegmentType = 'all_users' | 'creators_only' | 'premium_only' | 'recently_banned' | 'heavy_gifters' | 'new_users';

export default function AdminAnnouncementsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>('all_users');

  const segments: { value: SegmentType; label: string; description: string }[] = [
    { value: 'all_users', label: 'All Users', description: 'Send to everyone on the platform' },
    { value: 'creators_only', label: 'Creators Only', description: 'Users who have created at least one stream' },
    { value: 'premium_only', label: 'Premium Members', description: 'Active premium subscribers' },
    { value: 'recently_banned', label: 'Recently Banned', description: 'Users banned in the last 7 days' },
    { value: 'heavy_gifters', label: 'Heavy Gifters', description: 'Users who spent 500+ kr on gifts in last 30 days' },
    { value: 'new_users', label: 'New Users', description: 'Users who joined in the last 7 days' },
  ];

  const sendAnnouncement = async () => {
    if (!user) return;

    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    Alert.alert(
      'Confirm Send',
      `Are you sure you want to send this announcement to ${segments.find(s => s.value === selectedSegment)?.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            try {
              setSending(true);

              // Create announcement record
              const { data: announcement, error: createError } = await supabase
                .from('admin_announcements')
                .insert({
                  title,
                  body,
                  issued_by_admin_id: user.id,
                  segment_type: selectedSegment,
                  is_active: true,
                })
                .select()
                .single();

              if (createError || !announcement) {
                throw new Error(createError?.message || 'Failed to create announcement');
              }

              // Send push notifications
              const result = await pushNotificationService.sendAdminAnnouncement(
                announcement.id,
                title,
                body,
                selectedSegment,
                user.id
              );

              if (result.success) {
                Alert.alert(
                  'Success',
                  `Announcement sent to ${result.sentCount} users!`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
                setTitle('');
                setBody('');
              } else {
                Alert.alert('Error', result.error || 'Failed to send announcement');
              }
            } catch (error: any) {
              console.error('Error sending announcement:', error);
              Alert.alert('Error', error.message || 'Failed to send announcement');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Send Announcement</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Announcement title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Body Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Message</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Announcement message (first 80 characters will be shown in push notification)"
            placeholderTextColor={colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {body.length}/500 characters
          </Text>
        </View>

        {/* Segment Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Target Audience</Text>
          {segments.map((segment) => (
            <TouchableOpacity
              key={segment.value}
              style={[
                styles.segmentItem,
                { borderColor: colors.border },
                selectedSegment === segment.value && { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary + '10' },
              ]}
              onPress={() => setSelectedSegment(segment.value)}
            >
              <View style={styles.segmentLeft}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: colors.border },
                    selectedSegment === segment.value && { borderColor: colors.brandPrimary },
                  ]}
                >
                  {selectedSegment === segment.value && (
                    <View style={[styles.radioInner, { backgroundColor: colors.brandPrimary }]} />
                  )}
                </View>
                <View style={styles.segmentText}>
                  <Text style={[styles.segmentLabel, { color: colors.text }]}>{segment.label}</Text>
                  <Text style={[styles.segmentDescription, { color: colors.textSecondary }]}>
                    {segment.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Push Notification Preview</Text>
          <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>Roast Live Update</Text>
            <Text style={[styles.previewBody, { color: colors.textSecondary }]}>
              {body.substring(0, 80) + (body.length > 80 ? '...' : '') || 'Your message will appear here'}
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.brandPrimary },
            (!title.trim() || !body.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendAnnouncement}
          disabled={!title.trim() || !body.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol
                ios_icon_name="paperplane.fill"
                android_material_icon_name="send"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.sendButtonText}>Send Announcement</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '700',
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  segmentItem: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  segmentLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  segmentText: {
    flex: 1,
  },
  segmentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  segmentDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  preview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  sendButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});