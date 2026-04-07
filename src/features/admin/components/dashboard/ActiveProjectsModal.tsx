import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import supabase from '../../../../config/supabaseClient';
import { useTheme } from '../../../../context/ThemeContext';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function ActiveProjectsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      fetchActiveProjects();
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

  const fetchActiveProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
      
      if (data) {
        setProjects(data);
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
              <Text style={[styles.title, isDark && styles.textLight]}>Active Projects</Text>
              <Text style={styles.subtitle}>{projects.length} recorded currently.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, isDark && styles.closeButtonDark]}>
              <Feather name="x" size={24} color={isDark ? "#94a3b8" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.content, isDark && styles.contentDark]}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
            ) : projects.length === 0 ? (
              <Text style={styles.emptyText}>No active projects found.</Text>
            ) : (
              projects.map(project => (
                <View key={project.id} style={[styles.projectCard, isDark && styles.projectCardDark]}>
                  <View style={styles.projectHeader}>
                    <Text style={[styles.projectName, isDark && styles.textLight]}>{project.name}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{project.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.projectLocation, isDark && styles.textMuted]}>📍 {project.location}</Text>
                  <Text style={[styles.projectDesc, isDark && styles.textMuted]} numberOfLines={2}>
                    {project.description || "No description provided."}
                  </Text>
                  {project.manager && (
                    <Text style={[styles.projectManager, isDark && styles.textMuted]}>👤 {project.manager}</Text>
                  )}
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
  projectCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  projectCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: 'bold',
  },
  projectLocation: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  projectDesc: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  projectManager: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});
