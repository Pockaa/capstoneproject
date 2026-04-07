import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { SidebarLayout } from '../components/SidebarLayout';
import supabase from '../../../config/supabaseClient';

interface ScheduleViewerProps {
  onBack: () => void;
}

export function ScheduleViewer({ onBack }: ScheduleViewerProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, projects(name)')
        .order('date', { ascending: true });

      if (data && !error) {
        const mapped = data.map(item => ({
          ...item,
          task: item.task_name || 'Unnamed Task',
          site: item.projects?.name || 'Unknown Site',
          color: getStatusColor(item.status)
        }));
        setSchedules(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'In Progress') return '#3B82F6';
    if (status === 'Upcoming' || status === 'Scheduled') return '#10B981';
    if (status === 'Pending') return '#F59E0B';
    if (status === 'Delayed') return '#EF4444';
    return '#6366F1';
  };

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (Platform.OS !== 'web') {
    return (
      <SidebarLayout activeScreen="Schedules">
        <ScrollView
          style={mobileStyles.scroll}
          contentContainerStyle={mobileStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Header */}
          <View style={mobileStyles.pageHeader}>
            <Text style={mobileStyles.pageTitle}>Project Schedule</Text>
            <Text style={mobileStyles.pageSubtitle}>Upcoming tasks across all active sites</Text>
          </View>

          {/* Summary Chips */}
          {!loading && (
            <View style={mobileStyles.summaryRow}>
              <View style={[mobileStyles.summaryChip, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="progress-clock" size={16} color="#3B82F6" />
                <Text style={[mobileStyles.summaryChipText, { color: '#3B82F6' }]}>{schedules.filter(s => s.status === 'In Progress').length} In Progress</Text>
              </View>
              <View style={[mobileStyles.summaryChip, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="calendar-check" size={16} color="#10B981" />
                <Text style={[mobileStyles.summaryChipText, { color: '#10B981' }]}>{schedules.filter(s => s.status === 'Upcoming' || s.status === 'Scheduled').length} Scheduled</Text>
              </View>
              <View style={[mobileStyles.summaryChip, { backgroundColor: '#FFFBEB' }]}>
                <MaterialCommunityIcons name="clock-alert-outline" size={16} color="#F59E0B" />
                <Text style={[mobileStyles.summaryChipText, { color: '#F59E0B' }]}>{schedules.filter(s => s.status === 'Pending').length} Pending</Text>
              </View>
            </View>
          )}

          {/* Schedule Cards */}
          <View style={mobileStyles.listContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
            ) : schedules.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 20 }}>No schedules found.</Text>
            ) : (
              schedules.map((schedule) => {
              const dateObj = new Date(schedule.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <View key={schedule.id} style={[mobileStyles.card, { borderLeftColor: schedule.color }]}>
                  {/* Date blob */}
                  <View style={[mobileStyles.dateBlob, { backgroundColor: `${schedule.color}15` }]}>
                    <Text style={[mobileStyles.dateDay, { color: schedule.color }]}>{day}</Text>
                    <Text style={[mobileStyles.dateMonth, { color: schedule.color }]}>{month}</Text>
                    <Text style={[mobileStyles.dateWeekday, { color: schedule.color }]}>{weekday}</Text>
                  </View>

                  {/* Content */}
                  <View style={mobileStyles.cardContent}>
                    <View style={mobileStyles.cardTopRow}>
                      <Text style={mobileStyles.taskTitle} numberOfLines={1}>{schedule.task}</Text>
                      <View style={[mobileStyles.statusPill, { backgroundColor: `${schedule.color}20` }]}>
                        <Text style={[mobileStyles.statusText, { color: schedule.color }]}>{schedule.status}</Text>
                      </View>
                    </View>
                    <View style={mobileStyles.metaRow}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color="#94A3B8" />
                      <Text style={mobileStyles.metaText}>{schedule.time}</Text>
                    </View>
                    <View style={mobileStyles.metaRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={13} color="#94A3B8" />
                      <Text style={mobileStyles.metaText} numberOfLines={1}>{schedule.site}</Text>
                    </View>
                  </View>
                </View>
              );
            })
            )}
          </View>
        </ScrollView>
      </SidebarLayout>
    );
  }

  // ─── WEB LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <SidebarLayout activeScreen="Schedules">
      <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, !isLargeScreen && { padding: 16 }]}>
        <View style={styles.header}>
            <View style={styles.headerTopRow}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, !isLargeScreen && { fontSize: 24 }]}>Project Schedule</Text>
            </View>
            <Text style={[styles.headerSubtitle, !isLargeScreen && { marginLeft: 0 }]}>Upcoming tasks and timeline for all active sites.</Text>
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
          ) : schedules.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 20 }}>No schedules found.</Text>
          ) : (
            schedules.map((schedule) => {
             const dateObj = new Date(schedule.date);
             const day = dateObj.getDate();
             const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
             const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

            return (
              <View key={schedule.id} style={[styles.card, !isLargeScreen && { padding: 12, flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                <View style={[styles.dateBox, !isLargeScreen && { borderRightWidth: 0, paddingRight: 0, marginRight: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    <Text style={[styles.dateDay, !isLargeScreen && { fontSize: 20 }]}>{day}</Text>
                    <Text style={[styles.dateMonth, !isLargeScreen && { fontSize: 13 }]}>{month}</Text>
                </View>
                <View style={[styles.contentBox, !isLargeScreen && { width: '100%' }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.taskTitle, !isLargeScreen && { fontSize: 15 }]}>{schedule.task}</Text>
                        <View style={[styles.statusTag, { backgroundColor: `${schedule.color}20` }]}>
                            <Text style={[styles.statusText, { color: schedule.color }]}>{schedule.status}</Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="clock-time-four-outline" size={16} color="#6B7280" />
                            <Text style={styles.metaText}>{schedule.time}</Text>
                        </View>
                        <View style={styles.dividerDot} />
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#6B7280" />
                            <Text style={styles.metaText}>{schedule.site}</Text>
                        </View>
                    </View>
                    <Text style={[styles.weekdayText, !isLargeScreen && { display: 'none' }]}>{weekday}</Text>
                </View>
                {isLargeScreen && (
                    <View style={styles.actionBox}>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
                    </View>
                )}
              </View>
            );
          })
          )}
        </View>
      </ScrollView>
    </SidebarLayout>
  );
}

// ─── Mobile Styles ────────────────────────────────────────────────────────────
const mobileStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 32 },

  pageHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16, marginTop: 12 },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  summaryChipText: { fontSize: 12, fontWeight: '700' },

  listContainer: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  dateBlob: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  dateDay: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  dateMonth: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  dateWeekday: { fontSize: 10, fontWeight: '600', opacity: 0.7 },

  cardContent: { flex: 1, padding: 14, justifyContent: 'center', gap: 6 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#64748B', fontWeight: '500', flex: 1 },
});

// ─── Web Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', flex: 1 },
  contentContainer: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 32 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, color: '#6B7280', marginLeft: 48 },
  listContainer: { gap: 16, maxWidth: 800, width: '100%', alignSelf: 'flex-start' },
  card: {
    backgroundColor: 'white', borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 20,
    borderWidth: 1, borderColor: 'rgba(229, 231, 235, 0.6)',
    ...Platform.select({
      web: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s', cursor: 'pointer' },
      default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }
    }),
  },
  dateBox: { alignItems: 'center', justifyContent: 'center', paddingRight: 20, borderRightWidth: 1, borderRightColor: '#F3F4F6', marginRight: 20, minWidth: 60 },
  dateDay: { fontSize: 24, fontWeight: '800', color: '#1F2937', lineHeight: 28 },
  dateMonth: { fontSize: 14, fontWeight: '600', color: '#EF4444', textTransform: 'uppercase' },
  contentBox: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  weekdayText: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  actionBox: { marginLeft: 16 },
});
