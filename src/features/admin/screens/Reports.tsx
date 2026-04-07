import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ReportModal } from '../components/reports/ReportModal';
import supabase from '../../../config/supabaseClient';
import { useTheme } from '../../../context/ThemeContext';

export function Reports() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*, projects(name), users(name, email)')
      .order('created_at', { ascending: false });
    if (data) setReports(data);
    else if (error) console.error('Error fetching reports:', error);
  };

  const handleReportClick = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, reports.length);
  const totalItems = reports.length;
  const currentReports = reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to first page if filtering/fetching reduces total pages below current page
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [reports, totalPages]);

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer}>
        {/* Page Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Reports</Text>
            <Text style={styles.pageSubtitle}>Manage and review site reports from all active projects.</Text>
          </View>

        </View>

        {/* content card */}
        <View style={styles.card}>
          {/* Filters */}
          <View style={styles.filterSection}>
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search reports..."
                placeholderTextColor="#9ca3af"
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Feather name="filter" size={20} color="#4b5563" />
              <Text style={styles.filterButtonText}>Filters</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableContainer}>
            <ScrollView horizontal style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1 }} showsHorizontalScrollIndicator={false}>
              <View style={{ flex: 1, minWidth: 900 }}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { flex: 2 }]}>Project</Text>
                  <Text style={[styles.headerCell, { flex: 1.5 }]}>Report Type</Text>
                  <Text style={[styles.headerCell, { flex: 1.5 }]}>Submitted By</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}>Date</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}>Status</Text>
                  <Text style={[styles.headerCell, { flex: 0.5, textAlign: 'right' }]}>Action</Text>
                </View>
                
                {/* Table Body */}
                {currentReports.map((report, index) => (
                  <TouchableOpacity 
                    key={report.id} 
                    style={[styles.tableRow, index === currentReports.length - 1 && { borderBottomWidth: 0 }]} 
                    onPress={() => handleReportClick(report)}
                    activeOpacity={0.6}
                  >
                    <View style={{ flex: 2 }}>
                       <Text style={styles.cellTextName}>{report.projects?.name || report.project}</Text>
                    </View>
                    <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.typeBadge, report.type === 'Incident Report' ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#eff6ff' }]}>
                        <View style={[styles.dot, report.type === 'Incident Report' ? { backgroundColor: '#ef4444' } : { backgroundColor: '#3b82f6' }]} />
                        <Text style={[styles.typeText, report.type === 'Incident Report' ? { color: '#b91c1c' } : { color: '#1d4ed8' }]}>{report.type}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1.5 }}>
                       <Text style={styles.cellText}>{report.users?.name || report.user}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={styles.cellText}>{new Date(report.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                      <View style={[
                        styles.statusBadge,
                        report.status === 'Approved' ? styles.bgGreen : 
                        report.status === 'Pending' ? styles.bgYellow : 
                        styles.bgBlue
                      ]}>
                        <View style={[styles.statusDot, 
                            report.status === 'Approved' ? {backgroundColor: '#10b981'} : 
                            report.status === 'Pending' ? {backgroundColor: '#f59e0b'} : 
                            {backgroundColor: '#3b82f6'} 
                        ]} />
                        <Text style={[
                          styles.statusText,
                           report.status === 'Approved' ? styles.textGreen : 
                           report.status === 'Pending' ? styles.textYellow : 
                           styles.textBlue
                        ]}>{report.status}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 0.5, alignItems: 'flex-end', justifyContent: 'center' }}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={(e) => { e.stopPropagation(); handleReportClick(report); }}
                      >
                        <Text style={styles.actionButtonText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Pagination */}
          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              Showing <Text style={{ fontWeight: '600' }}>{totalItems === 0 ? 0 : startIndex}</Text> to <Text style={{ fontWeight: '600' }}>{endIndex}</Text> of <Text style={{ fontWeight: '600' }}>{totalItems}</Text> results
            </Text>
            <View style={styles.paginationButtons}>
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === 1 && { opacity: 0.5 }]} 
                onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <Text style={styles.pageText}>Previous</Text>
              </TouchableOpacity>
              
              {[...Array(totalPages)].map((_, i) => (
                <TouchableOpacity 
                   key={i + 1} 
                   style={[styles.pageButton, currentPage === i + 1 && styles.activePage]}
                   onPress={() => setCurrentPage(i + 1)}
                >
                  <Text style={[styles.pageText, currentPage === i + 1 && styles.activePageText]}>{i + 1}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity 
                style={[styles.pageButton, { borderRightWidth: 0 }, (currentPage === totalPages || totalPages === 0) && { opacity: 0.5 }]} 
                onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <Text style={styles.pageText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        report={selectedReport} 
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
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: isDark ? '#0f172a' : 'white',
    borderRadius: 12, // Matches overall roundness
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: 480,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    height: 48, // Taller
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'transparent',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    backgroundColor: isDark ? '#0f172a' : 'white',
    fontSize: 15,
    color: isDark ? '#f8fafc' : '#111827'
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
    backgroundColor: isDark ? '#1e293b' : 'white',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#cbd5e1' : '#4b5563',
  },
  tableContainer: {
    flex: 1,
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
  cellTextName: {
    fontSize: 15,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  cellText: {
    fontSize: 14,
    color: isDark ? '#cbd5e1' : '#334155',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
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
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isDark ? '#0f172a' : '#eff6ff', 
  },
  actionButtonText: {
    color: isDark ? '#60a5fa' : '#1d4ed8', 
    fontSize: 13,
    fontWeight: '600',
  },
  bgGreen: { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' },
  bgYellow: { backgroundColor: isDark ? '#78350f' : '#fffbeb' },
  bgBlue: { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' },
  textGreen: { color: isDark ? '#34d399' : '#047857' },
  textYellow: { color: isDark ? '#fbbf24' : '#b45309' },
  textBlue: { color: isDark ? '#60a5fa' : '#1d4ed8' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#334155' : '#e5e7eb',
    flexWrap: 'wrap',
    gap: 16,
  },
  paginationText: {
    fontSize: 14,
    color: isDark ? '#94a3b8' : '#374151',
  },
  paginationButtons: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#d1d5db',
    borderRadius: 6,
    backgroundColor: isDark ? '#0f172a' : 'white',
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: isDark ? '#334155' : '#d1d5db',
  },
  activePage: {
    backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', // blue-50
  },
  activePageText: {
    color: isDark ? '#60a5fa' : '#1d4ed8', // blue-700
    fontWeight: '600',
  },
  pageText: {
    fontSize: 14,
    color: isDark ? '#cbd5e1' : '#374151',
  },
});
