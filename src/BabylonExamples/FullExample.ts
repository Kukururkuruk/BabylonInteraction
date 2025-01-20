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
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_2.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });
  
      this.setupMeshes(map); // Настройка всех мешей
      this.highlightSpecificMeshes(); // Подсвечиваем заранее указанные объекты
  
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
      }));
    });
  }

  // Добавляем анимацию SM_Nonius после завершения анимации камеры
  private highlightSpecificMeshes(): void { 
    const meshNames = [
        "SM_0_SpanStructureBeam_1_Armature_R",
        "SM_0_SpanStructureBeam_1_Cable_R",
        //"SM_0_SpanStructureBeam_2_Armature_L",
        //"SM_0_SpanStructureBeam_2_Cable_L"
    ];

    const meshesToHighlight = meshNames
        .map(name => this.scene.getMeshByName(name))
        .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Приводим к типу Mesh

    let isZoomed = false; // Флаг для отслеживания состояния камеры
    const initialCameraPosition = new Vector3(13.7, 6.3, 5.0); // Положение камеры из CreateController
    const targetCameraPosition = new Vector3(12.92, 6.25168, 5.04164); // Целевая позиция камеры

    const initialCaliperPosition = this.handModel?.position.clone() ?? new Vector3(0, 0, 0); // Начальная позиция Caliper
    const targetCaliperPosition = new Vector3(12.4467, 6.24097, 4.97655); // Целевая позиция Caliper

    let isNoniusMoved = false; // Флаг для отслеживания состояния SM_Nonius
    const initialNoniusPosition = new Vector3(-0.03, 0, 0); // Изначальная позиция SM_Nonius
    const targetNoniusPosition = new Vector3(-0.006, 0, 0); // Целевая позиция SM_Nonius

    meshesToHighlight.forEach(mesh => {
        // Добавляем подсветку
        this.highlightLayer.addMesh(mesh, Color3.FromHexString("#00ffd9"));

        // Делаем меш кликабельным
        mesh.isPickable = true;

        // Добавляем обработчик клика на каждый меш
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
                console.log(`${mesh.name} был кликнут!`);

                // Логика перемещения камеры
                const camera = this.scene.activeCamera;
                if (camera && camera instanceof FreeCamera) {
                    const currentCameraPosition = camera.position.clone(); // Текущая позиция камеры
                    const endCameraPosition = isZoomed ? initialCameraPosition : targetCameraPosition;

                    // Если камера уже в целевой позиции, не запускаем анимацию
                    if (currentCameraPosition.equals(endCameraPosition)) return;

                    // Создаем анимацию перемещения камеры
                    const cameraAnimation = new Animation(
                        "cameraMove",
                        "position",
                        30, // Частота кадров анимации
                        Animation.ANIMATIONTYPE_VECTOR3,
                        Animation.ANIMATIONLOOPMODE_CONSTANT
                    );

                    // Ключевые кадры для анимации камеры
                    const cameraKeys = [
                        { frame: 0, value: currentCameraPosition },
                        { frame: 60, value: endCameraPosition }
                    ];

                    cameraAnimation.setKeys(cameraKeys);

                    // Анимация изменения FOV камеры
                    const initialFov = camera.fov; // Начальное значение FOV
                    const targetFov = isZoomed ? 0.8 : 0.4; // Зумированное значение FOV
                    const fovAnimation = new Animation(
                        "fovAnimation",
                        "fov",
                        30, // Частота кадров анимации
                        Animation.ANIMATIONTYPE_FLOAT,
                        Animation.ANIMATIONLOOPMODE_CONSTANT
                    );

                    const fovKeys = [
                        { frame: 0, value: initialFov },
                        { frame: 60, value: targetFov }
                    ];

                    fovAnimation.setKeys(fovKeys);

                    // Применяем анимации
                    camera.animations = [cameraAnimation, fovAnimation];

                    // Начинаем анимацию камеры с запуском анимации SM_Nonius после завершения
                    this.scene.beginAnimation(camera, 0, 60, false, 1, () => {
                        console.log("Анимация камеры завершена.");

                        // Логика перемещения SM_Nonius с анимацией
                        const noniusMesh = this.tools['noniusModel']?.mesh;
                        if (noniusMesh) {
                            const startPosition = isNoniusMoved ? targetNoniusPosition : initialNoniusPosition;
                            const endPosition = isNoniusMoved ? initialNoniusPosition : targetNoniusPosition;

                            this.animateNoniusPosition(noniusMesh, startPosition, endPosition);

                            // Переключаем состояние SM_Nonius
                            isNoniusMoved = !isNoniusMoved;
                        }
                    });
                }

                // Логика перемещения SM_Caliper
                const endCaliperPosition = isZoomed ? initialCaliperPosition : targetCaliperPosition;
                this.moveCaliperWithAnimation(endCaliperPosition);

                // Переключаем состояние камеры
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
