// Вертикальное измерение
private enableVerticalScaling(childMeshes: BABYLON.Mesh[], rulerModel: BABYLON.Mesh): void {
  //if (!this.isVerticalMeasurement) return; // Если вертикальное измерение не активно, не выполняем

  let isMoving = false;
  let moveInterval: number | null = null;
  const originalPositions = childMeshes.map(mesh => mesh.position.clone());

  const moveMeshes = (delta: number) => {
    const firstMesh = childMeshes[0];

    if (firstMesh.position.x >= 0.10) {
      isMoving = false;
      if (moveInterval !== null) {
        window.clearInterval(moveInterval);
        moveInterval = null;
      }

      this.zoomCameraVertical();
      return;
    }

    for (let i = 0; i < childMeshes.length; i++) {
      const childMesh = childMeshes[i];

      if (i === 0) {
        childMesh.position.x += delta;  // Двигаем только по оси X
      } else {
        let threshold = 0;
        // Устанавливаем threshold для каждого меша
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

        if (firstMesh.position.x >= threshold) {  // Проверяем ось X
          childMesh.position.x += delta;  // Двигаем только по оси X
        }
      }

      if (childMesh.position.x > 1.50) childMesh.position.x = 1.50;  // Ограничиваем движение по оси X
    }
  };

  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      if (!isMoving) {
        isMoving = true;
        moveInterval = window.setInterval(() => moveMeshes(0.003), 20);
      }
    }

    if (event.type === BABYLON.PointerEventTypes.POINTERUP) {
      isMoving = false;
      if (moveInterval !== null) {
        window.clearInterval(moveInterval);
        moveInterval = null;
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    console.log(`Клавиша нажата: ${e.key}`); // Логируем нажатие клавиши

    if (e.key === 'Escape') {
      // Восстанавливаем оригинальные позиции мешей
      for (let i = 0; i < childMeshes.length; i++) {
        childMeshes[i].position = originalPositions[i].clone();
      }

      // Останавливаем движение
      isMoving = false;
      if (moveInterval !== null) {
        window.clearInterval(moveInterval);
        moveInterval = null;
      }

      console.log("Все меши возвращены в исходное состояние.");
    }

    if (e.key === 'q') {
      if (this.currentMeasurementMode === 'horizontal') {
        this.currentMeasurementMode = 'vertical';
        if (rulerModel) {
          rulerModel.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);  // Поворот на 90 градусов
        } else {
          console.error("Модель рулетки не найдена.");
        }
      }
    }
  });
}

// Функция для приближения камеры (аналог для вертикального замера)
private zoomCameraVertical(): void {
  const camera = this.scene.activeCamera as BABYLON.FreeCamera;
  if (!camera) return;

  const originalPosition = camera.position.clone();  
  const zoomPosition1 = originalPosition.subtract(new BABYLON.Vector3(0.8, 0.1, 0.4)); // Смещение вперёд
  const zoomPosition2 = zoomPosition1.subtract(new BABYLON.Vector3(0, 0, -0.4)); // Смещение назад

  const zoomDuration = 1000; // Длительность каждой анимации в мс
  const pauseDuration = 1000; // Длительность паузы в мс (1 секунда)

  // Первая анимация (приближение)
  BABYLON.Animation.CreateAndStartAnimation(
    "zoomCamera1", 
    camera, 
    "position", 
    30, 
    zoomDuration / 30, 
    originalPosition, 
    zoomPosition1, 
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    undefined,
    () => {
      // Пауза перед второй анимацией
      setTimeout(() => {
        // Вторая анимация (смещение назад)
        BABYLON.Animation.CreateAndStartAnimation(
          "zoomCamera2", 
          camera, 
          "position", 
          30, 
          zoomDuration / 30, 
          zoomPosition1, 
          zoomPosition2, 
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
      }, pauseDuration);
    }
  );

  console.log("Камера приближается, затем делает паузу, потом смещается назад.");
}





























































private async CreateEnvironment(): Promise<void> { 
  try {
    // Загрузка карты
    const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_5.gltf", this.scene);
    map.forEach((mesh) => {
        mesh.checkCollisions = true;
    });

    this.setupWholeMeshes(map);

    // Поиск ограничивающих мешей
    const boundaryMeshes = map.filter(mesh => mesh.name.startsWith("SM_0_SpanStructureBeam"));
    if (boundaryMeshes.length === 0) {
        console.error("Ошибка: ограничивающие меши не найдены.");
        return;
    }
    console.log("Найдены ограничивающие меши:", boundaryMeshes.map(mesh => mesh.name));

    // Вычисление объединённых границ
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

    // Загрузка модели штангенциркуля
    console.log("Загрузка модели штангенциркуля начата...");
    const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP.gltf", this.scene);
    if (this.handModel) {
        this.handModel.checkCollisions = true;
    }
    console.log("Модели после загрузки:", meshes);

    if (meshes.length > 0) {
        this.handModel = meshes[0] as Mesh;

        // Сохраняем исходные параметры
        this.tools['originalHandModelPosition'] = this.handModel.position.clone();
        this.tools['originalHandModelRotation'] = this.handModel.rotation.clone();

        // Массив дочерних элементов
        const childMeshesNames = [
            "SM_10cm", "SM_20cm","SM_30cm","SM_40cm","SM_50cm",
            //"SM_50cm","SM_60cm", "SM_70cm", "SM_80cm", "SM_90cm", "SM_100cm", "SM_110cm"
        ];

        // Массив для хранения дочерних объектов Mesh
        const childMeshes: Mesh[] = [];

        // Перебираем дочерние элементы
        childMeshesNames.forEach(childName => {
            const childMesh = meshes.find(mesh => mesh.name === childName) as Mesh;

            if (!childMesh) {
                console.warn(`Ошибка: дочерний элемент ${childName} не найден.`);
            } else {
                console.log(`Дочерний элемент ${childName} найден:`, childMesh);

                // Сохраняем параметры дочерних элементов
                this.tools[`${childName}Model`] = {
                    mesh: childMesh,
                    originalPosition: childMesh.position.clone(),
                    originalRotation: childMesh.rotation.clone(),
                };

                childMeshes.push(childMesh);
            }
        });

        // Включаем масштабирование для дочерних элементов 
        this.enableChildScaling(childMeshes);
        
        const sm_10cm = this.scene.getMeshByName("SM_10cm") as BABYLON.Mesh;
        if (sm_10cm) {
            sm_10cm.position.x += 0;  // Сдвигаем меш на 0.1 по оси X
            console.log("Новая позиция SM_10cm: ", sm_10cm.position);
        }

        // Устанавливаем параметры для основной модели
        this.handModel.position = new Vector3(13, 6.41004, 4.95);
        this.handModel.scaling = new Vector3(-1.5, -1.5, -1.5);
        this.handModel.rotation = new Vector3(Math.PI / 2, -Math.PI / 2, 0);
        this.handModel.isVisible = true;

        console.log("Модель штангенциркуля загружена и параметры установлены.");

        // Привязка модели к курсору мыши
        this.scene.onPointerObservable.add((event) => {
            if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && this.handModel) {
                const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
                if (pickInfo.hit && this.handModel) {
                    this.handModel.position = pickInfo.pickedPoint!;
                }
            }
        });
        
    } else {
        console.error("Ошибка: модель штангенциркуля не найдена в файле.");
    }

    // Создание кликабельных примитивов (мешей) серого цвета
    const createClickableMesh = (position: BABYLON.Vector3): BABYLON.Mesh => {
      // Измените размеры коробки для создания прямоугольной формы
      const mesh = BABYLON.MeshBuilder.CreateBox("clickableMesh", { width: 0.2, height: 0.09, depth: 0.02 }, this.scene);
      mesh.position = position;
    
      // Создание стандартного материала
      const material = new BABYLON.StandardMaterial("grayMaterial", this.scene);
      material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);  // Серый цвет
      mesh.material = material;
    
      // Обработчик клика на меш
      mesh.actionManager = new BABYLON.ActionManager(this.scene);
      mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (event) => {
        console.log("Меш был кликнут!", mesh.position);
        // Здесь можно добавить дополнительную логику, например, отправить данные на сервер или что-то другое
      }));
    
      return mesh;
    };

    // Создание двух кликабельных мешей в заданных координатах
    const mesh1 = createClickableMesh(new BABYLON.Vector3(12.6, 6.45, 5));
    const mesh2 = createClickableMesh(new BABYLON.Vector3(12.44, 6.16411, 5.33));

    console.log("Кликабельные меши созданы.");

    // Плавное движение модели
    let targetPosition: BABYLON.Vector3 | null = null;
    const smoothingFactor = 0.1;
    let isFixed = false;
    let lastPosition: BABYLON.Vector3 | null = null;
    let currentPosition = this.handModel ? this.handModel.position.clone() : BABYLON.Vector3.Zero();

    this.scene.onPointerObservable.add((event) => {
        if (!this.handModel) return;

        if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && !isFixed) {
            const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
            if (pickInfo.hit && pickInfo.pickedPoint) {
                let newPosition = pickInfo.pickedPoint.clone();

                // Ограничиваем движение в пределах границ
                newPosition.x = Math.max(minBoundary.x, Math.min(maxBoundary.x, newPosition.x));
                newPosition.y = Math.max(minBoundary.y, Math.min(maxBoundary.y, newPosition.y));
                newPosition.z = Math.max(minBoundary.z, Math.min(maxBoundary.z, newPosition.z));

                targetPosition = newPosition;
            }
        }

        if (event.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            isFixed = true;
            lastPosition = this.handModel.position.clone();
        }
    });

    this.scene.onKeyboardObservable.add((event) => {
        if (event.type === BABYLON.KeyboardEventTypes.KEYDOWN && event.event.key === "Escape") {
            isFixed = false; // Разрешаем перемещение при нажатии Escape
        }
    });

    // Обновляем позицию объекта
    this.scene.onBeforeRenderObservable.add(() => {
        if (this.handModel && targetPosition) {
            currentPosition = BABYLON.Vector3.Lerp(currentPosition, targetPosition, smoothingFactor);
            this.handModel.position = currentPosition;
        }
    });

  } catch (error) {
    console.error("Ошибка при загрузке окружения:", error);
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
  private isMeasuring: boolean = false;
  private firstClickPosition: BABYLON.Vector3 | null = null;  // Переменная для хранения первого клика
  private secondClickPosition: BABYLON.Vector3 | null = null; // Переменная для второго клика
  private isModelPositioned: boolean = false;  // Флаг для отслеживания состояния модели
  private lastLogTime: number = 0;  // Время последнего логирования
  private logInterval: number = 1000;  // Интервал между логами (в миллисекундах)

  
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
    //this.CreateHandModel(); // Загружаем модель
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
    // Загрузка карты
    const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_5.gltf", this.scene);
    map.forEach((mesh) => {
        mesh.checkCollisions = true;
    });

    this.setupWholeMeshes(map);

    // Поиск ограничивающих мешей
    const boundaryMeshes = map.filter(mesh => mesh.name.startsWith("SM_0_SpanStructureBeam"));
    if (boundaryMeshes.length === 0) {
        console.error("Ошибка: ограничивающие меши не найдены.");
        return;
    }
    console.log("Найдены ограничивающие меши:", boundaryMeshes.map(mesh => mesh.name));

    // Вычисление объединённых границ
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

    // Загрузка модели штангенциркуля
    console.log("Загрузка модели штангенциркуля начата...");
    const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP.gltf", this.scene);
    if (this.handModel) {
        this.handModel.checkCollisions = true;
    }
    console.log("Модели после загрузки:", meshes);

    if (meshes.length > 0) {
        this.handModel = meshes[0] as Mesh;

        // Сохраняем исходные параметры
        this.tools['originalHandModelPosition'] = this.handModel.position.clone();
        this.tools['originalHandModelRotation'] = this.handModel.rotation.clone();

        // Массив дочерних элементов
        const childMeshesNames = [
            "SM_10cm", "SM_20cm", "SM_30cm", "SM_40cm", "SM_50cm",
            "SM_60cm", "SM_70cm", "SM_80cm", "SM_90cm", "SM_100cm", "SM_110cm"
        ];

        // Массив для хранения дочерних объектов Mesh
        const childMeshes: Mesh[] = [];

        // Перебираем дочерние элементы
        childMeshesNames.forEach(childName => {
            const childMesh = meshes.find(mesh => mesh.name === childName) as Mesh;

            if (!childMesh) {
                console.warn(`Ошибка: дочерний элемент ${childName} не найден.`);
            } else {
                console.log(`Дочерний элемент ${childName} найден:`, childMesh);

                // Сохраняем параметры дочерних элементов
                this.tools[`${childName}Model`] = {
                    mesh: childMesh,
                    originalPosition: childMesh.position.clone(),
                    originalRotation: childMesh.rotation.clone(),
                };

                childMeshes.push(childMesh);
            }
        });

        // Включаем масштабирование для дочерних элементов
        this.enableChildScaling(childMeshes);
// Включаем масштабирование для дочерних элементов, но только после установки первой модели в нужную позицию
if (this.handModel.position.x >= 0.5) {
  this.startScalingAnimation(childMeshes);
}
// После загрузки штангенциркуля и дочерних элементов
this.setupClickListenerForScene(childMeshes);
        // Устанавливаем параметры для основной модели
        this.handModel.position = new Vector3(13, 6.41004, 4.95);
        this.handModel.scaling = new Vector3(-1.5, -1.5, -1.5);
        this.handModel.rotation = new Vector3(Math.PI / 2, -Math.PI / 2, 0);
        this.handModel.isVisible = true;

        console.log("Модель штангенциркуля загружена и параметры установлены.");

        // Привязка модели к курсору мыши
        this.scene.onPointerObservable.add((event) => {
            if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && this.handModel) {
                const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
                if (pickInfo.hit && this.handModel) {
                    this.handModel.position = pickInfo.pickedPoint!;
                }
            }
        });

        // Включаем обработку нажатий клавиш для вращения модели
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (this.handModel) {
                const rotationSpeed = 0.05; // Скорость вращения

                // Проверяем тип события и обрабатываем нажатие клавиши
                if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                    switch (kbInfo.event.key.toLowerCase()) {
                        case 'q': // Вращение против часовой стрелки вокруг оси Y (Q)
                        case 'й': // Вращение против часовой стрелки вокруг оси Y (Й)
                            this.handModel.rotate(BABYLON.Axis.Y, -rotationSpeed, BABYLON.Space.LOCAL);
                            console.log('Rotate around Y-axis counter-clockwise');
                            break;

                        case 'e': // Вращение по часовой стрелке вокруг оси Y (E)
                        case 'у': // Вращение по часовой стрелке вокруг оси Y (У)
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
    } else {
        console.error("Ошибка: модель штангенциркуля не найдена в файле.");
    }

    // Плавное движение модели
    let targetPosition: BABYLON.Vector3 | null = null;
    const smoothingFactor = 0.1;
    let isFixed = false;
    let lastPosition: BABYLON.Vector3 | null = null;
    let currentPosition = this.handModel ? this.handModel.position.clone() : BABYLON.Vector3.Zero();

    this.scene.onPointerObservable.add((event) => {
        if (!this.handModel) return;

        if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && !isFixed) {
            const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
            if (pickInfo.hit && pickInfo.pickedPoint) {
                let newPosition = pickInfo.pickedPoint.clone();

                // Ограничиваем движение в пределах границ
                newPosition.x = Math.max(minBoundary.x, Math.min(maxBoundary.x, newPosition.x));
                newPosition.y = Math.max(minBoundary.y, Math.min(maxBoundary.y, newPosition.y));
                newPosition.z = Math.max(minBoundary.z, Math.min(maxBoundary.z, newPosition.z));

                targetPosition = newPosition;
            }
        }

        if (event.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            isFixed = true;
            lastPosition = this.handModel.position.clone();
        }
    });

    this.scene.onKeyboardObservable.add((event) => {
        if (event.type === BABYLON.KeyboardEventTypes.KEYDOWN && event.event.key === "Escape") {
            isFixed = false; // Разрешаем перемещение при нажатии Escape
        }
    });

    // Обновляем позицию объекта
    this.scene.onBeforeRenderObservable.add(() => {
        if (this.handModel && targetPosition) {
            currentPosition = BABYLON.Vector3.Lerp(currentPosition, targetPosition, smoothingFactor);
            this.handModel.position = currentPosition;
        }
    });

  } catch (error) {
    console.error("Ошибка при загрузке окружения:", error);
  }
}

