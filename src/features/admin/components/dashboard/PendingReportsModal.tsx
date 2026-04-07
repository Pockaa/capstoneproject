import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import supabase from '../../../../config/supabaseClient';
import { useTheme } from '../../../../context/ThemeContext';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function PendingReportsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      fetchPendingReports();
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true })
      ]).start(() => setIsVisible(false));
    }
  }, [isOpen]);

  const fetchPendingReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, projects(name), users(name)')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });
      
      if (data) {
        setReports(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <Modal visible={isVisible} transparent={true} animationType="none" onRequestClose={onClose}>
      <AnimatedBlurView intensity={isDark ? 30 : 20} tint={isDark ? "dark" : "light"} style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[
          styles.modalContainer,
          isDark && styles.modalContainerDark,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
        ]}>
          <View style={[styles.header, isDark && styles.headerDark]}>
            <View>
              <Text style={[styles.title, isDark && styles.textLight]}>Pending Reports</Text>
              <Text style={styles.subtitle}>Currently {reports.length} pending records.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, isDark && styles.closeButtonDark]}>
              <Feather name="x" size={24} color={isDark ? "#94a3b8" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.content, isDark && styles.contentDark]}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
            ) : reports.length === 0 ? (
              <Text style={styles.emptyText}>No pending reports found.</Text>
            ) : (
              reports.map(report => (
                <View key={report.id} style={[styles.reportCard, isDark && styles.reportCardDark]}>
                  <View style={styles.reportHeader}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name={report.type?.includes("Incident") ? "alert-circle" : "file-document"} size={20} color={report.type?.includes("Incident") ? "#ef4444" : "#3b82f6"} />
                    </View>
                    <Text style={[styles.reportType, isDark && styles.textLight]}>{report.type || "Report"}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{report.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.reportText, isDark && styles.textMuted]}>Project: {report.projects?.name || report.project_name || "Unknown"}</Text>
                  <Text style={[styles.reportText, isDark && styles.textMuted]}>By: {report.users?.name || report.assigned_to || report.user || "Unknown"}</Text>
                  <Text style={[styles.reportDate, isDark && styles.textMuted]}>
                    Submitted {new Date(report.created_at || report.date).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </AnimatedBlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  modalContainerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerDark: {
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  closeButtonDark: {
    backgroundColor: '#334155',
  },
  content: {
    padding: 20,
  },
  contentDark: {
    backgroundColor: '#0F172A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
    fontStyle: 'italic',
  },
  reportCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  reportCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
      marginRight: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
});
