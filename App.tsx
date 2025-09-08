import React, { useState, useEffect } from 'react';
import { auth, firestore, FirebaseUser } from './firebase/config';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ShareAccessPage } from './pages/ShareAccessPage';
import { AdminLayout } from './layouts/AdminLayout';
import { User } from './types';

export const App = () => {
  const [userAuth, setUserAuth] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const processAuth = async () => {
        try {
            const result = await auth.getRedirectResult();
            if (result && result.user) {
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
            console.error("Error processing redirect result: ", error);
        }

        unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
          setUserAuth(currentUser);
          if (currentUser) {
            // Fetch user profile from Firestore to get the role
            const userRef = firestore.collection('users').doc(currentUser.uid);
            const doc = await userRef.get();
            if (doc.exists) {
              setUserProfile(doc.data() as User);
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
    };

    processAuth();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, []);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  const path = window.location.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const isShareRoute = path.startsWith('/share/');
  
  if (userAuth) {
    // Wait for profile to load before rendering role-specific routes
    if (!userProfile) {
        return <div className="loading-container">Loading profile...</div>;
    }

    if (isAdminRoute && userProfile.role === 'admin') {
      return <AdminLayout user={userAuth} />;
    }

    if (isShareRoute) {
      const itemId = path.split('/')[2];
      return <ShareAccessPage user={userAuth} itemId={itemId} />;
    }
    
    // Default to DashboardPage for all authenticated users (including admins not in /admin)
    return <DashboardPage user={userAuth} />;
  }
  
  return <LoginPage />;
};
