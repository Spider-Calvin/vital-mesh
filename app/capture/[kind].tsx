import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Device } from 'react-native-ble-plx';

import { Text, View } from '@/components/Themed';
import { VITAL_PROFILES, connectAndReadOnce, requestBlePermissions, scanForVitalDevice } from '@/lib/ble';
import { useVitals } from '@/lib/vitals-context';
import type { VitalKind } from '@/lib/types';

type Status = 'requesting-permission' | 'scanning' | 'connecting' | 'done' | 'error';

export default function CaptureScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const vitalKind = kind as VitalKind;
  const router = useRouter();
  const { addReading } = useVitals();
  const [status, setStatus] = useState<Status>('requesting-permission');
  const [message, setMessage] = useState('Requesting Bluetooth permission…');
  const stopScanRef = useRef<(() => void) | undefined>(undefined);

  const profile = VITAL_PROFILES[vitalKind];

  const startCapture = useCallback(async () => {
    setStatus('requesting-permission');
    setMessage('Requesting Bluetooth permission…');

    const granted = await requestBlePermissions();
    if (!granted) {
      setStatus('error');
      setMessage('Bluetooth permission denied.');
      return;
    }

    setStatus('scanning');
    setMessage(`Scanning for a nearby ${profile.label}…`);

    stopScanRef.current = scanForVitalDevice(
      vitalKind,
      async (device: Device) => {
        stopScanRef.current?.();
        setStatus('connecting');
        setMessage(`Connecting to ${device.name ?? device.id}…`);
        try {
          const reading = await connectAndReadOnce(vitalKind, device);
          await addReading(reading);
          setStatus('done');
          setMessage('Reading captured.');
          setTimeout(() => router.back(), 800);
        } catch (err) {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'Failed to read measurement.');
        }
      },
      (error) => {
        setStatus('error');
        setMessage(error.message);
      }
    );
  }, [vitalKind, profile.label, addReading, router]);

  useEffect(() => {
    startCapture();
    return () => stopScanRef.current?.();
  }, [startCapture]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{profile.label}</Text>
      {(status === 'scanning' || status === 'connecting' || status === 'requesting-permission') && <ActivityIndicator size="large" style={styles.spinner} />}
      <Text style={styles.message}>{message}</Text>
      {status === 'error' && (
        <Pressable style={styles.retry} onPress={startCapture}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  spinner: { marginVertical: 12 },
  message: { fontSize: 15, textAlign: 'center', opacity: 0.8 },
  retry: { backgroundColor: '#2f95dc', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: '#fff', fontWeight: '600' },
});
