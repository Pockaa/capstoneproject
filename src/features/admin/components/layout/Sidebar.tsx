import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

// Icon mapping
const Icons = {
  Dashboard: (props: any) => <Feather name="home" {...props} />,
  Projects: (props: any) => <MaterialCommunityIcons name="office-building" {...props} />,
  Reports: (props: any) => <MaterialCommunityIcons name="clipboard-list" {...props} />,
  Team: (props: any) => <MaterialCommunityIcons name="account-group" {...props} />, 
  Analytics: (props: any) => <Feather name="bar-chart-2" {...props} />, 
  Settings: (props: any) => <Feather name="settings" {...props} />,
  LogOut: (props: any) => <Feather name="log-out" {...props} />,
};

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'projects', label: 'Projects', icon: Icons.Projects },
    { id: 'reports', label: 'Reports', icon: Icons.Reports },
    { id: 'team', label: 'Employees', icon: Icons.Team },
    { id: 'analytics', label: 'Analytics', icon: Icons.Analytics },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
    { id: 'logout', label: 'Sign Out', icon: Icons.LogOut, isDanger: true },
  ];

  return (
    <View style={styles.container}>
      {/* Header / Logo */}
      <View style={styles.header}>  
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="hard-hat" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.logoText}>SiteTrack</Text>
            <Text style={styles.roleText}>Admin Portal</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.menuLabel}>MAIN MENU</Text>
        {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            // @ts-ignore
            const isLogout = item.id === 'logout';
            
            return (
                <TouchableOpacity
                    key={item.id}
                    onPress={() => isLogout ? onLogout() : onNavigate(item.id)}
                    activeOpacity={0.7}
                    style={[
                        styles.menuItem,
                        isActive && styles.activeMenuItem,
                        isLogout && styles.logoutItem
                    ]}
                >
                    <Icon 
                        size={20} 
                        color={
                            isLogout ? '#ef4444' : 
                            isActive ? '#3b82f6' : '#94a3b8'
                        } 
                    />
                    <Text style={[
                        styles.menuText, 
                        isActive && styles.activeMenuText,
                        isLogout && styles.logoutText
                    ]}>
                        {item.label}
                    </Text>
                    {isActive && !isLogout && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
            );
        })}
      </ScrollView>

      {/* Footer Area - can be used for version info or left empty since we moved logout up */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: isDark ? '#0f172a' : '#1e293b',
    height: '100%',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: isDark ? '#1e293b' : '#334155',
  },
  header: {
    padding: 24,
    paddingTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#334155',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6', // Brand Blue
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
  },
  roleText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 16,
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  activeMenuItem: {
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)',
  },
  logoutItem: {
    marginTop: 24, 
    borderTopWidth: 1,
    borderTopColor: isDark ? '#1e293b' : '#334155',
    paddingTop: 16,
    borderRadius: 0,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  activeMenuText: {
    color: 'white',
    fontWeight: '600',
  },
  logoutText: {
    color: '#ef4444', 
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3b82f6',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#1e293b' : '#334155',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
  }
});
