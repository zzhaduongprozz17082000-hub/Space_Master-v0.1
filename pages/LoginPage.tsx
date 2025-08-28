import React from 'react';
// FIX: Import firebase v9 compatibility modules.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth, firestore } from '../firebase/config';
import { RocketIcon, GoogleIcon } from '../assets/icons';

export const LoginPage = () => {

    const handleGoogleSignIn = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await auth.signInWithPopup(provider);
            if (result.user) {
                const userRef = firestore.collection('users').doc(result.user.uid);
                const doc = await userRef.get();

                if (!doc.exists) {
                    // New user, create document with default role
                    await userRef.set({
                        uid: result.user.uid,
                        email: result.user.email,
                        displayName: result.user.displayName,
                        photoURL: result.user.photoURL,
                        role: 'user' // Default role
                    });
                } else {
                    // Existing user, just update their profile info
                    await userRef.update({
                        displayName: result.user.displayName,
                        photoURL: result.user.photoURL,
                    });
                }
            }
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
