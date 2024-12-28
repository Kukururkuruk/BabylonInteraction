// import {
//     Scene,
//     Engine,
//     SceneLoader,
//     Vector3,
//     HemisphericLight,
//     HDRCubeTexture,
//     FreeCamera,
//     HighlightLayer,
//     Color3,
//     FreeCameraMouseInput,
//     Mesh,
//     AbstractMesh,
//   } from "@babylonjs/core";
//   import "@babylonjs/loaders";
//   import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
//   import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
//   import { GUIManager } from "./FunctionComponents/GUIManager";
//   import { DialogPage } from "./FunctionComponents/DialogPage";
  
//   export class BookScene {
//     private scene: Scene;
//     private engine: Engine;
//     private canvas: HTMLCanvasElement;
//     private camera: FreeCamera;
//     private guiTexture!: AdvancedDynamicTexture;
//     private triggerManager!: TriggerManager2;
//     private guiManager!: GUIManager;
//     private dialogPage!: DialogPage;
//     private greenHighlightLayer!: HighlightLayer;
//     private blueHighlightLayer!: HighlightLayer;
//     private counterText!: TextBlock;
//     private clickedMeshes: number = 0;
//     private totalMeshes: number = 0;
  
//     // Словарь для сопоставления групп и базовых имен мешей
//     private groupNameToBaseName: { [groupName: string]: string } = {};
  
//     // Сообщения для GUI
//     private readonly textMessages: string[] = [
//       "Чтобы идти вперед нажмите на 'W'",
//       "Чтобы идти назад нажмите на 'S'",
//       "Чтобы идти влево нажмите на 'A'",
//       "Чтобы идти вправо нажмите на 'D'",
//       "А теперь осмотритесь по комнате",
//     ];
  
//     // Списки мешей для обработки
//     private readonly meshGroups = [
//       { groupName: "SpanStructureBeam_L_7", baseName: "SM_0_SpanStructureBeam_L_7" },
//       { groupName: "SpanStructureBeam_L_4", baseName: "SM_0_SpanStructureBeam_L_4" },
//       // Добавьте дополнительные группы по необходимости
//     ];
  
//     private readonly singleMeshNames = [
//       "SM_0_Retaining_wall_Block_LP_L",   // Стена
//       "SM_0_MonolithicRack_R",            // Колонна монолит
//       "SM_0_MonolithicRack_L_Column",     // Колонна
//       "SM_0_MonolithicRack_L_Rostverc",   // Колонна ростверк основание
//       "SM_0_MonolithicRack_L_Support",    // Колонна ригель вверх
//       "SM_0_Stairs",                      // Лестница
//       "SM_0_FencePost_Road.002",          // Барьерное ограждение (тип 1)
//       "SM_0_FencePostBridge_base_.004",   // Барьерное ограждение (тип 2)
//       "SM_0_connectingShaft_1",           // Шов
//       "SM_0_Road_Down.001",               // Дорожное полотно
//       "SM_0_BridgeAsfalt",                // Асфальт на мосту
//       "SM_0_Stand_R",                     // Подферменник
//       "SM_0_Road_1_R",                    // Дорога сверху
//       "SM_ConcreteFence_LP.002",          // Бетонное ограждение по центру (Нью-Джерси)
//       "SM_0_TransitionPlate8M_LP_L_primitive0", // Плита переходная
//       "SM_0_PlotMonolithic",              // Плита над балками
//       "SM_0_SupportLight_LP_Down_L",      // Фонари
//       "SM_0_Landscape_Gravel_LP",         // Водосточный монолит
//       "SM_HalfPipe_LP",                   // Подвесной лоток
//       "SM_ConcreteTray_UP",               // Лоток верхняя часть
//       "SM_ConcreteTelescopicTray",        // Откосной лоток
//       "SM_PipeWater_LP",                  // Водосточная система
//       "SM_GridDrainageSmall_LP",          // Дождеприемник
//       // Добавьте дополнительные одиночные меши по необходимости
//     ];
  
//     // Опциональный обработчик открытия модального окна
//     openModal?: (keyword: string) => void;
  
