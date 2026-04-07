import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  Animated,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import supabase from "../../config/supabaseClient";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowModal(true);
  };

  const dismissError = () => {
    setShowModal(false);
  };

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email) {
      showError("Please enter your email address.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Developer bypass for quick testing
    if (cleanEmail === 'admin' || cleanEmail === 'test') {
      navigation.navigate(cleanEmail === 'admin' ? "Admin" : "Dashboard");
      return;
    }

    setLoading(true);
    try {
      // Query our custom users table to see if the email exists
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('email', cleanEmail)
        .limit(1);

      if (error) {
        showError("Could not connect to the database.");
      } else if (!data || data.length === 0) {
        console.log("email does not exist");
        showError("Email doesn't exist.");
      } else {
        const user = data[0];
        navigation.navigate("Dashboard", { userId: user.id, userName: user.name });
      }
    } catch (err) {
      showError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1599995903128-531fc7fb694b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlfGVufDF8fHx8MTc2MTczNDE2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="hard-hat" size={48} color="white" />
          </View>
          <Text style={styles.brandTitle}>SiteTrack</Text>
          <Text style={styles.brandSubtitle}>Construction Management</Text>
        </View>
        <View style={styles.safetyStripe} />
      </View>
      <View style={[styles.formContainer, { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.warningBadge}>
          <MaterialIcons name="warning" size={20} color="black" />
          <Text style={styles.warningText}>Authorized Personnel Only</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="mail"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                style={styles.formInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.formInput}
                secureTextEntry
              />
            </View>
          </View>
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          <TouchableOpacity 
            style={[styles.loginButton, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <MaterialCommunityIcons name="hard-hat" size={20} color="white" />
            <Text style={styles.loginButtonText}>{loading ? 'Authenticating...' : 'Sign In to Site'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loginFooter}>
          <Text style={styles.footerText}>Safety First • Secure Access</Text>
        </View>
      </View>

      {/* Custom Error Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissError}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={dismissError}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <MaterialIcons name="shield" size={32} color="white" />
            </View>
            <Text style={styles.modalTitle}>Access Denied</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={dismissError}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffbeb",
  },
  heroSection: {
    height: 256,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    backgroundColor: "#f97316",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  brandTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
  },
  safetyStripe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "#facc15",
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#facc15",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: "black",
  },
  form: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 8,
  },
  formLabel: {
    color: "#374151",
    fontSize: 14,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingLeft: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  formInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f97316",
    height: 48,
    borderRadius: 6,
    marginTop: 24,
  },
  loginButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  forgotPassword: {
    marginTop: 16,
  },
  forgotPasswordText: {
    color: "#4b5563",
    fontSize: 14,
    textAlign: "center",
  },
  loginFooter: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "#d1d5db",
    borderStyle: "dashed",
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
      default: { elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16 },
    }),
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: "#f97316",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 4px 6px -1px rgba(249, 115, 22, 0.3)" },
      default: { elevation: 3 },
    }),
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default LoginScreen;
