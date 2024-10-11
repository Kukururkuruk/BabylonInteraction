// import React, { useEffect, useRef, useState } from 'react';
// import { QuestionScene } from '../BabylonExamples/QuestionScene';
// import ModalWindow from './ModalWindow';
// import QuizContent from './QuizContent';
// import meshData from '/src/assets/mashData.json'; // Импортируем JSON-файл

// const BabylonQuestion: React.FC = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);

//   const exampleRef = useRef<QuestionScene | null>(null);

//   useEffect(() => {
//     if (canvasRef.current && !exampleRef.current) { // Добавили проверку на существование экземпляра
//       const example = new QuestionScene(canvasRef.current);
//       example.openModal = (keyword: string) => {
//         setCurrentKeyword(keyword);
//         setIsModalOpen(true);
//       };
//       exampleRef.current = example;
//     }
//   }, []);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setCurrentKeyword(null);
//   };

//   // Функция для обновления счетчика правильных ответов
//   const handleCorrectAnswer = () => {
//     if (exampleRef.current) {
//       exampleRef.current.incrementCorrectAnswers();
//     }
//   };

//   return (
//     <div id="app">
//       <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
//       <ModalWindow isOpen={isModalOpen} onClose={handleCloseModal}>
//         {currentKeyword && (
//           <QuizContent
//             keyword={currentKeyword}
//             meshData={meshData}
//             onCorrectAnswer={handleCorrectAnswer}
//             onCloseModal={handleCloseModal} // Передаем функцию
//           />
//         )}
//       </ModalWindow>
//     </div>
//   );
// };

// export default BabylonQuestion;




import React, { useEffect, useRef, useState } from "react";
import { QuestionScene } from "../BabylonExamples/QuestionScene";
import ModalWindow from "./ModalWindow";
import QuizContent from "./QuizContent";
import meshData from "/src/assets/mashData.json"; // Импортируем JSON-файл

const BabylonQuestion: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);

  const exampleRef = useRef<QuestionScene | null>(null);

  useEffect(() => {
    if (canvasRef.current && !exampleRef.current) {
      // Добавили проверку на существование экземпляра
      const example = new QuestionScene(canvasRef.current);
      example.openModal = (keyword: string) => {
        setCurrentKeyword(keyword);
        setIsModalOpen(true);
      };
      exampleRef.current = example;
    }
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentKeyword(null);
  };

  // Функция для обновления счетчика правильных ответов
  const handleCorrectAnswer = () => {
    if (exampleRef.current && currentKeyword) {
      exampleRef.current.incrementCorrectAnswers();
      exampleRef.current.deactivateMesh(currentKeyword);
    }
  };

  // Функция для обновления счетчика неправильных ответов
  const handleIncorrectAnswer = () => {
    if (exampleRef.current && currentKeyword) {
      exampleRef.current.incrementIncorrectAnswers();
      // Если хотите деактивировать меши при неправильном ответе, раскомментируйте следующую строку:
      exampleRef.current.deactivateMesh(currentKeyword);
    }
  };

  return (
    <div id="app">
      <canvas
        ref={canvasRef}
        style={{ width: "90%", height: "90%" }}
      ></canvas>
      <ModalWindow isOpen={isModalOpen} onClose={handleCloseModal}>
        {currentKeyword && (
          <QuizContent
            keyword={currentKeyword}
            meshData={meshData}
            onCorrectAnswer={handleCorrectAnswer}
            onIncorrectAnswer={handleIncorrectAnswer} // Передаем функцию
            onCloseModal={handleCloseModal} // Передаем функцию
          />
        )}
      </ModalWindow>
    </div>
  );
};

export default BabylonQuestion;





