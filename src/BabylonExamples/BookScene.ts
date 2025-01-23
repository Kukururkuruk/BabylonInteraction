import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  HighlightLayer,
  Color3,
  Mesh,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { ModelLoader } from "./BaseComponents/ModelLoader";
import { CameraController } from "./BaseComponents/CameraController";
import { LoadingScreen } from "./BaseComponents/LoadingScreen";

export class BookScene {
  private scene: Scene;
  private engine: Engine;
  canvas: HTMLCanvasElement;
  private cameraController: CameraController;
  private guiTexture!: AdvancedDynamicTexture;
  private triggerManager!: TriggerManager2;
  private guiManager!: GUIManager;
  private dialogPage!: DialogPage;
  private greenHighlightLayer!: HighlightLayer;
  private blueHighlightLayer!: HighlightLayer;
  private counterText!: TextBlock;
  private clickedMeshes: number = 0;
  private totalMeshes: number = 0;
  private modelLoader: ModelLoader;
  private loadingScreen: LoadingScreen;
  private isSceneLoaded: boolean = false; // Флаг для отслеживания загрузки сцены

  // Опциональный обработчик открытия модального окна
  openModal?: (keyword: string) => void;

  // Сообщения для GUI
  private readonly textMessages: string[] = [
    "Чтобы идти вперед нажмите на 'W'",
    "Чтобы идти назад нажмите на 'S'",
    "Чтобы идти влево нажмите на 'A'",
    "Чтобы идти вправо нажмите на 'D'",
    "А теперь осмотритесь по комнате",
  ];

  public togglePointerLock(): void {
    this.cameraController.togglePointerLock();
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = this.createScene();

    // Инициализация контроллера камеры
    this.cameraController = new CameraController(this.scene, this.canvas, "complex");

    // Инициализация загрузчика моделей
    this.modelLoader = new ModelLoader(this.scene);

    // Инициализация менеджеров
    this.initializeManagers();

    // Инициализация слоев подсветки
    this.initializeHighlightLayers();

    // Запуск цикла рендеринга
    this.runRenderLoop();

    // Создаем загрузочный экран
    this.loadingScreen = new LoadingScreen();

    // Воспроизводим загрузочное видео
    this.loadingScreen.playLoadingVideo();

    // Запуск настройки сцены
    this.startSceneSetup();
  }

  private createScene(): Scene {
    const scene = new Scene(this.engine);
    scene.gravity = new Vector3(0, -9.81 / 60, 0);
    scene.collisionsEnabled = true;

    // Создание освещения
    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

    // Настройка окружения
    const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  private initializeManagers(): void {
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas);
  }

  private initializeHighlightLayers(): void {
    this.greenHighlightLayer = new HighlightLayer("greenHL", this.scene);
    this.blueHighlightLayer = new HighlightLayer("blueHL", this.scene);
    this.greenHighlightLayer.outerGlow = false;
    this.blueHighlightLayer.outerGlow = false;
  }

  private runRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  private async startSceneSetup(): Promise<void> {
    this.engine.displayLoadingUI();

    try {
      // Загрузка всех моделей
      await this.modelLoader.loadAllModels();

      // Настройка взаимодействия с мешами
      this.setupMeshesInteraction();

      // Инициализация GUI
      this.initializeGUI();

      // Настройка диалоговых окон
      this.setupDialogPages();

      this.guiManager.createBorderBox()

      // Устанавливаем флаг, что сцена загружена
      this.isSceneLoaded = true;
    } catch (error) {
      console.error("Ошибка при настройке сцены:", error);
    } finally {
      // Убираем только загрузочный интерфейс движка
      this.engine.hideLoadingUI();

    }
  }

