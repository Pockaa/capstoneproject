import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Animated, Easing, ActivityIndicator, Alert, useWindowDimensions, SafeAreaView, StatusBar } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeScreen: 'Dashboard' | 'Schedules' | 'Inventory' | 'SubmitReport' | 'ViewReports';
}

const navItems = [
  { key: 'Dashboard', label: 'Dashboard', route: 'Dashboard', icon: 'dashboard', library: 'MaterialIcons' },
  { key: 'Schedules', label: 'Schedules', route: 'Schedules', icon: 'calendar-blank', library: 'MaterialCommunityIcons' },
  { key: 'Inventory', label: 'Inventory', route: 'Inventory', icon: 'package-variant', library: 'MaterialCommunityIcons' },
  { key: 'SubmitReport', label: 'Make a Report', route: 'SubmitReport', icon: 'description', library: 'MaterialIcons' },
] as const;

// Bottom tab items for mobile
const mobileTabItems = [
  { key: 'Dashboard', label: 'Home', route: 'Dashboard', icon: 'dashboard', library: 'MaterialIcons' },
  { key: 'Schedules', label: 'Schedules', route: 'Schedules', icon: 'calendar-blank', library: 'MaterialCommunityIcons' },
  { key: 'Inventory', label: 'Inventory', route: 'Inventory', icon: 'package-variant', library: 'MaterialCommunityIcons' },
  { key: 'SubmitReport', label: 'Report', route: 'SubmitReport', icon: 'description', library: 'MaterialIcons' },
] as const;

