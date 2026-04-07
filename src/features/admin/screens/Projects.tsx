import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, useWindowDimensions, Platform, Modal } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ProjectDetailsModal } from '../components/projects/ProjectDetailsModal';
import supabase from '../../../config/supabaseClient';
import { useTheme } from '../../../context/ThemeContext';

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

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*, users!manager_id(name)');
    if (data) {
      const mapped = data.map(p => ({
        ...p,
        id: p.id,
        name: p.name,
        location: p.location,
        status: p.status,
        startDate: p.start_date,
        endDate: p.end_date,
        budget: p.budget,
        manager: p.users?.name || 'Unknown',
        description: p.description,
        image: p.image_url,
        progress: p.progress,
      }));
      setProjects(mapped);
    } else if (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const { width } = useWindowDimensions();
  // Sidebar is 260px wide on large screens (>= 1024)
  const availableWidth = width >= 1024 ? width - 260 : width;
  const numColumns = availableWidth > 950 ? 3 : availableWidth > 600 ? 2 : 1;
  // Use percentages instead of exact pixels to let flexbox seamlessly handle 3-columns
  const cardWidth = numColumns === 3 ? '31%' : numColumns === 2 ? '48%' : '100%';

  const filteredProjects = projects.filter(project => {
    const pName = project.name || '';
    const pLoc = project.location || '';
    const matchesSearch = pName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pLoc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSaveProject = async (project: Project) => {
    try {
      const safeDate = (d?: string) => {
        if (!d || d.trim() === '') return null;
        // Supabase needs YYYY-MM-DD, otherwise it drops the insert with an error. 
        return /^\d{4}-\d{2}-\d{2}$/.test(d.trim()) ? d.trim() : null;
      };

      const dbPayload: any = {
        name: project.name || 'Unnamed Project',
        location: project.location || 'Unknown Location',
        status: project.status || 'Planning',
        start_date: safeDate(project.startDate),
        end_date: safeDate(project.endDate),
        budget: project.budget || '',
        description: project.description || '',
        image_url: project.image ? project.image : 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300',
        progress: parseInt(project.progress?.toString() || '0') || 0,
      };

      if (project.manager && project.manager.trim() !== '') {
        const mgrName = project.manager.trim();
        const { data: users } = await supabase.from('users').select('id').ilike('name', `%${mgrName}%`).limit(1);
        if (users && users.length > 0) {
           dbPayload.manager_id = users[0].id;
        } else {
           // Auto-create missing manager to link correctly
           const tempId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
               const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
               return v.toString(16);
           });
           const tempEmail = mgrName.replace(/\s+/g, '.').toLowerCase() + '@example.com';
           
           const { data: newUser, error: userErr } = await supabase.from('users').insert([{ 
               id: tempId,
               name: mgrName, 
               email: tempEmail, 
               role: 'Manager', 
               status: 'Active' 
           }]).select();
           
           if (newUser && newUser.length > 0) {
              dbPayload.manager_id = newUser[0].id;
           } else {
              console.log('Could not create new manager:', userErr);
              // Provide an alert so the user knows why it didn't save the manager
              alert(`Could not create new user "${mgrName}". Ensure your database accepts new users.`);
           }
        }
      } else {
        dbPayload.manager_id = null;
      }

      if (currentProject) {
        // Update
        const { error } = await supabase.from('projects').update(dbPayload).eq('id', project.id);
        if (error) {
           console.error('Error updating project', error);
           alert(`Error updating project: ${error.message}`);
        } else {
           fetchProjects();
        }
      } else {
        // Insert
        const { error } = await supabase.from('projects').insert([dbPayload]);
        if (error) {
           console.error('Error adding project', error);
           alert(`Error adding project: ${error.message}`);
        } else {
           fetchProjects();
        }
      }
      setIsModalOpen(false);
      setCurrentProject(null);
    } catch(err) {
      console.error(err);
    }
  };

  const performDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
        console.error('Error deleting project:', error);
        alert(`Error deleting project: ${error.message}`);
      } else {
        fetchProjects();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjectToDelete(id);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
       await performDelete(projectToDelete);
       setProjectToDelete(null);
    }
  };

  const handleEditClick = (project: Project) => {
    setCurrentProject(project);
    setIsModalOpen(true);
  };

  const handleNewProjectClick = () => {
    setCurrentProject(null);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return { bg: '#dcfce7', text: '#166534' }; // green
      case 'Completed': return { bg: '#dbeafe', text: '#1e40af' }; // blue
      case 'On Hold': return { bg: '#ffedd5', text: '#9a3412' }; // orange
      case 'Planning': return { bg: '#f3e8ff', text: '#6b21a8' }; // purple
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Projects</Text>
            <Text style={styles.pageSubtitle}>Manage construction sites, budgets, and timelines.</Text>
          </View>
          <TouchableOpacity 
            onPress={handleNewProjectClick}
            style={styles.newButton}
          >
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.newButtonText}>New Project</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterCard}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={[styles.filterActions, { zIndex: 20 }]}>
             <TouchableOpacity 
               style={styles.filterButton}
               onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
               activeOpacity={0.7}
             >
               <Text style={styles.filterButtonText}>Status: <Text style={{fontWeight:'700'}}>{filterStatus}</Text></Text>
               <Feather name={isStatusDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
             </TouchableOpacity>

             {isStatusDropdownOpen && (
               <View style={styles.dropdownMenu}>
                 {['All', 'Active', 'Completed', 'On Hold', 'Planning'].map((status) => (
                   <TouchableOpacity
                     key={status}
                     style={[styles.dropdownItem, filterStatus === status && styles.dropdownItemActive]}
                     onPress={() => {
                       setFilterStatus(status);
                       setIsStatusDropdownOpen(false);
                     }}
                   >
                     <Text style={[styles.dropdownText, filterStatus === status && styles.dropdownTextActive]}>
                       {status}
                     </Text>
                     {filterStatus === status && <Feather name="check" size={16} color="#2563eb" />}
                   </TouchableOpacity>
                 ))}
               </View>
             )}
          </View>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {filteredProjects.map((project) => {
            const statusStyle = getStatusColor(project.status);
            return (
              <TouchableOpacity 
                key={project.id} 
                style={[styles.card, { width: cardWidth }]}
                onPress={() => setViewingProject(project)}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: project.image }} style={styles.image} />
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{project.status}</Text>
                  </View>
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <View style={styles.locationRow}>
                        <Feather name="map-pin" size={12} color="#6b7280" />
                        <Text style={styles.locationText}>{project.location}</Text>
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity onPress={() => handleEditClick(project)} style={styles.iconButton}>
                        <Feather name="edit-2" size={16} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteProject(project.id)} style={styles.iconButton}>
                        <Feather name="trash-2" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.description} numberOfLines={2}>{project.description}</Text>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <View style={styles.statLabelRow}>
                        <Feather name="dollar-sign" size={12} color="#6b7280" />
                        <Text style={styles.statLabel}>Budget</Text>
                      </View>
                      <Text style={styles.statValue}>{project.budget}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <View style={styles.statLabelRow}>
                         <Feather name="users" size={12} color="#6b7280" />
                         <Text style={styles.statLabel}>Manager</Text>
                      </View>
                      <Text style={styles.statValue} numberOfLines={1}>{project.manager}</Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>{project.progress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${project.progress}%`, backgroundColor: project.status === 'Completed' ? '#22c55e' : '#3b82f6' }
                        ]} 
                      />
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <Feather name="calendar" size={12} color="#6b7280" />
                    <Text style={styles.footerText}>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={currentProject}
      />

      <ProjectDetailsModal
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
        project={viewingProject}
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={!!projectToDelete} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIcon}>
              <Feather name="alert-triangle" size={24} color="#ef4444" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Project</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to permanently delete this project? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton} 
                onPress={() => setProjectToDelete(null)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteModalDeleteButton} 
                onPress={confirmDelete}
              >
                <Text style={styles.deleteModalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f3f4f6', // Softer background
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: isDark ? '#94a3b8' : '#6b7280',
    marginTop: 6,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  filterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 24,
    zIndex: 50,
    position: 'relative',
    maxWidth: 600,
  },
  searchContainer: {
    flex: 1,
    minWidth: 200,
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'transparent',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    backgroundColor: isDark ? '#1e293b' : 'white',
    fontSize: 15,
    color: isDark ? '#f8fafc' : '#111827',
  },
  filterActions: {
     flexDirection: 'row',
     gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'transparent',
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    color: isDark ? '#cbd5e1' : '#475569',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  card: {
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 0, 
  },
  imageContainer: {
    height: 192,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#f8fafc' : '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: isDark ? '#0f172a' : '#f9fafb',
  },
  description: {
    fontSize: 14,
    color: isDark ? '#cbd5e1' : '#4b5563',
    marginBottom: 16,
    height: 40, 
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f9fafb',
    padding: 8,
    borderRadius: 8,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#111827',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#6b7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#111827',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: isDark ? '#334155' : '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#334155' : '#f3f4f6',
  },
  footerText: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#6b7280',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: 160,
    zIndex: 50,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f1f5f9',
  },
  dropdownItemActive: {
    backgroundColor: isDark ? '#0f172a' : '#eff6ff',
  },
  dropdownText: {
    fontSize: 14,
    color: isDark ? '#cbd5e1' : '#334155',
    fontWeight: '500',
  },
  dropdownTextActive: {
    color: isDark ? '#60a5fa' : '#2563eb',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  deleteModalContent: {
    backgroundColor: isDark ? '#1e293b' : 'white',
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
    backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#f8fafc' : '#111827',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: isDark ? '#94a3b8' : '#6b7280',
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
    borderColor: isDark ? '#4b5563' : '#d1d5db',
    backgroundColor: isDark ? '#334155' : 'transparent',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    color: isDark ? '#cbd5e1' : '#374151',
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
