# Constela — Native Mobile App

This is the native mobile application for **Constela**, built using **Expo SDK 54** and **React Native 0.81** with the New Architecture enabled.

Because this app utilizes several custom native modules (like camera and payment libraries), it **cannot** be run in the standard "Expo Go" app. You must compile the app natively using `npx expo run:ios` or `npx expo run:android`.

---

## 🛠 Tech Stack & Services

We utilize several critical third-party services to power the native experience:

### 1. Push Notifications (Direct FCM)

> [!NOTE]
> **Firebase Project Details:** We are using a Firebase project named **Constela**, which was created using the client's personal Gmail account. If you need to access the Firebase console to configure notifications or download new `google-services.json` files, you must log in with the client's Gmail account.

> [!IMPORTANT]
> **We are NOT using Expo's Push Notification servers.** 

Instead of relying on Expo's intermediate infrastructure (which uses `ExponentPushToken`), this application connects **directly** to Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs). 
We use the native `@react-native-firebase/messaging` module to generate raw device tokens (FCM Tokens) and send them directly to our Django backend. This ensures lower latency and gives us complete architectural control over our notification pipeline.

### 2. RevenueCat (In-App Purchases)
* **What it does:** Manages our premium subscription tiers and handles all Apple App Store and Google Play Store transactions.
* **How it works:** The native `react-native-purchases` SDK processes purchases using the signed-in profile ID. Purchases and restores are verified through `/api/subscription/sync/`; server-verified profile fields control feature access. The SDK customer info is used for store-management details, not client-side access grants.

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

---

## 🏃‍♂️ Developer Quick Start

If you are a new developer cloning this repository, here is exactly how to get the app running on your machine:

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Setup:**
   Duplicate `.env.example`, rename it to `.env`, and fill in the required API endpoints.
3. **Compile Natively:**
   Because of our custom Vision Camera and RevenueCat native modules, you must build the app natively (Expo Go will throw an error).
   
   **For Android:**
   *(The required `google-services.json` file is already included in this repository).*
   ```bash
   npx expo run:android
   ```

   **For iOS (Mac Required):**
   ```bash
   npx expo run:ios
   ```
