import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  ArcRotateCamera,
  CubeTexture,
  Tools
} from "@babylonjs/core";
import "@babylonjs/loaders"; // Поддержка загрузки моделей

export class TestScene {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    this.CreateEnvironment();
    this.AddScreenshotButton(); // Добавляем кнопку для скриншота

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    
    // Свет для освещения сцены
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    // Камера, которая будет вращаться вокруг объектов
    const camera = new ArcRotateCamera("ArcRotateCamera", Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), this.scene);
    camera.attachControl(this.canvas, true); // Включаем управление камерой
    camera.wheelPrecision = 50;
    camera.minZ = 0.01; // Устанавливаем минимальную дистанцию для обрезки

    const envTex = CubeTexture.CreateFromPrefilteredData(
          "../models/sky.env",
          scene
        );
    
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    // Загружаем модель в формате glTF
    try {
      const { meshes } = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "SM_FencePostBridge_base512X512.gltf", // Используем формат .gltf
        this.scene
      );

      // Включаем коллизии для всех загруженных мешей
      meshes.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      console.log("Модель успешно загружена:", meshes);
    } catch (error) {
      console.error("Ошибка при загрузке модели:", error);
    }
  }

  // Функция добавления кнопки для скриншота
  AddScreenshotButton(): void {
    // Проверяем, существует ли уже кнопка
    if (!document.getElementById("screenshotButton")) {
        const screenshotButton = document.createElement("button");
        screenshotButton.id = "screenshotButton"; // Задаем уникальный ID кнопке
        screenshotButton.innerText = "Сделать скриншот";
        document.body.appendChild(screenshotButton);

        screenshotButton.addEventListener("click", () => {
            Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, { width: 1920, height: 1080 });
        });
    }
}
}
