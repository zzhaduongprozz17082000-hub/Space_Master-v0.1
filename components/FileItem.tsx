import React from 'react';
import { FolderIcon, FileIcon } from '../assets/icons';

interface FileItemProps {
  type: 'folder' | 'file';
  name: string;
  downloadURL?: string;
}

export const FileItem = ({ type, name, downloadURL }: FileItemProps) => {
  const icon = type === 'folder' ? <FolderIcon /> : <FileIcon />;

  const content = (
    <div className="file-item">
      <div className="file-item-icon">{icon}</div>
      <div className="file-item-name">{name}</div>
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