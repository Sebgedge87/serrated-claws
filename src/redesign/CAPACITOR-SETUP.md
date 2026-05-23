# Capacitor setup — wrap the PWA into an Android app

> **Target:** native Android shell distributable through Google Play, with native Google Sign-In and deep-link OAuth callback. ~2–4 days of dev work.
>
> **Stack assumptions:** Vite + React + Supabase, build output in `dist/`, deployed PWA at `https://your-domain.tld` with a working service worker and `manifest.webmanifest`.

---

## 0 · Prerequisites

| Need | Why |
|---|---|
| Android Studio (Hedgehog or later) | Builds the native project, runs emulators, signs the bundle |
| JDK 17 | Required by current AGP |
| Google Play Console account ($25 one-time) | Distribution |
| HTTPS PWA deployment | Capacitor still loads the live web app for non-bundled assets; required for OAuth |
| One-time keystore for signing | **DO NOT LOSE THIS** — losing it means you can never update the listed app |

Sanity check your PWA first:
```bash
npm run build
npx http-server dist -p 5173
# open http://localhost:5173, devtools → Application → Manifest, confirm:
# - name, short_name, icons (192 + 512), start_url, display: "standalone"
# - service worker is registered and "activated and is running"
```

---

## 1 · Install Capacitor

```bash
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android @capacitor/app @capacitor/preferences @capacitor/splash-screen @capacitor/status-bar
npx cap init "Serrated Claws" "com.serratedclaws.app" --web-dir=dist
npx cap add android
```

This creates `capacitor.config.ts` at repo root and an `android/` folder (commit both; ignore `android/build/`, `android/app/build/`, `android/.gradle/`).

### `capacitor.config.ts`

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.serratedclaws.app',
  appName: 'Serrated Claws',
  webDir: 'dist',
  // Capacitor serves the bundled dist by default. If you'd rather load the
  // live PWA (so updates ship without resubmission), uncomment:
  // server: { url: 'https://your-domain.tld', androidScheme: 'https' },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0a0a0f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
```

### Add npm scripts

```jsonc
// package.json
{
  "scripts": {
    "android:sync": "vite build && cap sync android",
    "android:open": "cap open android",
    "android:run":  "vite build && cap sync android && cap run android"
  }
}
```

---

## 2 · Supabase OAuth — the one tricky bit

Web OAuth redirects to `https://your-domain.tld/auth/callback`. Inside the native shell that URL would either fail (no domain match) or open the PWA in a browser instead of the app. Two parts to fix:

### a) Use the in-app browser + custom scheme

```bash
npm i @capacitor/browser
```

Add a redirect scheme in `android/app/src/main/AndroidManifest.xml`, inside the `<activity android:name=".MainActivity">` block:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="serratedclaws" android:host="auth-callback" />
</intent-filter>
```

### b) Patch your `useAuth` hook to detect native + handle the deep-link

```ts
// src/hooks/useAuth.tsx — additions
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

const isNative = Capacitor.isNativePlatform();
const NATIVE_REDIRECT = 'serratedclaws://auth-callback';

async function signInWithGoogle() {
  if (!isNative) {
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  }
  // Native flow: open OS browser, wait for deep-link back
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
  });
  if (data?.url) await Browser.open({ url: data.url });
}

// Listen for the deep-link return (in your AuthProvider effect)
useEffect(() => {
  if (!isNative) return;
  const sub = App.addListener('appUrlOpen', async ({ url }) => {
    // Extract the access_token / code from the URL and hand it to Supabase
    const u = new URL(url);
    const code = u.searchParams.get('code');
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      await Browser.close();
    }
  });
  return () => { sub.then(s => s.remove()); };
}, []);
```

### c) Add the custom scheme to Supabase

In your Supabase dashboard → Authentication → URL Configuration → **Redirect URLs**, add:
```
serratedclaws://auth-callback
```

### d) Magic-link fallback

Magic links emailed to the user will open in the system browser by default. To force them into the app, add `redirectTo: NATIVE_REDIRECT` to the `signInWithMagicLink` call too.

---

## 3 · Native Google Sign-In (optional but recommended)

The browser-based flow above works but feels like a web flow. For the system-native account picker:

```bash
npm i @codetrix-studio/capacitor-google-auth
npx cap sync android
```

In `android/app/src/main/res/values/strings.xml`:
```xml
<string name="server_client_id">YOUR_OAUTH_WEB_CLIENT_ID.apps.googleusercontent.com</string>
```
(Get the **Web** OAuth client ID from your Supabase Google provider config — not the Android one.)

In `src/hooks/useAuth.tsx`:
```ts
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

