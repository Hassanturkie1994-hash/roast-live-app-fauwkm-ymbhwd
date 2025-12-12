
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { creatorClubService, CreatorClub } from '@/app/services/creatorClubService';
import GradientButton from '@/components/GradientButton';

export default function CreatorClubSetupScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingClub, setExistingClub] = useState<CreatorClub | null>(null);

  // Form state
  const [clubName, setClubName] = useState('');
  const [clubTag, setClubTag] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('3.00');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      loadClubData();
    }
  }, [user]);

  const loadClubData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const club = await creatorClubService.getClubByCreator(user.id);
      if (club) {
        setExistingClub(club);
        setClubName(club.name);
        setClubTag(club.tag);
        setMonthlyPrice((club.monthly_price_cents / 100).toFixed(2));
        setDescription(club.description || '');
        setIsActive(club.is_active);
      }
    } catch (error) {
      console.error('Error loading club data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!clubName.trim()) {
      Alert.alert('Error', 'Please enter a club name');
      return;
    }

    if (!clubTag.trim()) {
      Alert.alert('Error', 'Please enter a club tag');
      return;
    }

    if (clubTag.length > 5) {
      Alert.alert('Error', 'Club tag must be 5 characters or less');
      return;
    }

    if (clubName.length > 32) {
      Alert.alert('Error', 'Club name must be 32 characters or less');
      return;
    }

    const priceCents = Math.round(parseFloat(monthlyPrice) * 100);
    if (isNaN(priceCents) || priceCents < 100) {
      Alert.alert('Error', 'Price must be at least 1.00');
      return;
    }

    setSaving(true);
    try {
      if (existingClub) {
        // Update existing club
        const result = await creatorClubService.updateClub(user.id, {
          name: clubName.trim(),
          tag: clubTag.trim(),
          monthly_price_cents: priceCents,
          description: description.trim() || undefined,
          is_active: isActive,
        });

        if (result.success) {
          Alert.alert('Success', 'Your club has been updated!');
          loadClubData();
        } else {
          Alert.alert('Error', result.error || 'Failed to update club');
        }
      } else {
        // Create new club
        const result = await creatorClubService.createClub(
          user.id,
          clubName.trim(),
          clubTag.trim(),
          priceCents,
          description.trim() || undefined
        );

        if (result.success) {
          Alert.alert('Success', 'Your club has been created!');
          loadClubData();
        } else {
          Alert.alert('Error', result.error || 'Failed to create club');
        }
      }
    } catch (error) {
      console.error('Error saving club:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>VIP Club Setup</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>VIP Club Setup</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: `${colors.brandPrimary}15` }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.brandPrimary}
          />
          <Text style={[styles.infoBannerText, { color: colors.text }]}>
            Create your exclusive VIP club! Members get a custom badge in your streams and priority chat access.
          </Text>
        </View>

        {/* Club Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Club Name</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Max 32 characters
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundAlt,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={clubName}
            onChangeText={setClubName}
            placeholder="e.g., Hasso's Elite Squad"
            placeholderTextColor={colors.textSecondary}
            maxLength={32}
          />
        </View>

        {/* Club Tag */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Club Tag</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Max 5 characters - shown as badge
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundAlt,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={clubTag}
            onChangeText={(text) => setClubTag(text.toUpperCase())}
            placeholder="e.g., HASSO"
            placeholderTextColor={colors.textSecondary}
            maxLength={5}
            autoCapitalize="characters"
          />
          {clubTag && (
            <View style={styles.badgePreview}>
              <View style={[styles.badge, { backgroundColor: colors.brandPrimary }]}>
                <Text style={styles.badgeText}>{clubTag}</Text>
              </View>
              <Text style={[styles.badgePreviewLabel, { color: colors.textSecondary }]}>
                Badge Preview
              </Text>
            </View>
          )}
        </View>

        {/* Monthly Price */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Monthly Price (SEK)</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            You earn 70% after platform fees
          </Text>
          <View style={styles.priceInputContainer}>
            <Text style={[styles.currencySymbol, { color: colors.text }]}>kr</Text>
            <TextInput
              style={[
                styles.priceInput,
                {
                  backgroundColor: colors.backgroundAlt,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={monthlyPrice}
              onChangeText={setMonthlyPrice}
              placeholder="3.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>
          {monthlyPrice && !isNaN(parseFloat(monthlyPrice)) && (
            <Text style={[styles.earningsText, { color: colors.brandPrimary }]}>
              You earn: kr {(parseFloat(monthlyPrice) * 0.7).toFixed(2)} per member/month
            </Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Tell members what they get
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.backgroundAlt,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Get exclusive access to my streams, priority chat, and special emotes!"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Active Toggle */}
        {existingClub && (
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.label, { color: colors.text }]}>Club Active</Text>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  {isActive ? 'Members can join' : 'New members cannot join'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.border, true: colors.brandPrimary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* Benefits List */}
        <View style={[styles.benefitsCard, { backgroundColor: colors.backgroundAlt }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>
            Member Benefits
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Custom badge in your livestreams
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Priority in chat
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Support your favorite creator
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={existingClub ? 'Save Changes' : 'Create Club'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
    borderWidth: 1,
    minHeight: 100,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
  },
  priceInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
  },
  earningsText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  badgePreviewLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  benefitsCard: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
});