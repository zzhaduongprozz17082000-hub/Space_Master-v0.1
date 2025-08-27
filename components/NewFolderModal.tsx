import React, { useState } from 'react';

interface NewFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (folderName: string) => void;
}

export const NewFolderModal = ({ isOpen, onClose, onCreate }: NewFolderModalProps) => {
    const [folderName, setFolderName] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(folderName);
        setFolderName('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Create New Folder</h2>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="folderName">Folder Name</label>
                        <input
                            type="text"
                            id="folderName"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Enter folder name"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
