/*import React, { useEffect } from 'react';
import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
  AbstractMesh,
  MeshBuilder,
  HighlightLayer,
  HDRCubeTexture
} from "@babylonjs/core";
import "@babylonjs/loaders";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Control
} from "@babylonjs/gui";
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import * as CANNON from 'cannon-es';

interface LevelProps {
  canvas: HTMLCanvasElement; // Ожидаем, что canvas будет передан как пропс
}

export class Level {
  scene: Scene;
  engine: Engine;
  advancedTexture: AdvancedDynamicTexture | null = null; // Инициализируем как null
  textBlock: TextBlock | null = null; // Инициализируем как null
  highlightLayer: HighlightLayer;
  textMessages: string[] = ["Нажмите на W", "Нажмите на S", "Нажмите на A", "Нажмите на D"];
  currentTextIndex: number = 0;
  bubble: AbstractMesh | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    console.log("Initializing the engine and displaying loading UI.");
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI(); // Показываем интерфейс загрузки

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);

    this.CreateEnvironment().then(() => {
      console.log("Environment loaded. Hiding loading UI.");
      this.engine.hideLoadingUI(); // Скрываем интерфейс загрузки
    });

    this.CreateController();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
  
    // Включение физики
    const gravityVector = new Vector3(0, -9.81, 0);
    const physicsPlugin = new CannonJSPlugin(true, 5, CANNON); // Это должно работать
    scene.enablePhysics(gravityVector, physicsPlugin);
    
  
    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  
    const hdrTexture = new HDRCubeTexture("./models/cape_hill_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.collisionsEnabled = true;
    scene.createDefaultSkybox(hdrTexture, true, 1000);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    console.log("Loading environment...");
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Map_1.gltf",
      this.scene
    );

    meshes.forEach((mesh) => {
      mesh.checkCollisions = true;
      console.log("Mesh loaded: ", mesh.name);
    });

    this.engine.displayLoadingUI();
  }

  CreateController(): void {
    console.log("Creating camera controller...");
    const camera = new FreeCamera("camera", new Vector3(20, 50, 0), this.scene);
    camera.attachControl(this.canvas, false);

    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(1, 2, 1);
    camera.minZ = 0.45;
    camera.speed = 0.75;
    camera.angularSensibility = 4000;
    camera.keysUp.push(87); // W
    camera.keysLeft.push(65); // A
    camera.keysDown.push(83); // S
    camera.keysRight.push(68); // D
  }

  createGui(): void {
    console.log("Creating GUI...");
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);

    this.textBlock = new TextBlock();
    if (this.textBlock) { // Проверяем на наличие textBlock
      this.textBlock.text = this.textMessages[this.currentTextIndex];
      this.textBlock.color = "white";
      this.textBlock.fontSize = 24;
      this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      this.advancedTexture.addControl(this.textBlock);
      console.log("Text block created with message: ", this.textBlock.text);
    }

    window.addEventListener("keydown", (event) => {
      console.log("Key pressed: ", event.key);
      if (event.key === "w" || event.key === "W") {
        this.updateText(0);
      } else if (event.key === "s" || event.key === "S") {
        this.updateText(1);
      } else if (event.key === "a" || event.key === "A") {
        this.updateText(2);
      } else if (event.key === "d" || event.key === "D") {
        this.updateText(3);
      }
    });
  }

  updateText(index: number): void {
    console.log("Updating text to index: ", index);
    if (index === this.currentTextIndex) {
      this.currentTextIndex++;
      if (this.currentTextIndex < this.textMessages.length) {
        if (this.textBlock) { // Проверяем на наличие textBlock
          this.textBlock.text = this.textMessages[this.currentTextIndex];
          console.log("Updated text block message: ", this.textBlock.text);
        }
      } else {
        if (this.textBlock) { // Проверяем на наличие textBlock
          this.textBlock.isVisible = false; // Скрыть текст, когда все сообщения показаны
          console.log("All messages shown. Hiding text block.");
        }
      }
    }
  }

  // Обработка движения мыши
  handleMouseMove(event: MouseEvent): void {
    if (!this.bubble) return;
    const { movementX } = event;
    this.bubble.position.x += movementX * 0.01; // Изменение положения шара
    console.log("Bubble position updated to: ", this.bubble.position);
  }
}

const Level: React.FC<LevelProps> = ({ canvas }) => {
  useEffect(() => {
    const basicScene = new Level(canvas);

    const handleMouseMove = (event: MouseEvent) => {
      basicScene.handleMouseMove(event);
    };

    window.addEventListener('mousemove', handleMouseMove); // Добавление слушателя

    return () => {
      window.removeEventListener('mousemove', handleMouseMove); // Удаление слушателя при размонтировании
      basicScene.engine.dispose(); // Очистка при размонтировании компонента
      console.log("Engine disposed.");
    };
  }, [canvas]);

  return null; // Этот компонент не рендерит ничего сам по себе
};

export default Level;



