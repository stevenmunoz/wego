# Enterprise App - Mobile

React Native mobile application built with Expo.

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Studio

### Installation

```bash
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Project Structure

```
mobile/
├── src/
│   ├── features/         # Feature modules
│   ├── shared/           # Shared components
│   ├── navigation/       # Navigation configuration
│   ├── core/             # Core services (API, auth)
│   └── theme/            # Theme and styling
├── assets/               # Images, fonts, etc.
└── __tests__/            # Tests
```

## Features

- Authentication with JWT
- Secure token storage
- Type-safe API client
- State management with Zustand
- Navigation with Expo Router

## Testing

```bash
npm test
```
