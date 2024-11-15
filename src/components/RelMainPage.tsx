import React from 'react';
import { Link } from 'react-router-dom';

const RelMain: React.FC = () => {
  return (
    <div>
      <h1>Выбор странички</h1>
       <button>
        <Link to="/терминология">Терминология</Link>
      </button>
      <button>
        <Link to="/терминтест">Терминология-производительность</Link>
      </button>
      <button>
        <Link to="/тестирование">Тест терминологии</Link>
      </button>
    </div>
  );
};

export default RelMain;