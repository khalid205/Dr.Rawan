// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhQEUcMfW8vV7CskSCZfvLBh8zFVgKjIg",
  authDomain: "training-1f01a.firebaseapp.com",
  databaseURL: "https://training-1f01a-default-rtdb.firebaseio.com",
  projectId: "training-1f01a",
  storageBucket: "training-1f01a.firebasestorage.app",
  messagingSenderId: "109539621078",
  appId: "1:109539621078:web:9e3f870b0bf59246c43177",
  measurementId: "G-YTV3MRNYL5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app); // 2. أضف هذا السطر لتصدير قاعدة البيانات
const analytics = getAnalytics(app);

export { auth };