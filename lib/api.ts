import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { VitalReading } from './types';

const API_BASE_URL_KEY = 'vitalmesh.apiBaseUrl';
const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export async function getApiBaseUrl(): Promise<string> {
  return (await AsyncStorage.getItem(API_BASE_URL_KEY)) ?? DEFAULT_API_BASE_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_BASE_URL_KEY, url);
}

/** POSTs a reading to the API Gateway endpoint fronting the ingest Lambda. */
export async function uploadReading(reading: VitalReading): Promise<void> {
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) throw new Error('No API endpoint configured. Set it in Settings.');
  await axios.post(`${baseUrl}/readings`, reading, { timeout: 10000 });
}
