App - это роутер
MainPage - навигация по кнопкам
BabylonTutor и BabylonExample просто площадка для канваса, тут еще можно будет дивов понапизать
BabylonTest тоже самое но для тест канваса где я запускал для просмотра модельки Олега
Собственно дальше у нас сцены, они BabylonExamples находятся
Посмотри какая куда подключается, одна помоему безхозная, это BasicScene
В FullExample проверял функции на точное расположение и все понемногу
В BasicScene2 почти теже функции только есть модалочка еще на ведре, там потыкай дееревья еще, есть инвентарь, тыкни на дерево с двумя кнопками
Основной функционал в функциональных компонентах папке и теже функции но в куче только в BasicScene2

В ветке GUI находится функция загрузки GUI из ЭДИТОРА

Объяснение функций BabylonScene2


```typescripte
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
  PointerDragBehavior,
  PointerEventTypes,
  Axis,
  Space,
  MeshBuilder,
  Mesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, StackPanel, Rectangle } from "@babylonjs/gui";
import * as GUI from '@babylonjs/gui/2D';
///Импорт из движка, можно все как 2d GUI а можно частями как два выше

export class BasicScene2 {
  scene: Scene;
  engine: Engine;
  ramp: AbstractMesh;
  tree: AbstractMesh;
  tree2: AbstractMesh;
  bucket: AbstractMesh;
  inventoryPanel: StackPanel;
  private openModal: () => void;
//Типизация

  constructor(private canvas: HTMLCanvasElement, openModal: () => void) {
    this.engine = new Engine(this.canvas, true); // Инициализируем движок с привязкой к канвасу
    
    this.engine.displayLoadingUI(); // Показываем загрузочный экран

    this.scene = this.CreateScene(); // Создаем сцену
    this.openModal = openModal; // Сохраняем функцию открытия модального окна

    this.CreateEnvironment(); // Создаем окружение
    this.CreateController(); // Создаем контроллер камеры
    

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    // Запускаем цикл рендеринга
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine); // Создаем новую сцену
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene); //Создаем свет

    const framesPerSecond = 60; //Устанавливаем FPS для цены
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0); //Инициализируем гравитацию
    scene.collisionsEnabled = true; //Включаем столкновения

    return scene;
  }

  async CreateEnvironment(): Promise<void> { //Асинхронно загружаем модель
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "campfire.glb",
      this.scene
    ); //Собственно этой функцией

    this.ramp = meshes[24];
    this.tree = meshes[25];
    this.tree2 = meshes[30];
    this.bucket = meshes[2];
    // console.log(meshes);
    //Инициализируем отдельно меши
    

    meshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });
    //Выдаем коллизии всем

    this.setupRampInteraction();
    this.setupCubInteraction();
    this.createButtonAboveMesh();
    this.setupModalInteraction();
    this.setupRampTrigger();
     this.createInventoryPanel();
     this.createCollectibleMesh();
    //запускаем все функциональные компоненты
    

    this.engine.hideLoadingUI(); //Загрываем загрузчик
  }

  

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 5, 0), this.scene); //Создаем камеру и задаем ее положение в пространстве с помощью вектора
    camera.attachControl(this.canvas, false); // Привязываем управление к канвасу

    camera.applyGravity = true; //Применяем гравитацию
    camera.checkCollisions = true; //Проверяем коллизию
    camera.ellipsoid = new Vector3(1, 2, 1); //Создаем элипсоид для коллизии, чтобы у камеры появилось физическое тело
    camera.minZ = 0.45; // Минимальное расстояние от камеры до объектов
    camera.speed = 0.75; // Устанавливаем скорость движения
    camera.angularSensibility = 4000; // Чувствительность поворота
    camera.keysUp.push(87); // W
    camera.keysLeft.push(65); // A
    camera.keysDown.push(83); // S
    camera.keysRight.push(68); // D


  }

  // Создаем панель инвентаря
  createInventoryPanel(): void {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    //Создаем GUI компонент

    // Создаем панель
    this.inventoryPanel = new StackPanel();
    this.inventoryPanel.isVertical = false;
    this.inventoryPanel.height = "100px";
    this.inventoryPanel.width = "400px";
    this.inventoryPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.inventoryPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(this.inventoryPanel); /Привязываем панель к GUI компоненту

    // Добавляем слоты для инвентаря
    for (let i = 0; i < 4; i++) {
      const slot = new Rectangle();
      slot.width = "80px";
      slot.height = "80px";
      slot.thickness = 2;
      slot.color = "white";
      slot.background = "grey";
      slot.name = "empty";
      this.inventoryPanel.addControl(slot);
    }
  }

  // Создаем коллекционный меш
  createCollectibleMesh(): void {
    const mesh = this.tree2; // Используем ваше дерево (tree2) как коллекционный объект

    if (mesh) {
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          mesh.isVisible = false;

          // Обновляем инвентарь
          const emptySlot = this.inventoryPanel.children.find(
            (slot) => slot.name === "empty"
          ) as Rectangle;

          if (emptySlot) {
            emptySlot.background = "red"; // Обозначение заполненной ячейки
            emptySlot.name = "occupied";
          }
        })
      );
    }
  }

  //Создаем экшн для меша, перемещение по нажатии
  setupRampInteraction(): void {
    if (!this.ramp) return;

    this.ramp.actionManager = new ActionManager(this.scene);

    this.ramp.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer"; //Меняет курсор при наведении
      })
    );

    this.ramp.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = "default"; //Возвращает дефолтный когда убираешь курсор
      })
    );

    const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) }); // Создаем поведение для перетаскивания
    dragBehavior.useObjectOrientationForDragging = false; // Не использовать ориентацию объекта для перетаскивания
    this.ramp.addBehavior(dragBehavior); // Добавляем поведение к рампе
  }

  // Создание экшена для вращаения вокруг своей оси
  setupCubInteraction(): void {
    if (!this.tree) return;

    this.tree.actionManager = new ActionManager(this.scene);

    // Изменение курсора на pointer при наведении на рампу
    this.tree.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer"; //Опять изменение курсора
      })
    );

    // Возврат к стандартному курсору при уходе с рампы
    this.tree.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = "default";
      })
    );

    let isRotating = false; // Флаг вращения
    let lastX = 0; // Последняя позиция по оси X

    // Добавляем события для нажатия мыши на рампу
    this.scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) { //Проходим по логикам при нажатии, при отжатии и при перемещении
            case PointerEventTypes.POINTERDOWN:
                // Проверяем, нажата ли рампа
                if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === this.tree) {
                    isRotating = true;
                    lastX = pointerInfo.event.clientX; // Сохраняем текущую позицию X
                    this.canvas.style.cursor = "grabbing";
                }
                break;
            case PointerEventTypes.POINTERUP:
                isRotating = false;
                this.canvas.style.cursor = "pointer";
                break;
            case PointerEventTypes.POINTERMOVE:
                if (isRotating) {
                    const deltaX = pointerInfo.event.clientX - lastX; // Изменение позиции по X
                    const rotationSpeed = 0.01; // Скорость вращения
                    this.tree.rotate(Axis.Y, deltaX * rotationSpeed, Space.LOCAL); // Вращаем рампу вокруг оси Y
                    lastX = pointerInfo.event.clientX; // Обновляем последнюю позицию X
                }
                break;
        }
    });
}

  //Создаем кнопки и привязываем к мэшу
createButtonAboveMesh(): void {
    // Создание текстуры для полноэкранного интерфейса GUI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Создание кнопки
    const button = Button.CreateSimpleButton('myBtn', 'Click Me!');
    button.width = '200px';
    button.height = '40px';
    button.color = 'white';
    button.background = 'deepskyblue';
    advancedTexture.addControl(button);  // Добавление кнопки в интерфейс

    // Создание панели
    const panel = new GUI.StackPanel();
    panel.addControl(button);  // Добавление кнопки в панель
    panel.isVertical = false;  // Панель будет горизонтальной
    advancedTexture.addControl(panel);  // Добавление панели в интерфейс
    panel.linkWithMesh(this.tree2);  // Привязка панели к мэшу
//Дальше идет создание кнопки уже в пространстве
    // Создание 3D плоскости
    const plane = MeshBuilder.CreatePlane('plane', {
      width: 5,  // Ширина плоскости
      height: 1,  // Высота плоскости
    });

    // Создание текстуры для GUI, привязанной к плоскости
    const advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(plane, 512, 64);

    // Создание второй кнопки с аналогичными параметрами
    const button2 = Button.CreateSimpleButton('myBtn', 'Click Me!');
    button2.width = '200px';
    button2.height = '40px';
    button2.color = 'white';
    button2.background = 'deepskyblue'; 
    advancedTexture2.addControl(button2);  // Добавление кнопки на текстуру плоскости

    // Привязка плоскости к мэшу в качестве родителя
    plane.parent = this.tree2;

    // Включение billboard-режима, чтобы плоскость всегда была обращена к камере
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    // Позиционирование плоскости относительно мэша
    plane.position = new Vector3(
      this.tree2.position.x - 1, 
      this.tree2.position.y - 5, 
      this.tree2.position.z
    );
}

  //Логика модального окна
  setupModalInteraction(): void {
    if (!this.bucket) return;
  
    this.bucket.actionManager = new ActionManager(this.scene);
  
    this.bucket.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = 'pointer'; //Опять же курсор
      })
    );
  
    this.bucket.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = 'default';
      })
    );
  
    this.bucket.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => { //И при клике открывается модалка
        console.log('Bucket clicked!'); // Добавьте это для отладки
        this.openModal(); // Открываем модальное окно
      })
    );
  }

  // Создание триггер зоны
  setupRampTrigger(): void {
    if (!this.ramp) return;

    const interactionZone = MeshBuilder.CreateBox("interactionZone", { size: 2 }, this.scene); //Создаем триггер зону
    interactionZone.isVisible = false; // Зона невидима
    interactionZone.parent = this.ramp // Размещаем зону рядом с рампой
    interactionZone.position = new Vector3 (this.ramp.position.x, this.ramp.position.y + 3, this.ramp.position.z) //Указываем позицию триггер зоны
    interactionZone.checkCollisions = false; // Отключаем ей колизию

    // Создаем невидимый бокс для камеры для взаимодействия с триггер зоной
    const cameraCollider = MeshBuilder.CreateBox("cameraCollider", { size: 1 }, this.scene);
    cameraCollider.isVisible = false; // Невидимый бокс
    cameraCollider.parent = this.scene.activeCamera; // Связываем с камерой

    // Устанавливаем ActionManager на этот бокс
    cameraCollider.actionManager = new ActionManager(this.scene);

    // Добавляем действие на пересечение с рампой
    cameraCollider.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: { mesh: interactionZone }, // Рампа, с которой пересекается камера
        },
        () => { //Добавляем логику при взаимодействии с триггер зоной, в данном случае появляется алерт
          console.log("Camera intersected with the ramp!");
          alert("Camera reached the ramp!"); // Можно заменить на нужное действие
        }
      )
    );
  }
  
}



--------------------Экземпляр FullExample-----------------------------
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
  secondaryCamera: FreeCamera | null = null; // Инициализируем с null
  thirdCamera: FreeCamera | null = null;
  textMessages: string[] = [];
  targetMeshes: AbstractMesh[] = [];
  handModel: AbstractMesh | null = null; 
  rulerModel: AbstractMesh | null = null;  
  selectedSize: number | null = null;
  interactionObject: AbstractMesh | null = null; // Объявите interactionObject с типом
  firstPoint: Vector3 | null = null;
  secondPoint: Vector3 | null = null;
  measuringDistance: boolean = false; // Флаг, указывающий, что мы находимся в процессе измерения
  points: AbstractMesh[] = []; // Массив для хранения точек
  advancedTexture: AdvancedDynamicTexture | null = null;
  
  
  

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

  
// Добавляем метод start
  start() {
    console.log("Метод start вызван.");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);
    console.log("Триггер.");
  }

  CreateScene(): Scene {
      const scene = new Scene(this.engine);
      new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

      

      // Настройка физической среды
      const framesPerSecond = 60;
      const gravity = -9.81;
      scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
      scene.collisionsEnabled = true;
      const hdrTexture = new HDRCubeTexture("./models/cape_hill_4k.hdr", scene, 512);
      scene.environmentTexture = hdrTexture;
      scene.createDefaultSkybox(hdrTexture, true, 1000);  // Последний параметр - размер skybox
      scene.environmentIntensity = 0.5;

      // Инициализируем камеры
      this.secondaryCamera = new FreeCamera("secondaryCamera", new Vector3(0, 5, -10), scene);
      this.thirdCamera = new FreeCamera("thirdCamera", new Vector3(0, 5, 10), scene);
      
      

      return scene;
  }

  create(): void {
    this.createSceneObjects();
}

private setupCamera(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 5, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
}

private setupLighting(): void {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
}

private createSceneObjects(): void {
    const box = MeshBuilder.CreateBox("box", { size: 1 }, this.scene);
    box.position.y = 0.5; // Устанавливаем положение объекта

}
  
  async CreateEnvironment(): Promise<void> {
      // Загрузка основной карты
      const { meshes: mapMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      // Фильтрация мешей по названию "stairs"
  this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("stairs"));
  
      mapMeshes.forEach((mesh) => {
          mesh.checkCollisions = true;
      });
  
      this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("box"));
  
      this.targetMeshes.forEach(mesh => {
          mesh.checkCollisions = true;
          this.createRayAboveMesh(mesh);
          this.guiManager.createButtonAboveMesh(mesh);
  
          // Создание объекта взаимодействия
          const interactionObject = new InteractionObject(mesh); // Создаем объект взаимодействия
          this.triggerManager.setupProximityTrigger(mesh, () => {
              console.log("Камера вошла в зону триггера лестницы:", mesh.name);
              this.switchToSecondaryCamera(interactionObject); // Передаем interactionObject для переключения камеры
              this.switchToThirdCamera(interactionObject); // Передаем interactionObject для переключения камеры
          });
  
          // Включение клика на объекте
          this.triggerManager.enableClickInteraction(interactionObject.getMesh());
  
          // Настройка подсветки
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
              this.switchToSecondaryCamera(new InteractionObject(mesh));
              this.switchToThirdCamera(new InteractionObject(mesh)); // Передаем interactionObject для переключения камеры
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
              this.switchToSecondaryCamera(new InteractionObject(mesh));
              this.switchToThirdCamera(new InteractionObject(mesh)); // Передаем interactionObject для переключения камеры
              
          })
      );
      
  });



      this.guiManager.createGui();
      await this.CreateHandModel(); 
      await this.CreateRulerModel(); 
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
          this.handleButtonClick("Дерево", this.secondaryCamera);
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
          this.handleButtonClick("Металл", this.thirdCamera);

      });
      this.advancedTexture.addControl(button2);
  }
  
  handleButtonClick(selectedAnswer: string, targetCamera: FreeCamera | null): void {
      this.checkAnswer(selectedAnswer);
  
      // Переключаем активную камеру
      // Переключаем активную камеру, если она не null
      if (targetCamera) {
          this.scene.activeCamera = targetCamera;
          console.log(`Переключено на ${targetCamera.name || "камера не инициализирована"} при нажатии на кнопку`); // Используем оператор "или"
      } else {
          console.log("Целевая камера не инициализирована");
      }
  
      // Убираем UI после нажатия на кнопку
      if (this.advancedTexture) {
          this.advancedTexture.dispose();
          this.advancedTexture = null; // Обнуляем переменную интерфейса
      }
  
      
  }
  
  checkAnswer(selectedAnswer: string): void {
      const correctAnswer = "Металл"; // Укажите правильный ответ
  
      if (selectedAnswer === correctAnswer) {
          console.log("Правильный ответ!");
      } else {
          console.log("Неправильный ответ. Попробуйте снова.");
      }
  
      // Восстанавливаем активную камеру
      if (this.secondaryCamera) {
          this.scene.activeCamera = this.secondaryCamera;
      } else {
          this.scene.activeCamera = this.thirdCamera;
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
      this.rulerModel.isVisible = false; 
  }

  attachHandToCamera(): void {
      if (this.handModel) {
          const camera = this.scene.getCameraByName("camera") as FreeCamera;
          this.handModel.parent = camera;
          this.handModel.position = new Vector3(2, -4.5, 2);
          this.handModel.rotation.x += Math.PI / 2; 
          this.handModel.rotation.y = Math.PI / 4;  // Вращение на 45 градусов по Y
          this.handModel.scaling = new Vector3(5, 5, 5);
      }
  }

  CreateController(): void {
      const camera = new FreeCamera("camera", new Vector3(20, 100, 0), this.scene);
      camera.attachControl(this.canvas, true);
      this.scene.activeCamera = camera;

      camera.applyGravity = true;
      camera.checkCollisions = true;
      camera.ellipsoid = new Vector3(1, 2, 1);
      camera.minZ = 0.45;
      camera.speed = 0.75;
      camera.angularSensibility = 4000;
      camera.keysUp.push(87); // W
      camera.keysLeft.push(65); // A
      camera.keysDown.push(83); // S
      camera.keysRight.push(68); // D

      this.scene.gravity = new Vector3(0, -0.98, 0);
      camera.needMoveForGravity = true;
      // Инициализация второй камеры
      this.secondaryCamera = new FreeCamera("secondaryCamera", new Vector3(0, 5, -10), this.scene);
      this.secondaryCamera.setTarget(Vector3.Zero());

      // Инициализация третей камеры
      this.thirdCamera = new FreeCamera("thirdCamera", new Vector3(0, 5, -10), this.scene);
      this.thirdCamera.setTarget(Vector3.Zero());
      

      const ground = this.scene.getMeshByName("ground");
      if (ground) {
          ground.checkCollisions = true;
      }

      this.scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, CANNON));

      // Обработчик нажатия клавиши для возврата к основной камере
      window.addEventListener("keydown", (event) => {
          if (event.key === "Escape") { // Измените на нужную вам клавишу
              this.switchToMainCamera(camera);
          }
      });
  }

  switchToThirdCamera(interactionObject: InteractionObject): void {
      const mesh = interactionObject.getMesh();
      const position = mesh.position;
      // Функция для преобразования градусов в радианы
      function degreesToRadians(degrees: number): number {
          return degrees * (Math.PI / 180);
}
      // Установим значения смещений и углы камеры в зависимости от типа объекта
      let offsetX = 2, offsetY = 2, offsetZ = 5; // Смещения по умолчанию
      let targetYOffset = 0; // Смещение по оси Y для цели по умолчанию (камера нацелена чуть выше объекта)
  
      // Определение типа объекта по его имени
      if (mesh.name.toLowerCase().includes("whole")) {
          offsetX = 13.49; // Увеличиваем смещение по оси X
          offsetY = 6.4; // Камера выше
          offsetZ = -4.9; // Камера дальше
          targetYOffset = 0; // Камера нацелена чуть выше объекта "whole"
      } else if (mesh.name.toLowerCase().includes("broken")) {
          offsetX = 13.49; // Среднее смещение по оси X
          offsetY = 6.4; // Камера чуть выше объекта
          offsetZ = -4.9; // Камера чуть ближе
          targetYOffset = 0; // Камера нацелена чуть выше объекта "broken"
      }
  
      if (this.thirdCamera) {
          // Устанавливаем позицию камеры относительно объекта
          this.thirdCamera.position = new Vector3(position.x + offsetX, position.y + offsetY, position.z - offsetZ);
  
          // Камера нацелена на объект
          this.thirdCamera.setTarget(new Vector3(position.x, position.y + targetYOffset, position.z));
  
          // Переключаем активную камеру на третью
          this.scene.activeCamera = this.thirdCamera;
  
          // Включаем видимость точек
          this.points.forEach(point => point.isVisible = true);
  
          // Поворачиваем камеру вправо на 10 градусов, используя собственную функцию
          this.thirdCamera.rotation.x = degreesToRadians(20); // Поворот камеры вправо на 10 градусов

          // Поворачиваем камеру вправо на 10 градусов, используя собственную функцию
          this.thirdCamera.rotation.y = degreesToRadians(-90); // Поворот камеры вправо на 10 градусов
  
          // Настраиваем параметры вращения камеры (можете изменить чувствительность, если требуется)
          this.thirdCamera.angularSensibility = 800; // Чувствительность вращения камеры

              // Включаем видимость модели руки
          if (this.handModel) {
              this.handModel.isVisible = true;
          }

          
  
          console.log(`Камера переключена на третью камеру, цель: ${mesh.name}`);
      } else {
          console.error("Третья камера не инициализирована.");
      }
  }
  


  // Метод для переключения на основную камеру
  switchToMainCamera(camera: FreeCamera): void {
      this.scene.activeCamera = camera;
  
      // Скрыть точки при переключении на основную камеру
      this.points.forEach(point => point.isVisible = false);
  
      // Отключаем управление вторичной камерой
      if (this.secondaryCamera) {
          this.secondaryCamera.detachControl(); 
      }

      // Отключаем управление вторичной камерой
      if (this.thirdCamera) {
          this.thirdCamera.detachControl(); 
      }
  
      // Включаем видимость модели руки
      if (this.handModel) {
          this.handModel.isVisible = true;
      }
  
      // Отключаем измерение расстояния
      this.disableDistanceMeasurement();
      console.log("Камера переключена обратно на основную камеру");
  }
      disableDistanceMeasurement(): void {
      this.measuringDistance = false;
      this.scene.onPointerDown = undefined; // Отключаем обработку кликов
  }

  switchToSecondaryCamera(interactionObject: InteractionObject): void {
      const mesh = interactionObject.getMesh();
      const position = mesh.position;
      

      
      // Установим значения смещений и углы камеры в зависимости от типа объекта
      let offsetX = 4, offsetY = 2, offsetZ = 5; // Смещения по умолчанию
      let targetYOffset = 1; // Смещение по оси Y для цели по умолчанию (камера нацелена чуть выше объекта)
      // Определение типа объекта по его имени
      if (mesh.name.toLowerCase().includes("whole")) {
          offsetX = 13.7; // Увеличиваем смещение по оси X
          offsetY = 6.5; // Камера выше
          offsetZ = -5; // Камера дальше
          targetYOffset = 1; // Камера нацелена чуть выше объекта "whole"
      } else if (mesh.name.toLowerCase().includes("broken")) {
          offsetX = 13.7; // Среднее смещение по оси X
          offsetY = 6.5; // Камера чуть выше объекта
          offsetZ = -5; // Камера чуть ближе
          targetYOffset = 1; // Камера нацелена чуть выше объекта "broken"
      } 
      
  
      if (this.secondaryCamera) {
          // Устанавливаем позицию камеры относительно объекта
          this.secondaryCamera.position = new Vector3(position.x + offsetX, position.y + offsetY, position.z - offsetZ);
  
          // Камера нацелена на объект
          this.secondaryCamera.setTarget(new Vector3(position.x, position.y + targetYOffset, position.z));
  
          // Переключаем активную камеру на вторичную
          this.scene.activeCamera = this.secondaryCamera;


          // Вызов интерфейса вопросов
          this.createQuestionInterface();

          // Включаем видимость точек
          this.points.forEach(point => point.isVisible = true);

          // Включаем управление камерой через мышь
          this.secondaryCamera.attachControl(this.canvas, true); // true для разрешения захвата мыши
  
          // Настраиваем параметры вращения камеры (можете изменить чувствительность, если требуется)
          this.secondaryCamera.angularSensibility = 800; // Чувствительность вращения камеры


          console.log(`Камера переключена на вторичную камеру, цель: ${mesh.name}`);
      } else {
          console.error("Вторичная камера не инициализирована.");
      }

      
      // Скрываем модель руки, если она есть
       // Скрываем модель руки только если меш не является "whole"
      if (this.handModel && !mesh.name.toLowerCase().includes("whole")) {
      this.handModel.isVisible = false;
      } else if (this.handModel && mesh.name.toLowerCase().includes("whole")) {
      this.handModel.isVisible = true; // Оставляем модель рук видимой
      }
      
      
      
      // Включаем измерение расстояния, если нужно
      this.enableDistanceMeasurement();
  
      console.log(`Камера переключена на вторичную камеру, цель: ${mesh.name}`);
  
  

  


                  // Создаем GUI
                  const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
                      
                  const questionText = new TextBlock();
                  questionText.text = "Выберите правильный ответ:";
                  questionText.color = "white";
                  questionText.fontSize = 24;
                  questionText.height = "50px";
                  questionText.top = "-200px";
                  advancedTexture.addControl(questionText);

                  const correctAnswer = "Ответ 48 сантиметров"; // Правильный ответ

                  // Функция для создания кнопки ответа
                  const createAnswerButton = (answerText: string, leftPosition: string) => {
                      const button = Button.CreateSimpleButton("answer", answerText);
                      button.width = "200px";
                      button.height = "60px";
                      button.color = "white";
                      button.background = "blue";
                      button.left = leftPosition; // Устанавливаем положение кнопки по горизонтали
                      button.top = "-10px"; // Отступ от нижнего края экрана (с отрицательным значением, чтобы кнопки не были слишком высоко)
                      button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Выравнивание по левому краю
                      button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM; // Выравнивание по нижнему краю экрана

                      advancedTexture.addControl(button);

                      button.onPointerClickObservable.add(() => {
                          console.log(`Нажата кнопка: ${answerText}, правильный ответ: ${correctAnswer}`);
                          if (answerText === correctAnswer) {
                              console.log("Правильный ответ!");
                              questionText.text = "Правильный ответ!";
                          } else {
                              console.log("Неправильный ответ.");
                              questionText.text = "Неправильный ответ.";
                          }
                          // Удалить все элементы GUI после выбора
                          setTimeout(() => {
                              advancedTexture.dispose();
                          }, 2000); // Убираем через 2 секунды
                      });
                  };

          // Создаем 4 кнопки с разными вариантами ответов, расположенными в ряд снизу экрана
          const buttonSpacing = 20; // Пробел между кнопками
          const buttonWidth = 200; // Ширина кнопки
          const startXPosition = (window.innerWidth - (buttonWidth * 4 + buttonSpacing * 3)) / 2; // Центрируем кнопки

          // Создаем 4 кнопки с разными вариантами ответов
          createAnswerButton("Ответ 52 сантиметров", `${startXPosition}px`); // 1-я кнопка
          createAnswerButton("Ответ 50 сантиметров", `${startXPosition + buttonWidth + buttonSpacing}px`); // 2-я кнопка
          createAnswerButton("Ответ 48 сантиметров", `${startXPosition + (buttonWidth + buttonSpacing) * 2}px`); // 3-я кнопка
          createAnswerButton("Ответ 46 сантиметров", `${startXPosition + (buttonWidth + buttonSpacing) * 3}px`); // 4-я кнопка


              }

              createRayAboveMesh(mesh: AbstractMesh): void {
                  // Создаем луч с начальной позицией выше меша и направлением
                  const origin = new Vector3(mesh.position.x, mesh.position.y + 1, mesh.position.z);
                  const direction = new Vector3(0, 1, 0); // Направление луча (например, вверх)
                  
                  // Создаем луч
                  const ray = new Ray(origin, direction, 5); // Третий аргумент - длина луча
                  
                  // Используем RayHelper для визуализации луча
                  const rayHelper = new RayHelper(ray);
                  rayHelper.show(this.scene, new Color3(1, 0, 0)); // Показать луч в сцене
              }

              enableDistanceMeasurement(): void {
                  this.measuringDistance = true;
                  this.firstPoint = null;
                  this.secondPoint = null;
                  // Переключаем активную камеру на вторичную
                  this.scene.activeCamera = this.secondaryCamera;
              
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
              }
          }
      }
  } 
  
  else if (evt.button === 0) {
      console.log("Левый клик. Замеры не проводятся.");
  }

      };

  }


}



--------------------Интеграция в Битрикс-----------------------------
1. Подготовка проекта на TypeScript
Убедитесь, что ваш TypeScript-проект уже собран в виде JavaScript- или React-приложения с использованием инструмента сборки, например, Webpack, Vite или другого. Для этого вам нужно:

Компилировать TypeScript в JavaScript (tsc или с помощью инструментов сборки).
Сгенерировать оптимизированные файлы JavaScript и CSS для последующей интеграции.

2. Добавление файлов в Bitrix
После сборки вашего проекта добавьте скомпилированные файлы (JavaScript и CSS) в ваш шаблон или компонент Bitrix:

Создайте папку в шаблоне сайта, например, /local/templates/название_шаблона/js/ваш_проект.
Скопируйте туда все сгенерированные файлы проекта.

3. Подключение файлов в шаблон Bitrix
В шаблоне сайта или в компоненте нужно подключить сгенерированные файлы через HTML-теги <script> и <link> для стилистики.

4. Интеграция с Битрикс
Если ваш TypeScript-проект взаимодействует с бэкендом (например, отправка данных на сервер), то нужно обеспечить его интеграцию с Bitrix через API или AJAX-запросы. Для этого можно использовать AJAX-функционал Bitrix или интеграцию через REST API.

Пример использования AJAX в Bitrix:

5. Создание AJAX-обработчика на стороне Bitrix
Для обработки запросов создайте PHP-файл, например, ajax.php в компоненте:

6. Настройка роутинга или компонентов Bitrix
Если TypeScript-приложение представляет собой одностраничное приложение (SPA), необходимо настроить роутинг на стороне Bitrix, чтобы перенаправлять запросы на нужную страницу, где рендерится приложение. Можно использовать встроенные механизмы Bitrix для организации маршрутизации.

7. Тестирование и отладка
После всех шагов протестируйте работоспособность вашего TypeScript-проекта в рамках системы Bitrix, убедитесь, что скрипты и стили подключены корректно, а взаимодействие с серверной частью Bitrix работает без проблем.

Эти шаги позволят вам интегрировать сторонний TypeScript-проект в 1С-Битрикс с минимальными изменениями в структуре сайта.












// Вопрос
const questionText2 = new TextBlock();
questionText2.text = "Выберите правильный ответ:";
questionText2.color = "white";
questionText2.fontSize = 24;
questionText2.height = "50px";
questionText2.top = "30px"; // Отступ для текста
this.advancedTexture.addControl(questionText2);

const correctAnswer = "Ответ 48 сантиметров"; // Правильный ответ

// Функция для создания кнопки ответа
const createAnswerButton = (answerText: string, leftPosition: string) => {
    const button = Button.CreateSimpleButton("answer", answerText);
    button.width = "200px";
    button.height = "60px";
    button.color = "white";
    button.background = "blue";
    button.left = leftPosition; // Устанавливаем положение кнопки по горизонтали
    button.top = "220px"; // Отступ от нижнего края экрана
    button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Выравнивание по левому краю
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM; // Выравнивание по нижнему краю экрана


    button.onPointerClickObservable.add(() => {
        console.log(`Нажата кнопка: ${answerText}, правильный ответ: ${correctAnswer}`);
        if (answerText === correctAnswer) {
            console.log("Правильный ответ!");
            questionText.text = "Правильный ответ!";
        } else {
            console.log("Неправильный ответ.");
            questionText.text = "Неправильный ответ.";
        }
        // Удалить все элементы GUI после выбора
        setTimeout(() => {
            this.advancedTexture = null; // Обнуляем ссылку на интерфейс
        }, 2000); // Убираем через 2 секунды
    });};

// Создаем 4 кнопки с разными вариантами ответов, расположенными в ряд снизу экрана
const buttonSpacing = 20; // Пробел между кнопками
const buttonWidth = 200; // Ширина кнопки
const startXPosition = (window.innerWidth - (buttonWidth * 4 + buttonSpacing * 3)) / 2; // Центрируем кнопки

// Создаем 4 кнопки с разными вариантами ответов
createAnswerButton("Ответ 52 сантиметров", `${startXPosition}px`); // 1-я кнопка
createAnswerButton("Ответ 50 сантиметров", `${startXPosition + buttonWidth + buttonSpacing}px`); // 2-я кнопка
createAnswerButton("Ответ 48 сантиметров", `${startXPosition + (buttonWidth + buttonSpacing) * 2}px`); // 3-я кнопка
createAnswerButton("Ответ 46 сантиметров", `${startXPosition + (buttonWidth + buttonSpacing) * 3}px`); // 4-я кнопка







    

















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
import { StackPanel, Rectangle, AdvancedDynamicTexture, TextBlock, Button, Control } from "@babylonjs/gui";
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
  questionTexture: AdvancedDynamicTexture | null = null; // Для второго интерфейса

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
    });
    this.advancedTexture.addControl(button2);
  }

  handleButtonClick(selectedAnswer: string, targetCamera: FreeCamera | null): void {
    console.log(`Обработчик нажатия кнопки: ${selectedAnswer}`);
    
    // Проверяем, какой кнопкой нажали
    if (selectedAnswer === "Линейка") {
        console.log("Линейка выбрана, скрываем текущий интерфейс.");

        // Если нажата кнопка "Линейка", скрываем текущий интерфейс
        if (this.advancedTexture) {
            this.advancedTexture.dispose(); // Скрываем текущий интерфейс
            this.advancedTexture = null; // Обнуляем ссылку на интерфейс
            console.log("Интерфейс скрыт.");
        }

        // Затем открываем новый интерфейс
        this.createSecondQuestionInterface();
    } else {
        // Обработка для других кнопок (например, "Штангенциркуль")
        const isCorrect = this.checkAnswer(selectedAnswer); // Проверяем ответ и сохраняем результат
        console.log(`Ответ: ${selectedAnswer}, правильный: ${isCorrect}`);

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
            console.log("Правильный ответ, интерфейс скрыт.");
        }
    }
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
      }}}



-------------------Пустая сцена----------------------------------
Level.tsx
import React, { useEffect, useRef } from 'react';
import { Level as LevelScene } from '../BabylonExamples/BasicLevel'; // Импортируем класс сцены и переименовываем его

const Level: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new LevelScene(canvasRef.current); // Просто создаем сцену без присваивания
    }
  }, []);

  return (
    <div>
      <h3>Babylon Tutor</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default Level; // Экспортируем компонент по умолчанию
======================================================================================
BasicLevel.ts
import { 
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  FreeCamera,
  HDRCubeTexture,
  SceneLoader,
} from "@babylonjs/core";

export class Level {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.CreateController();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
  
  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);
    scene.collisionsEnabled = true;

    const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 15, -15), this.scene);
    camera.attachControl(this.canvas, true);
    camera.applyGravity = false;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
  }

  async CreateEnvironment(): Promise<void> {
    try {
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });
      console.log("Модели успешно загружены:", map);
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }
}
===================================================================================
App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/MainPage';
import Base from './components/Base';
import Tutor from './components/Tutor';
import BabylonTest from './components/BabylonTest';
import BabylonQuestion from './components/BabylonQuestion';
import BabylonFull from './components/BabylonFull'; // Импортируйте FullExample
import BasicLevel from './components/Level'; // Импортируйте Level

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/base" element={<Base />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/test" element={<BabylonTest />} />
        <Route path="/question" element={<BabylonQuestion />} />
        <Route path="/full" element={<BabylonFull />} />
        <Route path="/level" element={<BasicLevel />} /> {/* Используйте BasicLevel в маршруте */}
      </Routes>
    </Router>
  );
};

export default App;


======================================================================================================
import { 
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  FreeCamera,
  HDRCubeTexture,
  HighlightLayer,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { TriggersManager } from "./FunctionComponents/TriggerManager3";

export class Level {
  scene: Scene;
  engine: Engine;
  camera!: FreeCamera;
  triggerManager: TriggersManager;
  guiTexture: AdvancedDynamicTexture;
  highlightLayer: HighlightLayer;


  constructor(private canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(
      this.scene,
      this.canvas,
      this.guiTexture
    );

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
    this.CreateController();

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
    // Установка начальной позиции камеры для лучшей видимости
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
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }

    
  }
}
=======================================Со сферой======================================
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
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);

    this.bubblePosition = new Vector3(0, 0, 0); // Инициализация позиции пузырька в конструкторе

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
      sphere.position = new Vector3(0, 0.5, 0); // Позиция в центре

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

  this.bubble = MeshBuilder.CreateSphere("bubble", { diameter: 0.5 }, this.scene);
  this.bubble.material = bubbleMaterial;
  this.bubble.position = new Vector3(0, 0.5, 0); // Центр карты

  this.isBubbleCreated = true; // Флаг, что пузырек создан
  console.log("Пузырек создан в центре карты с координатами:", this.bubble.position);
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

  // Обновление позиции пузырька
  UpdateBubble(): void {
    // Обновляем положение пузырька, если он создан
    if (this.bubble) {
      let moveSpeed = 0.01; // Скорость перемещения пузырька
  
      // Перемещаем пузырек по поверхности сферы в ответ на стрелочки
      if (this.inputMap["ArrowUp"]) {
        this.bubblePosition.z -= moveSpeed;
      }
      if (this.inputMap["ArrowDown"]) {
        this.bubblePosition.z += moveSpeed;
      }
      if (this.inputMap["ArrowLeft"]) {
        this.bubblePosition.x -= moveSpeed;
      }
      if (this.inputMap["ArrowRight"]) {
        this.bubblePosition.x += moveSpeed;
      }
  
      // Ограничиваем перемещение пузырька в пределах сферы
      const radius = 0.5; // Радиус сферы (или другой размер)
      this.bubblePosition.normalize().scaleInPlace(radius); // Ограничиваем на поверхности сферы
  
      this.bubble.position.copyFrom(this.bubblePosition); // Применяем обновленную позицию пузырька
  
      // Логируем позицию пузырька для отладки
      console.log("Текущая позиция пузырька:", this.bubblePosition);
    }
  }
}
============================Готовый код со сферой================================
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

      // Перемещение пузырька по кнопкам
      if (this.inputMap["8"]) { // Вверх
          this.bubble.position.z -= moveSpeed;
      }
      if (this.inputMap["2"]) { // Вниз
          this.bubble.position.z += moveSpeed;
      }
      if (this.inputMap["4"]) { // Влево
          this.bubble.position.x -= moveSpeed;
      }
      if (this.inputMap["6"]) { // Вправо
          this.bubble.position.x += moveSpeed;
      }

      // Получаем центр сферы
      const sphereCenter = new Vector3(0, 1.1, 0); // Центр сферы (сфера на высоте 1.5)
      const sphereRadius = 0.5; // Радиус сферы

      // Вычисляем расстояние от пузырька до центра сферы
      const distanceFromCenter = Vector3.Distance(this.bubble.position, sphereCenter);

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
  // Хранение точек
  private points: AbstractMesh[] = [];
  private pointsVisible: boolean = false;
  // Счетчик нажатых точек
  private pointsPressedCount: number = 0; 

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    this.highlightLayer.innerGlow = false; // Включаем внутреннее свечение, если нужно
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

  

    // Добавьте обработчик события для клавиши "i"
    // Добавляем обработчик события для клавиш "i" и "ш"
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

  // Создаем точки на карте
  private createPoints() {
    const pointsPositions = [
      new Vector3(0, 2, 0), // Используйте центр сцены для отладки
      new Vector3(1, 2, 0),
      new Vector3(-1, 2, 0)
    ];

    pointsPositions.forEach(pos => {
      const point = MeshBuilder.CreateSphere("point", { diameter: 0.5 }, this.scene); // Увеличиваем диаметр
      point.position = pos;
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
    
  updatePointsCountDisplay(): void {
    // Убедитесь, что вы уже создали inventoryImage в CreateInventory или аналогичном методе
    if (this.inventoryVisible && this.inventoryImage) {
        // Создаем текст для отображения количества нажатых точек
        const pointsText = `Нажатые точки: ${this.pointsPressedCount}`;
        
        // Проверяем, существует ли текст уже, и обновляем его
        let textBlock = this.guiTexture.getControlByName("pointsCount") as TextBlock; // Приводим к типу TextBlock
        if (!textBlock) {
            textBlock = new TextBlock("pointsCount", pointsText);
            textBlock.color = "white";
            textBlock.fontSize = "24px";
            textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Исправлено
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Исправлено
            textBlock.top = "10px";
            textBlock.left = "10px";
            this.guiTexture.addControl(textBlock);
        } else {
            textBlock.text = pointsText; // Обновляем текст
        }
    }
}

toggleInventoryVisibility(): void {
  this.inventoryVisible = !this.inventoryVisible;

  // Убедитесь, что inventoryImage создан
  if (this.inventoryImage) {
      this.inventoryImage.isVisible = this.inventoryVisible;
  }

  this.updatePointsCountDisplay(); // Обновляем отображение счетчика
}
  

   
   // Переключение видимости точек
   private togglePointsVisibility() {
    this.pointsVisible = !this.pointsVisible;
    this.points.forEach(point => {
      point.setEnabled(this.pointsVisible);
    });
    console.log(`Точки ${this.pointsVisible ? 'показаны' : 'скрыты'}`); // Лог для отладки
  }

  AddKeyboardControls() {
    this.scene.actionManager = new ActionManager(this.scene);
    this.scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
      if (evt.sourceEvent.key === "i") {
        this.togglePointsVisibility();
      }
    }));
  }







    }




















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
      new Vector3(0, 2, 0), // Используйте центр сцены для отладки
      new Vector3(1, 2, 0),
      new Vector3(-1, 2, 0)
    ];

    pointsPositions.forEach(pos => {
      const point = MeshBuilder.CreateSphere("point", { diameter: 0.5 }, this.scene); // Увеличиваем диаметр
      point.position = pos;
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
        this.pointsCountText.fontSize = 24;
  
        // Устанавливаем выравнивание
        this.pointsCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Выравнивание по левому краю
        this.pointsCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Положение текста в верхней части
        
        // Установите значения top и left в пределах планшета
        this.pointsCountText.top = "20px"; // Отступ от верхней границы инвентаря
        this.pointsCountText.left = "10px"; // Отступ от левой границы инвентаря
  
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




$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ сцена с рендерингом и заморозкой$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
async CreateEnvironment(): Promise<void> {
  try {
    
    // Запрос на backend для получения пути к карте
    const response = await fetch('http://127.0.0.1:5000/api/map');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const mapUrl = data.map_url; // Извлечение пути к карте из ответа backend

    // Загружаем карту по полученному пути
    const { meshes: map } = await SceneLoader.ImportMeshAsync("", "/models/", "Map_1.gltf", this.scene);
    map.forEach((mesh) => {
      mesh.checkCollisions = true;
      
      // Замораживаем активные меши после создания всех точек
    this.scene.freezeActiveMeshes();
    //console.log("Активные меши заморожены.");

    /*
const { meshes: map } = await SceneLoader.ImportMeshAsync("", "/models/", "Map_1.gltf", this.scene);

// Создаем черный материал
const blackMaterial = new PBRMaterial("blackMaterial", this.scene);
blackMaterial.albedoColor = new Color3(0, 0, 0); // черный цвет
blackMaterial.roughness = 0.5; // значение шероховатости без текстуры

// Устанавливаем коллизии для всех мешей и делаем нужные меши невидимыми
map.forEach((mesh) => {
  mesh.checkCollisions = true;

  // Применяем черный материал только к мешам, начинающимся с "SM_0_Retaining_wall"
  if (mesh.name.startsWith("SM_0_Retaining_wall")) {
    mesh.material = blackMaterial;
    mesh.visibility = 0; // делаем меш невидимым
  }
});
*/


    });
    console.log("Карта загружена успешно:", map);
  } catch (error) {
    console.error("Ошибка при загрузке окружения:", error);
  }
}



=====================================================================================================================================
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
  PBRMaterial,
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
    const hemisphericLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);
    hemisphericLight.intensity = 1; // Увеличиваем яркость света

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

  // Запрос на backend для получения пути к карте
async CreateEnvironment(): Promise<void> {
  try {
    // Запрос на backend для получения пути к карте
    const response = await fetch('http://127.0.0.1:5000/api/map');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const mapUrl = data.map_url; // Извлечение пути к карте из ответа backend

    // Загружаем карту по полученному пути
    const { meshes: map } = await SceneLoader.ImportMeshAsync("", "/models/", "Map_1.gltf", this.scene);
    
    // Устанавливаем видимость и коллизии для всех мешей
    map.forEach((mesh) => {
      mesh.checkCollisions = true;
      mesh.visibility = 1; // Делаем меши видимыми (можете изменить на 0, если хотите их скрыть)
    });

    // Убедитесь, что меши правильно загружены и отображаются перед заморозкой
    console.log("Карта загружена успешно:", map);

    // Замораживаем активные меши после завершения всех настроек
    //this.scene.freezeActiveMeshes();
    console.log("Активные меши заморожены.");

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



const coordinates = [
    { x: 12.18 , y: 6.105, z: 12.58  },
    { x: 40.79, y: 3, z: 2.70 },
    { x: 42.79, y: 3, z: 3.70 },
    { x: 44.79, y: 3, z: 4.70 },
    { x: 46.79, y: 3, z: 5.70 },
    { x: 48.79, y: 3, z: 6.70 },
    { x: 50.79, y: 3, z: 7.70 },
    { x: 52.79, y: 3, z: 8.70 },
    { x: 54.79, y: 3, z: 9.70 },
    { x: 56.79, y: 3, z: 10.70 },
    { x: 58.79, y: 3, z: 11.70 },
    { x: 60.79, y: 3, z: 12.70 },
    { x: 62.79, y: 3, z: 13.70 },
    { x: 64.79, y: 3, z: 14.70 },
    { x: 66.79, y: 3, z: 15.70 },
    { x: 68.79, y: 3, z: 16.70 },
    { x: 70.79, y: 3, z: 17.70 },
    { x: 72.79, y: 3, z: 18.70 },
    { x: 74.79, y: 3, z: 19.70 },
    { x: 76.79, y: 3, z: 20.70 }
  ];




  import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, StackPanel, Control } from "@babylonjs/gui";
import * as BABYLON from "babylonjs";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: StackPanel[];
    private currentPageIndex: number = 0;
    private isVisible: boolean = false;
    private navPanel: StackPanel | null = null;

    constructor(private scene: BABYLON.Scene) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = this.createContainer();
        this.pages = [];
        this.guiTexture.addControl(this.container);

        this.initializePages();
    }

    private createContainer(): Rectangle {
        const container = new Rectangle();
        container.width = "50%";
        container.height = "70%";
        container.background = "black";
        container.thickness = 2;
        container.color = "white";
        container.isVisible = false;
        return container;
    }

    private initializePages() {
        this.pages = [
            this.createPage("Добро пожаловать на главный экран!", 24),
            this.createProjectsPage(),
            this.createPage(
                "Текущий проект: TotalStationWork\nОписание: Этот проект включает в себя работу с тотальными станциями, для измерения расстояний и углов.",
                20
            ),
            this.createPage("Конец презентации!", 20),
        ];
    }

    private createPage(content: string, fontSize: number): StackPanel {
        const page = new StackPanel();
        const text = new TextBlock();
        text.text = content;
        text.color = "white";
        text.fontSize = fontSize;
        page.addControl(text);
        return page;
    }

    private createProjectsPage(): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Выравнивание всей страницы по верхней границе
    
        // Контейнер для заголовка
        const headerContainer = new StackPanel();
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Выравнивание заголовка по верхней границе
        headerContainer.height = "100px"; // Фиксированная высота для заголовка (можно изменить)
    
        const header = new TextBlock();
        header.text = "Выберите проект, чтобы увидеть описание:";
        header.color = "white";
        header.fontSize = 24;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER; // Центрирование текста по горизонтали
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER; // Центрирование текста в контейнере заголовка
    
        headerContainer.addControl(header);
        page.addControl(headerContainer);
    
        // Контейнер для ячеек проектов
        const projectsContainer = new StackPanel();
        projectsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Выравнивание ячеек сразу под заголовком
        projectsContainer.paddingTop = "10px"; // Отступ между заголовком и ячейками
    
        const projects = [
            { id: "project1", name: "TotalStationWork", description: "Работа с тотальными станциями для измерения расстояний и углов." },
            { id: "project2", name: "TotalStation", description: "Программное обеспечение для обработки данных с тотальной станции." },
            { id: "project3", name: "TestScene2", description: "Простой тестовый проект для работы с Babylon.js." },
            { id: "project4", name: "QuestionScene", description: "Проект с вопросами и ответами." },
            { id: "project5", name: "NewDistanceScene", description: "Проект для работы с измерениями расстояний." },
            { id: "project6", name: "FullExample", description: "Полный пример работы с Babylon.js." },
            { id: "project7", name: "DistanceScene", description: "Проект для работы с дистанциями и измерениями." },
            { id: "project8", name: "BookScene2", description: "Проект с 3D книгой." },
            { id: "project9", name: "BookScene", description: "Проект с интерактивной книгой." },
            { id: "project10", name: "BetoneScene", description: "Проект с бетоном и строительными материалами." },
        ];
    
        projects.forEach(({ id, name, description }) => {
            const cell = this.createProjectCell(id, name, description);
            projectsContainer.addControl(cell);
        });
    
        page.addControl(projectsContainer);
    
        return page;
    }
    
    private createProjectCell(id: string, name: string, description: string): Rectangle {
        const cell = new Rectangle();
        cell.width = "90%";  // Уменьшаем ширину ячейки
        cell.height = "40px";  // Уменьшаем высоту ячейки
        cell.color = "white";
        cell.background = "blue";
        cell.paddingTop = "5px";
        cell.paddingBottom = "5px";
        cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const cellText = new TextBlock();
        cellText.text = name;
        cellText.color = "white";
        cellText.fontSize = 18;  // Уменьшаем размер шрифта
        cellText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cellText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        cell.addControl(cellText);
    
        cell.onPointerClickObservable.add(() => {
            alert(`Проект: ${name}\nОписание: ${description}`);
        });
    
        return cell;
    }
    
    private createProjectButton(id: string, name: string, description: string): Button {
        const button = Button.CreateSimpleButton(id, name);
        button.width = "200px";
        button.height = "50px";
        button.color = "white";
        button.background = "blue";
        button.onPointerClickObservable.add(() => {
            alert(`Проект: ${name}\nОписание: ${description}`);
        });
        return button;
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.container.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updatePage();
        }
    }

    private navigate(direction: number) {
        const newIndex = this.currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < this.pages.length) {
            this.currentPageIndex = newIndex;
            this.updatePage();
        }
    }

    private updatePage() {
        this.container.clearControls();

        if (!this.navPanel) {
            this.navPanel = this.createNavigationPanel();
        }

        const navContainer = this.createNavContainer();
        navContainer.addControl(this.navPanel);

        this.container.addControl(navContainer);
        this.container.addControl(this.pages[this.currentPageIndex]);
    }

    private createNavigationPanel(): StackPanel {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.width = "100%";

        const prevButton = this.createNavButton("prev", "Previous", () => this.navigate(-1));
        const nextButton = this.createNavButton("next", "Next", () => this.navigate(1));

        panel.addControl(prevButton);
        panel.addControl(nextButton);

        return panel;
    }

    private createNavButton(id: string, label: string, callback: () => void): Button {
        const button = Button.CreateSimpleButton(id, label);
        button.width = "80px";
        button.height = "30px";
        button.color = "white";
        button.background = "gray";
        button.onPointerClickObservable.add(callback);
        return button;
    }

    private createNavContainer(): Rectangle {
        const container = new Rectangle();
        container.height = "60px";
        container.width = "100%";
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.thickness = 0;
        return container;
    }
}




----------------------------------------------------------------------------------------------
private openProjectDescription(
        name: string,
        description: string,
        image: string | null,
        video: string | null
    ): void {
        // Контейнер страницы описания
        const descriptionPage = new StackPanel();
        descriptionPage.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        // Заголовок
        const header = new TextBlock();
        header.text = name;
        header.color = "white";
        header.fontSize = 24;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        descriptionPage.addControl(header);
    
        // Текст описания
        const descriptionText = new TextBlock();
        descriptionText.text = description;
        descriptionText.color = "white";
        descriptionText.fontSize = 18;
        descriptionText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        descriptionPage.addControl(descriptionText);
    
        // Изображение, если задано
        if (image) {
            const imageControl = new Image("projectImage", "models/image14.png");
            imageControl.width = "80%"; // Строковое значение
            imageControl.height = "200px"; // Строковое значение
            descriptionPage.addControl(imageControl);
        }
    
        // Видео, если задано
        if (video) {
            const videoControl = new Rectangle();
            videoControl.height = "200px";
            videoControl.width = "80%";
    
            const videoElement = document.createElement("video");
            videoElement.src = video;
            videoElement.controls = true;
            videoElement.style.width = "100%";
            videoElement.style.height = "100%";
    
            videoControl.onPointerEnterObservable.add(() => {
                document.body.appendChild(videoElement);
            });
    
            videoControl.onPointerOutObservable.add(() => {
                document.body.removeChild(videoElement);
            });
    
            descriptionPage.addControl(videoControl);
        }
    
        // Смена текущей страницы
        this.replacePage(descriptionPage);
    }

    private replacePage(newPage: StackPanel): void {
        // Убедитесь, что `mainContainer` определен
        if (this.mainContainer) {
            // Удаляем все элементы
            this.mainContainer.getChildren().forEach(child => {
                this.mainContainer.removeControl(child);
            });
    
            // Добавляем новую страницу
            newPage.name = "currentPage";
            this.mainContainer.addControl(newPage);
        }
    }

    private createProjectCell(name: string, onClick: () => void): Button {
        const button = Button.CreateSimpleButton(name, name);
        button.width = "200px";
        button.height = "40px";
        button.color = "white";
        button.background = "gray";
        button.onPointerClickObservable.add(onClick);
        return button;
    }
    
РЕЗЕРВ Planshet.ts
import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, StackPanel, Control, Image } from "@babylonjs/gui";
import * as BABYLON from "babylonjs";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: StackPanel[] = [];
    private currentPageIndex: number = 0;
    private isVisible: boolean = false;
    private navPanel: StackPanel | null = null;
    private popups: Rectangle[] = [];  // Массив для хранения всплывающих окон
    private mainContainer: AdvancedDynamicTexture;

    constructor(private scene: BABYLON.Scene) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = this.createContainer();
        this.guiTexture.addControl(this.container);
        this.mainContainer = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.initializePages();
    }

    private createContainer(): Rectangle {
        const container = new Rectangle();
        container.width = "50%";
        container.height = "70%";
        container.background = "black";
        container.thickness = 2;
        container.color = "white";
        container.isVisible = false;
        return container;
    }

    private initializePages() {
        this.pages = [
            this.createPage("Добро пожаловать на главный экран!", 24),
            this.createProjectsPage(),
            this.createPage("Текущий проект: TotalStationWork\nОписание: Этот проект включает в себя работу с тотальными станциями для измерения расстояний и углов.", 20),
            this.createPage("Конец презентации!", 20),
        ];
    }

    private createPage(content: string, fontSize: number): StackPanel {
        const page = new StackPanel();
        const text = new TextBlock();
        text.text = content;
        text.color = "white";
        text.fontSize = fontSize;
        page.addControl(text);
        return page;
    }

    private createProjectsPage(): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const headerContainer = new StackPanel();
        headerContainer.height = "80px";

        const header = new TextBlock();
        header.text = "Выберите проект, чтобы увидеть описание:";
        header.color = "white";
        header.fontSize = 18;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        headerContainer.addControl(header);
        page.addControl(headerContainer);

        const projectsContainer = new StackPanel();
        projectsContainer.paddingTop = "5px";

        // Массив проектов
        const projects = [
            {
                id: "project1",
                name: "TotalStationWork",
                description: "Работа с тотальными станциями для измерения расстояний и углов.",
                image: "models/image14.png",
                video: "path/to/total_station_work.mp4",
            },
            {
                id: "project2",
                name: "TotalStation",
                description: "Программное обеспечение для обработки данных с тотальной станции.",
                image: "path/to/total_station.jpg",
                video: null,
            },
        ];
        
        projects.forEach(({ id, name, description, image, video }) => {
            const cell = this.createProjectCell(id, name, description, image, video );
            projectsContainer.addControl(cell);
        });

        page.addControl(projectsContainer);

        return page;
    }

    private createProjectCell(id: string, name: string, description: string, image?: string, video?: string | null): Rectangle {
    // Создаем новый элемент Rectangle для представления ячейки
    const cell = new Rectangle();
    cell.width = "80%";  // Устанавливаем ширину ячейки
    cell.height = "30px";  // Устанавливаем высоту ячейки
    cell.color = "white";  // Устанавливаем цвет фона ячейки
    cell.background = "blue";  // Устанавливаем фоновый цвет ячейки
    cell.paddingTop = "2px";  // Уменьшаем отступы сверху
    cell.paddingBottom = "2px";  // Уменьшаем отступы снизу
    cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;  // Выравниваем по горизонтали
    cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;  // Выравниваем по вертикали

    // Добавляем текст с именем проекта в ячейку
    const cellText = new TextBlock();
    cellText.text = name;
    cellText.color = "white";
    cellText.fontSize = 14;  // Уменьшаем размер шрифта
    cellText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;  // Выравниваем текст по горизонтали
    cellText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;  // Выравниваем текст по вертикали
    cell.addControl(cellText);

    // Если изображение существует, добавляем его в ячейку
    if (image) {
        const projectImage = new Image("project-image", image);
        projectImage.width = "50px";  // Устанавливаем начальный размер изображения
        projectImage.height = "50px";  // Устанавливаем начальную высоту изображения
        projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;  // Выравниваем изображение по вертикали
        projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;  // Выравниваем изображение по горизонтали
        
        // Обработчик клика по изображению
        let isExpanded = false;
        
        projectImage.onPointerClickObservable.add(() => {
            if (!isExpanded) {
                // Разворачиваем изображение
                projectImage.width = "100%";  // Устанавливаем размер для расширенного состояния
                projectImage.height = "70%";  // Высота изображения для расширенного состояния
                projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                isExpanded = true;
            } else {
                // Свертываем изображение
                projectImage.width = "50px";  // Устанавливаем начальный размер изображения
                projectImage.height = "50px";  // Высота изображения для свернутого состояния
                projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                isExpanded = false;
            }
        });
        
        cell.addControl(projectImage);
    }

    // Обработчик клика по ячейке для отображения проекта
    cell.onPointerClickObservable.add(() => {
        // Создаем всплывающее окно с описанием проекта
        const projectWindow = new Rectangle();
        projectWindow.width = "80%";  // Устанавливаем ширину окна такого же, как у планшета
        projectWindow.height = "100%";  // Устанавливаем высоту окна такого же, как у планшета
        projectWindow.color = "white";
        projectWindow.background = "black";
        projectWindow.cornerRadius = 10;
        projectWindow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        projectWindow.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        // Добавляем изображение проекта в окно
        if (image) {
            const projectImage = new Image("project-window-image", image);
            projectImage.width = "100%";  // Устанавливаем размер изображения в окне
            projectImage.height = "70%";  // Высота изображения
            projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            projectWindow.addControl(projectImage);
        }

        // Добавляем текстовое описание проекта в окно
        const projectDescription = new TextBlock();
        projectDescription.text = `${name}\n${description}`;
        projectDescription.color = "white";
        projectDescription.fontSize = 16;
        projectDescription.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        projectDescription.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        projectWindow.addControl(projectDescription);

        // Добавляем кнопку закрытия в окно
        const closeProjectButton = Button.CreateSimpleButton(`close-${id}-project`, "X");
        closeProjectButton.width = "20px";
        closeProjectButton.height = "20px";
        closeProjectButton.color = "white";
        closeProjectButton.background = "red";
        closeProjectButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeProjectButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        closeProjectButton.top = "-10px";  // Немного поднимаем кнопку вверх
        closeProjectButton.onPointerClickObservable.add(() => {
            projectWindow.isVisible = false; // Закрытие окна с проектом
        });

        projectWindow.addControl(closeProjectButton);

        // Добавляем окно с описанием на экран
        this.guiTexture.addControl(projectWindow);
    });

    return cell;
}

    
    
    


    private openProjectWindow(name: string, description: string) {
        const popup = new Rectangle();
        popup.width = "60%";
        popup.height = "60%";
        popup.background = "black";
        popup.color = "white";
        popup.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        popup.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        popup.alpha = 0.9;

        const header = new TextBlock();
        header.text = `Проект: ${name}`;
        header.color = "white";
        header.fontSize = 18;
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        popup.addControl(header);

        const content = new TextBlock();
        content.text = description;
        content.color = "white";
        content.fontSize = 16;
        content.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        content.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        popup.addControl(content);

        const closeButton = this.createCloseButton(popup);
        popup.addControl(closeButton);

        this.guiTexture.addControl(popup);
        this.popups.push(popup);  // Сохраняем всплывающее окно для дальнейшего управления
    }

    private createCloseButton(popup: Rectangle): Button {
        const closeButton = Button.CreateSimpleButton("close", "X");
        closeButton.width = "30px";
        closeButton.height = "30px";
        closeButton.color = "white";
        closeButton.background = "red";
        closeButton.top = "-15px";
        closeButton.left = "calc(100% - 30px)";
        closeButton.onPointerClickObservable.add(() => {
            this.closePopup(popup);
        });
        return closeButton;
    }

    private closePopup(popup: Rectangle) {
        popup.isVisible = false;
        this.popups = this.popups.filter(p => p !== popup);  // Убираем всплывающее окно из списка
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.container.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updatePage();
        }
    }

    private navigate(direction: number) {
        const newIndex = this.currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < this.pages.length) {
            this.currentPageIndex = newIndex;
            this.updatePage();
        }
    }

    private updatePage() {
        this.container.clearControls();

        if (!this.navPanel) {
            this.navPanel = this.createNavigationPanel();
        }

        const navContainer = this.createNavContainer();
        navContainer.addControl(this.navPanel);

        this.container.addControl(navContainer);
        this.container.addControl(this.pages[this.currentPageIndex]);
    }

    private createNavigationPanel(): StackPanel {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.width = "100%";

        const prevButton = this.createNavButton("prev", "Previous", () => this.navigate(-1));
        const nextButton = this.createNavButton("next", "Next", () => this.navigate(1));

        panel.addControl(prevButton);
        panel.addControl(nextButton);

        return panel;
    }

    private createNavButton(id: string, label: string, callback: () => void): Button {
        const button = Button.CreateSimpleButton(id, label);
        button.width = "80px";
        button.height = "30px";
        button.color = "white";
        button.background = "gray";
        button.onPointerClickObservable.add(callback);
        return button;
    }

    private createNavContainer(): Rectangle {
        const container = new Rectangle();
        container.height = "60px";
        container.width = "100%";
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.thickness = 0;
        return container;
    }
}

№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№№




















import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, StackPanel, Control, Image } from "@babylonjs/gui";
import * as BABYLON from "babylonjs";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: StackPanel[] = [];
    private currentPageIndex: number = 0;
    private isVisible: boolean = false;
    private navPanel: StackPanel | null = null;
    private popups: Rectangle[] = [];  // Массив для хранения всплывающих окон
    private mainContainer: AdvancedDynamicTexture;

    constructor(private scene: BABYLON.Scene) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = this.createContainer();
        this.guiTexture.addControl(this.container);
        this.mainContainer = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.initializePages();
    }

    private createContainer(): Rectangle {
        const container = new Rectangle();
        container.width = "50%";
        container.height = "70%";
        container.background = "black";
        container.thickness = 2;
        container.color = "white";
        container.isVisible = false;
        return container;
    }

    private initializePages() {
        this.pages = [
            this.createPage("Добро пожаловать на главный экран!", 24),
            this.createProjectsPage(),
            this.createPage("Текущий проект: TotalStationWork\nОписание: Этот проект включает в себя работу с тотальными станциями для измерения расстояний и углов.", 20),
            this.createPage("Конец презентации!", 20),
        ];
    }

    private createPage(content: string, fontSize: number): StackPanel {
        const page = new StackPanel();
        const text = new TextBlock();
        text.text = content;
        text.color = "white";
        text.fontSize = fontSize;
        page.addControl(text);
        return page;
    }

    private createProjectsPage(): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        // Контейнер для заголовка
        const headerContainer = new StackPanel();
        headerContainer.height = "80px";
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const header = new TextBlock();
        header.text = "Выберите проект, чтобы увидеть описание:";
        header.color = "white";
        header.fontSize = 18;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
        headerContainer.addControl(header);
        page.addControl(headerContainer);
    
        // Контейнер для проектов
        const projectsContainer = new StackPanel();
        projectsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        projectsContainer.paddingTop = "5px"; // Добавляем отступ сверху
    
        // Массив проектов
        const projects = [
            {
                id: "project1",
                name: "TotalStationWork",
                description: "Работа с тотальными станциями для измерения расстояний и углов.",
                image: "models/image14.png",
                video: "path/to/total_station_work.mp4",
            },
            {
                id: "project2",
                name: "TotalStation",
                description: "Программное обеспечение для обработки данных с тотальной станции.",
                image: "path/to/total_station.jpg",
                video: null,
            },
        ];
        
        projects.forEach(({ id, name, description, image, video }) => {
            const cell = this.createProjectCell(id, name, description, image, video);
            projectsContainer.addControl(cell);
        });
    
        page.addControl(projectsContainer);
    
        return page;
    }
    

    private createProjectCell(id: string, name: string, description: string, image?: string, video?: string | null): Rectangle {
        const cell = new Rectangle();
        cell.width = "80%";
        cell.height = "30px";
        cell.color = "white";
        cell.background = "blue";
        cell.paddingTop = "2px";
        cell.paddingBottom = "2px";
        cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const cellText = new TextBlock();
        cellText.text = name;
        cellText.color = "white";
        cellText.fontSize = 14;
        cellText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cellText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        cell.addControl(cellText);
    
        // Если есть изображение, добавляем его во всплывающее окно планшета
        if (image) {
            cell.onPointerClickObservable.add(() => {
                // Создаем всплывающее окно
                const popup = new Rectangle();
                popup.width = "80%";
                popup.height = "80%";
                popup.color = "white";
                popup.background = "black";
                popup.cornerRadius = 10;
                popup.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                popup.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
                // Добавляем изображение во всплывающее окно
                const projectImage = new Image("image", image);
                projectImage.width = "30%";
                projectImage.height = "30%";
                projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Расположение в левом нижнем углу
        projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    
                // Логика увеличения/уменьшения изображения
                let isExpanded = false;
                projectImage.onPointerClickObservable.add(() => {
                    if (!isExpanded) {
                        projectImage.width = "100%";
                        projectImage.height = "100%";
                    } else {
                        projectImage.width = "30%";
                        projectImage.height = "30%";
                    }
                    isExpanded = !isExpanded;
                });
    
                popup.addControl(projectImage);
    
                // Кнопка закрытия окна
                const closeButton = this.createCloseButton(popup);
                popup.addControl(closeButton);
    
                this.guiTexture.addControl(popup); // Добавляем окно на планшет
            });
        }
    
        return cell;
    }
    

    
    
    


    /*private openProjectWindow(name: string, description: string) {
        const popup = new Rectangle();
        popup.width = "60%";
        popup.height = "60%";
        popup.background = "black";
        popup.color = "white";
        popup.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        popup.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        popup.alpha = 0.9;

        const header = new TextBlock();
        header.text = `Проект: ${name}`;
        header.color = "white";
        header.fontSize = 18;
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        popup.addControl(header);

        const content = new TextBlock();
        content.text = description;
        content.color = "white";
        content.fontSize = 16;
        content.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        content.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        popup.addControl(content);

        const closeButton = this.createCloseButton(popup);
        popup.addControl(closeButton);

        this.guiTexture.addControl(popup);
        this.popups.push(popup);  // Сохраняем всплывающее окно для дальнейшего управления
    }*/

        private createCloseButton(popup: Rectangle): Button {
            const closeButton = Button.CreateSimpleButton("close", "X");
            closeButton.width = "30px";
            closeButton.height = "30px";
            closeButton.color = "white";
            closeButton.background = "red";
            closeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT; // Выравниваем по правому краю
            closeButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Выравниваем по верхнему краю
            closeButton.paddingRight = "10px"; // Отступ от правого края
            closeButton.paddingTop = "10px"; // Отступ от верхнего края
        
            closeButton.onPointerClickObservable.add(() => {
                popup.isVisible = false;
                this.guiTexture.removeControl(popup); // Убираем всплывающее окно
            });
        
            return closeButton;
        }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.container.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updatePage();
        }
    }

    private navigate(direction: number) {
        const newIndex = this.currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < this.pages.length) {
            this.currentPageIndex = newIndex;
            this.updatePage();
        }
    }

    private updatePage() {
        this.container.clearControls();

        if (!this.navPanel) {
            this.navPanel = this.createNavigationPanel();
        }

        const navContainer = this.createNavContainer();
        navContainer.addControl(this.navPanel);

        this.container.addControl(navContainer);
        this.container.addControl(this.pages[this.currentPageIndex]);
    }

    private createNavigationPanel(): StackPanel {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.width = "100%";

        const prevButton = this.createNavButton("prev", "Previous", () => this.navigate(-1));
        const nextButton = this.createNavButton("next", "Next", () => this.navigate(1));

        panel.addControl(prevButton);
        panel.addControl(nextButton);

        return panel;
    }

    private createNavButton(id: string, label: string, callback: () => void): Button {
        const button = Button.CreateSimpleButton(id, label);
        button.width = "80px";
        button.height = "30px";
        button.color = "white";
        button.background = "gray";
        button.onPointerClickObservable.add(callback);
        return button;
    }

    private createNavContainer(): Rectangle {
        const container = new Rectangle();
        container.height = "60px";
        container.width = "100%";
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.thickness = 0;
        return container;
    }
}






































































import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, StackPanel, Control, Image } from "@babylonjs/gui";
import * as BABYLON from "babylonjs";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: StackPanel[] = [];
    private currentPageIndex: number = 0;
    private isVisible: boolean = false;
    private navPanel: StackPanel | null = null;
    private popups: Rectangle[] = [];  // Массив для хранения всплывающих окон
    private pageDescriptions: string[] = [];  // Массив для хранения описаний страниц
    
    constructor(private scene: BABYLON.Scene) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = this.createContainer();
        this.guiTexture.addControl(this.container);
        this.initializePages();
    }

    private createContainer(): Rectangle {
        const container = new Rectangle();
        container.width = "50%";
        container.height = "70%";
        container.background = "black";
        container.thickness = 2;
        container.color = "white";
        container.isVisible = false;
        return container;
    }

    private initializePages() {
        this.pageDescriptions = [
            "Добро пожаловать на главный экран!",
            "Текущий проект: TotalStationWork\nОписание: Этот проект включает в себя работу с тотальными станциями для измерения расстояний и углов.",
            "Конец презентации!"
        ];

        this.pages = [
            this.createPage(this.pageDescriptions[0], 24),
            this.createProjectsPage(),
            this.createPage(this.pageDescriptions[1], 20),
            this.createPage(this.pageDescriptions[2], 20),
        ];
    }
    
    private createPage(content: string, fontSize: number): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const headerContainer = new StackPanel();
        headerContainer.height = "80px";
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const text = new TextBlock();
        text.text = content;
        text.color = "white";
        text.fontSize = fontSize;
        text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        text.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        text.paddingTop = "10px";

        page.addControl(text);
        page.addControl(headerContainer);
        return page;
    }
    
    private createProjectsPage(): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const headerContainer = new StackPanel();
        headerContainer.height = "80px";
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const header = new TextBlock();
        header.text = "Выберите проект, чтобы увидеть описание:";
        header.color = "white";
        header.fontSize = 18;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        headerContainer.addControl(header);
        page.addControl(headerContainer);

        const projectsContainer = new StackPanel();
        projectsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        projectsContainer.paddingTop = "5px";

        const projects = [
            {
                id: "project1",
                name: "TotalStationWork",
                description: "Работа с тотальными станциями для измерения расстояний и углов.",
                image: "models/image14.png",
                video: "path/to/total_station_work.mp4",
            },
            {
                id: "project2",
                name: "TotalStation",
                description: "Программное обеспечение для обработки данных с тотальной станции.",
                image: "path/to/total_station.jpg",
                video: null,
            },
        ];

        projects.forEach(({ id, name, description, image, video }) => {
            const cell = this.createProjectCell(id, name, description, image, video);
            projectsContainer.addControl(cell);
        });

        page.addControl(projectsContainer);

        return page;
    }

    private createProjectCell(id: string, name: string, description: string, image?: string, video?: string | null): Rectangle {
        const cell = new Rectangle();
        cell.width = "80%";
        cell.height = "30px";
        cell.color = "white";
        cell.background = "blue";
        cell.paddingTop = "2px";
        cell.paddingBottom = "2px";
        cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const cellText = new TextBlock();
        cellText.text = name;
        cellText.color = "white";
        cellText.fontSize = 14;
        cellText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cellText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        cell.addControl(cellText);

        if (description) {
            cell.onPointerClickObservable.add(() => {
                const popup = this.createPopup(description, image);
                this.guiTexture.addControl(popup);
            });
        }

        return cell;
    }

    private createPopup(description: string, image?: string): Rectangle {
        const popup = new Rectangle();
        popup.width = "80%";
        popup.height = "80%";
        popup.color = "white";
        popup.background = "black";
        popup.cornerRadius = 10;
        popup.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        popup.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const projectDescription = new TextBlock();
        projectDescription.text = description;
        projectDescription.color = "white";
        projectDescription.fontSize = 16;
        projectDescription.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        projectDescription.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        popup.addControl(projectDescription);

        if (image) {
            const projectImage = new Image("image", image);
            projectImage.width = "30%";
            projectImage.height = "30%";
            projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

            let isExpanded = false;
            projectImage.onPointerClickObservable.add(() => {
                if (!isExpanded) {
                    projectImage.width = "100%";
                    projectImage.height = "100%";
                } else {
                    projectImage.width = "50%";
                    projectImage.height = "50%";
                }
                isExpanded = !isExpanded;
            });

            popup.addControl(projectImage);
        }

        const closeButton = this.createCloseButton(popup);
        popup.addControl(closeButton);

        return popup;
    }

    private createCloseButton(popup: Rectangle): Button {
        const closeButton = Button.CreateSimpleButton("close", "X");
        closeButton.width = "30px";
        closeButton.height = "30px";
        closeButton.color = "white";
        closeButton.background = "red";
        closeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        closeButton.paddingRight = "10px";
        closeButton.paddingTop = "10px";

        closeButton.onPointerClickObservable.add(() => {
            popup.isVisible = false;
            this.guiTexture.removeControl(popup);
        });

        return closeButton;
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.container.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updatePage();
        }
    }

    private navigate(direction: number) {
        const newIndex = this.currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < this.pages.length) {
            this.currentPageIndex = newIndex;
            this.updatePage();
        }
    }

    private updatePage() {
        this.container.clearControls();

        if (!this.navPanel) {
            this.navPanel = this.createNavigationPanel();
        }

        const navContainer = this.createNavContainer();
        navContainer.addControl(this.navPanel);

        this.container.addControl(navContainer);
        this.container.addControl(this.pages[this.currentPageIndex]);
    }

    private createNavigationPanel(): StackPanel {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.width = "100%";

        const prevButton = this.createNavButton("prev", "Previous", () => this.navigate(-1));
        const nextButton = this.createNavButton("next", "Next", () => this.navigate(1));

        panel.addControl(prevButton);
        panel.addControl(nextButton);

        return panel;
    }

    private createNavButton(id: string, label: string, callback: () => void): Button {
        const button = Button.CreateSimpleButton(id, label);
        button.width = "80px";
        button.height = "30px";
        button.color = "white";
        button.background = "gray";
        button.onPointerClickObservable.add(callback);
        return button;
    }

    private createNavContainer(): Rectangle {
        const container = new Rectangle();
        container.height = "60px";
        container.width = "100%";
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.thickness = 0;
        return container;
    }
}

















































import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, StackPanel, Control, Image } from "@babylonjs/gui";
import * as BABYLON from "babylonjs";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: StackPanel[] = [];
    private currentPageIndex: number = 0;
    private isVisible: boolean = false;
    private navPanel: StackPanel | null = null;
    private popups: Rectangle[] = [];  // Массив для хранения всплывающих окон
    private pageDescriptions: string[] = [];  // Массив для хранения описаний страниц
    
    constructor(private scene: BABYLON.Scene) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = this.createContainer();
        this.guiTexture.addControl(this.container);
        this.initializePages();
    }

    private createContainer(): Rectangle {
        const container = new Rectangle();
        container.width = "50%"; // Ширина контейнера
        container.height = "70%"; // Высота контейнера
        container.background = "black";
        container.thickness = 2;
        container.color = "white";
        container.isVisible = false;
        return container;
    }
    
    private initializePages() {
        this.pageDescriptions = [
            "Добро пожаловать на главный экран!",
            "Текущий проект: TotalStationWork\nОписание: Этот проект включает в себя работу с тотальными станциями для измерения расстояний и углов.",
            "Конец презентации!"
        ];
    
        this.pages = [
            this.createPage(this.pageDescriptions[0], 24),
            this.createProjectsPage(),
            this.createPage(this.pageDescriptions[1], 20),
            this.createPage(this.pageDescriptions[2], 20),
        ];
    }
    
    private createPage(content: string, fontSize: number): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const headerContainer = new StackPanel();
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        headerContainer.paddingTop = 10; // Добавляем отступ сверху
    
        const text = new TextBlock();
        text.text = content;
        text.color = "white";
        text.fontSize = fontSize;
        text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        text.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        text.paddingTop = "10px";
        text.width = "90%"; // Устанавливаем максимальную ширину текста
        text.textWrapping = true; // Разворачивание текста по ширине
    
        // Рассчитаем высоту контейнера для текста
        const lineHeight = fontSize + 4; // Дополнительные отступы
        const textLines = content.split('\n').length;
        const maxTextHeight = lineHeight * textLines + 60; // Увеличиваем еще больше дополнительную высоту для отступов
        headerContainer.height = `${Math.min(maxTextHeight, 400)}px`; // Ограничиваем максимальную высоту контейнера
    
        page.addControl(text);
        page.addControl(headerContainer);
        return page;
    }
    
    
    
    
    
    
    
    
    private createProjectsPage(): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const headerContainer = new StackPanel();
        headerContainer.height = "80px";
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const header = new TextBlock();
        header.text = "Выберите проект, чтобы увидеть описание:";
        header.color = "white";
        header.fontSize = 18;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
        headerContainer.addControl(header);
        page.addControl(headerContainer);
    
        const projectsContainer = new StackPanel();
        projectsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        projectsContainer.paddingTop = "5px";
    
        const projects = [
            {
                id: "project1",
                name: "TotalStationWork",
                description: "Работа с тотальными станциями для измерения расстояний и углов.",
                image: "models/image14.png",
                video: "path/to/total_station_work.mp4",
            },
            {
                id: "project2",
                name: "TotalStation",
                description: "Программное обеспечение для обработки данных с тотальной станции.",
                image: "path/to/total_station.jpg",
                video: null,
            },
        ];
    
        projects.forEach(({ id, name, description, image, video }) => {
            const cell = this.createProjectCell(id, name, description, image, video);
            projectsContainer.addControl(cell);
        });
    
        page.addControl(projectsContainer);
    
        return page;
    }
    

    private createProjectCell(id: string, name: string, description: string, image?: string, video?: string | null): Rectangle {
        const cell = new Rectangle();
        cell.width = "80%";
        cell.height = "30px";
        cell.color = "white";
        cell.background = "blue";
        cell.paddingTop = "2px";
        cell.paddingBottom = "2px";
        cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const cellText = new TextBlock();
        cellText.text = name;
        cellText.color = "white";
        cellText.fontSize = 14;
        cellText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cellText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        cell.addControl(cellText);

        if (description) {
            cell.onPointerClickObservable.add(() => {
                const popup = this.createPopup(description, image);
                this.guiTexture.addControl(popup);
            });
        }

        return cell;
    }

    private createPopup(description: string, image?: string): Rectangle {
        const popup = new Rectangle();
        popup.width = "80%";
        popup.height = "80%";
        popup.color = "white";
        popup.background = "black";
        popup.cornerRadius = 10;
        popup.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        popup.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const projectDescription = new TextBlock();
        projectDescription.text = description;
        projectDescription.color = "white";
        projectDescription.fontSize = 16;
        projectDescription.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        projectDescription.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        popup.addControl(projectDescription);

        if (image) {
            const projectImage = new Image("image", image);
            projectImage.width = "30%";
            projectImage.height = "30%";
            projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

            let isExpanded = false;
            projectImage.onPointerClickObservable.add(() => {
                if (!isExpanded) {
                    projectImage.width = "100%";
                    projectImage.height = "100%";
                } else {
                    projectImage.width = "50%";
                    projectImage.height = "50%";
                }
                isExpanded = !isExpanded;
            });

            popup.addControl(projectImage);
        }

        const closeButton = this.createCloseButton(popup);
        popup.addControl(closeButton);

        return popup;
    }

    private createCloseButton(popup: Rectangle): Button {
        const closeButton = Button.CreateSimpleButton("close", "X");
        closeButton.width = "30px";
        closeButton.height = "30px";
        closeButton.color = "white";
        closeButton.background = "red";
        closeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        closeButton.paddingRight = "10px";
        closeButton.paddingTop = "10px";

        closeButton.onPointerClickObservable.add(() => {
            popup.isVisible = false;
            this.guiTexture.removeControl(popup);
        });

        return closeButton;
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.container.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updatePage();
        }
    }

    private navigate(direction: number) {
        const newIndex = this.currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < this.pages.length) {
            this.currentPageIndex = newIndex;
            this.updatePage();
        }
    }

    private updatePage() {
        this.container.clearControls();

        if (!this.navPanel) {
            this.navPanel = this.createNavigationPanel();
        }

        const navContainer = this.createNavContainer();
        navContainer.addControl(this.navPanel);

        this.container.addControl(navContainer);
        this.container.addControl(this.pages[this.currentPageIndex]);
    }

    private createNavigationPanel(): StackPanel {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.width = "100%";

        const prevButton = this.createNavButton("prev", "Previous", () => this.navigate(-1));
        const nextButton = this.createNavButton("next", "Next", () => this.navigate(1));

        panel.addControl(prevButton);
        panel.addControl(nextButton);

        return panel;
    }

    private createNavButton(id: string, label: string, callback: () => void): Button {
        const button = Button.CreateSimpleButton(id, label);
        button.width = "80px";
        button.height = "30px";
        button.color = "white";
        button.background = "gray";
        button.onPointerClickObservable.add(callback);
        return button;
    }

    private createNavContainer(): Rectangle {
        const container = new Rectangle();
        container.height = "60px";
        container.width = "100%";
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.thickness = 0;
        return container;
    }
}













import {  
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  FreeCamera,
  HDRCubeTexture,
  HighlightLayer,
  SceneLoader,
  AbstractMesh,
  Mesh,
  Color3,
  ActionManager,
  ExecuteCodeAction,
  PointerEventTypes,
  Animation,
  Tools,
  Quaternion,
  PointerDragBehavior
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture,   } from "@babylonjs/gui";
import { TriggersManager } from "./FunctionComponents/TriggerManager3";
import { ModelLoader } from "./BaseComponents/ModelLoader";
import * as BABYLON from "@babylonjs/core";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
//import { TabletManager } from "./FunctionComponents/TabletManagerСalipers"; // Укажите правильный путь до TabletManager
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";

export class RulerScene {
  private scene: Scene;
  private engine: Engine;
  private camera!: FreeCamera;
  private triggerManager: TriggersManager;
  private guiTexture: AdvancedDynamicTexture;
  private highlightLayer: HighlightLayer;
  private modelLoader: ModelLoader;
  private handModel: Mesh | null = null;  // Используем Mesh вместо AbstractMesh
  private tools: { [key: string]: any } = {};
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  //tabletManager: TabletManager;
  private triggerManager1: TriggerManager2;
  private lastLogTime = 0; // Время последнего логирования
  private logInterval = 100; // Интервал логирования в миллисекундах
  private isMeasuring: boolean = false;
  private firstClickPosition: BABYLON.Vector3 | null = null;
  private secondClickPosition: BABYLON.Vector3 | null = null;



  
  constructor(private canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager1 = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.triggerManager = new TriggersManager(
      this.scene,
      this.canvas,
      this.guiTexture
    );
    // Инициализация загрузчика моделей
    this.modelLoader = new ModelLoader(this.scene);
    this.CreateHandModel(); // Загружаем модель
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
    this.CreateController();
    this.Page();
    // Инициализация TabletManager
    //this.tabletManager = new TabletManager();
    //this.tabletManager.createAlwaysVisibleTablet();
    //this.setupZoomEffect(); // Инициализация зума

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  private CreateScene(): Scene {
    const scene = new Scene(this.engine);
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

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


  private CreateController(): void { 
    this.camera = new FreeCamera("camera", new Vector3(14.3, 6.3, 5.0), this.scene);
    
    // Отключаем управление
    this.camera.detachControl();
    // Поворачиваем камеру влево на 90 градусов (поворот вокруг оси Y)
    this.camera.rotation.y -= Math.PI / 2; // -90 градусов
    // Дополнительные параметры камеры
    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.angularSensibility = 4000;
    this.camera.inertia = 0.8;

    // Увеличиваем поле зрения (FOV) в 2 раза
    this.camera.fov /= 2;
}

private async CreateEnvironment(): Promise<void> {
  try {
    const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_5.gltf", this.scene);
    map.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    this.setupWholeMeshes(map);

    const boundaryMeshes = map.filter(mesh => mesh.name.startsWith("SM_0_SpanStructureBeam"));
    if (boundaryMeshes.length === 0) {
      console.error("Ошибка: ограничивающие меши не найдены.");
      return;
    }
    console.log("Найдены ограничивающие меши:", boundaryMeshes.map(mesh => mesh.name));

    const minBoundary = new BABYLON.Vector3(
      Math.min(...boundaryMeshes.map(mesh => mesh.getBoundingInfo().boundingBox.minimumWorld.x)),
      Math.min(...boundaryMeshes.map(mesh => mesh.getBoundingInfo().boundingBox.minimumWorld.y)),
      Math.min(...boundaryMeshes.map(mesh => mesh.getBoundingInfo().boundingBox.minimumWorld.z))
    );

    const maxBoundary = new BABYLON.Vector3(
      Math.max(...boundaryMeshes.map(mesh => mesh.getBoundingInfo().boundingBox.maximumWorld.x)),
      Math.max(...boundaryMeshes.map(mesh => mesh.getBoundingInfo().boundingBox.maximumWorld.y)),
      Math.max(...boundaryMeshes.map(mesh => mesh.getBoundingInfo().boundingBox.maximumWorld.z))
    );

    console.log("Границы движения:", { minBoundary, maxBoundary });

    let targetPosition: BABYLON.Vector3 | null = null;
    const smoothingFactor = 0.1;
    let currentPosition = this.handModel ? this.handModel.position.clone() : BABYLON.Vector3.Zero();

    // Инициализация обработчиков событий с нужными аргументами
    this.initializeEventHandlers(minBoundary, maxBoundary, currentPosition, targetPosition, smoothingFactor);

  } catch (error) {
    console.error("Ошибка при загрузке окружения:", error);
  }
}

private async CreateHandModel(): Promise<void> {
  console.log("Загрузка модели штангенциркуля начата...");
  try {
      const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP_MOD_3.gltf", this.scene);
      if (meshes.length > 0) {
          this.handModel = meshes[0] as Mesh;
          this.tools['originalHandModelPosition'] = this.handModel.position.clone();
          this.tools['originalHandModelRotation'] = this.handModel.rotation.clone();

          const childMeshesNames = [
              "SM_10cm", "SM_20cm", "SM_30cm", "SM_40cm", "SM_50cm",
              "SM_60cm", "SM_70cm", "SM_80cm", "SM_90cm", "SM_100cm", "SM_110cm"
          ];
          const childMeshes: Mesh[] = [];

          childMeshesNames.forEach(childName => {
              const childMesh = meshes.find(mesh => mesh.name === childName) as Mesh;
              if (childMesh) {
                  this.tools[`${childName}Model`] = {
                      mesh: childMesh,
                      originalPosition: childMesh.position.clone(),
                      originalRotation: childMesh.rotation.clone(),
                  };
                  childMeshes.push(childMesh);
              }
          });

          this.enableChildScaling(childMeshes, this.handModel);

          this.handModel.position = new Vector3(13, 6.41004, 4.95);
          this.handModel.scaling = new Vector3(-1.5, -1.5, -1.5);
          this.handModel.rotation = new Vector3(Math.PI / 2, -Math.PI / 2, 0);
          this.handModel.isVisible = true;

          

          // Инициализация обработчиков для модели штангенциркуля
          this.initializeHandModelEventHandlers();

      } else {
          console.error("Ошибка: модель штангенциркуля не найдена в файле.");
      }

  } catch (error) {
      console.error("Ошибка при загрузке модели штангенциркуля:", error);
  }
}

private initializeEventHandlers(
  minBoundary: BABYLON.Vector3, 
  maxBoundary: BABYLON.Vector3, 
  currentPosition: BABYLON.Vector3 | null, 
  targetPosition: BABYLON.Vector3 | null, 
  smoothingFactor: number
): void {
  let isHandModelSet = false; // Флаг, чтобы отслеживать установку модели
  let handModelPositionAtClick: BABYLON.Vector3 | null = null; // Запоминаем начальную позицию модели при клике

  this.scene.onPointerObservable.add((event) => {
    // Событие клика для установки модели в точку
    if (event.type === BABYLON.PointerEventTypes.POINTERDOWN && !isHandModelSet) {
      const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
      if (pickInfo.hit && pickInfo.pickedPoint) {
        // Ограничаем движение модели по осям
        let newPosition = pickInfo.pickedPoint.clone();
        newPosition.x = Math.max(minBoundary.x, Math.min(maxBoundary.x, newPosition.x));
        newPosition.y = Math.max(minBoundary.y, Math.min(maxBoundary.y, newPosition.y));
        newPosition.z = Math.max(minBoundary.z, Math.min(maxBoundary.z, newPosition.z));

        if (this.handModel) {
          this.handModel.position = newPosition;
          handModelPositionAtClick = newPosition.clone(); // Запоминаем позицию при клике
        }
        isHandModelSet = true; // Модель установлена
        console.log('Рулетка установлена в точке:', newPosition);
      }
    }

    // Событие перемещения для обновления позиции модели
    if (event.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      // Если модель установлена, не сбрасываем её на курсор
      if (isHandModelSet && handModelPositionAtClick && this.handModel) {
        this.handModel.position = handModelPositionAtClick.clone(); // Оставляем модель на том месте, где была установлена
      }
    }

    // Событие колесика мыши для изменения оси Z
    if (event.type === BABYLON.PointerEventTypes.POINTERWHEEL && isHandModelSet) {
      const wheelEvent = event.event as WheelEvent;
      const delta = wheelEvent.deltaY > 0 ? 0.02 : -0.02;

      if (this.handModel) {
        // Обновляем только ось Z модели
        this.handModel.position.z = BABYLON.Scalar.Clamp(this.handModel.position.z + delta, 4.0, 5.5);
        console.log('Новое значение handModel по оси Z:', this.handModel.position.z);
      }
    }
  });

  // Добавим плавное перемещение, если нужно
  this.scene.onBeforeRenderObservable.add(() => {
    if (this.handModel && handModelPositionAtClick) {
      // Если нужно плавно перемещать модель, используем интерполяцию
      // Например, для позиции x, y, z
      const targetPosition = this.handModel.position;
      this.handModel.position = BABYLON.Vector3.Lerp(this.handModel.position, targetPosition, smoothingFactor);
    }
  });
}

private initializeHandModelEventHandlers(): void {
  let isHandModelSetLocally = false; // Локальный флаг для первого клика

  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERDOWN && !isHandModelSetLocally) { // Установка при первом клике
        const pointerRay = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        
        if (pointerRay.hit && pointerRay.pickedPoint && this.handModel) {
            this.handModel.position = pointerRay.pickedPoint.clone();
            isHandModelSetLocally = true;  // Модель установлена, флаг активирован
            console.log('Рулетка установлена в точке:', this.handModel.position);
        }
    }

    if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && isHandModelSetLocally) {
      return; // Игнорируем движения мыши после установки
    }

    if (event.type === BABYLON.PointerEventTypes.POINTERWHEEL && isHandModelSetLocally) {
        const wheelEvent = event.event as WheelEvent;
        const delta = wheelEvent.deltaY > 0 ? 0.02 : -0.02;
        
        if (this.handModel) {
          this.handModel.position.z = BABYLON.Scalar.Clamp(this.handModel.position.z + delta, 4.0, 5.5);
        }
    }
  });
}

private enableChildScaling(childMeshes: BABYLON.Mesh[], handModel: BABYLON.Mesh): void {
  let isRulerSet = false;
  const minZ = 4.0;
  const maxZ = 5.5;

  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      if (!isRulerSet) {
        const pointerRay = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        
        if (pointerRay.hit && pointerRay.pickedPoint) {
          handModel.position = pointerRay.pickedPoint.clone();
          isRulerSet = true;
          console.log('Рулетка установлена в точке:', handModel.position);
        } else {
          console.log("Объект не был выбран. Попробуйте кликнуть на другой участок сцены.");
        }
      }
    }

    if (event.type === BABYLON.PointerEventTypes.POINTERWHEEL && isRulerSet) {
      const wheelEvent = event.event as WheelEvent;
      const delta = wheelEvent.deltaY > 0 ? 0.02 : -0.02;
      
      if (handModel && handModel.isPickable) {
        handModel.position.z = BABYLON.Scalar.Clamp(handModel.position.z + delta, minZ, maxZ);
      }

      console.log(`Новое значение handModel по оси Z: ${handModel.position.z}`);

      const firstMesh = childMeshes[0];
      firstMesh.isVisible = true;

      for (let i = 1; i < childMeshes.length; i++) {
        const childMesh = childMeshes[i];

        let threshold = 0;
        if (i === 1) threshold = 0.0485;
        else if (i === 2) threshold = 0.144;
        else if (i === 3) threshold = 0.240;
        else if (i === 4) threshold = 0.336;
        else if (i === 5) threshold = 0.432;
        else if (i === 6) threshold = 0.530;
        else if (i === 7) threshold = 0.638;
        else if (i === 8) threshold = 0.738;
        else if (i === 9) threshold = 0.838;
        else if (i === 10) threshold = 0.938;

        if (handModel.position.z >= firstMesh.position.z + threshold) {
          childMesh.isVisible = true;
        } else {
          childMesh.isVisible = false;
        }
      }
    }
  });
}

private rotateModelOnKeyPress(): void {
  this.scene.onKeyboardObservable.add((kbInfo) => {
    if (this.handModel) {
      const rotationSpeed = 0.05;

      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
        switch (kbInfo.event.key.toLowerCase()) {
          case 'q': 
          case 'й': 
              this.handModel.rotate(BABYLON.Axis.Y, -rotationSpeed, BABYLON.Space.LOCAL);
              console.log('Rotate around Y-axis counter-clockwise');
              break;

          case 'e': 
          case 'у': 
              this.handModel.rotate(BABYLON.Axis.Y, rotationSpeed, BABYLON.Space.LOCAL);
              console.log('Rotate around Y-axis clockwise');
              break;

          default:
              console.log(`Key pressed: ${kbInfo.event.key}`);
              break;
        }
      }
    } else {
      console.warn('Hand model is not initialized!');
    }
  });
}




// Функция для сброса модели штангенциркуля в исходное положение и включения видимости
private resetModelPosition(): void {
  // Заданные координаты
  const forcedPosition = new BABYLON.Vector3(13.2, 6.41004, 4.85);
  
  if (this.handModel) {
      // Принудительно устанавливаем позицию основной модели
      this.handModel.position = forcedPosition.clone();
      console.log("Модель установлена в принудительную  позицию:", this.handModel.position);

      // Восстанавливаем видимость модели
      this.handModel.isVisible = true;
      console.log("Модель сделана видимой.");

      // Восстанавливаем дочернюю модель SM_Nonius, если она существует
      const noniusMesh = this.tools['noniusModel']?.mesh;
      if (noniusMesh) {
          // Устанавливаем начальные параметры для SM_Nonius
          noniusMesh.position = new Vector3(-0.03, 0, 0); // Смещение по оси X
          noniusMesh.rotation = new Vector3(0, 0, 0);
          noniusMesh.scaling = new Vector3(1, 1, 1);
          noniusMesh.isVisible = true;
          console.log("Дочерний элемент SM_Nonius возвращен в принудительное положение:", noniusMesh.position);
      } else {
          console.warn("Дочерний элемент SM_Nonius не найден.");
      }

      // Отключаем взаимодействие с моделью, если необходимо
      this.handModel.getBehaviorByName('dragBehavior')?.detach();
      console.log("Взаимодействие с моделью отключено.");
  } else {
      console.warn("Модель не найдена.");
  }
}

















































// Метод для настройки мешей типа "whole"
private setupWholeMeshes(mapMeshes: AbstractMesh[]): void {
  const wholeMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("whole"));
  wholeMeshes.forEach(mesh => {
      mesh.checkCollisions = true;
      mesh.isPickable = false; // "whole" остаются кликабельными
      mesh.visibility = 0;
      mesh.setEnabled(true);
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              console.log("Whole меш кликнут:", mesh.name, "Координаты:", mesh.position);
              this.scene.activeCamera = this.camera;
          })
      );
  });
}


 private  Page(): void {const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
    this.guiManager.CreateDialogBox([page1])
  
            this.triggerManager1.createStartButton('Начать', () => {
            // Показываем сообщение
            const page2 = this.dialogPage.addText("Нажмите на подсвеченную арматуру")
            const page3 = this.dialogPage.addText("Таким образом штангенциркуль замеряет арматуру")
            const page4 = this.dialogPage.addText("Проведите замеры оставшейся арматуры и кабеля и введите значения на следующей странице планшета")
            const page5 = this.dialogPage.addInputFields("Конструкции")
            this.guiManager.CreateDialogBox([page2, page3, page4, page5])
  
              // Активируем режим лазера для второй триггер-зоны
              //this.triggerManager2.distanceMode();
              //this.triggerManager2.enableDistanceMeasurement()
              this.triggerManager1.createStartButton('Завершить', () => {
                const page6 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для премещение на основную карту")
                this.guiManager.CreateDialogBox([page6])
                this.triggerManager1.disableDistanceMeasurement()
  
                //this.triggerManager2.exitDisLaserMode2();
                this.guiManager.createRouteButton('/test')
            })
  
            
            })
  
  }

}




─────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
│ 3  │ BabylonProject                 │ default     │ N/A     │ fork    │ N/A      │ 0      │ 657… │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 6  │ flask-server                   │ default     │ 0.0.0   │ fork    │ 0        │ 0      │ 15   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 7  │ flask-server                   │ default     │ N/A     │ fork    │ 0        │ 0      │ 15   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 0  │ vite-project                   │ default     │ N/A     │ fork    │ N/A      │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 1  │ vite-project                   │ default     │ N/A     │ fork    │ N/A      │ 0      │ 12   │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 2  │ vite-project                   │ default     │ N/A     │ fork    │ N/A      │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App BabylonInteraction differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 delete vite-project
[PM2] Applying action deleteProcessId on app [vite-project](ids: [ 0, 1, 2 ])
[PM2] [vite-project](0) ✓
[PM2] [vite-project](1) ✓
[PM2] [vite-project](2) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
│ 3  │ BabylonProject                 │ default     │ N/A     │ fork    │ N/A      │ 0      │ 657… │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 6  │ flask-server                   │ default     │ 0.0.0   │ fork    │ 0        │ 0      │ 15   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 7  │ flask-server                   │ default     │ N/A     │ fork    │ 0        │ 0      │ 15   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonInteraction differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 delete flask-server
[PM2] Applying action deleteProcessId on app [flask-server](ids: [ 6, 7 ])
[PM2] [flask-server](6) ✓
[PM2] [flask-server](7) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
│ 3  │ BabylonProject                 │ default     │ N/A     │ fork    │ N/A      │ 0      │ 657… │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonInteraction flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 delete BabylonProject
[PM2] Applying action deleteProcessId on app [BabylonProject](ids: [ 3 ])
[PM2] [BabylonProject](3) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
[sudo] password for uc:
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run dev
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 2183071  │ 0s     │ 0    │ online    │ 0%       │ 8.5mb    │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ sudo systemctl stop nginx
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
tcp6       0      0 :::5174                 :::*                    LISTEN
uc@uc:~/BabylonInteraction$ nano vite.config.js
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 10 ])
[PM2] [BabylonInteraction](10) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 2183155  │ 0s     │ 1    │ online    │ 0%       │ 13.3mb   │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ netstat -tuln | grep 5174
tcp6       0      0 :::5174                 :::*                    LISTEN
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo ufw allow 443
Rules updated
Rules updated (v6)
uc@uc:~/BabylonInteraction$ sudo ufw allow 5174
Rules updated
Rules updated (v6)
uc@uc:~/BabylonInteraction$ sudo systemctl stop nginx
uc@uc:~/BabylonInteraction$ sudo tail -f /var/log/nginx/error.log
2025/03/26 06:44:27 [alert] 2182288#2182288: *2 open socket #13 left in connection 3
2025/03/26 06:44:27 [alert] 2182288#2182288: aborting
2025/03/26 06:44:27 [alert] 2182289#2182289: *1 open socket #10 left in connection 3
2025/03/26 06:44:27 [alert] 2182289#2182289: aborting
^C
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo systemctl stop nginx
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ npm run dev

> bridge@0.0.0 dev
> vite --host

Port 5174 is in use, trying another one...

  VITE v5.4.11  ready in 319 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ uc@uc:~/BabylonInteraction$ ^C
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo systemctl stop nginx
uc@uc:~/BabylonInteraction$  pm2 list
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 2183155  │ 18m    │ 1    │ online    │ 0%       │ 71.2mb   │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 10 ])
[PM2] [BabylonInteraction](10) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 2183446  │ 0s     │ 2    │ online    │ 0%       │ 12.1mb   │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2055342  │ 33D    │ 0    │ online    │ 0%       │ 47.4mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ tail -f /var/log/nginx/error.log
tail: cannot open '/var/log/nginx/error.log' for reading: Permission denied
tail: no files remaining
uc@uc:~/BabylonInteraction$ sudo tail -f /var/log/nginx/error.log
2025/03/26 06:44:27 [alert] 2182288#2182288: *2 open socket #13 left in connection 3
2025/03/26 06:44:27 [alert] 2182288#2182288: aborting
2025/03/26 06:44:27 [alert] 2182289#2182289: *1 open socket #10 left in connection 3
2025/03/26 06:44:27 [alert] 2182289#2182289: aborting
^C
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ curl http://10.0.18.88:5174
<!doctype html>
<html lang="en">
  <head>
    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ pip install flask-socketio
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
uc@uc:~/BabylonInteraction$ python3 -m venv venv
The virtual environment was not created successfully because ensurepip is not
available.  On Debian/Ubuntu systems, you need to install the python3-venv
package using the following command.

    apt install python3.12-venv

You may need to use sudo with that command.  After installing the python3-venv
package, recreate your virtual environment.

Failing command: /home/uc/BabylonInteraction/venv/bin/python3

uc@uc:~/BabylonInteraction$ source venv/bin/activate
-bash: venv/bin/activate: No such file or directory
uc@uc:~/BabylonInteraction$ source venv/scripts/activate
-bash: venv/scripts/activate: No such file or directory
uc@uc:~/BabylonInteraction$ source venv/Scripts/activate
(venv) uc@uc:~/BabylonInteraction$ python3 -m venv venv
The virtual environment was not created successfully because ensurepip is not
available.  On Debian/Ubuntu systems, you need to install the python3-venv
package using the following command.

    apt install python3.12-venv

You may need to use sudo with that command.  After installing the python3-venv
package, recreate your virtual environment.

Failing command: /home/uc/BabylonInteraction/venv/bin/python3

(venv) uc@uc:~/BabylonInteraction$ pip install flask-socketio
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction$ sudo apt install pipx
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  python3-argcomplete python3-packaging python3-pip-whl python3-platformdirs python3-psutil python3-setuptools-whl python3-userpath python3-venv python3.12-venv
The following NEW packages will be installed:
  pipx python3-argcomplete python3-packaging python3-pip-whl python3-platformdirs python3-psutil python3-setuptools-whl python3-userpath python3-venv python3.12-venv
0 upgraded, 10 newly installed, 0 to remove and 161 not upgraded.
Need to get 3,508 kB of archives.
After this operation, 7,832 kB of additional disk space will be used.
Do you want to continue? [Y/n] Y
Get:1 http://ru.archive.ubuntu.com/ubuntu noble-updates/universe amd64 python3-pip-whl all 24.0+dfsg-1ubuntu1.1 [1,703 kB]
Get:2 http://ru.archive.ubuntu.com/ubuntu noble-updates/universe amd64 python3-setuptools-whl all 68.1.2-2ubuntu1.1 [716 kB]
Get:3 http://ru.archive.ubuntu.com/ubuntu noble-updates/universe amd64 python3.12-venv amd64 3.12.3-1ubuntu0.5 [5,678 B]
Get:4 http://ru.archive.ubuntu.com/ubuntu noble-updates/universe amd64 python3-venv amd64 3.12.3-0ubuntu2 [1,034 B]
Get:5 http://ru.archive.ubuntu.com/ubuntu noble-updates/universe amd64 python3-argcomplete all 3.1.4-1ubuntu0.1 [33.8 kB]
Get:6 http://ru.archive.ubuntu.com/ubuntu noble/main amd64 python3-packaging all 24.0-1 [41.1 kB]
Get:7 http://ru.archive.ubuntu.com/ubuntu noble/main amd64 python3-platformdirs all 4.2.0-1 [16.1 kB]
Get:8 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-userpath all 1.9.1-1 [9,416 B]
Get:9 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 pipx all 1.4.3-1 [787 kB]
Get:10 http://ru.archive.ubuntu.com/ubuntu noble/main amd64 python3-psutil amd64 5.9.8-2build2 [195 kB]
Fetched 3,508 kB in 0s (11.3 MB/s)
Selecting previously unselected package python3-pip-whl.
(Reading database ... 158158 files and directories currently installed.)
Preparing to unpack .../0-python3-pip-whl_24.0+dfsg-1ubuntu1.1_all.deb ...
Unpacking python3-pip-whl (24.0+dfsg-1ubuntu1.1) ...
Selecting previously unselected package python3-setuptools-whl.
Preparing to unpack .../1-python3-setuptools-whl_68.1.2-2ubuntu1.1_all.deb ...
Unpacking python3-setuptools-whl (68.1.2-2ubuntu1.1) ...
Selecting previously unselected package python3.12-venv.
Preparing to unpack .../2-python3.12-venv_3.12.3-1ubuntu0.5_amd64.deb ...
Unpacking python3.12-venv (3.12.3-1ubuntu0.5) ...
Selecting previously unselected package python3-venv.
Preparing to unpack .../3-python3-venv_3.12.3-0ubuntu2_amd64.deb ...
Unpacking python3-venv (3.12.3-0ubuntu2) ...
Selecting previously unselected package python3-argcomplete.
Preparing to unpack .../4-python3-argcomplete_3.1.4-1ubuntu0.1_all.deb ...
Unpacking python3-argcomplete (3.1.4-1ubuntu0.1) ...
Selecting previously unselected package python3-packaging.
Preparing to unpack .../5-python3-packaging_24.0-1_all.deb ...
Unpacking python3-packaging (24.0-1) ...
Selecting previously unselected package python3-platformdirs.
Preparing to unpack .../6-python3-platformdirs_4.2.0-1_all.deb ...
Unpacking python3-platformdirs (4.2.0-1) ...
Selecting previously unselected package python3-userpath.
Preparing to unpack .../7-python3-userpath_1.9.1-1_all.deb ...
Unpacking python3-userpath (1.9.1-1) ...
Selecting previously unselected package pipx.
Preparing to unpack .../8-pipx_1.4.3-1_all.deb ...
Unpacking pipx (1.4.3-1) ...
Selecting previously unselected package python3-psutil.
Preparing to unpack .../9-python3-psutil_5.9.8-2build2_amd64.deb ...
Unpacking python3-psutil (5.9.8-2build2) ...
Setting up python3-setuptools-whl (68.1.2-2ubuntu1.1) ...
Setting up python3-pip-whl (24.0+dfsg-1ubuntu1.1) ...
Setting up python3-platformdirs (4.2.0-1) ...
Setting up python3-psutil (5.9.8-2build2) ...
Setting up python3-packaging (24.0-1) ...
Setting up python3-argcomplete (3.1.4-1ubuntu0.1) ...
Setting up python3-userpath (1.9.1-1) ...
Setting up python3.12-venv (3.12.3-1ubuntu0.5) ...
Setting up python3-venv (3.12.3-0ubuntu2) ...
Setting up pipx (1.4.3-1) ...
Processing triggers for man-db (2.12.0-4build2) ...
Scanning processes...
Scanning candidates...
Scanning linux images...

Pending kernel upgrade!
Running kernel version:
  6.8.0-49-generic
Diagnostics:
  The currently running kernel version is not the expected kernel version 6.8.0-55-generic.

Restarting the system to load the new kernel will not be handled automatically, so you should consider rebooting.

Restarting services...

Service restarts being deferred:
 /etc/needrestart/restart.d/dbus.service
 systemctl restart systemd-logind.service
 systemctl restart unattended-upgrades.service

No containers need to be restarted.

User sessions running outdated binaries:
 avtodor @ session #118: login[925]
 avtodor @ user manager service: systemd[1673340]

No VM guests are running outdated hypervisor (qemu) binaries on this host.
(venv) uc@uc:~/BabylonInteraction$ pipx install flask-socketio
Note: Dependent package 'flask' contains 1 apps
  - flask

No apps associated with package flask-socketio. Try again with '--include-deps' to include apps of dependent packages, which are listed above. If you are attempting to install a library, pipx should not be used. Consider using pip or a similar tool instead.
(venv) uc@uc:~/BabylonInteraction$ deactivate
uc@uc:~/BabylonInteraction$ nano app.py
uc@uc:~/BabylonInteraction$ ls -la
total 412
drwxrwxr-x   8 uc uc   4096 Mar 26 10:08 .
drwxr-x---  10 uc uc   4096 Feb 13 08:13 ..
drwxrwxr-x   5 uc uc   4096 Mar 11 14:43 Backend
-rw-rw-r--   1 uc uc    734 Jan 14 13:10 eslint.config.js
-rw-rw-r--   1 uc uc    108 Jan 14 13:10 EventEmitter.ts
drwxrwxr-x   8 uc uc   4096 Mar 21 06:39 .git
-rw-rw-r--   1 uc uc    275 Jan 14 13:10 .gitignore
-rw-rw-r--   1 uc uc    366 Jan 14 13:10 index.html
-rw-rw-r--   1 uc uc    230 Mar 11 14:43 main.tsx
drwxrwxr-x 149 uc uc   4096 Jan 14 14:12 node_modules
-rw-rw-r--   1 uc uc   1224 Jan 28 08:18 package.json
-rw-rw-r--   1 uc uc 121344 Jan 28 08:18 package-lock.json
drwxrwxr-x   3 uc uc   4096 Jan 14 13:10 public
-rw-rw-r--   1 uc uc 221056 Feb 13 07:36 README.md
drwxrwxr-x   6 uc uc   4096 Mar 11 14:43 src
-rw-rw-r--   1 uc uc    552 Jan 14 13:10 tsconfig.app.json
-rw-rw-r--   1 uc uc    119 Jan 14 13:10 tsconfig.json
-rw-rw-r--   1 uc uc    479 Jan 14 13:10 tsconfig.node.json
drwxrwxr-x   8 uc uc   4096 Mar 26 10:03 venv
-rw-rw-r--   1 uc uc    727 Mar 26 09:26 vite.config.js
-rw-rw-r--   1 uc uc    377 Mar 26 09:41 vite.config.ts
uc@uc:~/BabylonInteraction$ cd Backend
uc@uc:~/BabylonInteraction/Backend$ ls -la
total 36
drwxrwxr-x 5 uc uc 4096 Mar 11 14:43 .
drwxrwxr-x 8 uc uc 4096 Mar 26 10:08 ..
-rw-rw-r-- 1 uc uc 4017 Mar 11 14:43 app.py
-rw-rw-r-- 1 uc uc  771 Mar 11 14:43 check_tables.py
-rw-rw-r-- 1 uc uc  488 Mar 11 14:43 manage.py
drwxrwxr-x 3 uc uc 4096 Mar 11 14:43 migrations
drwxrwxr-x 2 uc uc 4096 Mar 11 14:43 __pycache__
-rw-rw-r-- 1 uc uc    5 Jan 14 13:10 requirements.txt
drwxrwxr-x 4 uc uc 4096 Jan 14 13:10 venv
uc@uc:~/BabylonInteraction/Backend$ nano app.py
uc@uc:~/BabylonInteraction/Backend$ uc@uc:~/BabylonInteraction/Backend$ ^C
uc@uc:~/BabylonInteraction/Backend$ python app.py
Command 'python' not found, did you mean:
  command 'python3' from deb python3
  command 'python' from deb python-is-python3
uc@uc:~/BabylonInteraction/Backend$ python3 app.py
Traceback (most recent call last):
  File "/home/uc/BabylonInteraction/Backend/app.py", line 2, in <module>
    from flask_cors import CORS
ModuleNotFoundError: No module named 'flask_cors'
uc@uc:~/BabylonInteraction/Backend$ pip3 install flask-cors
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
uc@uc:~/BabylonInteraction/Backend$ source venv/Scripts/activate
(venv) uc@uc:~/BabylonInteraction/Backend$ pip3 install flask-cors
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ venv\Scripts\activate
venvScriptsactivate: command not found
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install flask flask-cors flask-sqlalchemy flask-migrate
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ sudo apt install pipx
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
pipx is already the newest version (1.4.3-1).
0 upgraded, 0 newly installed, 0 to remove and 161 not upgraded.
(venv) uc@uc:~/BabylonInteraction/Backend$ pipx install flask flask-cors flask-sqlalchemy flask-migrate
⚠️  Note: flask was already on your PATH at /usr/bin/flask
  installed package flask 3.1.0, installed using Python 3.12.3
  These apps are now globally available
    - flask
⚠️  Note: '/home/uc/.local/bin' is not on your PATH environment variable. These apps will not be globally accessible until your PATH is updated. Run `pipx ensurepath` to automatically add it, or manually modify your PATH in your shell's config file (i.e. ~/.bashrc).
done! ✨ 🌟 ✨
Note: Dependent package 'flask' contains 1 apps
  - flask

No apps associated with package flask-cors. Try again with '--include-deps' to include apps of dependent packages, which are listed above. If you are attempting to install a library, pipx should not be used. Consider using pip or a similar tool instead.
(venv) uc@uc:~/BabylonInteraction/Backend$ pipx install flask-cors flask-sqlalchemy flask-migrate --include-deps
⚠️  File exists at /home/uc/.local/bin/flask and points to /home/uc/.local/share/pipx/venvs/flask/bin/flask, not /home/uc/.local/share/pipx/venvs/flask-cors/bin/flask. Not modifying.
  installed package flask-cors 5.0.1, installed using Python 3.12.3
  These apps are now globally available
    - flask (symlink missing or pointing to unexpected location)
⚠️  Note: '/home/uc/.local/bin' is not on your PATH environment variable. These apps will not be globally accessible until your PATH is updated. Run `pipx ensurepath` to automatically add it, or manually modify your PATH in your shell's config file (i.e. ~/.bashrc).
done! ✨ 🌟 ✨
⚠️  File exists at /home/uc/.local/bin/flask and points to /home/uc/.local/share/pipx/venvs/flask/bin/flask, not /home/uc/.local/share/pipx/venvs/flask-sqlalchemy/bin/flask. Not modifying.
  installed package flask-sqlalchemy 3.1.1, installed using Python 3.12.3
  These apps are now globally available
    - flask (symlink missing or pointing to unexpected location)
⚠️  Note: '/home/uc/.local/bin' is not on your PATH environment variable. These apps will not be globally accessible until your PATH is updated. Run `pipx ensurepath` to automatically add it, or manually modify your PATH in your shell's config file (i.e. ~/.bashrc).
done! ✨ 🌟 ✨
⚠️  File exists at /home/uc/.local/bin/flask and points to /home/uc/.local/share/pipx/venvs/flask/bin/flask, not /home/uc/.local/share/pipx/venvs/flask-migrate/bin/flask. Not modifying.
  installed package flask-migrate 4.1.0, installed using Python 3.12.3
  These apps are now globally available
    - alembic
    - mako-render
    - flask (symlink missing or pointing to unexpected location)
⚠️  Note: '/home/uc/.local/bin' is not on your PATH environment variable. These apps will not be globally accessible until your PATH is updated. Run `pipx ensurepath` to automatically add it, or manually modify your PATH in your shell's config file (i.e. ~/.bashrc).
done! ✨ 🌟 ✨
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install flask-cors flask-sqlalchemy flask-migrate
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ pipx install flask-cors flask-sqlalchemy flask-migrate --include-deps
'flask-cors' already seems to be installed. Not modifying existing installation in '/home/uc/.local/share/pipx/venvs/flask-cors'. Pass '--force' to force installation.
(venv) uc@uc:~/BabylonInteraction/Backend$ which pip
/usr/bin/pip
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install flask-cors flask-sqlalchemy flask-migrate --break-system-packages
Defaulting to user installation because normal site-packages is not writeable
Collecting flask-cors
  Using cached flask_cors-5.0.1-py3-none-any.whl.metadata (961 bytes)
Collecting flask-sqlalchemy
  Using cached flask_sqlalchemy-3.1.1-py3-none-any.whl.metadata (3.4 kB)
Collecting flask-migrate
  Using cached Flask_Migrate-4.1.0-py3-none-any.whl.metadata (3.3 kB)
Requirement already satisfied: flask>=0.9 in /usr/lib/python3/dist-packages (from flask-cors) (3.0.2)
Requirement already satisfied: Werkzeug>=0.7 in /usr/lib/python3/dist-packages (from flask-cors) (3.0.1)
Collecting sqlalchemy>=2.0.16 (from flask-sqlalchemy)
  Using cached sqlalchemy-2.0.39-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (9.6 kB)
Collecting alembic>=1.9.0 (from flask-migrate)
  Using cached alembic-1.15.1-py3-none-any.whl.metadata (7.2 kB)
Collecting Mako (from alembic>=1.9.0->flask-migrate)
  Using cached Mako-1.3.9-py3-none-any.whl.metadata (2.9 kB)
Collecting typing-extensions>=4.12 (from alembic>=1.9.0->flask-migrate)
  Using cached typing_extensions-4.13.0-py3-none-any.whl.metadata (3.0 kB)
Requirement already satisfied: Jinja2>=3.1.2 in /usr/lib/python3/dist-packages (from flask>=0.9->flask-cors) (3.1.2)
Requirement already satisfied: itsdangerous>=2.1.2 in /usr/lib/python3/dist-packages (from flask>=0.9->flask-cors) (2.1.2)
Requirement already satisfied: click>=8.1.3 in /usr/lib/python3/dist-packages (from flask>=0.9->flask-cors) (8.1.6)
Requirement already satisfied: blinker>=1.6.2 in /usr/lib/python3/dist-packages (from flask>=0.9->flask-cors) (1.7.0)
Collecting greenlet!=0.4.17 (from sqlalchemy>=2.0.16->flask-sqlalchemy)
  Using cached greenlet-3.1.1-cp312-cp312-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl.metadata (3.8 kB)
Requirement already satisfied: MarkupSafe>=2.1.1 in /usr/lib/python3/dist-packages (from Werkzeug>=0.7->flask-cors) (2.1.5)
Using cached flask_cors-5.0.1-py3-none-any.whl (11 kB)
Using cached flask_sqlalchemy-3.1.1-py3-none-any.whl (25 kB)
Using cached Flask_Migrate-4.1.0-py3-none-any.whl (21 kB)
Using cached alembic-1.15.1-py3-none-any.whl (231 kB)
Using cached sqlalchemy-2.0.39-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (3.3 MB)
Using cached greenlet-3.1.1-cp312-cp312-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl (613 kB)
Using cached typing_extensions-4.13.0-py3-none-any.whl (45 kB)
Using cached Mako-1.3.9-py3-none-any.whl (78 kB)
Installing collected packages: typing-extensions, Mako, greenlet, sqlalchemy, flask-sqlalchemy, flask-cors, alembic, flask-migrate
  WARNING: The script mako-render is installed in '/home/uc/.local/bin' which is not on PATH.
  Consider adding this directory to PATH or, if you prefer to suppress this warning, use --no-warn-script-location.
  WARNING: The script alembic is installed in '/home/uc/.local/bin' which is not on PATH.
  Consider adding this directory to PATH or, if you prefer to suppress this warning, use --no-warn-script-location.
Successfully installed Mako-1.3.9 alembic-1.15.1 flask-cors-5.0.1 flask-migrate-4.1.0 flask-sqlalchemy-3.1.1 greenlet-3.1.1 sqlalchemy-2.0.39 typing-extensions-4.13.0
(venv) uc@uc:~/BabylonInteraction/Backend$ python3 app.py
Traceback (most recent call last):
  File "/home/uc/BabylonInteraction/Backend/app.py", line 5, in <module>
    from flask_socketio import SocketIO  # Импортируем SocketIO
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
ModuleNotFoundError: No module named 'flask_socketio'
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install flask-socketio
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install flask-socketio --break-system-packages
Defaulting to user installation because normal site-packages is not writeable
Collecting flask-socketio
  Using cached Flask_SocketIO-5.5.1-py3-none-any.whl.metadata (2.6 kB)
Requirement already satisfied: Flask>=0.9 in /usr/lib/python3/dist-packages (from flask-socketio) (3.0.2)
Collecting python-socketio>=5.12.0 (from flask-socketio)
  Using cached python_socketio-5.12.1-py3-none-any.whl.metadata (3.2 kB)
Requirement already satisfied: Werkzeug>=3.0.0 in /usr/lib/python3/dist-packages (from Flask>=0.9->flask-socketio) (3.0.1)
Requirement already satisfied: Jinja2>=3.1.2 in /usr/lib/python3/dist-packages (from Flask>=0.9->flask-socketio) (3.1.2)
Requirement already satisfied: itsdangerous>=2.1.2 in /usr/lib/python3/dist-packages (from Flask>=0.9->flask-socketio) (2.1.2)
Requirement already satisfied: click>=8.1.3 in /usr/lib/python3/dist-packages (from Flask>=0.9->flask-socketio) (8.1.6)
Requirement already satisfied: blinker>=1.6.2 in /usr/lib/python3/dist-packages (from Flask>=0.9->flask-socketio) (1.7.0)
Collecting bidict>=0.21.0 (from python-socketio>=5.12.0->flask-socketio)
  Using cached bidict-0.23.1-py3-none-any.whl.metadata (8.7 kB)
Collecting python-engineio>=4.11.0 (from python-socketio>=5.12.0->flask-socketio)
  Using cached python_engineio-4.11.2-py3-none-any.whl.metadata (2.2 kB)
Collecting simple-websocket>=0.10.0 (from python-engineio>=4.11.0->python-socketio>=5.12.0->flask-socketio)
  Using cached simple_websocket-1.1.0-py3-none-any.whl.metadata (1.5 kB)
Requirement already satisfied: MarkupSafe>=2.1.1 in /usr/lib/python3/dist-packages (from Werkzeug>=3.0.0->Flask>=0.9->flask-socketio) (2.1.5)
Collecting wsproto (from simple-websocket>=0.10.0->python-engineio>=4.11.0->python-socketio>=5.12.0->flask-socketio)
  Using cached wsproto-1.2.0-py3-none-any.whl.metadata (5.6 kB)
Collecting h11<1,>=0.9.0 (from wsproto->simple-websocket>=0.10.0->python-engineio>=4.11.0->python-socketio>=5.12.0->flask-socketio)
  Using cached h11-0.14.0-py3-none-any.whl.metadata (8.2 kB)
Using cached Flask_SocketIO-5.5.1-py3-none-any.whl (18 kB)
Using cached python_socketio-5.12.1-py3-none-any.whl (76 kB)
Using cached bidict-0.23.1-py3-none-any.whl (32 kB)
Using cached python_engineio-4.11.2-py3-none-any.whl (59 kB)
Using cached simple_websocket-1.1.0-py3-none-any.whl (13 kB)
Using cached wsproto-1.2.0-py3-none-any.whl (24 kB)
Using cached h11-0.14.0-py3-none-any.whl (58 kB)
Installing collected packages: h11, bidict, wsproto, simple-websocket, python-engineio, python-socketio, flask-socketio
Successfully installed bidict-0.23.1 flask-socketio-5.5.1 h11-0.14.0 python-engineio-4.11.2 python-socketio-5.12.1 simple-websocket-1.1.0 wsproto-1.2.0
(venv) uc@uc:~/BabylonInteraction/Backend$ pipx install flask-socketio
Note: Dependent package 'flask' contains 1 apps
  - flask

No apps associated with package flask-socketio. Try again with '--include-deps' to include apps of dependent packages, which are listed above. If you are attempting to install a library, pipx should not be used. Consider using pip or a similar tool instead.
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install flask-socketio
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ python3 app.py
Traceback (most recent call last):
  File "/home/uc/BabylonInteraction/Backend/app.py", line 15, in <module>
    db = SQLAlchemy(app)
         ^^^^^^^^^^^^^^^
  File "/home/uc/.local/lib/python3.12/site-packages/flask_sqlalchemy/extension.py", line 278, in __init__
    self.init_app(app)
  File "/home/uc/.local/lib/python3.12/site-packages/flask_sqlalchemy/extension.py", line 374, in init_app
    engines[key] = self._make_engine(key, options, app)
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/uc/.local/lib/python3.12/site-packages/flask_sqlalchemy/extension.py", line 665, in _make_engine
    return sa.engine_from_config(options, prefix="")
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/uc/.local/lib/python3.12/site-packages/sqlalchemy/engine/create.py", line 823, in engine_from_config
    return create_engine(url, **options)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 2, in create_engine
  File "/home/uc/.local/lib/python3.12/site-packages/sqlalchemy/util/deprecations.py", line 281, in warned
    return fn(*args, **kwargs)  # type: ignore[no-any-return]
           ^^^^^^^^^^^^^^^^^^^
  File "/home/uc/.local/lib/python3.12/site-packages/sqlalchemy/engine/create.py", line 602, in create_engine
    dbapi = dbapi_meth(**dbapi_args)
            ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/uc/.local/lib/python3.12/site-packages/sqlalchemy/dialects/postgresql/psycopg2.py", line 696, in import_dbapi
    import psycopg2
ModuleNotFoundError: No module named 'psycopg2'
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install psycopg2
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install psycopg2-binary
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install psycopg2-binary --break-system-packages
Defaulting to user installation because normal site-packages is not writeable
Collecting psycopg2-binary
  Downloading psycopg2_binary-2.9.10-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (4.9 kB)
Downloading psycopg2_binary-2.9.10-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (3.0 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.0/3.0 MB 4.1 MB/s eta 0:00:00
Installing collected packages: psycopg2-binary
Successfully installed psycopg2-binary-2.9.10
(venv) uc@uc:~/BabylonInteraction/Backend$ pip install -r requirements.txt
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction/Backend$ python3 app.py
 * Serving Flask app 'app'
 * Debug mode: off
Address already in use
Port 5174 is in use by another program. Either identify and stop that program, or start the server with a different port.
(venv) uc@uc:~/BabylonInteraction/Backend$ nano app.py
(venv) uc@uc:~/BabylonInteraction/Backend$ python3 app.py
 * Serving Flask app 'app'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://10.0.18.88:5000
Press CTRL+C to quit
^C(venv) uc@uc:~/BabylonInteraction/Backend$ deactivate
uc@uc:~/BabylonInteraction/Backend$ npm install socket.io-client

added 8 packages, changed 3 packages, and audited 227 packages in 3s

44 packages are looking for funding
  run `npm fund` for details

3 moderate severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
uc@uc:~/BabylonInteraction/Backend$ cd ..
uc@uc:~/BabylonInteraction$ la -la
total 416
drwxrwxr-x   8 uc uc   4096 Mar 26 10:08 .
drwxr-x---  10 uc uc   4096 Feb 13 08:13 ..
drwxrwxr-x   5 uc uc   4096 Mar 26 10:24 Backend
-rw-rw-r--   1 uc uc    734 Jan 14 13:10 eslint.config.js
-rw-rw-r--   1 uc uc    108 Jan 14 13:10 EventEmitter.ts
drwxrwxr-x   8 uc uc   4096 Mar 21 06:39 .git
-rw-rw-r--   1 uc uc    275 Jan 14 13:10 .gitignore
-rw-rw-r--   1 uc uc    366 Jan 14 13:10 index.html
-rw-rw-r--   1 uc uc    230 Mar 11 14:43 main.tsx
drwxrwxr-x 156 uc uc   4096 Mar 26 10:29 node_modules
-rw-rw-r--   1 uc uc   1258 Mar 26 10:29 package.json
-rw-rw-r--   1 uc uc 124407 Mar 26 10:29 package-lock.json
drwxrwxr-x   3 uc uc   4096 Jan 14 13:10 public
-rw-rw-r--   1 uc uc 221056 Feb 13 07:36 README.md
drwxrwxr-x   6 uc uc   4096 Mar 11 14:43 src
-rw-rw-r--   1 uc uc    552 Jan 14 13:10 tsconfig.app.json
-rw-rw-r--   1 uc uc    119 Jan 14 13:10 tsconfig.json
-rw-rw-r--   1 uc uc    479 Jan 14 13:10 tsconfig.node.json
drwxrwxr-x   8 uc uc   4096 Mar 26 10:03 venv
-rw-rw-r--   1 uc uc    727 Mar 26 09:26 vite.config.js
-rw-rw-r--   1 uc uc    377 Mar 26 09:41 vite.config.ts
uc@uc:~/BabylonInteraction$ cd src
uc@uc:~/BabylonInteraction/src$ la -la
total 44
drwxrwxr-x 6 uc uc 4096 Mar 11 14:43 .
drwxrwxr-x 8 uc uc 4096 Mar 26 10:08 ..
-rw-rw-r-- 1 uc uc  339 Mar 11 14:43 app.css
-rw-rw-r-- 1 uc uc  338 Jan 14 13:10 App.css
-rw-rw-r-- 1 uc uc 3097 Jan 28 08:18 App.tsx
drwxrwxr-x 2 uc uc 4096 Feb 13 07:36 assets
drwxrwxr-x 5 uc uc 4096 Mar  4 12:01 BabylonExamples
drwxrwxr-x 4 uc uc 4096 Mar 11 15:15 components
-rw-rw-r-- 1 uc uc  234 Mar 11 14:43 main.tsx
drwxrwxr-x 2 uc uc 4096 Jan 14 13:10 types
-rw-rw-r-- 1 uc uc   38 Jan 14 13:10 vite-env.d.ts
uc@uc:~/BabylonInteraction/src$ cd components
uc@uc:~/BabylonInteraction/src/components$ la -la
total 112
drwxrwxr-x 4 uc uc  4096 Mar 11 15:15 .
drwxrwxr-x 6 uc uc  4096 Mar 11 14:43 ..
-rw-rw-r-- 1 uc uc   727 Mar 10 07:40 BabylonBeton.tsx
-rw-rw-r-- 1 uc uc  3474 Jan 14 13:10 BabylonBook2.tsx
-rw-rw-r-- 1 uc uc  3454 Jan 14 13:10 BabylonBook.tsx
-rw-rw-r-- 1 uc uc   566 Jan 14 13:10 BabylonDistance.tsx
-rw-rw-r-- 1 uc uc  1062 Mar 10 07:40 BabylonFull.tsx
drwxrwxr-x 2 uc uc  4096 Mar 11 14:43 BabylonLabotary
-rw-rw-r-- 1 uc uc   598 Jan 28 08:18 BabylonNewDistance.tsx
-rw-rw-r-- 1 uc uc  2477 Feb 13 07:36 BabylonQuestion.tsx
-rw-rw-r-- 1 uc uc   805 Jan 28 08:18 BabylonRuler.tsx
-rw-rw-r-- 1 uc uc   546 Jan 14 13:10 BabylonTest2.tsx
-rw-rw-r-- 1 uc uc   464 Mar  4 12:01 BabylonTest.tsx
-rw-rw-r-- 1 uc uc   568 Jan 14 13:10 BabylonTexture.tsx
-rw-rw-r-- 1 uc uc   766 Mar 10 07:40 BabylonTotal.tsx
-rw-rw-r-- 1 uc uc   786 Mar 10 07:40 BabylonTotalWork.tsx
-rw-rw-r-- 1 uc uc   820 Jan 14 13:10 BabylonTutor.tsx
-rw-rw-r-- 1 uc uc  1701 Jan 14 13:10 DesktopModal.tsx
-rw-rw-r-- 1 uc uc 11328 Jan 14 13:10 GUIManager.ts
-rw-rw-r-- 1 uc uc   893 Mar 10 07:40 Level.tsx
-rw-rw-r-- 1 uc uc  2352 Jan 28 08:18 MainPage.tsx
-rw-rw-r-- 1 uc uc   774 Jan 14 13:10 ModalWindow.tsx
-rw-rw-r-- 1 uc uc  2445 Jan 28 08:18 QuizContent.tsx
drwxrwxr-x 2 uc uc  4096 Feb 13 07:36 styles
-rw-rw-r-- 1 uc uc   617 Jan 28 08:18 TermPage.tsx
-rw-rw-r-- 1 uc uc   209 Jan 14 13:10 Tutor.tsx
uc@uc:~/BabylonInteraction/src/components$ nano BabylonFull.tsx
uc@uc:~/BabylonInteraction/src/components$ uc@uc:~/BabylonInteraction/src/components$ ^C
uc@uc:~/BabylonInteraction/src/components$ sudo systemctl restart nginx
[sudo] password for uc:
uc@uc:~/BabylonInteraction/src/components$ pm2 restart all
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [all](ids: [ 5, 10 ])
[PM2] [BabylonInteraction-Branch74](5) ✓
[PM2] [BabylonInteraction](10) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 2184278  │ 0s     │ 3    │ online    │ 0%       │ 12.4mb   │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2184260  │ 0s     │ 1    │ online    │ 0%       │ 52.7mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction/src/components$ sudo systemctl status nginx
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Wed 2025-03-26 10:35:55 UTC; 21s ago
       Docs: man:nginx(8)
    Process: 2184235 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
    Process: 2184237 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
   Main PID: 2184238 (nginx)
      Tasks: 3 (limit: 4556)
     Memory: 2.7M (peak: 2.9M)
        CPU: 21ms
     CGroup: /system.slice/nginx.service
             ├─2184238 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"
             ├─2184239 "nginx: worker process"
             └─2184240 "nginx: worker process"

Mar 26 10:35:55 uc systemd[1]: Starting nginx.service - A high performance web server and a reverse proxy server...
Mar 26 10:35:55 uc systemd[1]: Started nginx.service - A high performance web server and a reverse proxy server.
uc@uc:~/BabylonInteraction/src/components$ sudo ufw allow 5174/tcp
Rules updated
Rules updated (v6)
uc@uc:~/BabylonInteraction/src/components$ sudo ufw reload
Firewall not enabled (skipping reload)
uc@uc:~/BabylonInteraction/src/components$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
uc@uc:~/BabylonInteraction/src/components$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src/components$ pm2 logs
[TAILING] Tailing last 15 lines for [all] processes (change the value with --lines option)
/home/uc/.pm2/pm2.log last 15 lines:
PM2        | 2025-03-26T09:52:57: PM2 log: Stopping app:BabylonInteraction id:10
PM2        | 2025-03-26T09:52:57: PM2 log: App [BabylonInteraction:10] exited with code [0] via signal [SIGINT]
PM2        | 2025-03-26T09:52:57: PM2 log: pid=2183155 msg=process killed
PM2        | 2025-03-26T09:52:57: PM2 log: App [BabylonInteraction:10] starting in -fork mode-
PM2        | 2025-03-26T09:52:57: PM2 log: App [BabylonInteraction:10] online
PM2        | 2025-03-26T10:36:02: PM2 log: Stopping app:BabylonInteraction-Branch74 id:5
PM2        | 2025-03-26T10:36:02: PM2 log: App [BabylonInteraction-Branch74:5] exited with code [0] via signal [SIGINT]
PM2        | 2025-03-26T10:36:02: PM2 log: pid=2055342 msg=process killed
PM2        | 2025-03-26T10:36:02: PM2 log: App [BabylonInteraction-Branch74:5] starting in -fork mode-
PM2        | 2025-03-26T10:36:02: PM2 log: App [BabylonInteraction-Branch74:5] online
PM2        | 2025-03-26T10:36:02: PM2 log: Stopping app:BabylonInteraction id:10
PM2        | 2025-03-26T10:36:02: PM2 log: App [BabylonInteraction:10] exited with code [0] via signal [SIGINT]
PM2        | 2025-03-26T10:36:02: PM2 log: pid=2183446 msg=process killed
PM2        | 2025-03-26T10:36:02: PM2 log: App [BabylonInteraction:10] starting in -fork mode-
PM2        | 2025-03-26T10:36:02: PM2 log: App [BabylonInteraction:10] online

/home/uc/.pm2/logs/BabylonInteraction-Branch74-error.log last 15 lines:
5|BabylonI |   5  |  import './src/app.css';
5|BabylonI |      |          ^
5|BabylonI |   6  |  createRoot(document.getElementById('root')).render(/*#__PURE__*/ _jsxDEV(StrictMode, {
5|BabylonI |   7  |      children: /*#__PURE__*/ _jsxDEV(App, {}, void 0, false, {
5|BabylonI |       at TransformPluginContext._formatError (file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49255:41)
5|BabylonI |       at TransformPluginContext.error (file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49250:16)
5|BabylonI |       at normalizeUrl (file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:64041:23)
5|BabylonI |       at async file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:64173:39
5|BabylonI |       at async Promise.all (index 4)
5|BabylonI |       at async TransformPluginContext.transform (file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:64100:7)
5|BabylonI |       at async PluginContainer.transform (file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49096:18)
5|BabylonI |       at async loadAndTransform (file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:51929:27)
5|BabylonI |       at async viteTransformMiddleware (file:///home/uc/BabylonInteraction-Branch74/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:61881:24)
5|BabylonI | The file does not exist at "/home/uc/BabylonInteraction-Branch74/node_modules/.vite/deps/pbr.vertex-YLADUBSE.js?v=886d4dcd" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
5|BabylonI | The file does not exist at "/home/uc/BabylonInteraction-Branch74/node_modules/.vite/deps/pbr.fragment-JYBTRROE.js?v=886d4dcd" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.

/home/uc/.pm2/logs/BabylonInteraction-error.log last 15 lines:
10|Babylon |     at listenInCluster (node:net:1859:12)
10|Babylon |     at GetAddrInfoReqWrap.doListen [as callback] (node:net:2008:7)
10|Babylon |     at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:109:8)
10|Babylon | WebSocket server error:
10|Babylon | Error: listen EADDRNOTAVAIL: address not available 10.0.18.237:5174
10|Babylon |     at Server.setupListenHandle [as _listen2] (node:net:1794:21)
10|Babylon |     at listenInCluster (node:net:1859:12)
10|Babylon |     at GetAddrInfoReqWrap.doListen [as callback] (node:net:2008:7)
10|Babylon |     at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:109:8)
10|Babylon | WebSocket server error:
10|Babylon | Error: listen EADDRNOTAVAIL: address not available 10.0.18.237:5174
10|Babylon |     at Server.setupListenHandle [as _listen2] (node:net:1794:21)
10|Babylon |     at listenInCluster (node:net:1859:12)
10|Babylon |     at GetAddrInfoReqWrap.doListen [as callback] (node:net:2008:7)
10|Babylon |     at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:109:8)

/home/uc/.pm2/logs/BabylonInteraction-Branch74-out.log last 15 lines:
5|BabylonI |
5|BabylonI |
5|BabylonI |   VITE v5.4.11  ready in 433 ms
5|BabylonI |
5|BabylonI |   ➜  Local:   http://localhost:5173/
5|BabylonI |   ➜  Network: http://10.0.18.88:5173/
5|BabylonI |
5|BabylonI | > bridge@0.0.0 dev
5|BabylonI | > vite --host
5|BabylonI |
5|BabylonI |
5|BabylonI |   VITE v5.4.11  ready in 488 ms
5|BabylonI |
5|BabylonI |   ➜  Local:   http://localhost:5173/
5|BabylonI |   ➜  Network: http://10.0.18.88:5173/

/home/uc/.pm2/logs/BabylonInteraction-out.log last 15 lines:
10|Babylon |   VITE v5.4.11  ready in 307 ms
10|Babylon |
10|Babylon |   ➜  Local:   http://localhost:5174/
10|Babylon |   ➜  Network: http://10.0.18.88:5174/
10|Babylon | 10:33:26 AM [vite] page reload src/components/BabylonFull.tsx
10|Babylon |
10|Babylon | > bridge@0.0.0 dev
10|Babylon | > vite --host
10|Babylon |
10|Babylon | Re-optimizing dependencies because lockfile has changed
10|Babylon |
10|Babylon |   VITE v5.4.11  ready in 715 ms
10|Babylon |
10|Babylon |   ➜  Local:   http://localhost:5174/
10|Babylon |   ➜  Network: http://10.0.18.88:5174/

^C
uc@uc:~/BabylonInteraction/src/components$ cd ..
uc@uc:~/BabylonInteraction/src$ ls -la
total 44
drwxrwxr-x 6 uc uc 4096 Mar 11 14:43 .
drwxrwxr-x 8 uc uc 4096 Mar 26 10:36 ..
-rw-rw-r-- 1 uc uc  339 Mar 11 14:43 app.css
-rw-rw-r-- 1 uc uc  338 Jan 14 13:10 App.css
-rw-rw-r-- 1 uc uc 3097 Jan 28 08:18 App.tsx
drwxrwxr-x 2 uc uc 4096 Feb 13 07:36 assets
drwxrwxr-x 5 uc uc 4096 Mar  4 12:01 BabylonExamples
drwxrwxr-x 4 uc uc 4096 Mar 26 10:33 components
-rw-rw-r-- 1 uc uc  234 Mar 11 14:43 main.tsx
drwxrwxr-x 2 uc uc 4096 Jan 14 13:10 types
-rw-rw-r-- 1 uc uc   38 Jan 14 13:10 vite-env.d.ts
uc@uc:~/BabylonInteraction/src$ cat ~/BabylonInteraction/src/app.css
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}

body {
  overflow: hidden;
}

@font-face {
  font-family: 'MyCustomFont';
  src: url('/models/lcdnormal.ttf') format('truetype');
}

uc@uc:~/BabylonInteraction/src$ cd ..
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ pm2 restart all
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [all](ids: [ 5, 10 ])
[PM2] [BabylonInteraction-Branch74](5) ✓
[PM2] [BabylonInteraction](10) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 2184486  │ 0s     │ 4    │ online    │ 0%       │ 12.5mb   │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2184471  │ 0s     │ 2    │ online    │ 0%       │ 52.7mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ sudo systemctl stop nginx
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ vite --host 0.0.0.0 --port 5174 --https
file:///usr/local/lib/node_modules/vite/dist/node/cli.js:444
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
                ^

CACError: Unknown option `--https`
    at Command.checkUnknownOptions (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:444:17)
    at CAC.runMatchedCommand (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:642:13)
    at CAC.parse (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:581:12)
    at file:///usr/local/lib/node_modules/vite/dist/node/cli.js:914:5
    at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:336:24)

Node.js v18.19.1
uc@uc:~/BabylonInteraction$ vite --version
vite/5.4.10 linux-x64 node-v18.19.1
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ vite
Re-optimizing dependencies because vite config has changed
Port 5174 is in use, trying another one...

  VITE v5.4.10  ready in 592 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ ps aux | grep vite
uc       2184501  0.0  0.0   2804  1792 ?        S    10:52   0:00 sh -c vite --host
uc       2184502  0.7  6.4 22524160 253528 ?     Sl   10:52   0:04 node /home/uc/BabylonInteraction-Branch74/node_modules/.bin/vite --host
uc       2184518  0.0  0.0   2804  1792 ?        S    10:52   0:00 sh -c vite --host
uc       2184519  1.6  5.5 22379788 221292 ?     Sl   10:52   0:09 node /home/uc/BabylonInteraction/node_modules/.bin/vite --host
uc       2184640  0.0  0.0   6544  2304 pts/0    S+   11:01   0:00 grep --color=auto vite
uc@uc:~/BabylonInteraction$ kill 2184502 2184519
uc@uc:~/BabylonInteraction$ ps aux | grep vite
uc       2184667  0.0  0.0   2804  1664 ?        S    11:02   0:00 sh -c vite --host
uc       2184668 91.4  7.1 22529324 282096 ?     Rl   11:02   0:03 node /home/uc/BabylonInteraction-Branch74/node_modules/.bin/vite --host
uc       2184684  0.0  0.0   2804  1792 ?        S    11:02   0:00 sh -c vite --host
uc       2184685 81.3  4.9 22303800 196856 ?     Sl   11:02   0:02 node /home/uc/BabylonInteraction/node_modules/.bin/vite --host
uc       2184724  0.0  0.0   6544  2304 pts/0    S+   11:02   0:00 grep --color=auto vite
uc@uc:~/BabylonInteraction$ kill -9 <PID>
-bash: syntax error near unexpected token `newline'
uc@uc:~/BabylonInteraction$ kill -9 2184668 2184685
uc@uc:~/BabylonInteraction$ ps aux | grep vite
uc       2184753  0.0  0.0   2804  1792 ?        S    11:03   0:00 sh -c vite --host
uc       2184754 29.1  2.7 22247744 109076 ?     Sl   11:03   0:01 node /home/uc/BabylonInteraction-Branch74/node_modules/.bin/vite --host
uc       2184770  0.0  0.0   2804  1792 ?        S    11:03   0:00 sh -c vite --host
uc       2184771 75.6  4.9 22301284 197808 ?     Sl   11:03   0:03 node /home/uc/BabylonInteraction/node_modules/.bin/vite --host
uc       2184806  0.0  0.0   6544  2304 pts/0    S+   11:03   0:00 grep --color=auto vite
uc@uc:~/BabylonInteraction$ pkill -9 -f vite
uc@uc:~/BabylonInteraction$ ps aux | grep vite
uc       2184841  0.0  0.0   2804  1792 ?        S    11:03   0:00 sh -c vite --host
uc       2184842 30.1  2.8 22249376 111576 ?     Sl   11:03   0:01 node /home/uc/BabylonInteraction-Branch74/node_modules/.bin/vite --host
uc       2184857  0.0  0.0   2804  1664 ?        S    11:03   0:00 sh -c vite --host
uc       2184859 70.3  4.9 22301188 195192 ?     Sl   11:03   0:03 node /home/uc/BabylonInteraction/node_modules/.bin/vite --host
uc       2184891  0.0  0.0   6544  2304 pts/0    S+   11:03   0:00 grep --color=auto vite
uc@uc:~/BabylonInteraction$ pm2 list
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 2184816  │ 26s    │ 7    │ online    │ 0%       │ 85.5mb   │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2184817  │ 26s    │ 5    │ online    │ 0%       │ 68.9mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 stop vite
[PM2][ERROR] Process or Namespace vite not found
uc@uc:~/BabylonInteraction$ pm2 stop 10
[PM2] Applying action stopProcessId on app [10](ids: [ '10' ])
[PM2] [BabylonInteraction](10) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 0        │ 0      │ 7    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 2184817  │ 59s    │ 5    │ online    │ 0%       │ 68.9mb   │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 stop 5
[PM2] Applying action stopProcessId on app [5](ids: [ '5' ])
[PM2] [BabylonInteraction-Branch74](5) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 10 │ BabylonInteraction             │ default     │ N/A     │ fork    │ 0        │ 0      │ 7    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 0        │ 0      │ 5    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 delete 10
[PM2] Applying action deleteProcessId on app [10](ids: [ '10' ])
[PM2] [BabylonInteraction](10) ✓
┌────┬────────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 5  │ BabylonInteraction-Branch74    │ default     │ N/A     │ fork    │ 0        │ 0      │ 5    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴────────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 delete 5
[PM2] Applying action deleteProcessId on app [5](ids: [ '5' ])
[PM2] [BabylonInteraction-Branch74](5) ✓
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ ps aux | grep vite
uc       2184967  0.0  0.0   6544  2304 pts/0    S+   11:05   0:00 grep --color=auto vite
uc@uc:~/BabylonInteraction$ vite --host 0.0.0.0 --port 5174 --https
file:///usr/local/lib/node_modules/vite/dist/node/cli.js:444
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
                ^

