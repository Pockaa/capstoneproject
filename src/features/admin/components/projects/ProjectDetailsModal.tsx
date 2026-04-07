import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator, TextInput, Alert, Animated } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import supabase from '../../../../config/supabaseClient';
import { InventoryModal } from './InventoryModal';
import { ScheduleModal } from './ScheduleModal';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: string;
  manager: string;
  description: string;
  progress: number;
}

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function ProjectDetailsModal({ isOpen, onClose, project }: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Inventory' | 'Schedule' | 'Reports'>('Overview');
  const [loading, setLoading] = useState(false);
  
  // Data lists
  const [inventory, setInventory] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Add Inventory State
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [deletingInventoryId, setDeletingInventoryId] = useState<string | null>(null);

  // Add Schedule State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [isVisible, setIsVisible] = useState(isOpen);

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
      ]).start(() => setIsVisible(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && project) {
      fetchProjectData();
    }
  }, [isOpen, project]);

  const fetchProjectData = async () => {
    if (!project) return;
    setLoading(true);
    
    try {
      // Fetch Reports safely
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*, users(name)')
        .eq('project_id', project.id);
        
      if (reportsData) setReports(reportsData);

      // Attempt to fetch Inventory safely
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('*')
        .eq('location', project.location); // Assuming matched by location for now
        
      if (inventoryData) setInventory(inventoryData);

      // Attempt to fetch Schedules safely
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('project_id', project.id);
        
      if (scheduleData) setSchedules(scheduleData);
      
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  const renderOverview = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Project Overview</Text>
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={18} color="#6b7280" />
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{project.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={18} color="#6b7280" />
          <Text style={styles.detailLabel}>Timeline:</Text>
          <Text style={styles.detailValue}>
             {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} - 
             {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="dollar-sign" size={18} color="#6b7280" />
          <Text style={styles.detailLabel}>Budget:</Text>
          <Text style={styles.detailValue}>{project.budget}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="user" size={18} color="#6b7280" />
          <Text style={styles.detailLabel}>Manager:</Text>
          <Text style={styles.detailValue}>{project.manager}</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.descriptionText}>{project.description || 'No description provided.'}</Text>
    </View>
  );

  const closeInventoryForm = () => {
    setIsInventoryModalOpen(false);
    setEditingInventoryId(null);
  };

  const handleEditInventory = (item: any) => {
    setEditingInventoryId(item.id);
    setIsInventoryModalOpen(true);
  };

  const performDeleteInventory = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) {
         console.error('Error deleting inventory:', error);
         alert(`Error deleting material: ${error.message}`);
      } else {
         fetchProjectData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteInventory = async () => {
    if (deletingInventoryId) {
       await performDeleteInventory(deletingInventoryId);
       setDeletingInventoryId(null);
    }
  };

  const handleDeleteInventory = (id: string) => {
    setDeletingInventoryId(id);
  };

  const closeScheduleForm = () => {
    setIsScheduleModalOpen(false);
    setEditingScheduleId(null);
  };

  const handleEditSchedule = (item: any) => {
    setEditingScheduleId(item.id);
    setIsScheduleModalOpen(true);
  };

  const performDeleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) {
         console.error('Error deleting schedule:', error);
         alert(`Error deleting task: ${error.message}`);
      } else {
         fetchProjectData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteSchedule = async () => {
    if (deletingScheduleId) {
       await performDeleteSchedule(deletingScheduleId);
       setDeletingScheduleId(null);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    setDeletingScheduleId(id);
  };

  const renderInventory = () => (
    <View style={styles.sectionContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Inventory Status at {project.location}</Text>
        <TouchableOpacity onPress={() => setIsInventoryModalOpen(true)} style={styles.addSmallButton}>
          <Feather name="plus" size={16} color="white" />
          <Text style={styles.addSmallButtonText}>Add Material</Text>
        </TouchableOpacity>
      </View>

      {inventory.length > 0 ? (
        inventory.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{item.name}</Text>
                <Text style={[
                  styles.statusBadge, 
                  item.status === 'Low Stock' ? styles.bgWarning : 
                  item.status === 'Out of Stock' ? styles.bgRed : 
                  styles.bgSuccessLight,
                  { alignSelf: 'flex-start', marginTop: 4 }
                ]}>
                  {item.status}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditInventory(item)} style={styles.iconButton}>
                  <Feather name="edit-2" size={16} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteInventory(item.id)} style={styles.iconButton}>
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.listSub}>Quantity: {item.quantity} {item.unit}</Text>
              {(item.min_threshold !== undefined && item.min_threshold !== null) && (
                <Text style={styles.listSub}>Minimum Threshold: {item.min_threshold} {item.unit}</Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No inventory records found for this location.</Text>
      )}

      {/* Embedded Inventory Modal */}
      {isInventoryModalOpen && (
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={closeInventoryForm}
          onSave={() => {
            closeInventoryForm();
            fetchProjectData();
          }}
          initialData={inventory.find(i => i.id === editingInventoryId)}
          projectLocation={project.location}
        />
      )}
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.sectionContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Upcoming Schedule</Text>
        <TouchableOpacity onPress={() => setIsScheduleModalOpen(true)} style={styles.addSmallButton}>
          <Feather name="plus" size={16} color="white" />
          <Text style={styles.addSmallButtonText}>Add Task</Text>
        </TouchableOpacity>
      </View>
      {schedules.length > 0 ? (
        schedules.map((schedule, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{schedule.task_name || 'Scheduled Task'}</Text>
                <Text style={[
                  styles.statusBadge, 
                  schedule.status === 'Completed' ? styles.bgSuccess : 
                  schedule.status === 'In Progress' ? styles.bgSuccessLight : 
                  schedule.status === 'Delayed' ? styles.bgRed : 
                  styles.bgGray,
                  { alignSelf: 'flex-start', marginTop: 4 }
                ]}>
                  {schedule.status}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditSchedule(schedule)} style={styles.iconButton}>
                  <Feather name="edit-2" size={16} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSchedule(schedule.id)} style={styles.iconButton}>
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.listSub}>{schedule.date ? new Date(schedule.date).toLocaleDateString() : ''} at {schedule.time}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No schedules set for this project.</Text>
      )}

      {/* Embedded Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={closeScheduleForm}
          onSave={() => {
            closeScheduleForm();
            fetchProjectData();
          }}
          initialData={schedules.find(s => s.id === editingScheduleId)}
          projectId={project.id}
        />
      )}
    </View>
  );

  const renderReports = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Project Reports</Text>
      {reports.length > 0 ? (
        reports.map((report, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{report.type} Report</Text>
              <Text style={styles.listSub}>{new Date(report.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.listSub} numberOfLines={2}>{report.task_done || report.summary || report.details}</Text>
            <Text style={styles.listSub}>By: {report.users?.name || report.user}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No reports submitted for this project.</Text>
      )}
    </View>
  );

  if (!isVisible && !isOpen) return null;

  return (
    <Modal visible={isVisible} transparent={true} animationType="none" onRequestClose={onClose}>
      <AnimatedBlurView intensity={20} tint="dark" style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{project.name}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.badge, project.status === 'Completed' ? styles.bgSuccess : project.status === 'Active' ? styles.bgSuccessLight : styles.bgGray]}>
                  <Text style={styles.badgeText}>{project.status}</Text>
                </View>
                <Text style={styles.progressText}>{project.progress}% Complete</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(['Overview', 'Inventory', 'Schedule', 'Reports'] as const).map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
            ) : (
              <>
                {activeTab === 'Overview' && renderOverview()}
                {activeTab === 'Inventory' && renderInventory()}
                {activeTab === 'Schedule' && renderSchedule()}
                {activeTab === 'Reports' && renderReports()}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </AnimatedBlurView>

      {/* Embedded Material Delete Confirmation Modal */}
      <Modal visible={!!deletingInventoryId} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIcon}>
              <Feather name="alert-triangle" size={24} color="#ef4444" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Material</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to permanently delete this material? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton} 
                onPress={() => setDeletingInventoryId(null)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteModalDeleteButton} 
                onPress={confirmDeleteInventory}
              >
                <Text style={styles.deleteModalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Embedded Schedule Delete Confirmation Modal */}
      <Modal visible={!!deletingScheduleId} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIcon}>
              <Feather name="alert-triangle" size={24} color="#ef4444" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Task</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to permanently delete this task? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton} 
                onPress={() => setDeletingScheduleId(null)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteModalDeleteButton} 
                onPress={confirmDeleteSchedule}
              >
                <Text style={styles.deleteModalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    maxWidth: 800,
    maxHeight: '90%',
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  bgSuccess: { backgroundColor: '#10b981', color: '#fff' },
  bgSuccessLight: { backgroundColor: '#dcfce7', color: '#166534' },
  bgWarning: { backgroundColor: '#fef3c7', color: '#92400e' },
  bgRed: { backgroundColor: '#fee2e2', color: '#991b1b' },
  bgInfo: { backgroundColor: '#eff6ff', color: '#2563eb' },
  bgGray: { backgroundColor: '#f3f4f6', color: '#374151' },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
  },
  sectionContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    width: 100,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4b5563',
  },
  listItem: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listSub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  addSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  addSmallButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  deleteModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    color: '#374151',
    fontWeight: '500',
  },
  deleteModalDeleteButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  deleteModalDeleteText: {
    color: 'white',
    fontWeight: '500',
  },
});
