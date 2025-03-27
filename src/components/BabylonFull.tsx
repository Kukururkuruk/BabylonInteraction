import React, { useEffect, useRef, useState } from 'react';
import { FullExample } from '../BabylonExamples/FullExample';
import DesktopModal from './DesktopModal';

const BabylonExamples: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);
  const sceneRef = useRef<FullExample | null>(null); // Ссылка для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) { // Инициализация сцены только если она еще не создана
      sceneRef.current = new FullExample(canvasRef.current);
      sceneRef.current.onOpenModal = () => setIsDesktopModalOpen(true);
    }
  }, []);

  return (
    <div>
      <h3></h3>
      <canvas ref={canvasRef} style={{ width: '100%', height: '90%' }}></canvas>
      <DesktopModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
      />
    </div>
  );
};

export default BabylonExamples;