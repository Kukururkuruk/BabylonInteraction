import React, { useEffect, useRef, useState } from 'react';
import { FullExample } from '../BabylonExamples/FullExample';
import DesktopModal from './DesktopModal';

const BabylonExamples: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const example = new FullExample(canvasRef.current);
      example.onOpenModal = () => setIsDesktopModalOpen(true);
    }
  }, []);

  return (
    <div>
      <h3>Babylon Tutor</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
      <DesktopModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
      />
    </div>
  );
};

export default BabylonExamples;
