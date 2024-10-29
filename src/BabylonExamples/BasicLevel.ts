import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  FreeCamera,
  HDRCubeTexture,
  HighlightLayer,
  SceneLoader,
  Mesh,
  ActionManager,
  ExecuteCodeAction,
  Color3,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Image as GuiImage, Button, Control } from "@babylonjs/gui";
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
  isHighlighted: boolean = false; // Флаг для отслеживания состояния подсветки
  private inventoryVisible: boolean = false; // Флаг для отслеживания состояния инвентаря
  private inventoryImage: Control | null = null; // Используйте Control для GUI

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();
  

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    this.highlightLayer.innerGlow = false; // Включаем внутреннее свечение, если нужно
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);
    

    this.bubblePosition = new Vector3(0, 0.5, 0); // Инициализация позиции меша

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.fetchData(); // Вызовите fetchData после загрузки окружения
    });

    this.CreateController();

    // Добавляем обработчики событий для управления клавиатурой
    this.AddKeyboardControls();
    
    // Создаем UI с кнопками стрелок
    this.CreateArrowsUI();

    // Активируем управление правой кнопкой мыши
    this.EnableRightClickMovement();

    this.engine.runRenderLoop(() => {
      // Здесь можно вставить любые обновления состояния
      this.CheckCenterPosition(); // Проверяем позицию для подсветки
  
      // Рендерим сцену
      this.scene.render();
  });
  }
  // Добавьте fetchData как метод класса
  async fetchData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/data'); // Убедитесь, что адрес правильный
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data); // Добавьте лог для проверки полученных данных
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    }
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
      const response = await fetch('http://127.0.0.1:5000/api/data');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });
      console.log("Модели карты успешно загружены:", map);

      const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Bubble.glb", this.scene);
      meshes.forEach((mesh) => {
        mesh.isPickable = true;
        mesh.position = new Vector3(0, 0.7, 0);
        mesh.rotation.y = Math.PI;
        mesh.scaling = new Vector3(0.7, 0.7, 0.7);
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log("Часть меша Bubble.glb была кликнута!");
            this.CreateBubbleMesh(mesh);
          })
        );
      });
      console.log("Меш Bubble.glb загружен и обработан.");

      const { meshes: glassMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Glass.glb", this.scene);
      glassMeshes.forEach((mesh) => {
        const glassMesh = mesh as Mesh;
        this.glassMesh = glassMesh;
        glassMesh.isPickable = false;
        glassMesh.position = new Vector3(0, 0.7, 0);
        glassMesh.scaling = new Vector3(0.7, 0.7, 0.7);
      });

      console.log("Меш Glass.glb загружен и установлен.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  CreateBubbleMesh(mesh: AbstractMesh): void {
    if (this.isBubbleCreated) {
      console.log("Меш уже создан, пропускаем создание");
      return;
    }
    const bubbleMesh = mesh as Mesh;
    if (!bubbleMesh) {
      console.error("Ошибка: невозможно привести AbstractMesh к Mesh");
      return;
    }
    this.bubbleMesh = bubbleMesh;
    this.bubbleMesh.position = new Vector3(0, 0.7, 0);
    this.isBubbleCreated = true;
    console.log("Меш Bubble.glb создан в позиции:", this.bubbleMesh.position);
  }

  AddKeyboardControls(): void {
    window.addEventListener("keydown", (event) => {
      this.inputMap[event.key] = true;
    });
    window.addEventListener("keyup", (event) => {
      this.inputMap[event.key] = false;
    });
  }

  CreateArrowsUI(): void {
    const moveSpeed = 0.01;

    const createArrowButton = (text: string, position: [number, number], onClick: () => void) => {
        const button = Button.CreateSimpleButton(`button${text}`, text);
        button.width = "40px";
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        button.onPointerClickObservable.add(onClick);
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        button.left = `${position[0]}px`;
        button.top = `${position[1]}px`;
        this.guiTexture.addControl(button);
    };

    // Добавьте стрелки (уже есть)
    createArrowButton("↑", [0, 100], () => {  
        if (this.bubbleMesh) this.bubbleMesh.position.z -= moveSpeed; 
    });
    createArrowButton("↓", [0, 150], () => { 
        if (this.bubbleMesh) this.bubbleMesh.position.z += moveSpeed; 
    });
    createArrowButton("←", [-100, 125], () => { 
        if (this.bubbleMesh) this.bubbleMesh.position.x -= moveSpeed; 
    });
    createArrowButton("→", [100, 125], () => { 
        if (this.bubbleMesh) this.bubbleMesh.position.x += moveSpeed; 
    });

    // Добавьте обработчик события для клавиши "i"
    window.addEventListener("keydown", (event) => {
        if (event.key === "i") {
            this.ToggleInventory();
        }
    });
}

// Метод для переключения состояния инвентаря
private ToggleInventory(): void {
  if (this.inventoryVisible) {
      this.HideInventory();
  } else {
      this.ShowInventory();
  }
}

// Метод для отображения инвентаря
private ShowInventory(): void {
  if (!this.inventoryImage) {
      this.inventoryImage = new GuiImage("inventoryImage", "/models/frame1.png");
      this.inventoryImage.width = "300px"; // Задайте нужный размер
      this.inventoryImage.height = "400px"; // Задайте нужный размер
      this.inventoryImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      this.inventoryImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      this.guiTexture.addControl(this.inventoryImage);
  }
  this.inventoryImage.isVisible = true;
  this.inventoryVisible = true;
}

// Метод для скрытия инвентаря
private HideInventory(): void {
  if (this.inventoryImage) {
      this.inventoryImage.isVisible = false;
  }
  this.inventoryVisible = false;
}

  EnableRightClickMovement(): void {
    window.addEventListener("mousedown", (event) => {
        if (event.button === 2) {
            const moveSpeed = 0.01;
            if (this.bubbleMesh) {
                this.bubbleMesh.position.x += moveSpeed;
            }
        }
    });
  }

  // Проверка позиции и подсветка, если меш в центре
  CheckCenterPosition(): void {
    const centerPosition = new Vector3(0, 0.7, 0); // Определяем центр
    const threshold = 0.01; // Уменьшаем порог для более строгой проверки
  
    if (this.bubbleMesh) {
      // Проверяем, находится ли пузырь в пределах порога
      const distance = this.bubbleMesh.position.subtract(centerPosition).length();
      
      // Проверяем, находится ли меш в центре
      const isInCenter = distance < threshold;
  
      if (isInCenter && !this.isHighlighted) {
        this.highlightLayer.addMesh(this.bubbleMesh, Color3.Green());
        console.log("Пузырь в центре!"); // Логируем, когда пузырь в центре
        this.isHighlighted = true; // Устанавливаем флаг подсветки
      } else if (!isInCenter && this.isHighlighted) {
        this.highlightLayer.removeMesh(this.bubbleMesh);
        console.log("Пузырь не в центре!"); // Логируем, когда пузырь не в центре
        this.isHighlighted = false; // Сбрасываем флаг подсветки
      }
    }
  }
}
