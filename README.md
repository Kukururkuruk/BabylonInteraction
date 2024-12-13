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
