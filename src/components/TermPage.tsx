import React from 'react';
import { Link } from 'react-router-dom';
import '../components/styles/Main.css'; // Добавим файл стилей

const TermPage: React.FC = () => {
  return (
    <div className="main-container">
      <h1>Выбор проекта</h1>
      <div className="button-group">
        <div className="column">
          <button><Link to="/терминология">Терминология</Link></button>
          <button><Link to="/тестирование">Тест терминологии</Link></button>
          <button><Link to="/ТестНеРандом">Тест все вопросы</Link></button>
        </div>
      </div>
    </div>
  );
};

export default TermPage;
