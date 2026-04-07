import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

export function Header({ onMenuClick, onLogout, showMenuButton = false, showSearchBar = false }: { onMenuClick: () => void; onLogout: () => void; showMenuButton?: boolean, showSearchBar?: boolean }) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 640;
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showMenuButton && (
          <TouchableOpacity onPress={onMenuClick} style={styles.menuButton}>
            <Feather name="menu" size={24} color="#64748b" />
          </TouchableOpacity>
        )}
        
        {/* Search Bar - conditionally rendered */}
        {showSearchBar ? (
            !isSmallScreen ? (
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search projects, reports..."
                        placeholderTextColor="#9ca3af"
                        style={styles.searchInput}
                    />
                </View>
            ) : (
                <TouchableOpacity style={styles.iconButton}>
                    <Feather name="search" size={20} color="#64748b" />
                </TouchableOpacity>
            )
        ) : null}
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="bell" size={20} color="#64748b" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>

        {/* User Profile */}
        <View style={styles.userSection}>
          {!isSmallScreen && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Admin User</Text>
                <Text style={styles.userRole}>Project Manager</Text>
              </View>
          )}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' }}
            style={styles.avatar}
          />
        </View>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  header: {
    height: 72,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
    ...Platform.select({
      web: {
        // position: 'sticky', // Removed as layout handles fixed header
        // top: 0,
      }
    })
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: isDark ? '#f8fafc' : '#1e293b',
    ...Platform.select({
      web: { outlineStyle: 'none' as any }
    })
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'transparent', // Prepare for hover state if needed
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: isDark ? '#334155' : '#e2e8f0',
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  userRole: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  menuButton: {
    padding: 4,
  },
});
