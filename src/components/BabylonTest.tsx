import React, { useEffect, useRef, useState } from 'react';
import { TestScene } from '../BabylonExamples/TestScene';
import ModalWindow from './ModalWindow';

const BabylonTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const example = new TestScene(canvasRef.current);
      example.openModal = () => setIsModalOpen(true)
    }
  }, []);

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
      <ModalWindow
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}>
        <p>Содержимое для описания</p>
      </ModalWindow>
    </div>
  );
};

export default BabylonTest;