import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyIEf_IY3P-0rpB6VtQRM6dE-leOBwjiM",
  authDomain: "a-surprise-280ea.firebaseapp.com",
  projectId: "a-surprise-280ea",
  storageBucket: "a-surprise-280ea.firebasestorage.app",
  messagingSenderId: "965745046885",
  appId: "1:965745046885:web:3d43409a36fc58038f1d8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };
