import firebase from 'firebase/compat/app';

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
