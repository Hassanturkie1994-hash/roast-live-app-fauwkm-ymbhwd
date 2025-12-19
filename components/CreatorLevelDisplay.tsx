
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useCreatorLevel } from '@/hooks/useCreatorLevel';

interface CreatorLevelDisplayProps {
  creatorId: string;
  onPress?: () => void;
}

export default function CreatorLevelDisplay({ creatorId, onPress }: CreatorLevelDisplayProps) {
  const { level, xp, xpToNextLevel, isLoading } = useCreatorLevel(creatorId);
  const [progress, setProgress] = useState(0);

  const loadLevelData = useCallback(() => {
    if (xp && xpToNextLevel) {
      const progressPercent = (xp / xpToNextLevel) * 100;
      setProgress(Math.min(progressPercent, 100));
    }
  }, [xp, xpToNextLevel]);

  useEffect(() => {
    loadLevelData();
  }, [loadLevelData]);

  if (isLoading) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.levelBadge}>
        <IconSymbol
          ios_icon_name="star.fill"
          android_material_icon_name="star"
          size={16}
          color="#FFD700"
        />
        <Text style={styles.levelText}>Level {level}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {xp} / {xpToNextLevel} XP
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brandPrimary,
    borderRadius: 3,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
