import React, { useEffect, useRef } from 'react';
import { Level as LevelScene } from '../BabylonExamples/BasicLevel'; // Импортируем класс сцены и переименовываем его

const Level: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new LevelScene(canvasRef.current); // Просто создаем сцену без присваивания
    }
  }, []);

  return (
    <div>
      <h3></h3>
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default Level; // Экспортируем компонент по умолчанию