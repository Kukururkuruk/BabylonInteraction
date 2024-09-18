import React from 'react';
import BabylonExamples from './components/BabylonExamples';

const App: React.FC = () => {
  return (
    <div id="app">
      {/* Здесь ваш основной компонент Babylon */}
      <BabylonExamples />

      {/* Добавленный div */}
      <div id="modal" style={{ display: 'none', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h2>Привет! Это дополнительный div</h2>
        <p>Сюда можно вставить любой контент, который вам нужен.</p>
        <button id="closeModal">Закрыть</button>
      </div>
    </div>
  );
};

export default App;
