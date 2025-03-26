import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BabylonDemo from './components/BabylonLabotary/BabylonDemo';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/ЛабДемо" replace />} />
        <Route path="/ЛабДемо" element={<BabylonDemo />} />
      </Routes>
    </Router>
  );
};

export default App;