// import React, { useEffect, useRef, useState } from "react";
// import { BookScene } from "../BabylonExamples/BookScene";
// import ModalWindow from "./ModalWindow";
// import meshDataBook from "../assets/mashDataBook.json"; // Импортируем JSON-файл

// const BabylonBook: React.FC = () => {
//     const canvasRef = useRef<HTMLCanvasElement>(null);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [currentKeyword, setCurrentKeyword] = useState<string | null>(null);
//     const [currentTitle, setCurrentTitle] = useState<string>("");
//     const [currentDescription, setCurrentDescription] = useState<string>("");

//     const exampleRef = useRef<BookScene | null>(null);

//     useEffect(() => {
//         if (canvasRef.current && !exampleRef.current) {
//             const example = new BookScene(canvasRef.current);
//             example.openModal = (keyword: string) => {
//                 const meshInfo = meshDataBook.find((item) => item.keyword === keyword);
//                 if (meshInfo) {
//                     setCurrentKeyword(keyword);
//                     setCurrentTitle(meshInfo.title);
//                     setCurrentDescription(meshInfo.description);
//                     setIsModalOpen(true);
//                 } else {
//                     console.warn(`Данные для ключевого слова "${keyword}" не найдены.`);
//                 }
//             };
//             exampleRef.current = example;
//         }
//     }, []);

//     const handleCloseModal = () => {
//         setIsModalOpen(false);
//         setCurrentKeyword(null);
//         setCurrentTitle("");
//         setCurrentDescription("");
//     };

//     // Обновлённая функция для форматирования описания
//     const formatDescription = (description: string) => {
//         // Разбиваем описание на части, разделённые '**'
//         const parts = description.split("**").filter(part => part.trim() !== "");

//         const formattedParts: JSX.Element[] = [];

//         parts.forEach((part, index) => {
//             // Проверяем, содержит ли часть двоеточие
//             const colonIndex = part.indexOf(":");
//             if (colonIndex !== -1) {
//                 const title = part.substring(0, colonIndex).trim();
//                 const desc = part.substring(colonIndex + 1).trim();

//                 // Обработка переносов строк (\r\n или \n)
//                 const descLines = desc.split(/\r?\n/).filter(line => line.trim() !== "");

//                 formattedParts.push(
//                     <div key={index} style={{ marginBottom: '1em' }}>
//                         <p>
//                             <strong>{title}:</strong>
//                         </p>
//                         {descLines.map((line, idx) => (
//                             <p key={idx} style={{ marginBottom: '0.5em' }}>
//                                 {line}
//                             </p>
//                         ))}
//                     </div>
//                 );
//             } else {
//                 // Обработка обычного текста с переносами строк
//                 const lines = part.split(/\r?\n/).filter(line => line.trim() !== "");
//                 formattedParts.push(
//                     <div key={index} style={{ marginBottom: '1em' }}>
//                         {lines.map((line, idx) => (
//                             <p key={idx} style={{ marginBottom: '0.5em' }}>
//                                 {line}
//                             </p>
//                         ))}
//                     </div>
//                 );
//             }
//         });

//         return formattedParts;
//     };

//     return (
//         <div id="app">
//             <canvas
//                 ref={canvasRef}
//                 style={{ width: "90%", height: "90%" }}
//             ></canvas>
//             <ModalWindow isOpen={isModalOpen} onClose={handleCloseModal}>
//                 {currentKeyword && (
//                     <div>
//                         <h2>{currentTitle}</h2>
//                         <div style={{ whiteSpace: 'pre-line' }}>
//                             {formatDescription(currentDescription)}
//                         </div>
//                     </div>
//                 )}
//             </ModalWindow>
//         </div>
//     );
// };

// export default BabylonBook;





import React, { useEffect, useRef, useState } from "react";
import { BookScene } from "../BabylonExamples/BookScene";
import ModalWindow from "./ModalWindow";
import meshDataBook from "../assets/mashDataBook.json";

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

    // Обновлённая функция для обработки описания
    const processDescription = (description: string) => {
        const regex = /\*\*(.*?)\*\*([\s\S]*?)(?=\*\*|$)/g;
        let processed = '';
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(description)) !== null) {
            const [fullMatch, boldText, restOfLine] = match;
            const index = match.index;
            // Добавляем текст до совпадения
            processed += description.slice(lastIndex, index);
            // Добавляем новый абзац с жирным текстом
            processed += '<p><strong>' + boldText + '</strong>' + restOfLine + '</p>';
            lastIndex = regex.lastIndex;
        }
        // Добавляем оставшийся текст
        processed += description.slice(lastIndex);
        // Заменяем переносы строк на <br/>
        processed = processed.replace(/\n/g, '<br/>');
        return processed;
    };

    const processedDescription = processDescription(currentDescription);

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
                        <div dangerouslySetInnerHTML={{ __html: processedDescription }}></div>
                    </div>
                )}
            </ModalWindow>
        </div>
    );
};

export default BabylonBook;







