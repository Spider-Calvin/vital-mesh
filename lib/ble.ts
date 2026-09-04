import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

import { base64ToBytes } from './base64';
import { decodeFloat32, decodeSFloat16, readUInt16LE } from './ieee11073';
import type { VitalDeviceProfile, VitalKind, VitalReading } from './types';

// Standard Bluetooth SIG GATT services/characteristics for personal health devices.
export const VITAL_PROFILES: Record<VitalKind, VitalDeviceProfile> = {
  spo2: { kind: 'spo2', label: 'Pulse Oximeter', serviceUuid: '00001822-0000-1000-8000-00805f9b34fb', measurementCharacteristicUuid: '00002a5f-0000-1000-8000-00805f9b34fb' },
  bloodPressure: { kind: 'bloodPressure', label: 'Blood Pressure Monitor', serviceUuid: '00001810-0000-1000-8000-00805f9b34fb', measurementCharacteristicUuid: '00002a35-0000-1000-8000-00805f9b34fb' },
  temperature: { kind: 'temperature', label: 'Thermometer', serviceUuid: '00001809-0000-1000-8000-00805f9b34fb', measurementCharacteristicUuid: '00002a1c-0000-1000-8000-00805f9b34fb' },
};

export const bleManager = new BleManager();

export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version < 31) {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);
  return Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
}

export function onBluetoothStateChange(callback: (state: State) => void) {
  return bleManager.onStateChange(callback, true);
}

export function scanForVitalDevice(kind: VitalKind, onFound: (device: Device) => void, onError: (error: Error) => void) {
  const { serviceUuid } = VITAL_PROFILES[kind];
  bleManager.startDeviceScan([serviceUuid], null, (error, device) => {
    if (error) {
      onError(error);
      return;
    }
    if (device) onFound(device);
  });
  return () => bleManager.stopDeviceScan();
}

function parseReading(kind: VitalKind, device: Device, bytes: Uint8Array): VitalReading | null {
  const id = `${device.id}-${Date.now()}`;
  const takenAt = new Date().toISOString();
  const deviceName = device.name ?? device.localName ?? VITAL_PROFILES[kind].label;

  switch (kind) {
    case 'spo2': {
      // Flags (uint16) + SpO2 SFLOAT + pulse rate SFLOAT.
      const spo2Raw = readUInt16LE(bytes, 2);
      const pulseRaw = readUInt16LE(bytes, 4);
      return { id, kind, deviceId: device.id, deviceName, takenAt, spo2Percent: decodeSFloat16(spo2Raw), pulseRateBpm: decodeSFloat16(pulseRaw), synced: false };
    }
    case 'bloodPressure': {
      // Flags (uint8) + systolic/diastolic/MAP SFLOAT (always mmHg/kPa per flag bit 0).
      const systolicRaw = readUInt16LE(bytes, 1);
      const diastolicRaw = readUInt16LE(bytes, 3);
      const mapRaw = readUInt16LE(bytes, 5);
      return {
        id,
        kind,
        deviceId: device.id,
        deviceName,
        takenAt,
        systolicMmHg: decodeSFloat16(systolicRaw),
        diastolicMmHg: decodeSFloat16(diastolicRaw),
        meanArterialPressureMmHg: decodeSFloat16(mapRaw),
        synced: false,
      };
    }
    case 'temperature': {
      // Flags (uint8) + IEEE-11073 32-bit FLOAT temperature.
      const tempRaw = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
      return { id, kind, deviceId: device.id, deviceName, takenAt, temperatureCelsius: decodeFloat32(tempRaw), synced: false };
    }
    default:
      return null;
  }
}

export async function connectAndReadOnce(kind: VitalKind, device: Device): Promise<VitalReading> {
  const { serviceUuid, measurementCharacteristicUuid } = VITAL_PROFILES[kind];
  const connected = await device.connect();
  await connected.discoverAllServicesAndCharacteristics();

  return new Promise((resolve, reject) => {
    const subscription = connected.monitorCharacteristicForService(serviceUuid, measurementCharacteristicUuid, (error, characteristic) => {
      if (error) {
        subscription.remove();
        reject(error);
        return;
      }
      if (!characteristic?.value) return;

      const bytes = base64ToBytes(characteristic.value);
      const reading = parseReading(kind, connected, bytes);
      subscription.remove();
      connected.cancelConnection().catch(() => {});
      if (reading) resolve(reading);
      else reject(new Error('Unable to parse measurement'));
    });
  });
}
