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
    //this.highlightLayer = new HighlightLayer("hl1", this.scene);
   // this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение
    //this.highlightLayer.outerGlow = true; // Включаем внешнее свечение
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
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_TapeMeasure_Caliper_MOD.gltf", this.scene);
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
        "SM_0_SpanStructureBeam_1_Armature_R_8",  // Основной меш для клика
        "SM_0_SpanStructureBeam_1_Armature_R_3",  // Дополнительный меш для подсветки
        "SM_0_SpanStructureBeam_1_Cable_R",      // Добавлен сюда
    ];

    const meshesToHighlight = meshNames
        .map(name => this.scene.getMeshByName(name))
        .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Убеждаемся, что это Mesh

    let isZoomed = false; // Флаг для отслеживания состояния камеры
    const initialCameraPosition = new Vector3(13.7, 6.3, 5.0);
    const targetCameraPosition = new Vector3(12.92, 6.25168, 5.04164);

    const initialCaliperPosition = this.handModel?.position.clone() ?? new Vector3(0, 0, 0);
    const targetCaliperPosition = new Vector3(12.444, 6.2437, 4.97655);

    let isNoniusMoved = false; // Флаг для отслеживания состояния SM_Nonius
    const initialNoniusPosition = new Vector3(-0.03, 0, 0);
    const targetNoniusPosition = new Vector3(-0.004, 0, 0);

    let isFirstClick = true; // Флаг для отслеживания первого клика на "SM_0_SpanStructureBeam_1_Armature_R_8"
    let isHighlighted = true; // Флаг для отслеживания состояния подсветки (включаем по умолчанию)

    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение

    // Включаем подсветку на "SM_0_SpanStructureBeam_1_Armature_R_8" изначально
    meshesToHighlight.forEach(mesh => {
        this.highlightLayer.addMesh(mesh, Color3.FromHexString("#00ffd9"));
    });

    // Создаем меши для подсветки SM_0_SpanStructureBeam_1_Cable_R и SM_0_SpanStructureBeam_1_Armature_R_3
    const cableMesh = this.scene.getMeshByName("SM_0_SpanStructureBeam_1_Cable_R") as Mesh | null;
    const armatureMesh = this.scene.getMeshByName("SM_0_SpanStructureBeam_1_Armature_R_3") as Mesh | null;

    if (cableMesh) {
        this.highlightLayer.removeMesh(cableMesh); // Изначально подсветка выключена
    }

    if (armatureMesh) {
        this.highlightLayer.removeMesh(armatureMesh); // Изначально подсветка выключена
    }

    meshesToHighlight.forEach(mesh => {
        mesh.isPickable = true;

        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
                console.log(`${mesh.name} был кликнут!`);

                // Проверка, кликнули ли на основной меш "SM_0_SpanStructureBeam_1_Armature_R_8"
                if (mesh.name === "SM_0_SpanStructureBeam_1_Armature_R_8") {
                    if (isFirstClick) {
                        // Первый клик на "SM_0_SpanStructureBeam_1_Armature_R_8" - оставляем подсветку включенной
                        isFirstClick = false; // Устанавливаем флаг, что клик был совершен

                        // Подсветка продолжает оставаться включенной
                        isHighlighted = true;
                    } else {
                        // Повторный клик на "SM_0_SpanStructureBeam_1_Armature_R_8" - выключаем подсветку на нем
                        if (isHighlighted) {
                            this.highlightLayer.removeMesh(mesh); // Убираем подсветку с этого меша
                            isHighlighted = false; // Подсветка выключена
                        }

                        // Включаем подсветку на "SM_0_SpanStructureBeam_1_Cable_R"
                        if (cableMesh) {
                            this.highlightLayer.addMesh(cableMesh, Color3.FromHexString("#00ffd9"));
                        }

                        // Включаем подсветку на "SM_0_SpanStructureBeam_1_Armature_R_3"
                        if (armatureMesh) {
                            this.highlightLayer.addMesh(armatureMesh, Color3.FromHexString("#00ffd9"));
                        }
                    }
                }

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



// Функция для управления кликабельностью мешей
private toggleMeshPickability(isPickable: boolean): void {
    const meshesToChange = [
        "SM_0_SpanStructureBeam_1_Armature_R_3",  // Меши, для которых нужно изменить кликабельность
        "SM_0_SpanStructureBeam_1_Cable_R"
    ];

    meshesToChange.forEach(name => {
        const mesh = this.scene.getMeshByName(name);
        if (mesh) {
            mesh.isPickable = isPickable;
        }
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


  let isFirstClick = true; // Флаг для отслеживания первого клика
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
      //this.highlightLayer.addMesh(mesh, Color3.FromHexString("#00ffd9"));

      mesh.isPickable = true;

      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(new ExecuteCodeAction(
          ActionManager.OnPickTrigger,
          () => {
              console.log(`${mesh.name} был кликнут!`);


              if (mesh.name === "SM_0_SpanStructureBeam_1_Cable_R") {
                if (isFirstClick) {
                    // Первый клик на "SM_0_SpanStructureBeam_1_Cable_R" - делаем другие меши неактивными
                    this.toggleMeshPickabilityCable_R(false);
                    isFirstClick = false; // Устанавливаем флаг, что клик был совершен
                } else {
                    // Повторный клик на "SM_0_SpanStructureBeam_1_Cable_R" - возвращаем кликабельность
                    this.toggleMeshPickabilityCable_R(true);
                    isFirstClick = true; // Возвращаем флаг в исходное состояние
                }
            }

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

private toggleMeshPickabilityCable_R(isPickable: boolean): void {
  const meshesToChange = [
      "SM_0_SpanStructureBeam_1_Armature_R_8",  
        "SM_0_SpanStructureBeam_1_Armature_R_3",  

  ];

  meshesToChange.forEach(name => {
      const mesh = this.scene.getMeshByName(name);
      if (mesh) {
          mesh.isPickable = isPickable;
      }
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
    const targetCameraPosition = new Vector3(12.92, 6.25168, 5.04164);

    const initialCaliperPosition = this.handModel?.position.clone() ?? new Vector3(0, 0, 0);
    const targetCaliperPosition = new Vector3(12.444, 6.3068, 5.06); // Новая позиция

    let isNoniusMoved = false; // Флаг для отслеживания состояния SM_Nonius
    const initialNoniusPosition = new Vector3(-0.03, 0, 0);
    const targetNoniusPosition = new Vector3(-0.004, 0, 0);


    let isFirstClick = true; // Флаг для отслеживания первого клика
    meshesToHighlight.forEach(mesh => {
        //this.highlightLayer.addMesh(mesh, Color3.FromHexString("#00ffd9"));

        mesh.isPickable = true;

        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
                console.log(`${mesh.name} был кликнут!`);


                if (mesh.name === "SM_0_SpanStructureBeam_1_Armature_R_3") {
                  if (isFirstClick) {
                      // Первый клик на "SM_0_SpanStructureBeam_1_Armature_R_3" - делаем другие меши неактивными
                      this.toggleMeshPickabilityArmature_R_3(false);
                      isFirstClick = false; // Устанавливаем флаг, что клик был совершен
                  } else {
                      // Повторный клик на "SM_0_SpanStructureBeam_1_Armature_R_3" - возвращаем кликабельность
                      this.toggleMeshPickabilityArmature_R_3(true);
                      isFirstClick = true; // Возвращаем флаг в исходное состояние
                  }
              }

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

private toggleMeshPickabilityArmature_R_3(isPickable: boolean): void {
  const meshesToChange = [
      "SM_0_SpanStructureBeam_1_Armature_R_8",  
        "SM_0_SpanStructureBeam_1_Cable_R",  

  ];

  meshesToChange.forEach(name => {
      const mesh = this.scene.getMeshByName(name);
      if (mesh) {
          mesh.isPickable = isPickable;
      }
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
  


Page(): void { 
    const page1 = this.dialogPage.addText("Нажми на подсвеченную арматуру для начала измерения.");
    const page1_1 = this.dialogPage.addText("Зажмите деталь между (нижними) губками для наружнего измерения. Для фиксации подвижной рамки необходимо закрутить винт. ");
    const page1_2 = this.dialogPage.addText("Вам необходимо изучить полученные показатели с основной шкалы в мм. Если показатель совпал с нулем на шкале нониуса, то это и есть точная целая цифра размера детали. ");
    const page1_3 = this.dialogPage.addText("Чтобы узнать размер детали с точностью до десятых или сотых мм., необходимо сперва вычислить цену деления нониуса. Она может быть 0,1 мм или 0,05 чаще. ");
    const page1_4 = this.dialogPage.addText("Изучите показатели на подвижной рамке на шкале, которая точно совпадает с риской на основной шкале. ");
    const page1_5 = this.dialogPage.addText("Вам нужно умножить получившиеся значение на цену деления шкалы нониуса (обычно 0,1 или 0,05 мм) и получить десятые или сотые значения.");
    const page1_6 = this.dialogPage.addText("Сложите данные из 3 и 6 пунктов. ");
    const page2 = this.dialogPage.addText("Повторно нажмите на подсвеченную арматуру для окончания замеров. Теперь проведите измерения оставшейся арматуры и внесите данные на следующей странице");
    const page3 = this.dialogPage.addInputFields("Конструкции");
    const page4 = this.dialogPage.addText("Отлично! Вы справились с заданием, теперь перейдите на следующую страницу для заверешения.");

    const endPage = this.dialogPage.createStartPage('Для завершения измерений нажмите на кнопку', 'Завершить', () => {
        const routePage = this.dialogPage.createStartPage(
            "Отлично, а теперь нажмите на кнопку для перемещения на основную карту",
            "Перейти на основную карту",
            () => {
                window.location.href = '/ВыборИнструмента';
            }
        );

        this.guiManager.CreateDialogBox([routePage]);
    });

    this.guiManager.CreateDialogBox([page1, page1_1, page1_2, page1_3, page1_4, page1_5, page1_6, page2, page3, page4, endPage]);
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