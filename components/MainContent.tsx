import React, { useState, useEffect, useRef, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { firestore, storage } from '../firebase/config';
import { UploadIcon, NewFolderIcon } from '../assets/icons';
import { FileItem } from './FileItem';
import { NewFolderModal } from './NewFolderModal';

interface MainContentProps {
    user: firebase.User;
}

// Define types for folder and file
interface Folder {
    id: string;
    name: string;
    type: 'folder';
    createdAt: firebase.firestore.Timestamp;
}

interface File {
    id: string;
    name: string;
    type: 'file';
    createdAt: firebase.firestore.Timestamp;
    downloadURL: string;
}

type Item = Folder | File;

export const MainContent = ({ user }: MainContentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch folders and files
    useEffect(() => {
        if (!user) return;

        // Fetch folders
        const folderUnsubscribe = firestore.collection('folders')
            .where('ownerId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const fetchedFolders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Folder[];
                setFolders(fetchedFolders);
            });
            
        // Fetch files
        const fileUnsubscribe = firestore.collection('files')
            .where('ownerId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const fetchedFiles = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as File[];
                setFiles(fetchedFiles);
            });

        return () => {
            folderUnsubscribe();
            fileUnsubscribe();
        };
    }, [user]);

    // Combine and sort folders and files
    const allItems = useMemo(() => {
        const items: Item[] = [...folders, ...files];
        return items.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis()
        });
    }, [folders, files]);


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
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        const storagePath = `files/${user.uid}/${file.name}`;
        const storageRef = storage.ref(storagePath);
        
        try {
            const uploadTask = await storageRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();

            await firestore.collection('files').add({
                name: file.name,
                ownerId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'file',
                downloadURL,
                storagePath,
                size: file.size,
            });

        } catch (error) {
            console.error("Error uploading file: ", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                    <button 
                        className="action-btn primary"
                        onClick={handleUploadClick}
                        disabled={isUploading}
                    >
                        <UploadIcon />
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>
            <div className="file-grid">
                {allItems.map((item) => (
                    <FileItem 
                        key={item.id} 
                        type={item.type} 
                        name={item.name} 
                        // FIX: Explicitly cast `item` to `File` to ensure type safety when accessing `downloadURL`.
                        // The TypeScript compiler was failing to narrow the type within the ternary expression, leading to a type mismatch.
                        downloadURL={item.type === 'file' ? (item as File).downloadURL : undefined}
                    />
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