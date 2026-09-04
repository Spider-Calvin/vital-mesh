import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/api';
import { useVitals } from '@/lib/vitals-context';

export default function SettingsScreen() {
  const [endpoint, setEndpoint] = useState('');
  const [syncing, setSyncing] = useState(false);
  const { readings, syncPending } = useVitals();

  useEffect(() => {
    getApiBaseUrl().then(setEndpoint);
  }, []);

  const pendingCount = readings.filter((r) => !r.synced).length;

  const handleSave = async () => {
    await setApiBaseUrl(endpoint.trim());
    Alert.alert('Saved', 'API endpoint updated.');
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { succeeded, failed } = await syncPending();
      Alert.alert('Sync complete', `${succeeded} uploaded, ${failed} failed.`);
    } catch (err) {
      Alert.alert('Sync failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Cloud Sync</Text>
      <Text style={styles.label}>API Gateway base URL</Text>
      <TextInput
        style={styles.input}
        value={endpoint}
        onChangeText={setEndpoint}
        placeholder="https://xxxxxxxx.execute-api.region.amazonaws.com"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Endpoint</Text>
      </Pressable>

      <Text style={[styles.label, { marginTop: 24 }]}>{pendingCount} reading(s) pending upload</Text>
      <Pressable style={[styles.button, syncing && styles.buttonDisabled]} onPress={handleSync} disabled={syncing}>
        <Text style={styles.buttonText}>{syncing ? 'Syncing…' : 'Sync Now'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 8 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 14, opacity: 0.7 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#8884', borderRadius: 8, padding: 12, fontSize: 15 },
  button: { backgroundColor: '#2f95dc', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
