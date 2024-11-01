import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  Mesh,
  HemisphericLight,
  FreeCamera,
  ActionManager,
  ExecuteCodeAction,
  AbstractMesh,
  Ray,
  HighlightLayer,
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
import { StackPanel, Rectangle, AdvancedDynamicTexture, TextBlock, Button, Control } from "@babylonjs/gui";
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture";

// Определение интерфейса для взаимодействующих объектов
export interface MeshItem {
  name: string;
  mesh: AbstractMesh;
}
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
  questionTexture: AdvancedDynamicTexture | null = null; // Для второго интерфейса
  highlightLayer: HighlightLayer;


  

  constructor(private canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.setupCamera();
    this.setupLighting();
     // Создаем HighlightLayer
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение, если нужно
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение, если нужно
    // Инициализация GUIManager и TriggersManager
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.guiManager = new GUIManager(this.scene, []);
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);
    
    this.CreateHandModel(); // Загружаем модель
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

  async CreateHandModel(): Promise<void> {
    console.log("Загрузка модели штангенциркуля начата...");
    try {
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "calipers.stl", this.scene);
        this.handModel = meshes[0];
        
        // Устанавливаем позицию и масштаб модели
        this.handModel.position = new Vector3(1, -1, 0.4);  // Центрируем по оси X и Y, поднимаем по Z
        this.handModel.rotation.x += Math.PI / 2; 
        this.handModel.rotation.y = Math.PI / 4;  // Вращение на 45 градусов по Y
        this.handModel.scaling = new Vector3(1.5, 1.5, 1.5);  // Уменьшаем размер модели

        // Привязываем модель к камере, чтобы она всегда была на экране
        this.handModel.parent = this.MainCamera; 

        // Устанавливаем физику
        this.handModel.physicsImpostor = new PhysicsImpostor(this.handModel, PhysicsImpostor.MeshImpostor, {
            mass: 0,
            friction: 0,
            restitution: 0
        });

        this.handModel.isVisible = false; // Модель изначально видна
        console.log("Модель штангенциркуля загружена и закреплена за камерой.");
    } catch (error) {
        console.error("Ошибка при загрузке модели штангенциркуля:", error);
    }
}




  async CreateEnvironment(): Promise<void> {
    const { meshes: mapMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
    this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("stairs"));
    this.engine.displayLoadingUI();
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
  new Vector3(12.46, 6.11, 4.72),  // Третья точка
  new Vector3(12.46, 0.7, 4.72)    // Четвертая точка
  
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
//
// Определите массив с именами мешей
const meshNames: string[] = [
  "SM_0_SpanStructureBeam_1_Armature_R",
  "SM_0_SpanStructureBeam_1_Cable_R",
  "SM_0_SpanStructureBeam_2_Armature_L",
  "SM_0_SpanStructureBeam_2_Cable_L",
  // Добавьте сюда другие имена мешей, если необходимо
];

// Пример мешей (добавьте ваши меши сюда)
const meshesToHighlight: Mesh[] = [
  this.scene.getMeshByName("SM_0_SpanStructureBeam_1_Armature_R"),
  this.scene.getMeshByName("SM_0_SpanStructureBeam_1_Cable_R"),
  this.scene.getMeshByName("SM_0_SpanStructureBeam_2_Armature_L"),
  this.scene.getMeshByName("SM_0_SpanStructureBeam_2_Cable_L"),
].filter(mesh => mesh !== null) as Mesh[]; // Убедитесь, что меши не null

// Добавляем меши в HighlightLayer
meshesToHighlight.forEach(mesh => {
  this.highlightLayer.addMesh(mesh, Color3.FromHexString("#88FF88")); // Ярко-зеленый цвет
  this.highlightLayer.innerGlow = false; // Включаем внутреннее свечение, если нужно
  this.highlightLayer.outerGlow = false; // Включаем внешнее свечение, если нужно
});


// Логируем все меши в сцене для проверки
function logAllMeshesInScene(scene: Scene) {
  const allMeshes = scene.meshes.map(mesh => mesh.name);
  console.log("Все меши в сцене:", allMeshes);
}

// Функция для получения мешей по именам
function getMeshesByNames(scene: Scene, names: string[]): Mesh[] {
  console.log("Ищем меши с именами:", names); // Логируем массив имен
  const foundMeshes = names.map(name => scene.getMeshByName(name)).filter(mesh => mesh !== null) as Mesh[];

  console.log("Найденные меши:", foundMeshes); // Логируем найденные меши
  return foundMeshes;
}

// Логируем все меши перед поиском
logAllMeshesInScene(this.scene);

// Использование функции для получения мешей из сцены
const meshes: Mesh[] = getMeshesByNames(this.scene, meshNames);

// Проверяем, были ли найдены меши
if (meshes.length === 0) {
  console.warn("Не найдено ни одного меша."); // Логируем предупреждение, если меши не найдены
} else {
  console.log("Загруженные меши:", meshes); // Логируем загруженные меши
}

// Работа с полученными мешами
meshes.forEach((mesh) => {
  console.log("Обрабатываем меш:", mesh.name); // Логируем имя меша
  console.log("Позиция меша:", mesh.position); // Логируем позицию меша
  console.log("Размеры меша:", mesh.getBoundingInfo().boundingBox.extendSize); // Логируем размеры меша

  mesh.checkCollisions = true; // Включаем коллизии
  mesh.isPickable = true; // Делаем меши выбираемыми
  mesh.isVisible = true; // Делаем видимыми
  mesh.setEnabled(true); // Включаем меши

  // Создаем менеджер действий для меша
  mesh.actionManager = new ActionManager(this.scene);
  mesh.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
      console.log("Меш кликнут:", mesh.name, "Координаты:", mesh.position); // Логируем информацию о клике
      this.interactionObject = mesh; // Устанавливаем выбранный меш для взаимодействия
      this.scene.activeCamera = this.MainCamera; // Устанавливаем активную камеру
      this.showPointsAndQuestions(mesh); // Показать точки и вопросы
    })
  );
});

