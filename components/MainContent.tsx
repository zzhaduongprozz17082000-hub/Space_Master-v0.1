import React, { useState, useEffect, useRef, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { firestore, storage } from '../firebase/config';
import { UploadIcon, NewFolderIcon, FolderUploadIcon } from '../assets/icons';
import { FileItem } from './FileItem';
import { NewFolderModal } from './NewFolderModal';
import { ShareModal } from './ShareModal';
import { Item, Folder, File } from '../types';


interface MainContentProps {
    user: firebase.User;
    activeView: 'my-files' | 'shared-with-me';
    initialFolderId: string | null;
}

interface PathSegment {
    id: string | null;
    name: string;
}

export const MainContent = ({ user, activeView, initialFolderId }: MainContentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState<Item | null>(null);
    const [ownedFolders, setOwnedFolders] = useState<Folder[]>([]);
    const [sharedFolders, setSharedFolders] = useState<Folder[]>([]);
    const [ownedFiles, setOwnedFiles] = useState<File[]>([]);
    const [sharedFiles, setSharedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [path, setPath] = useState<PathSegment[]>([]);
    const [isLoadingPath, setIsLoadingPath] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const initializeView = async () => {
            setIsLoadingPath(true);
            const rootName = activeView === 'my-files' ? 'My Files' : 'Shared with me';
    
            // If there's no specific folder to link to, just go to the root of the current view.
            if (!initialFolderId) {
                setPath([{ id: null, name: rootName }]);
                setCurrentFolderId(null);
                setIsLoadingPath(false);
                return;
            }
    
            // Build the path for the deep-linked folder.
            try {
                const newPath: PathSegment[] = [];
                let currentId: string | null = initialFolderId;
    
                while (currentId) {
                    const folderDoc = await firestore.collection('folders').doc(currentId).get();
                    if (folderDoc.exists) {
                        const folderData = folderDoc.data() as Omit<Folder, 'id'>;
                        newPath.unshift({ id: folderDoc.id, name: folderData.name });
                        currentId = folderData.parentId;
                    } else {
                        throw new Error(`Folder with ID ${currentId} not found.`);
                    }
                }
                
                newPath.unshift({ id: null, name: rootName });
                setPath(newPath);
                setCurrentFolderId(initialFolderId);
            } catch (error) {
                console.error("Error building path:", error);
                // Fallback to the root if path construction fails.
                setPath([{ id: null, name: rootName }]);
                setCurrentFolderId(null);
            } finally {
                setIsLoadingPath(false);
            }
        };
    
        initializeView();
    }, [initialFolderId, activeView]);

    useEffect(() => {
        if (!user || isLoadingPath) return;
    
        const subscriptions: (() => void)[] = [];

        if (activeView === 'my-files') {
            const ownerQuery = (collection: string) => firestore.collection(collection)
                .where('ownerId', '==', user.uid)
                .where('parentId', '==', currentFolderId);

            subscriptions.push(ownerQuery('folders').onSnapshot(snap => {
                setOwnedFolders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Folder[]);
            }));
            subscriptions.push(ownerQuery('files').onSnapshot(snap => {
                setOwnedFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as File[]);
            }));
            setSharedFolders([]);
            setSharedFiles([]);
        } else { // 'shared-with-me'
            const sharedQuery = (collection: string) => firestore.collection(collection)
                .where(`sharedWith.${user.uid}`, 'in', ['viewer', 'editor'])
                .where('parentId', '==', currentFolderId);
            
            subscriptions.push(sharedQuery('folders').onSnapshot(snap => {
                setSharedFolders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Folder[]);
            }));
            subscriptions.push(sharedQuery('files').onSnapshot(snap => {
                setSharedFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as File[]);
            }));
            setOwnedFolders([]);
            setOwnedFiles([]);
        }
    
        return () => {
            subscriptions.forEach(unsub => unsub());
        };
    }, [user, currentFolderId, activeView, isLoadingPath]);

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
            let parentSharedWith = {};
            if (currentFolderId) {
                const parentFolderDoc = await firestore.collection('folders').doc(currentFolderId).get();
                if (parentFolderDoc.exists) {
                    parentSharedWith = parentFolderDoc.data()?.sharedWith || {};
                }
            }

            await firestore.collection('folders').add({
                name: folderName.trim(),
                ownerId: user.uid,
                parentId: currentFolderId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'folder',
                sharedWith: parentSharedWith,
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating folder: ", error);
        }
    };
    
    const handleUploadFilesClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !user) return;

        setIsUploading(true);

        let parentSharedWith = {};
        if (currentFolderId) {
            try {
                const parentFolderDoc = await firestore.collection('folders').doc(currentFolderId).get();
                if (parentFolderDoc.exists) {
                    parentSharedWith = parentFolderDoc.data()?.sharedWith || {};
                }
            } catch (error) {
                console.error("Error fetching parent folder permissions:", error);
            }
        }

        const uploadPromises = Array.from(files).map(async (file) => {
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
                    sharedWith: parentSharedWith,
                });
            } catch (error) {
                console.error(`Error uploading file ${file.name}: `, error);
            }
        });

        try {
            await Promise.all(uploadPromises);
        } catch(error) {
            console.error("An error occurred during file uploads:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUploadFolderClick = () => {
        folderInputRef.current?.click();
    };

    const handleFolderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !user) return;

        setIsUploading(true);
        const pathCache = new Map<string, { id: string; sharedWith: { [key: string]: 'viewer' | 'editor' } }>();

        let initialSharedWith: { [key: string]: 'viewer' | 'editor' } = {};
        if (currentFolderId) {
            try {
                const parentFolderDoc = await firestore.collection('folders').doc(currentFolderId).get();
                if (parentFolderDoc.exists) {
                    initialSharedWith = parentFolderDoc.data()?.sharedWith || {};
                }
            } catch (error) {
                console.error("Error fetching root folder permissions:", error);
            }
        }
        
        const getOrCreateFolderId = async (
            pathSegments: string[], 
            rootParentId: string | null,
            currentSharedWith: { [key: string]: 'viewer' | 'editor' }
        ): Promise<{ folderId: string | null; finalSharedWith: { [key: string]: 'viewer' | 'editor' } }> => {
            let parentId = rootParentId;
            let parentSharedWith = currentSharedWith;
            let currentPath = '';

            for (const segment of pathSegments) {
                currentPath = currentPath ? `${currentPath}/${segment}` : segment;

                if (pathCache.has(currentPath)) {
                    const cached = pathCache.get(currentPath)!;
                    parentId = cached.id;
                    parentSharedWith = cached.sharedWith;
                    continue;
                }

                try {
                    const foldersRef = firestore.collection('folders');
                    const q = foldersRef
                        .where('name', '==', segment)
                        .where('parentId', '==', parentId)
                        .where('ownerId', '==', user.uid)
                        .limit(1);
                    
                    const snapshot = await q.get();

                    if (!snapshot.empty) {
                        const existingFolder = snapshot.docs[0];
                        const existingFolderId = existingFolder.id;
                        parentSharedWith = existingFolder.data().sharedWith || {};
                        pathCache.set(currentPath, { id: existingFolderId, sharedWith: parentSharedWith });
                        parentId = existingFolderId;
                    } else {
                        const newFolder = await foldersRef.add({
                            name: segment,
                            ownerId: user.uid,
                            parentId: parentId,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            type: 'folder',
                            sharedWith: parentSharedWith,
                        });
                        pathCache.set(currentPath, { id: newFolder.id, sharedWith: parentSharedWith });
                        parentId = newFolder.id;
                    }
                } catch (error) {
                    console.error(`Failed to get or create folder for path: ${currentPath}`, error);
                    return { folderId: null, finalSharedWith: {} };
                }
            }
            return { folderId: parentId, finalSharedWith: parentSharedWith };
        };
        
        // Process files sequentially to prevent race conditions when creating folders.
        for (const file of Array.from(files)) {
            try {
                const relativePath = (file as any).webkitRelativePath || file.name;
                const pathSegments = relativePath.split('/').slice(0, -1);
                const { folderId: fileParentId, finalSharedWith } = await getOrCreateFolderId(pathSegments, currentFolderId, initialSharedWith);
                const storagePath = `files/${user.uid}/${Date.now()}_${file.name}`;
                const storageRef = storage.ref(storagePath);

                const uploadTask = await storageRef.put(file);
                const downloadURL = await uploadTask.ref.getDownloadURL();
                await firestore.collection('files').add({
                    name: file.name,
                    ownerId: user.uid,
                    parentId: fileParentId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    type: 'file',
                    downloadURL,
                    storagePath,
                    size: file.size,
                    sharedWith: finalSharedWith,
                });
            } catch (error) {
                console.error(`Error uploading file ${file.name}: `, error);
            }
        }

        setIsUploading(false);
        if (folderInputRef.current) {
            folderInputRef.current.value = '';
        }
    };

    const handleShareClick = (item: Item) => {
        setSharingItem(item);
        setIsShareModalOpen(true);
    };

    const currentFolderName = path[path.length - 1]?.name || (activeView === 'my-files' ? 'My Files' : 'Shared with me');
    const showActionButtons = activeView === 'my-files' || (activeView === 'shared-with-me' && currentFolderId !== null);


    return (
        <main className="main-content">
            <div className="content-header">
                <h1>{currentFolderName}</h1>
                <div className="header-buttons">
                    {showActionButtons && (
                        <>
                            <button className="action-btn secondary" onClick={() => setIsModalOpen(true)} disabled={isUploading}>
                                <NewFolderIcon />
                                New Folder
                            </button>
                             <button 
                                className="action-btn secondary"
                                onClick={handleUploadFolderClick}
                                disabled={isUploading}
                            >
                                <FolderUploadIcon />
                                {isUploading ? 'Uploading...' : 'Upload Folder'}
                            </button>
                            <button 
                                className="action-btn primary"
                                onClick={handleUploadFilesClick}
                                disabled={isUploading}
                            >
                                <UploadIcon />
                                {isUploading ? 'Uploading...' : 'Upload Files'}
                            </button>
                        </>
                    )}
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        multiple
                    />
                     <input
                        type="file"
                        ref={folderInputRef}
                        onChange={handleFolderChange}
                        style={{ display: 'none' }}
                        {...{ webkitdirectory: "true", mozdirectory: "true", directory: "true" }}
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

            {isLoadingPath ? (
                 <div className="loading-container" style={{height: '50vh'}}>Loading folder...</div>
            ) : (
                <div className="file-grid">
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
            )}
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