await GoogleAuth.initialize({
  clientId: 'YOUR_OAUTH_WEB_CLIENT_ID.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
});

async function signInWithGoogle() {
  if (!isNative) return supabase.auth.signInWithOAuth({ provider: 'google' });
  const { authentication } = await GoogleAuth.signIn();
  return supabase.auth.signInWithIdToken({
    provider: 'google',
    token: authentication.idToken,
  });
}
```

You also need a separate **Android** OAuth client ID in Google Cloud Console, with your app's SHA-1 fingerprint (get it from `keytool` against your keystore, see step 5).

---

## 4 · Icons + splash

Generate from a 1024×1024 source PNG:
```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android \
  --iconBackgroundColor "#0a0a0f" \
  --splashBackgroundColor "#0a0a0f"
# Place source files at: resources/icon.png, resources/splash.png
```

Hide the splash in code once the app is ready:
```ts
// src/main.tsx — after ReactDOM.render
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
if (Capacitor.isNativePlatform()) SplashScreen.hide();
```

---

## 5 · Build, sign, ship

### One-time keystore
```bash
keytool -genkey -v -keystore serrated-claws-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias serrated-claws
# Store the .jks file + password in a password manager. Losing it = lost app.
```

### `android/app/build.gradle` — add signing config
```gradle
android {
  signingConfigs {
    release {
      storeFile file(System.getenv("KEYSTORE_PATH") ?: "../../serrated-claws-release.jks")
      storePassword System.getenv("KEYSTORE_PASSWORD")
      keyAlias "serrated-claws"
      keyPassword System.getenv("KEY_PASSWORD")
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

### Get your SHA-1 (needed for native Google Sign-In)
```bash
keytool -list -v -keystore serrated-claws-release.jks -alias serrated-claws
# Copy the SHA1: line into your Android OAuth client in Google Cloud Console
```

### Build the release bundle
```bash
npm run android:sync
cd android
./gradlew bundleRelease
# output: android/app/build/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` to Play Console → Production → Create new release.

---

## 6 · Play Store submission checklist

| Item | Notes |
|---|---|
| Privacy policy URL | Required for any app collecting data. Even a one-page page on your domain. |
| Content rating | Quick questionnaire — for a roster tool, expect "Everyone". |
| Target audience & content | Declare 13+ to avoid COPPA disclosures. |
| Data safety form | Declare: account info (email), app activity (rosters), no third-party sharing beyond Supabase as your backend. |
| Screenshots | 2–8 phone screenshots at ≥1080×1920. Use a real device. |
| Feature graphic | 1024×500 banner shown in the store listing. |
| App icon | 512×512 PNG, already generated by `@capacitor/assets`. |
| Review time | Usually 3–7 days first submission, hours for updates. |

---

## 7 · Day-to-day workflow after setup

```bash
# Edit web code as normal:
npm run dev

# When you're ready to test on Android:
npm run android:run     # builds Vite, syncs to android/, launches emulator/device

# To rebuild the release bundle for the Play Store:
KEYSTORE_PATH=./serrated-claws-release.jks \
KEYSTORE_PASSWORD=••• KEY_PASSWORD=••• \
  npm run android:sync && cd android && ./gradlew bundleRelease
```

---

## What you do NOT need to do

- **Rewrite components.** Your existing React/Tailwind UI runs as-is inside the Capacitor WebView.
- **Migrate off localStorage.** It works inside the WebView. (If you ever want true encrypted storage, swap to `@capacitor/preferences` later — same `get`/`set` shape.)
- **Replace Supabase.** It works fine over HTTPS from inside the app.
- **Build a separate iOS app yet.** Capacitor supports iOS too (`cap add ios`) — same codebase, you can do it later.

---

## Realistic timeline

| Phase | Time |
|---|---|
| Capacitor install + first APK on emulator | 2 hours |
| Supabase OAuth deep-link working end-to-end | 4–6 hours (this is the hardest part) |
| Native Google Sign-In via plugin | 2–3 hours |
| Icons, splash, status-bar polish | 1–2 hours |
| Keystore + signed release build | 1 hour |
| Play Console listing (screenshots, copy, data-safety form) | 3–4 hours |
| Review queue | 3–7 days passive |

**Total active dev: ~2–3 days. Calendar to "installable from Play Store": ~1 week.**
