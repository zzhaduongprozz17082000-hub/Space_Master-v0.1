// FIX: Updated to use Firebase v8 syntax to resolve module export errors.
import firebase from "firebase/app";
import "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "1:your-sender-id:web:your-app-id",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
// FIX: Use v8 initialization to prevent re-initialization.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication and get a reference to the service
// FIX: Get auth instance using the v8 namespaced API.
export const auth = firebase.auth();
