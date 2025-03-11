import React, { useEffect, useRef } from 'react';
import { DemoScene } from '../../BabylonExamples/Laboratory/DemoScene';

const BabylonDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<DemoScene | null>(null); // Используем ref для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) {
      sceneRef.current = new DemoScene(canvasRef.current);
    }
    // Функция очистки
    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose(); // Предполагается, что ToolScenePC имеет метод dispose
        sceneRef.current = null;
        console.log("Размонтирование");
        
      }
    };
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