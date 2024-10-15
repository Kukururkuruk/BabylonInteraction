import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
  ActionManager,
  ExecuteCodeAction,
  AbstractMesh,
  Ray,
  StandardMaterial,
  Color3,
  MeshBuilder,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from 'cannon-es'; 
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'; 
import { GUIManager } from '../components/GUIManager'; 
import { TriggersManager } from './FunctionComponents/TriggerManager3'; 
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { AdvancedDynamicTexture, TextBlock, Button, Control } from "@babylonjs/gui";
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture";



// Определение класса InteractionObject
export class InteractionObject {
  private mesh: AbstractMesh; // Сохраняем ссылку на меш

  constructor(mesh: AbstractMesh) {
    this.mesh = mesh; // Инициализируем меш
  }

  getMesh(): AbstractMesh {
    return this.mesh; // Возвращаем меш
  }
}

export class FullExample {
  guiTexture: AdvancedDynamicTexture;
  scene: Scene;
  engine: Engine;
  guiManager: GUIManager;
  triggerManager: TriggersManager;
  textMessages: string[] = [];
  targetMeshes: AbstractMesh[] = [];
  handModel: AbstractMesh | null = null;
  rulerModel: AbstractMesh | null = null;
  selectedSize: number | null = null;
  interactionObject: AbstractMesh | null = null;
  firstPoint: Vector3 | null = null;
  secondPoint: Vector3 | null = null;
  measuringDistance: boolean = false;
  points: AbstractMesh[] = [];
  advancedTexture: AdvancedDynamicTexture | null = null;
  MainCamera: FreeCamera | null = null;  // Добавлено объявление MainCamera

  constructor(private canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.setupCamera();
    this.setupLighting();

    // Инициализация GUIManager и TriggersManager
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.guiManager = new GUIManager(this.scene, []);
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);

    // Создание окружения и скрытие индикатора загрузки
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });

    // Создание контроллера
    this.CreateController();

    // Запуск цикла рендеринга
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  start() {
    console.log("Метод start вызван.");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);
    console.log("Триггер.");
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
  
    // Включение физики
    const gravityVector = new Vector3(0, -9.81, 0);
    const physicsPlugin = new CannonJSPlugin(true, 5, CANNON); // Это должно работать
    scene.enablePhysics(gravityVector, physicsPlugin);
    
  
    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  
    const hdrTexture = new HDRCubeTexture("./models/cape_hill_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.collisionsEnabled = true;
    scene.createDefaultSkybox(hdrTexture, true, 1000);
    scene.environmentIntensity = 0.5;
  
    return scene;
  }
  private setupCamera(): void {
    this.MainCamera = new FreeCamera("MainCamera", new Vector3(13.7, 6.3, 5.0), this.scene);
    // Установка цели камеры чуть выше и правее
    const targetPosition = new Vector3(13.5 + 1, 6.3 + 1, 4.9); // Смещение по оси X и Y
    this.MainCamera.setTarget(targetPosition);
    this.MainCamera.setTarget(Vector3.Zero());
    this.MainCamera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
    this.scene.activeCamera = this.MainCamera; // Установка активной камеры
    // Включаем измерение расстояния, если нужно
    this.enableDistanceMeasurement();
  }

  private setupLighting(): void {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
  }

  async CreateEnvironment(): Promise<void> {
    const { meshes: mapMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
    this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("stairs"));

    mapMeshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("box"));

    this.targetMeshes.forEach(mesh => {
      mesh.checkCollisions = true;
      this.createRayAboveMesh(mesh);
      this.guiManager.createButtonAboveMesh(mesh);

      const interactionObject = new InteractionObject(mesh); // Создаем объект взаимодействия
      this.triggerManager.setupProximityTrigger(mesh, () => {
        console.log("Камера вошла в зону триггера лестницы:", mesh.name);
        this.scene.activeCamera = this.MainCamera; // Используйте MainCamera
      });

      this.triggerManager.enableClickInteraction(interactionObject.getMesh());
      this.triggerManager.setupClickTrigger(mesh, () => {
        console.log("Лестница была кликнута:", mesh.name);
      });
    });
    // Работа с мешами типа "broken"
  const brokenMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
  brokenMeshes.forEach((mesh) => {
      mesh.checkCollisions = true;
      mesh.isPickable = true;
      mesh.isVisible = true; // Делаем видимым
      mesh.setEnabled(true);
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              console.log("Broken меш кликнут:", mesh.name, "Координаты:", mesh.position);
              this.interactionObject = mesh;
              this.scene.activeCamera = this.MainCamera;
              this.showPointsAndQuestions(mesh); // Показать точки и вопросы
          })
      );



