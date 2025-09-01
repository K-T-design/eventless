import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "e-ventless-4mfqq",
  "appId": "1:392572587765:web:467994a57dfc0ab03b7fbc",
  "storageBucket": "e-ventless-4mfqq.firebasestorage.app",
  "apiKey": "AIzaSyBdU_kxO0CLwzsv3Bw7jp1IOzpKJ37TaL0",
  "authDomain": "e-ventless-4mfqq.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "392572587765"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

export { app, firestore };
