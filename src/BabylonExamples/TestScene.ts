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
import "@babylonjs/inspector";
import Stats from 'stats.js';

export class TestScene {
  stats: Stats;
  scene: Scene;
  engine: Engine;
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  modelPath: string = "SM_0_Landscape_2_4096X4096.gltf"; // Дефолтная модель
  loader: HTMLElement | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    this.stats = new Stats();
    this.stats.showPanel(0); // 0 = CPU, 1 = FPS
    document.body.appendChild(this.stats.dom);

    this.scene.debugLayer.show({
      embedMode: true, // Позволяет отображать инспектор прямо в странице
    });

    this.CreateEnvironment();
    this.CreateController();
    this.AddScreenshotButton(); // Добавляем кнопку для скриншота

    this.engine.runRenderLoop(() => {
      this.stats.begin(); // Начало замера производительности
      this.scene.render();
      this.stats.end(); // Конец замера производительности
    });

    this.setupRecordingControls();
    this.setupModelSelector(); // Добавляем селектор для выбора модели
    this.setupLoader(); // Добавляем лоадер
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    
    // Свет для освещения сцены
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);


    const envTex = CubeTexture.CreateFromPrefilteredData(
          "../models/sky.env",
          scene
        );
    
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true);
    scene.environmentIntensity = 0.5;
    scene.collisionsEnabled = true;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    // Показываем лоадер перед загрузкой модели
    if (this.loader) this.loader.style.display = "block";

    // Очищаем сцену перед загрузкой новой модели
    this.scene.meshes.forEach((mesh) => mesh.dispose());

    // Загружаем модель в формате glTF
    try {
      const { meshes } = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        this.modelPath,  // Используем выбранную модель
        this.scene
      );

      // Включаем коллизии для всех загруженных мешей
      meshes.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      console.log("Модель успешно загружена:", meshes);
    } catch (error) {
      console.error("Ошибка при загрузке модели:", error);
    } finally {
      // Скрываем лоадер после загрузки модели
      if (this.loader) this.loader.style.display = "none";
    }
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 10, 0), this.scene);
    camera.attachControl(this.canvas, false);

    camera.applyGravity = false;
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

  // Функция добавления кнопки для скриншота
  AddScreenshotButton(): void {
    if (!document.getElementById("screenshotButton")) {
        const screenshotButton = document.createElement("button");
        screenshotButton.id = "screenshotButton"; 
        screenshotButton.innerText = "Сделать скриншот";
        document.body.appendChild(screenshotButton);

        screenshotButton.addEventListener("click", () => {
            Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, { width: 1920, height: 1080 });
        });

        screenshotButton.style.position = "absolute";
        screenshotButton.style.top = "10px";
        screenshotButton.style.left = "240px"; // Выравнивание по горизонтали
    }
  }

  setupRecordingControls(): void {
    const startButton = document.createElement("button");
    startButton.textContent = "Start Recording";
    startButton.style.position = "absolute";
    startButton.style.top = "10px";
    startButton.style.left = "10px";

    const stopButton = document.createElement("button");
    stopButton.textContent = "Stop Recording";
    stopButton.style.position = "absolute";
    stopButton.style.top = "10px";
    stopButton.style.left = "120px";

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
    console.log("Recording started");
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      console.log("Recording stopped");
    }
  }

  // Создаем селектор для выбора модели
  setupModelSelector(): void {
    const modelSelector = document.createElement("select");
    modelSelector.style.position = "absolute";
    modelSelector.style.top = "10px";
    modelSelector.style.left = "360px"; // Выравниваем с остальными кнопками

    const models = [
      "SM_0_Landscape_1_512X512.gltf",
      "SM_0_Landscape_1_4096X4096.gltf",
      "SM_0_Landscape_2_512X512.gltf",
      "SM_0_Landscape_2_4096X4096.gltf"
    ];

    models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelSelector.appendChild(option);
    });

    modelSelector.onchange = (event) => {
      this.modelPath = (event.target as HTMLSelectElement).value;
      this.CreateEnvironment(); // Перезагружаем сцену с новой моделью
    };

    document.body.appendChild(modelSelector);
  }


  // Функция для создания лоадера
  setupLoader(): void {
    this.loader = document.createElement("div");
    this.loader.innerText = "Загрузка...";
    this.loader.style.position = "absolute";
    this.loader.style.top = "50%";
    this.loader.style.left = "50%";
    this.loader.style.transform = "translate(-50%, -50%)";
    this.loader.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.loader.style.color = "white";
    this.loader.style.padding = "20px";
    this.loader.style.borderRadius = "10px";
    this.loader.style.display = "none"; // Изначально скрываем

    document.body.appendChild(this.loader);
  }

}
