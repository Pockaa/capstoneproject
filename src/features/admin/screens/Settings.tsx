import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export function Settings() {
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@example.com');
  const [phone, setPhone] = useState('+1 234 567 8900');
  
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const { isDark: darkMode, setIsDark: setDarkMode } = useTheme();
  const [twoFactor, setTwoFactor] = useState(false);

  const styles = getStyles(darkMode);

  const handleSave = () => {
    if (Platform.OS === 'web') {
      window.alert('Settings saved successfully!');
    } else {
      // In a real app we'd use Alert from react-native here
      alert('Settings saved successfully!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your account preferences and system configuration.</Text>
      </View>

      <View style={styles.grid}>
        {/* Profile Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Email Notifications</Text>
                <Text style={styles.switchSubLabel}>Receive daily summaries and alerts</Text>
              </View>
              <Switch value={emailNotifs} onValueChange={setEmailNotifs} trackColor={{ true: '#3b82f6', false: darkMode ? '#4b5563' : '#cbd5e1' }} />
            </View>
            <View style={styles.divider} />
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Push Notifications</Text>
                <Text style={styles.switchSubLabel}>Real-time alerts on your devices</Text>
              </View>
              <Switch value={pushNotifs} onValueChange={setPushNotifs} trackColor={{ true: '#3b82f6', false: darkMode ? '#4b5563' : '#cbd5e1' }} />
            </View>
            <View style={styles.divider} />
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Dark Mode</Text>
                <Text style={styles.switchSubLabel}>Switch to a darker theme</Text>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: '#3b82f6', false: darkMode ? '#4b5563' : '#cbd5e1' }} />
            </View>
          </View>
        </View>
        
        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Two-Factor Authentication</Text>
                <Text style={styles.switchSubLabel}>Add an extra layer of security to your account</Text>
              </View>
              <Switch value={twoFactor} onValueChange={setTwoFactor} trackColor={{ true: '#3b82f6', false: darkMode ? '#4b5563' : '#cbd5e1' }} />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.buttonOutline}>
              <Feather name="lock" size={16} color={darkMode ? '#d1d5db' : '#4b5563'} />
              <Text style={styles.buttonOutlineText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#f9fafb',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: isDark ? '#f9fafb' : '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: isDark ? '#9ca3af' : '#6b7280',
    marginTop: 6,
  },
  grid: {
    gap: 32,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#e5e7eb' : '#374151',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#e5e7eb' : '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: isDark ? '#4b5563' : '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: isDark ? '#f9fafb' : '#111827',
    backgroundColor: isDark ? '#374151' : '#f9fafb',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: isDark ? '#f9fafb' : '#111827',
  },
  switchSubLabel: {
    fontSize: 13,
    color: isDark ? '#9ca3af' : '#6b7280',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
    marginVertical: 16,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? '#4b5563' : '#d1d5db',
    backgroundColor: isDark ? '#1f2937' : 'white',
    gap: 8,
  },
  buttonOutlineText: {
    color: isDark ? '#d1d5db' : '#4b5563',
    fontWeight: '600',
    fontSize: 14,
  },
  actions: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});
