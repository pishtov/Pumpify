import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Paste the config object Firebase gave you in Project settings > Your apps.
// These values aren't secret — Firebase web API keys are safe to ship in the
// client; real security comes from your Firestore rules, not from hiding this.
const firebaseConfig = {
  apiKey: 'AIzaSyBYmVNQ6fJHSxRPLaUCFGG46OOPUHUXSqk',
  authDomain: 'pumpify-849d5.firebaseapp.com',
  projectId: 'pumpify-849d5',
  storageBucket: 'pumpify-849d5.firebasestorage.app',
  messagingSenderId: '35071668186',
  appId: '1:35071668186:web:e40884eced790a64ec9ae3',
  measurementId: "G-HYJK513RCT"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// initializeAuth (not getAuth) + AsyncStorage persistence is what keeps a
// user logged in between app restarts on React Native.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);