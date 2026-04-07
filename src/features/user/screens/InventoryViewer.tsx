import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { SidebarLayout } from '../components/SidebarLayout';

interface InventoryViewerProps {
  onBack: () => void;
}

const inventory = [
  { id: '1', name: 'Cement (50kg bags)', quantity: 450, maxCapacity: 600, unit: 'bags', status: 'In Stock', location: 'Warehouse A', minThreshold: 100 },
  { id: '2', name: 'Steel Rebar (Grade 60)', quantity: 85, maxCapacity: 200, unit: 'tons', status: 'In Stock', location: 'Warehouse B', minThreshold: 50 },
  { id: '3', name: 'Concrete Blocks', quantity: 2400, maxCapacity: 3000, unit: 'units', status: 'In Stock', location: 'Storage Yard', minThreshold: 1000 },
  { id: '4', name: 'Electrical Cables', quantity: 35, maxCapacity: 100, unit: 'rolls', status: 'Low Stock', location: 'Warehouse A', minThreshold: 40 },
  { id: '5', name: 'Paint (White)', quantity: 15, maxCapacity: 50, unit: 'gallons', status: 'Low Stock', location: 'Storage Room 2', minThreshold: 20 },
  { id: '6', name: 'PVC Pipes (4")', quantity: 280, maxCapacity: 400, unit: 'units', status: 'In Stock', location: 'Warehouse C', minThreshold: 100 },
  { id: '7', name: 'Safety Helmets', quantity: 125, maxCapacity: 200, unit: 'units', status: 'In Stock', location: 'Equipment Room', minThreshold: 50 },
];

