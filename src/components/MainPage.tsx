import React from 'react';
import { Link } from 'react-router-dom';

const Main: React.FC = () => {
  return (
    <div>
      <h1>Выбор проекта</h1>
      <button>
        <Link to="/терминология">Терминология</Link>
      </button>
      <button>
        <Link to="/тестирование">Тест терминологии</Link>
      </button>
      <button>
        <Link to="/ВыборИнструмента">Выбор инструмента</Link>
      </button>
      <button>
        <Link to="/Линейка">Линейка</Link>
      </button>
      <button>
        <Link to="/full">Go to Fullexample Page</Link>
      </button>
      <button>
        <Link to="/УровеньПузырька">Уровень пузырька</Link>
      </button>
      <button>
        <Link to="/ДальнометрОбучение">Дальнометр обучение</Link>
      </button>
      <button>
        <Link to="/ДальнометрТест">Дальнометр тест</Link>
      </button>
      <button>
        <Link to="/Бетонометр">Бетонометр</Link>
      </button>
      <button>
        <Link to="/total">Go to Total Page</Link>
      </button>
    </div>
  );
};

export default Main;