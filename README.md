# The Receipt

A personal, low-friction "memory-capture" app that treats your daily life like a digital paper trail.

## Concept

Instead of random notifications, you "close the tab" on your day at a set time by uploading a single "proof of life"—a photo, a song, a screenshot, or just a few words. These entries are archived into a continuous, scrollable "receipt roll" with automated weekly recaps.

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type-safe JavaScript
- **React Native** - Cross-platform mobile development

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

After running `npm start`, you can:

- **Scan the QR code** with Expo Go (Android) or Camera app (iOS)
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Press `w` to open in web browser

## Project Structure

```
receipt-app/
├── App.tsx          # Main app component
├── app.json         # Expo configuration
├── assets/          # Images, fonts, etc.
├── index.ts         # Entry point
├── package.json     # Dependencies
└── tsconfig.json    # TypeScript config
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in web browser |
