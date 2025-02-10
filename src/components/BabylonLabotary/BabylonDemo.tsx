import React, { useEffect, useRef } from 'react';
import { DemoScene } from '../../BabylonExamples/Laboratory/DemoScene';

const BabylonDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new DemoScene(canvasRef.current);
    }
  }, []);

  return (
    <div id="app"       style={{
        position: 'relative', // важно: чтобы абсолютные дети могли позиционироваться внутри
        width: '100%',
        height: '100%'
      }}>
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonDemo;