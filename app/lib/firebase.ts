import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

function requireEnv(name: string) {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: "AIzaSyCSOHfXTR4mfWlYN_JLPvir1yzBoC0e1Iw",
  authDomain: "data-quality-40364.firebaseapp.com",
  projectId: "data-quality-40364",
  storageBucket: "data-quality-40364.firebasestorage.app",
  messagingSenderId: "864022690425",
  appId: "1:864022690425:web:5343c9f17da59ff7afb2a8",
  measurementId: "G-0NFJ3T64E6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;