  private setupMeshesInteraction(): void {
    const mapMeshes = this.modelLoader.getMeshes("map") || [];
    const signMeshes = this.modelLoader.getMeshes("sign") || [];

    // Настройка взаимодействия с указателем
    if (signMeshes.length > 0) {
      const group = {
        meshes: signMeshes,
        isClicked: false,
      };

      group.meshes.forEach((mesh) => {
        mesh.checkCollisions = false;
        mesh.position = new Vector3(20, 1, 0);
        mesh.scaling = new Vector3(3, 3, 3);
        mesh.rotation.z = Math.PI / 2;

        if (mesh instanceof Mesh) {
          this.greenHighlightLayer.addMesh(mesh, Color3.Green());
        }

        mesh.metadata = { ...mesh.metadata, isClicked: false };

        this.triggerManager.setupModalInteraction(mesh, () => {
          if (!group.isClicked) {
            this.clickedMeshes++;
            this.updateCounter();

            group.meshes.forEach((part) => {
              if (part instanceof Mesh) {
                this.greenHighlightLayer.removeMesh(part);
                this.blueHighlightLayer.addMesh(part, Color3.Blue());
              }
              part.metadata.isClicked = true;
            });

            group.isClicked = true;
          }

          if (this.openModal) {
            const keyword = "BRIDGE";
            this.openModal(keyword);
          }
        });
      });

      this.totalMeshes += 1;
    } else {
      console.warn("Меши указателя не найдены.");
    }

    // Обработка групп мешей
    this.modelLoader.meshGroups.forEach((group) => {
      const groupMeshes = mapMeshes.filter(
        (mesh) => mesh.name === group.baseName || mesh.name.startsWith(`${group.baseName}`)
      );

      if (groupMeshes.length > 0) {
        groupMeshes.forEach((mesh) => {
          if (mesh instanceof Mesh) {
            this.greenHighlightLayer.addMesh(mesh, Color3.Green());
          }

          mesh.metadata = { ...mesh.metadata, isClicked: false };
        });

        // Настройка взаимодействия с группой
        groupMeshes.forEach((mesh) => {
          this.triggerManager.setupModalInteraction(mesh, () => {
            this.handleMeshClick(groupMeshes, group.groupName);
          });
        });

        this.totalMeshes += 1;
      } else {
        console.warn(`Группа "${group.groupName}" не найдена.`);
      }
    });

    // Обработка одиночных мешей
    this.modelLoader.singleMeshNames.forEach((name) => {
      const mesh = this.scene.getMeshByName(name);
      if (mesh) {
        if (mesh instanceof Mesh) {
          this.greenHighlightLayer.addMesh(mesh, Color3.Green());
        }

        mesh.metadata = { ...mesh.metadata, isClicked: false };

        this.triggerManager.setupModalInteraction(mesh, () => {
          this.handleMeshClick([mesh], name);
        });

        this.totalMeshes += 1;
      } else {
        console.warn(`Меш с именем "${name}" не найден.`);
      }
    });
  }

  private handleMeshClick(meshes: AbstractMesh[], keyword: string): void {
    const isAlreadyClicked = meshes.every((mesh) => mesh.metadata?.isClicked);

    if (!isAlreadyClicked) {
      this.clickedMeshes++;
      this.updateCounter();

      meshes.forEach((mesh) => {
        if (mesh instanceof Mesh) {
          this.greenHighlightLayer.removeMesh(mesh);
          this.blueHighlightLayer.addMesh(mesh, Color3.Blue());
        }
        mesh.metadata.isClicked = true;
      });
    }

    if (this.openModal) {
      this.openModal(keyword);
    }
  }

  private initializeGUI(): void {
    this.counterText = new TextBlock();
    this.counterText.text = this.getCounterText();
    this.counterText.color = "#212529";
    this.counterText.fontSize = "2%";
    this.counterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.counterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.counterText.paddingRight = "5%";
    this.counterText.paddingTop = "6%";
    this.guiTexture.addControl(this.counterText);
  }

  private updateCounter(): void {
    this.counterText.text = this.getCounterText();
  }

  private getCounterText(): string {
    return `Найдено конструкций ${this.clickedMeshes} из ${this.totalMeshes}`;
  }

  private setupDialogPages(): void {
    const page1 = this.dialogPage.addText(
      "Привет! Вы запустили приложение 'Терминология', но прежде чем начать пройдите обучение по передвижению.\n" +
        "Для начала кликните мышкой на экран.\n" +
        "Чтобы осмотреться зажмите левую кнопку мыши.\n" +
        "А теперь следуйте инструкциям ниже.",
      async () => {
        await this.guiManager.createGui();

        const page2 = this.dialogPage.addText(
          "Нажимая правой кнопкой мыши на подсвеченные объекты, вы можете узнать про них информацию.\n" +
            "Синим подсвечиваются те, на которые вы уже нажимали.\n" +
            "В верхней части планшета расположена информация о найденых сооружениях.\n" +
            "Как только осмотрите все и будете готовы переходить к тестированию нажмите на кнопку 'Вперед' в нижней части планшета."
        );

        const page3 = this.dialogPage.createStartPage(
          "Нажмите на кнопку для начала тестирования",
          "Начать",
          () => {
            window.location.href = "/тестирование";
          }
        );

        const page4 = this.dialogPage.cluePage(
          "Управление:\n" +
            "W - движение вперед\n" +
            "A - движение влево\n" +
            "S - движение назад\n" +
            "D - движение вправо\n" +
            "Для обзора зажмите левую кнопку мыши и двигайте в нужную сторону"
        );

        this.guiManager.CreateDialogBox([page2, page3, page4], this.counterText);
      }
    );

    this.guiManager.CreateDialogBox([page1], this.counterText);
  }
}