//     constructor(canvas: HTMLCanvasElement) {
//       this.canvas = canvas;
//       this.engine = new Engine(this.canvas, true);
//       this.scene = this.createScene();
//       this.camera = this.createCamera();
//       this.initializeManagers();
//       this.initializeHighlightLayers();
//       this.runRenderLoop();
//       this.startSceneSetup();
//     }
  
//     private createScene(): Scene {
//       const scene = new Scene(this.engine);
//       scene.gravity = new Vector3(0, -9.81 / 60, 0);
//       scene.collisionsEnabled = true;
  
//       new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  
//       const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
//       scene.environmentTexture = hdrTexture;
//       scene.createDefaultSkybox(hdrTexture, true);
//       scene.environmentIntensity = 0.5;
  
//       return scene;
//     }
  
//     private createCamera(): FreeCamera {
//       const camera = new FreeCamera("camera", new Vector3(35, 3, 0), this.scene);
//       camera.attachControl(this.canvas, true);
//       camera.applyGravity = true;
//       camera.checkCollisions = true;
//       camera.ellipsoid = new Vector3(0.5, 1, 0.5);
//       camera.minZ = 0.45;
//       camera.speed = 0.55;
//       camera.angularSensibility = 4000;
//       camera.rotation.y = -Math.PI / 2;
//       camera.inertia = 0.82;
  
//       // Настройка клавиш управления
//       camera.keysUp.push(87);    // W
//       camera.keysLeft.push(65);  // A
//       camera.keysDown.push(83);  // S
//       camera.keysRight.push(68); // D
  
//       // Настройка управления мышью
//       camera.inputs.removeByType("FreeCameraMouseInput");
//       const customMouseInput = new FreeCameraMouseInput();
//       customMouseInput.buttons = [0]; // Левая кнопка мыши
//       camera.inputs.add(customMouseInput);
  
//       return camera;
//     }
  
//     private initializeManagers(): void {
//       this.guiManager = new GUIManager(this.scene, this.textMessages);
//       this.dialogPage = new DialogPage();
//       this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
//       this.triggerManager = new TriggerManager2(this.scene, this.canvas);
//     }
  
//     private initializeHighlightLayers(): void {
//       this.greenHighlightLayer = new HighlightLayer("greenHL", this.scene);
//       this.blueHighlightLayer = new HighlightLayer("blueHL", this.scene);
//       this.greenHighlightLayer.outerGlow = false;
//       this.blueHighlightLayer.outerGlow = false;
//     }
  
//     private runRenderLoop(): void {
//       this.engine.runRenderLoop(() => {
//         this.scene.render();
//       });
//     }
  
//     private async startSceneSetup(): Promise<void> {
//       await this.playLoadingVideo();
//       this.engine.displayLoadingUI();
  
//       try {
//         await this.loadModels();
//         this.setupMeshesInteraction();
//         this.initializeGUI();
//         this.setupDialogPages();
//       } catch (error) {
//         console.error("Ошибка при загрузке сцены:", error);
//       } finally {
//         this.engine.hideLoadingUI();
//       }
//     }
  
//     private async loadModels(): Promise<void> {
//       // Загрузка основной карты
//       const { meshes: mapMeshes } = await SceneLoader.ImportMeshAsync(
//         "",
//         "./models/",
//         "Map_1_MOD.gltf",
//         this.scene
//       );
  
//       // Загрузка указателя
//       const { meshes: signMeshes } = await SceneLoader.ImportMeshAsync(
//         "",
//         "./models/",
//         "MapPointerSimplev001.glb",
//         this.scene
//       );
  
//       this.setupMapMeshes(mapMeshes);
//       this.setupSignMeshes(signMeshes);
//     }
  
//     private setupMapMeshes(meshes: AbstractMesh[]): void {
//       meshes.forEach((mesh) => {
//         mesh.checkCollisions = true;
//       });
  
//       // Отключение коллизий для определенных мешей
//       const nonCollisionMeshNames = [
//         "SM_ConcreteFence_LP.015",
//         "SM_ConcreteFence_LP.030",
//         "SM_0_FencePost_Road.087",
//         "SM_0_FencePost_Road.088",
//       ];
  