private enableChildScaling(childMeshes: BABYLON.Mesh[]): void { 
  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
      const wheelEvent = event.event as WheelEvent;
      const delta = wheelEvent.deltaY > 0 ? 0.001 : -0.001; // Шаг изменения

      // Начинаем с первого объекта
      for (let i = 0; i < childMeshes.length; i++) {
        const childMesh = childMeshes[i];

        // Если это первый объект, просто двигаем его
        if (i === 0) {
          childMesh.position.x += delta;
        } else {
          // Для остальных объектов проверяем, достиг ли SM_10cm нужной позиции
          const firstMesh = childMeshes[0]; // Всегда ориентируемся на SM_10cm
          let threshold = 0;

          // Задаем пороги для каждого меша
          if (i === 1) {
            threshold = 0.0485; // SM_20cm начинает движение, когда SM_10cm достигает 0.0485
          } else if (i === 2) {
            threshold = 0.144; // SM_30cm начинает движение, когда SM_10cm достигает 0.144
          } else if (i === 3) {
            threshold = 0.240; // SM_40cm начинает движение, когда SM_10cm достигает 0.350
          } else if (i === 4) {
            threshold = 0.336; // SM_50cm начинает движение, когда SM_10cm достигает 0.450
          } else if (i === 5) {
            threshold = 0.432; // SM_60cm начинает движение, когда SM_10cm достигает 0.550
          } else if (i === 6) {
            threshold = 0.530; // SM_70cm начинает движение, когда SM_10cm достигает 0.650
          } else if (i === 7) {
            threshold = 0.638; // SM_80cm начинает движение, когда SM_10cm достигает 0.750
          } else if (i === 8) {
            threshold = 0.738; // SM_90cm начинает движение, когда SM_10cm достигает 0.850
          } else if (i === 9) {
            threshold = 0.838; // SM_100cm начинает движение, когда SM_10cm достигает 0.950
          } else if (i === 10) {
            threshold = 0.938; // SM_110cm начинает движение, когда SM_10cm достигает 1.050
          }

          if (firstMesh.position.x >= threshold) {
            childMesh.position.x += delta;
          }
        }

        // Ограничиваем движение, чтобы оно не выходило за границы
        if (childMesh.position.x > 1.50) childMesh.position.x = 1.50;

        // Логируем изменения только через заданный интервал
        const currentTime = Date.now();
        if (currentTime - this.lastLogTime > this.logInterval) {
          console.log(`Новое значение ${childMesh.name} по оси X:`, childMesh.position.x);
          this.lastLogTime = currentTime; // Обновляем время последнего логирования
        }
      }
    }
  });
}


