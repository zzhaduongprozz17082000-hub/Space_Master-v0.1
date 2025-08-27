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
    parentId: string | null;
}

interface File {
    id: string;
    name: string;
    type: 'file';
    createdAt: firebase.firestore.Timestamp;
    downloadURL: string;
    parentId: string | null;
}

type Item = Folder | File;

interface PathSegment {
    id: string | null;
    name: string;
}

export const MainContent = ({ user }: MainContentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [path, setPath] = useState<PathSegment[]>([{ id: null, name: 'My Files' }]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch folders and files based on currentFolderId
    useEffect(() => {
        if (!user) return;

        // Base query for user's items in the current folder
        const baseQuery = (collection: string) => firestore.collection(collection)
            .where('ownerId', '==', user.uid)
            .where('parentId', '==', currentFolderId)
            .orderBy('createdAt', 'desc');

        // Fetch folders
        const folderUnsubscribe = baseQuery('folders').onSnapshot(snapshot => {
            const fetchedFolders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Folder[];
            setFolders(fetchedFolders);
        });
            
        // Fetch files
        const fileUnsubscribe = baseQuery('files').onSnapshot(snapshot => {
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
    }, [user, currentFolderId]);

    // Combine and sort folders and files
    const allItems = useMemo(() => {
        const items: Item[] = [...folders, ...files];
        return items.sort((a, b) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis()
        });
    }, [folders, files]);

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
                {allItems.map((item) => (
                    <FileItem 
                        key={item.id} 
                        type={item.type} 
                        name={item.name} 
                        onClick={item.type === 'folder' ? () => handleFolderClick(item as Folder) : undefined}
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