CACError: Unknown option `--https`
    at Command.checkUnknownOptions (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:444:17)
    at CAC.runMatchedCommand (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:642:13)
    at CAC.parse (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:581:12)
    at file:///usr/local/lib/node_modules/vite/dist/node/cli.js:914:5
    at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:336:24)

Node.js v18.19.1
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ vite

  VITE v5.4.10  ready in 371 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: http://10.0.18.88:5174/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction$ vite --https
file:///usr/local/lib/node_modules/vite/dist/node/cli.js:444
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
                ^

CACError: Unknown option `--https`
    at Command.checkUnknownOptions (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:444:17)
    at CAC.runMatchedCommand (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:642:13)
    at CAC.parse (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:581:12)
    at file:///usr/local/lib/node_modules/vite/dist/node/cli.js:914:5
    at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:336:24)

Node.js v18.19.1
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ vite

  VITE v5.4.10  ready in 363 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: http://10.0.18.88:5174/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction$ vite --config vite.config.ts
failed to load config from /home/uc/BabylonInteraction/vite.config.ts
error when starting dev server:
Error: ENOENT: no such file or directory, open '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/privkey.pem'
    at Object.openSync (node:fs:596:3)
    at Object.readFileSync (node:fs:464:35)
    at file:///home/uc/BabylonInteraction/vite.config.ts.timestamp-1742987384625-ba13c75066582.mjs:9:15
    at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:336:24)
    at async loadConfigFromBundledFile (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66691:15)
    at async loadConfigFromFile (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66532:24)
    at async resolveConfig (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66140:24)
    at async _createServer (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:62758:18)
    at async CAC.<anonymous> (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:735:20)
