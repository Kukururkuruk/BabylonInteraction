import React from 'react';
import { Link } from 'react-router-dom';

const Main: React.FC = () => {
  return (
    <div>
      <h1>Main Page</h1>
      <button>
        <Link to="/base">Суоро удалим</Link>
      </button>
      <button>
        <Link to="/tutor">Линейка</Link>
      </button>
      <button>
        <Link to="/test">Выбор инструмента</Link>
      </button>
      <button>
        <Link to="/question">Тест терминологии</Link>
      </button>
      <button>
        <Link to="/full">Go to Fullexample Page</Link>
      </button>
      <button>
        <Link to="/Level">Уровень пузырька</Link>
      </button>
      <button>
        <Link to="/book">Терминология</Link>
      </button>
      <button>
        <Link to="/distance">Дальнометр обучение</Link>
      </button>
      <button>
        <Link to="/beton">Бетонометр</Link>
      </button>
      <button>
        <Link to="/total">Go to Total Page</Link>
      </button>
      <button>
        <Link to="/newdistance">Дальнометр тест</Link>
      </button>
    </div>
  );
};

export default Main;