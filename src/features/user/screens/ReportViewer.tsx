import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Report } from '../../../../App';
import { SidebarLayout } from '../components/SidebarLayout';

interface ReportViewerProps {
  report: Omit<Report, 'id' | 'submittedAt'> | Report | null;
  mode: 'preview' | 'submitted';
  onSubmit?: () => void;
  onBackToEdit?: () => void;
  onSend?: () => void;
  onBack: () => void;
}

export function ReportViewer({ report, mode, onSubmit, onBackToEdit, onSend, onBack }: ReportViewerProps) {
  if (!report) return null;

  const isSubmitted = mode === 'submitted' && 'submittedAt' in report;
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const headerColor = mode === 'preview' ? '#3B82F6' : '#10B981';
  const headerIcon = mode === 'preview' ? 'file-document-edit-outline' : 'check-decagram-outline';
  const headerTitle = mode === 'preview' ? 'Review Submission' : 'Submission Successful';
  const headerSubtitle = mode === 'preview'
    ? 'Verify the details below before finalising.'
    : `Submitted on ${new Date((report as Report).submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (Platform.OS !== 'web') {
    return (
      <ScrollView
        style={mobileStyles.scroll}
        contentContainerStyle={mobileStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={[mobileStyles.heroBanner, { backgroundColor: headerColor }]}>
          <View style={mobileStyles.heroIcon}>
            <MaterialCommunityIcons name={headerIcon as any} size={36} color="#fff" />
          </View>
          <Text style={mobileStyles.heroTitle}>{headerTitle}</Text>
          <Text style={mobileStyles.heroSubtitle}>{headerSubtitle}</Text>
        </View>

        {/* Content Cards */}
        <View style={mobileStyles.content}>

          {/* Date */}
          <View style={mobileStyles.card}>
            <View style={mobileStyles.cardRow}>
              <View style={[mobileStyles.cardIcon, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="calendar-range" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mobileStyles.cardLabel}>Report Date</Text>
                <Text style={mobileStyles.cardValue}>
                  {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>

          {/* Task Done */}
          <View style={mobileStyles.card}>
            <View style={mobileStyles.cardTitleRow}>
              <View style={[mobileStyles.cardIcon, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color="#10B981" />
              </View>
              <Text style={mobileStyles.cardSectionLabel}>Task Completed</Text>
            </View>
            <Text style={mobileStyles.cardBody}>{report.taskDone}</Text>
          </View>

          {/* Current Task */}
          <View style={mobileStyles.card}>
            <View style={mobileStyles.cardTitleRow}>
              <View style={[mobileStyles.cardIcon, { backgroundColor: '#FFFBEB' }]}>
                <MaterialCommunityIcons name="progress-clock" size={20} color="#F59E0B" />
              </View>
              <Text style={mobileStyles.cardSectionLabel}>Work In Progress</Text>
            </View>
            <Text style={mobileStyles.cardBody}>{report.currentTask}</Text>
          </View>

          {/* Materials Grid */}
          <View style={mobileStyles.materialsRow}>
            <View style={[mobileStyles.materialCard, { flex: 1 }]}>
              <Text style={mobileStyles.materialLabel}>Materials Used</Text>
              <Text style={mobileStyles.materialValue}>{report.materialUsed || 'None'}</Text>
            </View>
            <View style={[mobileStyles.materialCard, { flex: 1 }]}>
              <Text style={mobileStyles.materialLabel}>Materials Requested</Text>
              <Text style={mobileStyles.materialValue}>{report.materialRequest || 'None'}</Text>
            </View>
          </View>

          {/* Photos */}
          {((report.imageUrls && report.imageUrls.length > 0) || report.imageUrl) && (
            <View style={mobileStyles.card}>
              <View style={mobileStyles.cardTitleRow}>
                <View style={[mobileStyles.cardIcon, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialCommunityIcons name="camera" size={20} color="#9333EA" />
                </View>
                <Text style={mobileStyles.cardSectionLabel}>Site Photos</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {(report.imageUrls && report.imageUrls.length > 0 ? report.imageUrls : [report.imageUrl!]).map((uri, i) => (
                  <Image key={i} source={{ uri }} style={[mobileStyles.photo, { width: 220, marginRight: 8 }]} resizeMode="cover" />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          {mode === 'preview' ? (
            <View style={mobileStyles.buttonGroup}>
              <TouchableOpacity style={mobileStyles.secondaryBtn} onPress={onBackToEdit} activeOpacity={0.7}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#374151" />
                <Text style={mobileStyles.secondaryBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[mobileStyles.primaryBtn, { backgroundColor: headerColor }]} onPress={onSubmit} activeOpacity={0.85}>
                <MaterialCommunityIcons name="send-outline" size={18} color="#fff" />
                <Text style={mobileStyles.primaryBtnText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[mobileStyles.primaryBtn, { backgroundColor: '#10B981' }]} onPress={onBack} activeOpacity={0.85}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
              <Text style={mobileStyles.primaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // ─── WEB LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <SidebarLayout activeScreen="SubmitReport">
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Navigation */}
      <View style={styles.navHeader}>
         <TouchableOpacity onPress={onBack} style={styles.navBackButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
            <Text style={styles.navBackText}>Back to Dashboard</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.mainWrapper}>
        <View style={[styles.card, isLargeScreen && styles.cardLarge]}>

          {/* Card Header */}
          <View style={[styles.cardHeader, { backgroundColor: headerColor }, !isLargeScreen && { padding: 24 }]}>
            <View style={[styles.headerContent, !isLargeScreen && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MaterialCommunityIcons name={headerIcon as any} size={32} color="white" />
                </View>
                <View>
                    <Text style={styles.headerTitleText}>{headerTitle}</Text>
                    <Text style={styles.headerSubtitleText}>{headerSubtitle}</Text>
                </View>
            </View>
          </View>

          {/* Card Body */}
          <View style={[styles.cardBody, !isLargeScreen && { padding: 16 }]}>

            {/* Date */}
            <View style={styles.metaSection}>
                <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="calendar-range" size={20} color="#6B7280" />
                    <Text style={styles.metaLabel}>Report Date:</Text>
                    <Text style={styles.metaValue}>
                        {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Task Done */}
            <View style={styles.sectionRow}>
                <View style={styles.sectionIcon}>
                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Task Completed</Text>
                    <Text style={styles.sectionText}>{report.taskDone}</Text>
                </View>
            </View>

            {/* Current Task */}
            <View style={styles.sectionRow}>
                <View style={styles.sectionIcon}>
                    <MaterialCommunityIcons name="progress-clock" size={24} color="#F59E0B" />
                </View>
                <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Work In Progress</Text>
                    <Text style={styles.sectionText}>{report.currentTask}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Materials */}
            <View style={[styles.gridRow, !isLargeScreen && { flexDirection: 'column', gap: 16 }]}>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Materials Used</Text>
                    <View style={styles.gridValueBox}>
                        <Text style={styles.gridValueText}>{report.materialUsed || 'None'}</Text>
                    </View>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Materials Requested</Text>
                    <View style={styles.gridValueBox}>
                         <Text style={styles.gridValueText}>{report.materialRequest || 'None'}</Text>
                    </View>
                </View>
            </View>

            {/* Photos */}
            {((report.imageUrls && report.imageUrls.length > 0) || report.imageUrl) && (
              <>
                <View style={styles.divider} />
                <View style={styles.photoSection}>
                  <View style={styles.photoHeader}>
                    <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
                      <MaterialCommunityIcons name="camera" size={24} color="#9333EA" />
                    </View>
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Site Photos</Text>
                  </View>
                  <View style={styles.previewPhotoGrid}>
                    {(report.imageUrls && report.imageUrls.length > 0 ? report.imageUrls : [report.imageUrl!]).map((uri, i) => (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={[
                          styles.previewImage,
                          (report.imageUrls?.length ?? 1) > 1 && { flex: 1, minWidth: 120 }
                        ]}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Footer Actions */}
          <View style={[styles.cardFooter, !isLargeScreen && { padding: 16 }]}>
            {mode === 'preview' ? (
              <View style={[styles.buttonGroup, !isLargeScreen && { flexDirection: 'column' }]}>
                <TouchableOpacity onPress={onBackToEdit} style={styles.secondaryButton} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Edit Report</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSubmit} style={styles.primaryButton} activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>Submit Final Report</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  onPress={onBack}
                  style={[styles.primaryButton, { backgroundColor: '#10B981', flex: 1 }]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </View>
      </ScrollView>
    </SidebarLayout>
  );
}

// ─── Mobile Styles ────────────────────────────────────────────────────────────
const mobileStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 40 },

  heroBanner: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: '500' },

  content: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  cardValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  cardSectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardBody: { fontSize: 15, color: '#1F2937', lineHeight: 22 },

  materialsRow: { flexDirection: 'row', gap: 12 },
  materialCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 14, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  materialLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 },
  materialValue: { fontSize: 14, color: '#1F2937', lineHeight: 20 },

  photo: { width: '100%', height: 200, borderRadius: 12, marginTop: 8 },

  buttonGroup: { flexDirection: 'row', gap: 12, marginTop: 4 },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  primaryBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Web Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { backgroundColor: '#F9FAFB', flex: 1 },
  contentContainer: { paddingBottom: 40 },
  navHeader: { padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 24 },
  navBackButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBackText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  mainWrapper: { alignItems: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: 'white', borderRadius: 24, overflow: 'hidden',
    width: '100%', maxWidth: 600,
    borderWidth: 1, borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
      default: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
    }),
  },
  cardLarge: { maxWidth: 700 },
  cardHeader: { padding: 32, paddingBottom: 40 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  headerTitleText: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 4 },
  headerSubtitleText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' },
  cardBody: { padding: 32, marginTop: -20, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  metaSection: { marginBottom: 24 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  metaValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 24 },
  sectionRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  sectionIcon: { marginTop: 2 },
  sectionContent: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sectionText: { fontSize: 16, color: '#1F2937', lineHeight: 24 },
  gridRow: { flexDirection: 'row', gap: 24 },
  gridItem: { flex: 1 },
  gridLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  gridValueBox: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  gridValueText: { fontSize: 15, color: '#111827' },
  previewImage: { width: '100%', height: 250, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  photoSection: { gap: 0 },
  previewPhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  photoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cardFooter: { padding: 24, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  buttonGroup: { flexDirection: 'row', gap: 16 },
  secondaryButton: { flex: 1, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#D1D5DB' },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  primaryButton: {
    flex: 1.5, paddingVertical: 14, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, backgroundColor: '#3B82F6', flexDirection: 'row', gap: 8,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: 'white' },
});
