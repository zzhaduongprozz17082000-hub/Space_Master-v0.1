import React from 'react';
import { SearchIcon } from '../assets/icons';
import { auth, FirebaseUser } from '../firebase/config';

interface HeaderProps {
    user: FirebaseUser;
}

export const Header = ({ user }: HeaderProps) => {

    const handleSignOut = async () => {
        try {
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