uc@uc:~/BabylonInteraction$ ls /etc/letsencrypt/live/edu-3d.avtodor-eng.ru/
ls: cannot access '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/': No such file or directory
uc@uc:~/BabylonInteraction$ vite --config vite.config.ts
failed to load config from /home/uc/BabylonInteraction/vite.config.ts
error when starting dev server:
Error: ENOENT: no such file or directory, open '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/privkey.pem'
    at Object.openSync (node:fs:596:3)
    at Object.readFileSync (node:fs:464:35)
    at file:///home/uc/BabylonInteraction/vite.config.ts.timestamp-1742987478933-2aecd6218a45b.mjs:9:15
    at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:336:24)
    at async loadConfigFromBundledFile (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66691:15)
    at async loadConfigFromFile (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66532:24)
    at async resolveConfig (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66140:24)
    at async _createServer (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:62758:18)
    at async CAC.<anonymous> (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:735:20)
uc@uc:~/BabylonInteraction$ nano vite.config.ts
uc@uc:~/BabylonInteraction$ sudo chmod 644 /etc/letsencrypt/live/edu-3d.avtodor-eng.ru/*
chmod: cannot access '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/*': No such file or directory
uc@uc:~/BabylonInteraction$ sudo certbot renew
sudo: certbot: command not found
uc@uc:~/BabylonInteraction$ vite --config vite.config.ts
failed to load config from /home/uc/BabylonInteraction/vite.config.ts
error when starting dev server:
Error: ENOENT: no such file or directory, open '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/privkey.pem'
    at Object.openSync (node:fs:596:3)
    at Object.readFileSync (node:fs:464:35)
    at file:///home/uc/BabylonInteraction/vite.config.ts.timestamp-1742987559516-500e080a23aa3.mjs:9:15
    at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:336:24)
    at async loadConfigFromBundledFile (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66691:15)
    at async loadConfigFromFile (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66532:24)
    at async resolveConfig (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:66140:24)
    at async _createServer (file:///usr/local/lib/node_modules/vite/dist/node/chunks/dep-BWSbWtLw.js:62758:18)
    at async CAC.<anonymous> (file:///usr/local/lib/node_modules/vite/dist/node/cli.js:735:20)
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/nginx.conf
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/edu-3d.avtodor-eng.ru
uc@uc:~/BabylonInteraction$ uc@uc:~/BabylonInteraction$ ^C
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ uc@uc:~/BabylonInteraction$ ^C
uc@uc:~/BabylonInteraction$ ls -l /home/avtodor/_.avtodor-eng.ru.crt
ls: cannot access '/home/avtodor/_.avtodor-eng.ru.crt': Permission denied
uc@uc:~/BabylonInteraction$ sudo ls -l /home/avtodor/_.avtodor-eng.ru.crt
-rw-r--r-- 1 avtodor avtodor 2296 Feb 26 13:20 /home/avtodor/_.avtodor-eng.ru.crt
uc@uc:~/BabylonInteraction$ sudo chmod 644 /home/avtodor/_.avtodor-eng.ru.crt
uc@uc:~/BabylonInteraction$ sudo ls -l /home/avtodor/_.avtodor-eng.ru.crt
-rw-r--r-- 1 avtodor avtodor 2296 Feb 26 13:20 /home/avtodor/_.avtodor-eng.ru.crt
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo tail -f /var/log/nginx/error.log
2025/03/26 11:22:55 [error] 2184633#2184633: *195 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:22:55 [error] 2184633#2184633: *197 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:22:58 [error] 2184633#2184633: *199 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:22:58 [error] 2184634#2184634: *201 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:24:10 [error] 2185152#2185152: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:24:10 [error] 2185151#2185151: *3 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:24:12 [error] 2185152#2185152: *5 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:24:12 [error] 2185152#2185152: *7 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:24:12 [error] 2185152#2185152: *9 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:24:13 [error] 2185152#2185152: *11 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
^C
uc@uc:~/BabylonInteraction$ curl http://10.0.18.88:5174
curl: (7) Failed to connect to 10.0.18.88 port 5174 after 0 ms: Couldn't connect to server
uc@uc:~/BabylonInteraction$ pm2 list
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 start /path/to/your/app.js --name BabylonInteration
[PM2][ERROR] Script not found: /path/to/your/app.js
uc@uc:~/BabylonInteraction$ pm2 restart all
Use --update-env to update environment variables
[PM2][WARN] No process found
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2][ERROR] Process or Namespace BabylonInteraction not found
uc@uc:~/BabylonInteraction$ pm2 start /path/to/your/app.js --name "BabylonInteraction"
[PM2][ERROR] Script not found: /path/to/your/app.js
uc@uc:~/BabylonInteraction$ pm2 start /home/avtodor/BabylonInteraction/app.py --name "BabylonInteraction"
[PM2][ERROR] Script not found: /home/avtodor/BabylonInteraction/app.py
uc@uc:~/BabylonInteraction$ pm2 start ^?^C-name "BabylonInteraction"
uc@uc:~/BabylonInteraction$ pm2 start /home/avtodor/BabylonInteraction  --name "BabylonInteraction"
[PM2][ERROR] Script not found: /home/avtodor/BabylonInteraction
uc@uc:~/BabylonInteraction$ ls -la
total 416
drwxrwxr-x   8 uc uc   4096 Mar 26 11:12 .
drwxr-x---  10 uc uc   4096 Feb 13 08:13 ..
drwxrwxr-x   5 uc uc   4096 Mar 26 10:24 Backend
-rw-rw-r--   1 uc uc    734 Jan 14 13:10 eslint.config.js
-rw-rw-r--   1 uc uc    108 Jan 14 13:10 EventEmitter.ts
drwxrwxr-x   8 uc uc   4096 Mar 21 06:39 .git
-rw-rw-r--   1 uc uc    275 Jan 14 13:10 .gitignore
-rw-rw-r--   1 uc uc    366 Jan 14 13:10 index.html
-rw-rw-r--   1 uc uc    230 Mar 11 14:43 main.tsx
drwxrwxr-x 156 uc uc   4096 Mar 26 10:29 node_modules
-rw-rw-r--   1 uc uc   1258 Mar 26 10:29 package.json
-rw-rw-r--   1 uc uc 124407 Mar 26 10:29 package-lock.json
drwxrwxr-x   3 uc uc   4096 Jan 14 13:10 public
-rw-rw-r--   1 uc uc 221056 Feb 13 07:36 README.md
drwxrwxr-x   6 uc uc   4096 Mar 11 14:43 src
-rw-rw-r--   1 uc uc    552 Jan 14 13:10 tsconfig.app.json
-rw-rw-r--   1 uc uc    119 Jan 14 13:10 tsconfig.json
-rw-rw-r--   1 uc uc    479 Jan 14 13:10 tsconfig.node.json
drwxrwxr-x   8 uc uc   4096 Mar 26 10:03 venv
-rw-rw-r--   1 uc uc    727 Mar 26 09:26 vite.config.js
-rw-rw-r--   1 uc uc    442 Mar 26 11:09 vite.config.ts
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run start
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2185267  │ 0s     │ 0    │ online    │ 0%       │ 8.3mb    │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo tail -f /var/log/nginx/error.log
2025/03/26 11:22:55 [error] 2184633#2184633: *195 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:22:55 [error] 2184633#2184633: *197 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:22:58 [error] 2184633#2184633: *199 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:22:58 [error] 2184634#2184634: *201 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:24:10 [error] 2185152#2185152: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:24:10 [error] 2185151#2185151: *3 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:24:12 [error] 2185152#2185152: *5 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:24:12 [error] 2185152#2185152: *7 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:24:12 [error] 2185152#2185152: *9 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:24:13 [error] 2185152#2185152: *11 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:32:03 [error] 2185522#2185522: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:32:03 [error] 2185521#2185521: *3 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 11:58:35 [error] 2185522#2185522: *5 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 11:58:36 [error] 2185522#2185522: *7 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
^C
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
[sudo] password for uc:
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
uc@uc:~/BabylonInteraction$ JG8Z5Fax
JG8Z5Fax: command not found
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
uc@uc:~/BabylonInteraction$ ^C
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
uc@uc:~/BabylonInteraction$ pm2 start src/index.js --name "BabylonInteraction"
[PM2][ERROR] Script not found: /home/uc/BabylonInteraction/src/index.js
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ pm2 start src/index.js --name "BabylonInteraction"
[PM2][ERROR] Script not found: /home/uc/BabylonInteraction/src/index.js
uc@uc:~/BabylonInteraction$ ls -la src
total 44
drwxrwxr-x 6 uc uc 4096 Mar 11 14:43 .
drwxrwxr-x 8 uc uc 4096 Mar 26 11:12 ..
-rw-rw-r-- 1 uc uc  339 Mar 11 14:43 app.css
-rw-rw-r-- 1 uc uc  338 Jan 14 13:10 App.css
-rw-rw-r-- 1 uc uc 3097 Jan 28 08:18 App.tsx
drwxrwxr-x 2 uc uc 4096 Feb 13 07:36 assets
drwxrwxr-x 5 uc uc 4096 Mar  4 12:01 BabylonExamples
drwxrwxr-x 4 uc uc 4096 Mar 26 10:33 components
-rw-rw-r-- 1 uc uc  234 Mar 11 14:43 main.tsx
drwxrwxr-x 2 uc uc 4096 Jan 14 13:10 types
-rw-rw-r-- 1 uc uc   38 Jan 14 13:10 vite-env.d.ts
uc@uc:~/BabylonInteraction$ pm2 start
[PM2][ERROR] File ecosystem.config.js not found
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run start
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 15   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2185730  │ 0s     │ 0    │ online    │ 0%       │ 10.0mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0, 1 ])
[PM2] [BabylonInteraction](0) ✓
[PM2] [BabylonInteraction](1) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2185983  │ 0s     │ 15   │ online    │ 0%       │ 12.3mb   │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2185984  │ 0s     │ 15   │ online    │ 0%       │ 11.3mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ kill -9 2185983
-bash: kill: (2185983) - No such process
uc@uc:~/BabylonInteraction$ pm2 logs BabylonInteraction
[TAILING] Tailing last 15 lines for [BabylonInteraction] process (change the value with --lines option)
/home/uc/.pm2/logs/BabylonInteraction-out.log last 15 lines:
0|BabylonI |
0|BabylonI |
0|BabylonI |   VITE v5.4.11  ready in 396 ms
0|BabylonI |
0|BabylonI |   ➜  Local:   http://localhost:5174/
0|BabylonI |   ➜  Network: http://10.0.18.88:5174/
0|BabylonI |
0|BabylonI | > bridge@0.0.0 dev
0|BabylonI | > vite --host
0|BabylonI |
0|BabylonI |
0|BabylonI |   VITE v5.4.11  ready in 400 ms
0|BabylonI |
0|BabylonI |   ➜  Local:   http://localhost:5174/
0|BabylonI |   ➜  Network: http://10.0.18.88:5174/

/home/uc/.pm2/logs/BabylonInteraction-error.log last 15 lines:
0|BabylonI | npm ERR!   npm run
0|BabylonI |
0|BabylonI | npm ERR! A complete log of this run can be found in:
0|BabylonI | npm ERR!     /home/uc/.npm/_logs/2025-03-26T13_04_00_544Z-debug-0.log
0|BabylonI | npm ERR! Missing script: "start"
0|BabylonI | npm ERR!
0|BabylonI | npm ERR! Did you mean one of these?
0|BabylonI | npm ERR!     npm star # Mark your favorite packages
0|BabylonI | npm ERR!     npm stars # View packages marked as favorites
0|BabylonI | npm ERR!
0|BabylonI | npm ERR! To see a list of scripts, run:
0|BabylonI | npm ERR!   npm run
0|BabylonI |
0|BabylonI | npm ERR! A complete log of this run can be found in:
0|BabylonI | npm ERR!     /home/uc/.npm/_logs/2025-03-26T13_04_00_736Z-debug-0.log

^C
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run dev
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 30   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 30   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 2  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2186490  │ 0s     │ 0    │ online    │ 0%       │ 9.6mb    │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
tcp6       0      0 :::5174                 :::*                    LISTEN
uc@uc:~/BabylonInteraction$ sudo ufw allow 5174
Skipping adding existing rule
Skipping adding existing rule (v6)
uc@uc:~/BabylonInteraction$ pm2 logs BabylonInteraction
[TAILING] Tailing last 15 lines for [BabylonInteraction] process (change the value with --lines option)
/home/uc/.pm2/logs/BabylonInteraction-error.log last 15 lines:
0|BabylonI | npm ERR!   npm run
0|BabylonI |
0|BabylonI | npm ERR! A complete log of this run can be found in:
0|BabylonI | npm ERR!     /home/uc/.npm/_logs/2025-03-26T13_04_00_544Z-debug-0.log
0|BabylonI | npm ERR! Missing script: "start"
0|BabylonI | npm ERR!
0|BabylonI | npm ERR! Did you mean one of these?
0|BabylonI | npm ERR!     npm star # Mark your favorite packages
0|BabylonI | npm ERR!     npm stars # View packages marked as favorites
0|BabylonI | npm ERR!
0|BabylonI | npm ERR! To see a list of scripts, run:
0|BabylonI | npm ERR!   npm run
0|BabylonI |
0|BabylonI | npm ERR! A complete log of this run can be found in:
0|BabylonI | npm ERR!     /home/uc/.npm/_logs/2025-03-26T13_04_00_736Z-debug-0.log

/home/uc/.pm2/logs/BabylonInteraction-out.log last 15 lines:
0|BabylonI |
0|BabylonI |   VITE v5.4.11  ready in 400 ms
0|BabylonI |
0|BabylonI |   ➜  Local:   http://localhost:5174/
0|BabylonI |   ➜  Network: http://10.0.18.88:5174/
0|BabylonI |
0|BabylonI | > bridge@0.0.0 dev
0|BabylonI | > vite --host
0|BabylonI |
0|BabylonI | Re-optimizing dependencies because vite config has changed
0|BabylonI |
0|BabylonI |   VITE v5.4.11  ready in 392 ms
0|BabylonI |
0|BabylonI |   ➜  Local:   http://localhost:5174/
0|BabylonI |   ➜  Network: http://10.0.18.88:5174/

^C
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run dev
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 30   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 30   │ errored   │ 0%       │ 0b       │ uc       │ disabled │
│ 2  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2186490  │ 4m     │ 0    │ online    │ 0%       │ 71.9mb   │ uc       │ disabled │
│ 3  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2186595  │ 0s     │ 0    │ online    │ 0%       │ 11.4mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0, 1, 2, 3 ])
[PM2] [BabylonInteraction](0) ✓
[PM2] [BabylonInteraction](1) ✓
[PM2] [BabylonInteraction](3) ✓
[PM2] [BabylonInteraction](2) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2186645  │ 0s     │ 30   │ online    │ 0%       │ 52.2mb   │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2186646  │ 0s     │ 30   │ online    │ 0%       │ 46.6mb   │ uc       │ disabled │
│ 2  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2186678  │ 0s     │ 1    │ online    │ 0%       │ 9.8mb    │ uc       │ disabled │
│ 3  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2186677  │ 0s     │ 1    │ online    │ 0%       │ 13.4mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 stop BabylonInteraction
[PM2] Applying action stopProcessId on app [BabylonInteraction](ids: [ 0, 1, 2, 3 ])
[PM2] [BabylonInteraction](0) ✓
[PM2] [BabylonInteraction](1) ✓
[PM2] [BabylonInteraction](2) ✓
[PM2] [BabylonInteraction](3) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 88   │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 87   │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 2  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 3  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 delete BabylonInteraction
[PM2] Applying action deleteProcessId on app [BabylonInteraction](ids: [ 0, 1, 2, 3 ])
[PM2] [BabylonInteraction](0) ✓
[PM2] [BabylonInteraction](1) ✓
[PM2] [BabylonInteraction](2) ✓
[PM2] [BabylonInteraction](3) ✓
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 list
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 save
[PM2] Saving current process list...
[PM2][WARN] PM2 is not managing any process, skipping save...
[PM2][WARN] To force saving use: pm2 save --force
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run dev
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2188540  │ 0s     │ 0    │ online    │ 0%       │ 13.3mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 list
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2188540  │ 3s     │ 0    │ online    │ 0%       │ 87.1mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App vite-project vite-project vite-project BabylonProject BabylonInteraction-Branch74 flask-server differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 save
[PM2] Saving current process list...
[PM2] Successfully saved in /home/uc/.pm2/dump.pm2
uc@uc:~/BabylonInteraction$ pm2 stop BabylonInteraction
[PM2] Applying action stopProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ git pull origin mrz-new-line
remote: Enumerating objects: 20, done.
remote: Counting objects: 100% (20/20), done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 12 (delta 7), reused 12 (delta 7), pack-reused 0 (from 0)
Unpacking objects: 100% (12/12), 4.73 KiB | 484.00 KiB/s, done.
From https://github.com/Kukururkuruk/BabylonInteraction
 * branch            mrz-new-line -> FETCH_HEAD
   cb92ab4..5ec1e85  mrz-new-line -> origin/mrz-new-line
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint:
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
hint:
hint: You can replace "git config" with "git config --global" to set a default
hint: preference for all repositories. You can also pass --rebase, --no-rebase,
hint: or --ff-only on the command line to override the configured default per
hint: invocation.
fatal: Need to specify how to reconcile divergent branches.
uc@uc:~/BabylonInteraction$ git pull --no-rebase origin mrz-new-line
From https://github.com/Kukururkuruk/BabylonInteraction
 * branch            mrz-new-line -> FETCH_HEAD
Merge made by the 'ort' strategy.
 Backend/__init__.py                                  |   0
 Backend/__pycache__/__init__.cpython-312.pyc         | Bin 0 -> 152 bytes
 Backend/__pycache__/app.cpython-312.pyc              | Bin 6874 -> 6904 bytes
 src/BabylonExamples/FullExample.ts                   |   4 +++-
 src/BabylonExamples/FunctionComponents/GUIManager.ts | 220 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------------------------------------------------------------------------------------------
 5 files changed, 112 insertions(+), 112 deletions(-)
 create mode 100644 Backend/__init__.py
 create mode 100644 Backend/__pycache__/__init__.cpython-312.pyc
uc@uc:~/BabylonInteraction$ pm2 list
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run dev
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2188934  │ 0s     │ 0    │ online    │ 0%       │ 10.3mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 stop BabylonInteraction
[PM2] Applying action stopProcessId on app [BabylonInteraction](ids: [ 0, 1 ])
[PM2] [BabylonInteraction](0) ✓
[PM2] [BabylonInteraction](1) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ pm2 delete BabylonInteraction
[PM2] Applying action deleteProcessId on app [BabylonInteraction](ids: [ 0, 1 ])
[PM2] [BabylonInteraction](0) ✓
[PM2] [BabylonInteraction](1) ✓
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App BabylonInteraction differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ nano package.json
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run dev
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189036  │ 0s     │ 0    │ online    │ 0%       │ 5.6mb    │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ pm2 delete BabylonInteraction
[PM2] Applying action deleteProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App BabylonInteraction differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
[sudo] password for uc:
uc@uc:~/BabylonInteraction$ sudo ufw allow 5174
Skipping adding existing rule
Skipping adding existing rule (v6)
uc@uc:~/BabylonInteraction$ nano vite.config.js
uc@uc:~/BabylonInteraction$ uc@uc:~/BabylonInteraction$ pm2 restart "BabylonInteraction"^C
uc@uc:~/BabylonInteraction$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2][ERROR] Process or Namespace BabylonInteraction not found
uc@uc:~/BabylonInteraction$ pm2 start npm --name "BabylonInteraction" -- run dev
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189131  │ 0s     │ 0    │ online    │ 0%       │ 11.5mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
tcp        0      0 0.0.0.0:5174            0.0.0.0:*               LISTEN
uc@uc:~/BabylonInteraction$ pm2 stop BabylonInteraction
[PM2] Applying action stopProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 0        │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ sudo netstat -tuln
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.54:53           0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
udp        0      0 127.0.0.54:53           0.0.0.0:*
udp        0      0 127.0.0.53:53           0.0.0.0:*
udp        0      0 10.0.18.88:68           0.0.0.0:*
uc@uc:~/BabylonInteraction$ pm2 save
[PM2] Saving current process list...
[PM2] Successfully saved in /home/uc/.pm2/dump.pm2
uc@uc:~/BabylonInteraction$ git pull origin 1RelDone
From https://github.com/Kukururkuruk/BabylonInteraction
 * branch            1RelDone   -> FETCH_HEAD
Already up to date.
uc@uc:~/BabylonInteraction$ git checkout Demoscene-new-server
error: pathspec 'Demoscene-new-server' did not match any file(s) known to git
uc@uc:~/BabylonInteraction$ git fetch origin
remote: Enumerating objects: 39, done.
remote: Counting objects: 100% (39/39), done.
remote: Compressing objects: 100% (16/16), done.
remote: Total 39 (delta 23), reused 39 (delta 23), pack-reused 0 (from 0)
Unpacking objects: 100% (39/39), 207.83 KiB | 1.12 MiB/s, done.
From https://github.com/Kukururkuruk/BabylonInteraction
 * [new branch]      Demoscene-new-server -> origin/Demoscene-new-server
 * [new branch]      InstrumentUpdate     -> origin/InstrumentUpdate
uc@uc:~/BabylonInteraction$ git checkout -b Demoscene-new-server origin/Demoscene-new-server
M       Backend/app.py
M       package-lock.json
M       package.json
M       src/components/BabylonFull.tsx
M       venv/pyvenv.cfg
M       vite.config.ts
branch 'Demoscene-new-server' set up to track 'origin/Demoscene-new-server'.
Switched to a new branch 'Demoscene-new-server'
uc@uc:~/BabylonInteraction$ git pull origin Demoscene-new-server
From https://github.com/Kukururkuruk/BabylonInteraction
 * branch            Demoscene-new-server -> FETCH_HEAD
Already up to date.
uc@uc:~/BabylonInteraction$ npm install

up to date, audited 227 packages in 1s

44 packages are looking for funding
  run `npm fund` for details

3 moderate severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
uc@uc:~/BabylonInteraction$ source venv/bin/activate
-bash: venv/bin/activate: No such file or directory
uc@uc:~/BabylonInteraction$ source venv/Script/activate
-bash: venv/Script/activate: No such file or directory
uc@uc:~/BabylonInteraction$ source venv/Scripts/activate
(venv) uc@uc:~/BabylonInteraction$ pip install -r Backend/requirements.txt
error: externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.

    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.

    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.

    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
(venv) uc@uc:~/BabylonInteraction$ deactivate
uc@uc:~/BabylonInteraction$ pm2 restart all
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [all](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189412  │ 0s     │ 0    │ online    │ 0%       │ 12.3mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ npm run dev -- --host

> bridge@0.0.0 dev
> vite --host 0.0.0.0 --host

Port 5174 is in use, trying another one...

  VITE v5.4.11  ready in 304 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
3:47:47 PM [vite] Pre-transform error: Failed to resolve import "./app.css" from "src/main.tsx". Does the file exist?
3:47:47 PM [vite] Internal server error: Failed to resolve import "./app.css" from "src/main.tsx". Does the file exist?
  Plugin: vite:import-analysis
  File: /home/uc/BabylonInteraction/src/main.tsx:4:7
  2  |  import { createRoot } from "react-dom/client";
  3  |  import App from "./App.tsx";
  4  |  import "./app.css";
     |          ^
  5  |  createRoot(document.getElementById("root")).render(
  6  |    // <StrictMode>
      at TransformPluginContext._formatError (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49255:41)
      at TransformPluginContext.error (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49250:16)
      at normalizeUrl (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:64041:23)
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:64173:39
      at async Promise.all (index 3)
      at async TransformPluginContext.transform (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:64100:7)
      at async PluginContainer.transform (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49096:18)
      at async loadAndTransform (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:51929:27)
      at async viteTransformMiddleware (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:61881:24)
^C
uc@uc:~/BabylonInteraction$ ls -l src/app.css
ls: cannot access 'src/app.css': No such file or directory
uc@uc:~/BabylonInteraction$ rm -rf node_modules package-lock.json
uc@uc:~/BabylonInteraction$ npm install

added 227 packages, and audited 228 packages in 26s

44 packages are looking for funding
  run `npm fund` for details

2 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
uc@uc:~/BabylonInteraction$ npm run dev -- --host

> bridge@0.0.0 dev
> vite --host 0.0.0.0 --host

Port 5174 is in use, trying another one...

  VITE v5.4.15  ready in 308 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
3:49:52 PM [vite] Pre-transform error: Failed to resolve import "./app.css" from "src/main.tsx". Does the file exist?
3:49:52 PM [vite] Internal server error: Failed to resolve import "./app.css" from "src/main.tsx". Does the file exist?
  Plugin: vite:import-analysis
  File: /home/uc/BabylonInteraction/src/main.tsx:4:7
  2  |  import { createRoot } from "react-dom/client";
  3  |  import App from "./App.tsx";
  4  |  import "./app.css";
     |          ^
  5  |  createRoot(document.getElementById("root")).render(
  6  |    // <StrictMode>
      at TransformPluginContext._formatError (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:49257:41)
      at TransformPluginContext.error (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:49252:16)
      at normalizeUrl (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:64209:23)
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:64341:39
      at async Promise.all (index 3)
      at async TransformPluginContext.transform (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:64268:7)
      at async PluginContainer.transform (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:49098:18)
      at async loadAndTransform (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:51931:27)
      at async viteTransformMiddleware (file:///home/uc/BabylonInteraction/node_modules/vite/dist/node/chunks/dep-CevzF2vT.js:62041:24)
^C
uc@uc:~/BabylonInteraction$ ls -l src/app.css
ls: cannot access 'src/app.css': No such file or directory
uc@uc:~/BabylonInteraction$ touch src/app.css
uc@uc:~/BabylonInteraction$ ls -l src/app.css
-rw-rw-r-- 1 uc uc 0 Mar 26 15:51 src/app.css
uc@uc:~/BabylonInteraction$ nano app.css
uc@uc:~/BabylonInteraction$ npm run dev -- --host

> bridge@0.0.0 dev
> vite --host 0.0.0.0 --host

Port 5174 is in use, trying another one...

  VITE v5.4.15  ready in 311 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction$ nano App.tsx
uc@uc:~/BabylonInteraction$ ls -la
total 416
drwxrwxr-x   8 uc uc   4096 Mar 26 15:53 .
drwxr-x---  10 uc uc   4096 Feb 13 08:13 ..
-rw-rw-r--   1 uc uc    339 Mar 26 15:52 app.css
drwxrwxr-x   5 uc uc   4096 Mar 26 15:44 Backend
-rw-rw-r--   1 uc uc    734 Jan 14 13:10 eslint.config.js
-rw-rw-r--   1 uc uc    108 Jan 14 13:10 EventEmitter.ts
drwxrwxr-x   8 uc uc   4096 Mar 26 15:44 .git
-rw-rw-r--   1 uc uc    275 Jan 14 13:10 .gitignore
-rw-rw-r--   1 uc uc    366 Jan 14 13:10 index.html
drwxrwxr-x 155 uc uc   4096 Mar 26 15:49 node_modules
-rw-rw-r--   1 uc uc   1266 Mar 26 14:30 package.json
-rw-rw-r--   1 uc uc 126039 Mar 26 15:49 package-lock.json
drwxrwxr-x   3 uc uc   4096 Jan 14 13:10 public
-rw-rw-r--   1 uc uc 221056 Feb 13 07:36 README.md
drwxrwxr-x   6 uc uc   4096 Mar 26 15:51 src
-rw-rw-r--   1 uc uc    552 Jan 14 13:10 tsconfig.app.json
-rw-rw-r--   1 uc uc    119 Jan 14 13:10 tsconfig.json
-rw-rw-r--   1 uc uc    479 Jan 14 13:10 tsconfig.node.json
drwxrwxr-x   8 uc uc   4096 Mar 26 10:03 venv
-rw-rw-r--   1 uc uc    727 Mar 26 09:26 vite.config.js
-rw-rw-r--   1 uc uc    442 Mar 26 11:09 vite.config.ts
uc@uc:~/BabylonInteraction$ cd src
uc@uc:~/BabylonInteraction/src$ ls -la
total 40
drwxrwxr-x 6 uc uc 4096 Mar 26 15:51 .
drwxrwxr-x 8 uc uc 4096 Mar 26 15:53 ..
-rw-rw-r-- 1 uc uc    0 Mar 26 15:51 app.css
-rw-rw-r-- 1 uc uc  338 Jan 14 13:10 App.css
-rw-rw-r-- 1 uc uc 3097 Jan 28 08:18 App.tsx
drwxrwxr-x 2 uc uc 4096 Feb 13 07:36 assets
drwxrwxr-x 5 uc uc 4096 Mar 26 15:44 BabylonExamples
drwxrwxr-x 4 uc uc 4096 Mar 26 10:33 components
-rw-rw-r-- 1 uc uc  234 Mar 11 14:43 main.tsx
drwxrwxr-x 2 uc uc 4096 Jan 14 13:10 types
-rw-rw-r-- 1 uc uc   38 Jan 14 13:10 vite-env.d.ts
uc@uc:~/BabylonInteraction/src$ cd App.tsx
-bash: cd: App.tsx: Not a directory
uc@uc:~/BabylonInteraction/src$ nano App.tsx
uc@uc:~/BabylonInteraction/src$ uc@uc:~/BabylonInteraction/src$ ^C
uc@uc:~/BabylonInteraction/src$ npm run dev -- --host

> bridge@0.0.0 dev
> vite --host 0.0.0.0 --host

Port 5174 is in use, trying another one...

  VITE v5.4.15  ready in 306 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ pm2 list
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189412  │ 13m    │ 0    │ online    │ 0%       │ 71.3mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ pm2 status
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189412  │ 13m    │ 0    │ online    │ 0%       │ 70.9mb   │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ pm2 restart

  error: missing required argument `id|name|namespace|all|json|stdin'

uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189776  │ 0s     │ 1    │ online    │ 0%       │ 8.0mb    │ uc       │ disabled │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ pm2 start npm --name "BabylonInteraction" -- run dev --watch
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189776  │ 3m     │ 1    │ online    │ 0%       │ 72.4mb   │ uc       │ disabled │
│ 1  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189825  │ 0s     │ 0    │ online    │ 0%       │ 26.6mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction/src$ pm2 delete BabylonInteraction
[PM2] Applying action deleteProcessId on app [BabylonInteraction](ids: [ 0, 1 ])
[PM2] [BabylonInteraction](0) ✓
[PM2] [BabylonInteraction](1) ✓
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2][WARN] Current process list is not synchronized with saved list. App BabylonInteraction differs. Type 'pm2 save' to synchronize.
uc@uc:~/BabylonInteraction/src$ pm2 start npm --name "BabylonInteraction" -- run dev --watch
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189894  │ 0s     │ 0    │ online    │ 0%       │ 13.4mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ pm2 save
[PM2] Saving current process list...
[PM2] Successfully saved in /home/uc/.pm2/dump.pm2
uc@uc:~/BabylonInteraction/src$ nano /etc/nginx/nginx.conf
uc@uc:~/BabylonInteraction/src$ nano /etc/nginx/sites-available/
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
[sudo] password for uc:
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2189993  │ 0s     │ 1    │ online    │ 0%       │ 13.4mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2190065  │ 0s     │ 2    │ online    │ 0%       │ 8.1mb    │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2190127  │ 0s     │ 3    │ online    │ 0%       │ 13.4mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ curl http://10.0.18.88:80
<html>
<head><title>301 Moved Permanently</title></head>
<body>
<center><h1>301 Moved Permanently</h1></center>
<hr><center>nginx/1.24.0 (Ubuntu)</center>
</body>
</html>
uc@uc:~/BabylonInteraction/src$ curl https://10.0.18.88:443
curl: (60) SSL certificate problem: unable to get local issuer certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
uc@uc:~/BabylonInteraction/src$ curl -i http://10.0.18.88:80
HTTP/1.1 301 Moved Permanently
Server: nginx/1.24.0 (Ubuntu)
Date: Wed, 26 Mar 2025 16:18:44 GMT
Content-Type: text/html
Content-Length: 178
Connection: keep-alive
Location: https://edu-3d.avtodor-eng.ru/

<html>
<head><title>301 Moved Permanently</title></head>
<body>
<center><h1>301 Moved Permanently</h1></center>
<hr><center>nginx/1.24.0 (Ubuntu)</center>
</body>
</html>
uc@uc:~/BabylonInteraction/src$ curl -k https://edu-3d.avtodor-eng.ru
<!doctype html>
<html lang="en">
  <head>
    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
uc@uc:~/BabylonInteraction/src$ netstat -tuln | grep 5174
tcp        0      0 0.0.0.0:5174            0.0.0.0:*               LISTEN
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ uc@uc:~/BabylonInteraction/src$ ^C
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ sudo ufw allow 5174
Skipping adding existing rule
Skipping adding existing rule (v6)
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2190258  │ 0s     │ 4    │ online    │ 0%       │ 12.8mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ npm run dev

> bridge@0.0.0 dev
> vite --host 0.0.0.0

Port 5174 is in use, trying another one...

  VITE v5.4.15  ready in 316 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ uc@uc:~/BabylonInteraction/src$ ^C
uc@uc:~/BabylonInteraction/src$ npm run dev

> bridge@0.0.0 dev
> vite --host 0.0.0.0

Port 5174 is in use, trying another one...

  VITE v5.4.15  ready in 303 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2190456  │ 0s     │ 6    │ online    │ 0%       │ 12.4mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ npm run dev

> bridge@0.0.0 dev
> vite --host 0.0.0.0

Port 5174 is in use, trying another one...

  VITE v5.4.15  ready in 324 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx^C
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2190678  │ 0s     │ 9    │ online    │ 0%       │ 12.3mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx^C
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default^C
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default^C
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2190800  │ 0s     │ 11   │ online    │ 0%       │ 13.4mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction/src$ sudo lsof -i :5174
COMMAND     PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
node    2190816   uc   24u  IPv4 19089977      0t0  TCP *:5174 (LISTEN)
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ nano vite.config.ts
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
Job for nginx.service failed because the control process exited with error code.
See "systemctl status nginx.service" and "journalctl -xeu nginx.service" for details.
uc@uc:~/BabylonInteraction/src$ sudo systemctl status nginx.service
× nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: failed (Result: exit-code) since Wed 2025-03-26 16:43:36 UTC; 32s ago
   Duration: 6min 20.627s
       Docs: man:nginx(8)
    Process: 2190941 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=1/FAILURE)
        CPU: 20ms

Mar 26 16:43:36 uc systemd[1]: Starting nginx.service - A high performance web server and a reverse proxy server...
Mar 26 16:43:36 uc nginx[2190941]: 2025/03/26 16:43:36 [emerg] 2190941#2190941: cannot load certificate "/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/fullchain.pem": BIO_new_file() failed (SSL: error:80000002:system library::No such file or directory:calling fopen(/etc/l>
Mar 26 16:43:36 uc nginx[2190941]: nginx: configuration file /etc/nginx/nginx.conf test failed
Mar 26 16:43:36 uc systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE
Mar 26 16:43:36 uc systemd[1]: nginx.service: Failed with result 'exit-code'.
Mar 26 16:43:36 uc systemd[1]: Failed to start nginx.service - A high performance web server and a reverse proxy server.
lines 1-14/14 (END)
uc@uc:~/BabylonInteraction/src$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction/src$ ls /etc/letsencrypt/live/edu-3d.avtodor-eng.ru/
ls: cannot access '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/': No such file or directory
uc@uc:~/BabylonInteraction/src$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2190971  │ 0s     │ 13   │ online    │ 0%       │ 11.3mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src$ sudo systemctl restart nginx
Job for nginx.service failed because the control process exited with error code.
See "systemctl status nginx.service" and "journalctl -xeu nginx.service" for details.
uc@uc:~/BabylonInteraction/src$ ls /etc/letsencrypt/live/edu-3d.avtodor-eng.ru/
ls: cannot access '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/': No such file or directory
uc@uc:~/BabylonInteraction/src$ sudo nginx -t
2025/03/26 16:46:59 [emerg] 2191017#2191017: cannot load certificate "/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/fullchain.pem": BIO_new_file() failed (SSL: error:80000002:system library::No such file or directory:calling fopen(/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/fullchain.pem, r) error:10000080:BIO routines::no such file)
nginx: configuration file /etc/nginx/nginx.conf test failed
uc@uc:~/BabylonInteraction/src$ cd ..
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
Job for nginx.service failed because the control process exited with error code.
See "systemctl status nginx.service" and "journalctl -xeu nginx.service" for details.
uc@uc:~/BabylonInteraction$ sudo ls /etc/letsencrypt/live/edu-3d.avtodor-eng.ru/
ls: cannot access '/etc/letsencrypt/live/edu-3d.avtodor-eng.ru/': No such file or directory
uc@uc:~/BabylonInteraction$ sudo certbot certonly --standalone -d edu-3d.avtodor-eng.ru
sudo: certbot: command not found
uc@uc:~/BabylonInteraction$ sudo apt update
Hit:1 http://ru.archive.ubuntu.com/ubuntu noble InRelease
Get:2 http://ru.archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
Get:3 http://ru.archive.ubuntu.com/ubuntu noble-backports InRelease [126 kB]
Get:4 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
Get:5 http://ru.archive.ubuntu.com/ubuntu noble-updates/main amd64 Components [151 kB]
Get:6 http://ru.archive.ubuntu.com/ubuntu noble-updates/restricted amd64 Components [212 B]
Get:7 http://ru.archive.ubuntu.com/ubuntu noble-updates/universe amd64 Components [364 kB]
Get:8 http://ru.archive.ubuntu.com/ubuntu noble-updates/multiverse amd64 Components [940 B]
Get:9 http://ru.archive.ubuntu.com/ubuntu noble-backports/main amd64 Components [7,104 B]
Get:10 http://ru.archive.ubuntu.com/ubuntu noble-backports/restricted amd64 Components [212 B]
Get:11 http://ru.archive.ubuntu.com/ubuntu noble-backports/universe amd64 Components [15.8 kB]
Get:12 http://ru.archive.ubuntu.com/ubuntu noble-backports/multiverse amd64 Components [212 B]
Get:13 http://security.ubuntu.com/ubuntu noble-security/main amd64 Components [8,980 B]
Get:14 http://security.ubuntu.com/ubuntu noble-security/restricted amd64 Components [212 B]
Get:15 http://security.ubuntu.com/ubuntu noble-security/universe amd64 Components [52.0 kB]
Get:16 http://security.ubuntu.com/ubuntu noble-security/multiverse amd64 Components [208 B]
Fetched 979 kB in 1s (1,751 kB/s)
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
161 packages can be upgraded. Run 'apt list --upgradable' to see them.
uc@uc:~/BabylonInteraction$ certbot --version
Command 'certbot' not found, but can be installed with:
sudo snap install certbot  # version 3.0.1, or
sudo apt  install certbot  # version 2.1.0-4
See 'snap info certbot' for additional versions.
uc@uc:~/BabylonInteraction$ sudo apt install certbot python3-certbot-nginx
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  python3-acme python3-certbot python3-configargparse python3-icu python3-josepy python3-parsedatetime python3-rfc3339
Suggested packages:
  python-certbot-doc python3-certbot-apache python-acme-doc python-certbot-nginx-doc
The following NEW packages will be installed:
  certbot python3-acme python3-certbot python3-certbot-nginx python3-configargparse python3-icu python3-josepy python3-parsedatetime python3-rfc3339
0 upgraded, 9 newly installed, 0 to remove and 161 not upgraded.
Need to get 1,097 kB of archives.
After this operation, 5,699 kB of additional disk space will be used.
Do you want to continue? [Y/n] Y
Get:1 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-josepy all 1.14.0-1 [22.1 kB]
Get:2 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-rfc3339 all 1.1-4 [6,744 B]
Get:3 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-acme all 2.9.0-1 [48.5 kB]
Get:4 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-configargparse all 1.7-1 [31.7 kB]
Get:5 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-parsedatetime all 2.6-3 [32.8 kB]
Get:6 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-certbot all 2.9.0-1 [267 kB]
Get:7 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 certbot all 2.9.0-1 [89.2 kB]
Get:8 http://ru.archive.ubuntu.com/ubuntu noble/universe amd64 python3-certbot-nginx all 2.9.0-1 [66.0 kB]
Get:9 http://ru.archive.ubuntu.com/ubuntu noble/main amd64 python3-icu amd64 2.12-1build2 [534 kB]
Fetched 1,097 kB in 0s (4,388 kB/s)
Preconfiguring packages ...
Selecting previously unselected package python3-josepy.
(Reading database ... 158473 files and directories currently installed.)
Preparing to unpack .../0-python3-josepy_1.14.0-1_all.deb ...
Unpacking python3-josepy (1.14.0-1) ...
Selecting previously unselected package python3-rfc3339.
Preparing to unpack .../1-python3-rfc3339_1.1-4_all.deb ...
Unpacking python3-rfc3339 (1.1-4) ...
Selecting previously unselected package python3-acme.
Preparing to unpack .../2-python3-acme_2.9.0-1_all.deb ...
Unpacking python3-acme (2.9.0-1) ...
Selecting previously unselected package python3-configargparse.
Preparing to unpack .../3-python3-configargparse_1.7-1_all.deb ...
Unpacking python3-configargparse (1.7-1) ...
Selecting previously unselected package python3-parsedatetime.
Preparing to unpack .../4-python3-parsedatetime_2.6-3_all.deb ...
Unpacking python3-parsedatetime (2.6-3) ...
Selecting previously unselected package python3-certbot.
Preparing to unpack .../5-python3-certbot_2.9.0-1_all.deb ...
Unpacking python3-certbot (2.9.0-1) ...
Selecting previously unselected package certbot.
Preparing to unpack .../6-certbot_2.9.0-1_all.deb ...
Unpacking certbot (2.9.0-1) ...
Selecting previously unselected package python3-certbot-nginx.
Preparing to unpack .../7-python3-certbot-nginx_2.9.0-1_all.deb ...
Unpacking python3-certbot-nginx (2.9.0-1) ...
Selecting previously unselected package python3-icu.
Preparing to unpack .../8-python3-icu_2.12-1build2_amd64.deb ...
Unpacking python3-icu (2.12-1build2) ...
Setting up python3-configargparse (1.7-1) ...
Setting up python3-parsedatetime (2.6-3) ...
Setting up python3-icu (2.12-1build2) ...
Setting up python3-josepy (1.14.0-1) ...
Setting up python3-rfc3339 (1.1-4) ...
Setting up python3-acme (2.9.0-1) ...
Setting up python3-certbot (2.9.0-1) ...
Setting up certbot (2.9.0-1) ...
Created symlink /etc/systemd/system/timers.target.wants/certbot.timer → /usr/lib/systemd/system/certbot.timer.
Setting up python3-certbot-nginx (2.9.0-1) ...
Processing triggers for man-db (2.12.0-4build2) ...
Scanning processes...
Scanning candidates...
Scanning linux images...

Pending kernel upgrade!
Running kernel version:
  6.8.0-49-generic
Diagnostics:
  The currently running kernel version is not the expected kernel version 6.8.0-55-generic.

Restarting the system to load the new kernel will not be handled automatically, so you should consider rebooting.

Restarting services...

Service restarts being deferred:
 /etc/needrestart/restart.d/dbus.service
 systemctl restart systemd-logind.service
 systemctl restart unattended-upgrades.service

No containers need to be restarted.

User sessions running outdated binaries:
 avtodor @ session #118: login[925]
 avtodor @ user manager service: systemd[1673340]

No VM guests are running outdated hypervisor (qemu) binaries on this host.
uc@uc:~/BabylonInteraction$ certbot --version
certbot 2.9.0
uc@uc:~/BabylonInteraction$ sudo certbot certonly --standalone -d edu-3d.avtodor-eng.ru
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Enter email address (used for urgent renewal and security notices)
 (Enter 'c' to cancel): c
An e-mail address or --register-unsafely-without-email must be provided.
Ask for help or search for solutions at https://community.letsencrypt.org. See the logfile /var/log/letsencrypt/letsencrypt.log or re-run Certbot with -v for more details.
uc@uc:~/BabylonInteraction$ sudo snap install certbot
error: This revision of snap "certbot" was published using classic confinement and thus may perform
       arbitrary system changes outside of the security sandbox that snaps are usually confined to,
       which may put your system at risk.

       If you understand and want to proceed repeat the command including --classic.
uc@uc:~/BabylonInteraction$ certbot --version
certbot 2.9.0
uc@uc:~/BabylonInteraction$ sudo certbot certonly --standalone -d edu-3d.avtodor-eng.ru
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Enter email address (used for urgent renewal and security notices)
 (Enter 'c' to cancel): vitalikmorozov15@gmail.com

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please read the Terms of Service at
https://letsencrypt.org/documents/LE-SA-v1.5-February-24-2025.pdf. You must
agree in order to register with the ACME server. Do you agree?
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(Y)es/(N)o: Y

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Would you be willing, once your first certificate is successfully issued, to
share your email address with the Electronic Frontier Foundation, a founding
partner of the Let's Encrypt project and the non-profit organization that
develops Certbot? We'd like to send you email about our work encrypting the web,
EFF news, campaigns, and ways to support digital freedom.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(Y)es/(N)o: Y
Account registered.
Requesting a certificate for edu-3d.avtodor-eng.ru

Certbot failed to authenticate some domains (authenticator: standalone). The Certificate Authority reported these problems:
  Domain: edu-3d.avtodor-eng.ru
  Type:   connection
  Detail: 185.111.100.98: Fetching http://edu-3d.avtodor-eng.ru/.well-known/acme-challenge/Lg8bEsGHqxD7SewF9zhmcUBC-OWLbfo-IsEyoaJb1OI: Connection refused

Hint: The Certificate Authority failed to download the challenge files from the temporary standalone webserver started by Certbot on port 80. Ensure that the listed domains point to this machine and that it can accept inbound connections from the internet.

Some challenges have failed.
Ask for help or search for solutions at https://community.letsencrypt.org. See the logfile /var/log/letsencrypt/letsencrypt.log or re-run Certbot with -v for more details.
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
Job for nginx.service failed because the control process exited with error code.
See "systemctl status nginx.service" and "journalctl -xeu nginx.service" for details.
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ pm2 restart "BabylonInteraction"
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2191797  │ 0s     │ 14   │ online    │ 0%       │ 10.3mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ ps aux | grep python
root         827  0.0  0.1 109672  5248 ?        Ssl   2024   0:00 /usr/bin/python3 /usr/share/unattended-upgrades/unattended-upgrade-shutdown --wait-for-signal
uc       2191844  0.0  0.0   6544  2304 pts/0    S+   17:01   0:00 grep --color=auto python
uc@uc:~/BabylonInteraction$ journalctl -u your-service-name
Hint: You are currently not seeing messages from other users and the system.
      Users in groups 'adm', 'systemd-journal' can see all messages.
      Pass -q to turn off this notice.
-- No entries --
uc@uc:~/BabylonInteraction$ sudo ufw status
Status: inactive
uc@uc:~/BabylonInteraction$ sudo ufw allow 5174
Skipping adding existing rule
Skipping adding existing rule (v6)
uc@uc:~/BabylonInteraction$ sudo iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
uc@uc:~/BabylonInteraction$ telnet edu-3d.avtodor-eng.ru 5174
Trying 10.0.18.237...
telnet: Unable to connect to remote host: Connection refused
uc@uc:~/BabylonInteraction$ nc -zv edu-3d.avtodor-eng.ru 5174
nc: connect to edu-3d.avtodor-eng.ru (10.0.18.237) port 5174 (tcp) failed: Connection refused
uc@uc:~/BabylonInteraction$ nc -zv localhost 5174
Connection to localhost (127.0.0.1) 5174 port [tcp/*] succeeded!
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
[sudo] password for uc:
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo systemctl restart your-websocket-server-service
Failed to restart your-websocket-server-service.service: Unit your-websocket-server-service.service not found.
uc@uc:~/BabylonInteraction$ sudo systemctl list-units --type=service
  UNIT                                     LOAD   ACTIVE SUB     DESCRIPTION
  apparmor.service                         loaded active exited  Load AppArmor profiles
  apport.service                           loaded active exited  automatic crash report generation
  blk-availability.service                 loaded active exited  Availability of block devices
  console-setup.service                    loaded active exited  Set console font and keymap
  cron.service                             loaded active running Regular background program processing daemon
  dbus.service                             loaded active running D-Bus System Message Bus
  finalrd.service                          loaded active exited  Create final runtime dir for shutdown pivot root
  getty@tty1.service                       loaded active running Getty on tty1
  keyboard-setup.service                   loaded active exited  Set the console keyboard layout
  kmod-static-nodes.service                loaded active exited  Create List of Static Device Nodes
  lvm2-monitor.service                     loaded active exited  Monitoring of LVM2 mirrors, snapshots etc. using dmeventd or progress polling
  ModemManager.service                     loaded active running Modem Manager
  multipathd.service                       loaded active running Device-Mapper Multipath Device Controller
  nginx.service                            loaded active running A high performance web server and a reverse proxy server
  open-vm-tools.service                    loaded active running Service for virtual machines hosted on VMware
  plymouth-quit-wait.service               loaded active exited  Hold until boot process finishes up
  plymouth-quit.service                    loaded active exited  Terminate Plymouth Boot Screen
  plymouth-read-write.service              loaded active exited  Tell Plymouth To Write Out Runtime Data
  pm2-uc.service                           loaded active running PM2 process manager
  polkit.service                           loaded active running Authorization Manager
  rsyslog.service                          loaded active running System Logging Service
  setvtrgb.service                         loaded active exited  Set console scheme
  snapd.apparmor.service                   loaded active exited  Load AppArmor profiles managed internally by snapd
  snapd.seeded.service                     loaded active exited  Wait until snapd is fully seeded
  ssh.service                              loaded active running OpenBSD Secure Shell server
  sysstat.service                          loaded active exited  Resets System Activity Logs
  systemd-binfmt.service                   loaded active exited  Set Up Additional Binary Formats
  systemd-journal-flush.service            loaded active exited  Flush Journal to Persistent Storage
  systemd-journald.service                 loaded active running Journal Service
  systemd-logind.service                   loaded active running User Login Management
  systemd-modules-load.service             loaded active exited  Load Kernel Modules
  systemd-networkd-wait-online.service     loaded active exited  Wait for Network to be Configured
  systemd-networkd.service                 loaded active running Network Configuration
  systemd-random-seed.service              loaded active exited  Load/Save OS Random Seed
  systemd-remount-fs.service               loaded active exited  Remount Root and Kernel File Systems
  systemd-resolved.service                 loaded active running Network Name Resolution
  systemd-sysctl.service                   loaded active exited  Apply Kernel Variables
  systemd-timesyncd.service                loaded active running Network Time Synchronization
  systemd-tmpfiles-setup-dev-early.service loaded active exited  Create Static Device Nodes in /dev gracefully
  systemd-tmpfiles-setup-dev.service       loaded active exited  Create Static Device Nodes in /dev
  systemd-tmpfiles-setup.service           loaded active exited  Create Volatile Files and Directories
  systemd-udev-trigger.service             loaded active exited  Coldplug All udev Devices
  systemd-udevd.service                    loaded active running Rule-based Manager for Device Events and Files
  systemd-update-utmp.service              loaded active exited  Record System Boot/Shutdown in UTMP
  systemd-user-sessions.service            loaded active exited  Permit User Sessions
  udisks2.service                          loaded active running Disk Manager
  ufw.service                              loaded active exited  Uncomplicated firewall
  unattended-upgrades.service              loaded active running Unattended Upgrades Shutdown
  upower.service                           loaded active running Daemon for power management
  user-runtime-dir@1000.service            loaded active exited  User Runtime Directory /run/user/1000
  user-runtime-dir@1001.service            loaded active exited  User Runtime Directory /run/user/1001
  user@1000.service                        loaded active running User Manager for UID 1000
  user@1001.service                        loaded active running User Manager for UID 1001
  vgauth.service                           loaded active running Authentication service for virtual machines hosted on VMware

Legend: LOAD   → Reflects whether the unit definition was properly loaded.
        ACTIVE → The high-level unit activation state, i.e. generalization of SUB.
        SUB    → The low-level unit activation state, values depend on unit type.

54 loaded units listed. Pass --all to see loaded but inactive units, too.
To show all installed unit files use 'systemctl list-unit-files'.
uc@uc:~/BabylonInteraction$ pm2 list
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2191797  │ 76m    │ 14   │ online    │ 0%       │ 72.8mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ nc -zv edu-3d.avtodor-eng.ru 5174
nc: connect to edu-3d.avtodor-eng.ru (10.0.18.237) port 5174 (tcp) failed: Connection refused
uc@uc:~/BabylonInteraction$ pm2 logs BabylonInteraction
[TAILING] Tailing last 15 lines for [BabylonInteraction] process (change the value with --lines option)
/home/uc/.pm2/logs/BabylonInteraction-error.log last 15 lines:
0|BabylonI | ylonInteraction/node_modules/.vite/deps/kernelBlur.vertex-AJOKGK2J.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/kernelBlur.fragment-TBG7LN64.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.fragment-VKIYGMBI.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.vertex-6DL3ZCH3.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/layer.vertex-KUZJTMU7.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/layer.fragment-IDPCDXAT.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/rgbdDecode.fragment-GJARJU2O.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/rgbdEncode.fragment-JIAGQQ5W.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/kernelBlur.vertex-AJOKGK2J.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/kernelBlur.fragment-TBG7LN64.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.fragment-VKIYGMBI.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.vertex-6DL3ZCH3.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.

/home/uc/.pm2/logs/BabylonInteraction-out.log last 15 lines:
0|BabylonI |
0|BabylonI |
0|BabylonI |   VITE v5.4.15  ready in 290 ms
0|BabylonI |
0|BabylonI |   ➜  Local:   http://localhost:5174/
0|BabylonI |   ➜  Network: http://10.0.18.88:5174/
0|BabylonI |
0|BabylonI | > bridge@0.0.0 dev
0|BabylonI | > vite --host 0.0.0.0
0|BabylonI |
0|BabylonI |
0|BabylonI |   VITE v5.4.15  ready in 291 ms
0|BabylonI |
0|BabylonI |   ➜  Local:   http://localhost:5174/
0|BabylonI |   ➜  Network: http://10.0.18.88:5174/

^C
uc@uc:~/BabylonInteraction$ sudo lsof -i :5174
COMMAND     PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
node    2191813   uc   24u  IPv4 19098895      0t0  TCP *:5174 (LISTEN)
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2192147  │ 0s     │ 15   │ online    │ 0%       │ 12.3mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ nc -zv 10.0.18.88 5174
Connection to 10.0.18.88 5174 port [tcp/*] succeeded!
uc@uc:~/BabylonInteraction$ git pull origin Demoscene-new-server
remote: Enumerating objects: 17, done.
remote: Counting objects: 100% (17/17), done.
remote: Compressing objects: 100% (1/1), done.
Unpacking objects: 100% (9/9), 9.48 KiB | 606.00 KiB/s, done.
remote: Total 9 (delta 8), reused 9 (delta 8), pack-reused 0 (from 0)
From https://github.com/Kukururkuruk/BabylonInteraction
 * branch            Demoscene-new-server -> FETCH_HEAD
   e428f5f..0baaf96  Demoscene-new-server -> origin/Demoscene-new-server
Updating e428f5f..0baaf96
error: Your local changes to the following files would be overwritten by merge:
        src/App.tsx
Please commit your changes or stash them before you merge.
Aborting
uc@uc:~/BabylonInteraction$ git stash
Saved working directory and index state WIP on Demoscene-new-server: e428f5f Merge branch 'mrz-new-line' of https://github.com/Kukururkuruk/BabylonInteraction into mrz-new-line
uc@uc:~/BabylonInteraction$ git pull origin Demoscene-new-server
From https://github.com/Kukururkuruk/BabylonInteraction
 * branch            Demoscene-new-server -> FETCH_HEAD
Updating e428f5f..0baaf96
Fast-forward
 README.md                         | 1699 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++--------------------------------------------------------------------------------------------
 src/App.tsx                       |   45 +------
 src/BabylonExamples/RulerScene.ts |    2 +-
 src/components/MainPage.tsx       |   21 +--
 4 files changed, 1023 insertions(+), 744 deletions(-)
uc@uc:~/BabylonInteraction$ git pull origin Demoscene-new-server
From https://github.com/Kukururkuruk/BabylonInteraction
 * branch            Demoscene-new-server -> FETCH_HEAD
Already up to date.
uc@uc:~/BabylonInteraction$ nano DemoScene.ts
uc@uc:~/BabylonInteraction$ ls -la
total 424
drwxrwxr-x   8 uc uc   4096 Mar 26 18:32 .
drwxr-x---  10 uc uc   4096 Mar 26 17:01 ..
-rw-rw-r--   1 uc uc    339 Mar 26 15:52 app.css
drwxrwxr-x   5 uc uc   4096 Mar 26 18:30 Backend
-rw-rw-r--   1 uc uc    734 Jan 14 13:10 eslint.config.js
-rw-rw-r--   1 uc uc    108 Jan 14 13:10 EventEmitter.ts
drwxrwxr-x   8 uc uc   4096 Mar 26 18:32 .git
-rw-rw-r--   1 uc uc    275 Jan 14 13:10 .gitignore
-rw-rw-r--   1 uc uc    366 Jan 14 13:10 index.html
drwxrwxr-x 155 uc uc   4096 Mar 26 15:49 node_modules
-rw-rw-r--   1 uc uc   1224 Mar 26 18:30 package.json
-rw-rw-r--   1 uc uc 121344 Mar 26 18:30 package-lock.json
drwxrwxr-x   3 uc uc   4096 Jan 14 13:10 public
-rw-rw-r--   1 uc uc 232891 Mar 26 18:30 README.md
drwxrwxr-x   6 uc uc   4096 Mar 26 18:30 src
-rw-rw-r--   1 uc uc    552 Jan 14 13:10 tsconfig.app.json
-rw-rw-r--   1 uc uc    119 Jan 14 13:10 tsconfig.json
-rw-rw-r--   1 uc uc    479 Jan 14 13:10 tsconfig.node.json
drwxrwxr-x   8 uc uc   4096 Mar 26 18:30 venv
-rw-rw-r--   1 uc uc    727 Mar 26 09:26 vite.config.js
-rw-rw-r--   1 uc uc    170 Mar 26 18:30 vite.config.ts
uc@uc:~/BabylonInteraction$ cd src
uc@uc:~/BabylonInteraction/src$ ls -la
total 44
drwxrwxr-x 6 uc uc 4096 Mar 26 18:30 .
drwxrwxr-x 8 uc uc 4096 Mar 26 18:32 ..
-rw-rw-r-- 1 uc uc    0 Mar 26 15:51 app.css
-rw-rw-r-- 1 uc uc  338 Jan 14 13:10 App.css
-rw-rw-r-- 1 uc uc  454 Mar 26 18:30 App.tsx
drwxrwxr-x 2 uc uc 4096 Feb 13 07:36 assets
drwxrwxr-x 5 uc uc 4096 Mar 26 18:30 BabylonExamples
drwxrwxr-x 4 uc uc 4096 Mar 26 18:30 components
-rw-rw-r-- 1 uc uc  234 Mar 11 14:43 main.tsx
drwxrwxr-x 2 uc uc 4096 Jan 14 13:10 types
-rw-rw-r-- 1 uc uc  532 Mar 26 16:42 vite.config.ts
-rw-rw-r-- 1 uc uc   38 Jan 14 13:10 vite-env.d.ts
uc@uc:~/BabylonInteraction/src$ cd BabylonExamples
uc@uc:~/BabylonInteraction/src/BabylonExamples$ ls -la
total 664
drwxrwxr-x 5 uc uc   4096 Mar 26 18:30 .
drwxrwxr-x 6 uc uc   4096 Mar 26 18:30 ..
drwxrwxr-x 2 uc uc   4096 Mar 26 15:44 BaseComponents
-rw-rw-r-- 1 uc uc  27244 Jan 14 13:10 BasicLevel.ts
-rw-rw-r-- 1 uc uc  20754 Jan 14 13:10 BetoneScene.ts
-rw-rw-r-- 1 uc uc  30263 Jan 14 13:10 BookScene2.ts
-rw-rw-r-- 1 uc uc  12750 Feb 13 07:36 BookScene.ts
-rw-rw-r-- 1 uc uc   8890 Feb 13 07:36 DistanceScene.ts
-rw-rw-r-- 1 uc uc  52024 Mar 26 15:44 FullExample.ts
drwxrwxr-x 2 uc uc   4096 Mar 26 15:44 FunctionComponents
drwxrwxr-x 3 uc uc   4096 Mar 11 14:43 Laboratory
-rw-rw-r-- 1 uc uc  13295 Jan 28 08:18 NewDistanceScene.ts
-rw-rw-r-- 1 uc uc 275993 Feb 13 07:36 Nosave.ts
-rw-rw-r-- 1 uc uc  11318 Jan 14 13:10 Planshet.ts
-rw-rw-r-- 1 uc uc  16960 Feb 13 07:36 QuestionScene.ts
-rw-rw-r-- 1 uc uc  24842 Mar 26 18:30 RulerScene.ts
-rw-rw-r-- 1 uc uc  34276 Jan 14 13:10 TestScene2.ts
-rw-rw-r-- 1 uc uc  10703 Mar  4 12:01 TestScene.ts
-rw-rw-r-- 1 uc uc  13543 Mar  4 12:01 TextureScene.ts
-rw-rw-r-- 1 uc uc  27438 Jan 14 13:10 TotalStation.ts
-rw-rw-r-- 1 uc uc  37288 Jan 14 13:10 TotalStationWork.ts
uc@uc:~/BabylonInteraction/src/BabylonExamples$ cd Laboratory
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ ls -la
total 124
drwxrwxr-x 3 uc uc  4096 Mar 11 14:43 .
drwxrwxr-x 5 uc uc  4096 Mar 26 18:30 ..
-rw-rw-r-- 1 uc uc 55992 Mar 11 14:43 DemoScene.ts
drwxrwxr-x 2 uc uc  4096 Feb 13 07:36 LabFunctions
-rw-rw-r-- 1 uc uc  5867 Mar  4 12:01 ScreenViewManager.ts
-rw-rw-r-- 1 uc uc 20293 Jan 28 08:18 ToolScenePC.ts
-rw-rw-r-- 1 uc uc 27687 Feb 13 07:36 ToolScene.ts
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ nano DemoScene.ts
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ ^C
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2192511  │ 0s     │ 19   │ online    │ 0%       │ 8.0mb    │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ sudo systemctl restart nginx
[sudo] password for uc:
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ cd ..
uc@uc:~/BabylonInteraction/src/BabylonExamples$ cd ..
uc@uc:~/BabylonInteraction/src$ cd ..
uc@uc:~/BabylonInteraction$ nc -zv 10.0.18.88 5174
Connection to 10.0.18.88 5174 port [tcp/*] succeeded!
uc@uc:~/BabylonInteraction$ sudo ufw allow 5174/tcp
Skipping adding existing rule
Skipping adding existing rule (v6)
uc@uc:~/BabylonInteraction$ sudo netstat -tuln | grep 5174
tcp6       0      0 :::5174                 :::*                    LISTEN
uc@uc:~/BabylonInteraction$ sudo apache2ctl -t
sudo: apache2ctl: command not found
uc@uc:~/BabylonInteraction$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
uc@uc:~/BabylonInteraction$ sudo tail -f /var/log/nginx/error.log
2025/03/26 14:35:56 [error] 2185693#2185693: *5299 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 14:35:56 [error] 2185693#2185693: *5301 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 14:36:36 [error] 2185693#2185693: *5303 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 14:36:36 [error] 2185694#2185694: *5305 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:04 [error] 2190661#2190661: *1 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:04 [error] 2190662#2190662: *3 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:16 [error] 2190661#2190661: *5 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:16 [error] 2190661#2190661: *7 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:28 [error] 2190728#2190728: *1 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:28 [error] 2190727#2190727: *3 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
^C
uc@uc:~/BabylonInteraction$ ps aux | grep -i server
uc       2192594  0.0  0.0   6544  2432 pts/0    S+   18:39   0:00 grep --color=auto -i server
uc@uc:~/BabylonInteraction$ openssl s_client -connect 10.0.18.88:5174
CONNECTED(00000003)
40071EA48B770000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:../ssl/record/ssl3_record.c:354:
---
no peer certificate available
---
No client certificate CA names sent
---
SSL handshake has read 5 bytes and written 293 bytes
Verification: OK
---
New, (NONE), Cipher is (NONE)
Secure Renegotiation IS NOT supported
Compression: NONE
Expansion: NONE
No ALPN negotiated
Early data was not sent
Verify return code: 0 (ok)
---
uc@uc:~/BabylonInteraction$ nano DemoScene.ts
uc@uc:~/BabylonInteraction$ cd src
uc@uc:~/BabylonInteraction/src$ cd BabylonExamples
uc@uc:~/BabylonInteraction/src/BabylonExamples$ cd Laboratory
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ nano DemoScene.ts
uc@uc:~/BabylonInteraction/src/BabylonExamples/Laboratory$ cd ..
uc@uc:~/BabylonInteraction/src/BabylonExamples$ cd ..
uc@uc:~/BabylonInteraction/src$ cd ..
uc@uc:~/BabylonInteraction$ npm run dev

> bridge@0.0.0 dev
> vite --host

Port 5174 is in use, trying another one...

  VITE v5.4.15  ready in 307 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://10.0.18.88:5175/
  ➜  press h + enter to show help
^C
uc@uc:~/BabylonInteraction$ sudo lsof -i :5174
COMMAND     PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
node    2192716   uc   24u  IPv6 19114394      0t0  TCP *:5174 (LISTEN)
uc@uc:~/BabylonInteraction$ sudo lsof -i :5174
COMMAND     PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
node    2192716   uc   24u  IPv6 19114394      0t0  TCP *:5174 (LISTEN)
uc@uc:~/BabylonInteraction$ nano vite.config.js
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2192841  │ 0s     │ 23   │ online    │ 0%       │ 13.4mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ nano vite.config.js
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2192900  │ 0s     │ 24   │ online    │ 0%       │ 12.1mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ nano vite.config.js
uc@uc:~/BabylonInteraction$ uc@uc:~/BabylonInteraction$ ^C
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ pm2 restart BabylonInteraction
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [BabylonInteraction](ids: [ 0 ])
[PM2] [BabylonInteraction](0) ✓
┌────┬───────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                  │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ BabylonInteraction    │ default     │ N/A     │ fork    │ 2192992  │ 0s     │ 25   │ online    │ 0%       │ 13.1mb   │ uc       │ enabled  │
└────┴───────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
uc@uc:~/BabylonInteraction$ telnet edu-3d.avtodor-eng.ru 5174
Trying 10.0.18.237...
telnet: Unable to connect to remote host: Connection refused
uc@uc:~/BabylonInteraction$ sudo lsof -i :5174
COMMAND     PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
node    2193008   uc   24u  IPv6 19117933      0t0  TCP *:5174 (LISTEN)
uc@uc:~/BabylonInteraction$ telnet edu-3d.avtodor-eng.ru 5174
Trying 10.0.18.237...
telnet: Unable to connect to remote host: Connection refused
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo ufw status
Status: inactive
uc@uc:~/BabylonInteraction$ sudo ufw allow 5174/tcp
Skipping adding existing rule
Skipping adding existing rule (v6)
uc@uc:~/BabylonInteraction$ sudo iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
uc@uc:~/BabylonInteraction$ sudo iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
uc@uc:~/BabylonInteraction$ sudo iptables -A INPUT -p tcp --dport 5174 -j ACCEPT
uc@uc:~/BabylonInteraction$ telnet edu-3d.avtodor-eng.ru 5174
Trying 10.0.18.237...
telnet: Unable to connect to remote host: Connection refused
uc@uc:~/BabylonInteraction$ nano /etc/nginx/sites-available/
uc@uc:~/BabylonInteraction$ nano /etc/nginx/nginx.conf
uc@uc:~/BabylonInteraction$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ sudo tail -f /var/log/nginx/error.log
2025/03/26 14:35:56 [error] 2185693#2185693: *5299 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 14:35:56 [error] 2185693#2185693: *5301 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 14:36:36 [error] 2185693#2185693: *5303 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 14:36:36 [error] 2185694#2185694: *5305 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:04 [error] 2190661#2190661: *1 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:04 [error] 2190662#2190662: *3 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:16 [error] 2190661#2190661: *5 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:16 [error] 2190661#2190661: *7 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:28 [error] 2190728#2190728: *1 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:28 [error] 2190727#2190727: *3 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
^[[A^[[B^C
uc@uc:~/BabylonInteraction$ pm2 logs
[TAILING] Tailing last 15 lines for [all] processes (change the value with --lines option)
/home/uc/.pm2/pm2.log last 15 lines:
PM2        | 2025-03-26T18:59:03: PM2 log: Stopping app:BabylonInteraction id:0
PM2        | 2025-03-26T18:59:03: PM2 log: App [BabylonInteraction:0] exited with code [0] via signal [SIGINT]
PM2        | 2025-03-26T18:59:03: PM2 log: pid=2192700 msg=process killed
PM2        | 2025-03-26T18:59:03: PM2 log: App [BabylonInteraction:0] starting in -fork mode-
PM2        | 2025-03-26T18:59:03: PM2 log: App [BabylonInteraction:0] online
PM2        | 2025-03-26T19:02:29: PM2 log: Stopping app:BabylonInteraction id:0
PM2        | 2025-03-26T19:02:29: PM2 log: App [BabylonInteraction:0] exited with code [0] via signal [SIGINT]
PM2        | 2025-03-26T19:02:30: PM2 log: pid=2192841 msg=process killed
PM2        | 2025-03-26T19:02:30: PM2 log: App [BabylonInteraction:0] starting in -fork mode-
PM2        | 2025-03-26T19:02:30: PM2 log: App [BabylonInteraction:0] online
PM2        | 2025-03-26T19:04:39: PM2 log: Stopping app:BabylonInteraction id:0
PM2        | 2025-03-26T19:04:39: PM2 log: App [BabylonInteraction:0] exited with code [0] via signal [SIGINT]
PM2        | 2025-03-26T19:04:39: PM2 log: pid=2192900 msg=process killed
PM2        | 2025-03-26T19:04:39: PM2 log: App [BabylonInteraction:0] starting in -fork mode-
PM2        | 2025-03-26T19:04:39: PM2 log: App [BabylonInteraction:0] online

/home/uc/.pm2/logs/BabylonInteraction-error.log last 15 lines:
0|BabylonI | xist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/kernelBlur.fragment-TBG7LN64.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.fragment-VKIYGMBI.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.vertex-6DL3ZCH3.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/layer.vertex-KUZJTMU7.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/layer.fragment-IDPCDXAT.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/rgbdDecode.fragment-GJARJU2O.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/rgbdEncode.fragment-JIAGQQ5W.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/kernelBlur.vertex-AJOKGK2J.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/kernelBlur.fragment-TBG7LN64.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.fragment-VKIYGMBI.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | The file does not exist at "/home/uc/BabylonInteraction/node_modules/.vite/deps/default.vertex-6DL3ZCH3.js" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
0|BabylonI | (node:2192527) Warning: An error event has already been emitted on the socket. Please use the destroy method on the socket while handling a 'clientError' event.
0|BabylonI | (Use `node --trace-warnings ...` to show where the warning was created)

/home/uc/.pm2/logs/BabylonInteraction-out.log last 15 lines:
0|BabylonI | Request URL: /node_modules/.vite/deps/chunk-BZAJGJ3X.js?v=b58e7350
0|BabylonI | Request URL: /models/NEW_HDRI_Town_8.HDR
0|BabylonI | Request URL: /models/Rangefinder.gltf
0|BabylonI | Request URL: /models/Laboratory_MOD_4.gltf
0|BabylonI | Request URL: /models/UltrasonicTester_FR_LP.gltf
0|BabylonI | Request URL: /models/SM_Ruler_LP.gltf
0|BabylonI | Request URL: /models/SM_Caliper.gltf
0|BabylonI | Request URL: /models/SM_TapeMeasure_LP_MOD_1.gltf
0|BabylonI | Request URL: /models/Rangefinder_LP.gltf
0|BabylonI | Request URL: /node_modules/.vite/deps/layer.vertex-LLN34TDV.js?v=b58e7350
0|BabylonI | Request URL: /node_modules/.vite/deps/layer.fragment-3FCDVZMX.js?v=b58e7350
0|BabylonI | Request URL: /vite.svg
0|BabylonI | Request URL: /node_modules/.vite/deps/rgbdDecode.fragment-TGGR4V7F.js?v=b58e7350
0|BabylonI | Request URL: /node_modules/.vite/deps/postprocess.vertex-UP7UBUNF.js?v=b58e7350
0|BabylonI | Request URL: /models/frame4.png

^C
uc@uc:~/BabylonInteraction$ rm -rf node_modules
uc@uc:~/BabylonInteraction$ npm install

added 219 packages, and audited 220 packages in 10s

44 packages are looking for funding
  run `npm fund` for details

3 moderate severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
uc@uc:~/BabylonInteraction$ netstat -tuln | grep 5174
tcp6       0      0 :::5174                 :::*                    LISTEN
uc@uc:~/BabylonInteraction$ nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ netstat -tuln | grep 5174
tcp6       0      0 :::5174                 :::*                    LISTEN
uc@uc:~/BabylonInteraction$ ss -tuln | grep 5174
tcp   LISTEN 0      511                    *:5174            *:*
uc@uc:~/BabylonInteraction$ curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: edu-3d.avtodor-eng.ru" -H "Origin: https://edu-3d.avtodor-eng.ru" wss://edu-3d.avtodor-eng.ru/ws
curl: (1) Protocol "wss" not supported or disabled in libcurl
uc@uc:~/BabylonInteraction$ curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: edu-3d.avtodor-eng.ru" -H "Origin: https://edu-3d.avtodor-eng.ru" wss://edu-3d.avtodor-eng.ru/ws
curl: (1) Protocol "wss" not supported or disabled in libcurl
uc@uc:~/BabylonInteraction$ sudo apt install websocat -y
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
E: Unable to locate package websocat
uc@uc:~/BabylonInteraction$ wget https://github.com/vi/websocat/releases/latest/download/websocat_amd64-linux -O websocat
--2025-03-26 19:37:13--  https://github.com/vi/websocat/releases/latest/download/websocat_amd64-linux
Resolving github.com (github.com)... 140.82.121.4
Connecting to github.com (github.com)|140.82.121.4|:443... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://github.com/vi/websocat/releases/download/v1.14.0/websocat_amd64-linux [following]
--2025-03-26 19:37:13--  https://github.com/vi/websocat/releases/download/v1.14.0/websocat_amd64-linux
Reusing existing connection to github.com:443.
HTTP request sent, awaiting response... 404 Not Found
2025-03-26 19:37:13 ERROR 404: Not Found.

uc@uc:~/BabylonInteraction$ wget https://github.com/vi/websocat/releases/download/v1.12.0/websocat_amd64-linux -O websocat
--2025-03-26 19:37:38--  https://github.com/vi/websocat/releases/download/v1.12.0/websocat_amd64-linux
Resolving github.com (github.com)... 140.82.121.4
Connecting to github.com (github.com)|140.82.121.4|:443... connected.
HTTP request sent, awaiting response... 404 Not Found
2025-03-26 19:37:39 ERROR 404: Not Found.

uc@uc:~/BabylonInteraction$ curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: edu-3d.avtodor-eng.ru" -H "Origin: https://edu-3d.avtodor-eng.ru" wss://edu-3d.avtodor-eng.ru/ws
curl: (1) Protocol "wss" not supported or disabled in libcurl
uc@uc:~/BabylonInteraction$ npm install -g wscat
npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path /usr/local/lib/node_modules/wscat
npm ERR! errno -13
npm ERR! Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/wscat'
npm ERR!  [Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/wscat'] {
npm ERR!   errno: -13,
npm ERR!   code: 'EACCES',
npm ERR!   syscall: 'mkdir',
npm ERR!   path: '/usr/local/lib/node_modules/wscat'
npm ERR! }
npm ERR!
npm ERR! The operation was rejected by your operating system.
npm ERR! It is likely you do not have the permissions to access this file as the current user
npm ERR!
npm ERR! If you believe this might be a permissions issue, please double-check the
npm ERR! permissions of the file and its containing directories, or try running
npm ERR! the command again as root/Administrator.

npm ERR! A complete log of this run can be found in:
npm ERR!     /home/uc/.npm/_logs/2025-03-26T19_38_33_830Z-debug-0.log
uc@uc:~/BabylonInteraction$ sudo npm install -g wscat

added 9 packages in 1s
uc@uc:~/BabylonInteraction$ npx wscat -c wss://edu-3d.avtodor-eng.ru/ws
error: unable to verify the first certificate
> uc@uc:~/BabylonInteraction$ npx wscat --no-check -c wss://edu-3d.avtodor-eng.ru/ws
error: Unexpected server response: 400
> uc@uc:~/BabylonInteraction$ sudo tail -f /var/log/nginx/error.log
2025/03/26 14:35:56 [error] 2185693#2185693: *5299 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 14:35:56 [error] 2185693#2185693: *5301 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 14:36:36 [error] 2185693#2185693: *5303 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "http://10.0.18.88:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 14:36:36 [error] 2185694#2185694: *5305 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "http://10.0.18.88:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:04 [error] 2190661#2190661: *1 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:04 [error] 2190662#2190662: *3 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:16 [error] 2190661#2190661: *5 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:16 [error] 2190661#2190661: *7 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
2025/03/26 16:34:28 [error] 2190728#2190728: *1 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET / HTTP/1.0", upstream: "https://127.0.0.1:5174/", host: "edu-3d.avtodor-eng.ru"
2025/03/26 16:34:28 [error] 2190727#2190727: *3 SSL_do_handshake() failed (SSL: error:0A00010B:SSL routines::wrong version number) while SSL handshaking to upstream, client: 10.0.18.237, server: edu-3d.avtodor-eng.ru, request: "GET /favicon.ico HTTP/1.0", upstream: "https://127.0.0.1:5174/favicon.ico", host: "edu-3d.avtodor-eng.ru", referrer: "https://edu-3d.avtodor-eng.ru/"
^C
uc@uc:~/BabylonInteraction$ nc -zv 10.0.18.88 5174
Connection to 10.0.18.88 5174 port [tcp/*] succeeded!
uc@uc:~/BabylonInteraction$ nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo nano /etc/nginx/sites-available/default
uc@uc:~/BabylonInteraction$ sudo systemctl restart nginx
uc@uc:~/BabylonInteraction$ npx wscat -c wss://edu-3d.avtodor-eng.ru/ws
error: unable to verify the first certificate
> uc@uc:~/BabylonInteraction$ npx wscat --no-check -c wss://edu-3d.avtodor-eng.ru/ws
error: Unexpected server response: 400
> uc@uc:~/BabylonInteraction$