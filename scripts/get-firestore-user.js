import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Read .env to get Firebase config
const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v) envVars[k.trim()] = v.join('=').trim();
});

const firebaseConfig = {
    apiKey: envVars['VITE_FIREBASE_API_KEY'],
    authDomain: envVars['VITE_FIREBASE_AUTH_DOMAIN'],
    projectId: envVars['VITE_FIREBASE_PROJECT_ID'],
    storageBucket: envVars['VITE_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: envVars['VITE_FIREBASE_MESSAGING_SENDER_ID'],
    appId: envVars['VITE_FIREBASE_APP_ID']
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchUsers() {
    console.log('Querying Firestore users collection...\n');
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        querySnapshot.forEach((doc) => {
            console.log(`UID: ${doc.id}`);
            console.log(JSON.stringify(doc.data(), null, 2));
            console.log('-----------------------------------');
        });
    } catch (e) {
        console.error('Firestore query failed:', e.message);
    }
}

fetchUsers();
