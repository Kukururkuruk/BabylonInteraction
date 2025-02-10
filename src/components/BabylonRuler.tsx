import React, { useEffect, useRef, useState } from 'react';
import { RulerScene } from '../BabylonExamples/RulerScene';
import DesktopModal from './DesktopModal';

const BabylonExamples: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const example = new RulerScene(canvasRef.current);
      example.onOpenModal = () => setIsDesktopModalOpen(true);
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
