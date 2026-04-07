import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import supabase from '../../../../config/supabaseClient';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: any;
  projectLocation: string;
}

export function InventoryModal({ isOpen, onClose, onSave, initialData, projectLocation }: InventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [newInventory, setNewInventory] = useState({
    name: '',
    quantity: '',
    unit: '',
    status: 'In Stock',
    min_threshold: '',
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
        setNewInventory({
          name: initialData.name || '',
          quantity: initialData.quantity?.toString() || '',
          unit: initialData.unit || '',
          status: initialData.status || 'In Stock',
          min_threshold: initialData.min_threshold?.toString() || '',
        });
      } else {
        setNewInventory({
          name: '',
          quantity: '',
          unit: '',
          status: 'In Stock',
          min_threshold: '',
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

  const handleSaveInventory = async () => {
    if (!newInventory.name || !newInventory.quantity) {
      alert('Name and Quantity are required.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: newInventory.name,
        location: projectLocation,
        quantity: parseInt(newInventory.quantity) || 0,
        unit: newInventory.unit || 'units',
        status: newInventory.status || 'In Stock',
        min_threshold: parseInt(newInventory.min_threshold) || 0,
      };

      let error;
      if (initialData?.id) {
        const { error: updateError } = await supabase.from('inventory').update(payload).eq('id', initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('inventory').insert([payload]);
        error = insertError;
      }
      
      if (error) {
        console.error('Error saving inventory:', error);
        alert(`Failed to save inventory: ${error.message}`);
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
          <Text style={styles.formTitle}>{initialData ? 'Edit Material' : 'Add New Material'}</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Material Name</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. Cement" 
                value={newInventory.name}
                onChangeText={(t) => setNewInventory({...newInventory, name: t})}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. 100" 
                keyboardType="numeric"
                value={newInventory.quantity}
                onChangeText={(t) => setNewInventory({...newInventory, quantity: t})}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. bags, tons" 
                value={newInventory.unit}
                onChangeText={(t) => setNewInventory({...newInventory, unit: t})}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Min Threshold</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. 20" 
                keyboardType="numeric"
                value={newInventory.min_threshold}
                onChangeText={(t) => setNewInventory({...newInventory, min_threshold: t})}
              />
            </View>
          </View>

          <View style={styles.formRow}>
             <View style={styles.formCol}>
               <Text style={styles.inputLabel}>Status</Text>
               <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                 {(['In Stock', 'Low Stock', 'Out of Stock'] as const).map(s => (
                   <TouchableOpacity 
                     key={s} 
                     style={[styles.statusOption, newInventory.status === s && styles.statusOptionActive]}
                     onPress={() => setNewInventory({...newInventory, status: s})}
                   >
                     <Text style={[styles.statusOptionText, newInventory.status === s && styles.statusOptionTextActive]}>{s}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton} disabled={loading}>
               <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveInventory} style={styles.saveButton} disabled={loading}>
               {loading ? (
                   <ActivityIndicator color="white" size="small" />
               ) : (
                   <Text style={styles.saveButtonText}>Save Material</Text>
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
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 15,
  },
});
