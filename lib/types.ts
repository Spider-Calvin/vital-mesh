export type VitalKind = 'spo2' | 'bloodPressure' | 'temperature';

export type VitalReading =
  | { id: string; kind: 'spo2'; deviceId: string; deviceName: string; takenAt: string; spo2Percent: number; pulseRateBpm: number; synced: boolean }
  | { id: string; kind: 'bloodPressure'; deviceId: string; deviceName: string; takenAt: string; systolicMmHg: number; diastolicMmHg: number; meanArterialPressureMmHg: number; pulseRateBpm?: number; synced: boolean }
  | { id: string; kind: 'temperature'; deviceId: string; deviceName: string; takenAt: string; temperatureCelsius: number; synced: boolean };

export interface VitalDeviceProfile {
  kind: VitalKind;
  label: string;
  serviceUuid: string;
  measurementCharacteristicUuid: string;
}
