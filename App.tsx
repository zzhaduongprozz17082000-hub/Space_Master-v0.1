import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, firestore } from './firebase/config';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ShareAccessPage } from './pages/ShareAccessPage';
import { AdminLayout } from './layouts/AdminLayout';
import { User } from './types';

export const App = () => {
  const [userAuth, setUserAuth] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
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

    return () => unsubscribe();
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
