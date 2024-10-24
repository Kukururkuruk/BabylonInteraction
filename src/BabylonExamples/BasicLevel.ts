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
  bubble: Mesh | null = null; // Изменение типа на Mesh | null
  bubblePosition: Vector3; // Позиция пузырька
  inputMap: { [key: string]: boolean } = {}; // Карта для отслеживания нажатий клавиш
  isBubbleCreated: boolean = false; // Флаг для проверки, создан ли пузырек

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);

    this.bubblePosition = new Vector3(0, 0.5, 0); // Инициализация позиции пузырька

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });

    this.CreateController();

    // Добавляем обработчики событий для управления клавиатурой
    this.AddKeyboardControls();

    this.engine.runRenderLoop(() => {
      this.UpdateBubble(); // Обновляем позицию пузырька
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
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });
      console.log("Модели успешно загружены:", map);

      // Создаем сферу в центре карты
      const sphere = MeshBuilder.CreateSphere("centerSphere", { diameter: 1 }, this.scene);
      const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
      sphereMaterial.diffuseColor = new Color3(1, 0, 0); // Красная сфера
      sphere.material = sphereMaterial;
      sphere.position = new Vector3(0, 1.1, 0); // Позиция в центре

      // Добавляем кликабельность только для сферы
      sphere.actionManager = new ActionManager(this.scene);
      sphere.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          this.CreateBubbleLevel(); // Создаем пузырек при клике на сферу
        })
      );
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  // Создаем пузырек уровня
  // Создаем пузырек уровня
CreateBubbleLevel(): void {
  if (this.isBubbleCreated) {
      console.log("Пузырек уже создан, пропускаем создание");
      return; // Если пузырек уже создан, выходим из функции
  }
  
  const bubbleMaterial = new StandardMaterial("bubbleMaterial", this.scene);
  bubbleMaterial.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет пузырька
  bubbleMaterial.alpha = 1; // Убедитесь, что материал не прозрачный
  
  this.bubble = MeshBuilder.CreateSphere("bubble", { diameter: 0.2 }, this.scene); // Увеличил размер пузырька
  this.bubble.material = bubbleMaterial;
  
  // Установите позицию Y немного выше сферы
  this.bubble.position = new Vector3(0, 0.4, 0); // Пузырек над сферой (сфера на высоте 1.5)
  this.bubble.setEnabled(true); // Убедитесь, что пузырек включен
  
  this.bubble.isVisible = true; // Убедитесь, что пузырек видим
  
  this.isBubbleCreated = true; // Флаг, что пузырек создан
  console.log("Пузырек создан в позиции:", this.bubble.position);
}

  // Добавляем обработчики для отслеживания нажатий клавиш
  // Обновленный метод AddKeyboardControls
AddKeyboardControls(): void {
  window.addEventListener("keydown", (event) => {
      this.inputMap[event.key] = true;
  });

  window.addEventListener("keyup", (event) => {
      this.inputMap[event.key] = false;
  });
}



// Обновленный метод UpdateBubble
UpdateBubble(): void {   
  if (this.bubble) {
      let moveSpeed = 0.01;
      let isMoving = false; // Флаг для отслеживания, движется ли пузырек

      // Перемещение пузырька по кнопкам
      if (this.inputMap["8"]) { // Вверх
          this.bubble.position.z -= moveSpeed;
          isMoving = true;
      }
      if (this.inputMap["2"]) { // Вниз
          this.bubble.position.z += moveSpeed;
          isMoving = true;
      }
      if (this.inputMap["4"]) { // Влево
          this.bubble.position.x -= moveSpeed;
          isMoving = true;
      }
      if (this.inputMap["6"]) { // Вправо
          this.bubble.position.x += moveSpeed;
          isMoving = true;
      }

      // Получаем центр сферы
      const sphereCenter = new Vector3(0, 1.1, 0); // Центр сферы (сфера на высоте 1.1)
      const sphereRadius = 0.5; // Радиус сферы
      const tolerance = 0.5; // Увеличенная погрешность для определения центра

      // Вычисляем расстояние от пузырька до центра сферы
      const distanceFromCenter = Vector3.Distance(this.bubble.position, sphereCenter);

      // Если пузырек движется, устанавливаем цвет на синий
      if (isMoving) {
          if (this.bubble.material instanceof StandardMaterial) {
              this.bubble.material.diffuseColor = new Color3(0, 0, 1); // Устанавливаем синий цвет
          }
      } else if (distanceFromCenter < tolerance) { 
          // Если пузырек вернулся в центр, устанавливаем цвет на зеленый
          if (this.bubble.material instanceof StandardMaterial) {
              this.bubble.material.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет
          }
      }

      // Если пузырек находится вне границ сферы, перемещаем его на поверхность
      if (distanceFromCenter > sphereRadius) {
          // Нормализуем вектор от центра до пузырька и устанавливаем пузырек на радиус сферы
          const directionToCenter = this.bubble.position.subtract(sphereCenter).normalize();
          this.bubble.position = sphereCenter.add(directionToCenter.scale(sphereRadius)); // Устанавливаем пузырек на поверхность сферы
      } else {
          // Если пузырек внутри сферы, вычисляем его положение на поверхности сферы
          const distanceToSurface = Math.sqrt(sphereRadius * sphereRadius - 
              Math.pow(this.bubble.position.x - sphereCenter.x, 2) - 
              Math.pow(this.bubble.position.z - sphereCenter.z, 2));
          this.bubble.position.y = sphereCenter.y + distanceToSurface; // Обновляем позицию Y пузырька
      }
  }
}


}
