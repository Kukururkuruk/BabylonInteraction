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
  private isCollapsed: boolean = false; // Флаг для отслеживания состояния
  private originalPosition!: BABYLON.Vector3; // Добавляем '!' для исключения ошибки
  private originalCameraPosition: BABYLON.Vector3 | null = null;  // Для хранения исходной позиции камеры
  private isVerticalMeasurement = false; // Флаг для отслеживания вертикального измерения
  private currentMeasurementMode: 'horizontal' | 'vertical' = 'horizontal'; // Флаг для текущего режима измерения
  private isMoving: boolean = false;
  private moveInterval: number | null = null;
  private previousY: number = 0; // Добавляем свойство previousY для отслеживания положения
  private isChildScalingEnabled = true;  // Флаг для активации/деактивации метода
  private previousX: number = 0; // Добавляем свойство для отслеживания позиции X


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
    this.originalPosition = new BABYLON.Vector3(0, 0, 0); // Задаем начальное значение
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
     // Сохраняем исходную позицию камеры
  this.originalCameraPosition = this.camera.position.clone();

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
    // Добавляем обработчик нажатия клавиши Esc
    this.addEscapeKeyListener();
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
        this.enableChildScaling(childMeshes, this.handModel);         
        this.enableVerticalScaling(childMeshes, this.handModel);
        const sm_10cm = this.scene.getMeshByName("SM_10cm") as BABYLON.Mesh;
        if (sm_10cm) {
            sm_10cm.position.x += 0;  // Сдвигаем меш на 0.1 по оси X
            console.log("Новая позиция SM_10cm: ", sm_10cm.position);
        }

        // Устанавливаем параметры для основной модели
        this.handModel.position = new Vector3(13, 6.41004, 4.95);
        this.handModel.scaling = new Vector3(-1, -1, -1);
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

    /*// Создание кликабельных примитивов (мешей) серого цвета
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
*/
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
      // Создание полупрозрачной неактивной модели
    await this.createTransparentModel(new BABYLON.Vector3(12.84, 6.16411, 5.31));
    await this.createTransparentModel(new BABYLON.Vector3(12.84, 6.38411, 4.96));


  } catch (error) {
    console.error("Ошибка при загрузке окружения:", error);
  }
}

private async createTransparentModel(position: BABYLON.Vector3): Promise<void> {
  try {
    // Загружаем модель
    const { meshes } = await BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP.gltf", this.scene);

    if (meshes.length > 0) {
      const modelCopy = meshes[0].clone("transparentModelCopy", null);

      if (modelCopy) {
        modelCopy.position = position;

         // Если это конкретная позиция, поворачиваем на 90 градусов
    if (position.equals(new BABYLON.Vector3(12.84, 6.16411, 5.31))) {
      modelCopy.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0);
  }

   // Если это конкретная позиция, поворачиваем на 90 градусов
   if (position.equals(new BABYLON.Vector3(12.84, 6.38411, 4.96))) {
    //modelCopy.rotation = new BABYLON.Vector3(0, 0, 0);
}
   

        // Применяем прозрачность ко всем подмешам
        modelCopy.getChildMeshes().forEach((childMesh) => {
          if (childMesh instanceof BABYLON.Mesh) {
            let originalMaterial = childMesh.material;

            if (!originalMaterial) {
              // Если материала нет, создаем новый стандартный материал
              originalMaterial = new BABYLON.StandardMaterial(`autoMaterial_${childMesh.name}`, this.scene);
              childMesh.material = originalMaterial;
            }

            const transparentMaterial = originalMaterial.clone(`transparent_${originalMaterial.name}`);
            if (transparentMaterial) {
              transparentMaterial.alpha = 0.3; // 50% прозрачности

              if (transparentMaterial instanceof BABYLON.PBRMaterial) {
                transparentMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
              }

              childMesh.material = transparentMaterial;
            } else {
              console.warn(`Не удалось клонировать материал для меша ${childMesh.name}`);
            }
          }
        });

        modelCopy.isPickable = false;
        modelCopy.setEnabled(true);

        console.log("Создана полупрозрачная модель в своих цветах", position);
      } else {
        console.error("Ошибка: не удалось клонировать модель.");
      }
    } else {
      console.error("Ошибка: модель SM_TapeMeasure_LP не загружена.");
    }
    
  } catch (error) {
    console.error("Ошибка при создании полупрозрачной модели:", error);
  }
}




