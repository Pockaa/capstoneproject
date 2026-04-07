import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ReportAIAnalysis } from '../../../user/components/ReportAIAnalysis';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: any;
  onApprove?: (id: string) => void;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Feather name={icon as any} size={14} color="#f97316" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function Card({ icon, color, title, children }: { icon: string; color: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: color + '20' }]}>
          <Feather name={icon as any} size={15} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function ReportModal({ isOpen, onClose, report, onApprove }: ReportModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(isOpen);

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [isOpen]);

  if ((!isVisible && !isOpen) || !report) return null;

  const projectName = report.projects?.name || report.project || '—';
  const submittedBy = report.users?.name    || report.user    || '—';
  const reportDate  = report.date
    ? new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const submittedAt = report.created_at || report.submittedAt
    ? new Date(report.created_at || report.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
  const reportType   = report.type   || 'Daily Log';
  const reportStatus = report.status || 'Submitted';

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    Approved: { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
    Pending:  { bg: '#fef9c3', text: '#854d0e', dot: '#eab308' },
    default:  { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  };
  const sc = statusColors[reportStatus] ?? statusColors.default;

  // Collect photos
  const photos: string[] = report.image_urls?.length
    ? report.image_urls
    : report.image_url
    ? [report.image_url]
    : [];

  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex(i => (i! > 0 ? i! - 1 : photos.length - 1));
  const nextPhoto = () => setLightboxIndex(i => (i! < photos.length - 1 ? i! + 1 : 0));

  return (
    <>
      <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
        <AnimatedBlurView intensity={20} tint="dark" style={[styles.overlay, { opacity: opacityAnim }]}>
          <Animated.View style={[styles.sheet, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>

            {/* ── Fixed Header ── */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Report Details</Text>
                <Text style={styles.headerSub}>{reportType}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                <Text style={[styles.statusText, { color: sc.text }]}>{reportStatus}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* ── Scrollable Body ── */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Meta Info */}
              <View style={styles.metaGrid}>
                <View style={styles.metaCell}>
                  <InfoRow icon="briefcase" label="PROJECT" value={projectName} />
                </View>
                <View style={styles.metaSep} />
                <View style={styles.metaCell}>
                  <InfoRow icon="user" label="SUBMITTED BY" value={submittedBy} />
                </View>
                <View style={styles.metaSep} />
                <View style={styles.metaCell}>
                  <InfoRow icon="calendar" label="REPORT DATE" value={reportDate} />
                </View>
                <View style={styles.metaSep} />
                <View style={styles.metaCell}>
                  <InfoRow icon="clock" label="SUBMITTED AT" value={submittedAt} />
                </View>
              </View>

              {/* Task Completed */}
              {report.task_done ? (
                <Card icon="check-circle" color="#10b981" title="Task Completed">
                  <Text style={styles.cardBody}>{report.task_done}</Text>
                </Card>
              ) : null}

              {/* Work In Progress */}
              {report.current_task ? (
                <Card icon="activity" color="#f59e0b" title="Work In Progress">
                  <Text style={styles.cardBody}>{report.current_task}</Text>
                </Card>
              ) : null}

              {/* Materials */}
              {(report.material_used || report.material_request) ? (
                <Card icon="package" color="#6366f1" title="Materials">
                  <View style={styles.materialsRow}>
                    <View style={styles.materialCell}>
                      <Text style={styles.materialLabel}>USED</Text>
                      <Text style={styles.cardBody}>{report.material_used || '—'}</Text>
                    </View>
                    <View style={styles.materialDivider} />
                    <View style={styles.materialCell}>
                      <Text style={styles.materialLabel}>REQUESTED</Text>
                      <Text style={styles.cardBody}>{report.material_request || '—'}</Text>
                    </View>
                  </View>
                </Card>
              ) : null}

              {/* AI Report Analysis */}
              <ReportAIAnalysis
                taskDone={report.task_done || ''}
                currentTask={report.current_task || ''}
                materialUsed={report.material_used || ''}
                materialRequest={report.material_request || ''}
                projectName={projectName}
                date={report.date}
              />

              {/* Site Photos */}
              {photos.length > 0 ? (
                <Card icon="camera" color="#8b5cf6" title={`Site Photos  ·  ${photos.length}`}>
                  <View style={styles.photoGrid}>
                    {photos.map((url, i) => (
                      <TouchableOpacity
                        key={i}
                        activeOpacity={0.85}
                        onPress={() => setLightboxIndex(i)}
                        style={[
                          styles.photoWrap,
                          photos.length === 1 && styles.photoFull,
                          photos.length > 1   && styles.photoHalf,
                        ]}
                      >
                        <Image
                          source={{ uri: url }}
                          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
                          resizeMode="cover"
                        />
                        <View style={styles.photoZoomHint}>
                          <Feather name="maximize-2" size={13} color="white" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>
              ) : null}

              {/* Empty state */}
              {!report.task_done && !report.current_task && !report.material_used
                && !report.material_request && photos.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="file-document-outline" size={44} color="#d1d5db" />
                  <Text style={styles.emptyText}>No details for this report.</Text>
                </View>
              )}
            </ScrollView>

            {/* ── Fixed Footer ── */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Close</Text>
              </TouchableOpacity>
              {reportStatus !== 'Approved' && (
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => onApprove?.(report.id)}
                >
                  <Feather name="check" size={15} color="white" />
                  <Text style={styles.approveBtnText}>Approve Report</Text>
                </TouchableOpacity>
              )}
            </View>

          </Animated.View>
        </AnimatedBlurView>
      </Modal>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={closeLightbox}>
          <View style={styles.lbOverlay}>
            {/* Tap backdrop to close */}
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeLightbox} activeOpacity={1} />

            {/* Full photo */}
            <Image
              source={{ uri: photos[lightboxIndex] }}
              style={styles.lbImage}
              resizeMode="contain"
            />

            {/* Close button */}
            <TouchableOpacity style={styles.lbClose} onPress={closeLightbox}>
              <Feather name="x" size={22} color="white" />
            </TouchableOpacity>

            {/* Counter badge */}
            {photos.length > 1 && (
              <View style={styles.lbCounter}>
                <Text style={styles.lbCounterText}>{lightboxIndex + 1} / {photos.length}</Text>
              </View>
            )}

            {/* Prev / Next arrows */}
            {photos.length > 1 && (
              <>
                <TouchableOpacity style={[styles.lbNav, styles.lbNavLeft]} onPress={prevPhoto}>
                  <Feather name="chevron-left" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.lbNav, styles.lbNavRight]} onPress={nextPhoto}>
                  <Feather name="chevron-right" size={30} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    flexDirection: 'column',
    ...Platform.select({
      web: {
        maxHeight: '90vh',
        boxShadow: '0 32px 64px -12px rgba(0,0,0,0.3)',
      } as any,
      default: {
        maxHeight: '90%',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#9ca3af', marginTop: 1, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },

  // Scroll
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: { overflowY: 'auto', minHeight: 0 } as any,
    }),
  },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 8 },

  // Meta grid
  metaGrid: {
    backgroundColor: '#f9fafb', borderRadius: 14,
    borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden',
  },
  metaCell: { paddingHorizontal: 16, paddingVertical: 12 },
  metaSep: { height: 1, backgroundColor: '#f3f4f6' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIconWrap: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },

  // Cards
  card: {
    backgroundColor: '#fafafa', borderRadius: 14,
    borderWidth: 1, borderColor: '#f3f4f6', padding: 14, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardBody: { fontSize: 14, color: '#374151', lineHeight: 22 },

  // Materials
  materialsRow: { flexDirection: 'row' },
  materialCell: { flex: 1, gap: 4 },
  materialDivider: { width: 1, backgroundColor: '#f3f4f6', marginHorizontal: 12 },
  materialLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoWrap: {
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  photoFull: { width: '100%', height: 220 },
  photoHalf: {
    height: 150,
    ...Platform.select({
      web: { flex: 1, minWidth: 120 } as any,
      default: { width: '48%' },
    }),
  },
  photoZoomHint: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6, padding: 4,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af' },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10,
    padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6',
    backgroundColor: 'white',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  ghostBtn: {
    paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white',
  },
  ghostBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 10, backgroundColor: '#2563eb',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(37,99,235,0.35)' } as any,
      default: { elevation: 3, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
    }),
  },
  approveBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  // Lightbox
  lbOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lbImage: {
    width: '90%',
    height: '80%',
  },
  lbClose: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, padding: 8,
  },
  lbCounter: {
    position: 'absolute', bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  lbCounterText: { color: 'white', fontSize: 14, fontWeight: '600' },
  lbNav: {
    position: 'absolute', top: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24, padding: 10,
  },
  lbNavLeft:  { left: 16 },
  lbNavRight: { right: 16 },
});
