import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  FreeCamera,
  HDRCubeTexture,
  HighlightLayer,
  SceneLoader,
  MeshBuilder,
  StandardMaterial,
  Color3,
  ActionManager,
  Mesh,
  ExecuteCodeAction,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { TriggersManager } from "./FunctionComponents/TriggerManager3";

export class Level {
  scene: Scene;
  engine: Engine;
  camera!: FreeCamera;
  triggerManager: TriggersManager;
  guiTexture: AdvancedDynamicTexture;
  highlightLayer: HighlightLayer;
  bubbleMesh: Mesh | null = null; // Меш для Bubble.glb
  bubblePosition: Vector3; // Позиция меша Bubble.glb
  inputMap: { [key: string]: boolean } = {}; // Карта для отслеживания нажатий клавиш
  isBubbleCreated: boolean = false; // Флаг для проверки, создан ли меш Bubble.glb
  glassMesh: Mesh | null = null; // Меш для Glass.glb

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);

    this.bubblePosition = new Vector3(0, 0.5, 0); // Инициализация позиции меша

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });

    this.CreateController();

    // Добавляем обработчики событий для управления клавиатурой
    this.AddKeyboardControls();

    this.engine.runRenderLoop(() => {
      this.UpdateBubbleMesh(); // Обновляем позицию меша
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
    this.camera = new FreeCamera("camera", new Vector3(0, 5, -10), this.scene);
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
      // Загрузка карты
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });
      console.log("Модели карты успешно загружены:", map);

      // Загрузка меша Bubble.glb
      const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Bubble.glb", this.scene);

      meshes.forEach((mesh) => {
        mesh.isPickable = true; // Делаем меш кликабельным
        mesh.position = new Vector3(0, 0.7, 0); // Задаем начальную позицию меша
        mesh.rotation.y = Math.PI; // Поворачиваем на 180 градусов
        mesh.scaling = new Vector3(1, 1, 1); // Масштаб
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log("Часть меша Bubble.glb была кликнута!");
            this.CreateBubbleMesh(mesh); // Передаем меш в функцию
          })
        );
      });

      console.log("Меш Bubble.glb загружен и обработан.");

      // Загрузка меша Glass.glb
      const { meshes: glassMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Glass.glb", this.scene);

      glassMeshes.forEach((mesh) => {
        // Приведение к типу Mesh для правильного использования
        const glassMesh = mesh as Mesh;
        this.glassMesh = glassMesh; // Сохраняем как glassMesh
        glassMesh.isPickable = false; // Делаем его некликабельным
        glassMesh.position = new Vector3(0, 0.7, 0); // Устанавливаем позицию ниже Bubble.glb
        glassMesh.scaling = new Vector3(1, 1, 1); // Задаем масштаб для модели стекла
      });

      console.log("Меш Glass.glb загружен и установлен.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  // Создаем меш Bubble.glb
  CreateBubbleMesh(mesh: AbstractMesh): void {
    if (this.isBubbleCreated) {
      console.log("Меш уже создан, пропускаем создание");
      return; // Если меш уже создан, выходим из функции
    }

    // Приведение AbstractMesh к Mesh
    const bubbleMesh = mesh as Mesh;
    if (!bubbleMesh) {
      console.error("Ошибка: невозможно привести AbstractMesh к Mesh");
      return;
    }

    this.bubbleMesh = bubbleMesh; // Сохраняем меш как тип Mesh
    this.bubbleMesh.position = new Vector3(0, 0.7, 0); // Устанавливаем начальную позицию меша
    this.isBubbleCreated = true; // Флаг, что меш создан
    console.log("Меш Bubble.glb создан в позиции:", this.bubbleMesh.position);
  }

  // Добавляем обработчики для отслеживания нажатий клавиш
  AddKeyboardControls(): void {
    window.addEventListener("keydown", (event) => {
      this.inputMap[event.key] = true;
    });

    window.addEventListener("keyup", (event) => {
      this.inputMap[event.key] = false;
    });
  }

  // Обновленный метод UpdateBubbleMesh
  UpdateBubbleMesh(): void {
    if (this.bubbleMesh && this.glassMesh) {
      let moveSpeed = 0.01;
      let isMoving = false; // Флаг для отслеживания, движется ли меш

      // Перемещение меша по кнопкам
      if (this.inputMap["8"]) { // Вверх
        this.bubbleMesh.position.z -= moveSpeed;
        isMoving = true;
      }
      if (this.inputMap["2"]) { // Вниз
        this.bubbleMesh.position.z += moveSpeed;
        isMoving = true;
      }
      if (this.inputMap["4"]) { // Влево
        this.bubbleMesh.position.x -= moveSpeed;
        isMoving = true;
      }
      if (this.inputMap["6"]) { // Вправо
        this.bubbleMesh.position.x += moveSpeed;
        isMoving = true;
      }

      // Получаем центр меша (Glass.glb)
      const sphereCenter = this.glassMesh.position; // Центр меша Glass.glb

      // Получаем радиус меша Glass.glb
      const glassRadius = this.glassMesh.scaling.x; // Предполагаем, что меш стекла симметричен

      // Ограничиваем перемещение по поверхности сферы
      const directionToCenter = this.bubbleMesh.position.subtract(sphereCenter).normalize();
      const distanceToCenter = Vector3.Distance(this.bubbleMesh.position, sphereCenter);

      // Проверка, выходит ли меш Bubble.glb за пределы меша Glass.glb
      if (distanceToCenter > glassRadius - 0.1) { // 0.1 - запас, чтобы не прижимать плотно
        // Если выходит, возвращаем Bubble.glb обратно на допустимую позицию
        this.bubbleMesh.position = sphereCenter.add(directionToCenter.scale(glassRadius - 0.1));
      }

      if (isMoving) {
        console.log("Bubble.glb двигается в позиции:", this.bubbleMesh.position);
      }
    }
  }
}
