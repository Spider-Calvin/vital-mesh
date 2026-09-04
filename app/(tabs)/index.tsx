import { StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useVitals } from '@/lib/vitals-context';
import { VITAL_PROFILES } from '@/lib/ble';
import type { VitalKind, VitalReading } from '@/lib/types';

function summarize(reading: VitalReading): string {
  switch (reading.kind) {
    case 'spo2':
      return `${reading.spo2Percent.toFixed(0)}% SpO2 · ${reading.pulseRateBpm.toFixed(0)} bpm`;
    case 'bloodPressure':
      return `${reading.systolicMmHg.toFixed(0)}/${reading.diastolicMmHg.toFixed(0)} mmHg`;
    case 'temperature':
      return `${reading.temperatureCelsius.toFixed(1)} °C`;
  }
}

export default function DashboardScreen() {
  const router = useRouter();
  const { readings } = useVitals();

  const kinds = Object.keys(VITAL_PROFILES) as VitalKind[];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today&apos;s Vitals</Text>
      {kinds.map((kind) => {
        const latest = readings.find((r) => r.kind === kind);
        return (
          <Pressable key={kind} style={styles.card} onPress={() => router.push(`/capture/${kind}`)}>
            <Text style={styles.cardTitle}>{VITAL_PROFILES[kind].label}</Text>
            <Text style={styles.cardValue}>{latest ? summarize(latest) : 'No reading yet'}</Text>
            <Text style={styles.cardAction}>Tap to capture</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: '#8884', gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '700' },
  cardAction: { fontSize: 13, opacity: 0.6 },
});