// Координаты точек
const pointsPositions = [
  new Vector3(12.46, 6.3, 4.79),   // Первая точка
  new Vector3(12.46, 6.3, 5.21),   // Вторая точка
  new Vector3(12.46, 6.11, 4.72),     // Третья точка
  new Vector3(12.46, 0.7, 4.72)     // Четвертая точка
  
];


// Создаем точки и применяем одинаковый материал
pointsPositions.forEach((position, index) => {
  // Задаем разные размеры для первой, второй и третьей точки
  const diameter = index === 3 ? 0.05 : 0.01; // Увеличиваем диаметр третьей точки

  const point = MeshBuilder.CreateSphere("point" + index, { diameter: diameter }, this.scene);
  
  // Устанавливаем фиксированное положение точки
  // Используем mesh.position и добавляем координаты для создания точек выше меша
  point.position = mesh.position.add(new Vector3(position.x, position.y , position.z)); 

  // Увеличиваем y для размещения точек выше меша
  //point.position.y += 1; // Поднимаем точки над мешом на 1 единицу

  // Отладочные сообщения
  console.log(`Точка создана на позиции: ${point.position.x}, ${point.position.y}, ${point.position.z}`);

  // Настраиваем материал для точки
  const pointMaterial = new StandardMaterial("pointMaterial" + index, this.scene);
  pointMaterial.emissiveColor = new Color3(0, 1, 0); // Зеленый цвет для лучшей видимости
  point.material = pointMaterial;


  // Убедитесь, что точки изначально скрыты
  this.points.forEach(point => {
  point.isVisible = false; // Принудительно скрываем все точки
  });

  // Делаем точку кликабельной
  point.isPickable = true;
  pointMaterial.wireframe = true; // Использование каркасного материала для проверки видимости
  point.actionManager = new ActionManager(this.scene);
  point.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          console.log("Точка кликнута:", point.name);
          // Здесь можно добавить дополнительную логику для точки
      })
  );
  // Сохраняем точку в массив
  this.points.push(point);

  
});







  });

  // Работа с мешами типа "whole"
  const wholeMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("whole"));
  wholeMeshes.forEach((mesh) => {
      mesh.checkCollisions = true;
      mesh.isPickable = true;
      mesh.visibility = 0; // Делаем невидимым
      mesh.setEnabled(true);
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              console.log("Whole меш кликнут:", mesh.name, "Координаты:", mesh.position);
              this.interactionObject = mesh;
              this.scene.activeCamera = this.MainCamera;
              this.showPointsAndQuestions(mesh); // Показать точки и вопросы
          })
      );
      
  });

    await this.CreateHandModel();
    await this.CreateRulerModel();
  }

  // Метод для отображения точек и интерфейса вопросов
  showPointsAndQuestions(mesh: AbstractMesh): void {
    // Делаем точки видимыми
    this.points.forEach(point => {
      point.isVisible = true; // Показываем все точки
    });

    // Создаем интерфейс вопросов
    this.createQuestionInterface();
  }
  createQuestionInterface(): void {
    // Проверяем, существует ли уже интерфейс, чтобы избежать повторного создания
    if (this.advancedTexture) {
        return; // Если интерфейс уже создан, выходим из функции
    }

    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Вопрос
    const questionText = new TextBlock();
    questionText.text = "Что вы хотите сделать?";
    questionText.color = "white";
    questionText.fontSize = 30;
    this.advancedTexture.addControl(questionText);

    // Кнопка 1
    const button1 = Button.CreateSimpleButton("button1", "Измерить размер повреждений линейкой");
    button1.width = "150px";
    button1.height = "60px";
    button1.top = "100px";
    button1.left = "-100px";
    button1.color = "white";
    button1.background = "blue";
    button1.onPointerUpObservable.add(() => {
        this.handleButtonClick("Дерево", this.MainCamera);
    });
    this.advancedTexture.addControl(button1);

    // Кнопка 2
    const button2 = Button.CreateSimpleButton("button2", "Измерить толщину штангенцирулем");
    button2.width = "150px";
    button2.height = "60px";
    button2.top = "100px";
    button2.left = "100px";
    button2.color = "white";
    button2.background = "blue";
    button2.onPointerUpObservable.add(() => {
        this.handleButtonClick("Металл", this.MainCamera);
    });
    this.advancedTexture.addControl(button2);
}

