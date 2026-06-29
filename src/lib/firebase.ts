import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration loaded from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAz4PwB13z4xmfh06bEYifo3PsI7906qFM",
  authDomain: "august-ward-lr4g1.firebaseapp.com",
  projectId: "august-ward-lr4g1",
  storageBucket: "august-ward-lr4g1.firebasestorage.app",
  messagingSenderId: "39855389187",
  appId: "1:39855389187:web:776e358a7123d88399ac36"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use the custom database ID specified in our firebase config
export const db = getFirestore(app, "ai-studio-communityheroai-5d78b5cc-0bb2-4faf-a7e4-6041873fceb4");

export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
};
export type { User };
