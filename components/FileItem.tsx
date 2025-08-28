import React from 'react';
import { FolderIcon, FileIcon, ShareIcon } from '../assets/icons';

interface FileItemProps {
  type: 'folder' | 'file';
  name: string;
  downloadURL?: string;
  onClick?: () => void;
  onShareClick: () => void;
}

export const FileItem = ({ type, name, downloadURL, onClick, onShareClick }: FileItemProps) => {
  const icon = type === 'folder' ? <FolderIcon /> : <FileIcon />;

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation for files
    e.stopPropagation(); // Prevent folder navigation
    onShareClick();
  };

  const content = (
    <div className="file-item-wrapper">
       <button className="share-btn" onClick={handleShareClick} title={`Share ${name}`}>
         <ShareIcon />
       </button>
      <div className="file-item" onClick={type === 'folder' ? onClick : undefined}>
        <div className="file-item-icon">{icon}</div>
        <div className="file-item-name">{name}</div>
      </div>
    </div>
  );

  if (type === 'file' && downloadURL) {
    return (
      <a
        href={downloadURL}
        target="_blank"
        rel="noopener noreferrer"
        className="file-item-link"
        title={`Download ${name}`}
      >
        {content}
      </a>
    );
  }

  return content;
};
