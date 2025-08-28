import React, { useState, useEffect } from 'react';
import { functions } from '../../firebase/config';
import { StatCard } from '../../components/admin/StatCard';
import { FileIcon, FolderIcon, UsersIcon, StorageIcon } from '../../assets/icons';

interface Stats {
    userCount: number;
    fileCount: number;
    folderCount: number;
    totalStorage: number;
}

const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const AdminDashboardPage = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get a reference to the callable function
                const getAdminStats = functions.httpsCallable('getAdminStats');
                
                // Call the function and await the result
                const result = await getAdminStats();
                const data = result.data as Stats;
                
                setStats(data);
            } catch (err) {
                console.error("Error fetching admin stats:", err);
                setError('Failed to load dashboard statistics. Ensure you have admin privileges and the backend function is deployed.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="loading-container" style={{height: '50vh'}}>Loading dashboard...</div>;
    }

    if (error) {
        return <div style={{ color: 'var(--danger-color)' }}>{error}</div>;
    }

    return (
        <div>
            <h1 className="admin-header">Dashboard</h1>
            <div className="dashboard-grid">
                <StatCard 
                    icon={<UsersIcon />} 
                    title="Total Users" 
                    value={stats?.userCount.toString() || '0'} 
                />
                <StatCard 
                    icon={<FileIcon />} 
                    title="Total Files" 
                    value={stats?.fileCount.toString() || '0'} 
                />
                <StatCard 
                    icon={<FolderIcon />} 
                    title="Total Folders" 
                    value={stats?.folderCount.toString() || '0'} 
                />
                <StatCard 
                    icon={<StorageIcon />} 
                    title="Storage Used" 
                    value={formatBytes(stats?.totalStorage || 0)} 
                />
            </div>
        </div>
    );
};
