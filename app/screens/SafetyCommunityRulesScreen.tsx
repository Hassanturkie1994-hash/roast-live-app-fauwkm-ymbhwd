
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

interface ContentItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface RuleItem {
  id: string;
  title: string;
  description: string;
}

interface SuspensionLevel {
  id: string;
  level: string;
  color: string;
  description: string;
}

export default function SafetyCommunityRulesScreen() {
  const { colors } = useTheme();
  const [showFAQModal, setShowFAQModal] = useState(false);

  const allowedContent: ContentItem[] = [
    { id: 'comedy', icon: '😂', title: 'Comedy', description: 'Humorous content and jokes' },
    { id: 'roast', icon: '🔥', title: 'Roast Humor', description: 'Playful roasting and banter' },
    { id: 'satire', icon: '🎭', title: 'Satire', description: 'Satirical commentary' },
    { id: 'jokes', icon: '😄', title: 'Jokes', description: 'Light-hearted jokes' },
    { id: 'drama', icon: '🎬', title: 'Drama', description: 'Dramatic content' },
    { id: 'competitive', icon: '⚔️', title: 'Competitive Roast Sessions', description: 'Friendly roast battles' },
    { id: 'challenge', icon: '🎯', title: 'Challenge Content', description: 'Fun challenges' },
  ];

  const notAllowedContent: ContentItem[] = [
    { id: 'hate-speech', icon: '❌', title: 'Hate Speech', description: 'Discriminatory language based on race, religion, gender, etc.' },
    { id: 'sexual', icon: '❌', title: 'Sexual Targeting', description: 'Unwanted sexual advances or harassment' },
    { id: 'violence', icon: '❌', title: 'Violence or Threats', description: 'Threats of physical harm or violence' },
    { id: 'private-data', icon: '❌', title: 'Revealing Private Data', description: 'Sharing personal information without consent' },
    { id: 'self-harm', icon: '❌', title: 'Encouraging Self-Harm', description: 'Content promoting self-injury or suicide' },
    { id: 'minors', icon: '❌', title: 'Exploitation of Minors', description: 'Any content involving minors inappropriately' },
    { id: 'identity-harassment', icon: '❌', title: 'Harassment Targeting Identity', description: 'Attacks based on personal characteristics' },
    { id: 'non-consensual', icon: '❌', title: 'Non-Consensual Content', description: 'Content shared without permission' },
  ];

  const chatRules: RuleItem[] = [
    { id: 'spam', title: 'Spam Detection', description: '5 spam messages in 3 seconds triggers auto-warning' },
    { id: 'hate', title: 'Hate Keywords', description: 'Messages with hate speech are automatically blocked' },
    { id: 'bullying', title: 'Bullying Repetition', description: 'Repeated harassment results in timeout' },
  ];

  const giftRules: RuleItem[] = [
    { id: 'no-refunds', title: 'No Refunds', description: 'Gifts are non-refundable unless fraud is detected' },
    { id: 'commission', title: 'Platform Commission', description: 'Platform takes a commission from all gifts' },
    { id: 'support', title: 'Support, Not Ownership', description: 'Gifting shows support but doesn\'t grant special privileges' },
  ];

  const suspensionLevels: SuspensionLevel[] = [
    { id: 'warning', level: 'Warning', color: '#FFA500', description: 'First offense - warning issued' },
    { id: 'timeout', level: 'Timeout', color: '#FF6B6B', description: 'Temporary chat restriction (1-60 minutes)' },
    { id: 'suspension', level: 'Suspension', color: '#DC143C', description: 'Account suspended (7-30 days)' },
    { id: 'ban', level: 'Ban from Livestream', color: '#8B0000', description: 'Permanent streaming ban' },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Safety & Community Rules</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Allowed Content */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>✅ Allowed Content</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            We encourage creative and entertaining content that brings joy to our community.
          </Text>
          <View style={styles.itemsContainer}>
            {allowedContent.map((item) => (
              <View
                key={item.id}
                style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={styles.contentIcon}>{item.icon}</Text>
                <View style={styles.contentText}>
                  <Text style={[styles.contentTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.contentDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 2: Strictly Not Allowed */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🚫 Strictly Not Allowed</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            The following content is prohibited and will result in immediate action.
          </Text>
          <View style={styles.itemsContainer}>
            {notAllowedContent.map((item) => (
              <View
                key={item.id}
                style={[styles.contentCard, styles.notAllowedCard, { backgroundColor: colors.card, borderColor: '#DC143C' }]}
              >
                <Text style={styles.contentIcon}>{item.icon}</Text>
                <View style={styles.contentText}>
                  <Text style={[styles.contentTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.contentDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 3: Chat Rules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💬 Chat Rules</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Automated systems monitor chat for violations.
          </Text>
          <View style={styles.itemsContainer}>
            {chatRules.map((item) => (
              <View
                key={item.id}
                style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.ruleBullet, { backgroundColor: colors.brandPrimary }]} />
                <View style={styles.ruleText}>
                  <Text style={[styles.ruleTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.ruleDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: Gift Rules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎁 Gift Rules</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Important information about gifting on the platform.
          </Text>
          <View style={styles.itemsContainer}>
            {giftRules.map((item) => (
              <View
                key={item.id}
                style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.ruleBullet, { backgroundColor: '#FFD700' }]} />
                <View style={styles.ruleText}>
                  <Text style={[styles.ruleTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.ruleDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 5: Suspension Levels */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Suspension Levels</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Violations are handled progressively based on severity.
          </Text>
          <View style={styles.itemsContainer}>
            {suspensionLevels.map((item) => (
              <View
                key={item.id}
                style={[styles.suspensionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.suspensionLevel, { backgroundColor: item.color }]}>
                  <Text style={styles.suspensionLevelText}>{item.level}</Text>
                </View>
                <Text style={[styles.suspensionDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.learnMoreButton, { backgroundColor: colors.brandPrimary }]}
            onPress={() => setShowFAQModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.learnMoreButtonText}>Learn More</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAQ Modal */}
      <Modal
        visible={showFAQModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFAQModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Suspension FAQ</Text>
              <TouchableOpacity onPress={() => setShowFAQModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  How long do strikes last?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  Strikes expire after 30 days. If you accumulate 3 active strikes within 30 days, streaming will be disabled until strikes expire.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  Can I appeal a ban?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  Yes, you can submit a ban appeal through your profile settings. Appeals are reviewed by our admin team within 48 hours.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  What happens during a timeout?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  During a timeout, you cannot send messages in chat. You can still watch streams. Timeouts typically last 1-60 minutes.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  How do I avoid violations?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  Follow our community guidelines, be respectful to others, avoid hate speech and harassment, and don't spam chat. Keep content appropriate for the stream's rating.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  What is mass report lockdown?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  If 15 unique users report a stream within 1 minute, chat is temporarily hidden and the creator must acknowledge they will continue responsibly.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 16,
  },
  itemsContainer: {
    gap: 12,
  },
  contentCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  notAllowedCard: {
    borderWidth: 2,
  },
  contentIcon: {
    fontSize: 32,
  },
  contentText: {
    flex: 1,
    gap: 4,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  contentDescription: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  ruleCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  ruleBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  ruleText: {
    flex: 1,
    gap: 4,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  ruleDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  suspensionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  suspensionLevel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  suspensionLevelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  suspensionDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  learnMoreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalScroll: {
    maxHeight: 400,
  },
  faqItem: {
    marginBottom: 24,
    gap: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
  },
  faqAnswer: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
