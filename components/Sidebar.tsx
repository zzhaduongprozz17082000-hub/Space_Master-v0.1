import React from 'react';
import { RocketIcon, MyFilesIcon, SharedIcon } from '../assets/icons';
import { ViewType } from '../pages/DashboardPage';

interface SidebarProps {
    activeView: ViewType;
    onViewChange: (view: ViewType) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => (
    <aside className="sidebar">
        <div className="sidebar-header">
            <RocketIcon />
            Space Master
        </div>
        <nav className="sidebar-nav">
            <ul>
                <li>
                    <a 
                        href="#" 
                        className={activeView === 'my-files' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            onViewChange('my-files');
                        }}
                        aria-current={activeView === 'my-files'}
                    >
                        <MyFilesIcon /> My Files
                    </a>
                </li>
                <li>
                    <a 
                        href="#" 
                        className={activeView === 'shared-with-me' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            onViewChange('shared-with-me');
                        }}
                        aria-current={activeView === 'shared-with-me'}
                    >
                        <SharedIcon /> Shared with me
                    </a>
                </li>
            </ul>
        </nav>
    </aside>
);
