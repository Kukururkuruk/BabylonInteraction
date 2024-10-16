// import React, { useEffect, useRef, useState } from "react";
// import { BookScene } from "../BabylonExamples/BookScene";
// import ModalWindow from "./ModalWindow";
// import QuizContent from "./QuizContent";
// import meshData from "/src/assets/mashData.json"; // Импортируем JSON-файл

// const BabylonBook: React.FC = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);

//   const exampleRef = useRef<BookScene | null>(null);

//   useEffect(() => {
//     if (canvasRef.current && !exampleRef.current) {
//       // Добавили проверку на существование экземпляра
//       const example = new BookScene(canvasRef.current);
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
//     if (exampleRef.current && currentKeyword) {
//       exampleRef.current.incrementCorrectAnswers();
//       exampleRef.current.deactivateMesh(currentKeyword);
//     }
//   };

//   // Функция для обновления счетчика неправильных ответов
//   const handleIncorrectAnswer = () => {
//     if (exampleRef.current && currentKeyword) {
//       exampleRef.current.incrementIncorrectAnswers();
//       exampleRef.current.deactivateMesh(currentKeyword);
//     }
//   };

//   return (
//     <div id="app">
//       <canvas
//         ref={canvasRef}
//         style={{ width: "90%", height: "90%" }}
//       ></canvas>
//       <ModalWindow isOpen={isModalOpen} onClose={handleCloseModal}>
//         {currentKeyword && (
//           <QuizContent
//             keyword={currentKeyword}
//             meshData={meshData}
//             onCorrectAnswer={handleCorrectAnswer}
//             onIncorrectAnswer={handleIncorrectAnswer} // Передаем функцию
//             onCloseModal={handleCloseModal} // Передаем функцию
//           />
//         )}
//       </ModalWindow>
//     </div>
//   );
// };

// export default BabylonBook;




import React, { useEffect, useRef, useState } from "react";
import { BookScene } from "../BabylonExamples/BookScene";
import ModalWindow from "./ModalWindow";
import meshDataBook from "../assets/mashDataBook.json"; // Импортируем JSON-файл

const BabylonBook: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string>("");
    const [currentDescription, setCurrentDescription] = useState<string>("");

    const exampleRef = useRef<BookScene | null>(null);

    useEffect(() => {
        if (canvasRef.current && !exampleRef.current) {
            const example = new BookScene(canvasRef.current);
            example.openModal = (keyword: string) => {
                const meshInfo = meshDataBook.find((item) => item.keyword === keyword);
                if (meshInfo) {
                    setCurrentKeyword(keyword);
                    setCurrentTitle(meshInfo.title);
                    setCurrentDescription(meshInfo.description);
                    setIsModalOpen(true);
                } else {
                    console.warn(`Данные для ключевого слова "${keyword}" не найдены.`);
                }
            };
            exampleRef.current = example;
        }
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentKeyword(null);
        setCurrentTitle("");
        setCurrentDescription("");
    };

    return (
        <div id="app">
            <canvas
                ref={canvasRef}
                style={{ width: "90%", height: "90%" }}
            ></canvas>
            <ModalWindow isOpen={isModalOpen} onClose={handleCloseModal}>
                {currentKeyword && (
                    <div>
                        <h2>{currentTitle}</h2>
                        <p>{currentDescription}</p>
                    </div>
                )}
            </ModalWindow>
        </div>
    );
};

export default BabylonBook;







