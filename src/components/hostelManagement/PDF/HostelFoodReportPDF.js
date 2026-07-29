import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, textAlign: 'center', color: '#555', marginBottom: 16 },
  dayBlock: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 10,
  },
  dayTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#111' },
  mealRow: { flexDirection: 'row', gap: 8 },
  mealBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  mealLabel: { fontSize: 8, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  mealCount: { fontSize: 14, fontWeight: 'bold', color: '#b91c1c', marginBottom: 4 },
  name: { fontSize: 8, color: '#333', marginBottom: 1 },
  empty: { fontSize: 8, color: '#999' },
  footer: { marginTop: 18, fontSize: 8, color: '#777', textAlign: 'center' },
});

const MEALS = ['breakfast', 'lunch', 'dinner'];

const HostelFoodReportPDF = ({
  hostelName = 'Hostel',
  weekLabel = '',
  days = [],
  showHostelOnNames = false,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Food Estimation Report</Text>
      <Text style={styles.subtitle}>
        {hostelName}
        {weekLabel ? ` · ${weekLabel}` : ''}
        {' · '}
        Generated {new Date().toLocaleDateString('en-IN')}
      </Text>

      {(days || []).map((day) => (
        <View key={day.meal_date} style={styles.dayBlock} wrap={false}>
          <Text style={styles.dayTitle}>
            {day.weekday || ''} · {day.meal_date}
          </Text>
          <View style={styles.mealRow}>
            {MEALS.map((meal) => {
              const count = day[meal]?.count || 0;
              const residents = day[meal]?.residents || [];
              return (
                <View key={meal} style={styles.mealBox}>
                  <Text style={styles.mealLabel}>{meal}</Text>
                  <Text style={styles.mealCount}>{count}</Text>
                  {residents.length === 0 ? (
                    <Text style={styles.empty}>None available</Text>
                  ) : (
                    residents.map((r) => (
                      <Text key={`${r.id || r.name}-${r.hostel_name || ''}`} style={styles.name}>
                        {showHostelOnNames && r.hostel_name
                          ? `${r.name} (${r.hostel_name})`
                          : r.name}
                      </Text>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {(!days || days.length === 0) && (
        <Text style={{ marginTop: 12, textAlign: 'center', color: '#666' }}>
          No meal updates for this week yet.
        </Text>
      )}

      <Text style={styles.footer}>MyTreasure · Hostel Management</Text>
    </Page>
  </Document>
);

export default HostelFoodReportPDF;
