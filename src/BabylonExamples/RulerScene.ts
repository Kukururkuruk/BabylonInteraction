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

}

private async CreateEnvironment(): Promise<void> {
  try {
    const map = await this.loadMap();
    const boundaryMeshes = this.findBoundaryMeshes(map);
    if (boundaryMeshes.length === 0) return;

    const { minBoundary, maxBoundary } = this.calculateBoundaries(boundaryMeshes);

    const meshes = await this.loadTapeMeasure();
    if (meshes.length === 0) return;

    this.handModel = meshes[0] as BABYLON.Mesh;
    this.attachHandModel();
    this.bindModelToCursor();
    this.smoothMovement(minBoundary, maxBoundary);
    this.bindRotationKeys(); // Вызовите метод здесь
  } catch (error) {
    console.error("Ошибка при загрузке окружения:", error);
  }
  
}

private async loadMap(): Promise<BABYLON.Mesh[]> {
  const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_5.gltf", this.scene);
  const map = meshes as BABYLON.Mesh[]; // Приведение типа
  map.forEach((mesh) => {
    mesh.checkCollisions = true;
  });
  this.setupWholeMeshes(map);
  return map;
}

private findBoundaryMeshes(map: BABYLON.Mesh[]): BABYLON.Mesh[] {
  const boundaryMeshes = map.filter(mesh => mesh.name.startsWith("SM_0_SpanStructureBeam"));
  if (boundaryMeshes.length === 0) {
    console.error("Ошибка: ограничивающие меши не найдены.");
  } else {
    console.log("Найдены ограничивающие меши:", boundaryMeshes.map(mesh => mesh.name));
  }
  return boundaryMeshes;
}

private calculateBoundaries(boundaryMeshes: BABYLON.Mesh[]): { minBoundary: BABYLON.Vector3, maxBoundary: BABYLON.Vector3 } {
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

  return { minBoundary, maxBoundary };
}

private async loadTapeMeasure(): Promise<BABYLON.Mesh[]> {
  const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP_MOD_3.gltf", this.scene);
  const tapeMeasureMeshes = meshes as BABYLON.Mesh[]; // Приведение типа
  console.log("Все меши после загрузки:", tapeMeasureMeshes.map(mesh => mesh.name));
  return tapeMeasureMeshes;
}


private attachHandModel(): void {
  const sm_10cm = this.scene.getMeshByName("SM_10cm") as BABYLON.Mesh;
  const sm_TapeMeasure_LP_MOD_3 = this.scene.meshes.find(mesh => mesh.name.includes("CorpTapeMeasure")) as BABYLON.Mesh;
  // Выводим все меши в сцене для отладки
  console.log("Все меши в сцене:", this.scene.meshes.map(mesh => mesh.name));

  if (!sm_TapeMeasure_LP_MOD_3) {
    console.warn("Меш SM_CorpTapeMeasure не найден, пробуем ещё раз...");
    setTimeout(() => {
      const retryMesh = this.scene.getMeshByName("SM_CorpTapeMeasure") as BABYLON.Mesh;
      if (retryMesh) {
        retryMesh.setParent(sm_10cm);
        console.log("SM_CorpTapeMeasure теперь является дочерним элементом SM_10cm.");
      } else {
        console.error("Меш SM_CorpTapeMeasure всё ещё не найден.");
      }
    }, 500);
  }
}


private bindModelToCursor(): void {
  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && this.handModel) {
      const pickInfo = this.scene.pick(event.event.clientX, event.event.clientY);
      if (pickInfo.hit && this.handModel) {
        this.handModel.position = pickInfo.pickedPoint!;
      }
    }
  });
}

private smoothMovement(minBoundary: BABYLON.Vector3, maxBoundary: BABYLON.Vector3): void {
  let targetPosition: BABYLON.Vector3 | null = null;
  const smoothingFactor = 0.1;
  let isFixed = false;
  let lastPosition: BABYLON.Vector3 | null = null;
  let currentPosition = this.handModel ? this.handModel.position.clone() : BABYLON.Vector3.Zero();
  
  let firstClickDone = false;  // Флаг для отслеживания первого клика

  this.scene.onPointerObservable.add((event) => {
    if (!this.handModel) return;

    if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && !firstClickDone) {
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
      if (!firstClickDone) {
        // Первый клик: выдвигаем SM_CorpTapeMeasure и делаем его дочерним для SM_10cm
        const sm_10cm = this.scene.getMeshByName("SM_10cm") as BABYLON.Mesh;
        const sm_TapeMeasure_LP_MOD_3 = this.scene.getMeshByName("SM_CorpTapeMeasure") as BABYLON.Mesh;

        if (sm_TapeMeasure_LP_MOD_3) {
          sm_TapeMeasure_LP_MOD_3.position.x += 0.1; // Примерное значение для выдвижения
          sm_TapeMeasure_LP_MOD_3.setParent(sm_10cm); // Делает SM_CorpTapeMeasure дочерним элементом sm_10cm
          console.log("SM_CorpTapeMeasure выдвинут и стал дочерним элементом SM_10cm");
          firstClickDone = true;  // Устанавливаем флаг после первого клика
        }
      }

      // Фиксируем положение модели
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
}


private bindRotationKeys(): void {
  const sm_10cm = this.scene.getMeshByName("SM_10cm") as BABYLON.Mesh;

  if (!sm_10cm) {
    console.error("Меш sm_10cm не найден!");
    return;
  }

  const rotationSpeed = 0.05; // Скорость вращения

  window.addEventListener('keydown', (e) => {
    console.log(`Нажата клавиша: ${e.key}`);

    // Вращение по оси X (локальная ось X)
    if (e.key === 'q') {
      sm_10cm.rotate(BABYLON.Axis.X, -rotationSpeed, BABYLON.Space.LOCAL);
      console.log("Вращение по оси X (влево):", sm_10cm.rotation.x);
    }
    if (e.key === 'e') {
      sm_10cm.rotate(BABYLON.Axis.X, rotationSpeed, BABYLON.Space.LOCAL);
      console.log("Вращение по оси X (вправо):", sm_10cm.rotation.x);
    }

    // Вращение по оси Y (локальная ось Y)
    if (e.key === 'w') {
      sm_10cm.rotate(BABYLON.Axis.Y, -rotationSpeed, BABYLON.Space.LOCAL);
      console.log("Вращение по оси Y (вверх):", sm_10cm.rotation.y);
    }
    if (e.key === 's') {
      sm_10cm.rotate(BABYLON.Axis.Y, rotationSpeed, BABYLON.Space.LOCAL);
      console.log("Вращение по оси Y (вниз):", sm_10cm.rotation.y);
    }

    console.log("Текущая позиция модели:", sm_10cm.position);
    console.log("Текущее вращение модели:", sm_10cm.rotation);
  });
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