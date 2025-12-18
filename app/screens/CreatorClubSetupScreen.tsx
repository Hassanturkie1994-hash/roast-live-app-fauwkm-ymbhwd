
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
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVIPClubService, VIPClub, VIPClubMember } from '@/app/services/unifiedVIPClubService';
import GradientButton from '@/components/GradientButton';

/**
 * CreatorClubSetupScreen - Fully Defensive Component
 * 
 * STABILITY FIXES APPLIED:
 * - All service calls wrapped in try-catch
 * - All data access uses optional chaining
 * - Defensive checks for service existence
 * - Graceful fallbacks for all error cases
 * - No assumptions about async data
 */
export default function CreatorClubSetupScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingClub, setExistingClub] = useState<VIPClub | null>(null);
  const [members, setMembers] = useState<VIPClubMember[]>([]);

  // Form state
  const [clubName, setClubName] = useState('');
  const [badgeName, setBadgeName] = useState('');
  const [badgeColor, setBadgeColor] = useState('#FF1493');
  const [monthlyPrice, setMonthlyPrice] = useState('30.00');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // DEFENSIVE: Safe club data loading with comprehensive error handling
  const loadClubData = useCallback(async () => {
    if (!user) {
      console.warn('⚠️ [CreatorClubSetup] Cannot load club: user is null');
      setLoading(false);
      return;
    }

    if (!user.id) {
      console.warn('⚠️ [CreatorClubSetup] Cannot load club: user.id is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // DEFENSIVE: Check service exists
      if (!unifiedVIPClubService) {
        console.error('❌ [CreatorClubSetup] unifiedVIPClubService is undefined');
        setLoading(false);
        return;
      }

      if (typeof unifiedVIPClubService.getVIPClubByCreator !== 'function') {
        console.error('❌ [CreatorClubSetup] getVIPClubByCreator is not a function');
        setLoading(false);
        return;
      }

      const club = await unifiedVIPClubService.getVIPClubByCreator(user.id);
      
      // DEFENSIVE: Validate club data
      if (club && typeof club === 'object') {
        setExistingClub(club);
        setClubName(club.club_name || '');
        setBadgeName(club.badge_name || '');
        setBadgeColor(club.badge_color || '#FF1493');
        setMonthlyPrice(club.monthly_price_sek?.toString() || '30.00');
        setDescription(club.description || '');
        setIsActive(club.is_active ?? true);

        // DEFENSIVE: Load members with error handling
        try {
          if (typeof unifiedVIPClubService.getVIPClubMembers !== 'function') {
            console.error('❌ [CreatorClubSetup] getVIPClubMembers is not a function');
            setMembers([]);
          } else {
            const clubMembers = await unifiedVIPClubService.getVIPClubMembers(club.id);
            
            // DEFENSIVE: Validate members is an array
            if (Array.isArray(clubMembers)) {
              setMembers(clubMembers);
            } else {
              console.warn('⚠️ [CreatorClubSetup] getVIPClubMembers returned non-array');
              setMembers([]);
            }
          }
        } catch (memberError) {
          console.error('❌ [CreatorClubSetup] Error loading members:', memberError);
          setMembers([]);
        }
      } else {
        setExistingClub(null);
        setMembers([]);
      }
    } catch (error) {
      console.error('❌ [CreatorClubSetup] Error loading club data:', error);
      setExistingClub(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  // DEFENSIVE: Safe save handler with comprehensive validation
  const handleSave = async () => {
    if (!user) {
      console.warn('⚠️ [CreatorClubSetup] Cannot save: user is null');
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!user.id) {
      console.warn('⚠️ [CreatorClubSetup] Cannot save: user.id is missing');
      Alert.alert('Error', 'User ID is missing');
      return;
    }

    // Validation
    if (!clubName.trim()) {
      Alert.alert('Error', 'Please enter a club name');
      return;
    }

    if (!badgeName.trim()) {
      Alert.alert('Error', 'Please enter a badge name');
      return;
    }

    if (badgeName.length > 20) {
      Alert.alert('Error', 'Badge name must be 20 characters or less');
      return;
    }

    if (clubName.length > 32) {
      Alert.alert('Error', 'Club name must be 32 characters or less');
      return;
    }

    const price = parseFloat(monthlyPrice);
    if (isNaN(price) || price < 1) {
      Alert.alert('Error', 'Price must be at least 1.00 SEK');
      return;
    }

    setSaving(true);
    try {
      // DEFENSIVE: Check service exists
      if (!unifiedVIPClubService) {
        console.error('❌ [CreatorClubSetup] unifiedVIPClubService is undefined');
        Alert.alert('Error', 'VIP Club service is not available');
        setSaving(false);
        return;
      }

      if (existingClub) {
        // DEFENSIVE: Check update method exists
        if (typeof unifiedVIPClubService.updateVIPClub !== 'function') {
          console.error('❌ [CreatorClubSetup] updateVIPClub is not a function');
          Alert.alert('Error', 'Update function is not available');
          setSaving(false);
          return;
        }

        // Update existing club
        const result = await unifiedVIPClubService.updateVIPClub(existingClub.id, {
          club_name: clubName.trim(),
          badge_name: badgeName.trim(),
          badge_color: badgeColor,
          monthly_price_sek: price,
          description: description.trim() || undefined,
          is_active: isActive,
        });

        // DEFENSIVE: Validate result
        if (!result) {
          console.error('❌ [CreatorClubSetup] updateVIPClub returned null/undefined');
          Alert.alert('Error', 'Failed to update club');
          setSaving(false);
          return;
        }

        if (result.success) {
          Alert.alert('Success', 'Your VIP Club has been updated!');
          loadClubData();
        } else {
          Alert.alert('Error', result.error || 'Failed to update club');
        }
      } else {
        // DEFENSIVE: Check create method exists
        if (typeof unifiedVIPClubService.createVIPClub !== 'function') {
          console.error('❌ [CreatorClubSetup] createVIPClub is not a function');
          Alert.alert('Error', 'Create function is not available');
          setSaving(false);
          return;
        }

        // Create new club
        const result = await unifiedVIPClubService.createVIPClub(
          user.id,
          clubName.trim(),
          badgeName.trim(),
          badgeColor,
          price,
          description.trim() || undefined
        );

        // DEFENSIVE: Validate result
        if (!result) {
          console.error('❌ [CreatorClubSetup] createVIPClub returned null/undefined');
          Alert.alert('Error', 'Failed to create club');
          setSaving(false);
          return;
        }

        if (result.success) {
          Alert.alert('Success', 'Your VIP Club has been created!');
          loadClubData();
        } else {
          Alert.alert('Error', result.error || 'Failed to create club');
        }
      }
    } catch (error: any) {
      console.error('❌ [CreatorClubSetup] Error saving club:', error);
      Alert.alert('Error', error?.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // DEFENSIVE: Safe VIP level color calculation
  const getVIPLevelColor = (level: number | null | undefined): string => {
    const safeLevel = typeof level === 'number' ? level : 0;
    if (safeLevel >= 15) return '#FF1493'; // Hot Pink for top tier
    if (safeLevel >= 10) return '#9B59B6'; // Purple
    if (safeLevel >= 5) return '#3498DB'; // Blue
    return '#FFD700'; // Gold for entry level
  };

  // DEFENSIVE: Safe VIP level label calculation
  const getVIPLevelLabel = (level: number | null | undefined): string => {
    const safeLevel = typeof level === 'number' ? level : 0;
    if (safeLevel >= 15) return 'LEGENDARY';
    if (safeLevel >= 10) return 'ELITE';
    if (safeLevel >= 5) return 'PREMIUM';
    return 'VIP';
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
            Create your exclusive VIP club! Members get a custom badge in your streams, priority chat access, and earn levels (1-20) based on their support.
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

        {/* Badge Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Badge Name</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Max 20 characters - shown as badge
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
            value={badgeName}
            onChangeText={setBadgeName}
            placeholder="e.g., HASSO VIP"
            placeholderTextColor={colors.textSecondary}
            maxLength={20}
          />
          {badgeName && (
            <View style={styles.badgePreview}>
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="workspace_premium"
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.badgeText}>{badgeName}</Text>
              </View>
              <Text style={[styles.badgePreviewLabel, { color: colors.textSecondary }]}>
                Badge Preview
              </Text>
            </View>
          )}
        </View>

        {/* Badge Color */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Badge Color</Text>
          <View style={styles.colorOptions}>
            {['#FF1493', '#9B59B6', '#3498DB', '#FFD700', '#E74C3C', '#2ECC71'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  badgeColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setBadgeColor(color)}
              >
                {badgeColor === color && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
              placeholder="30.00"
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

        {/* VIP Members List - DEFENSIVE: Check members is array and has items */}
        {existingClub && Array.isArray(members) && members.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              VIP Members ({members.length})
            </Text>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Members earn levels (1-20) based on their support
            </Text>
            <View style={styles.membersList}>
              {members.map((member) => {
                // DEFENSIVE: Validate member object
                if (!member || !member.id) {
                  return null;
                }

                return (
                  <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                    <View style={styles.memberInfo}>
                      <View 
                        style={[
                          styles.memberAvatar, 
                          { backgroundColor: getVIPLevelColor(member.vip_level) }
                        ]}
                      >
                        <Text style={styles.memberAvatarText}>
                          {member.display_name?.charAt(0).toUpperCase() || 'V'}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {member.display_name || 'VIP Member'}
                        </Text>
                        <View style={styles.memberLevelContainer}>
                          <View 
                            style={[
                              styles.memberLevelBadge, 
                              { backgroundColor: getVIPLevelColor(member.vip_level) }
                            ]}
                          >
                            <IconSymbol
                              ios_icon_name="star.fill"
                              android_material_icon_name="workspace_premium"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.memberLevelText}>
                              Level {member.vip_level ?? 1}
                            </Text>
                          </View>
                          <Text style={[styles.memberLevelLabel, { color: colors.textSecondary }]}>
                            {getVIPLevelLabel(member.vip_level)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.memberStats}>
                      <Text style={[styles.memberStatText, { color: colors.textSecondary }]}>
                        {member.total_gifted_sek ?? 0} SEK gifted
                      </Text>
                    </View>
                  </View>
                );
              })}
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
                Level progression system (1-20)
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
            title={existingClub ? 'Save Changes' : 'Create VIP Club'}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgePreviewLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  membersList: {
    gap: 12,
    marginTop: 12,
  },
  memberCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  memberLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberLevelLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberStats: {
    paddingLeft: 56,
  },
  memberStatText: {
    fontSize: 12,
    fontWeight: '500',
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
