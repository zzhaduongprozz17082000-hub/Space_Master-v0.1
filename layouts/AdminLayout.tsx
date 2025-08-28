import React from 'react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { Header } from '../components/Header';
import { FirebaseUser } from '../firebase/config';

interface AdminLayoutProps {
    user: FirebaseUser;
}

export const AdminLayout = ({ user }: AdminLayoutProps) => {
    const path = window.location.pathname;
    
    let currentPage;
    if (path === '/admin' || path === '/admin/') {
        currentPage = <AdminDashboardPage />;
    } else if (path === '/admin/users') {
        currentPage = <UserManagementPage />;
    } else {
        // Fallback to dashboard for any other /admin routes
        currentPage = <AdminDashboardPage />;
    }

    return (
        <div className="admin-layout-container">
            <AdminSidebar />
            <div className="main-wrapper">
                <Header user={user} />
                <main className="admin-main-content">
                    {currentPage}
                </main>
            </div>
        </div>
    );
};
