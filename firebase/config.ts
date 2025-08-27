// FIX: Updated to use Firebase v8 syntax to resolve module export errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// TODO: Replace the following with your app's Firebase project configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBuCEPU5fdqn4gPeEOVbA_SbHFxCangJb4",
  authDomain: "space-master-12faa.firebaseapp.com",
  projectId: "space-master-12faa",
  storageBucket: "space-master-12faa.firebasestorage.app",
  messagingSenderId: "110214399515",
  appId: "1:110214399515:web:cd337fb7a9a75ae6e85abe",
  measurementId: "G-6HFY8FNX6M"
};

// Initialize Firebase
// FIX: Use v8 initialization to prevent re-initialization.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication and get a reference to the service
// FIX: Get auth instance using the v8 namespaced API.
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();