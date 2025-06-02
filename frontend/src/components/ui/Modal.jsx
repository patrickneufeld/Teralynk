// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Modal.jsx

import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "../../styles/components/Modal.css";

/**
 * ✅ Modal Component
 * Supports accessibility, keyboard handling, and flexible slot-based content.
 */
const Modal = ({ isOpen, onClose, title, children, footer, closeOnBackdrop = true }) => {
  const modalRef = useRef();

  // Handle keydown for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle backdrop clicks
  const handleBackdropClick = (e) => {
    if (modalRef.current && e.target === modalRef.current && closeOnBackdrop) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" ref={modalRef} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="modal-content" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="Close Modal">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  closeOnBackdrop: PropTypes.bool,
};

export default Modal;
