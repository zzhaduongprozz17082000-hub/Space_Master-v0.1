import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { firestore } from '../firebase/config';
import { Item } from '../types';
import { FileIcon, FolderIcon } from '../assets/icons';

interface ShareAccessPageProps {
    user: firebase.User;
    itemId: string;
}

export const ShareAccessPage = ({ user, itemId }: ShareAccessPageProps) => {
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [error, setError] = useState('');
    const [requesting, setRequesting] = useState(false);


    useEffect(() => {
        if (!itemId) {
            setError('Invalid share link.');
            setLoading(false);
            return;
        }

        const fetchItemAndCheckAccess = async () => {
            try {
                // Try fetching from 'folders', then from 'files'
                let docRef = firestore.collection('folders').doc(itemId);
                let docSnap = await docRef.get();

                if (!docSnap.exists) {
                    docRef = firestore.collection('files').doc(itemId);
                    docSnap = await docRef.get();
                }

                if (docSnap.exists) {
                    const fetchedItem = { id: docSnap.id, ...docSnap.data() } as Item;
                    setItem(fetchedItem);

                    // Check access
                    const isOwner = fetchedItem.ownerId === user.uid;
                    const isSharedWith = fetchedItem.sharedWith && fetchedItem.sharedWith[user.uid];

                    if (isOwner || isSharedWith) {
                        setHasAccess(true);
                        // Redirect to dashboard with params to open the correct view/folder
                        const targetFolderId = fetchedItem.type === 'folder' 
                            ? fetchedItem.id 
                            : (fetchedItem.parentId || '');
                        
                        // Always go to shared view for consistency when using a share link
                        window.location.href = `/?view=shared-with-me&folderId=${targetFolderId}`;
                    } else {
                        setHasAccess(false);
                    }
                } else {
                    setError('The requested file or folder does not exist or may have been deleted.');
                }
            } catch (err) {
                console.error("Error fetching shared item:", err);
                setError('An error occurred while trying to access the item.');
            } finally {
                setLoading(false);
            }
        };

        fetchItemAndCheckAccess();
    }, [itemId, user.uid]);

    const handleRequestAccess = () => {
        setRequesting(true);
        // In a real app, this would trigger a notification to the owner.
        // For now, we just show a confirmation message.
        setTimeout(() => {
            alert("Your request has been sent to the owner.");
            setRequesting(false);
        }, 1000);
    };

    if (loading) {
        return <div className="loading-container">Checking permissions...</div>;
    }

    // This case is handled by the redirect, but as a fallback:
    if (hasAccess) {
        return <div className="loading-container">Redirecting...</div>;
    }

    if (error) {
         return <div className="loading-container">{error}</div>;
    }
    
    if (!item) {
        // This case is covered by the error state, but as a fallback:
        return <div className="loading-container">Item not found.</div>;
    }

    return (
        <div className="share-access-container">
            <div className="share-access-box">
                <h1>You need access</h1>
                <p>Ask for access, or switch to an account with access.</p>

                <div className="item-info">
                    <div className="icon">
                        {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                    </div>
                    <div className="name">{item.name}</div>
                </div>

                <button 
                    className="request-access-btn"
                    onClick={handleRequestAccess}
                    disabled={requesting}
                >
                    {requesting ? 'Sending...' : 'Request Access'}
                </button>
            </div>
        </div>
    );
};