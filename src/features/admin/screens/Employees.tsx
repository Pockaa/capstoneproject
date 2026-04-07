import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EmployeeModal } from '../components/employees/EmployeeModal';
import supabase from '../../../config/supabaseClient';
import { useTheme } from '../../../context/ThemeContext';

interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  email: string;
  phone: string;
}

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Error fetching employees:', error);
      } else if (data) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching employees:', err);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEmployee = async (data: Omit<Employee, 'id'>) => {
    try {
      // NOTE: Normally in Supabase, user creation goes through auth.signUp(), 
      // but if you are just managing a 'users' table directly to start without proper 
      // authentication flow in the UI right now, we can insert directly into the table.
      // We will generate a UUID for the id field. 
      const newId = crypto.randomUUID(); 
      const { error } = await supabase.from('users').insert([{ ...data, id: newId }]);
      if (error) {
         console.error('Error adding employee', error);
         alert(`Error adding employee: ${error.message}`);
      } else {
         fetchEmployees();
         setIsModalOpen(false);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpdateEmployee = async (data: Omit<Employee, 'id'>) => {
    if (editingEmployee) {
      try {
        const { error } = await supabase.from('users').update(data).eq('id', editingEmployee.id);
        if (error) {
           console.error('Error updating employee', error);
           alert(`Error updating employee: ${error.message}`);
        } else {
           fetchEmployees();
           setEditingEmployee(null);
           setIsModalOpen(false);
        }
      } catch(err) {
        console.error(err);
      }
    }
  };

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Employees</Text>
            <Text style={styles.pageSubtitle}>Manage your workforce and site personnel.</Text>
          </View>
          <TouchableOpacity onPress={handleNewClick} style={styles.newButton}>
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.newButtonText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        {/* Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Table Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>All Employees</Text>
          </View>
          
          <ScrollView horizontal style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1 }} showsHorizontalScrollIndicator={false}>
            <View style={{ flex: 1, minWidth: 900 }}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 2 }]}>Employee Name</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Role / Position</Text>
                <Text style={[styles.headerCell, { flex: 1 }]}>Status</Text>
                <Text style={[styles.headerCell, { flex: 2 }]}>Contact Info</Text>
                <Text style={[styles.headerCell, { flex: 0.5, textAlign: 'right' }]}>Action</Text>
              </View>

              {/* Table Rows */}
              {filteredEmployees.map((employee, index) => (
                <View key={employee.id} style={[styles.tableRow, index === filteredEmployees.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.avatarPlaceholder}>
                       <Text style={styles.avatarText}>{employee.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.cellTextName}>{employee.name}</Text>
                  </View>
                  <Text style={[styles.cellText, { flex: 1.5, color: '#4b5563', fontWeight: '500' }]}>{employee.role}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-start' }}>
                    <View style={[
                      styles.statusBadge,
                      employee.status === 'Active' ? styles.bgGreen : styles.bgGray
                    ]}>
                      <View style={[styles.statusDot, employee.status === 'Active' ? { backgroundColor: '#10b981' } : { backgroundColor: '#6b7280' }]} />
                      <Text style={[
                        styles.statusText,
                        employee.status === 'Active' ? styles.textGreen : styles.textBlack
                      ]}>{employee.status}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 2 }}>
                    <View style={styles.contactRow}>
                      <Feather name="mail" size={14} color="#6b7280" />
                      <Text style={styles.contactEmail}>{employee.email}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Feather name="phone" size={14} color="#6b7280" />
                      <Text style={styles.contactPhone}>{employee.phone}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 0.5, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <TouchableOpacity onPress={() => handleEditClick(employee)} style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
        defaultValues={editingEmployee}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32, // Increased spacing
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 28, // Slightly larger
    fontWeight: '800', // Bolder
    color: isDark ? '#f8fafc' : '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15, // Slightly larger
    color: isDark ? '#94a3b8' : '#6b7280',
    marginTop: 6,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6', // Brighter blue
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12, // Rounder 
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
  filterSection: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 480, // Wider search
  },
  searchContainer: {
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: 12, // Matches overall roundness
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
    height: 48, // Taller
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'transparent', // Cleaner look, rely on shadow
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    backgroundColor: isDark ? '#1e293b' : 'white',
    fontSize: 15,
    color: isDark ? '#f8fafc' : '#111827'
  },
  card: {
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: 16, // More rounded 
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f3f4f6',
    backgroundColor: isDark ? '#1e293b' : '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#f8fafc' : '#111827',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#e5e7eb',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc', // Very subtle slate/blue tint
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18, // More breathing room
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f1f5f9',
    backgroundColor: isDark ? '#1e293b' : 'white',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? '#0f172a' : '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: isDark ? '#60a5fa' : '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cellTextName: {
    fontSize: 15,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  cellText: {
    fontSize: 14,
    color: isDark ? '#cbd5e1' : '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bgGreen: { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' },
  bgGray: { backgroundColor: isDark ? '#334155' : '#f8fafc' },
  textGreen: { color: isDark ? '#34d399' : '#047857' },
  textBlack: { color: isDark ? '#cbd5e1' : '#475569' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 14,
    color: isDark ? '#f8fafc' : '#1e293b',
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 13,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
  },
  actionButtonText: {
    color: isDark ? '#cbd5e1' : '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
});
