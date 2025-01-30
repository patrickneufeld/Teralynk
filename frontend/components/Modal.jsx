// File Path: frontend/components/Modal.jsx

import React from 'react';
import '../styles/Modal.css'; // Updated path to match the styles directory

const Modal = ({ isOpen, title, children, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" role="dialog" aria-labelledby="modal-title" aria-modal="true">
            <div className="modal">
                <h3 id="modal-title">{title}</h3>
                <div className="modal-content">{children}</div>
                <button
                    className="close-button"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default Modal;
