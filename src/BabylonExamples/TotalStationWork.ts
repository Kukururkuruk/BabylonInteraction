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

export class TotalStationWork {
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
  private totalPoints: number = 28; // Задаем количество точек, которые нужно нажать
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
            if (pickedMesh.name.startsWith("point")) {
              console.log("Клик по объекту:", pickedMesh.name);
  
              // Вызываем метод для обработки клика по объекту
              this.handlePointClick(pickedMesh);
  
              // Логируем имя и позицию точки
              console.log(`Точка нажата: ${pickedMesh.name}, позиция: ${pickedMesh.position}`);
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
        const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD.gltf", this.scene);
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
// Метод обработки клика по точке
handlePointClick(point: Mesh): void {
  // Проверяем, была ли точка уже выбрана
  if (!this.highlightedPoints.includes(point)) {
      // Добавляем точку в подсветку и увеличиваем счетчик
      this.highlightLayer.addMesh(point, Color3.Yellow());
      this.highlightedPoints.push(point);
      this.pointsPressedCount++;
      console.log("Текущее количество нажатых точек:", this.pointsPressedCount);

      // Добавляем флаг, чтобы исключить повторную отправку данных до завершения текущего клика
      if (this.pointsPressedCount === this.totalPoints && !this.taskCompleted) {
          this.taskCompleted = true;
          this.completeTask();
      }
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

  // Новая функциональность: расчет расстояния и отображение информации о точке
  const distance = Vector3.Distance(this.camera.position, point.position);
  const pointName = point.name;

  // Получение мировых координат точки
  const worldPosition = point.getAbsolutePosition();
  const coordinates = `X: ${worldPosition.x.toFixed(2)}, Y: ${worldPosition.y.toFixed(2)}, Z: ${worldPosition.z.toFixed(2)}`;

  console.log(`Расстояние до точки: ${distance.toFixed(2)} м`);
  console.log(`Наименование точки: ${pointName}`);
  console.log(`Мировые координаты: ${coordinates}`);

  // Отображение информации на экране
  const textBlock = new TextBlock();
  textBlock.text = `Точка: ${pointName}\nРасстояние: ${distance.toFixed(2)} м\nКоординаты: ${coordinates}`;
  textBlock.color = "white";
  textBlock.fontSize = 24;
  textBlock.top = "20px";
  textBlock.left = "20px";
  textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

  // Удаляем старую информацию (если была)
  if (this.pointsCountText) {
      this.guiTexture.removeControl(this.pointsCountText);
  }

  // Сохраняем ссылку на текущий текст
  this.pointsCountText = textBlock;

  // Добавляем новую информацию
  this.guiTexture.addControl(textBlock);

  // Удаляем текст через 2 секунды
  setTimeout(() => {
      this.guiTexture.removeControl(textBlock);
      this.pointsCountText = null; // Обнуляем ссылку
  }, 2000);
}


// Метод для вычисления расстояния между камерой и объектом
calculateDistanceToPoint(point: Vector3): number {
  const cameraPosition = this.camera.position;
  return Vector3.Distance(cameraPosition, point);
}

// Метод для отображения информации о точке
displayPointInfo(point: AbstractMesh): void {
  // Получаем координаты точки
  const pointPosition = point.getAbsolutePosition();
  
  // Вычисляем расстояние до точки
  const distance = this.calculateDistanceToPoint(pointPosition);
  
  // Создаем или обновляем текстовый блок для отображения информации
  if (!this.pointsCountText) {
    this.pointsCountText = new TextBlock("pointsInfo", `Точка: ${point.name} | Расстояние: ${distance.toFixed(2)} м`);
    this.pointsCountText.color = "white";
    this.pointsCountText.fontSize = 20;
    this.pointsCountText.top = "-40px"; // Размещаем немного выше от центра
    this.pointsCountText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.pointsCountText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.guiTexture.addControl(this.pointsCountText);
  } else {
    // Если текстовый блок уже существует, обновляем его
    this.pointsCountText.text = `Точка: ${point.name} | Расстояние: ${distance.toFixed(2)} м`;
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
  //this.sendFinalCountToServer(this.pointsPressedCount);
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
   // правая сторона
  new Vector3(12.2428, 6.13792, 13.0217),
  new Vector3(10.35, 6.14157, 13.0217),
  new Vector3(8.45428, 6.18746, 13.0217),
  new Vector3(6.55912, 6.24409, 13.0217),
  new Vector3(4.66065, 6.28081, 13.0217),
  new Vector3(2.76875, 6.33937, 13.0217),
  new Vector3(0.870274, 6.37793, 13.0217),
  new Vector3(-0.754175, 6.37793, 13.0217),
  new Vector3(-2.70299, 6.33937, 13.0217),
  new Vector3(-4.54455, 6.28081, 13.0217),
  new Vector3(-6.44302, 6.24409, 13.0217),
  new Vector3(-8.33819, 6.18746, 13.0217),
  new Vector3(-10.2339, 6.14157, 13.0217),
  new Vector3(-12.2339, 6.13752, 13.0217),

  // левая сторона
  new Vector3(12.2428, 6.13752, -13.0217),
  new Vector3(10.35, 6.14157, -13.0217),
  new Vector3(8.45428, 6.18746, -13.0217),
  new Vector3(6.55912, 6.24409, -13.0217),
  new Vector3(4.66065, 6.28081, -13.0217),
  new Vector3(2.76875, 6.33937, -13.0217),
  new Vector3(0.870274, 6.37793, -13.0217),
  new Vector3(-0.754175, 6.37793, -13.0217),
  new Vector3(-2.70299, 6.33937, -13.0217),
  new Vector3(-4.54455, 6.28081, -13.0217),
  new Vector3(-6.44302, 6.24409, -13.0217),
  new Vector3(-8.33819, 6.18746, -13.0217),
  new Vector3(-10.2339, 6.14157, -13.0217),
  new Vector3(-12.2339, 6.13752, -13.0217),

    //угловые элементы правая сторона 
    new Vector3(12.8763   , 5.850    , 12.97 ),
    new Vector3(12.8763    , 5.170    , 12.97  ),
    new Vector3(12.8763   , -0.015   , 12.97 ),

    //угловые элементы левая сторона 
    new Vector3(12.8763   , 5.850    , -12.97 ),
    new Vector3(12.8763    , 5.170    , -12.97  ),
    new Vector3(12.8763   , -0.015   , -12.97 ),

    //верх моста 
    new Vector3(12.4621   , 6.16    , 2.07228 ),
    new Vector3(12.4621    , 6.16     , -1.98651   ),

    //дорога 
    new Vector3(12.4621   , 0.602086    , 2.07228 ),
    new Vector3(12.4621    , 0.602086     , -1.98651   ),

    //верх моста три точки рядом право 
    new Vector3(12.8905    , 7.23595    , 14.1753  ),
    new Vector3(12.8837    , 7.32402      , 14.4151    ),
    new Vector3(12.8837    , 7.32402     , 15.3646   ),
    //верх моста три точки рядом лево 
    new Vector3(12.8905    , 7.23595    , -14.1753  ),
    new Vector3(12.8837    , 7.32402      , -14.4151    ),
    new Vector3(12.8837    , 7.32402     , -15.3646   ),
  ];

  
  pointsPositions.forEach((pos, index) => {
    const point = MeshBuilder.CreateBox("point", { size: 0.1 }, this.scene);
    point.position = pos;
    point.isVisible = true;
    point.isPickable = true;  // Делаем точку кликабельной
    // Присваиваем уникальное имя точке
    point.name = `point${index + 1}`;  // Имя будет point1, point2 и так далее


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








/*import {
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
import * as BABYLON from "babylonjs";

export class TotalStationWork{
  scene: Scene;
  engine: Engine;
  camera!: FreeCamera;
  triggerManager: TriggersManager;
  guiTexture: AdvancedDynamicTexture;
  highlightLayer: HighlightLayer;
  inputMap: { [key: string]: boolean } = {}; // Карта для отслеживания нажатий клавиш
  // Счетчик нажатых точек
  private pointsPressedCount = 0;
  private dialogPage: DialogPage;
  private triggerManager2: TriggerManager2;
  private guiManager: GUIManager;
  private isTaskStarted: boolean = false;  // Флаг для отслеживания начала задания
  private guiControls: GUI.Control[] = [];  // Массив для хранения элементов GUI
  private isPointerLocked = false;  // Флаг, отслеживающий состояние блокировки указателя
  private isCursorActive = true;
  //private isRequestInProgress = false; // Флаг для отслеживания состояния запроса

  

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

    });

    this.CreateController();
    this.BetonTrigger();


    // Создаем UI с кнопками стрелок
    this.CreateArrowsUI();

    this.engine.runRenderLoop(() => {
      // Рендерим сцену
      this.scene.render();
    });
    this.setupRaycastInteraction()
    this.createClickableSpheres()
  }








  
  // Метод для получения данных
  /*async fetchData() {
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
    this.setupCanvasFocus();

    return scene;
  }

  CreateController(): void {
    this.camera = new FreeCamera("camera", new Vector3(45.9713, 3, -1.95292), this.scene);
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
    this.setupPointerLock();
    // Добавляем обработку правой кнопки мыши
    this.setupZoomEffect();
  }


  setupPointerLock(): void {
    if (!this.canvas) {
        console.error("Canvas is not initialized.");
        return;
    }

    // Переключение блокировки указателя при клике
    this.canvas.addEventListener("click", () => {
        if (!this.isPointerLocked && document.pointerLockElement !== this.canvas) {
            this.canvas.requestPointerLock(); // Блокируем указатель
            this.isCursorActive = false; // Курсор скрыт и деактивирован
            this.isPointerLocked = true;  // Устанавливаем флаг блокировки
            console.log("Pointer locked and cursor hidden.");
            this.disableUIInteractions(); // Отключаем взаимодействие с UI
        }
    });

    // Обработчик изменения состояния указателя
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === this.canvas) {
      console.log("Pointer locked.");
      this.isCursorActive = false;  // Курсор скрыт
      this.isPointerLocked = true;  // Устанавливаем флаг блокировки
      this.disableUIInteractions(); // Отключаем взаимодействие с UI
  } else {
      console.log("Pointer unlocked.");
      this.isCursorActive = true;  // Курсор включен
      this.isPointerLocked = false; // Сбрасываем флаг блокировки
      this.enableUIInteractions(); // Включаем взаимодействие с UI
  }
});

   // Обработчик клика, чтобы заблокировать указатель при необходимости
this.canvas.addEventListener("click", () => {
  if (!this.isPointerLocked && document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock(); // Блокируем указатель только если не заблокирован
      console.log("Pointer locked and cursor hidden.");
  }
});
}

// Включение взаимодействия с UI
// Включение взаимодействия с UI
enableUIInteractions(): void {
  if (this.scene.activeCamera) { // Проверка на null для activeCamera
      // Включаем управление камерой
      this.scene.activeCamera.attachControl(this.canvas, true); // Включаем контроль камеры
      document.body.style.pointerEvents = "auto"; // Включаем клики по UI
      console.log("UI interactions enabled.");
  } else {
      console.error("Error: activeCamera is null. Cannot attach control.");
  }
}

// Отключение взаимодействия с UI
disableUIInteractions(): void {
  if (this.scene.activeCamera) { // Проверка на null для activeCamera
      // Отключаем управление камерой и взаимодействие с UI
      this.scene.activeCamera.detachControl(this.canvas); // Отключаем контроль камеры
      document.body.style.pointerEvents = "none"; // Отключаем все клики по UI
      console.log("UI interactions disabled.");
  } else {
      console.error("Error: activeCamera is null. Cannot detach control.");
  }
}

// Метод для разблокировки указателя
unlockPointer(): void {
  if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();  // Разблокируем указатель
      console.log("Pointer unlocked.");
  }
}

setupCanvasFocus(): void {
  if (!this.canvas) {
      console.error("Canvas is not initialized.");
      return;
  }

  // Автоматический фокус на канвасе при загрузке
  this.canvas.tabIndex = 1; // Делает канвас фокусируемым элементом
  this.canvas.focus();
}

  
  
  // Метод настройки луча
  setupRaycastInteraction(): void {
    // Взаимодействие через луч, если указатель заблокирован
    this.scene.onPointerObservable.add((pointerInfo) => {
        if (this.isPointerLocked) {
            // Пик объект в центре экрана
            const pickResult = this.scene.pick(
                this.canvas.width / 2,
                this.canvas.height / 2,
                (mesh) => mesh.isPickable,
                true,
                this.camera
            );

            // Обработка клика только при блокировке указателя
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
                if (pickResult?.hit && pickResult.pickedMesh) {
                    console.log(`Выбран объект: ${pickResult.pickedMesh.name}`);
                    this.highlightPart(pickResult.pickedMesh, pickResult.pickedPoint!);
                }
            }
        }
    });
}

createHighlightSphere(point: Vector3): void {
  const highlightSize = 0.2; // Размер подсвечиваемой сферы

  // Создаем подсветку в виде маленькой сферы
  const highlightSphere = MeshBuilder.CreateSphere("highlightSphere", { diameter: highlightSize }, this.scene);

  // Позиционируем сферу точно на точке клика
  highlightSphere.position = point.clone();

  // Создаем материал для подсветки
  const highlightMaterial = new StandardMaterial("highlightMaterial", this.scene);
  highlightMaterial.diffuseColor = new Color3(1, 0, 0); // Красный цвет
  highlightMaterial.emissiveColor = new Color3(1, 0, 0); // Сияние
  highlightSphere.material = highlightMaterial;

  // Удаляем подсветку через 2 секунды
  setTimeout(() => {
      highlightSphere.dispose();
  }, 2000);
}

highlightPart(mesh: AbstractMesh, point: Vector3): void {
  const highlightSize = 0.2; // Размер подсвечиваемой области

  // Создаем подсветку в виде маленькой сферы
  const highlightSphere = MeshBuilder.CreateSphere("highlight", { diameter: highlightSize }, this.scene);

  // Позиционируем сферу точно на точке клика
  highlightSphere.position = point.clone();

  // Создаём материал для подсветки
  const highlightMaterial = new StandardMaterial("highlightMaterial", this.scene);
  highlightMaterial.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет
  highlightMaterial.emissiveColor = new Color3(0, 1, 0); // Сияние
  highlightSphere.material = highlightMaterial;

  // Удаляем подсветку через 2 секунды
  setTimeout(() => {
    highlightSphere.dispose();
  }, 2000);
}


// Логика, которая выполняется при клике на объект
onObjectClicked(mesh: AbstractMesh): void {
   // Получаем центр экрана
   const screenCenterX = this.canvas.width / 2;
   const screenCenterY = this.canvas.height / 2;

   // Выполняем "лучевое" определение объекта
   const pickResult = this.scene.pick(
       screenCenterX,
       screenCenterY,
       (mesh) => mesh.isPickable, // Условие для выбора только кликабельных мешей
       false,
       this.camera
   );

   if (pickResult?.hit && pickResult.pickedMesh) {
       const pickedMesh = pickResult.pickedMesh;
       console.log(`Выбран объект: ${pickedMesh.name}`);

       // Подсветка объекта
       this.highlightMesh(pickedMesh);
   } else {
       console.log("Нет объектов в центре экрана.");
   }
}

highlightMesh(mesh: AbstractMesh): void {
  const highlightMaterial = new StandardMaterial("highlightMaterial", this.scene);
  highlightMaterial.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет
  highlightMaterial.emissiveColor = new Color3(0, 1, 0); // Сияние

  // Применяем материал к выбранному объекту
  mesh.material = highlightMaterial;

  // Удаляем подсветку через 2 секунды
  setTimeout(() => {
      mesh.material = null; // Убираем подсветку (или возвращаем оригинальный материал)
  }, 2000);
}

// Метод для создания множества сфер
createClickableSpheres(): void {
  // Массив с координатами
  const coordinates = [
    { x: 12.18 , y: 6.105, z: 12.58 },
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

  // Проходим по массиву координат и создаем сферы
  coordinates.forEach((coordinate, index) => {
    // Создаем сферу
    const sphere = MeshBuilder.CreateSphere(`point${index + 1}`, { diameter: 1 }, this.scene);
    sphere.position = new Vector3(coordinate.x, coordinate.y, coordinate.z);

    // Устанавливаем материал для сферы
    const sphereMaterial = new StandardMaterial(`sphereMaterial${index + 1}`, this.scene);
    sphereMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5); // Начальный цвет (серый)
    sphere.material = sphereMaterial;

    // Переменная для отслеживания состояния подсветки
    let isHighlighted = false;

    // Обработчик кликов мыши
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          const event = pointerInfo.event as PointerEvent;

          if (event.button === 0) { // Левая кнопка мыши
            if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === sphere) {
              // Меняем состояние подсветки
              if (isHighlighted) {
                sphereMaterial.emissiveColor = Color3.Black(); // Убираем подсветку
                isHighlighted = false;
              } else {
                sphereMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет подсветки
                isHighlighted = true;
              }

              // Отображаем имя сферы
              this.displaySphereName(sphere.name);
            }
          } else if (event.button === 2) { // Правая кнопка мыши
            if (pointerInfo.pickInfo?.pickedMesh === sphere) {
              console.log("Клик правой кнопкой мыши на сфере отключен.");
            }
          }
          break;
      }
    });

    // Отключение контекстного меню браузера
    this.scene.getEngine().getRenderingCanvas()?.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  });
}

// Метод для отображения имени сферы
displaySphereName(name: string): void {
  const textBlock = new GUI.TextBlock();
  textBlock.text = `Название: ${name}`;
  textBlock.color = "white";
  textBlock.fontSize = 24;
  textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  textBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

  // Добавляем текстовый блок на экран
  this.guiTexture.addControl(textBlock);

  // Удаляем текст через 2 секунды
  setTimeout(() => {
    this.guiTexture.removeControl(textBlock);
  }, 2000);
}


  async CreateEnvironment(): Promise<void> {
    try {
        // Продолжаем работу по загрузке окружения
        const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD.gltf", this.scene);
        map.forEach((mesh) => {
            mesh.checkCollisions = true;
            mesh.isPickable = true; // Делаем меши кликабельными
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
}

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


completeTask(): void {
  const pointsText = `Нажатые точки: ${this.pointsPressedCount}`;
  console.log(pointsText);

  this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для перемещения на основную карту");
  this.guiManager.CreateDialogBox([page4]);
  this.triggerManager2.disableDistanceMeasurement();
  this.guiManager.createRouteButton('/test');

  // Отправляем данные на сервер только один раз, когда задача завершена
  //this.sendFinalCountToServer(this.pointsPressedCount);
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

    // Добавляем обработчик события для клавиши "i" или "ш"
  window.addEventListener("keydown", (event) => {
    if (event.key === "i" || event.key === "ш") {
      console.log("Клавиша 'i' или 'ш' нажата!"); // Лог для проверки
    }
  });

    
  }



  /*sendFinalCountToServer(pointsPressedCount: number): void {
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
      // Стартовое сообщение на первой странице
      const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.");
      this.guiManager.CreateDialogBox([page1]);
  
      // Создаем кнопку "Начать"
      const startButton = this.triggerManager2.createStartButton('Начать', () => {
          // Логируем, чтобы убедиться, что клик на кнопку работает
          console.log("Кнопка 'Начать' нажата");
  
          // Добавляем страницу с инструкциями
          const page2 = this.dialogPage.addText("Произведите съемку для обследования мостовых сооружений...");
          const page3 = this.dialogPage.addInputGrid("Конструкции", ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"]);
          this.guiManager.CreateDialogBox([page2, page3]);
  
          // Обновляем состояние задачи
          this.isTaskStarted = true;  // Задание начато
          this.isCursorActive = false;  // Отключаем курсор, клики идут по центру экрана
  
          // Деактивируем курсор, чтобы клики шли по центру экрана
          this.deactivateCursor();

          
  
          // Логируем для отладки
          console.log("Задание начато, курсор отключен");
  
          // Блокировка кнопки "Завершить"
          let finishButtonDisabled = false;
  
          // Создаем кнопку "Завершить"
          this.triggerManager2.createStartButton('Завершить', () => {
              if (finishButtonDisabled) {
                  console.log('Кнопка "Завершить" уже нажата, пропускаем действие');
                  return;
              }
  
              finishButtonDisabled = true;  // Блокируем кнопку
  
              console.log('Кнопка "Завершить" нажата');
              // Выполняем действия после завершения задания
              const page4 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для перемещения на основную карту");
              this.guiManager.CreateDialogBox([page4]);
  
              // Отключаем измерения и перенаправляем на другую страницу
              this.triggerManager2.disableDistanceMeasurement();
              this.guiManager.createRouteButton('/test');  // Перенаправление
          });
      });
  }
  
  // Функция для деактивации курсора
  deactivateCursor(): void {
      // Убедитесь, что курсор деактивируется корректно
      this.isCursorActive = false;
  
      // Выключаем видимость курсора (или скрываем его, если используете какой-то UI)
      const canvas = this.scene.getEngine().getRenderingCanvas();
      if (canvas) {
          canvas.style.cursor = 'none';  // Скрыть курсор
      }
      console.log('Курсор скрыт');
  }
}

*/