import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase/config';
import { User } from '../../types';

export const UserManagementPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = firestore.collection('users').onSnapshot(
            snapshot => {
                const userList = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })) as User[];
                setUsers(userList);
                setLoading(false);
            },
            err => {
                console.error("Error fetching users:", err);
                setError('Failed to load users.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (uid: string, newRole: 'admin' | 'user') => {
        try {
            await firestore.collection('users').doc(uid).update({ role: newRole });
        } catch (err) {
            console.error("Error updating role:", err);
            alert('Failed to update user role.');
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await firestore.collection('users').doc(uid).delete();
                // Note: This only deletes the Firestore record.
                // Deleting from Firebase Auth requires a Cloud Function.
            } catch (err) {
                console.error("Error deleting user:", err);
                alert('Failed to delete user.');
            }
        }
    };

    if (loading) {
        return <div className="loading-container" style={{height: '50vh'}}>Loading users...</div>;
    }

    if (error) {
        return <div style={{ color: 'var(--danger-color)' }}>{error}</div>;
    }

    return (
        <div>
            <h1 className="admin-header">User Management</h1>
            <div className="user-table-container">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.uid}>
                                <td>
                                    <div className="user-info">
                                        <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                                        <span className="user-name">{user.displayName}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        className="role-select"
                                        value={user.role || 'user'}
                                        onChange={(e) => handleRoleChange(user.uid, e.target.value as 'admin' | 'user')}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>
                                    <button className="delete-btn" onClick={() => handleDeleteUser(user.uid)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
