import React from 'react';
import { FolderIcon, FileIcon } from '../assets/icons';

interface FileItemProps {
  type: 'folder' | 'file';
  name: string;
}

export const FileItem = ({ type, name }: FileItemProps) => {
  const icon = type === 'folder' ? <FolderIcon /> : <FileIcon />;
  return (
    <div className="file-item">
      <div className="file-item-icon">{icon}</div>
      <div className="file-item-name">{name}</div>
    </div>
  );
};
