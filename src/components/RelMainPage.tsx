import React from 'react';
import { Link } from 'react-router-dom';

const RelMain: React.FC = () => {
  return (
    <div>
      <h1>Выбор странички</h1>
       <button>
        <Link to="/book">Терминология</Link>
      </button>
      <button>
        <Link to="/question">Тест терминологии</Link>
      </button>
    </div>
  );
};

export default RelMain;