import React, { useEffect, useRef } from 'react';
import { TestScene } from '../BabylonExamples/TestScene';

const BabylonTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new TestScene(canvasRef.current);
    }
  }, []);

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonTest;