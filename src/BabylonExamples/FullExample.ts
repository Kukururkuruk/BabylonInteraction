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
  Quaternion
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
      this.setupBrokenMeshes(map);
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

            // Ищем дочерний элемент SM_Nonius
            const noniusMesh = meshes.find(mesh => mesh.name === "SM_Nonius") as Mesh;

            if (!noniusMesh) {
                console.warn("Ошибка: дочерний элемент SM_Nonius не найден.");
            } else {
                console.log("Дочерний элемент SM_Nonius найден:", noniusMesh);

                // Устанавливаем параметры для SM_Nonius
                noniusMesh.position = new Vector3(0.01, 0, 0); // Смещение по оси X на 5 единиц
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
            }

            // Устанавливаем параметры для основной модели
            this.handModel.position = new Vector3(13.2, 6.29004, 4.66996);
            this.handModel.scaling = new Vector3(1.5, 1.5, 1.5);
            this.handModel.rotation = new Vector3(0, -Math.PI / 2, 3 * -Math.PI / 2);
            this.handModel.isVisible = true;

            console.log("Модель штангенциркуля загружена и параметры установлены.");
        } else {
            console.error("Ошибка: модель штангенциркуля не найдена в файле.");
        }
    } catch (error) {
        console.error("Ошибка при загрузке модели штангенциркуля:", error);
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
  
    let isZoomed = false; // Флаг для отслеживания состояния камеры
    const initialPosition = new Vector3(13.7, 6.3, 5.0); // Положение камеры из CreateController
    const targetPosition = new Vector3(12.92, 6.25168, 5.04164); // Целевая позиция камеры
  
    meshesToHighlight.forEach(mesh => {
      // Добавляем подсветку
      this.highlightLayer.addMesh(mesh, Color3.FromHexString("#FF0000"));
  
      // Делаем меш кликабельным
      mesh.isPickable = true;
  
      // Добавляем обработчик клика на каждый меш
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => {
          console.log(`${mesh.name} был кликнут!`);
  
          // Получаем активную камеру
          const camera = this.scene.activeCamera;
          if (camera && camera instanceof FreeCamera) {
            const currentPosition = camera.position.clone(); // Текущая позиция камеры
            const endPosition = isZoomed ? initialPosition : targetPosition; // Определяем конечную позицию
  
            // Если камера уже в целевой позиции, не запускаем анимацию
            if (currentPosition.equals(endPosition)) return;
  
            // Создаем анимацию перемещения камеры
            const animation = new Animation(
              "cameraMove",
              "position",
              30, // Частота кадров анимации
              Animation.ANIMATIONTYPE_VECTOR3,
              Animation.ANIMATIONLOOPMODE_CONSTANT
            );
  
            // Ключевые кадры для анимации
            const keys = [
              { frame: 0, value: currentPosition },  // Начальная позиция камеры
              { frame: 60, value: endPosition }      // Конечная позиция камеры
            ];
  
            animation.setKeys(keys); // Устанавливаем ключевые кадры
  
            // Добавляем анимацию камеры и запускаем
            camera.animations = []; // Сбрасываем предыдущие анимации
            camera.animations.push(animation);
            this.scene.beginAnimation(camera, 0, 60, false); // Запускаем анимацию
  
            // Переключаем состояние
            isZoomed = !isZoomed;
          }
        }
      ));
    });
  }
  
  
  


  

  
  
  // Метод для настройки мешей типа "broken" с точками и действиями
  private setupBrokenMeshes(mapMeshes: AbstractMesh[]): void {
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
