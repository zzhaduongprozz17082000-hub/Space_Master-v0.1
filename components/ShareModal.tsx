import React, { useState } from 'react';
import { firestore } from '../firebase/config';
import { Item } from './MainContent';

type Permission = 'viewer' | 'editor';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Item;
}

export const ShareModal = ({ isOpen, onClose, item }: ShareModalProps) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<Permission>('viewer');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
            // 1. Find the user by email
            const usersRef = firestore.collection('users');
            const userQuery = await usersRef.where('email', '==', email.trim()).limit(1).get();

            if (userQuery.empty) {
                setError('User with this email does not exist.');
                return;
            }

            const userToShareWith = userQuery.docs[0].data();

            if (userToShareWith.uid === item.ownerId) {
                setError('You cannot share an item with its owner.');
                return;
            }

            // 2. If it's a folder, share recursively. Otherwise, share the single file.
            if (item.type === 'folder') {
                const batch = firestore.batch();

                const shareRecursively = async (folderId: string) => {
                    // Share the current folder
                    const folderRef = firestore.collection('folders').doc(folderId);
                    batch.update(folderRef, { [`sharedWith.${userToShareWith.uid}`]: permission });

                    // Get and share all sub-folders
                    const subFoldersQuery = await firestore.collection('folders').where('parentId', '==', folderId).get();
                    for (const doc of subFoldersQuery.docs) {
                        await shareRecursively(doc.id); // Recursive call
                    }

                    // Get and share all files in the current folder
                    const filesQuery = await firestore.collection('files').where('parentId', '==', folderId).get();
                    filesQuery.forEach(doc => {
                        const fileRef = firestore.collection('files').doc(doc.id);
                        batch.update(fileRef, { [`sharedWith.${userToShareWith.uid}`]: permission });
                    });
                };

                await shareRecursively(item.id);
                await batch.commit();
            } else {
                // It's a single file, just update the one document
                const docRef = firestore.collection('files').doc(item.id);
                await docRef.update({
                    [`sharedWith.${userToShareWith.uid}`]: permission,
                });
            }


            setSuccess(`Successfully shared with ${email}!`);
            setEmail('');

        } catch (err) {
            console.error("Error sharing item: ", err);
            setError('Failed to share the item. Please try again.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Share "{item.name}"</h2>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="share-form-row">
                        <div className="form-group">
                            <label htmlFor="shareEmail">Email Address</label>
                            <input
                                type="email"
                                id="shareEmail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email to share with"
                                required
                                autoFocus
                            />
                        </div>
                         <div className="form-group permission-group">
                            <label htmlFor="permission">Permission</label>
                             <select
                                id="permission"
                                value={permission}
                                onChange={(e) => setPermission(e.target.value as Permission)}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                            </select>
                        </div>
                    </div>

                    {error && <p style={{ color: 'var(--danger-color)', marginTop: '1rem' }}>{error}</p>}
                    {success && <p style={{ color: 'lightgreen', marginTop: '1rem' }}>{success}</p>}


                    <div className="modal-actions" style={{marginTop: '1.5rem'}}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Done
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Share
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};