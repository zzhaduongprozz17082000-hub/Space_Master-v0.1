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
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<Item | null>(null);
    const [error, setError] = useState('');
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        const fetchItemAndCheckAccess = async () => {
            if (!itemId) {
                setError("Invalid link.");
                setLoading(false);
                return;
            }

            try {
                // Check both collections to find the item.
                const folderRef = firestore.collection('folders').doc(itemId);
                const fileRef = firestore.collection('files').doc(itemId);
                
                let docSnapshot;
                const folderDoc = await folderRef.get();
                if (folderDoc.exists) {
                    docSnapshot = folderDoc;
                } else {
                    docSnapshot = await fileRef.get();
                }

                if (!docSnapshot.exists) {
                    setError("This file or folder doesn't exist or may have been deleted.");
                    setLoading(false);
                    return;
                }

                const itemData = { id: docSnapshot.id, ...docSnapshot.data() } as Item;
                setItem(itemData);

                // Check access: user is owner or it's shared with them.
                const isOwner = itemData.ownerId === user.uid;
                const isSharedWithUser = itemData.sharedWith && itemData.sharedWith[user.uid];

                if (isOwner || isSharedWithUser) {
                    // User has access, redirect to the main dashboard.
                    window.location.href = '/';
                } else {
                    // User does not have access, stay on this page to show the request button.
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching item:", err);
                setError("An error occurred while trying to access the item.");
                setLoading(false);
            }
        };

        fetchItemAndCheckAccess();
    }, [itemId, user.uid]);

    if (loading) {
        return <div className="loading-container">Checking permissions...</div>;
    }
    
    const handleRequestAccess = () => {
        // In a real app, this would trigger a notification to the owner.
        // For now, we just update the UI state.
        setRequestSent(true);
    };

    return (
        <div className="share-access-page-container">
            <div className="share-access-box">
                {error ? (
                    <>
                        <h1>Access Denied</h1>
                        <p>{error}</p>
                    </>
                ) : (
                    item && (
                        <>
                            <div className="file-item-icon">
                                {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                            </div>
                            <h1>{item.name}</h1>
                            <p>You need access to view this item.</p>

                            <button
                                className="request-access-btn"
                                onClick={handleRequestAccess}
                                disabled={requestSent}
                            >
                                {requestSent ? 'Request Sent' : 'Request Access'}
                            </button>
                        </>
                    )
                )}
            </div>
        </div>
    );
};