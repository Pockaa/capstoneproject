import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import supabase from '../../../../config/supabaseClient';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: any;
  projectId: string;
}

export function ScheduleModal({ isOpen, onClose, onSave, initialData, projectId }: ScheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    task_name: '',
    date: '',
    time: '',
    status: 'Upcoming',
  });

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
      
      if (initialData) {
        setNewSchedule({
          task_name: initialData.task_name || '',
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '', // YYYY-MM-DD
          time: initialData.time || '',
          status: initialData.status || 'Upcoming',
        });
      } else {
        setNewSchedule({
          task_name: '',
          date: '',
          time: '',
          status: 'Upcoming',
        });
      }
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
  }, [isOpen, initialData]);

  const handleSaveSchedule = async () => {
    if (!newSchedule.task_name || !newSchedule.date || !newSchedule.time) {
      alert('Task Name, Date, and Time are required.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        task_name: newSchedule.task_name,
        date: newSchedule.date,
        time: newSchedule.time,
        status: newSchedule.status || 'Upcoming',
        project_id: projectId,
      };

      let error;
      if (initialData?.id) {
        const { error: updateError } = await supabase.from('schedules').update(payload).eq('id', initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('schedules').insert([payload]);
        error = insertError;
      }
      
      if (error) {
        console.error('Error saving schedule:', error);
        alert(`Failed to save schedule: ${error.message}`);
      } else {
        onSave(); // Refresh data in parent
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <Modal visible={isVisible} transparent={true} animationType="none" onRequestClose={onClose}>
      <AnimatedBlurView intensity={20} tint="dark" style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.formTitle}>{initialData ? 'Edit Task' : 'Add New Task'}</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Task Name</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. Foundation Pour" 
                value={newSchedule.task_name}
                onChangeText={(t) => setNewSchedule({...newSchedule, task_name: t})}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="YYYY-MM-DD" 
                value={newSchedule.date}
                onChangeText={(t) => setNewSchedule({...newSchedule, date: t})}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Time</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. 08:00 AM" 
                value={newSchedule.time}
                onChangeText={(t) => setNewSchedule({...newSchedule, time: t})}
              />
            </View>
          </View>

          <View style={styles.formRow}>
             <View style={styles.formCol}>
               <Text style={styles.inputLabel}>Status</Text>
               <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                 {(['Upcoming', 'In Progress', 'Completed', 'Delayed'] as const).map(s => (
                   <TouchableOpacity 
                     key={s} 
                     style={[styles.statusOption, newSchedule.status === s && styles.statusOptionActive]}
                     onPress={() => setNewSchedule({...newSchedule, status: s})}
                   >
                     <Text style={[styles.statusOptionText, newSchedule.status === s && styles.statusOptionTextActive]}>{s}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton} disabled={loading}>
               <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveSchedule} style={styles.saveButton} disabled={loading}>
               {loading ? (
                   <ActivityIndicator color="white" size="small" />
               ) : (
                   <Text style={styles.saveButtonText}>Save Task</Text>
               )}
            </TouchableOpacity>
          </View>

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
    padding: 24,
    width: '100%',
    maxWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  formCol: {
    flex: 1,
    minWidth: 200,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    fontSize: 15,
    color: '#111827',
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  statusOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusOptionTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 15,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 15,
  },
});
