import React, { useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import LoginScreen from './src/features/auth/LoginScreen';
import DashboardScreen from './src/features/user/screens/DashboardScreen';
import { ScheduleViewer } from './src/features/user/screens/ScheduleViewer';
import { InventoryViewer } from './src/features/user/screens/InventoryViewer';
import { ReportForm } from './src/features/user/screens/ReportForm';
import { ReportViewer } from './src/features/user/screens/ReportViewer';
import AdminApp from './src/features/admin/App';
import supabase from './src/config/supabaseClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Platform,
  Easing,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';


const TAB_ORDER: Record<string, number> = {
  Login: -1,
  Dashboard: 0,
  Schedules: 1,
  Inventory: 2,
  SubmitReport: 3,
};

let _tabDir = 1;
const mobileTabTransition = Platform.OS !== 'web' ? {
  cardStyleInterpolator: ({ current, layouts }: any) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            // _tabDir is read at card-mount time (before animation starts)
            outputRange: [layouts.screen.width * 0.35 * _tabDir, 0],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.7, 1],
      }),
    },
  }),
  transitionSpec: {
    open: { animation: 'timing' as const, config: { duration: 280, easing: Easing.out(Easing.poly(4)) } },
    close: { animation: 'timing' as const, config: { duration: 240, easing: Easing.in(Easing.poly(4)) } },
  },
} : {};

