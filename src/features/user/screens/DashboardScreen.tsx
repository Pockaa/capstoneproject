import React from "react";
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity,useWindowDimensions,} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SidebarLayout } from '../components/SidebarLayout';

const DashboardScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const inventoryItems = [
    { id: 1, name: "Cement Bags (50kg)", current: 45, total: 200, unit: "bags", status: "low" },
    { id: 2, name: "Steel Rebar", current: 156, total: 200, unit: "units", status: "good" },
    { id: 3, name: "Plywood Sheets", current: 18, total: 100, unit: "sheets", status: "critical" },
    { id: 4, name: "Safety Helmets", current: 78, total: 100, unit: "pcs", status: "good" },
  ];

  const stats = [
    { label: "Total Items",   value: "247", icon: MaterialCommunityIcons, iconName: "package-variant", color: "#3b82f6" },
    { label: "Low Stock",     value: "8",   icon: MaterialCommunityIcons, iconName: "trending-down",   color: "#f97316" },
    { label: "Reports Today", value: "12",  icon: MaterialIcons,           iconName: "description",     color: "#22c55e" },
    { label: "Equipment Out", value: "15",  icon: MaterialCommunityIcons, iconName: "wrench",           color: "#a855f7" },
  ];

  const recentReports = [
    { id: 1, type: "Material Usage", time: "2h ago", status: "submitted", user: "Mike Ross" },
    { id: 2, type: "Safety Incident", time: "4h ago", status: "pending", user: "Sarah Lee" },
    { id: 3, type: "Daily Progress", time: "6h ago", status: "submitted", user: "David Kim" },
  ];

  const quickActions = [
    { label: "Schedules",   icon: "calendar-blank",      route: "Schedules",    color: "#6366f1" },
    { label: "Inventory",   icon: "package-variant",     route: "Inventory",    color: "#059669" },
    { label: "Report",      icon: "file-document-edit",  route: "SubmitReport", color: "#f97316" },
    { label: "View Logs",   icon: "clipboard-list",      route: "Dashboard",   color: "#8b5cf6" },
  ];

  // ─── MOBILE LAYOUT ────────────────────────────────────────────────────────
  if (Platform.OS !== 'web') {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
      <SidebarLayout activeScreen="Dashboard">
        <ScrollView
          style={mobileStyles.scroll}
          contentContainerStyle={mobileStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting Banner */}
          <View style={mobileStyles.banner}>
            <View style={mobileStyles.bannerTextBlock}>
              <Text style={mobileStyles.bannerGreeting}>Good morning 👋</Text>
              <Text style={mobileStyles.bannerName}>Welcome back, User</Text>
              <Text style={mobileStyles.bannerDate}>{today}</Text>
            </View>
            <View style={mobileStyles.bannerBadge}>
              <MaterialCommunityIcons name="hard-hat" size={32} color="#fff" />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={mobileStyles.section}>
            <Text style={mobileStyles.sectionTitle}>Quick Actions</Text>
            <View style={mobileStyles.quickGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={mobileStyles.quickTile}
                  onPress={() => navigation.navigate(action.route)}
                  activeOpacity={0.75}
                >
                  <View style={[mobileStyles.quickIcon, { backgroundColor: action.color }]}>
                    <MaterialCommunityIcons name={action.icon as any} size={22} color="#fff" />
                  </View>
                  <Text style={[mobileStyles.quickLabel, { color: action.color }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats Row */}
          <View style={mobileStyles.section}>
            <Text style={mobileStyles.sectionTitle}>Overview</Text>
            <View style={mobileStyles.statsRow}>
              {stats.map((stat, i) => {
                const IconComponent = stat.icon;
                return (
                  <View key={i} style={mobileStyles.statChip}>
                    <View style={[mobileStyles.statIconBadge, { backgroundColor: stat.color + '18' }]}>
                      <IconComponent name={stat.iconName as any} size={18} color={stat.color} />
                    </View>
                    <Text style={[mobileStyles.statChipValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={mobileStyles.statChipLabel}>{stat.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Inventory Status */}
          <View style={mobileStyles.section}>
            <View style={mobileStyles.sectionHeader}>
              <Text style={mobileStyles.sectionTitle}>Inventory Status</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
                <Text style={mobileStyles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <View style={mobileStyles.card}>
              {inventoryItems.map((item, i) => {
                const pct = Math.round((item.current / item.total) * 100);
                const barColor = item.status === 'critical' ? '#ef4444' : item.status === 'low' ? '#f59e0b' : '#10b981';
                return (
                  <View key={item.id} style={[mobileStyles.inventoryRow, i < inventoryItems.length - 1 && mobileStyles.rowDivider]}>
                    <View style={mobileStyles.inventoryMeta}>
                      <View style={[mobileStyles.statusDot, { backgroundColor: barColor }]} />
                      <Text style={mobileStyles.inventoryName}>{item.name}</Text>
                    </View>
                    <View style={mobileStyles.progressTrack}>
                      <View style={[mobileStyles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                    </View>
                    <Text style={mobileStyles.inventoryCount}>{item.current}<Text style={mobileStyles.inventoryTotal}>/{item.total}</Text></Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Reports */}
          <View style={mobileStyles.section}>
            <View style={mobileStyles.sectionHeader}>
              <Text style={mobileStyles.sectionTitle}>Recent Reports</Text>
              <TouchableOpacity>
                <Text style={mobileStyles.seeAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            <View style={mobileStyles.card}>
              {recentReports.map((r, i) => (
                <View key={r.id} style={[mobileStyles.reportRow, i < recentReports.length - 1 && mobileStyles.rowDivider]}>
                  <View style={mobileStyles.reportIcon}>
                    <MaterialCommunityIcons
                      name={r.type.includes('Safety') ? 'alert-circle-outline' : 'file-document-outline'}
                      size={20}
                      color={r.type.includes('Safety') ? '#ef4444' : '#6b7280'}
                    />
                  </View>
                  <View style={mobileStyles.reportInfo}>
                    <Text style={mobileStyles.reportType}>{r.type}</Text>
                    <Text style={mobileStyles.reportMeta}>{r.user} · {r.time}</Text>
                  </View>
                  <View style={[mobileStyles.badge, r.status === 'submitted' ? mobileStyles.badgeGreen : mobileStyles.badgeAmber]}>
                    <Text style={[mobileStyles.badgeText, r.status === 'submitted' ? mobileStyles.badgeTextGreen : mobileStyles.badgeTextAmber]}>
                      {r.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Submit Report CTA */}
          <TouchableOpacity
            style={mobileStyles.ctaButton}
            onPress={() => navigation.navigate('SubmitReport')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#fff" />
            <Text style={mobileStyles.ctaText}>Submit Daily Report</Text>
          </TouchableOpacity>
        </ScrollView>
      </SidebarLayout>
    );
  }

  // ─── WEB LAYOUT ───────────────────────────────────────────────────────────
  const renderStats = () => (
    <View style={[styles.statsContainer, !isLargeScreen && { gap: 12 }]}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <View key={index} style={[styles.statCard, !isLargeScreen && { padding: 16, minWidth: '47%' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.color + '18' }, !isLargeScreen && { width: 44, height: 44, borderRadius: 12 }]}>
               <IconComponent name={stat.iconName as any} size={isLargeScreen ? 28 : 22} color={stat.color} />
            </View>
            <View style={styles.statTextContainer}>
                <Text style={[styles.statValue, !isLargeScreen && { fontSize: 24 }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, !isLargeScreen && { fontSize: 13 }]}>{stat.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderInventory = () => (
    <View style={[styles.contentCard, isLargeScreen && { flex: 1 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
            <View style={[styles.iconSmall, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="package-variant-closed" size={20} color="#059669" />
            </View>
            <Text style={styles.cardTitle}>Inventory Status</Text>
        </View>
        <Text style={styles.seeAllText}>See All</Text>
      </View>
      <View style={styles.cardContent}>
        {inventoryItems.map((item) => {
          const percentage = (item.current / item.total) * 100;
          let progressColor = "#10B981";
          if (item.status === 'low') progressColor = "#F59E0B";
          if (item.status === 'critical') progressColor = "#EF4444";

          return (
            <View key={item.id} style={styles.inventoryItem}>
              <View style={styles.inventoryHeader}>
                <Text style={styles.inventoryName}>{item.name}</Text>
                <Text style={styles.inventoryQuantity}>
                    <Text style={{fontWeight: '700', color: '#111827'}}>{item.current}</Text>
                    <Text style={{color: '#9CA3AF'}}> / {item.total} {item.unit}</Text>
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderReports = () => (
    <View style={[styles.contentCard, isLargeScreen && { flex: 1 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
             <View style={[styles.iconSmall, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="analytics" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Recent Reports</Text>
        </View>
        <Text style={styles.seeAllText}>View All</Text>
      </View>
      <View style={styles.cardContent}>
        {recentReports.map((report) => (
          <View key={report.id} style={styles.reportItem}>
            <View style={[styles.reportIconCircle, report.type.includes("Safety") ? { backgroundColor: '#FEF2F2' } : { backgroundColor: '#F3F4F6' }]}>
                 <MaterialCommunityIcons
                  name={report.type.includes("Safety") ? "alert-circle-outline" : "file-document-outline"}
                  size={22}
                  color={report.type.includes("Safety") ? "#EF4444" : "#6B7280"}
                />
            </View>
            <View style={styles.reportInfo}>
                <Text style={styles.reportType}>{report.type}</Text>
                <Text style={styles.reportMeta}>{report.user} • {report.time}</Text>
            </View>
            <View style={report.status === "submitted" ? styles.badgeSuccess : styles.badgeWarning}>
              <Text style={report.status === "submitted" ? styles.badgeTextSuccess : styles.badgeTextWarning}>
                  {report.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SidebarLayout activeScreen="Dashboard">
        <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, !isLargeScreen && { padding: 16 }]}>
            <View style={[styles.header, !isLargeScreen && { marginBottom: 24 }]}>
                <Text style={[styles.welcomeText, !isLargeScreen && { fontSize: 24 }]}>Welcome back, User</Text>
                <Text style={[styles.dateText, !isLargeScreen && { fontSize: 14 }]}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>
            {renderStats()}
            <View style={[styles.gridRow, !isLargeScreen && styles.gridRowVertical]}>
                {renderInventory()}
                {renderReports()}
            </View>
        </ScrollView>
    </SidebarLayout>
  );
};

// ─── Mobile Styles ────────────────────────────────────────────────────────────
const mobileStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 32 },

  banner: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#ea580c',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerTextBlock: { flex: 1 },
  bannerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 2 },
  bannerName: { fontSize: 20, color: '#fff', fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  bannerDate: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  bannerBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#f97316', fontWeight: '600', marginBottom: 12 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickTile: {
    width: '47%', borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statChip: {
    width: '47%', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIconBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statChipValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statChipLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inventoryRow: { paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  inventoryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  inventoryName: { fontSize: 14, fontWeight: '600', color: '#334155', flex: 1 },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  inventoryCount: { fontSize: 13, fontWeight: '700', color: '#1e293b', textAlign: 'right' },
  inventoryTotal: { fontWeight: '400', color: '#94a3b8' },

  reportRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  reportIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  reportInfo: { flex: 1 },
  reportType: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  reportMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeAmber: { backgroundColor: '#fffbeb' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  badgeTextGreen: { color: '#166534' },
  badgeTextAmber: { color: '#b45309' },

  ctaButton: {
    marginHorizontal: 16, marginTop: 24,
    backgroundColor: '#ea580c',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 10,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ─── Web Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { padding: 24, paddingBottom: 40, maxWidth: 1400, alignSelf: 'center', width: '100%' },
  header: { marginBottom: 32 },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 8, letterSpacing: -0.5 },
  dateText: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  statsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 20, marginBottom: 32 },
  statCard: {
    flex: 1, minWidth: 150, backgroundColor: "white", borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' },
      default: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 }
    }),
    flexDirection: 'column', alignItems: 'flex-start', gap: 16,
  },
  statIconContainer: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  statTextContainer: { flex: 1 },
  statLabel: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  statValue: { fontSize: 32, fontWeight: "800", color: "#0F172A", marginBottom: 4, letterSpacing: -1 },
  gridRow: { flexDirection: 'row', gap: 24 },
  gridRowVertical: { flexDirection: 'column', gap: 16 },
  contentCard: {
    backgroundColor: "white", borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)' },
      default: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8 }
    }),
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconSmall: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  seeAllText: { fontSize: 14, color: "#3B82F6", fontWeight: "600" },
  cardContent: { gap: 24 },
  inventoryItem: { gap: 10 },
  inventoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  inventoryName: { fontSize: 15, fontWeight: '600', color: "#334155" },
  inventoryQuantity: { fontSize: 14, color: "#64748B" },
  progressBarBg: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  reportItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingVertical: 8 },
  reportIconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reportInfo: { flex: 1 },
  reportType: { fontSize: 15, fontWeight: '600', color: "#1E293B" },
  reportMeta: { fontSize: 13, color: "#94A3B8", marginTop: 2, fontWeight: '500' },
  badgeSuccess: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DCFCE7' },
  badgeTextSuccess: { color: '#166534', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeWarning: { backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FEF3C7' },
  badgeTextWarning: { color: '#B45309', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default DashboardScreen;
