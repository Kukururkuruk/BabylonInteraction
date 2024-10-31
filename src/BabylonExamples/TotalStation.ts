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
  MeshBuilder,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Image as GuiImage, Button, Control, TextBlock } from "@babylonjs/gui";
import { TriggersManager } from "./FunctionComponents/TriggerManager3";

export class TotalStation {
  scene: Scene;
  engine: Engine;
  camera!: FreeCamera;
  triggerManager: TriggersManager;
  guiTexture: AdvancedDynamicTexture;
  highlightLayer: HighlightLayer;
  inputMap: { [key: string]: boolean } = {}; // Карта для отслеживания нажатий клавиш
  private inventoryVisible: boolean = false; // Флаг для отслеживания состояния инвентаря
  private inventoryImage: Control | null = null; // Используйте Control для GUI
  private pointsCountText: TextBlock | null = null; // Текст для отображения количества нажатых точек
  // Хранение точек
  private points: AbstractMesh[] = [];
  // Счетчик нажатых точек
  private pointsPressedCount: number = 0;
  

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.fetchData(); // Вызовите fetchData после загрузки окружения
      this.createPoints(); // Создаем точки
    });

    this.CreateController();

    // Добавляем обработчики событий для управления клавиатурой
    this.AddKeyboardControls();

    // Создаем UI с кнопками стрелок
    this.CreateArrowsUI();

    this.engine.runRenderLoop(() => {
      // Рендерим сцену
      this.scene.render();
    });
  }

  // Метод для получения данных
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
    this.camera = new FreeCamera("camera", new Vector3(45.9713, 3, -6.95292), this.scene);
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
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });
      console.log("Модели карты успешно загружены:", map);
    } catch (error) {
      console.error("Ошибка при загрузке окружения:", error);
    }
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

    // Добавляем обработчик события для клавиши "i"
    window.addEventListener("keydown", (event) => {
      if (event.key === "i" || event.key === "ш") {
        console.log("Клавиша 'i' или 'ш' нажата!"); // Лог для проверки
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
    this.updatePointsCountDisplay(); // Обновляем отображение счетчика
  }

  // Метод для отображения инвентаря
 // Метод для отображения инвентаря
 private ShowInventory(): void {
  if (!this.inventoryImage) {
    this.inventoryImage = new GuiImage("inventoryImage", "/models/frame1.png");
    this.inventoryImage.width = "300px"; // Задайте нужный размер
    this.inventoryImage.height = "400px"; // Задайте нужный размер
    // Изменяем выравнивание для верхнего правого угла
    // Выравнивание для верхнего правого угла
    this.inventoryImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.inventoryImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.inventoryImage.top = "10px"; // Отступ сверху
    this.inventoryImage.left = "0px"; // Максимально правое положение
    this.guiTexture.addControl(this.inventoryImage);
}
  this.inventoryImage.isVisible = true;
  this.inventoryVisible = true;
  this.updatePointsCountDisplay(); // Обновляем отображение количества нажатых точек
}
  

  // Метод для скрытия инвентаря
  private HideInventory(): void {
    if (this.inventoryImage) {
      this.inventoryImage.isVisible = false;
    }
    this.inventoryVisible = false;
    this.HidePointsCount(); // Скрываем текст с количеством нажатых точек
  }

  // Скрываем текст с количеством нажатых точек
  private HidePointsCount(): void {
    if (this.pointsCountText) {
      this.pointsCountText.isVisible = false;
    }
  }

  // Создаем точки на карте
  private createPoints() {
    const pointsPositions = [
      new Vector3(12.8824, 6.04612, 7.3295), // Используйте центр сцены для отладки
      new Vector3(12.4246 , 8.88759 , -7.65193  ),
      new Vector3(-0.54295, 6.38412 , -10.1049),

      new Vector3(-2.43646 , 6.04612, 6.35334  ), // Используйте центр сцены для отладки
      new Vector3(-4.33195 , 6.1931 , 6.27981  ),
      new Vector3(1.08095, 6.38412, 6.13351 ),

      new Vector3(12.4621 , 6.11568 , -1.98692), // Используйте центр сцены для отладки
      new Vector3(12.8824  , 7.3295  , -14.1588),
      new Vector3(12.9036 , 5.12722  , 12.9169 ),
      
    ];

    pointsPositions.forEach(pos => {
      const point = MeshBuilder.CreateSphere("point", { diameter: 0.3 }, this.scene); // Увеличиваем диаметр
      point.position = pos;
      point.isVisible = true; // Убедитесь, что точки видимы
      point.isPickable = true;

      // Добавляем действие при клике на точку
      point.actionManager = new ActionManager(this.scene);
      // Регистрация действия
      point.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        // Если точка подсвечена, убираем подсветку
        if (this.highlightLayer.hasMesh(point)) {
          this.highlightLayer.removeMesh(point);
          this.pointsPressedCount--; // Уменьшаем счетчик при снятии подсветки
        } else {
          // Если точка не подсвечена, добавляем подсветку
          this.highlightLayer.addMesh(point, Color3.Yellow());
          this.pointsPressedCount++; // Увеличиваем счетчик при добавлении подсветки
        }
        this.updatePointsCountDisplay(); // Обновляем отображение счетчика
      }));

      this.points.push(point);
      console.log(`Точка создана на позиции: ${pos}`); // Лог для отладки
      
    });
  }

  private updatePointsCountDisplay(): void { 
    // Проверяем, виден ли инвентарь, прежде чем обновлять отображение нажатых точек
    if (this.inventoryVisible) {
      // Создаем текст для отображения количества нажатых точек
      const pointsText = `Нажатые точки: ${this.pointsPressedCount}`;
      
      if (!this.pointsCountText) {
        this.pointsCountText = new TextBlock("pointsCount", pointsText);
        this.pointsCountText.color = "white";
        this.pointsCountText.fontSize = 20;
  
        // Устанавливаем выравнивание
        this.pointsCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Выравнивание по левому краю
        this.pointsCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Положение текста в верхней части
        
        // Установите значения top и left в пределах планшета
        this.pointsCountText.top = "0px"; // Отступ от верхней границы инвентаря
        this.pointsCountText.left = "390px"; // Отступ от левой границы инвентаря
  
        // Добавляем текст на графический интерфейс
        this.guiTexture.addControl(this.pointsCountText);
      } else {
        this.pointsCountText.text = pointsText; // Обновляем текст
      }
      
      this.pointsCountText.isVisible = true; // Убедитесь, что текст виден
    }
  }
  
  
  
  

  AddKeyboardControls(): void {
    window.addEventListener("keydown", (event) => {
      this.inputMap[event.key] = true;
    });
    window.addEventListener("keyup", (event) => {
      this.inputMap[event.key] = false;
    });
  }
}
