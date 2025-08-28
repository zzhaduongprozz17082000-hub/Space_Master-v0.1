import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { firestore } from '../firebase/config';
import { Item, File as FileType } from '../types';
import { FileIcon, FolderIcon, UploadIcon } from '../assets/icons';

interface ShareAccessPageProps {
    user: firebase.User;
    itemId: string;
}

const formatBytes = (bytes?: number, decimals = 2): string => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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
                        // If it's a folder, redirect. For files, we let the component render the preview.
                        if (fetchedItem.type === 'folder') {
                            const view = isOwner ? 'my-files' : 'shared-with-me';
                            const targetFolderId = fetchedItem.id;
                            window.location.href = `/?view=${view}&folderId=${targetFolderId}`;
                        }
                    } else {
                        setHasAccess(false);
                    }
                } else {
                    setError('The requested file or folder does not exist or may have been deleted.');
                }
            } catch (err: any) {
                console.error("Error fetching shared item:", err);
                if (err.code === 'permission-denied') {
                    // This is an expected case where the user doesn't have access.
                    // We can't get the item details, but we can show the request access screen.
                    setHasAccess(false);
                    // Create a placeholder item to allow the "Request Access" button to function.
                    setItem({ id: itemId, name: "a private item" } as Item);
                } else {
                    // For any other unexpected errors, show a generic message.
                    setError('An error occurred while trying to access the item.');
                }
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

    // If user has access and it's a file, show the preview page.
    if (hasAccess && item?.type === 'file') {
        const file = item as FileType;
        const parentFolderId = file.parentId || '';
        const isOwner = file.ownerId === user.uid;
        const goToFolderView = isOwner ? 'my-files' : 'shared-with-me';
        const folderLink = `/?view=${goToFolderView}&folderId=${parentFolderId}`;

        return (
            <div className="file-preview-container">
                <div className="file-preview-box">
                    <div className="file-preview-icon"><FileIcon /></div>
                    <h1 className="file-preview-name">{file.name}</h1>
                    <p className="file-preview-info">{formatBytes(file.size)}</p>
                    <div className="file-preview-actions">
                        <a href={file.downloadURL} className="download-btn" target="_blank" rel="noopener noreferrer">
                            <UploadIcon />
                            Download
                        </a>
                        <a href={folderLink} className="goto-folder-link">Go to folder</a>
                    </div>
                </div>
            </div>
        );
    }
    
    // If user has access and it's a folder, they are being redirected.
    if (hasAccess && item?.type === 'folder') {
        return <div className="loading-container">Redirecting...</div>;
    }

    if (error) {
         return <div className="loading-container">{error}</div>;
    }
    
    // If none of the above, it means user needs access or item wasn't found.
    return (
        <div className="share-access-container">
            <div className="share-access-box">
                <h1>You need access</h1>
                <p>Ask for access, or switch to an account with access.</p>

                {item && (
                    <div className="item-info">
                        <div className="icon">
                            {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                        </div>
                        <div className="name">{item.name}</div>
                    </div>
                )}

                <button 
                    className="request-access-btn"
                    onClick={handleRequestAccess}
                    disabled={requesting || !item}
                >
                    {requesting ? 'Sending...' : 'Request Access'}
                </button>
            </div>
        </div>
    );
};