// Скрываем загрузочный интерфейс
this.engine.hideLoadingUI();
  
  }
//
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
        this.handleButtonClick("Линейка", this.MainCamera);
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
        this.handleButtonClick("Штангенциркуль", this.MainCamera);
        this.points.forEach(point => {
          point.isVisible = false; // Скрываем точки
          this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение, если нужно
          this.highlightLayer.outerGlow = true; // Включаем внешнее свечение, если нужно
          
          if (this.handModel) {
            this.handModel.isVisible = true; // Делаем модель видимой при клике
            console.log("Модель штангенциркуля теперь видна.");
        } else {
            console.warn("Модель штангенциркуля не загружена.");
        }
      });
  
      // Вызов метода для обработки нажатия на кнопку
      this.handleButtonClick("Штангенциркуль", this.MainCamera);
        
    });
    this.advancedTexture.addControl(button2);
    
  }

  

  handleButtonClick(selectedAnswer: string, targetCamera: FreeCamera | null): void {
    console.log(`Обработчик нажатия кнопки: ${selectedAnswer}`);
    
    if (selectedAnswer === "Линейка" || selectedAnswer === "Штангенциркуль") {
        console.log(`${selectedAnswer} выбран, скрываем текущий интерфейс.`);

        if (this.advancedTexture) {
            this.advancedTexture.dispose(); 
            this.advancedTexture = null;
            console.log("Интерфейс скрыт.");
        }

        // В зависимости от выбранного инструмента создается новый интерфейс
        if (selectedAnswer === "Линейка") {
            this.createSecondQuestionInterface(); 
        } else {
            this.createCaliperQuestionInterface(); 
        }
    } else {
        console.log("Целевая камера не инициализирована");
    }
}

// Интерфейс для штангенциркуля
createCaliperQuestionInterface(newAnswers: string[] = []): void {
  console.log("Создаем интерфейс для штангенциркуля.");

  if (this.questionTexture) {
      return;
  }

  this.questionTexture = AdvancedDynamicTexture.CreateFullscreenUI("QuestionUI");

  const backgroundRect = new Rectangle();
  backgroundRect.width = "55%";
  backgroundRect.height = "32%";
  backgroundRect.cornerRadius = 16;
  backgroundRect.color = "white";
  backgroundRect.thickness = 2;
  backgroundRect.background = "rgba(0, 0, 0, 0)";
  backgroundRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  backgroundRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  backgroundRect.paddingBottom = "10px";
  this.questionTexture.addControl(backgroundRect);

  const questionText = new TextBlock();
  questionText.text = "Произведите замер выбраных элементов?";
  questionText.color = "white";
  questionText.fontSize = 22.4;
  questionText.height = "24px";
  questionText.top = "-64px";
  questionText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  questionText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  backgroundRect.addControl(questionText);

  // Установим правильный ответ в зависимости от переданных данных
  const correctAnswer = newAnswers.length > 0 ? "8 сантиметра" : "4 сантиметра";

  const createAnswerButton = (answerText: string) => {
      const button = Button.CreateSimpleButton("answer", answerText);
      button.width = "144px";
      button.height = "40px";
      button.color = "white";
      button.fontSize = 12;
      button.background = "#007acc";
      button.cornerRadius = 8;
      button.paddingTop = "8px";
      button.paddingBottom = "8px";
      button.paddingLeft = "12px";
      button.paddingRight = "12px";
      button.thickness = 0;
      button.hoverCursor = "pointer";
      
      button.onPointerEnterObservable.add(() => button.background = "#005f99");
      button.onPointerOutObservable.add(() => button.background = "#007acc");

      button.onPointerClickObservable.add(() => {
          console.log(`Вы выбрали: ${answerText}`);
          if (answerText === correctAnswer) {
              questionText.text = "Правильный ответ!";
              questionText.color = "lightgreen";

              // Скрыть интерфейс и создать новый через 3 секунды
              setTimeout(() => {
                  if (this.questionTexture) {
                      this.questionTexture.dispose();
                      this.questionTexture = null;
                      console.log("Интерфейс удален.");
                      
                      // Создать новый интерфейс с другими данными
                      this.createCaliperQuestionInterface(["6 сантиметра", "8 сантиметра", "10 сантиметров", "12 сантиметров"]);
                  }
              }, 3000);
          } else {
              questionText.text = "Неправильный ответ.";
              questionText.color = "red";
          }
      });

      return button;
  };

  const buttonStack = new StackPanel();
  buttonStack.isVertical = false;
  buttonStack.height = "64px";
  buttonStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  buttonStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  backgroundRect.addControl(buttonStack);

  const answers = newAnswers.length > 0 ? newAnswers : ["4 сантиметра", "8 сантиметра", "5 сантиметра", "3 сантиметра"]; // Если новые данные не переданы, используем старые
  answers.forEach(answer => {
      const button = createAnswerButton(answer);
      buttonStack.addControl(button);
  });

  console.log("Интерфейс для штангенциркуля успешно создан.");
}
    
