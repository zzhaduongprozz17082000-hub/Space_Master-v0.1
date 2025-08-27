import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { firestore } from '../firebase/config';
import { Item } from './MainContent';
import { UserIcon, CloseIcon } from '../assets/icons';

type Permission = 'viewer' | 'editor';

interface AccessUser {
    uid: string;
    email: string | undefined;
    displayName: string | undefined;
    role: 'Owner' | 'Viewer' | 'Editor';
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Item;
    user: firebase.User;
}

export const ShareModal = ({ isOpen, onClose, item, user }: ShareModalProps) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<Permission>('viewer');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [peopleWithAccess, setPeopleWithAccess] = useState<AccessUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal is not open
            setPeopleWithAccess([]);
            setLoading(true);
            setError('');
            setSuccess('');
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const users: AccessUser[] = [];
                
                // 1. Add owner
                users.push({
                    uid: user.uid,
                    email: user.email || 'N/A',
                    displayName: 'You',
                    role: 'Owner'
                });

                // 2. Fetch shared users
                const sharedUserIds = item.sharedWith ? Object.keys(item.sharedWith) : [];
                if (sharedUserIds.length > 0) {
                    const usersRef = firestore.collection('users');
                    const userQuery = await usersRef.where('uid', 'in', sharedUserIds).get();
                    
                    userQuery.docs.forEach(doc => {
                        const sharedUser = doc.data();
                        const role = item.sharedWith?.[sharedUser.uid];
                        if(role) {
                            users.push({
                                uid: sharedUser.uid,
                                email: sharedUser.email,
                                displayName: sharedUser.displayName,
                                role: role === 'viewer' ? 'Viewer' : 'Editor'
                            });
                        }
                    });
                }
                
                setPeopleWithAccess(users);
            } catch (err) {
                console.error("Error fetching users with access: ", err);
                setError("Could not load users with access.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [item, isOpen, user]);


    if (!isOpen) {
        return null;
    }

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
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

            const collectionName = item.type === 'folder' ? 'folders' : 'files';
            const docRef = firestore.collection(collectionName).doc(item.id);

            await docRef.update({
                [`sharedWith.${userToShareWith.uid}`]: permission,
            });
            
            // Manually update the state to show the new user instantly
            setPeopleWithAccess(prev => {
                // Avoid adding duplicates
                if (prev.find(p => p.uid === userToShareWith.uid)) {
                    return prev.map(p => p.uid === userToShareWith.uid ? { ...p, role: permission === 'viewer' ? 'Viewer' : 'Editor' } : p);
                }
                return [...prev, {
                    uid: userToShareWith.uid,
                    email: userToShareWith.email,
                    displayName: userToShareWith.displayName,
                    role: permission === 'viewer' ? 'Viewer' : 'Editor'
                }];
            });

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
                <div className="modal-header">
                    <h2>Share "{item.name}"</h2>
                    <button onClick={onClose} className="modal-close-btn" title="Close"><CloseIcon /></button>
                </div>
                <div className="modal-body">
                    <form className="modal-form" onSubmit={handleShare}>
                        <div className="share-form-row">
                            <div className="form-group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                            <div>
                                <select
                                    value={permission}
                                    onChange={(e) => setPermission(e.target.value as Permission)}
                                >
                                    <option value="viewer">Can view</option>
                                    <option value="editor">Can edit</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-share">Share</button>
                        </div>
                    </form>

                    {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}
                    {success && <p style={{ color: 'lightgreen', marginBottom: '1rem' }}>{success}</p>}

                    <div className="access-list-container">
                        <h3>People with access</h3>
                        <div className="access-list">
                            {loading ? <p>Loading...</p> : peopleWithAccess.map(person => (
                                <div key={person.uid} className="access-list-item">
                                    <div className="user-info">
                                        <div className="user-avatar"><UserIcon/></div>
                                        <div className="user-details">
                                            <div className="name">
                                                {person.uid === user.uid 
                                                    ? `You (${person.email})` 
                                                    : person.displayName || person.email}
                                            </div>
                                            <div className="role">
                                                {person.uid === user.uid ? 'Owner' : person.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="user-permission">
                                        {person.role}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                     <button type="button" className="btn btn-primary" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};