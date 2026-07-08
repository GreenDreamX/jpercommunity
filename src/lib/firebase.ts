import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'mock-api-key-value',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'jpercommunity.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'jpercommunity',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'jpercommunity.appspot.com',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '123456789',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '1:123456789:web:abcdef'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
