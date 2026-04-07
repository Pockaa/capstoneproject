import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Platform, Image, Animated, ActivityIndicator, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface Project {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Planning';
  startDate: string;
  endDate: string;
  budget: string;
  manager: string;
  description: string;
  image: string;
  progress: number;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project?: Project | null;
}

export function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    location: '',
    status: 'Planning',
    startDate: '',
    endDate: '',
    budget: '',
    manager: '',
    description: '',
    progress: 0,
    image: ''
  });

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [isVisible, setIsVisible] = useState(isOpen);
  const [isEstimating, setIsEstimating] = useState(false);

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

  useEffect(() => {
    if (project) {
      setFormData(project);
    } else {
      setFormData({
        name: '',
        location: '',
        status: 'Planning',
        startDate: '',
        endDate: '',
        budget: '',
        manager: '',
        description: '',
        progress: 0,
        image: ''
      });
    }
  }, [project, isOpen]);

  const handleAIEstimate = () => {
    if (!formData.name && !formData.description) {
      Alert.alert("Missing Details", "Please provide a Project Name or Description for the AI to analyze.");
      return;
    }
    
    setIsEstimating(true);

    // TODO: Replace this mock implementation with an actual API call (OpenAI, Gemini, or Supabase Edge Function)
    setTimeout(() => {
      setFormData(prev => {
        const baseBudget = prev.name?.length ? prev.name.length * 100000 : 500000;
        const formattedBudget = `$${(baseBudget / 1000000).toFixed(1)}M - $${((baseBudget * 1.5) / 1000000).toFixed(1)}M`;
        
        const today = new Date();
        const start = today.toISOString().split('T')[0];
        
        const end = new Date(today);
        end.setMonth(end.getMonth() + 6);
        const endFormatted = end.toISOString().split('T')[0];

        const aiNotes = `\n\n--- AI Estimation ---\n- Estimated Duration: 6 months\n- Estimated Budget: ${formattedBudget}\n- Primary Materials required: Steel, Concrete, Wood.\n- Ensure permits are obtained beforehand.`;

        return {
          ...prev,
          budget: prev.budget || formattedBudget,
          startDate: prev.startDate || start,
          endDate: prev.endDate || endFormatted,
          description: (prev.description || '') + aiNotes,
        };
      });
      setIsEstimating(false);
    }, 2500); // simulate network request delay
  };

  const handleSubmit = () => {
    onSave({
      id: project?.id || Math.random().toString(36).substr(2, 9),
      ...formData
    } as Project);
    onClose();
  };

  const handleChange = (name: keyof Project, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
      base64: true, // Need this to reliably upload to Supabase as raw string for now
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      // If we have base64, save it in the data URI format so the Image tag can display it immediately
      // and so Supabase saves the raw image string.
      if (asset.base64) {
        const imageUri = `data:image/jpeg;base64,${asset.base64}`;
        handleChange('image', imageUri);
      } else {
        handleChange('image', asset.uri);
      }
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <Modal visible={isVisible} transparent={true} animationType="none" onRequestClose={onClose}>
      <AnimatedBlurView intensity={20} tint="dark" style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{project ? 'Edit Project' : 'New Project'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                {formData.image ? (
                  <Image source={{ uri: formData.image }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Feather name="camera" size={24} color="#9ca3af" />
                    <Text style={styles.imagePlaceholderText}>Add Project Design</Text>
                  </View>
                )}
                <View style={styles.imageEditOverlay}>
                  <Feather name="edit-2" size={16} color="white" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Project Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="e.g. Downtown Plaza"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.inputIconWrapper}>
                  <Feather name="map-pin" size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 36 }]}
                    value={formData.location}
                    onChangeText={(text) => handleChange('location', text)}
                    placeholder="City, State"
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Status</Text>
                {/* Simple status picker */}
                <View style={styles.statusPicker}>
                  {(['Planning', 'Active', 'On Hold', 'Completed'] as const).map(s => (
                    <TouchableOpacity 
                      key={s}
                      onPress={() => handleChange('status', s)}
                      style={[
                        styles.statusOption,
                        formData.status === s && styles.statusOptionActive
                      ]}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === s && styles.statusOptionTextActive
                      ]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Start Date</Text>
                <View style={styles.inputIconWrapper}>
                  <Feather name="calendar" size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 36 }]}
                    value={formData.startDate}
                    onChangeText={(text) => handleChange('startDate', text)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>End Date</Text>
                <View style={styles.inputIconWrapper}>
                  <Feather name="calendar" size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 36 }]}
                    value={formData.endDate}
                    onChangeText={(text) => handleChange('endDate', text)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Budget</Text>
                <View style={styles.inputIconWrapper}>
                  <Feather name="dollar-sign" size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 36 }]}
                    value={formData.budget}
                    onChangeText={(text) => handleChange('budget', text)}
                    placeholder="e.g. $2.5M"
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Project Manager</Text>
                <View style={styles.inputIconWrapper}>
                  <Feather name="user" size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 36 }]}
                    value={formData.manager}
                    onChangeText={(text) => handleChange('manager', text)}
                    placeholder="Manager Name"
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Progress (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.progress?.toString()}
                onChangeText={(text) => handleChange('progress', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="0-100"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={formData.description}
                onChangeText={(text) => handleChange('description', text)}
                placeholder="Brief project description..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* AI Estimation Section */}
            <View style={styles.aiContainer}>
              <TouchableOpacity style={styles.aiButton} onPress={handleAIEstimate} disabled={isEstimating}>
                {isEstimating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="auto-fix" size={18} color="white" />
                    <Text style={styles.aiButtonText}>Generate AI Estimate</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.aiHint}>AI will automatically estimate dates, budget, and materials based on the description above.</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{project ? 'Save Changes' : 'Create Project'}</Text>
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
    width: '100%',
    maxWidth: 500, // Reduced from 600
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20, // Reduced from 24
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20, // Reduced from 24
  },
  imageSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  imageEditOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  col: {
    flex: 1,
    minWidth: 200,
  },
  statusPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  statusOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  statusOptionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusOptionTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 24,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  aiContainer: {
    marginVertical: 10,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6', // A purple tone for AI features
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  aiButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  aiHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
