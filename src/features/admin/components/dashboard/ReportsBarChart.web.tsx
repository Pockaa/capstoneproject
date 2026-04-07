import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', reports: 400, incidents: 20 },
  { name: 'Feb', reports: 300, incidents: 10 },
  { name: 'Mar', reports: 200, incidents: 5 },
  { name: 'Apr', reports: 278, incidents: 12 },
  { name: 'May', reports: 189, incidents: 8 },
  { name: 'Jun', reports: 239, incidents: 15 },
  { name: 'Jul', reports: 349, incidents: 22 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: '150px'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', marginRight: '8px', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '13px', color: '#374151' }}>Daily Reports: <span style={{ fontWeight: 600 }}>{payload[0]?.value}</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', marginRight: '8px', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '13px', color: '#374151' }}>Safety Incidents: <span style={{ fontWeight: 600 }}>{payload[1]?.value}</span></span>
        </div>
      </div>
    );
  }
  return null;
};

export function ReportsBarChart({ width }: { width?: number }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports vs Incidents</Text>
      </View>
      
      <View style={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} 
              content={(props: any) => <CustomTooltip {...props} />}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span style={{ color: '#4b5563', fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>{value}</span>}
            />
            <Bar 
              dataKey="reports" 
              name="Daily Reports" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              barSize={24} 
            />
            <Bar 
              dataKey="incidents" 
              name="Safety Incidents" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
              barSize={24} 
            />
          </BarChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  chartWrapper: {
    width: '100%',
    height: 300,
    minHeight: 300,
  }
});
