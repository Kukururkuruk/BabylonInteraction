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
import { AdvancedDynamicTexture, Image as GuiImage, Button, Ellipse, StackPanel, TextBlock, Control } from "@babylonjs/gui";
import { TriggersManager } from "./FunctionComponents/TriggerManager3";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { Animation } from "@babylonjs/core/Animations/animation";

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
  private dialogPage: DialogPage;
  private triggerManager2: TriggerManager2;
  private guiManager: GUIManager;
  private arrowButtons: Control[] = [];
  private dialControls: StackPanel[] = []; // Добавляем свойство для хранения крутилок

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();
  

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение, если нужно
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);
    this.triggerManager2 = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    

    this.bubblePosition = new Vector3(0, 0.5, 0); // Инициализация позиции меша

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.fetchData(); // Вызовите fetchData после загрузки окружения
    });

    this.CreateController();
    this.BetonTrigger();

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
    this.camera.speed = 0.35;
    this.camera.angularSensibility = 4000;
    this.camera.inertia = 0.82;
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

      
      // Запрос на backend для получения пути к карте
  /*async CreateEnvironment(): Promise<void> {
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
      console.log("Модели карты успешно загружены:", map);*/



      const rotationPercent = 25; // Угол в процентах (например, 25%)
      const rotationDegrees = rotationPercent * -15; // Переводим проценты в градусы
      const rotationRadians = rotationDegrees * (Math.PI / 180); // Переводим градусы в радианы

      // Загрузка меша Glass.glb
      const { meshes: glassMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Glass.glb", this.scene);
      glassMeshes.forEach((mesh) => {
        const glassMesh = mesh as Mesh;
        this.glassMesh = glassMesh;
        glassMesh.isPickable = false;
        glassMesh.position = new Vector3(0, 0.7, 0);
        glassMesh.scaling = new Vector3(0.7, 0.7, 0.7);
        // Поворот меша на `rotationPercent` процентов по оси X
        glassMesh.rotation = new Vector3(rotationRadians, 0, 0);
      });

      console.log("Меш Glass.glb загружен и установлен.");

      // Загрузка меша Bubble.glb
      const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Bubble.glb", this.scene);
      meshes.forEach((mesh) => {
        mesh.parent = this.glassMesh; // Устанавливаем Glass.glb в качестве родителя для Bubble.glb
        mesh.rotation = new Vector3(0, Math.PI, 0); // Поворот по оси Y
        mesh.isPickable = true;
        mesh.position = new Vector3(0, 0.5, 0);
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

    // Генерация случайной позиции с уменьшенным диапазоном ещё в 2 раза
    const randomX = Math.random() * (0.1125 * 8) - (0.05625 * 8); // Диапазон от -0.45 до 0.45
    const randomZ = Math.random() * (0.1125 * 8) - (0.05625 * 8); // Диапазон от -0.45 до 0.45
//const randomX = Math.random() * 0.075 - 0.0375; // Диапазон от -0.0375 до 0.0375
//const randomZ = Math.random() * 0.075 - 0.0375; // Диапазон от -0.0375 до 0.0375
    this.bubbleMesh.position = new Vector3(randomX, 0.7, randomZ);

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
    const centerTolerance = 0.05; // Допуск для определения нахождения в центре

    // Флаг для отключения управления
    let isTaskCompleted = false;

    // Функция для проверки нахождения пузырька в центре
    const isCentered = (): boolean => {
        if (!this.bubbleMesh) return false;
        return (
            Math.abs(this.bubbleMesh.position.x) < centerTolerance &&
            Math.abs(this.bubbleMesh.position.z) < centerTolerance
        );
    };

    // Функция завершения задания
    const completeTask = () => {
        if (!isTaskCompleted) {
            console.log("Пузырек находится в центре! Задание завершено.");
            // Отключаем управление и кнопки
            isTaskCompleted = true;
            this.dialControls.forEach(button => {
                this.guiTexture.removeControl(button); // Удаляем каждую кнопку
            });
            this.dialControls = []; // Очищаем массив после удаления

            // Оставляем только кнопку завершения
            const endMessage = Button.CreateSimpleButton("endMessage", "Задание завершено!");
            endMessage.width = "200px";
            endMessage.height = "40px";
            endMessage.color = "white";
            endMessage.background = "green";
            endMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            endMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            this.guiTexture.addControl(endMessage);

            // Убираем сообщение через 2 секунды
            setTimeout(() => {
                this.guiTexture.removeControl(endMessage); // Удаляем кнопку с сообщением
            }, 2000); // Подождать 2 секунды перед удалением
        }
    };

    // Создание текстуры GUI
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Функция для создания крутилки
    const createDialControl = (label: string, onRotate: (delta: number) => void, position: [number, number]) => {
        const panel = new StackPanel();
        panel.width = "100px";
        panel.height = "100px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        panel.left = `${position[0]}px`;
        panel.top = `${position[1]}px`;

        // Круглая форма крутилки
        const dial = new Ellipse();
        dial.width = "80px";
        dial.height = "80px";
        dial.color = "white";
        dial.thickness = 4;
        dial.background = "grey";
        dial.isPointerBlocker = true;
        panel.addControl(dial);

        // Текстовое обозначение для крутилки
        const labelBlock = new TextBlock();
        labelBlock.text = label;
        labelBlock.color = "white";
        labelBlock.fontSize = 14;
        panel.addControl(labelBlock);

        // Переменная для отслеживания нажатия кнопки мыши
        let isMouseDown = false;
        let lastY: number | null = null;

        // Событие на нажатие левой кнопки мыши
        dial.onPointerDownObservable.add((event) => {
            if (event.buttonIndex === 0) { // Проверка на левую кнопку мыши
                isMouseDown = true;
            }
        });

        // Событие на отпускание кнопки мыши
        dial.onPointerUpObservable.add(() => {
            isMouseDown = false;
            lastY = null;
        });

        // Обработчик для вращения крутилки при движении мыши
        dial.onPointerMoveObservable.add((event) => {
            if (isMouseDown && lastY !== null && !isTaskCompleted) { // Проверка на завершение задания
                const delta = event.y - lastY;
                onRotate(delta);

                // Проверка, находится ли пузырек в центре после вращения
                if (isCentered()) {
                    completeTask(); // Завершаем задание, если пузырек в центре
                }
            }
            lastY = event.y;
        });

        dial.onPointerOutObservable.add(() => {
            isMouseDown = false;
            lastY = null;
        });

        this.guiTexture.addControl(panel);
    };

    // Крутилка для движения вправо (с плавностью)
    createDialControl("Right", (delta) => { 
        if (this.bubbleMesh && delta > 0 && !isTaskCompleted) {
            const targetX = this.bubbleMesh.position.x + moveSpeed;
            this.bubbleMesh.position.x = Math.max(this.bubbleMesh.position.x, targetX);
        }
    }, [150, 0]);

    // Крутилка для движения влево (с плавностью)
    createDialControl("Left", (delta) => { 
        if (this.bubbleMesh && delta > 0 && !isTaskCompleted) {
            const targetX = this.bubbleMesh.position.x - moveSpeed;
            this.bubbleMesh.position.x = Math.min(this.bubbleMesh.position.x, targetX);
        }
    }, [-150, 0]);

    // Крутилка для движения вверх и вниз (плавная)
    createDialControl("Up/Down", (delta) => { 
        if (this.bubbleMesh && !isTaskCompleted) {
            const targetZ = this.bubbleMesh.position.z + (delta > 0 ? moveSpeed : -moveSpeed);
            this.bubbleMesh.position.z = targetZ;
        }
    }, [0, -150]);

    // Добавляем обработчик события для клавиши "i"
    window.addEventListener("keydown", (event) => {
        if (event.key === "i" || event.key === "ш") {
            console.log("Клавиша 'i' или 'ш' нажата!");
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


  CompleteLevel(): void {
    console.log("Процесс завершен: Пузырь в центре!");
    
    // Отобразить финальное сообщение
    const endMessage = Button.CreateSimpleButton("endMessage", "Пузырь установлен в центре!");
    endMessage.width = "200px";
    endMessage.height = "40px";
    endMessage.color = "white";
    endMessage.background = "green";
    endMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    endMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.guiTexture.addControl(endMessage);

    // Убираем стрелочные кнопки
    this.dialControls.forEach(button => {
      this.guiTexture.removeControl(button); // Удаляем каждую кнопку
  });
  this.dialControls = []; // Очищаем массив после удаления
  
     // Убираем сообщение через 2 секунды
     setTimeout(() => {
      this.guiTexture.removeControl(endMessage); // Удаляем кнопку с сообщением
  }, 2000); // Подождать 2 секунды перед удалением

  // Остановить цикл рендеринга (если необходимо)
  // this.engine.stopRenderLoop();

  // Закрыть приложение (если необходимо)
  setTimeout(() => {
      window.close(); // Это работает только для окон, открытых скриптами
  }, 4000); // Подождать 4 секунды перед закрытием, чтобы сообщение успело отобразиться
}

CheckCenterPosition(): void {
  const centerPosition = new Vector3(0, 0.7, 0); // Определяем центр
  const threshold = 0.05; // Порог для более строгой проверки

  if (this.bubbleMesh) {
      // Проверяем, находится ли пузырь в пределах порога
      const distance = this.bubbleMesh.position.subtract(centerPosition).length();
      

      // Проверяем, находится ли меш в центре
      const isInCenter = distance < threshold;

      if (isInCenter && !this.isHighlighted) {
          // Если пузырек в центре и еще не подсвечен, добавляем подсветку
          this.highlightLayer.addMesh(this.bubbleMesh, Color3.Green());
          console.log("Пузырь в центре!"); // Логируем, когда пузырь в центре
          this.isHighlighted = true; // Устанавливаем флаг подсветки
          this.CompleteLevel(); // Завершаем процесс
      } else if (!isInCenter && this.isHighlighted) {
          // Если пузырек не в центре, а был подсвечен, удаляем подсветку
          this.highlightLayer.removeMesh(this.bubbleMesh);
          console.log("Пузырь не в центре!"); // Логируем, когда пузырь не в центре
          this.isHighlighted = false; // Сбрасываем флаг подсветки
      }
  }
}

  BetonTrigger(): void {
    const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
    this.guiManager.CreateDialogBox([page1])

            this.triggerManager2.createStartButton('Начать', () => {
            // Показываем сообщение

            const page2 = this.dialogPage.addText("Подойдите к пузырьковому уровню и нажмите на него. С помощью винтов трегера установите пузырёк уровня в центр.  После того как установите пузырек завершите задание нажав на кнопку 'Завершить' ")
            const page3 = this.dialogPage.addInputGrid("Конструкции", ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"])
            this.guiManager.CreateDialogBox([page2, page3])

              // Активируем режим лазера для второй триггер-зоны
            //this.triggerManager2.distanceMode();
              //this.triggerManager2.enableDistanceMeasurement()
              this.triggerManager2.createStartButton('Завершить', () => {
                const page4 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для премещение на основную карту")
                this.guiManager.CreateDialogBox([page4])
                this.triggerManager2.disableDistanceMeasurement()

                //this.triggerManager2.exitDisLaserMode2();
                this.guiManager.createRouteButton('/test')
            })

            
            })

}


}
