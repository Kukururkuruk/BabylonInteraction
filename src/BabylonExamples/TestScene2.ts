import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  CubeTexture,
  Tools,
  FreeCamera
} from "@babylonjs/core";
import "@babylonjs/loaders"; // Поддержка загрузки моделей

export class TestScene2 {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI(); 

    this.scene = this.CreateScene();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
    this.CreateController();

    this.AddScreenshotButton();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    const envTex = CubeTexture.CreateFromPrefilteredData(
      "../models/sky.env",
      scene
    );
    
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 3, 0), this.scene);
    camera.attachControl(this.canvas, false);

    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(1, 1, 1);
    camera.minZ = 0.45;
    camera.speed = 0.75;
    camera.angularSensibility = 4000;
    camera.keysUp.push(87); // W
    camera.keysLeft.push(65); // A
    camera.keysDown.push(83); // S
    camera.keysRight.push(68); // D
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      const { meshes } = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Map_1.gltf",
        this.scene
      );

      console.log(meshes);
      
      meshes.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    } finally {
      this.engine.hideLoadingUI();
    }
  }

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