//       nonCollisionMeshNames.forEach((name) => {
//         const mesh = meshes.find((m) => m.name === name);
//         if (mesh) {
//           mesh.visibility = 0.5;
//           mesh.checkCollisions = false;
//         }
//       });
  
//       // Скрытие сломанных мешей
//       meshes
//         .filter((mesh) => mesh.name.toLowerCase().includes("broken"))
//         .forEach((mesh) => (mesh.visibility = 0));
//     }
  
//     private setupSignMeshes(meshes: AbstractMesh[]): void {
//         // Создаем объект группы
//         const group = {
//           meshes: meshes,
//           isClicked: false,
//         };
      
//         group.meshes.forEach((mesh) => {
//           mesh.checkCollisions = false;
//           mesh.position = new Vector3(20, 1, 0);
//           mesh.scaling = new Vector3(3, 3, 3);
//           mesh.rotation.z = Math.PI / 2;
      
//           if (mesh instanceof Mesh) {
//             this.greenHighlightLayer.addMesh(mesh, Color3.Green());
//           }
      
//           // Инициализация метаданных
//           mesh.metadata = { ...mesh.metadata, isClicked: false };
      
//           // Настройка взаимодействия с каждой частью группы
//           this.triggerManager.setupModalInteraction(mesh, () => {
//             if (!group.isClicked) {
//               // Увеличиваем счетчик только при первом клике на группу
//               this.clickedMeshes++;
//               this.updateCounter();
      
//               group.meshes.forEach((part) => {
//                 if (part instanceof Mesh) {
//                   this.greenHighlightLayer.removeMesh(part);
//                   this.blueHighlightLayer.addMesh(part, Color3.Blue());
//                 }
//                 part.metadata.isClicked = true;
//               });
      
//               group.isClicked = true;
//             }
      
//             if (this.openModal) {
//               const keyword = "BRIDGE";
//               this.openModal(keyword);
//             }
//           });
//         });
      
//         // Увеличиваем общее количество мешей для взаимодействия на 1, так как это одна группа
//         this.totalMeshes += 1;
//       }
  
//     private setupMeshesInteraction(): void {
//       // Обработка групп мешей
//       this.meshGroups.forEach((group) => {
//         this.groupNameToBaseName[group.groupName] = group.baseName;
//         const groupMeshes = this.scene.meshes.filter(
//           (mesh) => mesh.name === group.baseName || mesh.name.startsWith(`${group.baseName}`)
//         );
  
//         if (groupMeshes.length > 0) {
//           groupMeshes.forEach((mesh) => {
//             if (mesh instanceof Mesh) {
//               this.greenHighlightLayer.addMesh(mesh, Color3.Green());
//             }
  
//             // Инициализация метаданных
//             mesh.metadata = { ...mesh.metadata, isClicked: false };
//           });
  
//           // Настройка взаимодействия с группой мешей
//           groupMeshes.forEach((mesh) => {
//             this.triggerManager.setupModalInteraction(mesh, () => {
//               this.handleMeshClick(groupMeshes, group.groupName);
//             });
//           });
//         } else {
//           console.warn(`Группа "${group.groupName}" не найдена.`);
//         }
//       });
  
//       // Обработка одиночных мешей
//       this.singleMeshNames.forEach((name) => {
//         const mesh = this.scene.getMeshByName(name);
//         if (mesh) {
//           if (mesh instanceof Mesh) {
//             this.greenHighlightLayer.addMesh(mesh, Color3.Green());
//           }
  
//           // Инициализация метаданных
//           mesh.metadata = { ...mesh.metadata, isClicked: false };
  
//           // Настройка взаимодействия с одиночным мешем
//           this.triggerManager.setupModalInteraction(mesh, () => {
//             this.handleMeshClick([mesh], name);
//           });
//         } else {
//           console.warn(`Меш с именем "${name}" не найден.`);
//         }
//       });
  
//       // Установка общего количества мешей для взаимодействия
//       this.totalMeshes += this.meshGroups.length + this.singleMeshNames.length;
//     }
  
//     private handleMeshClick(meshes: AbstractMesh[], keyword: string): void {
//       const isAlreadyClicked = meshes.every((mesh) => mesh.metadata?.isClicked);
  
//       if (!isAlreadyClicked) {
//         this.clickedMeshes++;
//         this.updateCounter();
  
