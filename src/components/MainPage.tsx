import React from 'react';
import { Link } from 'react-router-dom';
import '../components/styles/Main.css'; // Добавим файл стилей

const Main: React.FC = () => {
  return (
    <div className="main-container">
      <h1>Выбор проекта</h1>
      <div className="button-group">
        <div className="column">
          
        </div>
        <div className="column">
          
          

          
          <button><Link to="/ЛабДемо">Демо режим</Link></button>
         
        </div>
        <div className="column">
         
        </div>
        <div className="column">
         
        </div>
      </div>
    </div>
  );
};

export default Main;