handleButtonClick(selectedAnswer: string, targetCamera: FreeCamera | null): void {
    const isCorrect = this.checkAnswer(selectedAnswer); // Проверяем ответ и сохраняем результат

    if (targetCamera) {
        this.scene.activeCamera = targetCamera;
        console.log(`Переключено на ${targetCamera.name || "камера не инициализирована"} при нажатии на кнопку`);
    } else {
        console.log("Целевая камера не инициализирована");
    }

    // Убираем панель только если ответ правильный
    if (isCorrect && this.advancedTexture) {
        this.advancedTexture.dispose();
        this.advancedTexture = null;
    }
}

checkAnswer(selectedAnswer: string): boolean {
    const correctAnswers = ["Металл", "Дерево"]; // Массив с правильными ответами

    if (correctAnswers.includes(selectedAnswer)) { // Проверка на наличие выбранного ответа в массиве
        console.log("Правильный ответ!"); // Можно добавить сообщение в зависимости от ответа
        return true; // Возвращаем true для правильного ответа
    } else {
        console.log("Неправильный ответ. Попробуйте снова."); // Сообщение для неправильного ответа
        return false; // Возвращаем false для неправильного ответа
    }
}


  async CreateHandModel(): Promise<void> {
    const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "calipers.stl", this.scene);
    this.handModel = meshes[0];
    this.handModel.position = new Vector3(2, -4.5, 2);
    this.handModel.scaling = new Vector3(5, 5, 5);
    this.attachHandToCamera();

    this.handModel.physicsImpostor = new PhysicsImpostor(this.handModel, PhysicsImpostor.MeshImpostor, {
      mass: 0,
      friction: 0,
      restitution: 0
    });
  }

  async CreateRulerModel(): Promise<void> {
    const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "calipers.stl", this.scene);
    this.rulerModel = meshes[0];
    this.rulerModel.position = new Vector3(2, -4.5, 2);
    this.rulerModel.scaling = new Vector3(5, 5, 5);
  }

  createRayAboveMesh(mesh: AbstractMesh): void {
    const ray = new Ray(mesh.position, Vector3.Up(), 100);
  }

  attachHandToCamera(): void {
    if (this.handModel) {
      this.handModel.parent = this.scene.activeCamera;
    }
  }

  CreateController(): void {
    const controller = MeshBuilder.CreateBox("controller", { size: 0.1 }, this.scene);
    controller.position = new Vector3(1, 1, 1);
    controller.physicsImpostor = new PhysicsImpostor(controller, PhysicsImpostor.BoxImpostor, {
      mass: 1,
      restitution: 0.9
    });


    
  }



  enableDistanceMeasurement(): void {
    this.measuringDistance = true;
    this.firstPoint = null;
    this.secondPoint = null;
    
    // Переключаемся обратно на основную камеру
    this.scene.activeCamera = this.MainCamera;

    // Обработчик кликов
    this.scene.onPointerDown = (evt, pickResult) => {
        // Получаем позицию указателя
        const pointerX = evt.clientX;
        const pointerY = evt.clientY;
        
        console.log(`Клик по координатам: (${pointerX}, ${pointerY})`);

        // Проверяем, был ли клик правой кнопкой мыши
        if (evt.button === 2) {
            console.log("Правый клик.");

            if (pickResult.hit && pickResult.pickedPoint) {
                if (!this.firstPoint) {
                    // Запоминаем первую точку
                    this.firstPoint = pickResult.pickedPoint.clone();
                    console.log("Первая точка:", this.firstPoint);
                } else if (!this.secondPoint) {
                    // Запоминаем вторую точку
                    this.secondPoint = pickResult.pickedPoint.clone();
                    console.log("Вторая точка:", this.secondPoint);

                    // Вычисляем расстояние
                    const distance = Vector3.Distance(this.firstPoint, this.secondPoint);
                    console.log("Расстояние между точками:", distance);

                    if (this.firstPoint && this.secondPoint) {
                        // Показываем расстояние через GUI
                        this.guiManager.showDistanceMessage(`Расстояние: ${distance.toFixed(2)} м`);

                        // Сброс для нового измерения
                        this.firstPoint = null;
                        this.secondPoint = null;

                        // Переключаемся обратно на основную камеру
                        this.scene.activeCamera = this.MainCamera;
                    }
                }
            }
        } else if (evt.button === 0) {
            console.log("Левый клик. Замеры не проводятся.");
        }
      }}}
