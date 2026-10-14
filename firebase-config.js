/**
 * FoodWala - Firebase Configuration & Setup Guide
 *
 * FIREBASE CONSOLE SETUP STEPS:
 * =====================================================================
 * 1. Create a Firebase Project:
 *    - Go to https://console.firebase.google.com/
 *    - Click "Add project", name it "foodwala" (or any preferred name), and complete setup.
 *
 * 2. Register Web App:
 *    - Under Project Overview, click the Web icon (</>) to create a Web App.
 *    - Name it "FoodWala Web" and click Register.
 *    - Copy the `firebaseConfig` object and paste your credentials into this file below.
 *
 * 3. Enable Authentication Sign-In Providers:
 *    - In the left sidebar, click "Build" -> "Authentication" -> "Get Started".
 *    - Under "Sign-in method" tab:
 *        a) Click "Email/Password" -> Enable the first toggle ("Email/Password") -> Click "Save".
 *        b) Click "Phone" -> Enable toggle.
 *           - Expand "Phone numbers for testing (optional)".
 *           - Add: +91 9876543210 with verification code: 123456
 *           - Add: +91 9999999999 with verification code: 123456
 *           - Click "Save".
 *
 * 4. Add Authorized Domains:
 *    - In Authentication -> "Settings" tab -> "Authorized domains".
 *    - Click "Add domain" and enter:
 *        vishnu6301382491-dev.github.io
 *    - Ensure "localhost" is also present (added by default).
 *
 * 5. Enable Cloud Firestore:
 *    - In the left sidebar, click "Build" -> "Firestore Database" -> "Create database".
 *    - Choose "Start in production mode", select your preferred location (e.g. asia-south1 Mumbai), and click "Enable".
 *    - Under "Rules" tab, paste the following security rules so users can only access their own documents:
 *
 *      rules_version = '2';
 *      service cloud.firestore {
 *        match /databases/{database}/documents {
 *          match /users/{userId} {
 *            allow read, write: if request.auth != null && request.auth.uid == userId;
 *            match /orders/{orderId} {
 *              allow read, write: if request.auth != null && request.auth.uid == userId;
 *            }
 *            match /addresses/{addressId} {
 *              allow read, write: if request.auth != null && request.auth.uid == userId;
 *            }
 *          }
 *        }
 *      }
 *    - Click "Publish".
 * =====================================================================
 */

const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_FIREBASE_API_KEY",
  authDomain: "foodwala-demo.firebaseapp.com",
  projectId: "foodwala-demo",
  storageBucket: "foodwala-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Check if config has been customized with real credentials
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('YOUR_FIREBASE') &&
  firebaseConfig.apiKey !== 'AIzaSy_YOUR_FIREBASE_API_KEY'
);

if (typeof window !== 'undefined') {
  window.FOODWALA_FIREBASE_CONFIG = firebaseConfig;
  window.FOODWALA_FIREBASE_CONFIGURED = isFirebaseConfigured;
}
