import React from 'react';
import { UploadIcon } from '../assets/icons';
import { files } from '../data/mockData';
import { FileItem } from './FileItem';

export const MainContent = () => (
    <main className="main-content">
        <div className="content-header">
            <h1>My Files</h1>
            <button className="upload-btn">
                <UploadIcon />
                Upload
            </button>
        </div>
        <div className="file-grid">
            {files.map(({ id, ...rest }) => (
                <FileItem key={id} {...rest} />
            ))}
        </div>
    </main>
);
