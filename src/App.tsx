import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/MainPage';
import Tutor from './components/Tutor';
import BabylonTest from './components/BabylonTest';
import BabylonQuestion from './components/BabylonQuestion';
import BabylonFull from './components/BabylonFull'; // Импортируйте FullExample
import BasicLevel from './components/Level'; // Импортируйте Level
import BabylonBook from './components/BabylonBook';
import BabylonDistance from './components/BabylonDistance';
import BabylonBeton from './components/BabylonBeton';
import BabylonTotal from './components/BabylonTotal';
import BabylonNewDistanceScene from './components/BabylonNewDistance';
import BabylonTotalWork from './components/BabylonTotalWork';
import BabylonBook2 from './components/BabylonBook2';
import BabylonTest2 from './components/BabylonTest2';
import BabylonTexture from './components/BabylonTexture';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/Линейка" element={<Tutor />} />
        <Route path="/ВыборИнструмента" element={<BabylonTest />} />
        <Route path="/тестирование" element={<BabylonQuestion />} />
        <Route path="/Штангенциркуль" element={<BabylonFull />} />
        <Route path="/УровеньПузырька" element={<BasicLevel />} /> {/* Используйте BasicLevel в маршруте */}
        <Route path='/терминология' element={<BabylonBook />} />
        <Route path='/ДальнометрОбучение' element={<BabylonDistance />} />
        <Route path='/Бетонометр' element={<BabylonBeton />} />
        <Route path="/Тахеометр" element={<BabylonTotal />} />
        <Route path='/ДальнометрТест' element={<BabylonNewDistanceScene />} />
        <Route path='/ТахеометрЗадание' element={<BabylonTotalWork/>} />
        <Route path='/КрашТест' element={<BabylonBook2 />} />
        <Route path='/Производительность' element={<BabylonTest2 />} />
        <Route path='/texture' element={<BabylonTexture />} />
      </Routes>
    </Router>
  );
};

export default App;
