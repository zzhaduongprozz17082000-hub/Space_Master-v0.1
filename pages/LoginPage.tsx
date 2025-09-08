import React, { useState, useEffect } from 'react';
import { auth, firestore, GoogleAuthProvider } from '../firebase/config';
import { RocketIcon, GoogleIcon } from '../assets/icons';

export const LoginPage = () => {
    const [view, setView] = useState<'signIn' | 'signUp'>('signIn');
    
    // Form fields state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    // State for feedback
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const processRedirectResult = async () => {
            try {
                const result = await auth.getRedirectResult();
                if (result && result.user) {
                    setLoading(true); // Show loading state while we process
                    const userRef = firestore.collection('users').doc(result.user.uid);
                    const doc = await userRef.get();

                    if (!doc.exists) {
                        await userRef.set({
                            uid: result.user.uid,
                            email: result.user.email,
                            displayName: result.user.displayName,
                            photoURL: result.user.photoURL,
                            role: 'user'
                        });
                    } else {
                        await userRef.update({
                            displayName: result.user.displayName,
                            photoURL: result.user.photoURL,
                        });
                    }
                    // onAuthStateChanged in App.tsx will now handle navigation
                }
            } catch (error: any) {
                setError(error.message);
                setLoading(false); // Make sure to turn off loading on error
            }
        };

        processRedirectResult();
    }, []);

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        setError('');
        setLoading(true);
        try {
            await auth.signInWithRedirect(provider);
        } catch (error: any) {
            setError(error.message);
            setLoading(false);
        }
    };

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (view === 'signUp') {
            // Sign Up Logic
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                setLoading(false);
                return;
            }
            if (!displayName.trim()) {
                setError('Please enter a display name.');
                setLoading(false);
                return;
            }
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                if (user) {
                    await user.updateProfile({ displayName });
                    const userRef = firestore.collection('users').doc(user.uid);
                    await userRef.set({
                        uid: user.uid,
                        email: user.email,
                        displayName: displayName,
                        photoURL: user.photoURL, // will be null initially
                        role: 'user'
                    });

                    //
                    location.href = "/";
                }
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        } else {
            // Sign In Logic
            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleView = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setError('');
        setView(view === 'signIn' ? 'signUp' : 'signIn');
    };

    return (
        <div className="login-page-container">
            <div className="login-box">
                <div className="login-header">
                    <div className="icon-large">
                        <RocketIcon />
                    </div>
                    <h1>Space Master</h1>
                    <p className="login-subtext">
                        {view === 'signIn' ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleEmailPasswordSubmit}>
                    {view === 'signUp' && (
                        <div className="form-group">
                            <label htmlFor="displayName">Display Name</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {view === 'signUp' && (
                         <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    
                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Processing...' : (view === 'signIn' ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="auth-toggle">
                    {view === 'signIn' ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={toggleView} className="auth-toggle-link">
                        {view === 'signIn' ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button className="google-signin-btn" onClick={handleGoogleSignIn} disabled={loading}>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                </button>
            </div>
        </div>
    );
};
