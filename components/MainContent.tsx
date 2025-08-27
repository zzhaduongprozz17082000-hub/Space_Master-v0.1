import React, { useState, useEffect, useRef, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { firestore, storage } from '../firebase/config';
import { UploadIcon, NewFolderIcon } from '../assets/icons';
import { FileItem } from './FileItem';
import { NewFolderModal } from './NewFolderModal';
import { ShareModal } from './ShareModal';


interface MainContentProps {
    user: firebase.User;
}

// Define types for folder and file
export interface Folder {
    id: string;
    name: string;
    type: 'folder';
    createdAt: firebase.firestore.Timestamp;
    parentId: string | null;
    ownerId: string;
    sharedWith?: { [key: string]: 'viewer' | 'editor' };
}

export interface File {
    id: string;
    name: string;
    type: 'file';
    createdAt: firebase.firestore.Timestamp;
    downloadURL: string;
    parentId: string | null;
    ownerId: string;
    sharedWith?: { [key: string]: 'viewer' | 'editor' };
}

export type Item = Folder | File;

interface PathSegment {
    id: string | null;
    name: string;
}

export const MainContent = ({ user }: MainContentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState<Item | null>(null);
    const [ownedFolders, setOwnedFolders] = useState<Folder[]>([]);
    const [sharedFolders, setSharedFolders] = useState<Folder[]>([]);
    const [ownedFiles, setOwnedFiles] = useState<File[]>([]);
    const [sharedFiles, setSharedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [path, setPath] = useState<PathSegment[]>([{ id: null, name: 'My Files' }]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
    
        // 1. Query for items owned by the user
        const ownerQuery = (collection: string) => firestore.collection(collection)
            .where('ownerId', '==', user.uid)
            .where('parentId', '==', currentFolderId);
    
        // 2. Query for items shared with the user
        const sharedQuery = (collection: string) => firestore.collection(collection)
            .where(`sharedWith.${user.uid}`, 'in', ['viewer', 'editor'])
            .where('parentId', '==', currentFolderId);
    
        const unsubOwnedFolders = ownerQuery('folders').onSnapshot(snap => {
            setOwnedFolders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Folder[]);
        });
        const unsubSharedFolders = sharedQuery('folders').onSnapshot(snap => {
            setSharedFolders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Folder[]);
        });
        const unsubOwnedFiles = ownerQuery('files').onSnapshot(snap => {
            setOwnedFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as File[]);
        });
        const unsubSharedFiles = sharedQuery('files').onSnapshot(snap => {
            setSharedFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as File[]);
        });
    
        return () => {
            unsubOwnedFolders();
            unsubSharedFolders();
            unsubOwnedFiles();
            unsubSharedFiles();
        };
    }, [user, currentFolderId]);

    // Combine and sort folders and files
    const allItems = useMemo(() => {
        const all = [
            ...ownedFolders, ...sharedFolders,
            ...ownedFiles, ...sharedFiles
        ];
        // Remove duplicates (in case an item is owned and shared, though unlikely)
        const uniqueItems = Array.from(new Map(all.map(item => [item.id, item])).values());

        return uniqueItems.sort((a, b) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis()
        });
    }, [ownedFolders, sharedFolders, ownedFiles, sharedFiles]);

    const handleFolderClick = (folder: Folder) => {
        setCurrentFolderId(folder.id);
        setPath(prevPath => [...prevPath, { id: folder.id, name: folder.name }]);
    };
    
    const handleBreadcrumbClick = (folderId: string | null, index: number) => {
        setCurrentFolderId(folderId);
        setPath(prevPath => prevPath.slice(0, index + 1));
    };

    const handleCreateFolder = async (folderName: string) => {
        if (!folderName.trim() || !user) return;
        
        try {
            await firestore.collection('folders').add({
                name: folderName.trim(),
                ownerId: user.uid,
                parentId: currentFolderId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'folder',
                sharedWith: {},
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
        const storagePath = `files/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(storagePath);
        
        try {
            const uploadTask = await storageRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();

            await firestore.collection('files').add({
                name: file.name,
                ownerId: user.uid,
                parentId: currentFolderId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'file',
                downloadURL,
                storagePath,
                size: file.size,
                sharedWith: {},
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

    const handleShareClick = (item: Item) => {
        setSharingItem(item);
        setIsShareModalOpen(true);
    };

    const currentFolderName = path[path.length - 1]?.name || 'My Files';

    return (
        <main className="main-content">
            <div className="content-header">
                <h1>{currentFolderName}</h1>
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

            <nav className="breadcrumb-bar">
                {path.map((segment, index) => (
                    <React.Fragment key={segment.id || 'root'}>
                        {index > 0 && <span className="breadcrumb-separator">/</span>}
                        <span
                            className={`breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
                            onClick={() => handleBreadcrumbClick(segment.id, index)}
                        >
                            {segment.name}
                        </span>
                    </React.Fragment>
                ))}
            </nav>

            <div className="file-grid">
                {/* FIX: Refactored to use if/else for better type inference and to fix TS error. */}
                {allItems.map((item) => {
                    if (item.type === 'folder') {
                        return (
                            <FileItem
                                key={item.id}
                                type={item.type}
                                name={item.name}
                                onClick={() => handleFolderClick(item)}
                                onShareClick={() => handleShareClick(item)}
                            />
                        );
                    } else {
                        return (
                            <FileItem
                                key={item.id}
                                type={item.type}
                                name={item.name}
                                downloadURL={item.downloadURL}
                                onShareClick={() => handleShareClick(item)}
                            />
                        );
                    }
                })}
            </div>
            {isModalOpen && (
                <NewFolderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreateFolder}
                />
            )}
            {isShareModalOpen && sharingItem && (
                 <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    item={sharingItem}
                />
            )}
        </main>
    );
};