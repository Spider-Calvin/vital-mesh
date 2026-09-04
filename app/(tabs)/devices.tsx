import { StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { VITAL_PROFILES } from '@/lib/ble';
import { useVitals } from '@/lib/vitals-context';
import type { VitalKind } from '@/lib/types';

export default function DevicesScreen() {
  const router = useRouter();
  const { readings } = useVitals();
  const kinds = Object.keys(VITAL_PROFILES) as VitalKind[];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Bluetooth Devices</Text>
      <Text style={styles.subheading}>Standard GATT health profiles are used to auto-discover nearby devices.</Text>
      {kinds.map((kind) => {
        const lastSeen = readings.find((r) => r.kind === kind);
        return (
          <Pressable key={kind} style={styles.row} onPress={() => router.push(`/capture/${kind}`)}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{VITAL_PROFILES[kind].label}</Text>
              <Text style={styles.rowSubtitle}>{lastSeen ? `Last paired: ${lastSeen.deviceName}` : 'Not paired yet'}</Text>
            </View>
            <Text style={styles.rowAction}>Scan</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  heading: { fontSize: 24, fontWeight: '700' },
  subheading: { fontSize: 14, opacity: 0.6, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#8884' },
  rowText: { gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13, opacity: 0.6 },
  rowAction: { fontSize: 14, fontWeight: '600', color: '#2f95dc' },
});
