import React, { useState } from "react";
import '../components/styles/QuizContent.css';

interface QuizContentProps {
  keyword: string;
  meshData: any[];
  onCorrectAnswer: () => void;
  onIncorrectAnswer: () => void;
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
      <div className="quiz-content">
        <p className="quiz-description">
          Информация недоступна для этого объекта.
        </p>
        <button className="quiz-button" onClick={onCloseModal}>
          Закрыть
        </button>
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
      setFeedback("Неправильно");
      onIncorrectAnswer();
      onCloseModal();
    }
  };

  return (
    <div className="quiz-content">
      <h3 className="quiz-title">{question}</h3>

      <div className="quiz-select">
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
      </div>

      <div className="quiz-actions">
        <button className="quiz-button" onClick={handleSubmit}>
          Ответить
        </button>
      </div>

      {feedback && <p className="quiz-feedback">{feedback}</p>}
    </div>
  );
};

export default QuizContent;