createSecondQuestionInterface(): void {
  console.log("Создаем второй интерфейс вопросов.");

  // Проверяем, не был ли уже создан интерфейс
  if (this.questionTexture) {
      console.log("Интерфейс уже существует, выходим.");
      return;
  }

  // Создаем текстуру для интерфейса вопросов
  this.questionTexture = AdvancedDynamicTexture.CreateFullscreenUI("QuestionUI");

  // Добавляем фоновую панель для вопросов и ответов
  const backgroundRect = new Rectangle();
backgroundRect.width = "55%"; // Уменьшено на 20%
backgroundRect.height = "32%"; // Уменьшено на 20%
backgroundRect.cornerRadius = 16; // Уменьшено на 20%
backgroundRect.color = "white";
backgroundRect.thickness = 2;
backgroundRect.background = "rgba(0, 0, 0, 0)"; // Прозрачный фон
backgroundRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
backgroundRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM; // Разместим по низу экрана
backgroundRect.paddingBottom = "10px"; // Отступ от нижнего края
this.questionTexture.addControl(backgroundRect);

// Вопрос
const questionText = new TextBlock();
questionText.text = "Какова длина дефекта?";
questionText.color = "white";
questionText.fontSize = 22.4; // Уменьшено на 20%
questionText.height = "24px"; // Уменьшено на 20%
questionText.top = "-64px"; // Уменьшено на 20%
questionText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
questionText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
backgroundRect.addControl(questionText);

const correctAnswer = "42 сантиметра";

// Функция для создания кнопки ответа
const createAnswerButton = (answerText: string) => {
    const button = Button.CreateSimpleButton("answer", answerText);
    button.width = "144px"; // Уменьшено на 20%
    button.height = "40px"; // Уменьшено на 20%
    button.color = "white";
    button.fontSize = 12; // Уменьшено на 20%
    button.background = "#007acc";
    button.cornerRadius = 8; // Уменьшено на 20%
    button.paddingTop = "8px"; // Уменьшено на 20%
    button.paddingBottom = "8px"; // Уменьшено на 20%
    button.paddingLeft = "12px"; // Уменьшено на 20%
    button.paddingRight = "12px"; // Уменьшено на 20%
    button.thickness = 0;
    button.hoverCursor = "pointer";
    
    button.onPointerEnterObservable.add(() => button.background = "#005f99");
    button.onPointerOutObservable.add(() => button.background = "#007acc");

    button.onPointerClickObservable.add(() => {
        console.log(`Вы выбрали: ${answerText}`);
        if (answerText === correctAnswer) {
            questionText.text = "Правильный ответ!";
            questionText.color = "lightgreen";
        } else {
            questionText.text = "Неправильный ответ.";
            questionText.color = "red";
        }

        // Убираем интерфейс после отображения ответа
        setTimeout(() => {
            if (this.questionTexture) {
                this.questionTexture.dispose();
                this.questionTexture = null;
                console.log("Интерфейс вопросов удален.");
            }
        }, 3000);
    });

    return button;
};

// Горизонтальный стек для размещения кнопок
const buttonStack = new StackPanel();
buttonStack.isVertical = false;
buttonStack.height = "64px"; // Уменьшено на 20%
buttonStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
buttonStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
backgroundRect.addControl(buttonStack);

// Добавляем кнопки с вариантами ответов
const answers = ["52 сантиметра", "50 сантиметров", "48 сантиметров", "42 сантиметра"];
answers.forEach(answer => {
    const button = createAnswerButton(answer);
    buttonStack.addControl(button);
});

console.log("Вопрос с вариантами успешно отображен.");
}

checkAnswer(selectedAnswer: string): boolean {
    const correctAnswers = ["Штангенциркуль", "Линейка"]; // Массив с правильными ответами

    if (correctAnswers.includes(selectedAnswer)) { // Проверка на наличие выбранного ответа в массиве
        console.log("Правильный ответ!"); // Можно добавить сообщение в зависимости от ответа
        return true; // Возвращаем true для правильного ответа
    } else {
        console.log("Неправильный ответ. Попробуйте снова."); // Сообщение для неправильного ответа
        return false; // Возвращаем false для неправильного ответа
    }
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
    // Переключаемся обратно на основную камеру
    this.scene.activeCamera = this.MainCamera;
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
      }}
    
    
    }
