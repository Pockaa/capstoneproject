import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar, useWindowDimensions, TouchableOpacity, Animated, Easing, Text, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './screens/Dashboard';
import { Reports } from './screens/Reports';
import { Projects } from './screens/Projects';
import { Employees } from './screens/Employees';
import { Settings } from './screens/Settings';
import { PlaceholderPage } from './components/PlaceholderPage';
import { AIChatbot } from './components/chat/AIChatbot';

import { ThemeProvider, useTheme } from '../../context/ThemeContext';

// Simple FadeTransition wrapper
const FadeTransition = ({ children, visible }: { children: React.ReactNode, visible: boolean }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.fadeContainer, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
};

function AdminContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  
  // Sidebar Animation Value
  const sidebarAnim = useRef(new Animated.Value(0)).current; // 0: Closed, 1: Open

  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  // Handle sidebar animation
  useEffect(() => {
    if (!isLargeScreen) {
      Animated.timing(sidebarAnim, {
        toValue: isSidebarOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: false, // transform needs false on web sometimes, checking
        easing: Easing.out(Easing.quad),
      }).start();
    }
  }, [isSidebarOpen, isLargeScreen]);

  const performLogout = () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    // Simulate cleanup delay
    setTimeout(() => {
        try {
          if (navigation && navigation.dispatch) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          }
        } catch (error) {
           console.error("Logout failed:", error);
           setIsLoggingOut(false);
        }
    }, 1500);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleNavigate = (page: string) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    if (!isLargeScreen) {
      setIsSidebarOpen(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#ffffff"} />
      
      <View style={styles.rowContainer}>
        {/* Desktop Fixed Sidebar */}
        {isLargeScreen && (
            <View style={styles.desktopSidebar}>
                <Sidebar 
                    currentPage={currentPage} 
                    onNavigate={handleNavigate} 
                    onLogout={handleLogout}
                />
            </View>
        )}

        {/* Mobile Animated Sidebar Overlay */}
        {!isLargeScreen && (
            <View 
              style={styles.overlayContainer} 
              pointerEvents={isSidebarOpen ? 'auto' : 'none'}
            >
                {/* Backdrop */}
                <Animated.View 
                    style={[
                        styles.overlayBackdrop, 
                        { 
                            opacity: sidebarAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5]
                            }) 
                        }
                    ]}
                >
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        activeOpacity={1} 
                        onPress={() => setIsSidebarOpen(false)} 
                    />
                </Animated.View>
                
                {/* Sidebar Slide */}
                <Animated.View 
                    style={[
                        styles.mobileSidebar, 
                        { 
                            transform: [{ 
                                translateX: sidebarAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-280, 0]
                                }) 
                            }] 
                        }
                    ]}
                >
                    <Sidebar 
                        currentPage={currentPage} 
                        onNavigate={handleNavigate} 
                        onLogout={handleLogout}
                    />
                </Animated.View>
            </View>
        )}

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <Header 
            onMenuClick={() => setIsSidebarOpen(true)} 
            onLogout={handleLogout}
            showMenuButton={!isLargeScreen}
            showSearchBar={currentPage === 'dashboard'}
          />
          
          <View style={styles.contentArea}>
            <FadeTransition visible={currentPage === 'dashboard'}>
                <Dashboard />
            </FadeTransition>

            <FadeTransition visible={currentPage === 'projects'}>
                <Projects />
            </FadeTransition>

            <FadeTransition visible={currentPage === 'reports'}>
                <Reports />
            </FadeTransition>

            <FadeTransition visible={currentPage === 'team'}>
                <Employees />
            </FadeTransition>

            <FadeTransition visible={currentPage === 'analytics'}>
                <PlaceholderPage title="Detailed Analytics" />
            </FadeTransition>

            <FadeTransition visible={currentPage === 'settings'}>
                 <Settings />
            </FadeTransition>
          </View>
        </View>
      </View>

      {/* AI Chatbot (Floating) */}
      <AIChatbot />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <View style={styles.loadingOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Sign Out</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.destructiveButton]} 
                onPress={performLogout}
              >
                <Text style={styles.destructiveButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Signing out...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AdminContent />
    </ThemeProvider>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f9fafb',
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  desktopSidebar: {
    width: 260,
    height: '100%',
    zIndex: 20,
    borderRightWidth: 1,
    borderRightColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden', // Enforce boundary so child ScrollViews scroll
  },
  fadeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, 
    zIndex: 50,
  },
  overlayBackdrop: {
    position: 'absolute',
    top: 0, 
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  mobileSidebar: {
    width: 280,
    height: '100%',
    backgroundColor: '#0f172a',
    zIndex: 51,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999, 
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { position: 'fixed' as any }
    }),
  },
  loadingBox: {
    backgroundColor: isDark ? '#1e293b' : 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#1e293b',
  },
  confirmBox: {
    backgroundColor: isDark ? '#1e293b' : 'white',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#1e293b',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: isDark ? '#94a3b8' : '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
  },
  destructiveButton: {
    backgroundColor: '#fee2e2',
  },
  cancelButtonText: {
    color: isDark ? '#cbd5e1' : '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  destructiveButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
