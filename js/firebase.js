import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBZ--2QeQ55_n2T0DMm0b41tvTxdQAsqcg",
    authDomain: "studenthub-c9bc0.firebaseapp.com",
    projectId: "studenthub-c9bc0",
    storageBucket: "studenthub-c9bc0.firebasestorage.app",
    messagingSenderId: "987746786207",
    appId: "1:987746786207:web:7aa71c660dc0c7380c3baa",
    measurementId: "G-23ZJ18WFWG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
