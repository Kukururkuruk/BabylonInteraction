import React, { useEffect, useRef } from 'react';
import { ToolScene } from '../../BabylonExamples/Laboratory/ToolScene';

const BabylonLabotary: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<ToolScene | null>(null); // Ссылка для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) { // Инициализация сцены только если она еще не создана
      sceneRef.current = new ToolScene(canvasRef.current);
    }
  }, []);

  return (
    <div
      id="app"
      style={{
        position: 'relative', // важно: чтобы абсолютные дети могли позиционироваться внутри
        width: '100%',
        height: '100%',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonLabotary;
