import React, { useEffect, useRef } from 'react';
import { DemoScene } from '../../BabylonExamples/Laboratory/DemoScene';

const BabylonDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new DemoScene(canvasRef.current); // Передаем функцию открытия модального окна
    }
  }, []);

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonDemo;