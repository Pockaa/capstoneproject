import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  project: string;
  time: string;
  type: 'report' | 'alert' | 'update';
}

const mockActivity: ActivityItem[] = [
  { id: 1, user: 'John Doe', action: 'submitted Daily Log', project: 'Downtown Plaza', time: '10 mins ago', type: 'report' },
  { id: 2, user: 'Sarah Smith', action: 'reported Safety Incident', project: 'Highway Extension', time: '1 hour ago', type: 'alert' },
  { id: 3, user: 'Mike Johnson', action: 'updated progress', project: 'Residential Complex A', time: '3 hours ago', type: 'update' },
  { id: 4, user: 'Admin', action: 'approved Budget Revision', project: 'Downtown Plaza', time: '5 hours ago', type: 'update' },
];

export function ActivityFeed() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {mockActivity.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={[
              styles.iconContainer,
              item.type === 'alert' ? styles.bgRed :
              item.type === 'report' ? styles.bgBlue :
              styles.bgGreen
            ]}>
              {item.type === 'alert' ? <Feather name="alert-triangle" size={16} color="#dc2626" /> :
               item.type === 'report' ? <MaterialCommunityIcons name="file-document-outline" size={16} color="#2563eb" /> :
               <Feather name="check-circle" size={16} color="#16a34a" />}
            </View>
            
            <View style={styles.content}>
              <Text style={styles.message}>
                <Text style={styles.userName}>{item.user}</Text> {item.action}
              </Text>
              <Text style={styles.meta}>
                {item.project} • {item.time}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#f3f4f6',
    // shadow-sm
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#f8fafc' : '#111827', // gray-900
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#60a5fa' : '#2563eb', // blue-600
  },
  list: {
    gap: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16, // rounded-full
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4, // mt-1
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: isDark ? '#f8fafc' : '#111827', // gray-900
    lineHeight: 20,
  },
  userName: {
    fontWeight: '600', // font-medium
  },
  meta: {
    fontSize: 12, // text-xs
    color: isDark ? '#94a3b8' : '#6b7280', // gray-500
    marginTop: 4,
  },
  bgRed: { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }, // red-100
  bgBlue: { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }, // blue-100
  bgGreen: { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }, // green-100
});
