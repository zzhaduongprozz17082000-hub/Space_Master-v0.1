import React from 'react';
import { RocketIcon, MyFilesIcon, SharedIcon } from '../assets/icons';

export const Sidebar = () => (
    <aside className="sidebar">
        <div className="sidebar-header">
            <RocketIcon />
            Space Master
        </div>
        <nav className="sidebar-nav">
            <ul>
                <li><a href="#" className="active"><MyFilesIcon /> My Files</a></li>
                <li><a href="#"><SharedIcon /> Shared with me</a></li>
            </ul>
        </nav>
    </aside>
);
