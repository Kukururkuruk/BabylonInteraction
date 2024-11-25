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
  private isCursorActive: boolean = true;  // Флаг для состояния курсора
  private isTaskStarted: boolean = false;  // Флаг для отслеживания начала задания
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
  }*/

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

    // Обработчик клика на канвасе
    this.canvas.addEventListener("click", () => {
        // Запрашиваем захват указателя мыши
        this.canvas.requestPointerLock();
    });

    // Слушаем события выхода из захвата
    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === this.canvas) {
            console.log("Pointer locked.");
        } else {
            console.log("Pointer unlocked.");
        }
    });
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
    if (!this.scene) {
      console.error("Scene is not initialized yet.");
      return;
    }
  
    // Создаем текстовый блок для вывода информации
    const infoText = new GUI.TextBlock();
    infoText.color = "white";
    infoText.fontSize = 24;
    infoText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    infoText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.guiTexture.addControl(infoText);
  
    // Обработчик кликов по сцене
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
        // Вычисляем центр экрана
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
  
        // Выполняем pick на сцене, используя координаты центра экрана
        const pickResult = this.scene.pick(centerX, centerY, (mesh) => mesh.isPickable, true, this.camera);
  
        if (pickResult?.hit && pickResult.pickedMesh && pickResult.pickedPoint) {
          const pickedMesh = pickResult.pickedMesh;
          const pickedPoint = pickResult.pickedPoint;
  
          // Логика подсветки объекта
          this.highlightPart(pickedMesh, pickedPoint);
  
          // Расстояние до объекта
          const distance = Vector3.Distance(this.camera.position, pickedPoint);
  
          // Обновляем информацию
          infoText.text = `Название: ${pickedMesh.name}\nРасстояние: ${distance.toFixed(2)} м`;
  
          // Визуализируем точку клика
          this.createHighlightSphere(pickedPoint);
        } else {
          infoText.text = "Объект не найден в центре.";
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


  async CreateEnvironment(): Promise<void> {
    try {
        // Продолжаем работу по загрузке окружения
        const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
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
  }*/
  
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
}
