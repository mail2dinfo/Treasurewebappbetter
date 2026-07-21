import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 24,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        color: '#111827',
    },
    subtitle: {
        fontSize: 8,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 12,
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
    },
    cell: {
        padding: 5,
        fontSize: 8,
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb',
    },
    headerCell: {
        padding: 5,
        fontSize: 8,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderRightColor: '#d1d5db',
    },
    colVehicle: { width: '14%' },
    colEngine: { width: '14%' },
    colChassis: { width: '16%' },
    colModel: { width: '18%' },
    colCustomer: { width: '20%' },
    colStatus: { width: '18%' },
    footer: {
        marginTop: 12,
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
    },
});

const VehicleFinanceVehicleReportPDF = ({ loans = [], generatedAt }) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <Text style={styles.title}>Vehicle Report</Text>
            <Text style={styles.subtitle}>
                Generated {generatedAt ? new Date(generatedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
            </Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.headerCell, styles.colVehicle]}>Vehicle No</Text>
                    <Text style={[styles.headerCell, styles.colEngine]}>Engine No</Text>
                    <Text style={[styles.headerCell, styles.colChassis]}>Chassis No</Text>
                    <Text style={[styles.headerCell, styles.colModel]}>Model</Text>
                    <Text style={[styles.headerCell, styles.colCustomer]}>Customer</Text>
                    <Text style={[styles.headerCell, styles.colStatus]}>Loan Status</Text>
                </View>

                {loans.map((loan, index) => (
                    <View key={loan.loanId || index} style={styles.tableRow}>
                        <Text style={[styles.cell, styles.colVehicle]}>{loan.vehicleNo || '-'}</Text>
                        <Text style={[styles.cell, styles.colEngine]}>{loan.engineNo || '-'}</Text>
                        <Text style={[styles.cell, styles.colChassis]}>{loan.chassisNo || '-'}</Text>
                        <Text style={[styles.cell, styles.colModel]}>{loan.model || '-'}</Text>
                        <Text style={[styles.cell, styles.colCustomer]}>{loan.customerName || '-'}</Text>
                        <Text style={[styles.cell, styles.colStatus]}>{loan.loanStatus || '-'}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.footer}>{loans.length} vehicle loan(s) in this report</Text>
        </Page>
    </Document>
);

export default VehicleFinanceVehicleReportPDF;
