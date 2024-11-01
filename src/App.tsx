import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/MainPage';
import Base from './components/Base';
import Tutor from './components/Tutor';
import BabylonTest from './components/BabylonTest';
import BabylonQuestion from './components/BabylonQuestion';
import BabylonFull from './components/BabylonFull'; // Импортируйте FullExample
import BasicLevel from './components/Level'; // Импортируйте Level
import BabylonBook from './components/BabylonBook';
import BabylonDistance from './components/BabylonDistance';
import BabylonBeton from './components/BabylonBeton';
import BabylonNewDistanceScene from './components/BabylonNewDistance';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/base" element={<Base />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/test" element={<BabylonTest />} />
        <Route path="/question" element={<BabylonQuestion />} />
        <Route path="/full" element={<BabylonFull />} />
        <Route path="/level" element={<BasicLevel />} /> {/* Используйте BasicLevel в маршруте */}
        <Route path='/book' element={<BabylonBook />} />
        <Route path='/distance' element={<BabylonDistance />} />
        <Route path='/beton' element={<BabylonBeton />} />
        <Route path='/newdistance' element={<BabylonNewDistanceScene />} />
      </Routes>
    </Router>
  );
};

export default App;
