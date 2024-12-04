import React, { useEffect, useRef } from 'react';
import { TestScene2 } from '../BabylonExamples/TestScene2';

const BabylonTest2: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new TestScene2(canvasRef.current); // Передаем функцию открытия модального окна
    }
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
    </div>
  );
};


export default BabylonTest2;
