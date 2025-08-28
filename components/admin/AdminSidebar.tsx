import React from 'react';
import { RocketIcon, DashboardIcon, UsersIcon } from '../../assets/icons';

export const AdminSidebar = () => {
    const path = window.location.pathname;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <RocketIcon />
                Admin Panel
            </div>
            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <a 
                            href="/admin" 
                            className={(path === '/admin' || path === '/admin/') ? 'active' : ''}
                            aria-current={path === '/admin' || path === '/admin/'}
                        >
                            <DashboardIcon /> Dashboard
                        </a>
                    </li>
                    <li>
                        <a 
                            href="/admin/users" 
                            className={path === '/admin/users' ? 'active' : ''}
                            aria-current={path === '/admin/users'}
                        >
                            <UsersIcon /> Users
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}
