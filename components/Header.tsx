import React from 'react';
// FIX: Import firebase v9 compatibility module.
import firebase from 'firebase/compat/app';
import { SearchIcon } from '../assets/icons';
import { auth } from '../firebase/config';

interface HeaderProps {
    // FIX: Update User type to firebase.User for v8 compatibility.
    user: firebase.User;
}

export const Header = ({ user }: HeaderProps) => {

    const handleSignOut = async () => {
        try {
            // FIX: Use auth.signOut() for Firebase v8 compatibility.
            await auth.signOut();
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <header className="header">
            <div className="search-bar">
                <SearchIcon />
                <input type="text" placeholder="Search files and folders..." />
            </div>
            <div className="header-actions">
                <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
                <div 
                    className="user-profile"
                    style={{ backgroundImage: `url(${user.photoURL || ''})` }}
                    title={user.displayName || 'User Profile'}
                ></div>
            </div>
        </header>
    );
};