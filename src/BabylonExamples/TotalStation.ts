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
  PointerEventTypes,
  StandardMaterial,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Image as GuiImage, Button, Control, TextBlock } from "@babylonjs/gui";
import { TriggersManager } from "./FunctionComponents/TriggerManager3";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { GUIManager } from "./FunctionComponents/GUIManager";
import * as GUI from "@babylonjs/gui";

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
  private isClicked: boolean = false; // Переменная для отслеживания состояния клика
  

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
    this.setupRaycastInteraction()
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
    
    // Перекрестие
    this.createCrosshair();
    

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
    //this.camera.keysUp.push(87); // W
    //this.camera.keysLeft.push(65); // A
    //this.camera.keysDown.push(83); // S
    //this.camera.keysRight.push(68); // D

    // Обработка Pointer Lock для свободного обзора
    this.canvas.addEventListener("click", () => {
      if (document.pointerLockElement !== this.canvas) {
          this.canvas.requestPointerLock();
          console.log("Requesting pointer lock...");
      }
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === this.canvas) {
        console.log("Pointer locked");  // Указатель заблокирован
    } else {
        console.log("Pointer unlocked");  // Указатель разблокирован
    }
});

    // Добавляем обработку правой кнопки мыши
    this.setupZoomEffect();
  }


  

  // Метод настройки луча
 // Метод для настройки взаимодействия с лучом (система событий)
setupRaycastInteraction(): void {
  this.scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0 && !this.isClicked) {
      this.isClicked = true;

      // Получаем направление луча от камеры
      const ray = this.camera.getForwardRay();
      
      // Пытаемся выбрать меш, с которым пересекается луч
      const pickResult = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable);

      if (pickResult?.hit && pickResult.pickedMesh) {
        const pickedMesh = pickResult.pickedMesh;

        // Приводим pickedMesh к типу Mesh (так как это всегда будет Mesh)
        if (pickedMesh instanceof Mesh) {
          // Проверяем, что клик был по объекту с именем 'point'
          if (pickedMesh.name === "point") {
            console.log("Клик по объекту:", pickedMesh.name);
            // Вызываем метод для обработки клика по объекту
            this.handlePointClick(pickedMesh);
          } else {
            console.log("Клик не по объекту point");
          }
        }
      }

      // Сбрасываем флаг через задержку
      setTimeout(() => {
        this.isClicked = false;
      }, 200);  // Задержка в 200 миллисекунд
    }
  });
}

// Логика, которая выполняется при клике на объект
onObjectClicked(mesh: AbstractMesh): void {
    // Добавьте свои действия с объектом
    mesh.material = new StandardMaterial("clickedMaterial", this.scene);
    (mesh.material as StandardMaterial).diffuseColor = new Color3(1, 0, 0); // Меняем цвет объекта на красный
    console.log(`Вы кликнули по объекту: ${mesh.name}`);
}


  async CreateEnvironment(): Promise<void> {
    try {
        // Продолжаем работу по загрузке окружения
        const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
        map.forEach((mesh) => {
            mesh.checkCollisions = true;
            // Замораживаем активные меши после завершения всех настроек
        //this.scene.freezeActiveMeshes();
        });
        console.log("Модели карты успешно загружены:", map);
        
        // Теперь отправляем данные на сервер после загрузки карты
        //await this.sendPointsData(this.pointsPressedCount);
        // Замораживаем активные меши после завершения всех настроек
        //this.scene.freezeActiveMeshes();
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

// Создаем перекрестие
createCrosshair(): void {
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  const crosshair = new GUI.Rectangle("crosshair");
  crosshair.width = "20px";
  crosshair.height = "20px";
  crosshair.color = "white";
  crosshair.thickness = 2;
  crosshair.background = "transparent";
  crosshair.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  crosshair.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

  advancedTexture.addControl(crosshair);
}

//Обработка зума с эффектом бинокля
setupZoomEffect(): void {
  const defaultFov = this.camera.fov; // Сохраняем стандартное поле зрения
  const zoomedFov1 = defaultFov / 4; // Первый уровень приближения
  const zoomedFov2 = defaultFov / 8; // Второй уровень приближения
  const zoomedFov3 = defaultFov / 12; // Второй уровень приближения

  const defaultSensibility = this.camera.angularSensibility; // Сохраняем стандартную чувствительность
  const zoomedSensibility = defaultSensibility * 10; // Уменьшаем чувствительность (чем больше значение, тем ниже чувствительность)

  let zoomState = 0; // 0: обычный вид, 1: первый зум, 2: второй зум

  // Обработка событий мыши
  this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
          // Переходим к следующему состоянию зума
          zoomState = (zoomState + 1) % 4; // Переключение между 0, 1 и 2

          if (zoomState === 0) {
              this.camera.fov = defaultFov; // Вернуть стандартное FOV
              this.camera.angularSensibility = defaultSensibility; // Восстановить стандартную чувствительность
          } else if (zoomState === 1) {
              this.camera.fov = zoomedFov1; // Первый уровень зума
              this.camera.angularSensibility = zoomedSensibility; // Уменьшить чувствительность
          } else if (zoomState === 2) {
              this.camera.fov = zoomedFov2; // Второй уровень зума
              this.camera.angularSensibility = zoomedSensibility; // Уменьшить чувствительность
          } else if (zoomState === 3) {
            this.camera.fov = zoomedFov3; // Третий уровень зума
            this.camera.angularSensibility = zoomedSensibility; // Уменьшить чувствительность
          }

      }
  });
}

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

// Метод обработки клика по точке
handlePointClick(point: Mesh): void {
  // Проверяем, была ли точка уже выбрана
  if (!this.highlightedPoints.includes(point)) {
    // Добавляем точку в подсветку и увеличиваем счетчик
    this.highlightLayer.addMesh(point, Color3.Yellow());
    this.highlightedPoints.push(point);
    this.pointsPressedCount++;
    console.log("Текущее количество нажатых точек:", this.pointsPressedCount);
  } else {
    // Убираем точку из подсветки и уменьшаем счетчик
    this.highlightLayer.removeMesh(point);
    const index = this.highlightedPoints.indexOf(point);
    if (index !== -1) {
      this.highlightedPoints.splice(index, 1); // Удаляем точку из массива
      this.pointsPressedCount--;
    }
    console.log("Текущее количество нажатых точек:", this.pointsPressedCount);
  }

  this.updatePointsCountDisplay(); // Обновляем счетчик на экране

  // Проверяем, завершена ли задача
  if (this.pointsPressedCount === this.totalPoints && !this.taskCompleted) {
    this.taskCompleted = true;
    this.completeTask();
  }
}

completeTask(): void {
  const pointsText = `Нажатые точки: ${this.pointsPressedCount}`;
  console.log(pointsText);

  this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для перемещения на основную карту");
  this.guiManager.CreateDialogBox([page4]);
  this.triggerManager2.disableDistanceMeasurement();
  this.guiManager.createRouteButton('/test');

  // Отправляем данные на сервер только один раз, когда задача завершена
  this.sendFinalCountToServer(this.pointsPressedCount);
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

    // Добавляем обработчик события для клавиши "i" или "ш"
  window.addEventListener("keydown", (event) => {
    if (event.key === "i" || event.key === "ш") {
      console.log("Клавиша 'i' или 'ш' нажата!"); // Лог для проверки
      this.ToggleInventory();
    }
  });

    
  }

  // Метод для переключения состояния инвентаря
  private ToggleInventory(): void {
    console.log("Переключение инвентаря, текущее состояние:", this.inventoryVisible);
    if (this.inventoryVisible) {
      this.HideInventory();
    } else {
      this.ShowInventory();
    }
    this.updatePointsCountDisplay(); // Обновление текста
  }

  // Метод для отображения инвентаря
  private ShowInventory(): void {
    console.log("Вызван ShowInventory");
    if (!this.inventoryImage) {
      console.log("Создаем новый инвентарь");
      this.inventoryImage = new GuiImage("inventoryImage", "/models/frame1.png");
      this.inventoryImage.width = "300px";
      this.inventoryImage.height = "400px";
      this.inventoryImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.inventoryImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.inventoryImage.top = "10px";
      this.inventoryImage.left = "0px";
      this.guiTexture.addControl(this.inventoryImage);
    }
  
    console.log("Отображаем инвентарь");
    this.inventoryImage.isVisible = false; // Показываем инвентарь
    this.inventoryVisible = true;
    this.updatePointsCountDisplay();
  }
  

  // Метод для скрытия инвентаря
  private HideInventory(): void {
    console.log("Вызван HideInventory");
    if (this.inventoryImage) {
      console.log("Скрываем инвентарь");
      this.inventoryImage.isVisible = false;
    }
    this.inventoryVisible = false;
    this.HidePointsCount();
  }

  // Скрываем текст с количеством нажатых точек
  private HidePointsCount(): void {
    if (this.pointsCountText) {
      this.pointsCountText.isVisible = false;
    }
  }

  // Создаем точки на карте
  // Создание точек на карте
private createPoints() {
  const pointsPositions = [
    new Vector3(12.8824, 6.04612, 7.3295),
    new Vector3(12.4246 , 8.88759 , -7.65193),
    new Vector3(-0.54295, 6.38412 , -10.1049),
    new Vector3(-2.43646 , 6.04612, 6.35334),
    new Vector3(-4.33195 , 6.1931 , 6.27981),
    new Vector3(1.08095, 6.38412, 6.13351 ),
    new Vector3(12.4621 , 6.11568 , -1.98692),
    new Vector3(12.8824  , 7.3295  , -14.1588),
    new Vector3(12.9036 , 5.12722  , 12.9169 ),
  ];

  pointsPositions.forEach(pos => {
    const point = MeshBuilder.CreateSphere("point", { diameter: 0.3 }, this.scene);
    point.position = pos;
    point.isVisible = true;
    point.isPickable = true;  // Делаем точку кликабельной

    // Добавление точек в массив для управления
    this.points.push(point);

    // Добавляем действие при клике на точку
    point.actionManager = new ActionManager(this.scene);
    point.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
      // Вызываем обработчик клика
      this.handlePointClick(point);

      // Логируем позицию точки
      console.log(`Точка нажата: ${point.name}, позиция: ${point.position}`);
    }));

    console.log(`Точка создана на позиции: ${pos}`);
  });
}

// Обновление отображения количества нажатых точек
private updatePointsCountDisplay(): void {
  if (!this.pointsCountText) {
    console.log("Создаём TextBlock для отображения количества нажатых точек.");
    this.pointsCountText = new TextBlock("pointsCount", `Нажатые точки: ${this.pointsPressedCount}`);
    this.pointsCountText.color = "white";
    this.pointsCountText.fontSize = 20;
    this.pointsCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.pointsCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.pointsCountText.top = "10px";
    this.pointsCountText.left = "10px";
    this.guiTexture.addControl(this.pointsCountText);
  }

  this.pointsCountText.text = `Нажатые точки: ${this.pointsPressedCount}`;
  this.pointsCountText.isVisible = this.inventoryVisible; // Видимость зависит от инвентаря
  console.log(`Текст обновлён: ${this.pointsCountText.text}`);
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

    // Удаляем обработку 'i' или 'ш', так как она будет в другом месте
    // Оставляем только общую обработку других клавиш
  });

  window.addEventListener("keyup", (event) => {
    this.inputMap[event.key] = false;
  });
}
}
