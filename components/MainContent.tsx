import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { firestore, auth } from '../firebase/config';
import { UploadIcon, NewFolderIcon } from '../assets/icons';
import { FileItem } from './FileItem';
import { NewFolderModal } from './NewFolderModal';

interface MainContentProps {
    user: firebase.User;
}

interface Folder {
    id: string;
    name: string;
    type: 'folder';
}

export const MainContent = ({ user }: MainContentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [folders, setFolders] = useState<Folder[]>([]);

    useEffect(() => {
        if (!user) return;

        const collectionRef = firestore.collection('folders');
        const query = collectionRef
            .where('ownerId', '==', user.uid)
            .orderBy('createdAt', 'desc');

        const unsubscribe = query.onSnapshot(snapshot => {
            const fetchedFolders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Folder[];
            setFolders(fetchedFolders);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCreateFolder = async (folderName: string) => {
        if (!folderName.trim() || !user) return;
        
        try {
            await firestore.collection('folders').add({
                name: folderName.trim(),
                ownerId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'folder'
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating folder: ", error);
        }
    };

    return (
        <main className="main-content">
            <div className="content-header">
                <h1>My Files</h1>
                <div className="header-buttons">
                    <button className="action-btn secondary" onClick={() => setIsModalOpen(true)}>
                        <NewFolderIcon />
                        New Folder
                    </button>
                    <button className="action-btn primary">
                        <UploadIcon />
                        Upload
                    </button>
                </div>
            </div>
            <div className="file-grid">
                {/* FIX: Refactored map function to avoid incorrect TypeScript error on FileItem props by accessing props directly instead of destructuring in the callback arguments. */}
                {folders.map((folder) => (
                    <FileItem key={folder.id} type={folder.type} name={folder.name} />
                ))}
            </div>
            {isModalOpen && (
                <NewFolderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreateFolder}
                />
            )}
        </main>
    );
};