private enableChildScaling(childMeshes: BABYLON.Mesh[], rulerModel: BABYLON.Mesh): void {
  if (this.isVerticalMeasurement || !this.isChildScalingEnabled) return; // Если вертикальное измерение или метод деактивирован, не выполняем

  const originalPositions = childMeshes.map(mesh => mesh.position.clone());

  const moveMeshes = (delta: number) => {
    const firstMesh1 = childMeshes[0];
    //console.log(`🔵 Проверяем позицию первого меша: x = ${firstMesh.position.x}`);

    // Если мы достигли порога (0.42), прекращаем движение и переключаем камеру
    if (firstMesh1.position.x >= 0.42) {
      this.isMoving = false;
      if (this.moveInterval !== null) {
        window.clearInterval(this.moveInterval);
        this.moveInterval = null;
      }

      // Переключаем камеру на горизонтальное положение
      if (!this.isVerticalMeasurement) {
        console.log("Переключаем камеру на горизонтальное положение.");
        this.zoomCamera();
      }

      return;
    }

    // Перемещаем все меши с учетом пороговых значений
    for (let i = 0; i < childMeshes.length; i++) {
      const childMesh = childMeshes[i];

      if (i === 0) {
        childMesh.position.x += delta;
        //console.log(`Перемещаем первый меш на: ${delta}`);
      } else {
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

        if (firstMesh1.position.x >= threshold) {
          childMesh.position.x += delta;
          //console.log(`Перемещаем меш ${i} на: ${delta}`);
        }
      }

      if (childMesh.position.x > 1.50) childMesh.position.x = 1.50;
    }
  };

  this.scene.onPointerObservable.add((event: BABYLON.PointerInfo) => { 
    if (event.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      const pointerEvent = event.event as PointerEvent;  // Используем event вместо pointerEvent

      // Проверяем горизонтальное движение, используя previousX
      const isHorizontal = Math.abs(pointerEvent.clientX - this.previousX) > 10; // Если движение по оси X значительное

      //console.log(`🔵 Событие мыши: ${event.type}, isHorizontal = ${isHorizontal}`);

      if (isHorizontal && !this.isMoving) {
        this.isMoving = true;
        //console.log("🔵 Запускаем setInterval для moveMeshes!");
        this.moveInterval = window.setInterval(() => moveMeshes(0.003), 20);
      }

      // Сохраняем текущую позицию X
      this.previousX = pointerEvent.clientX;
    }
  
    /*if (event.type === BABYLON.PointerEventTypes.POINTERUP) {
      this.isMoving = false;
      if (this.moveInterval !== null) {
        window.clearInterval(this.moveInterval);
        this.moveInterval = null;
      }
      //console.log("⏸ Остановка движения (POINTERUP)");
    }*/
  });

  window.addEventListener('keydown', (e) => {
    console.log(`Клавиша нажата: ${e.key}`);
    
    if (e.key === 'Escape') {
      console.log("Нажата Escape: сбрасываем позиции мешей");
      childMeshes.forEach((mesh, i) => {
        console.log(`Возвращаем ${mesh.name} в ${originalPositions[i]}`);
        mesh.position.copyFrom(originalPositions[i]);
      });
  
      this.isMoving = false;
      if (this.moveInterval !== null) {
        window.clearInterval(this.moveInterval);
        this.moveInterval = null;
      }
    }

    if (e.key === 'q') {
      console.log("Нажата клавиша 'q'");
      this.isChildScalingEnabled = !this.isChildScalingEnabled; // Переключаем флаг

      console.log(`Метод enableChildScaling теперь ${this.isChildScalingEnabled ? 'активен' : 'деактивирован'}`);

      if (!rulerModel) {
        console.error("Ошибка: rulerModel не найден!");
        return;
      }

      console.log(`Текущее положение модели: rotation = ${rulerModel.rotation.toString()}`);

      // Переключаем положение модели
      if (this.isVerticalMeasurement) {
        rulerModel.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2); // Возвращаем горизонтальное положение
        this.isVerticalMeasurement = false;
        console.log("Модель повернута в горизонтальное положение.");
      } else {
        rulerModel.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2); // Возвращаем вертикальное положение
        this.isVerticalMeasurement = true;
        console.log("Модель повернута в вертикальное положение.");
      }

      // Лог после изменения
      console.log(`После изменения: isVerticalMeasurement = ${this.isVerticalMeasurement}`);
      console.log(`Положение модели: rotation = ${rulerModel.rotation.toString()}`);

      // Выполняем соответствующую функцию в зависимости от положения модели
      if (this.isVerticalMeasurement) {
        this.enableVerticalScaling(childMeshes, rulerModel);  // Вертикальное измерение
      } else {
        this.enableChildScaling(childMeshes, rulerModel);  // Горизонтальное измерение
      }
    }
  });
}


