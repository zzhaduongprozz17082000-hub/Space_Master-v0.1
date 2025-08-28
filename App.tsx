import React, { useState, useEffect } from 'react';
// FIX: Import firebase v9 compatibility module.
import firebase from 'firebase/compat/app';
import { auth } from './firebase/config';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ShareAccessPage } from './pages/ShareAccessPage';

export const App = () => {
  // FIX: Update User type to firebase.User for v8 compatibility.
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Use auth.onAuthStateChanged for Firebase v8 compatibility.
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  const path = window.location.pathname;
  // Regex to match /share/ followed by an alphanumeric ID
  const sharePathMatch = path.match(/^\/share\/([a-zA-Z0-9]+)$/);

  if (user) {
    if (sharePathMatch) {
      const itemId = sharePathMatch[1];
      return <ShareAccessPage user={user} itemId={itemId} />;
    }
    return <DashboardPage user={user} />;
  } else {
    return <LoginPage />;
  }
};