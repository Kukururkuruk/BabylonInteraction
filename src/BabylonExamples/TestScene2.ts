// import {
//   Scene,
//   Engine,
//   SceneLoader,
//   Vector3,
//   HemisphericLight,
//   HDRCubeTexture,
//   Tools,
//   FreeCamera,
//   Mesh,
//   MeshBuilder,
// } from "@babylonjs/core";
// import "@babylonjs/loaders";
// import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";

// export class TestScene {
//   scene: Scene;
//   engine: Engine;
//   private cubes: Mesh[] = [];
//   private currentIndex: number = -1;
//   private guiTexture: AdvancedDynamicTexture;

//   constructor(private canvas: HTMLCanvasElement) {
//     this.engine = new Engine(this.canvas, true);
//     this.engine.displayLoadingUI();

//     this.scene = this.CreateScene();

//     this.CreateEnvironment().then(() => {
//       this.engine.hideLoadingUI();
//     });
//     this.CreateController();

//     this.CreateCubes();

//     this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

//     this.AddToggleShapeButton();
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

//     // Загружаем новую HDR текстуру
//     const hdrTexture = new HDRCubeTexture(
//       "/models/cape_hill_4k.hdr", 
//       scene, 
//       512
//     );

//     scene.environmentTexture = hdrTexture;
//     scene.createDefaultSkybox(hdrTexture, true);
//     scene.environmentIntensity = 0.5;

//     return scene;
//   }

//   CreateController(): void {
//     const camera = new FreeCamera("camera", new Vector3(0, 5, -15), this.scene);
//     camera.attachControl(this.canvas, true);

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

//   CreateCubes(): void {
//     const spacing = 3; // Расстояние между кубами
//     const height = 5; // Высота, на которой появляются кубы
//     for (let i = 0; i < 3; i++) {
//       const cube = MeshBuilder.CreateBox(`cube${i}`, { size: 1 }, this.scene);
//       cube.position.x = i * spacing;
//       cube.position.y = height;
//       this.cubes.push(cube);
//     }
//   }

//   AddToggleShapeButton(): void {
//     // Создаем кнопку
//     const guiButton = Button.CreateSimpleButton("toggleShapeButton", "Переключить форму");
//     guiButton.width = "150px";
//     guiButton.height = "40px";
//     guiButton.color = "white";
//     guiButton.cornerRadius = 20;
//     guiButton.background = "green";
//     guiButton.top = "-20px";
//     guiButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

//     // Добавляем кнопку на GUI
//     this.guiTexture.addControl(guiButton);

//     // Добавляем обработчик события
//     guiButton.onPointerUpObservable.add(() => {
//       this.toggleShape();
//     });
//   }

//   toggleShape(): void {
//     // Возвращаем предыдущую сферу обратно в куб
//     if (this.currentIndex >= 0) {
//       const previousIndex = this.currentIndex % this.cubes.length;
//       // Удаляем существующую мешь
//       this.cubes[previousIndex].dispose();
//       // Создаем куб
//       const cube = MeshBuilder.CreateBox(
//         `cube${previousIndex}`,
//         { size: 1 },
//         this.scene
//       );
//       cube.position.x = previousIndex * 3;
//       cube.position.y = 5; // Устанавливаем высоту
//       this.cubes[previousIndex] = cube;
//     }

//     // Увеличиваем текущий индекс
//     this.currentIndex = (this.currentIndex + 1) % this.cubes.length;

//     // Заменяем текущий куб на сферу
//     const currentIndex = this.currentIndex % this.cubes.length;
//     // Удаляем существующую мешь
//     this.cubes[currentIndex].dispose();
//     // Создаем сферу
//     const sphere = MeshBuilder.CreateSphere(
//       `sphere${currentIndex}`,
//       { diameter: 1 },
//       this.scene
//     );
//     sphere.position.x = currentIndex * 3;
//     sphere.position.y = 5; // Устанавливаем высоту
//     this.cubes[currentIndex] = sphere;
//   }

//   AddScreenshotButton(): void {
//     // Создаем кнопку
//     const screenshotButton = Button.CreateSimpleButton("screenshotButton", "Сделать скриншот");
//     screenshotButton.width = "150px";
//     screenshotButton.height = "40px";
//     screenshotButton.color = "white";
//     screenshotButton.cornerRadius = 20;
//     screenshotButton.background = "blue";
//     screenshotButton.top = "20px";
//     screenshotButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

//     // Добавляем кнопку на GUI
//     this.guiTexture.addControl(screenshotButton);

//     // Добавляем обработчик события
//     screenshotButton.onPointerUpObservable.add(() => {
//       Tools.CreateScreenshotUsingRenderTarget(
//         this.engine,
//         this.scene.activeCamera!,
//         { width: 1920, height: 1080 }
//       );
//     });
//   }
// }


import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  Tools,
  FreeCamera,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture } from "@babylonjs/gui";

export class TestScene {
  scene: Scene;
  engine: Engine;
  canvas: HTMLCanvasElement;
  camera: FreeCamera; // Добавлено свойство камеры
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
    this.CreateController();

    this.setupRecordingControls();
    this.setupGravityToggle();

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

    const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    // Изменено: сохраняем камеру в свойство класса
    this.camera = new FreeCamera("camera", new Vector3(0, 15, -15), this.scene);
    this.camera.attachControl(this.canvas, true);

    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.angularSensibility = 4000;
    this.camera.keysUp.push(87); // W
    this.camera.keysLeft.push(65); // A
    this.camera.keysDown.push(83); // S
    this.camera.keysRight.push(68); // D
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);

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

  setupGravityToggle(): void {
    const gravityButton = document.createElement("button");
    gravityButton.textContent = "Переключить гравитацию";
    gravityButton.style.position = "absolute";
    gravityButton.style.top = "10px";
    gravityButton.style.right = "10px";

    document.body.appendChild(gravityButton);

    gravityButton.onclick = () => {
      this.camera.applyGravity = !this.camera.applyGravity;
      console.log(`Гравитация теперь ${this.camera.applyGravity ? 'включена' : 'отключена'}`);
    };
  }

  setupRecordingControls(): void {
    const startButton = document.createElement("button");
    startButton.textContent = "Начать запись";
    startButton.style.position = "absolute";
    startButton.style.top = "50px";
    startButton.style.left = "10px";

    const stopButton = document.createElement("button");
    stopButton.textContent = "Остановить запись";
    stopButton.style.position = "absolute";
    stopButton.style.top = "50px";
    stopButton.style.left = "130px";

    document.body.appendChild(startButton);
    document.body.appendChild(stopButton);

    startButton.onclick = () => this.startRecording();
    stopButton.onclick = () => this.stopRecording();
  }

  startRecording(): void {
    if (!this.canvas) return;

    const stream = this.canvas.captureStream(30); // 30 fps
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      a.click();
      URL.revokeObjectURL(url);
    };

    this.recordedChunks = [];
    this.mediaRecorder.start();
    console.log("Запись начата");
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      console.log("Запись остановлена");
    }
  }
}


