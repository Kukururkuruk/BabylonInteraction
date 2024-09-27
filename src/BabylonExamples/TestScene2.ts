// import {
//   Scene,
//   Engine,
//   SceneLoader,
//   Vector3,
//   HemisphericLight,
//   CubeTexture,
//   Tools,
//   FreeCamera
// } from "@babylonjs/core";
// import "@babylonjs/loaders"; // Поддержка загрузки моделей

// export class TestScene2 {
//   scene: Scene;
//   engine: Engine;

//   constructor(private canvas: HTMLCanvasElement) {
//     this.engine = new Engine(this.canvas, true);
//     this.engine.displayLoadingUI(); 

//     this.scene = this.CreateScene();

//     this.CreateEnvironment().then(() => {
//       this.engine.hideLoadingUI();
//     });
//     this.CreateController();

//     this.AddScreenshotButton();

//     this.engine.runRenderLoop(() => {
//       this.scene.render();
//     });
//   }

//   CreateScene(): Scene {
//     const scene = new Scene(this.engine);
//     new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

//     const framesPerSecond = 60;
//     const gravity = -9.81;
//     scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//     scene.collisionsEnabled = true;

//     const envTex = CubeTexture.CreateFromPrefilteredData(
//       "../models/sky.env",
//       scene
//     );
    
//     scene.environmentTexture = envTex;
//     scene.createDefaultSkybox(envTex, true);
//     scene.environmentIntensity = 0.5;

//     return scene;
//   }

//   CreateController(): void {
//     const camera = new FreeCamera("camera", new Vector3(0, 3, 0), this.scene);
//     camera.attachControl(this.canvas, false);

//     camera.applyGravity = true;
//     camera.checkCollisions = true;
//     camera.ellipsoid = new Vector3(1, 1, 1);
//     camera.minZ = 0.45;
//     camera.speed = 0.75;
//     camera.angularSensibility = 4000;
//     camera.keysUp.push(87); // W
//     camera.keysLeft.push(65); // A
//     camera.keysDown.push(83); // S
//     camera.keysRight.push(68); // D
//   }

//   async CreateEnvironment(): Promise<void> {
//     try {
//       this.engine.displayLoadingUI();

//       const { meshes } = await SceneLoader.ImportMeshAsync(
//         "",
//         "./models/",
//         "Map_1.gltf",
//         this.scene
//       );

//       console.log(meshes);
      
//       meshes.forEach((mesh) => {
//         mesh.checkCollisions = true;
//       });

//       console.log("Модели успешно загружены.");
//     } catch (error) {
//       console.error("Ошибка при загрузке моделей:", error);
//     } finally {
//       this.engine.hideLoadingUI();
//     }
//   }

//   AddScreenshotButton(): void {
//     // Проверяем, существует ли уже кнопка
//     if (!document.getElementById("screenshotButton")) {
//         const screenshotButton = document.createElement("button");
//         screenshotButton.id = "screenshotButton"; // Задаем уникальный ID кнопке
//         screenshotButton.innerText = "Сделать скриншот";
//         document.body.appendChild(screenshotButton);

//         screenshotButton.addEventListener("click", () => {
//             Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, { width: 1920, height: 1080 });
//         });
//     }
//   }
// }

import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture, // Для работы с HDR текстурами
  Tools,
  FreeCamera,
  Mesh,
  MeshBuilder,
} from "@babylonjs/core";
import "@babylonjs/loaders"; // Поддержка загрузки моделей
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";

export class TestScene {
  scene: Scene;
  engine: Engine;
  private cubes: Mesh[] = [];
  private currentIndex: number = -1;
  private guiTexture: AdvancedDynamicTexture;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
    this.CreateController();

    this.CreateCubes(); // Создаем кубы

    // Создаем GUI-текстуру
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    this.AddToggleShapeButton(); // Добавляем кнопку переключения
    this.AddScreenshotButton(); // Добавляем кнопку скриншота

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

    // Загружаем новую HDR текстуру
    const hdrTexture = new HDRCubeTexture(
      "/models/cape_hill_4k.hdr", 
      scene, 
      512
    );

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 5, -15), this.scene);
    camera.attachControl(this.canvas, true);

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

  CreateCubes(): void {
    const spacing = 3; // Расстояние между кубами
    const height = 5; // Высота, на которой появляются кубы
    for (let i = 0; i < 3; i++) {
      const cube = MeshBuilder.CreateBox(`cube${i}`, { size: 1 }, this.scene);
      cube.position.x = i * spacing;
      cube.position.y = height;
      this.cubes.push(cube);
    }
  }

  AddToggleShapeButton(): void {
    // Создаем кнопку
    const guiButton = Button.CreateSimpleButton("toggleShapeButton", "Переключить форму");
    guiButton.width = "150px";
    guiButton.height = "40px";
    guiButton.color = "white";
    guiButton.cornerRadius = 20;
    guiButton.background = "green";
    guiButton.top = "-20px";
    guiButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    // Добавляем кнопку на GUI
    this.guiTexture.addControl(guiButton);

    // Добавляем обработчик события
    guiButton.onPointerUpObservable.add(() => {
      this.toggleShape();
    });
  }

  toggleShape(): void {
    // Возвращаем предыдущую сферу обратно в куб
    if (this.currentIndex >= 0) {
      const previousIndex = this.currentIndex % this.cubes.length;
      // Удаляем существующую мешь
      this.cubes[previousIndex].dispose();
      // Создаем куб
      const cube = MeshBuilder.CreateBox(
        `cube${previousIndex}`,
        { size: 1 },
        this.scene
      );
      cube.position.x = previousIndex * 3;
      cube.position.y = 5; // Устанавливаем высоту
      this.cubes[previousIndex] = cube;
    }

    // Увеличиваем текущий индекс
    this.currentIndex = (this.currentIndex + 1) % this.cubes.length;

    // Заменяем текущий куб на сферу
    const currentIndex = this.currentIndex % this.cubes.length;
    // Удаляем существующую мешь
    this.cubes[currentIndex].dispose();
    // Создаем сферу
    const sphere = MeshBuilder.CreateSphere(
      `sphere${currentIndex}`,
      { diameter: 1 },
      this.scene
    );
    sphere.position.x = currentIndex * 3;
    sphere.position.y = 5; // Устанавливаем высоту
    this.cubes[currentIndex] = sphere;
  }

  AddScreenshotButton(): void {
    // Создаем кнопку
    const screenshotButton = Button.CreateSimpleButton("screenshotButton", "Сделать скриншот");
    screenshotButton.width = "150px";
    screenshotButton.height = "40px";
    screenshotButton.color = "white";
    screenshotButton.cornerRadius = 20;
    screenshotButton.background = "blue";
    screenshotButton.top = "20px";
    screenshotButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    // Добавляем кнопку на GUI
    this.guiTexture.addControl(screenshotButton);

    // Добавляем обработчик события
    screenshotButton.onPointerUpObservable.add(() => {
      Tools.CreateScreenshotUsingRenderTarget(
        this.engine,
        this.scene.activeCamera!,
        { width: 1920, height: 1080 }
      );
    });
  }
}

