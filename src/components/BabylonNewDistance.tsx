import React, { useEffect, useRef } from 'react';
import { NewDistanceScene } from '../BabylonExamples/NewDistanceScene';

const BabylonNewDistanceScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new NewDistanceScene(canvasRef.current); // Передаем функцию открытия модального окна
    }
  }, []);

  return (
    <div>
      <h3>Babylon NewDistance</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default BabylonNewDistanceScene;