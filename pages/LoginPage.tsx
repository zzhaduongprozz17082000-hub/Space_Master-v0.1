import React from 'react';
// FIX: Import firebase v9 compatibility modules.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../firebase/config';
import { RocketIcon, GoogleIcon } from '../assets/icons';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

export const LoginPage = () => {

    const handleGoogleSignIn = async () => {
        // FIX: Use new firebase.auth.GoogleAuthProvider() for Firebase v8 compatibility.
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            // FIX: Use auth.signInWithPopup(provider) for Firebase v8 compatibility.
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (error) {
            console.error("Authentication error: ", error);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-box">
                <div className="login-header">
                    <div className="icon-large">
                        <RocketIcon />
                    </div>
                    <h1>Space Master</h1>
                </div>
                <button className="google-signin-btn" onClick={handleGoogleSignIn}>
                    <GoogleIcon />
                    <span>Sign in with Google</span>
                </button>
            </div>
        </div>
    );
};