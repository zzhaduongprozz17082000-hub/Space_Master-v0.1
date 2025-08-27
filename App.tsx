import React, { useState, useEffect } from 'react';
// FIX: Import firebase v8 compatibility module.
import firebase from 'firebase/app';
import { auth } from './firebase/config';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

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

  return (
    <>
      {user ? <DashboardPage user={user} /> : <LoginPage />}
    </>
  );
};
