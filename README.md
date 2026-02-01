# The Receipt

A personal, low-friction "memory-capture" app that treats your daily life like a digital paper trail.

## Concept

Instead of random notifications, you "close the tab" on your day at a set time by uploading a single "proof of life"—a photo, a song, a screenshot, or just a few words. These entries are archived into a continuous, scrollable "receipt roll" with automated weekly recaps.

## Project Structure

```
receipt-app/
├── frontend/          # Expo/React Native mobile app
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── styles/
│   └── package.json
│
├── backend/           # Node.js/Express API server
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── models/
│   │   └── middleware/
│   └── package.json
│
└── README.md
```

## Getting Started

### Frontend (Mobile App)

```bash
cd frontend
npm install
npm start
```

Then scan the QR code with Expo Go app, or press `i` for iOS simulator.

### Backend (API Server)

```bash
cd backend
npm install
cp .env.example .env    # Configure your environment
npm run dev
```

## Tech Stack

**Frontend:**
- Expo / React Native
- TypeScript

**Backend:**
- Node.js / Express
- MongoDB / Mongoose

## Team Workflow

1. Work on feature branches: `git checkout -b feature/your-feature`
2. Push changes: `git push -u origin feature/your-feature`
3. Create Pull Request to merge into `dev`
4. Merge `dev` into `main` for releases
