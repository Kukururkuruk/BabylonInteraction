// import React, { useEffect, useRef, useState } from 'react';
// import { TestScene } from '../BabylonExamples/TestScene';
// import ModalWindow from './ModalWindow';

// const BabylonTest: React.FC = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     if (canvasRef.current) {
//       const example = new TestScene(canvasRef.current);
//       example.openModal = () => setIsModalOpen(true)
//     }
//   }, []);

//   return (
//     <div id="app">
//       <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
//       <ModalWindow
//       isOpen={isModalOpen}
//       onClose={() => setIsModalOpen(false)}>
//         <p>Содержимое для описания</p>
//       </ModalWindow>
//     </div>
//   );
// };

// export default BabylonTest;

import React, { useEffect, useRef, useState } from 'react';
import { TestScene } from '../BabylonExamples/TestScene';
import ModalWindow from './ModalWindow';
import QuizContent from './QuizContent';
import meshData from '/src/assets/mashData.json'; // Импортируем JSON-файл

const BabylonTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const example = new TestScene(canvasRef.current);
      example.openModal = (keyword: string) => {
        setCurrentKeyword(keyword);
        setIsModalOpen(true);
      };
    }
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentKeyword(null);
  };

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
      <ModalWindow isOpen={isModalOpen} onClose={handleCloseModal}>
        {currentKeyword && (
          <QuizContent keyword={currentKeyword} meshData={meshData} />
        )}
      </ModalWindow>
    </div>
  );
};

export default BabylonTest;