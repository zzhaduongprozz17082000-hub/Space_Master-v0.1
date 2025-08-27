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
            {/* FIX: Destructure and pass props explicitly to avoid a TypeScript error where the 'key' prop interferes with spread props type checking. */}
            {files.map(({ id, type, name }) => (
                <FileItem key={id} type={type} name={name} />
            ))}
        </div>
    </main>
);