// src/contexts/ModalContext.jsx
import { createContext, useState, useCallback } from "react";
import ModalManager from "./ModalManager"; // Make sure the ModalManager file exists in the same folder

export const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});

  // Open a modal
  const openModal = useCallback((modalId, props = {}) => {
    setModals(prev => ({ ...prev, [modalId]: { isOpen: true, props }}));
  }, []);

  // Close a modal
  const closeModal = useCallback((modalId) => {
    setModals(prev => ({ ...prev, [modalId]: { isOpen: false }}));
  }, []);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal }}>
      {children}
      <ModalManager />
    </ModalContext.Provider>
  );
};
