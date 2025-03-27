import React, { useEffect, useRef } from 'react';
import { BetoneBaseScene } from '../BabylonExamples/BetoneBaseScene';

const BabylonBaseBeton: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<BetoneBaseScene | null>(null); // Используем ref для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) {  // Создаем сцену только если её еще нет
      sceneRef.current = new BetoneBaseScene(canvasRef.current);
    }
  }, []);

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonBaseBeton;