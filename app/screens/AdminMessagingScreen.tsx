
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { adminService, MessageType } from '@/app/services/adminService';
import GradientButton from '@/components/GradientButton';

export default function AdminMessagingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('notice');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!user) return;

    if (!targetUserId.trim()) {
      Alert.alert('Error', 'Please enter a target user ID');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setIsLoading(true);

    const duration = durationDays ? parseInt(durationDays) : undefined;

    const result = await adminService.sendAdminMessage(
      user.id,
      targetUserId,
      messageType,
      subject,
      message,
      duration
    );

    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Message sent successfully');
      // Reset form
      setTargetUserId('');
      setSubject('');
      setMessage('');
      setDurationDays('');
    } else {
      Alert.alert('Error', result.error || 'Failed to send message');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Send Admin Message</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Message Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Message Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                messageType === 'warning' && [styles.typeButtonActive, { backgroundColor: '#FFA500' }],
                { borderColor: colors.border },
              ]}
              onPress={() => setMessageType('warning')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: messageType === 'warning' ? '#FFFFFF' : colors.text },
                ]}
              >
                Warning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                messageType === 'notice' && [styles.typeButtonActive, { backgroundColor: '#4ECDC4' }],
                { borderColor: colors.border },
              ]}
              onPress={() => setMessageType('notice')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: messageType === 'notice' ? '#FFFFFF' : colors.text },
                ]}
              >
                Notice
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                messageType === 'verification' && [styles.typeButtonActive, { backgroundColor: colors.brandPrimary }],
                { borderColor: colors.border },
              ]}
              onPress={() => setMessageType('verification')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: messageType === 'verification' ? '#FFFFFF' : colors.text },
                ]}
              >
                Verification
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target User ID */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Target User ID</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, color: colors.text, borderColor: colors.border }]}
            placeholder="Enter user ID..."
            placeholderTextColor={colors.placeholder}
            value={targetUserId}
            onChangeText={setTargetUserId}
            autoCapitalize="none"
          />
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, color: colors.text, borderColor: colors.border }]}
            placeholder="Enter subject..."
            placeholderTextColor={colors.placeholder}
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Message</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.backgroundAlt, color: colors.text, borderColor: colors.border }]}
            placeholder="Enter message..."
            placeholderTextColor={colors.placeholder}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Duration (for warnings) */}
        {messageType === 'warning' && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Duration (days)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter duration in days..."
              placeholderTextColor={colors.placeholder}
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
            />
          </View>
        )}

        {/* Send Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={isLoading ? 'Sending...' : 'Send Message'}
            onPress={handleSendMessage}
            disabled={isLoading}
          />
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
  },
  buttonContainer: {
    marginTop: 16,
  },
});