import React, { useEffect, useRef } from 'react';
import { ToolScenePC } from '../../BabylonExamples/Laboratory/ToolScenePC';

const BabylonLabotaryPC: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<ToolScenePC | null>(null); // Ссылка для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) { // Инициализация сцены только если она еще не создана
      sceneRef.current = new ToolScenePC(canvasRef.current);
    }
  }, []);

  return (
    <div id="app">
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonLabotaryPC;
