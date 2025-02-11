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
  private minBoundary: BABYLON.Vector3;
  private maxBoundary: BABYLON.Vector3;
  
  
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
    this.minBoundary = new BABYLON.Vector3(-1.0, 0, 0);  // Примерный минимум по оси X
    this.maxBoundary = new BABYLON.Vector3(1.0, 0, 0);   // Примерный максимум по оси X
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
            const corpMesh = this.scene.getMeshByName("SM_CorpTapeMeasure") as BABYLON.Mesh;


            this.enableChildScaling(corpMesh, childMeshes);

            // Устанавливаем параметры для основной модели
            this.handModel.position = new Vector3(13, 6.41004, 4.95);
            this.handModel.scaling = new Vector3(1, 1, 1);
            this.handModel.rotation = new Vector3(-Math.PI / 2, -Math.PI / 2, 0);
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






private enableChildScaling(corpMesh: BABYLON.Mesh, childMeshes: BABYLON.Mesh[]): void {
  if (!this.minBoundary || !this.maxBoundary) {
    console.error("Границы движения не установлены!");
    return;
  }

  this.scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
      const wheelEvent = event.event as WheelEvent;
      const delta = wheelEvent.deltaY > 0 ? 0.001 : -0.001;

      // Проверка наличия корпуса и его позиции
      if (!corpMesh || !corpMesh.position) {
        console.error("Корпус не найден!");
        return;
      }

      // Вычисление нового значения по оси X для корпуса
      const newPosX = corpMesh.position.x + delta;

      // Проверка на границы движения
      if (newPosX >= this.minBoundary.x && newPosX <= this.maxBoundary.x) {
        corpMesh.position.x = newPosX;
        console.log(`Новое значение по оси X для корпуса: ${corpMesh.position.x}`);
      }

      // Обрабатываем только корпус, не изменяя позиции дочерних мешей
      for (let i = 0; i < childMeshes.length; i++) {
        const childMesh = childMeshes[i];

        if (!childMesh || !childMesh.position) {
          console.error(`Меш ${childMesh ? childMesh.name : 'неизвестен'} не найден или его позиция не доступна`);
          continue;
        }

        const threshold = this.getThresholdForMesh(i);

        if (corpMesh.position.x >= threshold) {
          childMesh.setEnabled(true);  // Делаем видимым
          console.log(`Меш ${childMesh.name} теперь видим`);

          // Убираем родителя, чтобы дочерний меш не двигался
          childMesh.setParent(null);
        }
      }
    }
  });
}

private getThresholdForMesh(index: number): number {
  switch (index) {
    case 0: return 0.01;
case 1: return 0.11;
case 2: return 0.21;
case 3: return 0.31;
case 4: return 0.41;
case 5: return 0.51;
case 6: return 0.61;
case 7: return 0.71;
case 8: return 0.81;
case 9: return 0.91;
case 10: return 1.01;
    default: return 0;
  }
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