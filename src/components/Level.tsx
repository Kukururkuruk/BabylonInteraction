import React, { useEffect, useRef } from 'react';
import { Level as LevelScene } from '../BabylonExamples/BasicLevel'; // Импортируем класс сцены и переименовываем его

const Level: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LevelScene | null>(null); // Ссылка для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) { // Инициализация сцены только если она еще не создана
      sceneRef.current = new LevelScene(canvasRef.current);
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