private async startScalingAnimation(childMeshes: BABYLON.Mesh[]): Promise<void> {
  if (!childMeshes.length) return;

  const distanceStep = 0.096; // Шаг движения каждого меша

  if (childMeshes[0].position.x >= -0.1 && childMeshes[0].position.x <= 0.1) {
      console.log("Первая модель в нужной позиции, запускаем анимацию.");

      for (let i = 0; i < childMeshes.length; i++) {
          await this.animateMesh(childMeshes, i, distanceStep);
      }
  } else {
      console.log("Первая модель не в нужной позиции, анимация не запущена.");
  }
}

// Анимация для одного меша с учетом движения всей группы
private animateMesh(childMeshes: BABYLON.Mesh[], index: number, distance: number): Promise<void> {
  return new Promise<void>((resolve) => {
      if (index === 0) {
          // Первый меш просто двигается вперед
          this.moveMesh(childMeshes[index], distance, resolve);
      } else {
          // Каждый следующий меш ждет завершения предыдущего и двигает всю цепочку
          this.moveMesh(childMeshes[index], distance, () => {
              for (let j = 0; j < index; j++) {
                  childMeshes[j].position.x += distance;
              }
              resolve();
          });
      }
  });
}

// Двигаем один меш вперед
private moveMesh(mesh: BABYLON.Mesh, distance: number, onComplete: () => void): void {
  const animation = new BABYLON.Animation(
      `positionAnimation_${mesh.name}`,
      "position.x",
      30, // FPS
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const targetPosition = mesh.position.x + distance; // Двигаем вперед

  const keys = [
      { frame: 0, value: mesh.position.x },
      { frame: 30, value: targetPosition }
  ];
  animation.setKeys(keys);

  mesh.animations.push(animation);

  this.scene.beginAnimation(mesh, 0, 30, false, 1, () => {
      console.log(`Анимация завершена для ${mesh.name}, новая позиция: ${mesh.position.x}`);
      onComplete();
  });
}






private setupClickListenerForScene(childMeshes: BABYLON.Mesh[]): void {
  this.scene.onPointerObservable.add((event) => {
      if (event.type === BABYLON.PointerEventTypes.POINTERPICK) {
          const pickInfo = event.pickInfo;

          // Проверяем, что pickInfo не равно null и что выбранный объект является мешом
          if (pickInfo && pickInfo.pickedMesh) {
              const pickedMesh = pickInfo.pickedMesh;
              console.log(`Выбрано: ${pickedMesh.name}, Позиция:`, pickedMesh.position);

              // Если кликаем на объект, начинаем анимацию
              console.log("Произошел клик по объекту на сцене, начинаем анимацию для дочерних элементов.");
              
              // Запускаем анимацию для всех дочерних объектов
              this.startScalingAnimation(childMeshes);
          } else {
              console.log("Клик не по объекту на сцене.");
          }
      }
  });
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
  private firstClickPosition: BABYLON.Vector3 | null = null;  // Переменная для хранения первого клика
  private secondClickPosition: BABYLON.Vector3 | null = null; // Переменная для второго клика


  
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
      // Загрузка карты
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_5.gltf", this.scene);
      map.forEach((mesh) => {
          mesh.checkCollisions = true;
      });

      this.setupWholeMeshes(map);

      // Поиск ограничивающих мешей
      const boundaryMeshes = map.filter(mesh => mesh.name.startsWith("SM_0_SpanStructureBeam"));
      if (boundaryMeshes.length === 0) {
          console.error("Ошибка: ограничивающие меши не найдены.");
          return;
      }
      console.log("Найдены ограничивающие меши:", boundaryMeshes.map(mesh => mesh.name));

      // Вычисление объединённых границ
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

      // Добавляем плавное движение
      let targetPosition: BABYLON.Vector3 | null = null; // Целевая позиция
      const smoothingFactor = 0.1; // Плавность, уменьшай для более плавного эффекта
      let isFixed = false; // Флаг фиксации модели
      let lastPosition: BABYLON.Vector3 | null = null;
      let currentPosition = this.handModel ? this.handModel.position.clone() : BABYLON.Vector3.Zero(); // Текущая позиция

      this.scene.onPointerObservable.add((event) => {
        if (!this.handModel) return;

        if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && !isFixed) {
            const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
            if (pickInfo.hit && pickInfo.pickedPoint) {
                let newPosition = pickInfo.pickedPoint.clone();

                // Ограничиваем движение в пределах границ
                newPosition.x = Math.max(minBoundary.x, Math.min(maxBoundary.x, newPosition.x));
                newPosition.y = Math.max(minBoundary.y, Math.min(maxBoundary.y, newPosition.y));
                newPosition.z = Math.max(minBoundary.z, Math.min(maxBoundary.z, newPosition.z));

                targetPosition = newPosition;
            }
        }

        if (event.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            isFixed = true; // Фиксируем позицию при клике
            lastPosition = this.handModel.position.clone();
        }
    });

    this.scene.onKeyboardObservable.add((event) => {
      if (event.type === BABYLON.KeyboardEventTypes.KEYDOWN && event.event.key === "Escape") {
          isFixed = false; // Разрешаем перемещение при нажатии Escape
      }
  });

      // Обновляем позицию объекта каждую кадровую перерисовку
      this.scene.onBeforeRenderObservable.add(() => {
          if (this.handModel && targetPosition) {
              // Интерполируем плавно от текущей позиции к целевой
              currentPosition = BABYLON.Vector3.Lerp(currentPosition, targetPosition, smoothingFactor);
              this.handModel.position = currentPosition; // Применяем обновлённую позицию
          }
      });

  } catch (error) {
      console.error("Ошибка при загрузке окружения:", error);
  }
}




  private async CreateHandModel(): Promise<void> {
    console.log("Загрузка модели штангенциркуля начата...");
    try {
        // Загрузка модели SM_Caliper.gltf
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP.gltf", this.scene);
        if (this.handModel) {
          this.handModel.checkCollisions = true;
      }
        console.log("Модели после загрузки:", meshes);

        if (meshes.length > 0) {
            // Привязываем основную модель из массива meshes
            this.handModel = meshes[0] as Mesh;

            // Сохраняем исходные параметры для возвращения
            this.tools['originalHandModelPosition'] = this.handModel.position.clone();
            this.tools['originalHandModelRotation'] = this.handModel.rotation.clone();

            // Массив дочерних элементов
            const childMeshesNames = [
                "SM_10cm", "SM_20cm", "SM_30cm", "SM_40cm", "SM_50cm",
                "SM_60cm", "SM_70cm", "SM_80cm", "SM_90cm", "SM_100cm", "SM_110cm"
            ];

            // Массив для хранения дочерних объектов Mesh
            const childMeshes: Mesh[] = [];

            // Перебираем дочерние элементы и сохраняем их параметры
            childMeshesNames.forEach(childName => {
                const childMesh = meshes.find(mesh => mesh.name === childName) as Mesh;

                if (!childMesh) {
                    console.warn(`Ошибка: дочерний элемент ${childName} не найден.`);
                } else {
                    console.log(`Дочерний элемент ${childName} найден:`, childMesh);

                    // Сохраняем дочерний элемент для управления
                    this.tools[`${childName}Model`] = {
                        mesh: childMesh,
                        originalPosition: childMesh.position.clone(),
                        originalRotation: childMesh.rotation.clone(),
                    };

                    console.log(`Параметры ${childName} установлены.`);

                    // Добавляем дочерний элемент в массив
                    childMeshes.push(childMesh);
                }
            });

            // Включаем масштабирование для дочерних элементов
            this.enableChildScaling(childMeshes);

            // Устанавливаем параметры для основной модели
            this.handModel.position = new Vector3(13, 6.41004, 4.95);
            this.handModel.scaling = new Vector3(-1.5, -1.5, -1.5);
            this.handModel.rotation = new Vector3(Math.PI / 2, -Math.PI / 2, 0);
            this.handModel.isVisible = true;

            console.log("Модель штангенциркуля загружена и параметры установлены.");

            

            // Привязка модели к курсору мыши
            this.scene.onPointerObservable.add((event) => {
                if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && this.handModel) {
                    const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
                    if (pickInfo.hit && this.handModel) {
                        this.handModel.position = pickInfo.pickedPoint!;
                    }
                }
            });

            // Включаем обработку нажатий клавиш для вращения модели
            this.rotateModelOnKeyPress();

        } else {
            console.error("Ошибка: модель штангенциркуля не найдена в файле.");
        }

    } catch (error) {
        console.error("Ошибка при загрузке модели штангенциркуля:", error);
    }
}

