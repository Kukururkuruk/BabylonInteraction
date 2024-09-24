import React, { useEffect } from 'react';
import BabylonExamples from '../components/BabylonExamples';

const Base: React.FC = () => {
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
        <h2>Дефект</h2>
        <img src='\models\DSCN4299_Б7 от Б6.JPG' alt='Повреждение' width="400" height="341"/>
        <form id="dropdownForm">
        <label for="dropdown1">Выберите конструкцию:</label>
        <select id="dropdown1">
            <option value="" disabled selected>Выберите...</option>
            <option value="option1">Вариант 1</option>
            <option value="option2">Вариант 2</option>
            <option value="option3">Вариант 3</option>
        </select>


        <label for="dropdown2">Выберите дефект:</label>
        <select id="dropdown2">
            <option value="" disabled selected>Выберите...</option>
            <option value="optionA">Вариант A</option>
            <option value="optionB">Вариант B</option>
            <option value="optionC">Вариант C</option>
        </select>

        <label for="dropdown3">Выберите метод:</label>
        <select id="dropdown3">
            <option value="" disabled selected>Выберите...</option>
            <option value="choiceX">Выбор X</option>
            <option value="choiceY">Выбор Y</option>
            <option value="choiceZ">Выбор Z</option>
        </select>

    </form>
        <p>Сюда можно вставить любой контент, который вам нужен.</p>
        <button id="closeModal">Закрыть</button>
      </div>
    </div>
  );
};

export default Base;
