import { FlatList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useVitals } from '@/lib/vitals-context';
import { VITAL_PROFILES } from '@/lib/ble';
import type { VitalReading } from '@/lib/types';

function describe(reading: VitalReading): string {
  switch (reading.kind) {
    case 'spo2':
      return `${reading.spo2Percent.toFixed(0)}% SpO2, ${reading.pulseRateBpm.toFixed(0)} bpm`;
    case 'bloodPressure':
      return `${reading.systolicMmHg.toFixed(0)}/${reading.diastolicMmHg.toFixed(0)} mmHg`;
    case 'temperature':
      return `${reading.temperatureCelsius.toFixed(1)} °C`;
  }
}

export default function HistoryScreen() {
  const { readings } = useVitals();

  return (
    <View style={styles.container}>
      <FlatList
        data={readings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No readings captured yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{VITAL_PROFILES[item.kind].label}</Text>
              <Text style={styles.rowValue}>{describe(item)}</Text>
              <Text style={styles.rowMeta}>{new Date(item.takenAt).toLocaleString()}</Text>
            </View>
            <Text style={item.synced ? styles.syncedBadge : styles.pendingBadge}>{item.synced ? 'Synced' : 'Pending'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20, gap: 8 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#8884' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 18, fontWeight: '700' },
  rowMeta: { fontSize: 12, opacity: 0.5 },
  syncedBadge: { fontSize: 12, fontWeight: '600', color: '#2e7d32' },
  pendingBadge: { fontSize: 12, fontWeight: '600', color: '#ef6c00' },
});
