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
    const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP_MOD_1.gltf", this.scene);
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
            "SM_10cm", 
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
    this.enableMeshMovement(sm_10cm);
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


private enableMeshMovement(sm_10cm: BABYLON.Mesh): void {
  this.originalPosition = sm_10cm.position.clone(); // Запоминаем исходную позицию

  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERPICK) {
      console.log("Клик по сцене, двигаем SM_10cm на 0.05");

      // Анимация движения на фиксированное расстояние (0.05)
      BABYLON.Animation.CreateAndStartAnimation(
        "moveAnimation",
        sm_10cm,
        "position.x",
        60,
        30,
        sm_10cm.position.x,
        this.originalPosition.x + 0.05,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    }
  });

  // Обработчик для ESC (возвращаем обратно)
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      console.log("ESC нажата, возвращаем SM_10cm в исходную позицию");

      BABYLON.Animation.CreateAndStartAnimation(
        "returnAnimation",
        sm_10cm,
        "position.x",
        60,
        30,
        sm_10cm.position.x,
        this.originalPosition.x,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    }
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