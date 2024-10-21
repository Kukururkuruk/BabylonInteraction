import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/MainPage';
import Base from './components/Base';
import Tutor from './components/Tutor';
import BabylonTest from './components/BabylonTest';
import BabylonQuestion from './components/BabylonQuestion';
import BabylonBook from './components/BabylonBook';
import BabylonDistance from './components/BabylonDistance';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/base" element={<Base />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/test" element={<BabylonTest />} />
        <Route path="/question" element={<BabylonQuestion />} />
        <Route path='/book' element={<BabylonBook />} />
        <Route path='/distance' element={<BabylonDistance />} />
      </Routes>
    </Router>
  );
};

export default App;