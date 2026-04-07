import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: (props: { size: number; color: string }) => React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  onPress?: () => void;
}

export function StatCard({ title, value, change, icon: Icon, trend, onPress }: StatCardProps) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Icon size={24} color="#2563eb" />
        </View>
      </View>
      
      {change && (
        <View style={styles.footer}>
          <Text
            style={[
              styles.changeText,
              trend === 'up' ? styles.textGreen : trend === 'down' ? styles.textRed : styles.textGray,
            ]}
          >
            {change}
          </Text>
          <Text style={styles.changeLabel}>vs last month</Text>
        </View>
      )}
    </CardComponent>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    padding: 24,
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#f3f4f6', // gray-100
    // shadow-sm logic
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0, // No margin needed here as value is inside
  },
  title: {
    fontSize: 14,
    fontWeight: '500', 
    color: isDark ? '#94a3b8' : '#6b7280', // gray-500
  },
  value: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold',
    color: isDark ? '#f8fafc' : '#111827', // gray-900
    marginTop: 4, // mt-1
  },
  iconContainer: {
    padding: 12, // p-3
    borderRadius: 8, // rounded-lg
    backgroundColor: isDark ? '#0f172a' : '#eff6ff', 
  },
  footer: {
    marginTop: 16, // mt-4
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500', // font-medium
  },
  changeLabel: {
    color: isDark ? '#94a3b8' : '#6b7280', // gray-500
    marginLeft: 8, // ml-2
    fontSize: 14,
  },
  textGreen: { color: isDark ? '#34d399' : '#16a34a' },
  textRed: { color: isDark ? '#f87171' : '#dc2626' },
  textGray: { color: isDark ? '#cbd5e1' : '#4b5563' },
});
