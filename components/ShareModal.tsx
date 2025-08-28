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
            
            const uidToShare = userToShareWith.uid;

            if (item.type === 'file') {
                 // Update a single file
                const docRef = firestore.collection('files').doc(item.id);
                await docRef.update({
                    [`sharedWith.${uidToShare}`]: permission,
                });
            } else { // item.type is 'folder', share recursively
                const batch = firestore.batch();

                // Recursive function to apply permissions
                const shareRecursively = async (folderId: string) => {
                    // Share all sub-folders first
                    const subFoldersQuery = await firestore.collection('folders').where('parentId', '==', folderId).get();
                    // Using Promise.all to handle recursion in parallel for performance
                    await Promise.all(subFoldersQuery.docs.map(async (doc) => {
                        batch.update(doc.ref, { [`sharedWith.${uidToShare}`]: permission });
                        await shareRecursively(doc.id); // Recurse into sub-folder
                    }));
    
                    // Share all files in the current folder
                    const filesQuery = await firestore.collection('files').where('parentId', '==', folderId).get();
                    filesQuery.docs.forEach((doc) => {
                        batch.update(doc.ref, { [`sharedWith.${uidToShare}`]: permission });
                    });
                };
                
                // Share the top-level folder itself
                const topLevelFolderRef = firestore.collection('folders').doc(item.id);
                batch.update(topLevelFolderRef, { [`sharedWith.${uidToShare}`]: permission });
    
                // Start the recursive sharing process
                await shareRecursively(item.id);
                
                // Commit all the updates in a single atomic operation
                await batch.commit();
            }

            setSuccess(`Successfully shared "${item.name}" with ${email}!`);
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