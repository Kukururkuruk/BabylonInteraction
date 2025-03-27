import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  AbstractMesh
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { ModelLoader } from "./BaseComponents/ModelLoader";

export class DistanceScene {
  scene: Scene;
  engine: Engine;
  canvas: HTMLCanvasElement;
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private modelLoader: ModelLoader;
  private rangefinderMeshes: AbstractMesh[];
  private zoneTriggered: boolean = false;
  private textMessages: string[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    // Создаём сцену, UI, менеджеры и загрузчик моделей
    this.scene = this.CreateScene();
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);
    this.modelLoader = new ModelLoader(this.scene);

    // Инициализируем сцену (загружаем модели)
    this.initializeScene().then(() => {
      // После загрузки моделей скрываем loading UI...
      this.engine.hideLoadingUI();
      // ...и теперь можно запускать логику триггера
      this.DistanceTrigger();
    });

    this.CreateController();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    this.camera = new FreeCamera("camera", new Vector3(-8.622, 9.5, -3.62), this.scene);
    this.camera.attachControl(this.canvas, true);

    this.camera.applyGravity = false;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.01;
    this.camera.inertia = 0.01;
    this.camera.angularSensibility = 250;
    this.camera.rotation.y = -Math.PI / 2;
    this.camera.rotation.x = Math.PI / 12;
    this.camera.keysUp.push(87);    // W
    this.camera.keysLeft.push(65);  // A
    this.camera.keysDown.push(83);  // S
    this.camera.keysRight.push(68); // D
  }

  /**
   * initializeScene загружает модели и окружение.
   * Здесь не происходит запуск логики (например, триггеров) – только загрузка.
   */
  public async initializeScene(): Promise<void> {
    try {
      await this.CreateEnvironment();
      // При необходимости можно добавить небольшую задержку:
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Ошибка при инициализации сцены:", error);
    }
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      // Загружаем модель карты
      const { meshes } = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Map_Rangefinder_MOD.gltf",
        this.scene
      );

      // Загружаем модель дальномера
      await this.modelLoader.loadRangeModel();
      this.rangefinderMeshes = this.modelLoader.getMeshes("range") || [];
      // Изначально делаем дальномер невидимым
      this.rangefinderMeshes.forEach((mesh) => {
        mesh.isVisible = false;
      });
      console.log("Rangefinder meshes:", this.rangefinderMeshes);

      // Добавляем GUI для дальномера (если необходимо)
      await this.modelLoader.addGUIRange(this.camera, this.rangefinderMeshes);
      // Передаём один из мешей в триггерный менеджер
      this.triggerManager.setRangefinderMesh(this.rangefinderMeshes[1]);

      // Отключаем коллизии для всех мешей карты
      meshes.forEach((mesh) => {
        mesh.checkCollisions = false;
      });

      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  /**
   * DistanceTrigger – логика работы триггера для дальномера.
   * Этот метод вызывается уже после загрузки моделей (из конструктора).
   */
  DistanceTrigger(): void {
    const clickableWords = [
      {
        word: "здесь",
        imageUrl: "../models/image2.png",
        top: "110px",
        left: "110px",
        width: "50px"
      },
      {
        word: "схеме",
        imageUrl: "../models/image1.png",
        top: "189px",
        left: "260px",
        width: "50px"
      }
    ];

    const clickablImage = [
      {
        thumbnailUrl: "../models/image2.png",
        fullImageUrl: "../models/image2.png",
        name: "Схема",
      },
      {
        thumbnailUrl: "../models/rangeFixStydy.jpg",
        fullImageUrl: "../models/rangeFixStydy.jpg",
        name: "Способ измерения",
      },

    ];

    const clickablVideo = [
      {
        thumbnailUrl: "../models/image2.png",
        videoUrl: "../models/Rangefinder_Preview_1K.mp4",
        name: "Принцип работы",
      },
    ];

    const firstZonePosition = new Vector3(-10.622, 8.8, -3.6);
    const firstTriggerZone = this.triggerManager.setupZoneTrigger(
      firstZonePosition,
      () => {
        if (!this.zoneTriggered) {
          this.zoneTriggered = true;
          this.triggerManager.disableCameraMovement();

          const page1 = this.dialogPage.addClickableWordsPage(
            "Перед вами Дальномер – Leica Disto D510, с его параметрами можно ознакомиться в модуле «Оборудование». Принцип работы показан в видеоролике.  . Краткое описание функционала кнопок прибора показано на схеме  . Так же ознакомтесь со схемой   барьерного ограждения. Для использования навигации в планшете с подсказками нажмите кнопку вперед для продолжения. Или назад, для повторного ознакомления с предыдущей страницей.",
            [
                { word: "видеоролике", videoUrl: "../models/Rangefinder_Preview_1K.mp4", top: "30%", left: "53%", width: "35%" },
                { word: "схеме", imageUrl: "../models/rangeStudy.png", top: "48%", left: "0.1%", width: "17%" },
                { word: "схемой", imageUrl: "../models/barierStudy.png", top: "54%", left: "0.1%", width: "20%" }
            ],
            this.guiTexture,
            this.camera // Передаем камеру для видео
          );

          const pageZoomable = this.dialogPage.addZoomableImagePage(clickablImage, this.guiTexture, "На картинках изображены схема текущего барьерного ограждения и способ измерения ширины проезжей части, для ознакомления с конструкцией. Для правильного измерения ширины проезда необходимо расположить дальномер в самой выпирающей части барьерного ограждения, согласно схемы, это нижняя секция балки. Измерения необходимо производить до противоположной нижней секции балки барьерного ограждения под максимально прямым углом.");


          this.guiManager.CreateDialogBox([page1, pageZoomable]);

          const targetPosition = firstTriggerZone.getInteractionZone().getAbsolutePosition();
          this.triggerManager.setCameraPositionAndTarget(
            Math.PI,
            2,
            Math.PI / 6,
            1,
            targetPosition,
            new Vector3(-10.697, 7.894, -4.887),
            new Vector3(-0.098, -0.951, 0)
          );
          this.triggerManager.createRadioButtons(() => {
            this.rangefinderMeshes.forEach((mesh) => {
              mesh.isVisible = true;
            });
            this.triggerManager.setCameraPositionAndTarget(
              Math.PI / 2,
              -1,
              -0.05,
              -0.47,
              new Vector3(-11, 8.8, -3.56)
            );
            this.triggerManager.enableCameraMovement();
            this.triggerManager.activateLaserMode();
            const page3 = this.dialogPage.createNumericInputPage("Для управления камерой используйте мышь. Зажмите левую кнопку мыши и двигайте в нужном направлении. Выберите максимально прямой угол для измерения. Полученный результат запишите в поле ниже и нажмите кнопку проверить. Чтобы приблизить или отдалить камеру нажмите Q/Й", "Штрина проезжей части", 11.10,11.15,() => {

              this.triggerManager.disableCameraMovement();
      
              this.scene.render();
            const page4 = this.dialogPage.createStartPage("Хорошая работа, а теперь нажми на кнопку для перехода на основную карту", "Перейти", () => {
              window.location.href = '/ВыборИнструмента';
            })
            this.guiManager.CreateDialogBox([page4])
          })
          this.guiManager.CreateDialogBox([page3])
          });
        }
      },
      undefined, // onExitZone (если требуется)
      3          // camSize
    );
  }
}
