import React, { useEffect, useRef } from 'react';
import { BetoneScene } from '../BabylonExamples/BetoneScene';

const BabylonBeton: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<BetoneScene | null>(null); // Используем ref для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) {  // Создаем сцену только если её еще нет
      sceneRef.current = new BetoneScene(canvasRef.current);
    }
  }, []);

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonBeton;