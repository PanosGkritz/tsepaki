# Tsepaki

A subscription reminder app for Android, built for the Greek market with a full English version.

Tsepaki keeps track of every subscription you pay for (Netflix, Spotify, your gym, your phone plan) and reminds you before each charge, so a renewal never catches you by surprise. Everything stays on your phone: no account, no server, no tracking.

<!-- Screenshots: add images to docs/screenshots/ and list them here -->
<!-- <p><img src="docs/screenshots/home.png" width="240"> <img src="docs/screenshots/catalog.png" width="240"> <img src="docs/screenshots/reminder.png" width="240"></p> -->

## Features

- **Reminders, your way**: pick the days before each charge (3, 2, 1, same day) and the time. Charges on the same day are grouped into one notification.
- **Catalog of 40+ services** with logos, current Greek prices and plans (e.g. Netflix Standard, Disney+ yearly). Add a subscription in one tap.
- **Offline subscriptions** too: gym, tutoring, lessons, rent. Mark them as paid yourself and get a nudge if you forget.
- **Monthly overview**: total for the month, what's paid, what's left, upcoming charges.
- **Calendar and history**: spending per month and per category, every past charge with search.
- **Privacy first**: local SQLite database, app lock with Face ID / fingerprint, hide amounts with one tap, no analytics or ads.
- **Backup**: export and restore a JSON file you control.
- **Greek and English**, light and dark theme.

## Tech stack

- React Native + Expo (TypeScript), Expo Router
- expo-sqlite with versioned migrations
- expo-notifications for local scheduled reminders
- Reanimated and Gesture Handler for animations and swipe actions
- expo-local-authentication, expo-haptics, expo-file-system / expo-sharing / expo-document-picker
- Custom i18n and theming, no UI library

## Run locally

```bash
npm install
npx expo start
```

Open the project in Expo Go on your phone. Service logos need a Brandfetch client ID in a `.env` file:

```
EXPO_PUBLIC_BRANDFETCH_CLIENT_ID=your_id
```

## Privacy

Read the [privacy policy](https://panosgkritz.github.io/tsepaki/privacy/).

## License

Copyright (c) 2026 PG. All rights reserved. The code is public for portfolio purposes only. See [LICENSE](LICENSE).
