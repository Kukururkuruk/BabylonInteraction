import React, { useEffect, useRef } from 'react';
import { FullExample } from '../BabylonExamples/FullExample'; 

const BabylonExamples: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new FullExample(canvasRef.current);
    }
  }, []);

  return (
    <div>
      <h3>Babylon Tutor</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default BabylonExamples;