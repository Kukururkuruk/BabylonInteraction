import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  AbstractMesh,
  Quaternion,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Ray,
  Tools,
  DirectionalLight,
  ShadowGenerator,
  KeyboardEventTypes,
  PBRMaterial,
  Material,
  GlowLayer,
  SceneLoader,
  DynamicTexture,
  ActionManager,
  VideoTexture,
  Texture,
  Animation
} from "@babylonjs/core";
import { ExecuteCodeAction } from "@babylonjs/core/Actions";

import "@babylonjs/loaders";
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Image,
  Rectangle,
  ScrollViewer,
  TextBlock,
  TextWrapping
} from "@babylonjs/gui";
import { TriggerManager2 } from "../FunctionComponents/TriggerManager2";
import { ModelLoader } from "../BaseComponents/ModelLoader";
import { GUIManager } from "../FunctionComponents/GUIManager";
import { DialogPage } from "../FunctionComponents/DialogPage";
import { BabylonUtilities } from "../FunctionComponents/BabylonUtilities";
import { VideoGui } from "../BaseComponents/VideoGui";
import eventEmitter from "../../../EventEmitter";
import { LabFunManager } from "./LabFunctions/LabFunManager";


interface ZoneData {
  position: Vector3;
  name: string;
  onEnter: () => void;
  onExit: () => void;
}

interface ToolData {
  meshes: AbstractMesh[];
  originalAbsolutePositions: Vector3[];
  originalWorldRotationQuaternions: Quaternion[];
  isFront: boolean;
  onFrontCallback?: () => void;
  frontPosition?: Vector3;
  frontRotation?: Vector3;
}

export class DemoScene {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private modelLoader: ModelLoader;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private utilities: BabylonUtilities;
  private labFunManager: LabFunManager;
  private currentDialogBox: Rectangle | null = null;   // GUI-контейнер внутри Babylon
  private loadingContainer: HTMLDivElement | null = null; // DOM-элемент <div> c <video>
  private zoneData: { [key: string]: ZoneData } = {};

  private tools: { [key: string]: ToolData } = {};

  // Значения по умолчанию для позиции и ротации перед камерой
  private defaultFrontPosition: Vector3 = new Vector3(0, -0.1, 0.9);
  private defaultFrontRotation: Vector3 = new Vector3(0, Math.PI / 2, 0);

  private isRotating: boolean = false;
  private currentToolName: string | null = null;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // Флаги, чтобы не запускать одно и то же повторно
  private isBetonTriggered: boolean = false;       // для SM_0_Wall_R
  private isToolDeskClicked: boolean = false;      // для SM_0_Tools_Desk

  private rangefinderMeshes: AbstractMesh[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.modelLoader = new ModelLoader(this.scene);
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.dialogPage = new DialogPage();
    this.utilities = new BabylonUtilities(this.scene, this.engine, this.guiTexture);
    this.labFunManager = new LabFunManager(this.guiTexture);

    this.initializeScene();

    this.CreateController();
    this.utilities.AddCameraPositionButton();

    // Запуск рендера
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    const light = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), this.scene);
    light.position = new Vector3(-20, 20, 20);
    light.intensity = 2;

    const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

//   CreateController(): void {
//     // Основная камера
//     this.camera = new FreeCamera("camera", new Vector3(0, 1.5, 0), this.scene);
//     this.camera.attachControl(this.canvas, true);
//     this.camera.applyGravity = false;
//     this.camera.checkCollisions = false;
//     this.camera.ellipsoid = new Vector3(0.3, 0.7, 0.3);
//     this.camera.minZ = 0.45;
//     this.camera.speed = 0.55;
//     this.camera.inertia = 0.7;
//     this.camera.angularSensibility = 2000;
//     this.camera.keysUp.push(87); // W
//     this.camera.keysLeft.push(65); // A
//     this.camera.keysDown.push(83); // S
//     this.camera.keysRight.push(68); // D

//     const originalFov = this.camera.fov;
//     let isZoomedIn = false;
//     this.scene.onKeyboardObservable.add((kbInfo) => {
//         if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
//             const key = kbInfo.event.key.toLowerCase();
//             if (/q|й/.test(key)) {
//                 // Переключатель для FOV
//                 if (isZoomedIn) {
//                     this.camera.fov = originalFov;
//                 } else {
//                     this.camera.fov /= 2;
//                 }
//                 isZoomedIn = !isZoomedIn;
//             }
//         }
//     });

//     // Вторая камера
//     const secondaryCamera = new FreeCamera("secondaryCamera", new Vector3(-3.779559965579198, 3.463724273694613, -10.171039255933092), this.scene);
//     secondaryCamera.rotation = new Vector3(1.0622217105770924, -0.7056874750273754, 0);

//     // Устанавливаем вьюпорт для второй камеры
//     secondaryCamera.viewport = new Viewport(0, 0.8, 0.2, 0.2); // Левый верхний угол

