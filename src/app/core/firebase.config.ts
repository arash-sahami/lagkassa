import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase API keys are safe to expose in frontend code.
// Access is restricted by Firestore Security Rules on Google's servers.
const firebaseConfig = {
  apiKey:            'AIzaSyCt7d3P21ITlY8lgHsY1Doz3S7jGoInZWA',
  authDomain:        'lagkassa-fb93e.firebaseapp.com',
  projectId:         'lagkassa-fb93e',
  storageBucket:     'lagkassa-fb93e.firebasestorage.app',
  messagingSenderId: '763305213776',
  appId:             '1:763305213776:web:4c7cc338e0c9022faa3655',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
