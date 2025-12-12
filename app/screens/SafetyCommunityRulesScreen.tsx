
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SafetyCommunityRulesScreen() {
  const theme = useTheme();
  const router = useRouter();

  const rules = [
    { title: 'Be Respectful', description: 'Treat everyone with respect and kindness' },
    { title: 'No Harassment', description: 'Harassment of any kind is not tolerated' },
    { title: 'No Hate Speech', description: 'Hate speech and discrimination are prohibited' },
    { title: 'No Spam', description: 'Do not spam or post repetitive content' },
    { title: 'Follow Laws', description: 'All content must comply with applicable laws' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Community Rules</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {rules.map((rule, index) => (
          <View key={index} style={styles.ruleCard}>
            <Text style={[styles.ruleTitle, { color: theme.colors.text }]}>{rule.title}</Text>
            <Text style={[styles.ruleDescription, { color: '#666' }]}>{rule.description}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  ruleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ruleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
