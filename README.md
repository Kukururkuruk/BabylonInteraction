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


```
