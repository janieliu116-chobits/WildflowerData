# Wildflower

A spiritual wellness mobile app built with Expo (React Native) in a pnpm monorepo.

## App Overview

**Wildflower** combines astrology natal charts, AI divination (tarot, Lenormand, AstroDice), guided meditation audio, and ASMR sleep sounds in one dark-gold themed mobile app.

## Architecture

| Layer | Location | Notes |
|---|---|---|
| Mobile app | `artifacts/wildflower/` | Expo SDK 52, React Native |
| API server | `artifacts/api-server/` | Express 5, Node.js, TypeScript |
| Shared types | `lib/` | pnpm workspace lib |

## Key Features
- **Astrology**: SVG natal chart (react-native-svg), planet/house/aspect interpretations, compatibility analysis
- **Ask AI**: Tarot (78-card), Lenormand (36-card), AstroDice, chat interface via Gemini
- **Meditation**: 5 themes (Focus, Letting go, Mindfulness, Compassion, Connection), expo-av audio
- **Sleep**: 5 ASMR themes (Tapping, Nature, Personal care, Ear massage, Mouth sounds), expo-av audio

## Design
- Dark gold theme: background `#13131E`, gold `#C9973A`, card `#1E1E2E`
- Always dark mode (`userInterfaceStyle: dark` in app.json)
- Inter font family (400/500/600/700)

## Audio Files
Audio tracks stream from Google Drive. To enable playback:
1. Share your Google Drive folder publicly
2. Get each file's ID from the share URL
3. Populate `driveFileId` in `artifacts/wildflower/constants/data.ts` — format: `[theme]name.mp3`
4. Streaming URL: `https://docs.google.com/uc?export=open&id=FILE_ID`

## Gemini AI
- API key: stored as `GEMINI_API_KEY` secret (server-side only)
- Proxy route: `POST /api/interpret` on the api-server
- Mobile calls: `${EXPO_PUBLIC_DOMAIN}/api/interpret`

## Workflows
- `artifacts/api-server: API Server` — Express server on PORT
- `artifacts/wildflower: expo` — Expo dev server on PORT 21984

## User Preferences
- Keep audio files configurable via `constants/data.ts` (driveFileId fields)
- Maintain dark-only UI (no light mode switching)
- AsyncStorage for all local persistence (no backend database for user data)
