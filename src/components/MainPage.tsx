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
        <Link to="/Штангенциркуль">Штангенциркуль</Link>
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
        <Link to="/Тахеометр">Тахеометр</Link>

      </button>
      <button>
        <Link to="/ТахеометрЗадание">Тахеометр Задание</Link>
      </button>
      <button>
        <Link to="/КрашТест">Терминология-производительность</Link>
      </button>
      <button>
        <Link to="/Производительность">Test</Link>
      </button>
    </div>
  );
};

export default Main;
