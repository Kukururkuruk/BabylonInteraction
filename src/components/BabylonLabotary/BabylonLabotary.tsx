import React, { useEffect, useRef } from 'react';
import { ToolScene } from '../../BabylonExamples/Laboratory/ToolScene'

const BabylonLabotary: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new ToolScene(canvasRef.current); // Передаем функцию открытия модального окна
    }
  }, []);

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonLabotary;