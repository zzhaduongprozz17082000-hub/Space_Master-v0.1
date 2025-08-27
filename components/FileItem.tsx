import React from 'react';
import { FolderIcon, FileIcon } from '../assets/icons';
import { FileData } from '../data/mockData';

type FileItemProps = Omit<FileData, 'id'>;

export const FileItem = ({ type, name }: FileItemProps) => {
  const icon = type === 'folder' ? <FolderIcon /> : <FileIcon />;
  return (
    <div className="file-item">
      <div className="file-item-icon">{icon}</div>
      <div className="file-item-name">{name}</div>
    </div>
  );
};