private rotateModelOnKeyPress(): void {
  // Подписываемся на события клавиатуры
  this.scene.onKeyboardObservable.add((kbInfo) => {
      if (this.handModel) { // Проверка на наличие handModel
          const rotationSpeed = 0.05; // Скорость вращения

          // Проверяем тип события и обрабатываем нажатие клавиши
          if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
              switch (kbInfo.event.key.toLowerCase()) {
                  case 'q': // Вращение против часовой стрелки вокруг оси Y (Q)
                  case 'й': // Вращение против часовой стрелки вокруг оси Y (Й)
                      this.handModel.rotate(BABYLON.Axis.Y, -rotationSpeed, BABYLON.Space.LOCAL);
                      console.log('Rotate around Y-axis counter-clockwise');
                      break;

                  case 'e': // Вращение по часовой стрелке вокруг оси Y (E)
                  case 'у': // Вращение по часовой стрелке вокруг оси Y (У)
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






private enableChildScaling(childMeshes: BABYLON.Mesh[]): void { 
  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
      const wheelEvent = event.event as WheelEvent;
      const delta = wheelEvent.deltaY > 0 ? 0.001 : -0.001; // Шаг изменения

      // Начинаем с первого объекта
      for (let i = 0; i < childMeshes.length; i++) {
        const childMesh = childMeshes[i];

        // Если это первый объект, просто двигаем его
        if (i === 0) {
          childMesh.position.x += delta;
        } else {
          // Для остальных объектов проверяем, достиг ли SM_10cm нужной позиции
          const firstMesh = childMeshes[0]; // Всегда ориентируемся на SM_10cm
          let threshold = 0;

          // Задаем пороги для каждого меша
          if (i === 1) {
            threshold = 0.0485; // SM_20cm начинает движение, когда SM_10cm достигает 0.0485
          } else if (i === 2) {
            threshold = 0.144; // SM_30cm начинает движение, когда SM_10cm достигает 0.144
          } else if (i === 3) {
            threshold = 0.240; // SM_40cm начинает движение, когда SM_10cm достигает 0.350
          } else if (i === 4) {
            threshold = 0.336; // SM_50cm начинает движение, когда SM_10cm достигает 0.450
          } else if (i === 5) {
            threshold = 0.432; // SM_60cm начинает движение, когда SM_10cm достигает 0.550
          } else if (i === 6) {
            threshold = 0.530; // SM_70cm начинает движение, когда SM_10cm достигает 0.650
          } else if (i === 7) {
            threshold = 0.638; // SM_80cm начинает движение, когда SM_10cm достигает 0.750
          } else if (i === 8) {
            threshold = 0.738; // SM_90cm начинает движение, когда SM_10cm достигает 0.850
          } else if (i === 9) {
            threshold = 0.838; // SM_100cm начинает движение, когда SM_10cm достигает 0.950
          } else if (i === 10) {
            threshold = 0.938; // SM_110cm начинает движение, когда SM_10cm достигает 1.050
          }

          if (firstMesh.position.x >= threshold) {
            childMesh.position.x += delta;
          }
        }

        // Ограничиваем движение, чтобы оно не выходило за границы
        if (childMesh.position.x > 1.50) childMesh.position.x = 1.50;

        // Логируем изменения только через заданный интервал
        const currentTime = Date.now();
        if (currentTime - this.lastLogTime > this.logInterval) {
          console.log(`Новое значение ${childMesh.name} по оси X:`, childMesh.position.x);
          this.lastLogTime = currentTime; // Обновляем время последнего логирования
        }
      }
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
  PBRMaterial,
  MeshBuilder,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from 'cannon-es'; 
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'; 
import { GUIManager as GUIManagerComponent } from '../components/GUIManager'; 
import { GUIManager as GUIManagerFunction } from "./FunctionComponents/GUIManager"; 
import { TriggersManager } from './FunctionComponents/TriggerManager3'; 
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { StackPanel, Rectangle, AdvancedDynamicTexture, TextBlock, Button, Control } from "@babylonjs/gui";
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { DialogPage } from "./FunctionComponents/DialogPage";



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
  guiManager: GUIManagerComponent; // Обновлено на GUIManagerComponent
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
  MainCamera!: FreeCamera;  // Объявление без допуска значения null
  questionTexture: AdvancedDynamicTexture | null = null; // Для второго интерфейса
  highlightLayer: HighlightLayer;
  private dialogPage!: DialogPage;
  private triggerManager2!: TriggerManager2;
  private guiManager2!: GUIManagerFunction;


  

  constructor(private canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();
    this.scene = this.CreateScene();

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    this.setupCamera();
    this.setupLighting();

    // Инициализация основных компонентов
    this.initializeComponents();
     // Создаем HighlightLayer
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение, если нужно
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение, если нужно
    // Инициализация GUIManager и TriggersManager
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.guiManager = new GUIManagerComponent(this.scene, []);
    this.triggerManager = new TriggersManager(this.scene, this.canvas, this.guiTexture);

    //this.CreateHandModel(); // Загружаем модель
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

  private initializeComponents(): void {
    // Убедитесь, что guiTexture, MainCamera и другие зависимости готовы
    this.dialogPage = new DialogPage();
    console.log("DialogPage initialized");

    this.triggerManager2 = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.MainCamera);
    console.log("TriggerManager2 initialized");

    this.guiManager2 = new GUIManagerFunction(this.scene, []);
    console.log("GUIManagerFunction initialized");
    this.BetonTrigger();

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

  /*async CreateHandModel(): Promise<void> {
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
}*/




async CreateEnvironment(): Promise<void> {
  try {
    const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
    map.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    

    // Создаем черный материал
    const blackMaterial = new PBRMaterial("blackMaterial", this.scene);
    blackMaterial.albedoColor = new Color3(0, 0, 0); // черный цвет
    blackMaterial.roughness = 0.5; // значение шероховатости без текстуры

    // Устанавливаем коллизии и видимость для мешей
    map.forEach((mesh) => {
      mesh.checkCollisions = true;

      // Применяем черный материал и устанавливаем видимость
      if (
        mesh.name.startsWith("SM_0_Retaining_wall") || 
        mesh.name.startsWith("SM_0_FencePostBridge") || 
        mesh.name.startsWith("SM_ConcreteFence") || 
        mesh.name.startsWith("SM_0_SupportLight")
      ) {
        mesh.material = blackMaterial;
        mesh.visibility = 0; // делаем меш невидимым
      } else {
        mesh.visibility = 1; // делаем другие меши видимыми
      }
    });

    // Обрабатываем другие меши
    this.setupTargetMeshes(map);
    this.setupBrokenMeshes(map);
    this.setupWholeMeshes(map);
    this.highlightSpecificMeshes();

    // Убедитесь, что меши правильно загружены и отображаются перед заморозкой
    console.log("Карта загружена успешно:", map);

    // Замораживаем активные меши после завершения всех настроек
    // this.scene.freezeActiveMeshes();
    console.log("Активные меши заморожены.");

  } catch (error) {
    console.error("Ошибка при загрузке окружения:", error);
  }
}

// Метод для заморозки или скрытия мешей
/*private handleFreezeMeshes(mapMeshes: AbstractMesh[]): void {
  const freezeMeshNames = ["SM_0_FencePostBridge", "SM_ConcreteFence", "SM_0_SupportLight", "SM_0_Retaining_wall"];
  mapMeshes
      .filter(mesh => freezeMeshNames.includes(mesh.name))
      .forEach(mesh => {
          mesh.dispose(); // Удаляем меши из сцены
      });
      this.scene.meshes.forEach(mesh => {
        console.log("Меш в сцене:", mesh.name);
    });
}*/


BetonTrigger(): void {
  const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
  this.guiManager2.CreateDialogBox([page1])

          this.triggerManager2.createStartButton('Начать', () => {
          // Показываем сообщение
          const page2 = this.dialogPage.addText("Нажмите на сломаное мостовое перекрытия и выберите что вы хотите измерить")
          const page3 = this.dialogPage.addText("При выборе линейки замерьте длину дефекта мостового перекрытия, при выборе штангенциркуля замерьте диаметр арматуры")
          const page4 = this.dialogPage.addInputGrid("Конструкции", ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"])
          this.guiManager2.CreateDialogBox([page2, page3, page4])

            // Активируем режим лазера для второй триггер-зоны
            //this.triggerManager2.distanceMode();
            //this.triggerManager2.enableDistanceMeasurement()
            this.triggerManager2.createStartButton('Завершить', () => {
              const page5 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для премещение на основную карту")
              this.guiManager2.CreateDialogBox([page5])
              this.triggerManager2.disableDistanceMeasurement()

              //this.triggerManager2.exitDisLaserMode2();
              this.guiManager2.createRouteButton('/test')
          })

          
          })

}


// Метод для настройки целевых мешей с триггерами
private setupTargetMeshes(mapMeshes: AbstractMesh[]): void {
  this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("stairs") || mesh.name.toLowerCase().includes("box"));
  
  this.targetMeshes.forEach(mesh => {
      mesh.checkCollisions = true;
      this.createRayAboveMesh(mesh);
      //this.guiManager.createButtonAboveMesh(mesh);
      
      const interactionObject = new InteractionObject(mesh);
      this.triggerManager.setupProximityTrigger(mesh, () => {
          console.log("Камера вошла в зону триггера лестницы:", mesh.name);
          this.scene.activeCamera = this.MainCamera;
      });
      
      this.triggerManager.enableClickInteraction(interactionObject.getMesh());
      this.triggerManager.setupClickTrigger(mesh, () => {
          console.log("Лестница была кликнута:", mesh.name);
      });
  });
}

// Метод для настройки мешей типа "broken" с точками и действиями
private setupBrokenMeshes(mapMeshes: AbstractMesh[]): void {
  const brokenMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("broken"));
  brokenMeshes.forEach(mesh => {
      mesh.checkCollisions = true;
      mesh.isPickable = true;
      mesh.isVisible = true;
      mesh.setEnabled(true);
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              console.log("Broken меш кликнут:", mesh.name, "Координаты:", mesh.position);
              this.interactionObject = mesh;
              this.scene.activeCamera = this.MainCamera;
              this.showPointsAndQuestions(mesh);
          })
      );
      this.createPointsAboveMesh(mesh);
  });
}

// Метод для настройки мешей типа "whole"
private setupWholeMeshes(mapMeshes: AbstractMesh[]): void {
  const wholeMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("whole"));
  wholeMeshes.forEach(mesh => {
      mesh.checkCollisions = true;
      mesh.isPickable = true;
      mesh.visibility = 0;
      mesh.setEnabled(true);
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              console.log("Whole меш кликнут:", mesh.name, "Координаты:", mesh.position);
              this.interactionObject = mesh;
              this.scene.activeCamera = this.MainCamera;
              this.showPointsAndQuestions(mesh);
          })
      );
  });
}

