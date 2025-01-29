import React, { useEffect, useRef, useState } from "react";
import ModalWindow from "./ModalWindow";
import QuizContent from "./QuizContent";
import meshData from "/src/assets/mashData.json"; // Импортируем JSON-файл
import { QuestionSceneNONRANDOM } from "../BabylonExamples/QuestionSceneNONRANDON";

const BabylonQuestionNONRANDOM: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);

  const exampleRef = useRef<QuestionSceneNONRANDOM | null>(null);

  useEffect(() => {
    if (canvasRef.current && !exampleRef.current) {
      // Добавили проверку на существование экземпляра
      const example = new QuestionSceneNONRANDOM(canvasRef.current);
      example.openModal = (keyword: string) => {
        setCurrentKeyword(keyword);
        setIsModalOpen(true);
        example.togglePointerLock();
      };
      exampleRef.current = example;
    }
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentKeyword(null);
    exampleRef.current?.togglePointerLock();
    exampleRef.current?.canvas.focus();
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
      exampleRef.current.deactivateMesh(currentKeyword);
    }
  };

  return (
    <div id="app">
      <canvas
        ref={canvasRef}
        style={{ width: "95%", height: "95%" }}
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

export default BabylonQuestionNONRANDOM;