private enableVerticalScaling(childMeshes: BABYLON.Mesh[], rulerModel: BABYLON.Mesh): void {
  if (!this.isVerticalMeasurement) return; // Если вертикальное измерение не активно, не выполняем

  let isMoving = false;
  let moveInterval: number | null = null;
  const originalPositions = childMeshes.map(mesh => mesh.position.clone());
  let stopMoving = false;  // Флаг для остановки движения
  let isInterfaceLocked = false;  // Флаг для блокировки интерфейса

  const moveMeshes = (delta: number) => {
    if (stopMoving) return;  // Если движение остановлено, не продолжаем

    const firstMesh = childMeshes[0];

    // Проверяем, если первый меш достиг предела X >= 0.10, останавливаем движение
    // Если мы достигли порога (0.42), прекращаем движение и переключаем камеру
    if (firstMesh.position.x >= 0.20) {
      this.isMoving = false;
      if (this.moveInterval !== null) {
        window.clearInterval(this.moveInterval);
        this.moveInterval = null;
        this.zoomCameraVertical();
      }

      // Переключаем камеру на горизонтальное положение
     /* if (!this.isVerticalMeasurement) {
        console.log("Переключаем камеру на горизонтальное положение.");
        this.zoomCameraVertical();
      }*/

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

      //console.log(`📍 Новая позиция ${childMesh.name}: X=${childMesh.position.x}`); // Лог позиции меша

      if (childMesh.position.x > 1.50) childMesh.position.x = 1.50;  // Ограничиваем движение по оси X
    }
  };

  this.scene.onPointerObservable.add((event) => {
    if (isInterfaceLocked) return;  // Игнорируем клики, если интерфейс заблокирован

    //console.log(`🟢 Событие мыши: ${event.type}`); // Лог события мыши

    if (event.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      // Проверка, чтобы не запускать setInterval, если уже идет движение
      if (!isMoving) {
        isMoving = true;
        this.scene.onBeforeRenderObservable.add(() => moveMeshes(0.003));
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      childMeshes.forEach((mesh, i) => mesh.position.copyFrom(originalPositions[i]));
      isMoving = false;
      stopMoving = false;
      isInterfaceLocked = false;
      // Убираем обработчик с обновлений, если движение уже было активным
      this.scene.onBeforeRenderObservable.clear();
    }
  });
}



// Функция для приближения камеры (аналог для горизонтального замера)
private zoomCamera(): void {
  const camera = this.scene.activeCamera as BABYLON.FreeCamera;
  if (!camera) return;

  const originalPosition = camera.position.clone();
  const zoomPosition1 = originalPosition.subtract(new BABYLON.Vector3(0.8, 0.1, 0.2));
  const zoomPosition2 = zoomPosition1.subtract(new BABYLON.Vector3(0, 0, -0.4));

  const zoomDuration = 1000;
  const pauseDuration = 1000;

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
      setTimeout(() => {
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
}



private resetCameraPosition(): void {
  if (this.originalCameraPosition) {
    const camera = this.camera;
    const resetDuration = 500; // Продолжительность анимации возврата камеры

    console.log("Попытка вернуть камеру в исходное положение...");

    // Анимация возврата камеры в исходную позицию
    BABYLON.Animation.CreateAndStartAnimation(
      "resetCameraPosition", 
      camera, 
      "position", 
      30, 
      resetDuration / 30, 
      camera.position, 
      this.originalCameraPosition, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    console.log("Анимация возвращения камеры запущена.");
  } else {
    console.log("Исходная позиция камеры не сохранена.");
  }
}

// Добавляем обработку нажатия клавиши Esc
private addEscapeKeyListener(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Восстанавливаем камеру в исходную позицию
      this.resetCameraPosition();
    }
  });
}



// Функция для приближения камеры (аналог для вертикального замера)
private zoomCameraVertical(): void {
  const camera = this.scene.activeCamera as BABYLON.FreeCamera;
  if (!camera) return;

  const originalPosition = camera.position.clone();
  const zoomPosition1 = originalPosition.subtract(new BABYLON.Vector3(0.8, 0.2, 0.03));
  const zoomPosition2 = zoomPosition1.subtract(new BABYLON.Vector3(0, -0.25, 0));

  const zoomDuration = 1000;
  const pauseDuration = 1000;

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
      setTimeout(() => {
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
}















































/*// Добавляем обработчик клика на точку
private onPointClick(targetPosition: BABYLON.Vector3): void {
  const mesh = this.scene.getMeshByName("sm_10cm") as BABYLON.Mesh; // Приводим AbstractMesh к Mesh
  if (!mesh || !(mesh instanceof BABYLON.Mesh)) {
      console.error("Меш sm_10cm не найден или не является Mesh!");
      return;
  }

  console.log(`Клик по точке, перемещаем sm_10cm в позицию ${targetPosition}`);

  this.animateMeshToPosition(mesh, targetPosition);
}

// Функция анимации перемещения меша в указанную позицию
private animateMeshToPosition(mesh: BABYLON.Mesh, targetPosition: BABYLON.Vector3): void {
  const animation = new BABYLON.Animation(
      `moveToPosition_${mesh.name}`,
      "position",
      120,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const keys = [
      { frame: 0, value: mesh.position.clone() },
      { frame: 120, value: targetPosition }
  ];
  animation.setKeys(keys);

  mesh.animations.push(animation);

  this.scene.beginAnimation(mesh, 0, 120, false, 1, () => {
      console.log(`sm_10cm достиг позиции ${targetPosition}`);
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