import React, { useState } from "react";

interface QuizContentProps {
  keyword: string;
  meshData: any[];
  onCorrectAnswer: () => void;
  onIncorrectAnswer: () => void; // Новый проп
  onCloseModal: () => void;
}

const QuizContent: React.FC<QuizContentProps> = ({
  keyword,
  meshData,
  onCorrectAnswer,
  onIncorrectAnswer,
  onCloseModal,
}) => {
  const meshInfo = meshData.find((item) => item.keyword === keyword);

  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!meshInfo) {
    return (
      <div>
        <p>Информация недоступна для этого объекта.</p>
        <button onClick={onCloseModal}>Закрыть</button>
      </div>
    );
  }

  const { question, options, correctAnswers } = meshInfo;

  // Получаем ключ опции (например, 'what', 'function', 'purpose')
  const optionKey = Object.keys(options)[0];
  const optionValues = options[optionKey];

  const handleSubmit = () => {
    if (!selectedAnswer) {
      setFeedback("Пожалуйста, выберите вариант.");
      return;
    }

    const isCorrect = selectedAnswer === correctAnswers[optionKey];

    if (isCorrect) {
      setFeedback("Правильно!");
      onCorrectAnswer();
      onCloseModal();
    } else {
      setFeedback("Неправильно. Пожалуйста, попробуйте снова.");
      onIncorrectAnswer(); // Вызываем функцию при неправильном ответе
      onCloseModal();
    }
  };

  return (
    <div>
      <h3>{question}</h3>
      <select
        value={selectedAnswer}
        onChange={(e) => setSelectedAnswer(e.target.value)}
      >
        <option value="" disabled>
          Выберите вариант
        </option>
        {optionValues.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button onClick={handleSubmit}>Ответить</button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
};

export default QuizContent;