export function InventoryViewer({ onBack }: InventoryViewerProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (Platform.OS !== 'web') {
    const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
    const inStockCount = inventory.filter(i => i.status === 'In Stock').length;

    return (
      <SidebarLayout activeScreen="Inventory">
        <ScrollView
          style={mobileStyles.scroll}
          contentContainerStyle={mobileStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={mobileStyles.pageHeader}>
            <Text style={mobileStyles.pageTitle}>Inventory</Text>
            <Text style={mobileStyles.pageSubtitle}>Track materials across all warehouse sites</Text>
          </View>

          {/* Summary Row */}
          <View style={mobileStyles.summaryRow}>
            <View style={[mobileStyles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={20} color="#059669" />
              <Text style={[mobileStyles.summaryValue, { color: '#059669' }]}>{inStockCount}</Text>
              <Text style={[mobileStyles.summaryLabel, { color: '#059669' }]}>In Stock</Text>
            </View>
            <View style={[mobileStyles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="alert-outline" size={20} color="#D97706" />
              <Text style={[mobileStyles.summaryValue, { color: '#D97706' }]}>{lowStockCount}</Text>
              <Text style={[mobileStyles.summaryLabel, { color: '#D97706' }]}>Low Stock</Text>
            </View>
            <View style={[mobileStyles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="warehouse" size={20} color="#3B82F6" />
              <Text style={[mobileStyles.summaryValue, { color: '#3B82F6' }]}>{inventory.length}</Text>
              <Text style={[mobileStyles.summaryLabel, { color: '#3B82F6' }]}>Total Items</Text>
            </View>
          </View>

          {/* Item List */}
          <View style={mobileStyles.listContainer}>
            {inventory.map((item) => {
              const pct = Math.min((item.quantity / item.maxCapacity) * 100, 100);
              const isLow = item.status === 'Low Stock';
              const barColor = isLow ? '#F59E0B' : '#10B981';
              const iconBg = isLow ? '#FEF3C7' : '#D1FAE5';
              const iconColor = isLow ? '#B45309' : '#047857';

              return (
                <View key={item.id} style={mobileStyles.card}>
                  <View style={mobileStyles.cardTop}>
                    <View style={[mobileStyles.iconBox, { backgroundColor: iconBg }]}>
                      <MaterialCommunityIcons
                        name={isLow ? 'alert-outline' : 'package-variant-closed'}
                        size={20}
                        color={iconColor}
                      />
                    </View>
                    <View style={mobileStyles.cardInfo}>
                      <Text style={mobileStyles.itemName} numberOfLines={1}>{item.name}</Text>
                      <View style={mobileStyles.locationRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#94A3B8" />
                        <Text style={mobileStyles.locationText}>{item.location}</Text>
                      </View>
                    </View>
                    <View style={[mobileStyles.statusBadge, isLow ? mobileStyles.statusBadgeLow : mobileStyles.statusBadgeGood]}>
                      <Text style={[mobileStyles.statusText, isLow ? mobileStyles.statusTextLow : mobileStyles.statusTextGood]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View style={mobileStyles.cardBottom}>
                    <View style={mobileStyles.quantityRow}>
                      <Text style={mobileStyles.quantityLabel}>Available</Text>
                      <Text style={mobileStyles.quantityValue}>
                        <Text style={{ color: isLow ? '#D97706' : '#111827' }}>{item.quantity}</Text>
                        <Text style={mobileStyles.quantityMax}> / {item.maxCapacity} {item.unit}</Text>
                      </Text>
                    </View>
                    <View style={mobileStyles.progressTrack}>
                      <View style={[mobileStyles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                    </View>
                    <View style={mobileStyles.thresholdRow}>
                      <Text style={mobileStyles.thresholdText}>Min: {item.minThreshold} {item.unit}</Text>
                      <Text style={mobileStyles.pctText}>{Math.round(pct)}%</Text>
                    </View>
                  </View>

                  {isLow && (
                    <TouchableOpacity style={mobileStyles.restockBtn} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="clipboard-plus-outline" size={15} color="#fff" />
                      <Text style={mobileStyles.restockText}>Request Restock</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SidebarLayout>
    );
  }

  // ─── WEB LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <SidebarLayout activeScreen="Inventory">
      <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, !isLargeScreen && { padding: 16 }]}>
        <View style={styles.header}>
            <View style={styles.headerTopRow}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, !isLargeScreen && { fontSize: 24 }]}>Inventory Overview</Text>
            </View>
            <Text style={[styles.headerSubtitle, !isLargeScreen && { marginLeft: 0 }]}>Manage and track construction materials across all sites.</Text>
        </View>

        <View style={styles.cardContainer}>
          {inventory.map((item) => {
            const percentage = Math.min((item.quantity / item.maxCapacity) * 100, 100);
            const isLowStock = item.status === 'Low Stock';

            return (
                <View key={item.id} style={[styles.card, isLargeScreen ? styles.cardLarge : { padding: 16 }]}>
                    <View style={[styles.cardHeader, !isLargeScreen && { flexDirection: 'column', gap: 12 }]}>
                        <View style={[styles.iconBox, isLowStock ? styles.iconBoxWarning : styles.iconBoxSuccess, !isLargeScreen && { marginBottom: 4 }]}>
                            <MaterialCommunityIcons name={isLowStock ? "alert-outline" : "package-variant-closed"} size={24} color={isLowStock ? "#B45309" : "#047857"} />
                        </View>
                        <View style={styles.headerTextWrapper}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.locationRow}>
                                <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.colors.textTertiary} />
                                <Text style={styles.locationText}>{item.location}</Text>
                            </View>
                        </View>
                        {isLargeScreen && (
                            <View style={[styles.statusBadge, isLowStock ? styles.statusBadgeWarning : styles.statusBadgeSuccess]}>
                                <Text style={[styles.statusText, isLowStock ? styles.statusTextWarning : styles.statusTextSuccess]}>{item.status}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardBody}>
                        <View style={styles.quantityRow}>
                            <Text style={styles.quantityLabel}>Available Stock</Text>
                            <Text style={styles.quantityValue}>
                                {item.quantity} <Text style={styles.quantityUnit}>{item.unit}</Text>
                            </Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: isLowStock ? '#F59E0B' : '#10B981' }]} />
                        </View>
                        <View style={styles.statsRow}>
                            <Text style={styles.thresholdText}>Min: {item.minThreshold} {item.unit}</Text>
                            <Text style={styles.capacityText}>Cap: {item.maxCapacity}</Text>
                        </View>
                    </View>

                    {isLowStock && (
                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                            <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color="white" />
                            <Text style={styles.actionButtonText}>Restock Request</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
          })}
        </View>
      </ScrollView>
    </SidebarLayout>
  );
}

// ─── Mobile Styles ────────────────────────────────────────────────────────────
const mobileStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 32 },

  pageHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginVertical: 16 },
  summaryCard: {
    flex: 1, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', gap: 4,
  },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },

  listContainer: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusBadgeLow: { backgroundColor: '#FEF3C7' },
  statusBadgeGood: { backgroundColor: '#DCFCE7' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statusTextLow: { color: '#B45309' },
  statusTextGood: { color: '#166534' },

  cardBottom: { gap: 8 },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  quantityValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  quantityMax: { fontWeight: '400', color: '#94A3B8', fontSize: 12 },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-between' },
  thresholdText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  pctText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  restockBtn: {
    marginTop: 12, backgroundColor: '#F59E0B',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  restockText: { color: '#fff', fontSize: 13, fontWeight: '700' },
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
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  card: {
    backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%',
    borderWidth: 1, borderColor: 'rgba(229, 231, 235, 0.6)',
    ...Platform.select({
      web: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)' },
      default: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }
    }),
  },
  cardLarge: { width: '48%', flexBasis: '48%' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconBoxSuccess: { backgroundColor: '#D1FAE5' },
  iconBoxWarning: { backgroundColor: '#FEF3C7' },
  headerTextWrapper: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeSuccess: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#bbf7d0' },
  statusBadgeWarning: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusTextSuccess: { color: '#166534' },
  statusTextWarning: { color: '#D97706' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: -24, marginBottom: 20 },
  cardBody: { gap: 12 },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  quantityLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  quantityValue: { fontSize: 24, fontWeight: '800', color: '#111827', lineHeight: 28 },
  quantityUnit: { fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginLeft: 2 },
  progressTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  thresholdText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  capacityText: { fontSize: 12, color: '#9CA3AF' },
  actionButton: {
    marginTop: 20, backgroundColor: '#F59E0B',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 8,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.2s' } }),
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  actionButtonText: { color: 'white', fontSize: 14, fontWeight: '700' },
});
