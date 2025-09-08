import React from 'react';
import { auth, GoogleAuthProvider } from '../firebase/config';
import { RocketIcon, GoogleIcon } from '../assets/icons';

export const LoginPage = () => {

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await auth.signInWithRedirect(provider);
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
