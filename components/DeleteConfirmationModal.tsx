import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    itemType: 'file' | 'folder';
    isDeleting: boolean;
}

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, itemType, isDeleting }: DeleteConfirmationModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Confirm Deletion</h2>
                <p style={{ margin: '1.5rem 0', color: 'var(--text-secondary)' }}>
                    Are you sure you want to permanently delete "{itemName}"?
                    {itemType === 'folder' && <strong> All of its contents will also be deleted.</strong>}
                    <br/>
                    This action cannot be undone.
                </p>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isDeleting}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};