//     // Устанавливаем активной камеру для ввода (основная камера)
//     this.scene.activeCameras = [this.camera, secondaryCamera]


// }

  CreateController(): void {
    this.camera = new FreeCamera("camera", new Vector3(0, 1.5, 0), this.scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.3, 0.7, 0.3);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.inertia = 0.7;
    this.camera.angularSensibility = 2000;
    this.camera.keysUp.push(87); // W
    this.camera.keysLeft.push(65); // A
    this.camera.keysDown.push(83); // S
    this.camera.keysRight.push(68); // D

    const originalFov = this.camera.fov;
    let isZoomedIn = false;
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        const key = kbInfo.event.key.toLowerCase();
        if (/q|й/.test(key)) {
          // Переключатель для FOV
          if (isZoomedIn) {
            this.camera.fov = originalFov;
          } else {
            this.camera.fov /= 2;
          }
          isZoomedIn = !isZoomedIn;
        }
      }
    });
  }

  private makeRootFromMeshes(meshes: AbstractMesh[]): AbstractMesh | null {
    if (meshes.length === 0) return null;
    const root = meshes[0];
    for (let i = 1; i < meshes.length; i++) {
      meshes[i].setParent(root);
    }
    return root;
  }

  /**
   * Переносим сюда ВСЮ логику загрузки моделей: и "lab", и "dist".
   */
  public async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();
  
      // Пример добавления направленного света (опционально)
      const light = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), this.scene);
      light.position = new Vector3(-20, 20, 20);
      light.intensity = 0;
  
      // 1) Загружаем ВСЕ нужные модели параллельно (включая Rangefinder_LP)
      await Promise.all([
        this.modelLoader.loadMLabModel(),       // lab окружение
        this.modelLoader.loadRangeCentrModel(), // dist (rangeC)
        this.modelLoader.loadUltraModel(),      // ultra
        this.modelLoader.loadCaliperModel(),    // caliper
        this.modelLoader.loadRulerModel(),      // ruler
        this.modelLoader.loadTapeMeasureModel(),// tape
        this.modelLoader.loadRangeModel()       // Rangefinder_LP (новое)
      ]);
  
      // --- 2) Обрабатываем сцену (lab) ---
      const lab = this.modelLoader.getMeshes("lab") || [];
      const glowLayer = new GlowLayer("glow", this.scene);
      glowLayer.intensity = 1;
  
      lab.forEach((mesh) => {
        mesh.checkCollisions = true;
        // Пример: подсветка конкретного меша (стол)
        if (mesh.name === "SM_0_Tools_Desk" && mesh instanceof Mesh) {
          const material = mesh.material;
          if (material && material instanceof PBRMaterial) {
            material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND;
            material.emissiveColor = new Color3(1, 1, 1);
            material.emissiveIntensity = 2;
  
            if (material.emissiveTexture) {
              glowLayer.addIncludedOnlyMesh(mesh);
            }
          }
        }
      });
  
      // --- 3) Логика кликов по SM_0_Wall_R и SM_0_Tools_Desk ---
      const meshDesk = lab.find((m) => m.name === "SM_0_Tools_Desk");
      const doorMeshes = lab.filter((m) => 
        m.name.startsWith("SM_Door") && !m.name.includes("Handle")
      );
      console.log(doorMeshes);
      

      if (doorMeshes) {
        doorMeshes.forEach((mesh) => {
          mesh.metadata = {
            isOpen: false,
            isAnimating: false
          };
          mesh.isPickable = true;
          mesh.actionManager = new ActionManager(this.scene);
        
          mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              this.toggleDoorState(mesh as AbstractMesh);
            })
          );
        });
      }
  
      if (meshDesk) {
        meshDesk.isPickable = true;
        meshDesk.actionManager = new ActionManager(this.scene);
        meshDesk.actionManager.hoverCursor = "default"; // убираем курсор-палец
  
        meshDesk.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            if (this.isToolDeskClicked) return;
  
            this.isToolDeskClicked = true;
            this.initToolHandling();
          })
        );
      }
  
      console.log("Основные модели (LAB) успешно загружены.");
  
      // --- 4) Создаём "dist" (rangeC) ---
      {
        const distMeshes = this.modelLoader.getMeshes("rangeC") || [];
        distMeshes.forEach((mesh, index) => {
          if (index !== 0) {
            // Ставим примерную позицию, масштаб, поворот
            mesh.scaling = new Vector3(1, 1, 1);
            mesh.position = new Vector3(3.56, 0.95, 1.99);
            mesh.rotation = new Vector3(0, Math.PI, Math.PI / 2);
            if (!mesh.rotationQuaternion) {
              mesh.rotationQuaternion = Quaternion.FromEulerAngles(
                mesh.rotation.x,
                mesh.rotation.y,
                mesh.rotation.z
              );
            }
          }
        });
  
        const distPositions = distMeshes.map((m) => m.getAbsolutePosition().clone());
        const distQuats = distMeshes.map((m) => m.rotationQuaternion?.clone());
        this.tools["dist"] = {
          meshes: distMeshes,
          originalAbsolutePositions: distPositions,
          originalWorldRotationQuaternions: distQuats,
          isFront: false,
          onFrontCallback: () => {
            const text = "Дальномер — измерительный инструмент, предназначенный для определения расстояния до объекта с помощью различных методов измерения, включая лазерные, ультразвуковые или оптические технологии. Широко используется в строительстве, геодезии, военном деле и других сферах.";
            const videoName = "Rangefinder_Preview_1K.mp4";
            this.guiManager.DeleteDialogBox();
            this.labFunManager.createFileBox(text, videoName);
          },
          frontPosition: new Vector3(-0.1, 0, 0.9),
          frontRotation: new Vector3(Math.PI, Math.PI / 2, 0),
        };
        console.log("Модели 'dist' успешно загружены (CreateEnvironment).");
      }
  
      // --- 5) Добавляем остальные инструменты (ultra, caliper, ruler, tape) ---
      //     Они просто лежат на карте полупрозрачными и НЕактивны.
  
      // --------- ULTRA ---------
      {
        const ultraMeshes = this.modelLoader.getMeshes("ultra") || [];
        if (ultraMeshes.length > 0) {
          const ultraRoot = this.makeRootFromMeshes(ultraMeshes);
          if (ultraRoot) {
            ultraRoot.position = new Vector3(-3.71, 0.93, 1.43);
            ultraRoot.rotation = new Vector3(0, Math.PI / 2, Math.PI / 2);
            ultraRoot.scaling = new Vector3(1, -1, 1);
            ultraRoot.getChildMeshes().forEach((m) => {
              m.isPickable = false;
              m.visibility = 0.4; 
            });
          }
        }
      }
  
      // --------- CALIPER ---------
      {
        const caliperMeshes = this.modelLoader.getMeshes("caliper") || [];
        if (caliperMeshes.length > 0) {
          const caliperRoot = this.makeRootFromMeshes(caliperMeshes);
          if (caliperRoot) {
            caliperRoot.position = new Vector3(-3.45, 0.90, 1.64);
            caliperRoot.rotation = new Vector3(Math.PI / 2, 0, 0);
            caliperRoot.scaling = new Vector3(1, -1, 1);
            caliperRoot.getChildMeshes().forEach((m) => {
              m.isPickable = false;
              m.visibility = 0.4; 
            });
          }
        }
      }
  
      // --------- RULER ---------
      {
        const rulerMeshes = this.modelLoader.getMeshes("ruler") || [];
        if (rulerMeshes.length > 0) {
          const rulerRoot = this.makeRootFromMeshes(rulerMeshes);
          if (rulerRoot) {
            rulerRoot.position = new Vector3(-3.71, 0.89, 2.4);
            rulerRoot.rotation = Vector3.Zero();
            rulerRoot.scaling = new Vector3(1, -1, 1);
            rulerRoot.getChildMeshes().forEach((m) => {
              m.isPickable = false;
              m.visibility = 0.4; 
            });
          }
        }
      }
  
      // --------- TAPE ---------
      {
        const tapeMeshes = this.modelLoader.getMeshes("tape") || [];
        if (tapeMeshes.length > 0) {
          const tapeRoot = this.makeRootFromMeshes(tapeMeshes);
          if (tapeRoot) {
            tapeRoot.position = new Vector3(-3.36, 0.90, 2.29);
            tapeRoot.rotation = new Vector3(Math.PI / 2, 0, 0);
            tapeRoot.scaling = new Vector3(1, -1, 1);
            tapeRoot.getChildMeshes().forEach((m, index) => {
              m.isPickable = false;
              m.visibility = 0.5; 
              if (index !== 0 && index !== 11) {
                m.visibility = 0; 
              }
            });
          }
        }
        console.log(tapeMeshes);
      }
  
      // --- 6) Rangefinder_LP уже загружен (т.к. через Promise.all) ---
      //     Достаём меши и расставляем, как нужно
      this.rangefinderMeshes = this.modelLoader.getMeshes("range") || [];
      this.rangefinderMeshes.forEach((mesh) => {
        mesh.position = new Vector3(0, -1, 0);
      });

      // this.modelLoader.addGUIRange(this.camera, this.rangefinderMeshes);
      // this.triggerManager.setRangefinderMesh(this.rangefinderMeshes[1]);

      console.log("Rangefinder_LP.glb загружен (CreateEnvironment).");

      const circle = MeshBuilder.CreateDisc("circle", { radius: 0.2, tessellation: 64 }, this.scene);
      circle.position = new Vector3(-4.087509897212741, 0.02, -5.988414339504485);
      circle.rotation.x = Math.PI / 2; // Повернуть на 90 градусов по оси X
      // Настраиваем материал для круга
      const material = new StandardMaterial("circleMaterial", this.scene);
      material.diffuseColor = new Color3(1, 0, 0); // Красный цвет
      material.specularColor = new Color3(0, 0, 0); // Убираем блики
      circle.material = material;
      // Добавляем ActionManager для обработки кликов
      circle.actionManager = new ActionManager(this.scene);
      circle.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          // Фиксируем положение камеры
            this.camera.position = new Vector3(-4.087509897212741, 1.407, -5.988414339504485);
            // this.camera.attachControl(false); // Отключение управления камерой
            // this.triggerManager.disableCameraMovement()
        })
      );
  
      console.log("Все модели успешно загружены.");
      
      // Создаём зону через отдельный метод
      this.createZoneObj()
      this.setupMultipleZoneTriggers();
      
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  /**
   * Создаёт триггер-зону с координатами x=-3.7919586757716925, y=1.7547360114935204, z=-9.976929779260447 и радиусом 5.
   * При входе в зону выполняется логика, аналогичная клику по meshWall (за исключением вызова toggleDoorState),
   * а при выходе из зоны завершается измерительный режим (код, ранее привязанный к кнопке "Завершить").
   */
  createZoneObj(): void {
    this.zoneData['1'] = {
      position: new Vector3(-4.087509897212741, 1.407, -5.988414339504485),
      name: 'firstZoneSign',
      onEnter: () => {
        if (this.isBetonTriggered) return;
        this.isBetonTriggered = true;

        const page1 = this.dialogPage.addText(
          "Здесь вы можете измерить длину, ширину и высоту этой комнаты (в метрах). Для удобства здесь расположен круг, нажав на который левой кнопкой мыши, вы перенесетесь ровно в центр. Замеры производятся правой кнопкой мыши"
        );
        const page2 = this.dialogPage.addInputGrid1(
          "Конструкции",
          ["Длина комнаты", "Ширина комнаты", "Высота комнаты"],
          [
            { min: 4.9, max: 5.1 }, // диапазон для "Длина комнаты"
            { min: 3.9, max: 3.96}, // диапазон для "Ширина комнаты"
            { min: 3.97, max: 4.01 },  // диапазон для "Высота комнаты"
          ]
        );  
        this.guiManager.CreateDialogBox([page1, page2]);

        this.BetonTrigger();
  
        // Отключаем стол
        const labMeshes = this.modelLoader.getMeshes("lab") || [];
        const meshDesk = labMeshes.find(m => m.name === "SM_0_Tools_Desk");
        if (meshDesk) {
          meshDesk.isPickable = false;
          meshDesk.actionManager = null;
        }
      },

    }
    this.zoneData['2'] = {
      position: new Vector3(-4.087509897212741, 1.407, -9.98841433950448),
      name: 'secondZoneSign',
      onEnter: () => {
        if (this.isBetonTriggered) return;
        this.isBetonTriggered = true;

        const page1 = this.dialogPage.addText(
          "Здесь вы можете увидеть как производтся замер со стороны дальномера. Наведитесь на мишень, начиная слева и запишите длину до мишени"
        );
        const page2 = this.dialogPage.addInputGrid1(
          "Конструкции",
          ["Первая мишень", "Вторая мишень", "Третья мишень"],
          [
            { min: 4.9, max: 5.1 }, // диапазон для "Длина комнаты"
            { min: 3.9, max: 3.96}, // диапазон для "Ширина комнаты"
            { min: 3.97, max: 4.01 },  // диапазон для "Высота комнаты"
          ]
        );  
        this.guiManager.CreateDialogBox([page1, page2]);

        const circle = MeshBuilder.CreateDisc("circle", { radius: 0.2, tessellation: 64 }, this.scene);
        circle.position = new Vector3(-4.087509897212741, 0.02, -9.98841433950448);
        circle.rotation.x = Math.PI / 2; // Повернуть на 90 градусов по оси X
        // Настраиваем материал для круга
        const material = new StandardMaterial("circleMaterial", this.scene);
        material.diffuseColor = new Color3(1, 0, 0); // Красный цвет
        material.specularColor = new Color3(0, 0, 0); // Убираем блики
        circle.material = material;
        // Добавляем ActionManager для обработки кликов
        circle.actionManager = new ActionManager(this.scene);
        circle.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            // Фиксируем положение камеры
              this.camera.position = new Vector3(-4.087509897212741, 1.407, -9.98841433950448);

                    this.rangefinderMeshes.forEach((mesh) => {
                      mesh.scaling = new Vector3(2, 2, -2); // Масштабируем в 3 раза и отражаем по Z
                      mesh.rotation.y = Math.PI / 2;
                      mesh.rotation.z = 0.4;
                
                      // Закрепление модели за камерой
                      mesh.parent = this.camera;
                
                      // Установка позиции относительно камеры
                      const offset = new Vector3(0, -0.4, 0.6); // Настройте значения по необходимости
                      mesh.position = offset;
                      mesh.isVisible = true;
                      
                    });

                    const thirdMesh = this.rangefinderMeshes[2];

                    // Получение размеров меша
                    const boundingInfo = thirdMesh.getBoundingInfo();
                    const boundingBox = boundingInfo.boundingBox;
                    const size = boundingBox.maximum.subtract(boundingBox.minimum);
                    const width = size.z;
                    const height = size.y;
                  
                    // Определение размеров плоскости
                    const planeWidth = width; // Ширина плоскости равна ширине меша
                    const planeHeight = height; // Высота плоскости — 20% от высоты меша (можно настроить по необходимости)
                  
                    // Создание DynamicTexture с достаточным разрешением
                    const dynamicTexture = new DynamicTexture("DynamicTexture", { width: 1024, height: 512 }, this.scene, false);
                    dynamicTexture.hasAlpha = true;
                  
                    // Установка шрифта перед измерением текста
                    const font = "bold 90px Arial";
                    const ctx = dynamicTexture.getContext();
                    ctx.font = font;
                  
                    // Определение максимальной ширины текста с учётом отступов
                    const maxTextWidth = dynamicTexture.getSize().width - 100; // 50 пикселей отступа с каждой стороны
                  
                    // Функция для разбиения текста на строки с учётом символов \n и ширины
                    function wrapText(context, text, maxWidth) {
                        const lines = [];
                        const paragraphs = text.split('\n');
                  
                        paragraphs.forEach(paragraph => {
                            const words = paragraph.split(' ');
                            let currentLine = '';
                  
                            words.forEach(word => {
                                const testLine = currentLine + word + ' ';
                                const metrics = context.measureText(testLine);
                                const testWidth = metrics.width;
                  
                                if (testWidth > maxWidth && currentLine !== '') {
                                    lines.push(currentLine.trim());
                                    currentLine = word + ' ';
                                } else {
                                    currentLine = testLine;
                                }
                            });
                  
                            lines.push(currentLine.trim());
                        });
                  
                        return lines;
                    }
                  
                    // Функция для обновления текста с переносом
                    function updateDynamicText(newText) {
                        ctx.clearRect(0, 0, dynamicTexture.getSize().width, dynamicTexture.getSize().height);
                  
                        // Устанавливаем шрифт
                        ctx.font = font;
                  
                        // Разбиваем текст на строки с учетом \n и ширины
                        const lines = wrapText(ctx, newText, maxTextWidth);
                  
                        // Рисуем каждую строку с увеличивающимся смещением по Y
                        const lineHeight = 90; // Можно настроить в зависимости от шрифта
                        lines.forEach((line, index) => {
                            ctx.fillStyle = "white"; // Цвет текста
                            ctx.fillText(line, 50, 100 + index * lineHeight); // 50 и 100 - отступы от левого и верхнего края
                        });
                  
                        // Обновляем текстуру
                        dynamicTexture.update();
                    }
                  
                    eventEmitter.on("updateDistanceAngleText", (newText) => {
                      if (dynamicTexture) {
                          updateDynamicText(newText);
                      }
                  });
                  
                    // Создание материала для текста
                    const textMaterial = new StandardMaterial("TextMaterial", this.scene);
                    textMaterial.diffuseTexture = dynamicTexture;
                    textMaterial.emissiveColor = new Color3(1, 1, 1); // Делает текст ярким
                    textMaterial.backFaceCulling = false; // Текст виден с обеих сторон
                  
                    // Создание плоскости для текста
                    const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth, height: planeHeight }, this.scene);
                    textPlane.material = textMaterial;
                  
                    // Позиционируем плоскость относительно меша
                    textPlane.parent = thirdMesh;
                    textPlane.rotation.y = -Math.PI / 2;
                  
                    // Компенсируем отражение родителя по оси Z
                    textPlane.scaling = new Vector3(-1, 1, 1);
                  
                    // Устанавливаем позицию
                    textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0); //

                    this.triggerManager.setRangefinderMesh(this.rangefinderMeshes[1]);
                    this.triggerManager.activateLaserMode1()








          })
        );

        // this.BetonTrigger();
  
        // Отключаем стол
        const labMeshes = this.modelLoader.getMeshes("lab") || [];
        const meshDesk = labMeshes.find(m => m.name === "SM_0_Tools_Desk");
        if (meshDesk) {
          meshDesk.isPickable = false;
          meshDesk.actionManager = null;
        }
      }
    }
    this.zoneData['3'] = {
      position: new Vector3(-4.087509897212741, 1.407, -13.98841433950448),
      name: 'thirdZoneSign',
      onEnter: () => {
        if (this.isBetonTriggered) return;
        this.isBetonTriggered = true;
        const enterDialog = this.dialogPage.addText("Измерение начато");
        this.guiManager.CreateDialogBox([enterDialog]);
        this.BetonTrigger();
  
        // Отключаем стол
        const labMeshes = this.modelLoader.getMeshes("lab") || [];
        const meshDesk = labMeshes.find(m => m.name === "SM_0_Tools_Desk");
        if (meshDesk) {
          meshDesk.isPickable = false;
          meshDesk.actionManager = null;
        }
      }
    }

  }

  

  private setupMultipleZoneTriggers(): void {
    Object.keys(this.zoneData).forEach(key => {
      const zone = this.zoneData[key];
  
      this.triggerManager.setupZoneTrigger(
        zone.position,
        // onEnter: вызываем колбэк, заданный для конкретной зоны
        () => {
          zone.onEnter();
        },
        // onExit: оставляем логику из исходного метода
        () => {
          this.isBetonTriggered = false;
          const exitDialog = this.dialogPage.addText("Продолжай осмотр, для приближения нажмите на клавиатуре Q/Й");
          this.guiManager.CreateDialogBox([exitDialog]);
          this.triggerManager.disableDistanceMeasurement();
          this.triggerManager.exitDisLaserMode2();
          this.rangefinderMeshes.forEach((mesh) => {
            mesh.position = new Vector3(0, -1, 0);
          });
  
          const page4 = this.dialogPage.addText("Продолжай осмотр, для приближения нажмите на клавиатуре Q/Й");
          this.guiManager.CreateDialogBox([page4]);
  
          // Возвращаем стол обратно в работу
          const labMeshes = this.modelLoader.getMeshes("lab") || [];
          const meshDesk = labMeshes.find((m) => m.name === "SM_0_Tools_Desk");
          if (meshDesk) {
            meshDesk.isPickable = true;
            meshDesk.actionManager = new ActionManager(this.scene);
            meshDesk.actionManager.hoverCursor = "default";
  
            meshDesk.actionManager.registerAction(
              new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                if (!this.isToolDeskClicked) {
                  this.isToolDeskClicked = true;
                  this.initToolHandling();
                }
              })
            );
          }
        },
        3 // радиус или другая настройка триггера
      );
    });
  }

  /**
   * Метод, который вызывается по клику на SM_0_Tools_Desk.
   * Здесь только регистрируем события onPointerDown / onPointerUp / onPointerMove
   * и используем уже загруженные модели из this.tools.
   */
  private async initToolHandling(): Promise<void> {
    this.triggerManager.disableCameraMovement();
    this.camera.position = new Vector3(-2.0532259325547524, 1.5075, 1.9956260534309331);
    this.camera.rotation = new Vector3(0.1571380321207439, -1.5679675730797253, 0);
    this.showToolSelectionDialog();

    // Регистрируем события мыши onPointerDown, onPointerUp, onPointerMove
    this.scene.onPointerDown = (evt, pickInfo) => {
      // Правая кнопка => перемещаем инструмент
      if (evt.button === 2) {
        if (pickInfo.hit && pickInfo.pickedMesh) {
          const clickedTool = this.getToolNameByMesh(pickInfo.pickedMesh);
          if (clickedTool) {
            // Если уже есть инструмент перед камерой и мы кликаем на другой
            if (this.currentToolName && this.currentToolName !== clickedTool) {
              this.returnCurrentTool();
            }
            this.toggleToolPosition(clickedTool);
          }
        }
      } else if (evt.button === 0) {
        // Левая кнопка => вращаем, если инструмент перед камерой
        if (this.currentToolName && this.tools[this.currentToolName].isFront) {
          this.isRotating = true;
          this.lastPointerX = evt.clientX;
          this.lastPointerY = evt.clientY;
        }
      }
    };

    this.scene.onPointerUp = (evt) => {
      if (evt.button === 0 && this.isRotating) {
        this.isRotating = false;
      }
    };

    this.scene.onPointerMove = (evt) => {
      if (this.isRotating && this.currentToolName) {
        const toolData = this.tools[this.currentToolName];
        if (!toolData.isFront) return;

        const deltaX = evt.clientX - this.lastPointerX;
        const deltaY = evt.clientY - this.lastPointerY;

        this.lastPointerX = evt.clientX;
        this.lastPointerY = evt.clientY;

        const rotationSpeed = 0.005;
        toolData.meshes.forEach((m) => {
          if (!m.rotationQuaternion) {
            m.rotationQuaternion = Quaternion.FromEulerAngles(m.rotation.x, m.rotation.y, m.rotation.z);
          }

          let deltaRotation = Quaternion.RotationYawPitchRoll(deltaX * rotationSpeed, deltaY * rotationSpeed, 0);

          // При зажатом Shift вращаем дополнительно по оси Z
          if (evt.shiftKey) {
            const zRotation = Quaternion.RotationAxis(new Vector3(0, 0, 1), deltaX * rotationSpeed);
            deltaRotation = zRotation.multiply(deltaRotation);
          }

          m.rotationQuaternion = deltaRotation.multiply(m.rotationQuaternion);
        });
      }
    };
  }

  private getToolNameByMesh(mesh: AbstractMesh): string | null {
    for (const toolName in this.tools) {
      if (this.tools[toolName].meshes.includes(mesh)) {
        return toolName;
      }
    }
    return null;
  }

  private returnCurrentTool(): void {
    if (!this.currentToolName) return;
    const toolData = this.tools[this.currentToolName];

    if (toolData.isFront) {
      toolData.meshes.forEach((mesh, index) => {
        mesh.setParent(null);
        mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
        mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
      });

      toolData.isFront = false;
      this.currentToolName = null;
      this.checkAndShowToolSelectionDialog();
    }
  }

  private toggleToolPosition(toolName: string): void {
    const toolData = this.tools[toolName];
    if (!toolData) return;

    toolData.isFront = !toolData.isFront;
    if (toolData.isFront) {
      this.currentToolName = toolName;
      const pos = toolData.frontPosition || this.defaultFrontPosition;
      const rot = toolData.frontRotation || this.defaultFrontRotation;

      toolData.meshes.forEach((mesh) => {
        mesh.setParent(this.camera);
        mesh.position = pos.clone();
        mesh.rotationQuaternion = Quaternion.FromEulerAngles(rot.x, rot.y, rot.z);
      });

      if (toolData.onFrontCallback) {
        toolData.onFrontCallback();
      }
    } else {
      toolData.meshes.forEach((mesh, index) => {
        mesh.setParent(null);
        mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
        mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
      });

      if (this.currentToolName === toolName) {
        this.currentToolName = null;
      }
      this.checkAndShowToolSelectionDialog();
    }
  }

  private checkAndShowToolSelectionDialog(): void {
    if (!this.currentToolName) {
      this.showToolSelectionDialog();
    }
  }

  private showToolSelectionDialog(): void {
    this.labFunManager.removeFileBox();
    const startPage = this.dialogPage.addText("Выбирай инструмент, для приближения нажмите на клавиатуре Q/Й");
    const endPage = this.dialogPage.createStartPage("Для завершения нажмите на кнопку", "Завершить", () => {
      const page4 = this.dialogPage.addText("Выбирай инструмент, для приближения нажмите на клавиатуре Q/Й");
      this.guiManager.CreateDialogBox([page4]);
      this.triggerManager.enableCameraMovement();
      this.isToolDeskClicked = false;
      // Удаляем обработчик кликов
      this.scene.onPointerDown = undefined;

    });
    this.guiManager.CreateDialogBox([startPage, endPage]);
  }

  public BetonTrigger(): void {
  
    if (!this.rangefinderMeshes || this.rangefinderMeshes.length === 0) {
      console.error("RangefinderMeshes не загружены. Проверьте CreateEnvironment().");
      return;
    }
  
    this.rangefinderMeshes.forEach((mesh) => {
      mesh.scaling = new Vector3(3, 3, -3);
      mesh.rotation.y = Math.PI / 3;
      mesh.parent = this.camera;
      const offset = new Vector3(-0.7, -0.5, 1.1);
      mesh.position = offset;
      mesh.renderingGroupId = 1; // отрисовывается после объектов группы 0
    });
  
    const thirdMesh = this.rangefinderMeshes[2];
    const boundingInfo = thirdMesh.getBoundingInfo();
    const boundingBox = boundingInfo.boundingBox;
    const size = boundingBox.maximum.subtract(boundingBox.minimum);
    const width = size.z;
    const height = size.y;
  
    const planeWidth = width;
    const planeHeight = height;
    const dynamicTexture = new DynamicTexture("DynamicTexture", { width: 1024, height: 512 }, this.scene, false);
    dynamicTexture.hasAlpha = true;
  
    const font = "bold 90px Arial";
    const ctx = dynamicTexture.getContext();
    const maxTextWidth = dynamicTexture.getSize().width - 100;
  
    function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
      const lines: string[] = [];
      const paragraphs = text.split("\n");
      paragraphs.forEach((paragraph) => {
        const words = paragraph.split(" ");
        let currentLine = "";
        words.forEach((word) => {
          const testLine = currentLine + word + " ";
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && currentLine !== "") {
            lines.push(currentLine.trim());
            currentLine = word + " ";
          } else {
            currentLine = testLine;
          }
        });
        lines.push(currentLine.trim());
      });
      return lines;
    }
  
    function updateDynamicText(newText: string) {
      ctx.clearRect(0, 0, dynamicTexture.getSize().width, dynamicTexture.getSize().height);
      ctx.font = font;
      const lines = wrapText(ctx, newText, maxTextWidth);
      const lineHeight = 90;
      lines.forEach((line, index) => {
        ctx.fillStyle = "white";
        ctx.fillText(line, 50, 100 + index * lineHeight);
      });
      dynamicTexture.update();
    }
  
    eventEmitter.on("updateTextPlane", (newText: string) => {
      updateDynamicText(newText);
    });
    eventEmitter.on("updateAngleText", (newText: string) => {
      updateDynamicText(newText);
    });
  
    const textMaterial = new StandardMaterial("TextMaterial", this.scene);
    textMaterial.diffuseTexture = dynamicTexture;
    textMaterial.emissiveColor = new Color3(1, 1, 1);
    textMaterial.backFaceCulling = false;
  
    const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth, height: planeHeight }, this.scene);
    textPlane.material = textMaterial;
    textPlane.parent = thirdMesh;
    textPlane.rotation.y = -Math.PI / 2;
    textPlane.scaling = new Vector3(-1, 1, 1);
    textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0);
    textPlane.renderingGroupId = 1;
  
    console.log("Rangefinder_LP.glb успешно инициализирован в BetonTrigger.");
  
    // Активируем режим измерения
    this.triggerManager.distanceMode();
    this.triggerManager.enableDistanceMeasurement();
  
    
  }

  toggleDoorState(doorMesh: AbstractMesh): void {
    const doorState = doorMesh.metadata;
    if (doorState.isAnimating) {
      return;
    }
    if (doorState.isOpen) {
      this.closeDoor(doorMesh);
    } else {
      this.openDoor(doorMesh);
    }
  }
  
  openDoor(doorMesh: AbstractMesh): void {
    // Предполагаем, что для каждой двери в metadata уже заданы флаги isOpen и isAnimating
    const doorState = doorMesh.metadata;
    if (doorState.isAnimating) {
      return;
    }
    doorState.isAnimating = true;
    doorState.isOpen = true;
  
    // Если у меша установлен rotationQuaternion, сбрасываем его, чтобы использовать rotation (Euler)
    doorMesh.rotationQuaternion = null;
  
    // Сохраняем начальное состояние вращения
    const startRotation = doorMesh.rotation.clone();
    // Вычисляем целевое вращение: прибавляем Math.PI/2 к оси Y
    const targetRotation = startRotation.clone();
    targetRotation.y += Math.PI / 2;
  
    // Создаем анимацию для свойства rotation (тип VECTOR3)
    const doorAnimation = new Animation(
      "OpenDoor",
      "rotation",
      30, // FPS
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
  
    // Задаем ключевые кадры
    doorAnimation.setKeys([
      { frame: 0, value: startRotation },
      { frame: 30, value: targetRotation },
    ]);
  
    // Привязываем анимацию к двери
    doorMesh.animations = [doorAnimation];
  
    // Запускаем анимацию
    this.scene.beginAnimation(doorMesh, 0, 30, false, 1, () => {
      doorState.isAnimating = false;
      console.log(`Анимация открытия ${doorMesh.name} завершена.`);
    });
    console.log(`${doorMesh.name} открывается.`);
  }
  
  closeDoor(doorMesh: AbstractMesh): void {
    const doorState = doorMesh.metadata;
    if (doorState.isAnimating) {
      return;
    }
    doorState.isAnimating = true;
    doorState.isOpen = false;
  
    // Сброс rotationQuaternion, чтобы анимация шла по rotation
    doorMesh.rotationQuaternion = null;
  
    // Сохраняем текущее вращение
    const startRotation = doorMesh.rotation.clone();
    // Вычисляем целевое вращение для закрытия (вычитаем Math.PI/2)
    const targetRotation = startRotation.clone();
    targetRotation.y -= Math.PI / 2;
  
    // Создаем анимацию закрытия
    const doorAnimation = new Animation(
      "CloseDoor",
      "rotation",
      30,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
  
    doorAnimation.setKeys([
      { frame: 0, value: startRotation },
      { frame: 30, value: targetRotation },
    ]);
  
    doorMesh.animations = [doorAnimation];
  
    // Запускаем анимацию
    this.scene.beginAnimation(doorMesh, 0, 30, false, 1, () => {
      doorState.isAnimating = false;
      console.log(`Анимация закрытия ${doorMesh.name} завершена.`);
    });
    console.log(`${doorMesh.name} закрывается.`);
  }
  
  



  public async initializeScene(): Promise<void> {
    try {
      await this.CreateEnvironment();
      await this.scene.whenReadyAsync();
      this.engine.hideLoadingUI();
      const page4 = this.dialogPage.addText("Сцена загружена. Можете кликать на стену или стол.");
      this.guiManager.CreateDialogBox([page4]);
    } catch (error) {
      console.error("Ошибка при инициализации сцены:", error);
      this.engine.hideLoadingUI();
    }
  }

  // Заглушка, чтобы не было ошибок со ссылкой this.textMessages
  private textMessages = {
    showMessage: (msg: string) => {
      console.log("TextMessage:", msg);
    },
  };
}