//         meshes.forEach((mesh) => {
//           if (mesh instanceof Mesh) {
//             this.greenHighlightLayer.removeMesh(mesh);
//             this.blueHighlightLayer.addMesh(mesh, Color3.Blue());
//           }
//           mesh.metadata.isClicked = true;
//         });
//       }
  
//       if (this.openModal) {
//         this.openModal(keyword);
//       }
//     }
  
//     private initializeGUI(): void {
//       this.counterText = new TextBlock();
//       this.counterText.text = this.getCounterText();
//       this.counterText.color = "#212529";
//       this.counterText.fontSize = "2%";
//       this.counterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
//       this.counterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//       this.counterText.paddingRight = "5%";
//       this.counterText.paddingTop = "6%";
//       this.guiTexture.addControl(this.counterText);
//     }
  
//     private updateCounter(): void {
//       this.counterText.text = this.getCounterText();
//     }
  
//     private getCounterText(): string {
//       return `Найдено конструкций ${this.clickedMeshes} из ${this.totalMeshes}`;
//     }
  
//     private setupDialogPages(): void {
//       const page1 = this.dialogPage.addText(
//         "Привет! Вы запустили приложение 'Терминология', но прежде чем начать пройдите обучение по передвижению.\n" +
//           "Для начала кликните мышкой на экран.\n" +
//           "Чтобы осмотреться зажмите левую кнопку мыши.\n" +
//           "А теперь следуйте инструкциям ниже.",
//         async () => {
//           await this.guiManager.createGui();
  
//           const page2 = this.dialogPage.addText(
//             "Нажимая правой кнопкой мыши на подсвеченные объекты, вы можете узнать про них информацию.\n" +
//               "Синим подсвечиваются те, на которые вы уже нажимали.\n" +
//               "В верхней части планшета расположена информация о найденых сооружениях.\n" +
//               "Как только осмотрите все и будете готовы переходить к тестированию нажмите на кнопку 'Вперед' в нижней части планшета."
//           );
  
//           const page3 = this.dialogPage.createStartPage(
//             "Нажмите на кнопку для начала тестирования",
//             "Начать",
//             () => {
//               window.location.href = "/тестирование";
//             }
//           );
  
//           const page4 = this.dialogPage.cluePage(
//             "Управление:\n" +
//               "W - движение вперед\n" +
//               "A - движение влево\n" +
//               "S - движение назад\n" +
//               "D - движение вправо\n" +
//               "Для обзора зажмите левую кнопку мыши и двигайте в нужную сторону"
//           );
  
//           this.guiManager.CreateDialogBox([page2, page3, page4], this.counterText);
//         }
//       );
  
//       this.guiManager.CreateDialogBox([page1], this.counterText);
//     }
  
//     private async playLoadingVideo(): Promise<void> {
//       const videoElement = document.createElement("video");
//       videoElement.src = `/models/film_1var_1_2K.mp4?v=${new Date().getTime()}`;
//       videoElement.autoplay = false;
//       videoElement.muted = true;
//       videoElement.loop = false;
//       videoElement.preload = "auto";
//       videoElement.style.position = "absolute";
//       videoElement.style.top = "0";
//       videoElement.style.left = "0";
//       videoElement.style.width = "100%";
//       videoElement.style.height = "100%";
//       videoElement.style.objectFit = "cover";
//       videoElement.style.backgroundColor = "black";
//       videoElement.style.zIndex = "100";
//       document.body.appendChild(videoElement);
  
//       return new Promise<void>((resolve) => {
//         videoElement.addEventListener("loadeddata", () => {
//           videoElement.play();
//         });
//         videoElement.onended = () => {
//           videoElement.remove();
//           resolve();
//         };
//       });
//     }
//   }


// BookScene.ts
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

      // Устанавливаем флаг, что сцена загружена
      this.isSceneLoaded = true;
    } catch (error) {
      console.error("Ошибка при настройке сцены:", error);
    } finally {
      // Убираем только загрузочный интерфейс движка
      this.engine.hideLoadingUI();

      // Не удаляем загрузочный экран здесь!
      // Загрузочный экран удалится самостоятельно после окончания видео
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
