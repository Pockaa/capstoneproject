import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../../../context/ThemeContext';
import supabase from '../../../../config/supabaseClient';

// We will load data dynamically
const defaultData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    { data: [0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` },
    { data: [0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` },
  ],
};

const screenWidth = Dimensions.get('window').width;

const getChartConfig = (isDark: boolean) => ({
  backgroundGradientFrom: isDark ? '#1e293b' : '#ffffff',
  backgroundGradientTo: isDark ? '#1e293b' : '#ffffff',
  color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
});

export function ReportsBarChart({ width }: { width?: number }) {
  const chartWidth = width || (screenWidth > 600 ? 600 : screenWidth - 40);
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const chartConfig = getChartConfig(isDark);

  const [chartData, setChartData] = useState<any>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('reports').select('type, date, created_at');
      
      if (data && !error) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const monthLabels = [];
        const dailyReports = [0, 0, 0, 0, 0, 0];
        const safetyIncidents = [0, 0, 0, 0, 0, 0];
        
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthLabels.push(months[d.getMonth()]);
        }
        
        data.forEach(report => {
          const rDate = new Date(report.date || report.created_at);
          const diffMonths = (now.getFullYear() - rDate.getFullYear()) * 12 + now.getMonth() - rDate.getMonth();
          if (diffMonths >= 0 && diffMonths < 6) {
            const idx = 5 - diffMonths;
            if (report.type === 'Incident Report') {
              safetyIncidents[idx]++;
            } else {
              dailyReports[idx]++;
            }
          }
        });

        // Multiply by 10 for better visual representation since chart-kit scales to max value 
        // and small real values might overlap labels, or we just leave real counts
        setChartData({
          labels: monthLabels,
          datasets: [
            { data: dailyReports, color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` },
            { data: safetyIncidents, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` },
          ],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports vs Incidents</Text>
      <View style={styles.chartContainer}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <BarChart
            data={chartData}
            width={chartWidth} 
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero
            showValuesOnTopOfBars={false}
            withInnerLines={true}
          />
        )}
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#f8fafc' : '#111827',
    marginBottom: 24,
    width: '100%',
    textAlign: 'left',
  },
  chartContainer: {
    flex: 1,
    minHeight: 300,
    width: '100%',
  },
});
