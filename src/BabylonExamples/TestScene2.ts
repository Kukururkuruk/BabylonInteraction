import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  Ray,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class TestScene2 {
  scene: Scene;
  engine: Engine;
  canvas: HTMLCanvasElement;
  camera: FreeCamera;
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];

  // Свойства для куба, лазера и точки пересечения
  centralCube: Mesh | null = null;
  redRay: Mesh | null = null;
  intersectionPoint: Mesh | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.AddCentralCubeAndRay(); // Добавляем куб и луч после загрузки окружения
    });
    this.CreateController();

    this.setupRecordingControls();
    this.setupGravityToggle();

    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.updateRayIntersection(); // Обновляем пересечение лазера с объектами
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
    // Установка начальной позиции камеры для лучшей видимости
    this.camera = new FreeCamera("camera", new Vector3(0, 5, -10), this.scene);
    this.camera.attachControl(this.canvas, true);

    this.camera.applyGravity = false;
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

  AddCentralCubeAndRay(): void {
    // 1. Создание куба
    const cubeSize = 0.5; // Уменьшенный размер куба
    this.centralCube = MeshBuilder.CreateBox("centralCube", { size: cubeSize }, this.scene);

    // 2. Привязка куба к камере
    this.centralCube.parent = this.camera;

    // 3. Установка относительной позиции куба (чуть правее и вперёд)
    this.centralCube.position = new Vector3(1, 0, 2); // Измените значения по своему усмотрению

    // 4. Создание материала для куба
    const cubeMaterial = new StandardMaterial("cubeMaterial", this.scene);
    cubeMaterial.diffuseColor = new Color3(0, 1, 0); // Зелёный цвет для куба
    this.centralCube.material = cubeMaterial;

    // 5. Сделать куб видимым для отладки
    this.centralCube.isVisible = true;

    // 6. Создание красного луча (линии) исходящего из передней грани куба
    const rayLength = 10; // Длина лазера
    const rayPoints = [
      new Vector3(0, 0, cubeSize / 2 + 0.01), // Начало чуть перед грани куба
      new Vector3(0, 0, cubeSize / 2 + 0.01 + rayLength), // Конец луча
    ];
    this.redRay = MeshBuilder.CreateLines("redRay", { points: rayPoints }, this.scene);

    // 7. Привязка луча к кубу, чтобы он двигался вместе с ним
    this.redRay.parent = this.centralCube;

    // 8. Создание материала для луча
    const rayMaterial = new StandardMaterial("rayMaterial", this.scene);
    rayMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет
    this.redRay.color = rayMaterial.emissiveColor;

    // 9. Создание точки пересечения (маленькая сфера), изначально скрытая
    const pointSize = 0.3;
    this.intersectionPoint = MeshBuilder.CreateSphere("intersectionPoint", { diameter: pointSize }, this.scene);
    const pointMaterial = new StandardMaterial("pointMaterial", this.scene);
    pointMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет
    this.intersectionPoint.material = pointMaterial;
    this.intersectionPoint.isVisible = false; // Скрыта по умолчанию
  }

  updateRayIntersection(): void {
    // Проверяем, инициализированы ли куб и луч
    if (!this.centralCube || !this.redRay || !this.intersectionPoint) {
      return;
    }

    // Получаем глобальную позицию начала луча
    const origin = this.redRay.getAbsolutePosition();

    // Получаем направление луча в глобальных координатах
    const direction = this.redRay.getDirection(new Vector3(0, 0, 1)).normalize();

    // Длина луча
    const rayLength = 100;

    // Создаём Ray с заданной длиной
    const ray = new Ray(origin, direction, rayLength);

    // Используем scene.pickWithRay для обнаружения пересечений
    const pickInfo = this.scene.pickWithRay(ray, (mesh) =>
      mesh !== this.redRay && mesh !== this.centralCube && mesh !== this.intersectionPoint
    );

    if (pickInfo?.hit && pickInfo.pickedPoint) {
      // Устанавливаем позицию точки пересечения
      this.intersectionPoint.position = pickInfo.pickedPoint;
      this.intersectionPoint.isVisible = true;
    } else {
      // Скрываем точку, если пересечения нет
      this.intersectionPoint.isVisible = false;
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
