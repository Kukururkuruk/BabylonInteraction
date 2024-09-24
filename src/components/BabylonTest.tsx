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
      <h3>Babylon Test</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default BabylonTest;