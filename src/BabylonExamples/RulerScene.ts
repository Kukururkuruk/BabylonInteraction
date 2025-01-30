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


private startScalingAnimation(childMeshes: BABYLON.Mesh[]): void {
  const firstMesh = childMeshes[0];

  // Печатаем позицию первой модели для отладки
  console.log("Позиция первой модели перед проверкой:", firstMesh.position.x);

  // Изменим проверку позиции на диапазон (например, между -0.1 и 0.1)
  // или же на другие значения в зависимости от ваших требований
  if (firstMesh.position.x >= -0.1 && firstMesh.position.x <= 0.1) {
    console.log("Модель в нужной позиции, запускаем анимацию.");

    // Если модель установлена в нужной позиции, запускаем анимацию
    for (let i = 0; i < childMeshes.length; i++) {
      const childMesh = childMeshes[i];

      // Создаем анимацию для каждого меша
      const animation = new BABYLON.Animation(
        `scaleAnimation_${i}`,
        "position.x", // Анимируем позицию по оси X
        30, // Количество кадров в анимации
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Устанавливаем ключевые кадры
      const keys = [
        { frame: 0, value: childMesh.position.x }, // Начальное положение
        { frame: 30, value: childMesh.position.x + 0.05 } // Конечное положение
      ];
      animation.setKeys(keys);

      // Запускаем анимацию
      childMesh.animations.push(animation);
      this.scene.beginAnimation(childMesh, 0, 30, false);

      console.log(`Запуск анимации для ${childMesh.name}`);
      
    }
  } else {
    console.log("Модель не в нужной позиции, анимация не будет запущена.");
  }
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