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
  
      this.setupWholeMeshes(map);
  
    } catch (error) {
      console.error("Ошибка при загрузке окружения:", error);
    }
  }

  async CreateHandModel(): Promise<void> {
    console.log("Загрузка модели штангенциркуля начата...");
    try {
        // Загрузка модели SM_Caliper.gltf
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_TapeMeasure_LP_MOD_1.gltf", this.scene);

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
            this.handModel.position = new Vector3(13, 6.41004, 4.85);
            this.handModel.scaling = new Vector3(-1.5, -1.5, -1.5);
            this.handModel.rotation = new Vector3(Math.PI / 2, -Math.PI / 2, 0); // 90° по X и -90° по Y
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

// Функция для управления масштабированием дочерних элементов по колесику мыши
enableChildScaling(childMeshes: Mesh[]): void {
  // Добавим обработчик события колесика мыши для независимого масштабирования
  this.scene.onPointerObservable.add((event) => {
      if (event.type === PointerEventTypes.POINTERWHEEL) {
          const wheelEvent = event.event as WheelEvent; // Преобразуем в WheelEvent
          const delta = wheelEvent.deltaY > 0 ? -0.001 : 0.001; // Шаг изменения

          // Проходим по каждому дочернему элементу
          childMeshes.forEach(childMesh => {
              // Обновляем позицию с ограничением для каждого дочернего элемента
              childMesh.position.x = Math.max(-0.16, Math.min(0.16, childMesh.position.x + delta));
              console.log(`Новое значение ${childMesh.name} по оси X:`, childMesh.position.x);
          });
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

}