
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

export default function AdminStrikesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [strikes, setStrikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStrikes();
  }, []);

  const fetchStrikes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_safety_strikes')
        .select('*, profiles!content_safety_strikes_user_id_fkey(*)')
        .eq('active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching strikes:', error);
      } else {
        setStrikes(data || []);
      }
    } catch (error) {
      console.error('Error in fetchStrikes:', error);
    }
    setIsLoading(false);
  };

  const getStrikeLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return '#FFA500';
      case 2:
        return '#FF6B6B';
      case 3:
        return '#DC143C';
      default:
        return colors.textSecondary;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }
    return `${hours}h remaining`;
  };

  const handleDismissStrike = async (strikeId: string) => {
    Alert.alert(
      'Dismiss Strike',
      'Are you sure you want to dismiss this strike?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('content_safety_strikes')
                .update({ active: false })
                .eq('id', strikeId);

              if (error) {
                Alert.alert('Error', 'Failed to dismiss strike');
              } else {
                Alert.alert('Success', 'Strike dismissed');
                fetchStrikes();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to dismiss strike');
            }
          },
        },
      ]
    );
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Active Strikes</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {strikes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active strikes
              </Text>
            </View>
          ) : (
            strikes.map((strike, index) => (
              <View
                key={index}
                style={[styles.strikeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.strikeHeader}>
                  <View
                    style={[
                      styles.strikeLevelBadge,
                      { backgroundColor: getStrikeLevelColor(strike.strike_level) },
                    ]}
                  >
                    <Text style={styles.strikeLevelText}>Level {strike.strike_level}</Text>
                  </View>
                  <Text style={[styles.strikeDate, { color: colors.textSecondary }]}>
                    {new Date(strike.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.strikeContent}>
                  <Text style={[styles.strikeUser, { color: colors.text }]}>
                    {strike.profiles?.display_name || strike.profiles?.username || 'Unknown User'}
                  </Text>
                  <Text style={[styles.strikeType, { color: colors.textSecondary }]}>
                    {strike.strike_type}
                  </Text>
                  <Text style={[styles.strikeMessage, { color: colors.text }]}>
                    {strike.strike_message}
                  </Text>
                  <Text style={[styles.strikeExpiry, { color: colors.textSecondary }]}>
                    {getTimeRemaining(strike.expires_at)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.dismissButton, { backgroundColor: colors.brandPrimary }]}
                  onPress={() => handleDismissStrike(strike.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissButtonText}>Dismiss Strike</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  strikeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  strikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strikeLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  strikeLevelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  strikeDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  strikeContent: {
    gap: 6,
  },
  strikeUser: {
    fontSize: 18,
    fontWeight: '700',
  },
  strikeType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  strikeMessage: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  strikeExpiry: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  dismissButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});