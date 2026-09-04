# VitalMesh

VitalMesh is an Expo (React Native) mobile app for clinicians to capture vitals
from Bluetooth LE health devices — pulse oximeters, blood pressure monitors,
and thermometers — and sync them to a centralized cloud repository.

## Architecture

```
[BLE Device] --GATT--> [VitalMesh App] --HTTPS--> [API Gateway] --> [Lambda] --> [Datastore]
   SpO2 / BP / Temp        scan, connect,              ingest            store +
                            parse, queue                endpoint          fan out
```

- **App**: Expo Router (TypeScript), one screen per concern — Dashboard,
  Devices, History, Settings, and a Capture flow.
- **BLE layer** (`lib/ble.ts`): uses `react-native-ble-plx` against the
  standard Bluetooth SIG GATT profiles, so any compliant device works without
  per-vendor code:
  - Pulse Oximeter Service `0x1822`
  - Blood Pressure Service `0x1810`
  - Health Thermometer Service `0x1809`
  Measurements are IEEE-11073 floating point on the wire; `lib/ieee11073.ts`
  decodes the SFLOAT/FLOAT formats those profiles use.
- **Offline-first storage**: readings are persisted locally
  (`lib/vitals-context.tsx` + AsyncStorage) as soon as they're captured, then
  marked `synced` once uploaded — so captures aren't lost without signal.
- **Cloud sync** (`lib/api.ts`): POSTs each reading to
  `<API_BASE_URL>/readings`, an API Gateway endpoint fronting an ingest
  Lambda that writes to the centralized repository.

## Screens

| Screen    | Purpose                                                        |
|-----------|-----------------------------------------------------------------|
| Dashboard | Latest reading per vital, tap to capture a new one              |
| Devices   | Per-vital-type BLE scan/pair status                              |
| History   | Full reading log with sync status                                |
| Settings  | Configure the Lambda API endpoint, trigger manual sync           |
| Capture   | Modal: scan → connect → read → save, for one vital at a time     |

## Getting started

BLE requires native modules, so this app needs a development build — it will
not run inside Expo Go.

```bash
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL to your API Gateway URL
npx expo run:ios        # or: npx expo run:android
```

## Backend

This repo is the mobile client only. It expects an API Gateway + Lambda
ingest endpoint accepting `POST /readings` with a JSON body matching
`VitalReading` (see `lib/types.ts`).
