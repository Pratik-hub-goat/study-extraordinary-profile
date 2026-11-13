
/* =========================================
   STUDY EXTRAORDINARY
   FIREBASE CONFIGURATION
========================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";


/* =========================================
   FIREBASE PROJECT CONFIGURATION
========================================= */

const firebaseConfig = {

  apiKey: "AIzaSyC0Qf1Ac24yoMEftj89Nn_cnvS5SadCIDU",

  authDomain:
    "study-extraordinary-profile.firebaseapp.com",

  projectId:
    "study-extraordinary-profile",

  storageBucket:
    "study-extraordinary-profile.firebasestorage.app",

  messagingSenderId:
    "58687352796",

  appId:
    "1:58687352796:web:93b715bbeb17d3af382919"

};


/* =========================================
   INITIALIZE FIREBASE
========================================= */

export const app =
  initializeApp(firebaseConfig);


/* =========================================
   INITIALIZE FIRESTORE
========================================= */

export const db =
  getFirestore(app);


/* =========================================
   INITIALIZE AUTHENTICATION
========================================= */

export const auth =
  getAuth(app);


/* =========================================
   ANONYMOUS STUDENT AUTHENTICATION
========================================= */

export async function ensureAnonymousUser() {

  try {

    /* Reuse the existing browser identity */

    if (auth.currentUser) {

      return auth.currentUser;

    }

    /* Create a new anonymous identity */

    const credential =
      await signInAnonymously(auth);

    return credential.user;

  } catch (error) {

    console.error(
      "Firebase authentication failed:",
      error
    );

    throw error;

  }

}


/* =========================================
   FIREBASE CONNECTION READY
========================================= */

console.log(
  "✦ Study Extraordinary Firebase initialized."
);
