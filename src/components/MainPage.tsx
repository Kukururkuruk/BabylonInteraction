import React from 'react';
import { Link } from 'react-router-dom';
import '../components/styles/Main.css'; // Добавим файл стилей

const Main: React.FC = () => {
  return (
    <div className="main-container">
      <h1>Выбор проекта</h1>
      <div className="button-group">
        <div className="column">
          <button><Link to="/терминология">Терминология</Link></button>
          <button><Link to="/тестирование">Тест терминологии</Link></button>
        </div>
        <div className="column">
          <button><Link to="/ВыборИнструмента">Выбор инструмента</Link></button>
          <button><Link to="/Линейка">Линейка</Link></button>
          <button><Link to="/Штангенциркуль">Штангенциркуль</Link></button>
          <button><Link to="/УровеньПузырька">Уровень пузырька</Link></button>
          <button><Link to="/ДальнометрОбучение">Дальнометр обучение</Link></button>
          <button><Link to="/ДальнометрТест">Дальнометр тест</Link></button>
          <button><Link to="/Бетонометр">Бетонометр</Link></button>
          <button><Link to="/Тахеометр">Тахеометр</Link></button>
          <button><Link to="/ТахеометрЗадание">Тахеометр Задание</Link></button>
          <button><Link to="/ЛинейкаЗадание">ЛинейкаЗадание</Link></button>
        </div>
        <div className="column">
          <button><Link to="/КрашТест">Терминология-производительность</Link></button>
          <button><Link to="/Производительность">Test</Link></button>
          <button><Link to="/texture">Texture</Link></button>
        </div>
        <div className="column">
          <button><Link to="/ЛабИнструменты">Просмотр инструментов</Link></button>
          <button><Link to="/ЛабКомпьютер">Просмотр Компьютера</Link></button>
          <button><Link to="/ЛабДемо">Демо режим</Link></button>
        </div>
      </div>
    </div>
  );
};

export default Main;
