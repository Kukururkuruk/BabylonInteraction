import React, { useEffect, useRef } from 'react';
import { DemoScene } from '../../BabylonExamples/Laboratory/DemoScene';

const BabylonDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<DemoScene | null>(null); // Используем ref для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) {  // Создаем сцену только если её еще нет
      sceneRef.current = new DemoScene(canvasRef.current);
    }
  }, []);

  return (
    <div id="app" style={{
      position: 'relative',
      width: '100%',
      height: '100%'
    }}>
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonDemo;