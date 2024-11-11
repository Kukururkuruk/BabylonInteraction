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
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { GUIManager } from "./FunctionComponents/GUIManager";

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
  private pointsPressedCount = 0;
  private dialogPage: DialogPage;
  private triggerManager2: TriggerManager2;
  private guiManager: GUIManager;
  private totalPoints: number = 9; // Задаем количество точек, которые нужно нажать
  private highlightedPoints: Mesh[] = []; // Список для хранения подсвеченных точек
  private taskCompleted: boolean = false;
  //private isRequestInProgress = false; // Флаг для отслеживания состояния запроса
  private isDataSent: boolean = false;
  

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);
    this.triggerManager2 = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    
    //this.sendPointsData(this.pointsPressedCount);
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.fetchData(); // Вызовите fetchData после загрузки окружения
      this.createPoints(); // Создаем точки
    });

    this.CreateController();
    this.BetonTrigger();

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
      const response = await fetch('http://127.0.0.1:5000/api/data');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Полученные данные:', data);
      
      // Сбрасываем счетчик на клиенте на 0
      this.pointsPressedCount = 0;  // Инициализируем его в 0
      
      // Дополнительно, если данные содержат другие значения, которые вы хотите использовать
      if (data.pointsPressedCount !== undefined) {
        this.pointsPressedCount = data.pointsPressedCount;
      }
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


  async CreateEnvironment(): Promise<void> {
    try {
        // Продолжаем работу по загрузке окружения
        const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
        map.forEach((mesh) => {
            mesh.checkCollisions = true;
        });
        console.log("Модели карты успешно загружены:", map);
        
        // Теперь отправляем данные на сервер после загрузки карты
        //await this.sendPointsData(this.pointsPressedCount);
        
    } catch (error) {
        console.error("Ошибка при загрузке окружения или отправке данных:", error);
    }
}
  // Запрос на backend для получения пути к карте
/*async CreateEnvironment(): Promise<void> {
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
}*/


/*async sendPointsData(pointsPressedCount: number): Promise<void> {
  try {
    console.log(`Отправка данных: ${pointsPressedCount}`);
    const response = await fetch('http://127.0.0.1:5000/api/user/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsPressedCount })
    });

    const data = await response.json();
    console.log("Ответ от сервера:", data);
  } catch (error) {
    console.error("Ошибка при отправке данных:", error);
  }
}*/

createUserPoint(user: { name: string; x: number; y: number; z: number }): void {
  const sphere = MeshBuilder.CreateSphere(user.name, { diameter: 1 }, this.scene);
  sphere.position.set(user.x, user.y, user.z);

  // Добавление события клика по точке
  sphere.actionManager = new ActionManager(this.scene);
  sphere.actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnPickTrigger, 
      () => this.handlePointClick(sphere) // Передаём сферу как параметр
  ));
}

handlePointClick(point: Mesh): void {
  if (!this.highlightedPoints.includes(point)) {
    this.highlightLayer.addMesh(point, Color3.Yellow());
    this.highlightedPoints.push(point);
    this.pointsPressedCount++;
    console.log("Текущее количество нажатых точек:", this.pointsPressedCount);
    
    /*if (!this.taskCompleted) {
      this.sendPointsData(this.pointsPressedCount);
    }*/

    this.updatePointsCountDisplay();

    if (this.pointsPressedCount === this.totalPoints && !this.taskCompleted) {
      this.taskCompleted = true;
      this.completeTask();
    }
  }
}

completeTask(): void {
  const pointsText = `Нажатые точки: ${this.pointsPressedCount}`;
  console.log(pointsText);

  this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для перемещения на основную карту");
  this.guiManager.CreateDialogBox([page4]);
  this.triggerManager2.disableDistanceMeasurement();
  this.guiManager.createRouteButton('/test');

  //this.sendDataToServer(this.pointsPressedCount);
  console.log("Задача выполнена");
}

// Этот метод теперь будет вызываться только после того, как все точки были нажаты.
/*sendDataToServer(pointsPressedCount: number): void {
  if (this.isRequestInProgress) return; // Проверка на состояние запроса
  
  this.isRequestInProgress = true; // Устанавливаем флаг в активное состояние
  
  console.log(`Отправка данных на сервер: ${pointsPressedCount}`);
  fetch('http://127.0.0.1:5000/api/user/points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointsPressedCount })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Ответ от сервера:', data);
    this.pointsPressedCount = data.pointsPressedCount;  // Обновление локального счётчика
  })
  .catch(error => console.error('Ошибка отправки данных:', error))
  .finally(() => {
    this.isRequestInProgress = false; // Снимаем блокировку после завершения запроса
  });
}*/


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
  this.inventoryImage.isVisible = false;
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
      // Отладка создания точки
      console.log(`Точка создана на позиции: ${pos}`);

       // Проверка наличия `highlightLayer` и добавление, если он отсутствует
       if (!this.highlightLayer) {
        this.highlightLayer = new HighlightLayer("highlightLayer", this.scene);
        console.log("HighlightLayer создан.");
    }

      // Добавляем действие при клике на точку
      point.actionManager = new ActionManager(this.scene);
      // Регистрация действия
      point.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
         // Отладочный вывод при клике
        console.log(`Точка нажата: ${point.name}, позиция: ${point.position}`);
        // Если точка подсвечена, убираем подсветку
        if (this.highlightLayer.hasMesh(point)) {
          this.highlightLayer.removeMesh(point);
          this.pointsPressedCount--; // Уменьшаем счетчик при снятии подсветки
          console.log(`Точка удалена из подсветки. Текущий счётчик: ${this.pointsPressedCount}`);
        } else {
          // Если точка не подсвечена, добавляем подсветку
          this.highlightLayer.addMesh(point, Color3.Yellow());
          this.pointsPressedCount++; // Увеличиваем счетчик при добавлении подсветки
          console.log(`Точка добавлена в подсветку. Текущий счётчик: ${this.pointsPressedCount}`);
        }
        this.updatePointsCountDisplay(); // Обновляем отображение счетчика

        // Отправляем обновленное значение на сервер
        //this.sendDataToServer(this.pointsPressedCount);
      }));

      this.points.push(point);
      console.log(`Точка создана на позиции: ${pos}`); // Лог для отладки
      
    });

    
  }

  private updatePointsCountDisplay(): void { 

    if (this.pointsCountText !== null) {
      this.pointsCountText.text = `Точки нажаты: ${this.pointsPressedCount}`;
  }

    // Проверяем, виден ли инвентарь, прежде чем обновлять отображение нажатых точек
    if (this.inventoryVisible) {
      // Создаем текст для отображения количества нажатых точек
      const pointsText = `Нажатые точки: ${this.pointsPressedCount}`;
      console.log(pointsText); // Выводим текущий счётчик в консоль для отладкиш
      
      if (!this.pointsCountText) {
        this.pointsCountText = new TextBlock("pointsCount", pointsText);
        this.pointsCountText.color = "white";
        this.pointsCountText.fontSize = 20;
  
        // Устанавливаем выравнивание
        this.pointsCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Выравнивание по левому краю
        this.pointsCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // Положение текста в верхней части
        
        // Установите значения top и left в пределах планшета
        this.pointsCountText.top = "0px"; // Отступ от верхней границы инвентаря
        this.pointsCountText.left = "0px"; // Отступ от левой границы инвентаря
  
        // Добавляем текст на графический интерфейс
        this.guiTexture.addControl(this.pointsCountText);
      } else {
        this.pointsCountText.text = pointsText; // Обновляем текст
      }
      
      this.pointsCountText.isVisible = true; // Убедитесь, что текст виден
    }
  }

  sendFinalCountToServer(pointsPressedCount: number): void {
    console.log('Пытаемся отправить данные на сервер:', pointsPressedCount);
  
    if (this.isDataSent) {
      console.log('Данные уже были отправлены, пропускаем запрос');
      return;
    }
  
    this.isDataSent = true;
    console.log('Отправка окончательного значения точек на сервер:', pointsPressedCount);
  
    fetch('http://127.0.0.1:5000/api/user/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsPressedCount })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Ответ от сервера с итоговым значением:', data);
    })
    .catch(error => console.error('Ошибка отправки данных:', error))
    .finally(() => {
      this.isDataSent = false;  // Сброс флага после выполнения запроса
    });
  }
  
  BetonTrigger(): void {
  const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
  this.guiManager.CreateDialogBox([page1])

  this.triggerManager2.createStartButton('Начать', () => {
    const page2 = this.dialogPage.addText("Произведите съемку для обследования мостовых сооружений...")
    const page3 = this.dialogPage.addInputGrid("Конструкции", ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"])
    this.guiManager.CreateDialogBox([page2, page3])

    // Проверка, чтобы обработчик не был привязан дважды
    let finishButtonDisabled = false;  // Флаг для блокировки кнопки

    this.triggerManager2.createStartButton('Завершить', () => {
      if (finishButtonDisabled) {
        console.log('Кнопка "Завершить" уже нажата, пропускаем действие');
        return;  // Если кнопка уже была нажата, не выполняем действия
      }

      finishButtonDisabled = true;  // Блокируем кнопку
      console.log('Кнопка "Завершить" нажата');
      this.sendFinalCountToServer(this.pointsPressedCount);  // Отправка данных
      const page4 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для перемещения на основную карту")
      this.guiManager.CreateDialogBox([page4])
      this.triggerManager2.disableDistanceMeasurement()  // Отключение измерений
      this.guiManager.createRouteButton('/test')  // Перенаправление
    });
  });
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
