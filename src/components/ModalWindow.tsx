import React from 'react';
import '../components/styles/ModalWindow.css';

interface ModalWindowProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const ModalWindow: React.FC<ModalWindowProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <button className="close-button" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default ModalWindow;