const mobileModalTransition = Platform.OS !== 'web' ? {
  cardStyleInterpolator: ({ current, layouts }: any) => ({
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height * 0.12, 0],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0.6, 1],
      }),
    },
  }),
  transitionSpec: {
    open: { animation: 'timing' as const, config: { duration: 320, easing: Easing.out(Easing.poly(5)) } },
    close: { animation: 'timing' as const, config: { duration: 260, easing: Easing.in(Easing.poly(4)) } },
  },
} : {};

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `;
  document.head.appendChild(style);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  projectId?: string;
  projectName?: string;
  taskDone: string;
  currentTask: string;
  materialUsed: string;
  materialRequest: string;
  date: string;
  imageUrl?: string;    // legacy single photo
  imageUrls?: string[]; // multi-photo (new)
  submittedAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Dashboard: { userId?: string; userName?: string } | undefined;
  Admin: undefined;
  Schedules: undefined;
  Inventory: undefined;
  SubmitReport: undefined;
  PreviewReport: { report: Omit<Report, 'id' | 'submittedAt'> };
  ViewReport: { report: Report };
};


const navigationRef = createNavigationContainerRef<RootStackParamList>();


const TAB_SCREENS = new Set(['Dashboard', 'Schedules', 'Inventory', 'SubmitReport']);

const mobileTabItems = [
  { key: 'Dashboard',    label: 'Home',      route: 'Dashboard',    icon: 'dashboard',       lib: 'MI'  },
  { key: 'Schedules',    label: 'Schedules', route: 'Schedules',    icon: 'calendar-blank',  lib: 'MCI' },
  { key: 'Inventory',    label: 'Inventory', route: 'Inventory',    icon: 'package-variant', lib: 'MCI' },
  { key: 'SubmitReport', label: 'Report',    route: 'SubmitReport', icon: 'description',     lib: 'MI'  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Stack = createStackNavigator<RootStackParamList>();

const DashboardWrapper = ({ props, loggedInUser, setLoggedInUser }: any) => {
  const params = props.route.params as { userId?: string; userName?: string } | undefined;
  React.useEffect(() => {
    if (params?.userId && params?.userName && (!loggedInUser || loggedInUser.id !== params.userId)) {
      setLoggedInUser({ id: params.userId, name: params.userName });
    }
  }, [params?.userId, params?.userName, loggedInUser, setLoggedInUser]);
  return <DashboardScreen {...props} />;
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [draftReport, setDraftReport] = useState<Omit<Report, 'id' | 'submittedAt'> | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; name: string } | null>(null);
  const [activeRoute, setActiveRoute] = useState<string>('Login');

  const isTabScreen = TAB_SCREENS.has(activeRoute);

  const navigator = (
    <Stack.Navigator
      id="RootStack"
      initialRouteName="Login"
      screenOptions={{ headerShown: false, ...mobileTabTransition }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard">
        {(props) => <DashboardWrapper props={props} loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />}
      </Stack.Screen>
      <Stack.Screen name="Admin" component={AdminApp} />
      <Stack.Screen name="Schedules">
        {(props) => <ScheduleViewer {...props} onBack={() => props.navigation.navigate('Dashboard')} />}
      </Stack.Screen>
      <Stack.Screen name="Inventory">
        {(props) => <InventoryViewer {...props} onBack={() => props.navigation.navigate('Dashboard')} />}
      </Stack.Screen>
      <Stack.Screen name="SubmitReport">
        {(props) => (
          <ReportForm
            {...props}
            onPreview={(report) => {
              setDraftReport(report);
              props.navigation.navigate('PreviewReport', { report });
            }}
            onBack={() => props.navigation.navigate('Dashboard')}
            draftData={draftReport}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PreviewReport" options={mobileModalTransition}>
        {(props) => (
          <ReportViewer
            {...props}
            report={props.route.params?.report || draftReport}
            mode="preview"
            onSubmit={async () => {
              if (!draftReport) return;
              const userId = loggedInUser?.id;
              if (!userId) {
                alert('User not logged in. Please log in again.');
                props.navigation.navigate('Login');
                return;
              }
              try {
                // ── Upload images to Supabase Storage ────────────────────────
                const allLocalUris = draftReport.imageUrls?.length
                  ? draftReport.imageUrls
                  : draftReport.imageUrl ? [draftReport.imageUrl] : [];

                const uploadedUrls: string[] = [];

                for (const imgUri of allLocalUris) {
                  try {
                    let ext = 'jpg';
                    let baseData = imgUri;
                    
                    if (imgUri.startsWith('data:')) {
                      const match = imgUri.match(/data:image\/([a-zA-Z0-9+]+);/);
                      if (match && match[1]) {
                        ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                      }
                      baseData = imgUri.split(',')[1];
                    } else {
                      ext = imgUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
                      baseData = await readAsStringAsync(imgUri, { encoding: EncodingType.Base64 });
                    }

                    const mime     = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                    const fileName = `reports/${userId}/${Date.now()}_${uploadedUrls.length}.${ext}`;

                    const binaryStr = atob(baseData);
                    const bytes     = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                      .from('report-images')
                      .upload(fileName, bytes, { contentType: mime, upsert: true });

                    if (!uploadError && uploadData?.path) {
                      const { data: urlData } = supabase.storage.from('report-images').getPublicUrl(uploadData.path);
                      if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
                    } else if (uploadError) {
                      console.warn('Image upload failed:', uploadError.message);
                    }
                  } catch (e: any) {
                    console.warn('Image upload error:', e?.message || e);
                  }
                }

                // ── Build insert payload ──
                const insertPayload: Record<string, any> = {
                  user_id:          userId,
                  task_done:        draftReport.taskDone,
                  current_task:     draftReport.currentTask,
                  material_used:    draftReport.materialUsed,
                  material_request: draftReport.materialRequest,
                  date:             draftReport.date || new Date().toISOString().split('T')[0],
                  type:             'Daily Log',
                };
                if (draftReport.projectId)      insertPayload.project_id  = draftReport.projectId;
                if (uploadedUrls.length > 0)    insertPayload.image_urls  = uploadedUrls;         // array
                if (uploadedUrls.length === 1)  insertPayload.image_url   = uploadedUrls[0];      // legacy single

                const { error } = await supabase.from('reports').insert(insertPayload);
                if (error) { alert(`Error submitting report: ${error.message}`); return; }

                const newReport: Report = {
                  ...draftReport,
                  id: Date.now().toString(),
                  submittedAt: new Date().toISOString(),
                };
                setCurrentReport(newReport);
                setReports([newReport, ...reports]);
                setDraftReport(null);
                props.navigation.navigate('ViewReport', { report: newReport });
              } catch (err) {
                console.error(err);
                alert('Failed to submit report.');
              }
            }}
            onBackToEdit={() => props.navigation.navigate('SubmitReport')}
            onBack={() => props.navigation.navigate('Dashboard')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ViewReport" options={mobileModalTransition}>
        {(props) => (
          <ReportViewer
            {...props}
            report={props.route.params?.report || currentReport}
            mode="submitted"
            onBack={() => props.navigation.navigate('Dashboard')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={(state) => {
          if (!state) return;
          const newRoute = state.routes[state.index]?.name;
          if (newRoute && newRoute !== activeRoute) {
            // Compute direction for navigations triggered from within screens
            // (bottom-bar taps already set _tabDir before calling navigate)
            const curIdx = TAB_ORDER[activeRoute] ?? 0;
            const newIdx = TAB_ORDER[newRoute] ?? 0;
            if (newIdx !== curIdx) _tabDir = newIdx >= curIdx ? 1 : -1;
            setActiveRoute(newRoute);
          }
        }}
      >
        {Platform.OS !== 'web' ? (
          // ── Mobile: persistent header + bottom bar, only content area animates ──
          <SafeAreaView style={shellStyles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Persistent Header — only shown for main tab screens */}
            {isTabScreen && (
              <View style={shellStyles.header}>
                <View style={shellStyles.headerBrand}>
                  <View style={shellStyles.headerIcon}>
                    <MaterialCommunityIcons name="hard-hat" size={18} color="white" />
                  </View>
                  <Text style={shellStyles.headerTitle}>SiteTrack</Text>
                </View>
              </View>
            )}

            {/* Stack Navigator — only THIS area animates during transitions */}
            <View style={{ flex: 1, overflow: 'hidden' }}>
              {navigator}
            </View>

            {/* Persistent Bottom Tab Bar — only shown for main tab screens */}
            {isTabScreen && (
              <View style={shellStyles.bottomBar}>
                {mobileTabItems.map((item) => {
                  const isActive = item.key === activeRoute;
                  const Icon = item.lib === 'MI' ? MaterialIcons : MaterialCommunityIcons;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={shellStyles.tab}
                      onPress={() => {
                        // Set direction BEFORE navigate so interpolator reads it correctly
                        const curIdx = TAB_ORDER[activeRoute] ?? 0;
                        const newIdx = TAB_ORDER[item.route] ?? 0;
                        _tabDir = newIdx >= curIdx ? 1 : -1;
                        navigationRef.navigate(item.route as any);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[shellStyles.tabIndicator, isActive && shellStyles.tabIndicatorActive]} />
                      <Icon
                        name={item.icon as any}
                        size={24}
                        color={isActive ? '#f97316' : '#9ca3af'}
                      />
                      <Text style={[shellStyles.tabLabel, isActive && shellStyles.tabLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </SafeAreaView>
        ) : (
          // ── Web: Stack Navigator as-is (SidebarLayout handles the web shell) ──
          navigator
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// ─── Persistent Shell Styles (mobile only) ────────────────────────────────────

const shellStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 4,
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: '#f97316',
  },
  tabLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#f97316',
    fontWeight: '700',
  },
});
