import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatCard } from '../components/dashboard/StatCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { ReportsBarChart } from '../components/dashboard/ReportsBarChart';
import { ReportModal } from '../components/reports/ReportModal';
import { ActiveProjectsModal } from '../components/dashboard/ActiveProjectsModal';
import { PendingReportsModal } from '../components/dashboard/PendingReportsModal';
import { useTheme } from '../../../context/ThemeContext';
import supabase from '../../../config/supabaseClient';

export function Dashboard() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isMediumScreen = width >= 768;
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isActiveProjectsModalOpen, setIsActiveProjectsModalOpen] = useState(false);
  const [isPendingReportsModalOpen, setIsPendingReportsModalOpen] = useState(false);

  const [stats, setStats] = useState({
    activeProjects: 0,
    workersOnSite: 0,
    pendingReports: 0,
    safetyIncidents: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchRecentReports();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [
        { count: activeProjectsCount },
        { count: workersCount },
        { count: pendingReportsCount },
        { count: safetyIncidentsCount }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('type', 'Incident Report')
      ]);

      setStats({
        activeProjects: activeProjectsCount || 0,
        workersOnSite: workersCount || 0,
        pendingReports: pendingReportsCount || 0,
        safetyIncidents: safetyIncidentsCount || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentReports = async () => {
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) {
        setRecentReports(data);
      } else if (error) {
        console.error('Error fetching recent reports:', error);
      }
    } catch (err) {
      console.error('Error in fetchRecentReports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={true}>
      {/* Stat Cards Grid */}
      <View style={styles.gridContainer}>
        <View style={[styles.statWrapper, isLargeScreen ? { width: '23%' } : isMediumScreen ? { width: '48%' } : { width: '100%' }]}>
          <StatCard
            title="Active Projects"
            value={loadingStats ? "..." : stats.activeProjects.toString()}
            icon={(props) => <MaterialCommunityIcons name="hard-hat" size={props.size} color={props.color} />}
            onPress={() => setIsActiveProjectsModalOpen(true)}
          />
        </View>
        <View style={[styles.statWrapper, isLargeScreen ? { width: '23%' } : isMediumScreen ? { width: '48%' } : { width: '100%' }]}>
          <StatCard
            title="Workers On Site"
            value={loadingStats ? "..." : stats.workersOnSite.toString()}
            icon={(props) => <Feather name="check-circle" size={props.size} color={props.color} />}
          />
        </View>
        <View style={[styles.statWrapper, isLargeScreen ? { width: '23%' } : isMediumScreen ? { width: '48%' } : { width: '100%' }]}>
          <StatCard
            title="Pending Reports"
            value={loadingStats ? "..." : stats.pendingReports.toString()}
            icon={(props) => <MaterialCommunityIcons name="file-document-outline" size={props.size} color={props.color} />}
            onPress={() => setIsPendingReportsModalOpen(true)}
          />
        </View>
        <View style={[styles.statWrapper, isLargeScreen ? { width: '23%' } : isMediumScreen ? { width: '48%' } : { width: '100%' }]}>
          <StatCard
            title="Safety Incidents"
            value={loadingStats ? "..." : stats.safetyIncidents.toString()}
            icon={(props) => <Feather name="alert-triangle" size={props.size} color={props.color} />}
          />
        </View>
      </View>

      {/* Main Content Grid: Chart + Recent Reports Table */}
      <View style={styles.mainGrid}>
        {/* Chart Section - Flex 2 on large screens */}
        <View style={[styles.chartWrapper, isLargeScreen ? { flex: 2 } : { width: '100%' }]}>
             {/* Chart Width Calculation: 
                 Large Screen: (Window Width - Sidebar(260) - Padding(48) - Gap(24)) * 0.65 approx flex ratio
                 Small Screen: Window Width - Padding(48)
             */}
          <ReportsBarChart width={isLargeScreen ? (width - 260 - 48 - 24) * 0.65 : width - 80} />
        </View>

        {/* Recent Reports Table Section - Flex 1 on large screens */}
        <View style={[styles.tableWrapper, isLargeScreen ? { flex: 1 } : { width: '100%' }]}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
               <Text style={styles.cardTitle}>Recent Reports</Text>
               <TouchableOpacity>
                 <Text style={styles.viewLink}>View All</Text>
               </TouchableOpacity>
            </View>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 2 }]}>Project</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Status</Text>
              </View>
              {/* Table Body */}
              {loadingReports ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
              ) : recentReports.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>No recent reports available.</Text>
                </View>
              ) : (
                recentReports.map((report, idx) => (
                  <TouchableOpacity 
                    key={report.id || idx} 
                    style={styles.tableRow}
                    onPress={() => {
                      setSelectedReport(report);
                      setIsModalOpen(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 2 }}>
                      <Text style={styles.cellProject}>{report.projects?.name || report.project || 'Unknown Project'}</Text>
                      <Text style={styles.cellDate}>
                        {report.date ? new Date(report.date).toLocaleDateString() : 
                         report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <View style={[
                        styles.statusBadge,
                        report.status === 'Approved' ? styles.bgGreen :
                        report.status === 'Pending' ? styles.bgYellow :
                        styles.bgBlue
                      ]}>
                        <Text style={[
                          styles.statusText,
                          report.status === 'Approved' ? styles.textGreen :
                          report.status === 'Pending' ? styles.textYellow :
                          styles.textBlue
                        ]}>{report.status || 'Unknown'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Activity Feed Section */}
      <View style={styles.section}>
         <ActivityFeed />
      </View>

      <ReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        report={selectedReport} 
      />

      {isActiveProjectsModalOpen && (
        <ActiveProjectsModal 
          isOpen={isActiveProjectsModalOpen} 
          onClose={() => setIsActiveProjectsModalOpen(false)} 
        />
      )}

      {isPendingReportsModalOpen && (
        <PendingReportsModal 
          isOpen={isPendingReportsModalOpen} 
          onClose={() => setIsPendingReportsModalOpen(false)} 
        />
      )}
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f9fafb',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statWrapper: {
    minWidth: 200,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 24,
  },
  chartWrapper: {
    minWidth: 500,
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableWrapper: {
    minWidth: 300,
  },
  section: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e5e7eb',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    height: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#f8fafc' : '#111827',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f3f4f6',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#9ca3af',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f9fafb',
  },
  cellProject: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#f8fafc' : '#111827',
  },
  cellDate: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#9ca3af',
    marginTop: 2, 
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  bgGreen: { backgroundColor: '#dcfce7' },
  bgYellow: { backgroundColor: '#fef9c3' },
  bgBlue: { backgroundColor: '#dbeafe' },
  textGreen: { color: '#166534' },
  textYellow: { color: '#854d0e' },
  textBlue: { color: '#1e40af' },
});
