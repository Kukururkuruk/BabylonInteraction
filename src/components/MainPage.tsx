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
<<<<<<< HEAD
        <Link to="/total">Тахеометр</Link>
=======
        <Link to="/Тахеометр">Тахеометр</Link>
>>>>>>> af0696230753710709349d56b5353fa0d8871cf3
      </button>
    </div>
  );
};

export default Main;