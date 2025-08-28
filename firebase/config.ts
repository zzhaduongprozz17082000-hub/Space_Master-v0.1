import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBuCEPU5fdqn4gPeEOVbA_SbHFxCangJb4",
  authDomain: "space-master-12faa.firebaseapp.com",
  projectId: "space-master-12faa",
  storageBucket: "space-master-12faa.firebasestorage.app",
  messagingSenderId: "110214399515",
  appId: "1:110214399515:web:cd337fb7a9a75ae6e85abe",
  measurementId: "G-6HFY8FNX6M"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();
const functions = firebase.functions();
const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

export type Timestamp = firebase.firestore.Timestamp;
export type FirebaseUser = firebase.User;

export {
    auth,
    firestore,
    storage,
    functions,
    GoogleAuthProvider,
    serverTimestamp,
};
