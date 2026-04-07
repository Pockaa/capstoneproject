import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import type { Report } from '../../../../App';
import { theme } from '../../../styles/theme';
import { SidebarLayout } from '../components/SidebarLayout';
import supabase from '../../../config/supabaseClient';

interface ReportFormProps {
  onPreview: (report: Omit<Report, 'id' | 'submittedAt'>) => void;
  onBack: () => void;
  draftData?: Omit<Report, 'id' | 'submittedAt'> | null;
}

export function ReportForm({ onPreview, onBack, draftData }: ReportFormProps) {
  const [formData, setFormData] = useState({
    projectId: draftData?.projectId || '',
    projectName: draftData?.projectName || '',
    taskDone: draftData?.taskDone || '',
    currentTask: draftData?.currentTask || '',
    materialUsed: draftData?.materialUsed || '',
    materialRequest: draftData?.materialRequest || '',
    date: draftData?.date || '',
    imageUrls: draftData?.imageUrls || (draftData?.imageUrl ? [draftData.imageUrl] : []) as string[],
  });

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [step, setStep] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDate = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const selectDate = (day: number) => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    handleChange('date', formatDate(y, m, day));
    setCalendarOpen(false);
  };

  const pickImage = async () => {
    if (formData.imageUrls.length >= 5) {
      alert('Maximum 5 photos allowed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - formData.imageUrls.length,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((a) => {
        if (Platform.OS === 'web' && a.base64) {
           return `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`;
        }
        return a.uri;
      });
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUris].slice(0, 5) }));
    }
  };

  const removeImage = (idx: number) => {
    setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
  };

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={calStyles.dayCell} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
      const isSelected = formData.date === dateStr;
      const isToday = dateStr === formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      cells.push(
        <TouchableOpacity
          key={d}
          style={[calStyles.dayCell, isSelected && calStyles.dayCellSelected, isToday && !isSelected && calStyles.dayCellToday]}
          onPress={() => selectDate(d)}
          activeOpacity={0.6}
        >
          <Text style={[calStyles.dayText, isSelected && calStyles.dayTextSelected, isToday && !isSelected && calStyles.dayTextToday]}>{d}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <View style={calStyles.calHeader}>
          <TouchableOpacity onPress={prevMonth} style={calStyles.calNavBtn}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={calStyles.calMonthText}>
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={calStyles.calNavBtn}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <View style={calStyles.dayNamesRow}>
          {dayNames.map(dn => <Text key={dn} style={calStyles.dayNameText}>{dn}</Text>)}
        </View>
        <View style={calStyles.daysGrid}>
          {cells}
        </View>
      </View>
    );
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name');
    if (data) {
      setProjects(data);
    }
  };

  const handleSubmit = () => {
    if (!formData.projectId) {
      alert("Please select a project.");
      return;
    }
    if (formData.taskDone && formData.currentTask && formData.materialUsed && formData.materialRequest && formData.date) {
      onPreview({ ...formData, imageUrl: formData.imageUrls[0] }); // pass first as imageUrl for compat
    } else {
      alert("Please fill in all details.");
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SidebarLayout activeScreen="SubmitReport">
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>


      <View style={[styles.main, !isLargeScreen && { paddingHorizontal: 16, paddingVertical: 16 }]}>
        {step === 1 ? (
          <View style={styles.stepContainer}>
            
            <View style={styles.stepHeaderCenter}>
              <Text style={[styles.stepTitle, !isLargeScreen && { fontSize: 22 }]}>Choose a Project</Text>
              <Text style={styles.stepSubtitle}>Select the project you are reporting for today.</Text>
            </View>
            
            <View style={styles.projectsGrid}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.projectCard, formData.projectId === p.id && styles.projectCardActive, !isLargeScreen && { flexBasis: '100%', padding: 16 }]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, projectId: p.id, projectName: p.name }));
                    setTimeout(() => setStep(2), 200); // Small delay for visual feedback
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.projectIconContainer, formData.projectId === p.id && styles.projectIconContainerActive]}>
                     <MaterialCommunityIcons 
                       name="office-building" 
                       size={24} 
                       color={formData.projectId === p.id ? theme.colors.primary : "#6B7280"} 
                     />
                  </View>
                  <Text style={[styles.projectCardText, formData.projectId === p.id && styles.projectCardTextActive]}>
                    {p.name}
                  </Text>
                  <View style={[styles.radioCircle, formData.projectId === p.id && styles.radioCircleActive]}>
                    {formData.projectId === p.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
        <View style={[styles.formContainer, !isLargeScreen && { padding: 16 }]}>

          <View style={[styles.stepHeader, !isLargeScreen && { flexDirection: 'column', gap: 12 }]}>
            <Text style={[styles.stepTitle, !isLargeScreen && { fontSize: 20 }]}>Report Details</Text>
            <TouchableOpacity style={styles.selectedProjectBadge} onPress={() => setStep(1)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="office-building" size={16} color={theme.colors.primary} />
              <Text style={styles.selectedProjectText}>{formData.projectName}</Text>
              <Feather name="edit-2" size={12} color={theme.colors.primary} style={{marginLeft: 4}} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Done</Text>
            <TextInput
              style={styles.textArea}
              value={formData.taskDone}
              onChangeText={(value) => handleChange('taskDone', value)}
              placeholder="Describe the tasks completed today..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Task</Text>
            <TextInput
              style={styles.textArea}
              value={formData.currentTask}
              onChangeText={(value) => handleChange('currentTask', value)}
              placeholder="Describe the ongoing tasks..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Material Used</Text>
            <TextInput
              style={styles.textArea}
              value={formData.materialUsed}
              onChangeText={(value) => handleChange('materialUsed', value)}
              placeholder="List materials used and quantities..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Material Request</Text>
            <TextInput
              style={styles.textArea}
              value={formData.materialRequest}
              onChangeText={(value) => handleChange('materialRequest', value)}
              placeholder="List materials needed for upcoming tasks..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{zIndex: 10}}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                if (!calendarOpen) {
                  setCalendarMonth(formData.date ? new Date(formData.date) : new Date());
                }
                setCalendarOpen(!calendarOpen);
              }}
              activeOpacity={0.7}
            >
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 15, color: formData.date ? '#1F2937' : theme.colors.textLight}}>
                  {formData.date || 'Select a date...'}
                </Text>
                <MaterialCommunityIcons name={calendarOpen ? "chevron-up" : "calendar"} size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>

            {calendarOpen && (
              <View style={[calStyles.inlineCard, !isLargeScreen && { position: 'relative', top: 0, marginTop: 8 }]}>
                {renderCalendar()}
                <TouchableOpacity style={calStyles.todayBtn} onPress={() => { selectDate(new Date().getDate()); setCalendarMonth(new Date()); }} activeOpacity={0.7}>
                  <Text style={calStyles.todayBtnText}>Today</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          </View>

          <View style={[styles.inputGroup, { zIndex: 1 }]}>
            <Text style={styles.label}>Site Photos ({formData.imageUrls.length}/5)</Text>
            <View style={styles.photoGrid}>
              {formData.imageUrls.map((uri, idx) => (
                <View key={idx} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoThumbImg as any} resizeMode="cover" />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeImage(idx)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {formData.imageUrls.length < 5 && (
                <TouchableOpacity style={styles.addPhotoTile} onPress={pickImage} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="camera-plus" size={26} color={theme.colors.primary} />
                  <Text style={styles.addPhotoText}>
                    {formData.imageUrls.length === 0 ? 'Add Photo' : 'Add More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.buttonGroup, { zIndex: 1 }, !isLargeScreen && { flexDirection: 'column' }]}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.cancelButton}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitButton}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Preview Report</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}
      </View>
    </ScrollView>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: theme.colors.white,
    ...theme.shadow.sm,
  },
  headerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  backText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  main: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  formContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' },
      default: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }
    }),
    gap: 20,
    width: '100%',
    maxWidth: 760,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    ...Platform.select({ web: { outlineStyle: 'none', transition: 'all 0.2s ease' } })
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    ...Platform.select({ web: { outlineStyle: 'none', transition: 'all 0.2s ease' } })
  },
  imagePickerBtn: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 4,
  },
  // Multi-photo grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 100, height: 100,
    borderRadius: 10, overflow: 'hidden',
    position: 'relative',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  photoThumbImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  removePhotoBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12, padding: 3,
  },
  addPhotoTile: {
    width: 100, height: 100, borderRadius: 10,
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
  buttonGroup: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)' },
      default: { elevation: 3 }
    })
  },
  submitButtonText: {
    fontSize: 15,
    color: theme.colors.white,
    fontWeight: '700',
  },
  stepContainer: {
    width: '100%',
    maxWidth: 700,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
  },
  stepHeaderCenter: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  projectCard: {
    // @ts-ignore
    flexBasis: Platform.OS === 'web' ? 'calc(50% - 8px)' : '100%',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease' },
      default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }
    })
  },
  projectCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF7ED',
  },
  projectIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  projectIconContainerActive: {
    backgroundColor: '#FFEDD5',
  },
  projectCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  projectCardTextActive: {
    color: '#9A3412',
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  stepHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedProjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
    gap: 6,
  },
  selectedProjectText: {
    color: '#9A3412',
    fontWeight: '600',
    fontSize: 14,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepDotActive: {
    backgroundColor: '#FFEDD5',
    borderColor: theme.colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.primary,
  },
  stepDotText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  stepDotTextInactive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  }
});

const calStyles = StyleSheet.create({
  inlineCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxWidth: 280,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 999,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
      default: { elevation: 8 },
    }),
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calNavBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calMonthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingVertical: 2,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayCellToday: {
    backgroundColor: '#FFEDD5',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  dayTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  dayTextToday: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  todayBtn: {
    marginTop: 6,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
});
