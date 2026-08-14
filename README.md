# Constela — Native Mobile App

This is the native mobile application for **Constela**, built using **Expo SDK 54** and **React Native 0.81** with the New Architecture enabled.

Because this app utilizes several custom native modules (like camera and payment libraries), it **cannot** be run in the standard "Expo Go" app. You must compile the app natively using `npx expo run:ios` or `npx expo run:android`.

---

## 🛠 Tech Stack & Services

We utilize several critical third-party services to power the native experience:

### 1. Push Notifications (Direct FCM)
> [!IMPORTANT]
> **We are NOT using Expo's Push Notification servers.** 

Instead of relying on Expo's intermediate infrastructure (which uses `ExponentPushToken`), this application connects **directly** to Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs). 
We use the native `@react-native-firebase/messaging` module to generate raw device tokens (FCM Tokens) and send them directly to our Django backend. This ensures lower latency and gives us complete architectural control over our notification pipeline.

### 2. RevenueCat (In-App Purchases)
* **What it does:** Manages our premium subscription tiers and handles all Apple App Store and Google Play Store transactions.
* **How it works:** We use the native `react-native-purchases` SDK to display paywalls, process payments, and verify subscription status. The frontend queries RevenueCat locally to see if a user is "Premium".

### 3. Vision Camera
* **What it does:** Provides high-performance, native camera access.
* **How it works:** We use `react-native-vision-camera` to handle profile photo capture and real-time media interactions with much better performance than the standard Expo camera.

---

## 🚀 Environment Variables & Secrets

Most of our configuration is handled via standard `.env` variables, which will automatically be bundled into the app by Expo when you compile.

### Standard `.env` Setup
Create a `.env` file in the root of the `app` directory and populate it with the keys found in `.env.example`:
* `EXPO_PUBLIC_API_URL`: The URL of your Django backend.
* `EXPO_PUBLIC_REVENUECAT_KEY`: Your public RevenueCat API key for processing local purchases.

### Why `google-services.json` is a physical file
Unlike the backend where we converted the Firebase credentials into a `.env` string, you **must** keep `google-services.json` as a physical file in the root of this `app` directory. 

* **Why?** The Android build process (`Gradle`) natively expects this physical file to exist on the hard drive during compilation. It physically parses the JSON file at build-time to inject Google Play Services directly into the `.apk`/`.aab` binary. It is impossible to pass this securely through a standard `.env` file without complex and brittle custom Expo plugins. 
* *Note: `google-services.json` only contains public identifiers for your Firebase project, not secret admin keys, so it is safe.*
