import React, { useEffect, useRef } from 'react';
import { BasicScene2 } from '../BabylonExamples/BasicScene2';

const BabylonExamples: React.FC<{ openModal: () => void }> = ({ openModal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new BasicScene2(canvasRef.current, openModal); // Передаем функцию открытия модального окна
    }
  }, [openModal]);

  return (
    <div>
      <h3>Babylon Examples</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default BabylonExamples;
