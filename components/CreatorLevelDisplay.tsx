
/**
 * Creator Level Display Component
 * 
 * Displays creator's current level, XP progress, and unlocked perks.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { creatorLevelingService, CreatorLevel, CreatorPerk, CreatorUnlockedPerk } from '@/services/creatorLevelingService';

interface CreatorLevelDisplayProps {
  creatorId: string;
  showPerks?: boolean;
  showHistory?: boolean;
}

export const CreatorLevelDisplay: React.FC<CreatorLevelDisplayProps> = ({
  creatorId,
  showPerks = true,
  showHistory = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<CreatorLevel | null>(null);
  const [allPerks, setAllPerks] = useState<CreatorPerk[]>([]);
  const [unlockedPerks, setUnlockedPerks] = useState<CreatorUnlockedPerk[]>([]);
  const [equippedPerks, setEquippedPerks] = useState<CreatorUnlockedPerk[]>([]);

  useEffect(() => {
    loadLevelData();
    
    // Subscribe to level updates
    const unsubscribeLevel = creatorLevelingService.subscribeToLevelUpdates(creatorId, (updatedLevel) => {
      setLevel(updatedLevel);
    });

    // Subscribe to perk unlocks
    const unsubscribePerks = creatorLevelingService.subscribeToPerkUnlocks(creatorId, (perk) => {
      console.log('🎉 New perk unlocked!', perk);
      loadLevelData(); // Reload to get updated perks
    });

    return () => {
      unsubscribeLevel();
      unsubscribePerks();
    };
  }, [creatorId]);

  const loadLevelData = async () => {
    try {
      setLoading(true);

      // Get creator level
      const creatorLevel = await creatorLevelingService.getCreatorLevel(creatorId);
      setLevel(creatorLevel);

      if (showPerks) {
        // Get all perks
        const perks = await creatorLevelingService.getAllPerks();
        setAllPerks(perks);

        // Get unlocked perks
        const unlocked = await creatorLevelingService.getUnlockedPerks(creatorId);
        setUnlockedPerks(unlocked);

        // Get equipped perks
        const equipped = await creatorLevelingService.getEquippedPerks(creatorId);
        setEquippedPerks(equipped);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading level data:', error);
      setLoading(false);
    }
  };

  const handleEquipPerk = async (perkId: string) => {
    const success = await creatorLevelingService.equipPerk(creatorId, perkId);
    if (success) {
      loadLevelData();
    }
  };

  const handleUnequipPerk = async (perkId: string) => {
    const success = await creatorLevelingService.unequipPerk(creatorId, perkId);
    if (success) {
      loadLevelData();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
        <Text style={styles.loadingText}>Loading level data...</Text>
      </View>
    );
  }

  if (!level) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No level data available</Text>
      </View>
    );
  }

  const progress = creatorLevelingService.getLevelProgress(level.current_xp, level.xp_to_next_level);
  const tierName = creatorLevelingService.getLevelTierName(level.current_level);
  const tierColor = creatorLevelingService.getLevelTierColor(level.current_level);

  return (
    <ScrollView style={styles.container}>
      {/* Level Card */}
      <View style={[styles.levelCard, { borderColor: tierColor }]}>
        <View style={styles.levelHeader}>
          <View>
            <Text style={styles.levelTitle}>Level {level.current_level}</Text>
            <Text style={[styles.tierName, { color: tierColor }]}>{tierName}</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.levelBadgeText}>{level.current_level}</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>XP Progress</Text>
            <Text style={styles.xpValue}>
              {creatorLevelingService.formatXP(level.current_xp)} / {creatorLevelingService.formatXP(level.xp_to_next_level)}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: tierColor }]} />
          </View>
          <Text style={styles.progressText}>{progress}% to Level {level.current_level + 1}</Text>
        </View>

        {/* XP Sources */}
        <View style={styles.xpSourcesSection}>
          <Text style={styles.xpSourcesTitle}>XP Sources</Text>
          <View style={styles.xpSourcesGrid}>
            <View style={styles.xpSourceItem}>
              <Text style={styles.xpSourceIcon}>🎁</Text>
              <Text style={styles.xpSourceLabel}>Gifts</Text>
              <Text style={styles.xpSourceValue}>{creatorLevelingService.formatXP(level.xp_from_gifts)}</Text>
            </View>
            <View style={styles.xpSourceItem}>
              <Text style={styles.xpSourceIcon}>⚔️</Text>
              <Text style={styles.xpSourceLabel}>Battles</Text>
              <Text style={styles.xpSourceValue}>{creatorLevelingService.formatXP(level.xp_from_battles)}</Text>
            </View>
            <View style={styles.xpSourceItem}>
              <Text style={styles.xpSourceIcon}>⏱️</Text>
              <Text style={styles.xpSourceLabel}>Streaming</Text>
              <Text style={styles.xpSourceValue}>{creatorLevelingService.formatXP(level.xp_from_stream_duration)}</Text>
            </View>
            <View style={styles.xpSourceItem}>
              <Text style={styles.xpSourceIcon}>🏆</Text>
              <Text style={styles.xpSourceLabel}>Seasons</Text>
              <Text style={styles.xpSourceValue}>{creatorLevelingService.formatXP(level.xp_from_seasons)}</Text>
            </View>
          </View>
        </View>

        {/* Total XP */}
        <View style={styles.totalXpSection}>
          <Text style={styles.totalXpLabel}>Total XP Earned</Text>
          <Text style={[styles.totalXpValue, { color: tierColor }]}>
            {creatorLevelingService.formatXP(level.total_xp_earned)}
          </Text>
        </View>
      </View>

      {/* Unlocked Perks */}
      {showPerks && unlockedPerks.length > 0 && (
        <View style={styles.perksSection}>
          <Text style={styles.sectionTitle}>Unlocked Perks ({unlockedPerks.length})</Text>
          {unlockedPerks.map((unlockedPerk) => {
            const perk = unlockedPerk.perk;
            if (!perk) return null;

            const isEquipped = equippedPerks.some(ep => ep.perk_id === perk.id);

            return (
              <View key={unlockedPerk.id} style={[styles.perkItem, isEquipped && styles.perkItemEquipped]}>
                <View style={styles.perkItemLeft}>
                  <Text style={styles.perkIcon}>{creatorLevelingService.getPerkIcon(perk.perk_type)}</Text>
                  <View style={styles.perkInfo}>
                    <Text style={styles.perkName}>{perk.perk_name}</Text>
                    <Text style={styles.perkDescription}>{perk.perk_description}</Text>
                    <Text style={styles.perkLevel}>Level {perk.required_level}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.equipButton, isEquipped && styles.equipButtonActive]}
                  onPress={() => isEquipped ? handleUnequipPerk(perk.id) : handleEquipPerk(perk.id)}
                >
                  <Text style={styles.equipButtonText}>{isEquipped ? 'Equipped' : 'Equip'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Upcoming Perks */}
      {showPerks && allPerks.length > 0 && (
        <View style={styles.perksSection}>
          <Text style={styles.sectionTitle}>Upcoming Perks</Text>
          {allPerks
            .filter(perk => perk.required_level > level.current_level)
            .slice(0, 5)
            .map((perk) => (
              <View key={perk.id} style={[styles.perkItem, styles.perkItemLocked]}>
                <View style={styles.perkItemLeft}>
                  <Text style={styles.perkIcon}>🔒</Text>
                  <View style={styles.perkInfo}>
                    <Text style={styles.perkName}>{perk.perk_name}</Text>
                    <Text style={styles.perkDescription}>{perk.perk_description}</Text>
                    <Text style={styles.perkLevel}>Unlocks at Level {perk.required_level}</Text>
                  </View>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadLevelData}>
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  noDataText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  levelCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  xpSection: {
    marginBottom: 20,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  xpValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  xpSourcesSection: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 16,
    marginBottom: 16,
  },
  xpSourcesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  xpSourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  xpSourceItem: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  xpSourceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  xpSourceLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  xpSourceValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalXpSection: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalXpLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  totalXpValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  perksSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  perkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  perkItemEquipped: {
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  perkItemLocked: {
    opacity: 0.6,
  },
  perkItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  perkIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  perkInfo: {
    flex: 1,
  },
  perkName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  perkDescription: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  perkLevel: {
    color: '#FF1493',
    fontSize: 12,
    fontWeight: 'bold',
  },
  equipButton: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  equipButtonActive: {
    backgroundColor: '#333333',
  },
  equipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#FF1493',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
