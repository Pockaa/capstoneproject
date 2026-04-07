import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export function PlaceholderPage({ title }: { title: string }) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="hard-hat" size={32} color={isDark ? "#d1d5db" : "#9ca3af"} />
        </View>
        <Text style={styles.subTitle}>Work in Progress</Text>
        <Text style={styles.description}>
          The {title} module is currently under development. Check back soon for updates.
        </Text>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#f9fafb' : '#111827',
    marginBottom: 16,
  },
  card: {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#374151' : '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: isDark ? '#374151' : '#f9fafb',
    padding: 16,
    borderRadius: 32, // round
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: isDark ? '#f9fafb' : '#111827',
    marginBottom: 8,
  },
  description: {
    color: isDark ? '#9ca3af' : '#6b7280',
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 20,
  },
});