export function SidebarLayout({ children, activeScreen }: SidebarLayoutProps) {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  useEffect(() => {
    // Reset and Start Animation on mount or activeScreen change
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [activeScreen]);

  const performLogout = () => {
     setShowLogoutConfirm(false);
     setIsLoggingOut(true);
     // Simulate cleanup
     setTimeout(() => {
         navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            })
         );
     }, 1500);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  // Helper Overlay Component for Loading
  const LoadingOverlay = () => (
    <View style={sharedStyles.loadingOverlay}>
      <View style={sharedStyles.loadingBox}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={sharedStyles.loadingText}>Signing out...</Text>
      </View>
    </View>
  );

  // Helper Modal for Confirmation
  const ConfirmationModal = () => (
    <View style={sharedStyles.loadingOverlay}>
      <View style={sharedStyles.confirmBox}>
        <Text style={sharedStyles.confirmTitle}>Sign Out</Text>
        <Text style={sharedStyles.confirmMessage}>Are you sure you want to sign out?</Text>
        <View style={sharedStyles.confirmButtons}>
          <TouchableOpacity 
            style={[sharedStyles.modalButton, sharedStyles.cancelButton]} 
            onPress={() => setShowLogoutConfirm(false)}
          >
            <Text style={sharedStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[sharedStyles.modalButton, sharedStyles.destructiveButton]} 
            onPress={performLogout}
          >
            <Text style={sharedStyles.destructiveButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // NATIVE MOBILE: persistent header + bottom bar are managed by App.tsx shell.
  // SidebarLayout is just a transparent content wrapper here.
  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1 }}>
        {children}
        {showLogoutConfirm && <ConfirmationModal />}
        {isLoggingOut && <LoadingOverlay />}
      </View>
    );
  }

  // SMALL WEB SCREEN: keep the mobile-style layout with header + bottom tabs
  if (!isLargeScreen) {
    return (
      <SafeAreaView style={[mobileStyles.safeArea, { height: '100vh' as any }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Mobile Header Banner */}
        <View style={mobileStyles.header}>
            <View style={mobileStyles.headerBrand}>
                <View style={mobileStyles.headerIcon}>
                    <MaterialCommunityIcons name="hard-hat" size={18} color="white" />
                </View>
                <Text style={mobileStyles.headerTitle}>SiteTrack</Text>
            </View>
        </View>

        <Animated.View style={[mobileStyles.content, { opacity: fadeAnim }]}>
          {children}
        </Animated.View>
        <View style={mobileStyles.bottomBar}>
          {mobileTabItems.map((item) => {
            const isActive = item.key === activeScreen;
            const IconComponent = item.library === 'MaterialIcons' ? MaterialIcons : MaterialCommunityIcons;
            return (
              <TouchableOpacity
                key={item.key}
                style={mobileStyles.tab}
                onPress={() => {
                  if (!isActive) navigation.navigate(item.route);
                }}
                activeOpacity={0.7}
              >
                <IconComponent
                  name={item.icon as any}
                  size={24}
                  color={isActive ? '#f97316' : '#9ca3af'}
                />
                <Text style={[mobileStyles.tabLabel, isActive && mobileStyles.tabLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {showLogoutConfirm && <ConfirmationModal />}
        {isLoggingOut && <LoadingOverlay />}
      </SafeAreaView>
    );
  }


  // WEB LAYOUT: sidebar + scrollable content
  return (
    <View style={webStyles.webRoot}>
      {/* Fixed sidebar nav */}
      <View style={webStyles.sidebarNav}>
        {/* Branding */}
        <View style={webStyles.sidebarBranding}>
          <View style={webStyles.sidebarBrandIcon}>
            <MaterialCommunityIcons name="hard-hat" size={24} color="white" />
          </View>
          <View>
            <Text style={webStyles.sidebarBrandTitle}>SiteTrack</Text>
            <Text style={webStyles.sidebarBrandRole}>User Portal</Text>
          </View>
        </View>

        {/* Nav Links */}
        <ScrollView style={webStyles.sidebarLinks} showsVerticalScrollIndicator={false}>
          <Text style={webStyles.menuLabel}>MAIN MENU</Text>
          {navItems.map((item) => {
            const isActive = item.key === activeScreen;
            const IconComponent = item.library === 'MaterialIcons' ? MaterialIcons : MaterialCommunityIcons;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                    webStyles.sidebarLink, 
                    isActive && webStyles.sidebarLinkActive
                ]}
                onPress={() => {
                  if (!isActive) navigation.navigate(item.route);
                }}
                activeOpacity={0.7}
              >
                <IconComponent
                  name={item.icon as any}
                  size={20}
                  color={isActive ? '#ea580c' : '#9a3412'}
                />
                <Text style={[webStyles.sidebarLinkText, isActive && webStyles.sidebarLinkTextActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={webStyles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity 
            style={[webStyles.sidebarLink, webStyles.logoutItem]} 
            onPress={handleLogout} 
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={20} color="#ef4444" />
            <Text style={[webStyles.sidebarLinkText, webStyles.logoutText]}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={webStyles.sidebarFooter}>
            <Text style={webStyles.versionText}>v1.0.0</Text>
        </View>
      </View>

      {/* Scrollable main area with Fade Animation */}
      <Animated.ScrollView 
        style={[webStyles.webMainScroll, { opacity: fadeAnim }]}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {children}
      </Animated.ScrollView>
      
      {showLogoutConfirm && <ConfirmationModal />}
      {isLoggingOut && <LoadingOverlay />}
    </View>
  );
}

// ── Shared Styles ──
const sharedStyles = StyleSheet.create({
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
    backgroundColor: 'white',
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
    color: '#111827',
  },
  confirmBox: {
    backgroundColor: 'white',
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
    color: '#1f2937',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#f3f4f6',
  },
  destructiveButton: {
    backgroundColor: '#fff7ed', // Light orange background
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 14,
  },
  destructiveButtonText: {
    color: '#f97316', // Orange text
    fontWeight: '600',
    fontSize: 14,
  },
});

// ── Mobile Styles ──
const mobileStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#ea580c',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#431407',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#f97316',
    fontWeight: '600',
  },
});

// ── Web / Sidebar Styles ──
const webStyles = StyleSheet.create({
  webRoot: {
    flexDirection: 'row' as any,
    height: '100vh' as any,
    backgroundColor: '#f1f5f9', // Light slate
  },
  webMainScroll: {
    flex: 1,
  },
  sidebarNav: {
    width: 260,
    backgroundColor: '#fff7ed', // Orange 50
    borderRightWidth: 1,
    borderRightColor: '#fed7aa', // Orange 200
    flexDirection: 'column',
    height: '100%' as any,
  },
  sidebarBranding: {
    padding: 24,
    paddingTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa', // Orange 200
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sidebarBrandIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ea580c', // Orange 600
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBrandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#431407', // Orange 950
    letterSpacing: -0.5,
  },
  sidebarBrandRole: {
    fontSize: 12,
    color: '#9a3412', // Orange 800
    fontWeight: '500',
  },
  sidebarLinks: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a3412', // Orange 800
    marginBottom: 16,
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    }),
  },
  sidebarLinkActive: {
    backgroundColor: '#ffedd5', // Orange 100
  },
  sidebarLinkText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#7c2d12', // Orange 900
    fontWeight: '500',
  },
  sidebarLinkTextActive: {
    color: '#c2410c', // Orange 700
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#f97316', // Orange 500
  },
  logoutItem: {
    marginTop: 24, 
    borderTopWidth: 1,
    borderTopColor: '#fed7aa', // Orange 200
    paddingTop: 16,
    borderRadius: 0,
  },
  logoutText: {
    color: '#ef4444', 
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#fed7aa', // Orange 200
  },
  versionText: {
    color: '#9a3412', // Orange 800
    fontSize: 12,
  }
});
