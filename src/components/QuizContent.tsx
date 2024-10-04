import React, { useState } from 'react';

interface QuizContentProps {
  keyword: string;
  meshData: any[];
}

const QuizContent: React.FC<QuizContentProps> = ({ keyword, meshData }) => {
  const meshInfo = meshData.find(item => item.keyword === keyword);

  const [selectedWhat, setSelectedWhat] = useState<string>('');
  const [selectedWhy, setSelectedWhy] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!meshInfo) {
    return <p>Информация недоступна для этого объекта.</p>;
  }

  const handleSubmit = () => {
    if (!selectedWhat || !selectedWhy) {
      setFeedback('Пожалуйста, выберите варианты в обоих селекторах.');
      return;
    }

    const isCorrectWhat = selectedWhat === meshInfo.correctAnswers.what;
    const isCorrectWhy = selectedWhy === meshInfo.correctAnswers.why;

    if (isCorrectWhat && isCorrectWhy) {
      setFeedback('Правильно!');
    } else {
      setFeedback('Неправильно. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <div>
      <div>
        <h3>Что</h3>
        <select
          value={selectedWhat}
          onChange={e => setSelectedWhat(e.target.value)}
        >
          <option value="" disabled>Выберите вариант</option>
          {meshInfo.options.what.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div>
        <h3>Зачем</h3>
        <select
          value={selectedWhy}
          onChange={e => setSelectedWhy(e.target.value)}
        >
          <option value="" disabled>Выберите вариант</option>
          {meshInfo.options.why.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <button onClick={handleSubmit}>Ответить</button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
};

export default QuizContent;