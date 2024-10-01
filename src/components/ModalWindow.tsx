import React from 'react';
import '../components/styles/ModalWindow.css';

interface ModalWindowProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const ModalWindow: React.FC<ModalWindowProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  // Функция для предотвращения контекстного меню
  const preventContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="modal-overlay" onContextMenu={preventContextMenu}>
      <div className="modal-window" onContextMenu={preventContextMenu}>
        <button className="close-button" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default ModalWindow;
