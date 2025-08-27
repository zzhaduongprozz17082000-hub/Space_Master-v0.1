import React from 'react';
// FIX: Import firebase v9 compatibility module.
import firebase from 'firebase/compat/app';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MainContent } from '../components/MainContent';

interface DashboardPageProps {
  // FIX: Update User type to firebase.User for v8 compatibility.
  user: firebase.User;
}

export const DashboardPage = ({ user }: DashboardPageProps) => {
  return (
    <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
            <Header user={user} />
            <MainContent />
        </div>
    </div>
  );
};