import React, { useEffect } from 'react';
import BabylonExamples from './components/BabylonExamples';

const App: React.FC = () => {
  // Функция для открытия модального окна
  const openModal = () => {
    const modal = document.getElementById("modal");
    if (modal) {
      modal.style.display = "block";
    }
  };

  // Функция для закрытия модального окна
  const closeModal = () => {
    const modal = document.getElementById("modal");
    if (modal) {
      modal.style.display = "none";
    }
  };

  // Добавляем обработчик клика на кнопку закрытия
  useEffect(() => {
    const closeModalBtn = document.getElementById("closeModal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", closeModal);
    }
    // Удаляем обработчик при размонтировании компонента
    return () => {
      if (closeModalBtn) {
        closeModalBtn.removeEventListener("click", closeModal);
      }
    };
  }, []);

  return (
    <div id="app">
      {/* Здесь ваш основной компонент Babylon */}
      <BabylonExamples openModal={openModal} />

      {/* Добавленный div для модального окна */}
      <div id="modal" style={{ display: 'none', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h2>Привет! Это дополнительный div</h2>
        <p>Сюда можно вставить любой контент, который вам нужен.</p>
        <button id="closeModal">Закрыть</button>
      </div>
    </div>
  );
};

export default App;