// Метод для создания точек над мешом
private createPointsAboveMesh(mesh: AbstractMesh): void {
  const pointsPositions = [
      new Vector3(12.46, 6.3, 4.79),
      new Vector3(12.46, 6.3, 5.21),
      new Vector3(12.46, 6.11, 4.72),
      new Vector3(12.46, 0.7, 4.72)
  ];

  pointsPositions.forEach((position, index) => {
      const diameter = index === 3 ? 0.05 : 0.01;
      const point = MeshBuilder.CreateSphere("point" + index, { diameter: diameter }, this.scene);
      point.position = mesh.position.add(position);
      
      const pointMaterial = new StandardMaterial("pointMaterial" + index, this.scene);
      pointMaterial.emissiveColor = new Color3(0, 1, 0);
      point.material = pointMaterial;
      point.isPickable = true;

      point.actionManager = new ActionManager(this.scene);
      point.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              console.log("Точка кликнута:", point.name);
          })
      );
      this.points.push(point);
  });
}

// Метод для выделения определенных мешей
private highlightSpecificMeshes(): void {
  const meshNames = [
      "SM_0_SpanStructureBeam_1_Armature_R",
      "SM_0_SpanStructureBeam_1_Cable_R",
      "SM_0_SpanStructureBeam_2_Armature_L",
      "SM_0_SpanStructureBeam_2_Cable_L"
  ];

  const meshesToHighlight = meshNames
      .map(name => this.scene.getMeshByName(name))
      .filter(mesh => mesh !== null) as Mesh[];

  meshesToHighlight.forEach(mesh => {
      this.highlightLayer.addMesh(mesh, Color3.FromHexString("#88FF88"));
      this.highlightLayer.innerGlow = false;
      this.highlightLayer.outerGlow = false;
  });
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
      PointerEventTypes
    } from "@babylonjs/core";
    import "@babylonjs/loaders";
    import { AdvancedDynamicTexture } from "@babylonjs/gui";
    import { TriggersManager } from "./FunctionComponents/TriggerManager3";
    
    export class FullExample {
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
        this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение
        this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    
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
        this.setupZoomEffect(); // Инициализация зума
    
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
          "/models/test_5.hdr",
          scene,
          512
        );
    
        scene.environmentTexture = hdrTexture;
        scene.createDefaultSkybox(hdrTexture, true);
        scene.environmentIntensity = 0.5;
    
        return scene;
      }
    
      CreateController(): void {
        this.camera = new FreeCamera("camera", new Vector3(13.7, 6.3, 5.0), this.scene);
        this.camera.attachControl(this.canvas, true);
    
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.camera.minZ = 0.45;
        this.camera.speed = 0.55;
        this.camera.angularSensibility = 4000;
        this.camera.inertia = 0.8;
      }
    
      async CreateEnvironment(): Promise<void> {
        try {
          const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_2.gltf", this.scene);
          map.forEach((mesh) => {
            
            mesh.checkCollisions = true;
          });
    
          this.setupMeshes(map); // Настройка всех мешей
          this.highlightSpecificMeshes(); // Подсвечиваем заранее указанные объекты
    
          // Настройка мешей типа "broken" и "whole"
          this.setupBrokenMeshes(map);
          this.setupWholeMeshes(map);
    
        } catch (error) {
          console.error("Ошибка при загрузке окружения:", error);
        }
      }
    
      private setupMeshes(mapMeshes: AbstractMesh[]): void {
        mapMeshes.forEach((mesh) => {
          // Убираем кликабельность для всех объектов, кроме "broken" и "whole"
          if (
            mesh.name.toLowerCase().includes("broken") ||
            mesh.name.toLowerCase().includes("whole")
          ) {
            mesh.isPickable = true;
          } else {
            mesh.isPickable = false;
          }
    
          mesh.actionManager = new ActionManager(this.scene);
          mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log(`${mesh.name} был кликнут`);
          }));
        });
      }
    
      private highlightSpecificMeshes(): void {
        const meshNames = [
          "SM_0_SpanStructureBeam_1_Armature_R",
          "SM_0_SpanStructureBeam_1_Cable_R",
          "SM_0_SpanStructureBeam_2_Armature_L",
          "SM_0_SpanStructureBeam_2_Cable_L"
        ];
    
        const meshesToHighlight = meshNames
          .map(name => this.scene.getMeshByName(name))
          .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Приводим к типу Mesh
    
        meshesToHighlight.forEach(mesh => {
          this.highlightLayer.addMesh(mesh, Color3.FromHexString("#FF0000")); // Яркая красная подсветка
        });
      }
    
      // Метод для настройки мешей типа "broken" с точками и действиями
      private setupBrokenMeshes(mapMeshes: AbstractMesh[]): void {
        const brokenMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("broken"));
        brokenMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            mesh.isPickable = true; // "broken" остаются кликабельными
            mesh.isVisible = true;
            mesh.setEnabled(true);
            mesh.actionManager = new ActionManager(this.scene);
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Broken меш кликнут:", mesh.name, "Координаты:", mesh.position);
                    this.scene.activeCamera = this.camera;
                })
            );
        });
      }
    
      // Метод для настройки мешей типа "whole"
      private setupWholeMeshes(mapMeshes: AbstractMesh[]): void {
        const wholeMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("whole"));
        wholeMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            mesh.isPickable = true; // "whole" остаются кликабельными
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
    
      // Добавление функционала для зума на правую кнопку мыши
      setupZoomEffect(): void {
        const defaultFov = this.camera.fov; // Сохраняем стандартное поле зрения
        const zoomedFov1 = defaultFov / 4; // Первый уровень приближения
        const zoomedFov2 = defaultFov / 8; // Второй уровень приближения
        const zoomedFov3 = defaultFov / 12; // Третий уровень приближения
    
        const defaultSensibility = this.camera.angularSensibility; // Сохраняем стандартную чувствительность
        const zoomedSensibility = defaultSensibility * 10; // Уменьшаем чувствительность (чем больше значение, тем ниже чувствительность)
    
        let zoomState = 0; // 0: обычный вид, 1: первый зум, 2: второй зум, 3: третий зум
    
        // Обработка событий мыши
        this.scene.onPointerObservable.add((pointerInfo) => {
          if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
            // Переходим к следующему состоянию зума
            zoomState = (zoomState + 1) % 4; // Переключение между 0, 1, 2 и 3
    
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
      PointerEventTypes
    } from "@babylonjs/core";
    import "@babylonjs/loaders";
    import { AdvancedDynamicTexture } from "@babylonjs/gui";
    import { TriggersManager } from "./FunctionComponents/TriggerManager3";
    import { ModelLoader } from "./BaseComponents/ModelLoader";
    
    export class FullExample {
      scene: Scene;
      engine: Engine;
      camera!: FreeCamera;
      triggerManager: TriggersManager;
      guiTexture: AdvancedDynamicTexture;
      highlightLayer: HighlightLayer;
      modelLoader: ModelLoader;
    
      constructor(private canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(this.canvas, true);
        this.engine.displayLoadingUI();
    
        this.scene = this.CreateScene();
        this.highlightLayer = new HighlightLayer("hl1", this.scene);
        this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение
        this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
    
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.triggerManager = new TriggersManager(
          this.scene,
          this.canvas,
          this.guiTexture
        );
        // Инициализация загрузчика моделей
        this.modelLoader = new ModelLoader(this.scene);
    
        this.CreateEnvironment().then(() => {
          this.engine.hideLoadingUI();
        });
        this.CreateController();
        this.setupZoomEffect(); // Инициализация зума
    
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
        this.camera = new FreeCamera("camera", new Vector3(13.7, 6.3, 5.0), this.scene);
        this.camera.attachControl(this.canvas, true);
    
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.camera.minZ = 0.45;
        this.camera.speed = 0.55;
        this.camera.angularSensibility = 4000;
        this.camera.inertia = 0.8;
      }
    
      async CreateEnvironment(): Promise<void> {
        try {
          const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_2.gltf", this.scene);
          map.forEach((mesh) => {
            mesh.checkCollisions = true;
          });
      
          this.setupMeshes(map); // Настройка всех мешей
          this.highlightSpecificMeshes(); // Подсвечиваем заранее указанные объекты
      
          // Настройка мешей типа "broken" и "whole"
          this.setupBrokenMeshes(map);
          this.setupWholeMeshes(map);
      
          // Загрузка и добавление TestCube в центр сцены
          const { meshes: testCubeMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "TestCube.gltf", this.scene);
          const testCube = testCubeMeshes[0]; // Предположим, что тестовый куб — это первый меш в массиве
          if (testCube) {
            testCube.position = new Vector3(0, 3, 0); // Устанавливаем позицию в центр сцены
      
            // Каждый кадр обновляем позицию TestCube так, чтобы он следовал за камерой
            this.scene.onBeforeRenderObservable.add(() => {
              const cameraDirection = this.camera.getForwardRay().direction; // Направление камеры
              const offset = cameraDirection.scale(0.5); // Уменьшаем расстояние до 2 единиц
              testCube.position = this.camera.position.add(offset); // Позиция TestCube перед камерой
            });
          }
        } catch (error) {
          console.error("Ошибка при загрузке окружения:", error);
        }
      }
      
      
    
      
    
      private setupMeshes(mapMeshes: AbstractMesh[]): void {
        mapMeshes.forEach((mesh) => {
          // Убираем кликабельность для всех объектов, кроме "broken" и "whole"
          if (
            mesh.name.toLowerCase().includes("broken") ||
            mesh.name.toLowerCase().includes("whole")
          ) {
            mesh.isPickable = true;
          } else {
            mesh.isPickable = false;
          }
    
          mesh.actionManager = new ActionManager(this.scene);
          mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log(`${mesh.name} был кликнут`);
          }));
        });
      }
    
      private highlightSpecificMeshes(): void {
        const meshNames = [
          "SM_0_SpanStructureBeam_1_Armature_R",
          "SM_0_SpanStructureBeam_1_Cable_R",
          "SM_0_SpanStructureBeam_2_Armature_L",
          "SM_0_SpanStructureBeam_2_Cable_L"
        ];
    
        const meshesToHighlight = meshNames
          .map(name => this.scene.getMeshByName(name))
          .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Приводим к типу Mesh
    
        meshesToHighlight.forEach(mesh => {
          this.highlightLayer.addMesh(mesh, Color3.FromHexString("#FF0000")); // Яркая красная подсветка
        });
      }
    
      // Метод для настройки мешей типа "broken" с точками и действиями
      private setupBrokenMeshes(mapMeshes: AbstractMesh[]): void {
        const brokenMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("broken"));
        brokenMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            mesh.isPickable = true; // "broken" остаются кликабельными
            mesh.isVisible = true;
            mesh.setEnabled(true);
            mesh.actionManager = new ActionManager(this.scene);
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Broken меш кликнут:", mesh.name, "Координаты:", mesh.position);
                    this.scene.activeCamera = this.camera;
                })
            );
        });
      }
    
      // Метод для настройки мешей типа "whole"
      private setupWholeMeshes(mapMeshes: AbstractMesh[]): void {
        const wholeMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("whole"));
        wholeMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            mesh.isPickable = true; // "whole" остаются кликабельными
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
    
      // Добавление функционала для зума на правую кнопку мыши
      setupZoomEffect(): void {
        const defaultFov = this.camera.fov; // Сохраняем стандартное поле зрения
        const zoomedFov1 = defaultFov / 4; // Первый уровень приближения
        const zoomedFov2 = defaultFov / 8; // Второй уровень приближения
        const zoomedFov3 = defaultFov / 12; // Третий уровень приближения
    
        const defaultSensibility = this.camera.angularSensibility; // Сохраняем стандартную чувствительность
        const zoomedSensibility = defaultSensibility * 10; // Уменьшаем чувствительность (чем больше значение, тем ниже чувствительность)
    
        let zoomState = 0; // 0: обычный вид, 1: первый зум, 2: второй зум, 3: третий зум
    
        // Обработка событий мыши
        this.scene.onPointerObservable.add((pointerInfo) => {
          if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
            // Переходим к следующему состоянию зума
            zoomState = (zoomState + 1) % 4; // Переключение между 0, 1, 2 и 3
    
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
    
    export class FullExample {
      scene: Scene;
      engine: Engine;
      camera!: FreeCamera;
      triggerManager: TriggersManager;
      guiTexture: AdvancedDynamicTexture;
      highlightLayer: HighlightLayer;
      modelLoader: ModelLoader;
      handModel: Mesh | null = null;  // Используем Mesh вместо AbstractMesh
      tools: { [key: string]: any } = {};
      guiManager: GUIManager;
      dialogPage: DialogPage;
      //tabletManager: TabletManager;
      triggerManager1: TriggerManager2;
      private isCaliperMoved = false; // Переменная для отслеживания состояния
    private initialPosition: Vector3; // Переменная для хранения начальной позиции
    private initialRotation: number; // Переменная для хранения начального вращения
    
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
        this.camera = new FreeCamera("camera", new Vector3(13.7, 6.3, 5.0), this.scene);
        
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
    }
      async CreateEnvironment(): Promise<void> {
        try {
          const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_5.gltf", this.scene);
          map.forEach((mesh) => {
            mesh.checkCollisions = true;
          });
      
          this.setupMeshes(map); // Настройка всех мешей
          this.highlightSpecificMeshes(); // Подсвечиваем заранее указанные объекты
          this.highlightSpecificMeshesCable_R();
          this.highlightSpecificMeshesArmature_R_3();
          // Настройка мешей типа "broken" и "whole"
          //this.setupBrokenMeshes(map);
          this.setupWholeMeshes(map);
      
        } catch (error) {
          console.error("Ошибка при загрузке окружения:", error);
        }
      }
      
      
    
      async CreateHandModel(): Promise<void> { 
        console.log("Загрузка модели штангенциркуля начата...");
        try {
            // Загрузка модели SM_Caliper.gltf
            const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_Caliper.gltf", this.scene);
    
            console.log("Модели после загрузки:", meshes);
    
            if (meshes.length > 0) {
                // Привязываем основную модель из массива meshes
                this.handModel = meshes[0] as Mesh;
    
                // Сохраняем исходные параметры для возвращения
                this.tools['originalHandModelPosition'] = this.handModel.position.clone();
                this.tools['originalHandModelRotation'] = this.handModel.rotation.clone();
    
                // Включаем поведение вращения, масштабирования и перемещения для handModel
                this.enableModelInteraction(this.handModel);
    
                // Ищем дочерний элемент SM_Nonius
                const noniusMesh = meshes.find(mesh => mesh.name === "SM_Nonius") as Mesh;
    
                if (!noniusMesh) {
                    console.warn("Ошибка: дочерний элемент SM_Nonius не найден.");
                } else {
                    console.log("Дочерний элемент SM_Nonius найден:", noniusMesh);
    
                    // Устанавливаем начальные параметры для SM_Nonius
                    noniusMesh.position = new Vector3(-0.03, 0, 0); // Смещение по оси X
                    noniusMesh.rotation = new Vector3(0, 0, 0);
                    noniusMesh.scaling = new Vector3(1, 1, 1);
                    noniusMesh.isVisible = true;
    
                    // Сохраняем его для управления
                    this.tools['noniusModel'] = {
                        mesh: noniusMesh,
                        originalPosition: noniusMesh.position.clone(),
                        originalRotation: noniusMesh.rotation.clone(),
                    };
    
                    console.log("Параметры SM_Nonius установлены.");
    
                    // Включаем управление масштабированием по колесику мыши для SM_Nonius
                    this.enableNoniusScaling(noniusMesh);
                }
    
                // Устанавливаем параметры для основной модели
                this.handModel.position = new Vector3(13.2, 6.41004, 4.85 );
                this.handModel.scaling = new Vector3(-1.5, -1.5, -1.5);
                this.handModel.rotation = new Vector3(0, Math.PI / 2, -Math.PI / 2);
                this.handModel.isVisible = true;
    
                console.log("Модель штангенциркуля загружена и параметры установлены.");
            } else {
                console.error("Ошибка: модель штангенциркуля не найдена в файле.");
            }
    
            // Пример события для обработки нажатия клавиши Esc и сброса позиции
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
          // Устанавливаем модель в принудительную позицию
          this.resetModelPosition();
      }
    });
        } catch (error) {
            console.error("Ошибка при загрузке модели штангенциркуля:", error);
        }
    }
    
    // Функция для включения управления вращением, масштабированием и перемещением модели
    enableModelInteraction(model: Mesh): void {
        // Поведение для перетаскивания модели мышкой
        const dragBehavior = new PointerDragBehavior({
            dragPlaneNormal: new Vector3(0, 0, 1), // Плоскость для вращения вдоль оси Z
        });
        model.addBehavior(dragBehavior);
    }
    
    // Функция для управления масштабированием SM_Nonius по колесику мыши
    enableNoniusScaling(noniusMesh: Mesh): void {
        // Добавим обработчик события колесика мыши для независимого масштабирования SM_Nonius
        this.scene.onPointerObservable.add((event) => {
            if (event.type === PointerEventTypes.POINTERWHEEL) {
                const wheelEvent = event.event as WheelEvent; // Преобразуем в WheelEvent
                const delta = wheelEvent.deltaY > 0 ? -0.001 : 0.001; // Шаг изменения
                
               // Обновляем позицию с ограничением
                noniusMesh.position.x = Math.max(-0.16, Math.min(0.16, noniusMesh.position.x + delta));
                console.log("Новое значение SM_Nonius по оси X:", noniusMesh.position.x);
            }
        });
    }
    
    // Функция для сброса модели штангенциркуля в исходное положение и включения видимости
    resetModelPosition(): void {
      // Заданные координаты
      const forcedPosition = new BABYLON.Vector3(13.2, 6.41004, 4.85);
      
      if (this.handModel) {
          // Принудительно устанавливаем позицию основной модели
          this.handModel.position = forcedPosition.clone();
          console.log("Модель установлена в принудительную позицию:", this.handModel.position);
    
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
    
    
    
    
    private setupMeshes(mapMeshes: AbstractMesh[]): void {
      mapMeshes.forEach((mesh) => {
        // Убираем кликабельность для всех объектов, кроме "broken" и "whole"
        if (
          mesh.name.toLowerCase().includes("broken") ||
          mesh.name.toLowerCase().includes("whole")
        ) {
          mesh.isPickable = true;
        } else {
          mesh.isPickable = false;
        }
    
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          console.log(`${mesh.name} был кликнут`);
          // Если кликнут "SM_0_SpanStructureBeam_1_Armature_R_3", поворачиваем модель
          if (mesh.name === "SM_0_SpanStructureBeam_1_Armature_R_3") {
            this.rotateCaliperModel();
          }
        }));
      });
    }
    
    private rotateCaliperModel(): void {
      if (this.handModel) {
        const rotationAnimation = new Animation(
          "rotateCaliper", 
          "rotation.z", 
          30, // скорость анимации
          Animation.ANIMATIONTYPE_FLOAT, 
          Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    
        const keyFrames = [
          {
            frame: 0,
            value: this.handModel.rotation.z
          },
          {
            frame: 30,
            value: this.handModel.rotation.z + Math.PI / 2 // Поворот на 90 градусов
          }
        ];
    
        rotationAnimation.setKeys(keyFrames);
        this.handModel.animations.push(rotationAnimation);
        this.scene.beginAnimation(this.handModel, 0, 30, false);
      }
    }
    
      // Добавляем анимацию SM_Nonius после завершения анимации камеры
      private highlightSpecificMeshes(): void {
        const meshNames = [
            //"SM_0_SpanStructureBeam_1_Armature_R_3",
            "SM_0_SpanStructureBeam_1_Armature_R_8",
            //"SM_0_SpanStructureBeam_1_Cable_R",
        ];
    
        const meshesToHighlight = meshNames
            .map(name => this.scene.getMeshByName(name))
            .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Убедиться, что это именно Mesh
    
        let isZoomed = false; // Флаг для отслеживания состояния камеры
        const initialCameraPosition = new Vector3(13.7, 6.3, 5.0);
        const targetCameraPosition = new Vector3(12.92, 6.25168, 5.04164);
    
        const initialCaliperPosition = this.handModel?.position.clone() ?? new Vector3(0, 0, 0);
        const targetCaliperPosition = new Vector3(12.444, 6.2437, 4.97655);
    
        let isNoniusMoved = false; // Флаг для отслеживания состояния SM_Nonius
        const initialNoniusPosition = new Vector3(-0.03, 0, 0);
        const targetNoniusPosition = new Vector3(-0.004, 0, 0);
    
        meshesToHighlight.forEach(mesh => {
            this.highlightLayer.addMesh(mesh, Color3.FromHexString("#00ffd9"));
    
            mesh.isPickable = true;
    
            mesh.actionManager = new ActionManager(this.scene);
            mesh.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickTrigger,
                () => {
                    console.log(`${mesh.name} был кликнут!`);
    
                    const camera = this.scene.activeCamera;
                    if (camera && camera instanceof FreeCamera) {
                        const currentCameraPosition = camera.position.clone();
                        const endCameraPosition = isZoomed ? initialCameraPosition : targetCameraPosition;
    
                        if (currentCameraPosition.equals(endCameraPosition)) return;
    
                        const cameraAnimation = new Animation(
                            "cameraMove",
                            "position",
                            30,
                            Animation.ANIMATIONTYPE_VECTOR3,
                            Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
    
                        const cameraKeys = [
                            { frame: 0, value: currentCameraPosition },
                            { frame: 60, value: endCameraPosition }
                        ];
    
                        cameraAnimation.setKeys(cameraKeys);
    
                        const initialFov = camera.fov;
                        const targetFov = isZoomed ? 0.8 : 0.4;
                        const fovAnimation = new Animation(
                            "fovAnimation",
                            "fov",
                            30,
                            Animation.ANIMATIONTYPE_FLOAT,
                            Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
    
                        const fovKeys = [
                            { frame: 0, value: initialFov },
                            { frame: 60, value: targetFov }
                        ];
    
                        fovAnimation.setKeys(fovKeys);
    
                        camera.animations = [cameraAnimation, fovAnimation];
    
                        this.scene.beginAnimation(camera, 0, 60, false, 1, () => {
                            console.log("Анимация камеры завершена.");
    
                            const noniusMesh = this.tools['noniusModel']?.mesh;
                            if (noniusMesh) {
                                const startPosition = isNoniusMoved ? targetNoniusPosition : initialNoniusPosition;
                                const endPosition = isNoniusMoved ? initialNoniusPosition : targetNoniusPosition;
    
                                this.animateNoniusPosition(noniusMesh, startPosition, endPosition);
    
                                isNoniusMoved = !isNoniusMoved;
                            }
                        });
                    }
    
                    const endCaliperPosition = isZoomed ? initialCaliperPosition : targetCaliperPosition;
                    this.moveCaliperWithAnimation(endCaliperPosition);
    
                    isZoomed = !isZoomed;
                }
            ));
        });
    }
    
    private highlightSpecificMeshesCable_R(): void {
      const meshNames = [
          "SM_0_SpanStructureBeam_1_Cable_R",
      ];
    
      const meshesToHighlight = meshNames
          .map(name => this.scene.getMeshByName(name))
          .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Убедиться, что это именно Mesh
    
      let isZoomed = false; // Флаг для отслеживания состояния камеры
      const initialCameraPosition = new Vector3(13.7, 6.3, 5.0);
      const targetCameraPosition = new Vector3(12.92, 6.16204, 4.98041);
    
      const initialCaliperPosition = this.handModel?.position.clone() ?? new Vector3(0, 0, 0);
      const targetCaliperPosition = new Vector3(12.4, 6.1612, 5.03041);
    
      let isNoniusMoved = false; // Флаг для отслеживания состояния SM_Nonius
      const initialNoniusPosition = new Vector3(-0.03, 0, 0);
      const targetNoniusPosition = new Vector3(-0.010, 0, 0);
    
      // Получаем меши, которые нужно скрывать/показывать
      const obstructingMeshes = [
          this.scene.getMeshByName("SM_0_SpanStructureBeam_1_Armature_R_7"),
          this.scene.getMeshByName("SM_0_SpanStructureBeam_1_Armature_R_0"),
      ];
    
      // Проверяем, все ли меши найдены
      obstructingMeshes.forEach(mesh => {
          if (!mesh) {
              console.warn("Один или несколько мешей для скрытия не найдены.");
          }
      });
    
      let isObstructingMeshesVisible = true; // Флаг для отслеживания видимости мешей
    
      meshesToHighlight.forEach(mesh => {
          this.highlightLayer.addMesh(mesh, Color3.FromHexString("#00ffd9"));
    
          mesh.isPickable = true;
    
          mesh.actionManager = new ActionManager(this.scene);
          mesh.actionManager.registerAction(new ExecuteCodeAction(
              ActionManager.OnPickTrigger,
              () => {
                  console.log(`${mesh.name} был кликнут!`);
    
                  const camera = this.scene.activeCamera;
                  if (camera && camera instanceof FreeCamera) {
                      const currentCameraPosition = camera.position.clone();
                      const endCameraPosition = isZoomed ? initialCameraPosition : targetCameraPosition;
    
                      if (currentCameraPosition.equals(endCameraPosition)) return;
    
                      const cameraAnimation = new Animation(
                          "cameraMove",
                          "position",
                          30,
                          Animation.ANIMATIONTYPE_VECTOR3,
                          Animation.ANIMATIONLOOPMODE_CONSTANT
                      );
    
                      const cameraKeys = [
                          { frame: 0, value: currentCameraPosition },
                          { frame: 60, value: endCameraPosition }
                      ];
    
                      cameraAnimation.setKeys(cameraKeys);
    
                      const initialFov = camera.fov;
                      const targetFov = isZoomed ? 0.8 : 0.4;
                      const fovAnimation = new Animation(
                          "fovAnimation",
                          "fov",
                          30,
                          Animation.ANIMATIONTYPE_FLOAT,
                          Animation.ANIMATIONLOOPMODE_CONSTANT
                      );
    
                      const fovKeys = [
                          { frame: 0, value: initialFov },
                          { frame: 60, value: targetFov }
                      ];
    
                      fovAnimation.setKeys(fovKeys);
    
                      camera.animations = [cameraAnimation, fovAnimation];
    
                      this.scene.beginAnimation(camera, 0, 60, false, 1, () => {
                          console.log("Анимация камеры завершена.");
    
                          const noniusMesh = this.tools['noniusModel']?.mesh;
                          if (noniusMesh) {
                              const startPosition = isNoniusMoved ? targetNoniusPosition : initialNoniusPosition;
                              const endPosition = isNoniusMoved ? initialNoniusPosition : targetNoniusPosition;
    
                              this.animateNoniusPosition(noniusMesh, startPosition, endPosition);
    
                              isNoniusMoved = !isNoniusMoved;
                          }
                      });
                  }
    
                  const endCaliperPosition = isZoomed ? initialCaliperPosition : targetCaliperPosition;
                  this.moveCaliperWithAnimation(endCaliperPosition);
    
                  // Переключение видимости obstructingMeshes
                  isObstructingMeshesVisible = !isObstructingMeshesVisible;
                  obstructingMeshes.forEach(obstructingMesh => {
                      if (obstructingMesh) {
                          obstructingMesh.setEnabled(isObstructingMeshesVisible);
                          console.log(`Меш ${obstructingMesh.name} теперь ${isObstructingMeshesVisible ? "видим" : "скрыт"}.`);
                      }
                  });
    
                  isZoomed = !isZoomed;
              }
          ));
      });
    }
    
    
    
    private highlightSpecificMeshesArmature_R_3(): void {
        const meshNames = [
            "SM_0_SpanStructureBeam_1_Armature_R_3",
        ];
    
        const meshesToHighlight = meshNames
            .map(name => this.scene.getMeshByName(name))
            .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Убедиться, что это именно Mesh
    
        let isZoomed = false; // Флаг для отслеживания состояния камеры
        const initialCameraPosition = new Vector3(13.7, 6.3, 5.0);
        const targetCameraPosition = new Vector3(12.92, 6.25168, 5.08164);
    
        const initialCaliperPosition = this.handModel?.position.clone() ?? new Vector3(0, 0, 0);
        const targetCaliperPosition = new Vector3(12.444, 6.3068, 5.06); // Новая позиция
    
        let isNoniusMoved = false; // Флаг для отслеживания состояния SM_Nonius
        const initialNoniusPosition = new Vector3(-0.03, 0, 0);
        const targetNoniusPosition = new Vector3(-0.004, 0, 0);
    
        meshesToHighlight.forEach(mesh => {
            this.highlightLayer.addMesh(mesh, Color3.FromHexString("#00ffd9"));
    
            mesh.isPickable = true;
    
            mesh.actionManager = new ActionManager(this.scene);
            mesh.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickTrigger,
                () => {
                    console.log(`${mesh.name} был кликнут!`);
    
                    const camera = this.scene.activeCamera;
                    if (camera && camera instanceof FreeCamera) {
                        const currentCameraPosition = camera.position.clone();
                        const endCameraPosition = isZoomed ? initialCameraPosition : targetCameraPosition;
    
                        if (currentCameraPosition.equals(endCameraPosition)) return;
    
                        const cameraAnimation = new Animation(
                            "cameraMove",
                            "position",
                            30,
                            Animation.ANIMATIONTYPE_VECTOR3,
                            Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
    
                        const cameraKeys = [
                            { frame: 0, value: currentCameraPosition },
                            { frame: 60, value: endCameraPosition }
                        ];
    
                        cameraAnimation.setKeys(cameraKeys);
    
                        const initialFov = camera.fov;
                        const targetFov = isZoomed ? 0.8 : 0.4;
                        const fovAnimation = new Animation(
                            "fovAnimation",
                            "fov",
                            30,
                            Animation.ANIMATIONTYPE_FLOAT,
                            Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
    
                        const fovKeys = [
                            { frame: 0, value: initialFov },
                            { frame: 60, value: targetFov }
                        ];
    
                        fovAnimation.setKeys(fovKeys);
    
                        camera.animations = [cameraAnimation, fovAnimation];
    
                        this.scene.beginAnimation(camera, 0, 60, false, 1, () => {
                            console.log("Анимация камеры завершена.");
    
                            const noniusMesh = this.tools['noniusModel']?.mesh;
                            if (noniusMesh) {
                                const startPosition = isNoniusMoved ? targetNoniusPosition : initialNoniusPosition;
                                const endPosition = isNoniusMoved ? initialNoniusPosition : targetNoniusPosition;
    
                                this.animateNoniusPosition(noniusMesh, startPosition, endPosition);
    
                                isNoniusMoved = !isNoniusMoved;
                            }
                        });
                    }
    
                    const endCaliperPosition = isZoomed ? initialCaliperPosition : targetCaliperPosition;
                    this.moveCaliperWithAnimationArmature_R_3(endCaliperPosition); // Перемещение Caliper
    
                    isZoomed = !isZoomed;
                }
            ));
        });
    }
    
      
      // Функция для анимации перемещения SM_Nonius
      private animateNoniusPosition(mesh: Mesh, from: Vector3, to: Vector3): void {
        const animation = new Animation(
            "noniusMove",
            "position",
            30, // Частота кадров
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
      
        const keys = [
            { frame: 0, value: from },
            { frame: 30, value: to }
        ];
      
        animation.setKeys(keys);
      
        mesh.animations = [];
        mesh.animations.push(animation);
      
        this.scene.beginAnimation(mesh, 0, 30, false);
      
        console.log("Анимация SM_Nonius запущена:", from, "->", to);
      }
      
      // Функция для перемещения SM_Caliper.gltf с анимацией
      private moveCaliperWithAnimation(targetPosition: Vector3): void {
        if (!this.handModel) {
            console.warn("Модель SM_Caliper.gltf не найдена.");
            return;
        }
      
        const animation = new BABYLON.Animation(
            "moveCaliperAnimation",
            "position",
            60, // Количество кадров в секунду
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
      
        const keys = [
            { frame: 0, value: this.handModel.position.clone() },
            { frame: 60, value: targetPosition }
        ];
      
        animation.setKeys(keys);
      
        this.handModel.animations = [];
        this.handModel.animations.push(animation);
      
        this.scene.beginAnimation(this.handModel, 0, 60, false);
      
        console.log("Анимация перемещения SM_Caliper запущена к:", targetPosition);
      }
    
    
      private moveCaliperWithAnimationArmature_R_3(targetPosition: Vector3): void {
        if (!this.handModel) {
            console.warn("Модель SM_Caliper.gltf не найдена.");
            return;
        }
    
        // Если модель не была перемещена раньше, сохраняем её начальные значения
        if (!this.initialPosition) {
            this.initialPosition = this.handModel.position.clone();
            this.initialRotation = this.handModel.rotation.z;
        }
    
        // Если модель уже перемещена, возвращаем в исходное состояние
        if (this.isCaliperMoved) {
            // Анимация перемещения обратно в исходное положение
            const moveAnimation = new BABYLON.Animation(
                "moveCaliperAnimation",
                "position",
                60, // Количество кадров в секунду
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
    
            const moveKeys = [
                { frame: 0, value: this.handModel.position.clone() },
                { frame: 60, value: this.initialPosition } // Возвращаем в начальную позицию
            ];
    
            moveAnimation.setKeys(moveKeys);
    
            // Анимация вращения обратно в начальное состояние (0 по оси Z)
            const rotateAnimation = new BABYLON.Animation(
                "rotateCaliperAnimation",
                "rotation.z",
                60, // Количество кадров в секунду
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
    
            const rotateKeys = [
                { frame: 0, value: this.handModel.rotation.z },
                { frame: 60, value: this.initialRotation } // Возвращаем на 0 градусов
            ];
    
            rotateAnimation.setKeys(rotateKeys);
    
            // Добавляем анимации сброса
            this.handModel.animations = [moveAnimation, rotateAnimation];
    
            // Запуск анимаций сброса
            this.scene.beginAnimation(this.handModel, 0, 60, false);
    
            this.isCaliperMoved = false; // Обновляем состояние
            console.log("Модель вернулась в исходное положение.");
        } else {
            // Анимация перемещения в целевую позицию
            const moveAnimation = new BABYLON.Animation(
                "moveCaliperAnimation",
                "position",
                60, // Количество кадров в секунду
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
    
            const moveKeys = [
                { frame: 0, value: this.handModel.position.clone() },
                { frame: 60, value: targetPosition }
            ];
    
            moveAnimation.setKeys(moveKeys);
    
            // Анимация вращения по оси Z (на 90 градусов)
            const rotateAnimation = new BABYLON.Animation(
                "rotateCaliperAnimation",
                "rotation.z",
                60, // Количество кадров в секунду
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
    
            const rotateKeys = [
                { frame: 0, value: this.handModel.rotation.z },
                { frame: 60, value: this.handModel.rotation.z - Math.PI / 2 } // Вращение на 90 градусов (PI/2)
            ];
    
            rotateAnimation.setKeys(rotateKeys);
    
            // Добавляем обе анимации
            this.handModel.animations = [moveAnimation, rotateAnimation];
    
            // Запуск анимаций
            this.scene.beginAnimation(this.handModel, 0, 60, false);
    
            this.isCaliperMoved = true; // Обновляем состояние
            console.log("Анимация перемещения и вращения SM_Caliper запущена к:", targetPosition);
        }
    }
      
    
    
    Page(): void {const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
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
    
    
    
      
    
      
      
      // Метод для настройки мешей типа "broken" с точками и действиями
      /*private setupBrokenMeshes(mapMeshes: AbstractMesh[]): void {
        const brokenMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("broken"));
        brokenMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            mesh.isPickable = false; // "broken" остаются кликабельными
            mesh.isVisible = true;
            mesh.setEnabled(true);
            mesh.actionManager = new ActionManager(this.scene);
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Broken меш кликнут:", mesh.name, "Координаты:", mesh.position);
                    this.scene.activeCamera = this.camera;
                })
            );
        });
      }*/
    
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
    
      
    
      // Добавление функционала для зума на правую кнопку мыши
      /*setupZoomEffect(): void {
        const defaultFov = this.camera.fov; // Сохраняем стандартное поле зрения
        const zoomedFov1 = defaultFov / 4; // Первый уровень приближения
    
        const defaultSensibility = this.camera.angularSensibility; // Стандартная чувствительность
        const zoomedSensibility = defaultSensibility * 10; // Снижение чувствительности
    
        const initialCameraPosition = this.camera.position.clone(); // Сохраняем начальное положение камеры
        const initialTarget = this.camera.getTarget().clone(); // Сохраняем начальную цель камеры
    
        let zooming = false; // Состояние увеличения
    
        // Обработка событий мыши
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
                // Когда правая кнопка мыши нажата, увеличиваем зум
                zooming = true;
                this.camera.fov = zoomedFov1; // Уменьшаем поле зрения (приближаем камеру)
                this.camera.angularSensibility = zoomedSensibility; // Уменьшаем чувствительность
                if (this.handModel) {
                    this.camera.setTarget(this.handModel.position); // Фокусируемся на модели
                }
            }
    
            if (pointerInfo.type === PointerEventTypes.POINTERUP && pointerInfo.event.button === 2) {
                // Когда правая кнопка мыши отпущена, возвращаем камеру в исходное положение
                zooming = false;
                this.camera.fov = defaultFov; // Восстанавливаем стандартное поле зрения
                this.camera.angularSensibility = defaultSensibility; // Восстанавливаем стандартную чувствительность
                this.camera.position.copyFrom(initialCameraPosition); // Восстанавливаем исходное положение
                this.camera.setTarget(initialTarget); // Восстанавливаем цель камеры
            }
        });
    }*/
    
    
    
    }
    