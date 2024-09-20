import React from 'react';
import { Link } from 'react-router-dom';

const Main: React.FC = () => {
  return (
    <div>
      <h1>Main Page</h1>
      <button>
        <Link to="/base">Go to Base Page</Link>
      </button>
      <button>
        <Link to="/tutor">Go to Tutor Page</Link>
      </button>
    </div>
  );
};

export default Main;