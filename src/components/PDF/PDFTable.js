import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    table: {
        width: '100%',
        marginBottom: 20,
        marginTop: 10,
        border: '1px solid #e0e0e0',
    },
    row: {
        flexDirection: 'row',
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        alignItems: 'stretch',
    },
    snCell: {
        width: 28,
        flexGrow: 0,
        flexShrink: 0,
        paddingVertical: 6,
        paddingHorizontal: 3,
        fontSize: 8,
        color: '#424242',
        backgroundColor: '#DAF7A6',
        fontWeight: 700,
        textAlign: 'center',
    },
    snRow: {
        width: 28,
        flexGrow: 0,
        flexShrink: 0,
        paddingVertical: 6,
        paddingHorizontal: 3,
        fontSize: 8,
        color: '#424242',
        fontWeight: 700,
        textAlign: 'center',
    },
    cell: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        paddingVertical: 6,
        paddingHorizontal: 4,
        justifyContent: 'center',
        minWidth: 0,
    },
    cellText: {
        fontSize: 8,
        color: '#424242',
        lineHeight: 1.3,
    },
    headerCell: {
        backgroundColor: '#DAF7A6',
    },
    headerText: {
        fontSize: 8,
        fontWeight: 700,
        color: '#1b5e20',
        lineHeight: 1.2,
    },
    innerHeading: {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 10,
        marginTop: 8,
    },
});

const wrapPdfValue = (value) =>
    String(value ?? '')
        .replace(/\//g, '/\u200B')
        .replace(/-/g, '-\u200B');

const PDFTable = ({
    data,
    heading,
    tableHeaders,
}) => {
    const safeData = Array.isArray(data) ? data : [];
    const safeTableHeaders = Array.isArray(tableHeaders) ? tableHeaders : [];
    const safeHeading = heading || 'Report';

    const renderCell = (header, item, dataIndex, isHeader) => {
        const flex = Number(header?.flex) > 0 ? Number(header.flex) : 1;
        const align = header?.align === 'right' ? 'right' : 'left';
        const raw = isHeader
            ? (header?.title || '')
            : (header?.render
                ? header.render(item?.[header.value], item, dataIndex)
                : item?.[header?.value]);
        const display = wrapPdfValue(raw);

        return (
            <View
                key={`${isHeader ? 'h' : 'c'}-${header?.value || header?.title || dataIndex}`}
                style={[
                    styles.cell,
                    { flexGrow: flex, flexShrink: 1, flexBasis: 0 },
                    isHeader ? styles.headerCell : null,
                ]}
            >
                <Text style={[isHeader ? styles.headerText : styles.cellText, { textAlign: align }]}>
                    {display}
                </Text>
            </View>
        );
    };

    return (
        <View wrap>
            <Text style={styles.innerHeading}>{safeHeading}</Text>
            <View style={styles.table}>
                <View style={styles.row} wrap={false}>
                    <Text style={styles.snCell}>S.N</Text>
                    {safeTableHeaders.map((header, index) => renderCell(header, null, index, true))}
                </View>
                {safeData.map((item, dataIndex) => (
                    <View key={dataIndex} style={styles.row} wrap={false}>
                        <Text style={styles.snRow}>{dataIndex + 1}.</Text>
                        {safeTableHeaders.map((header, headerIndex) =>
                            renderCell(header, item, dataIndex, false)
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

export default PDFTable;
