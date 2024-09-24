import React, { useState } from 'react';
import '../components/styles/DesktopModal.css';
import ModalWindow from './ModalWindow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile } from '@fortawesome/free-solid-svg-icons';

interface DesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DesktopModal: React.FC<DesktopModalProps> = ({ isOpen, onClose }) => {
  const [activeIcon, setActiveIcon] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleIconClick = (iconNumber: number) => {
    setActiveIcon(iconNumber);
  };

  const closeSubModal = () => {
    setActiveIcon(null);
  };

  return (
    <div className="modal-overlay">
      <div className="desktop-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="icons-container">
          <div className="icon" onClick={() => handleIconClick(1)}>
            <FontAwesomeIcon icon={faFolder} size="3x" color="white" />
            <span>Иконка 1</span>
          </div>
          <div className="icon" onClick={() => handleIconClick(2)}>
            <FontAwesomeIcon icon={faFile} size="3x" color="white" />
            <span>Иконка 2</span>
          </div>
        </div>
        {/* Дополнительное модальное окно */}
        {activeIcon && (
          <ModalWindow isOpen={true} onClose={closeSubModal}>
            {activeIcon === 1 && <p>Содержимое для Иконки 1</p>}
            {activeIcon === 2 && <p>Содержимое для Иконки 2</p>}
          </ModalWindow>
        )}
      </div>
    </div>
  );
};

export default DesktopModal;
