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
  Texture
} from "@babylonjs/core";
import { ExecuteCodeAction } from "@babylonjs/core/Actions";

import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control, Image, Rectangle, ScrollViewer, TextBlock, TextWrapping } from "@babylonjs/gui";
import { TriggerManager2 } from "../FunctionComponents/TriggerManager2";
import { ModelLoader } from "../BaseComponents/ModelLoader";
import { GUIManager } from "../FunctionComponents/GUIManager";
import { DialogPage } from "../FunctionComponents/DialogPage";
import { BabylonUtilities } from "../FunctionComponents/BabylonUtilities";
import { VideoGui } from "../BaseComponents/VideoGui";
import eventEmitter from "../../../EventEmitter";

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
  private currentDialogBox: Rectangle | null = null;   // GUI-контейнер внутри Babylon
  private loadingContainer: HTMLDivElement | null = null; // DOM-элемент <div> c <video>

  private tools: { [key: string]: ToolData } = {};

  // Значения по умолчанию для позиции и ротации перед камерой
  private defaultFrontPosition: Vector3 = new Vector3(0, -0.1, 0.9);
  private defaultFrontRotation: Vector3 = new Vector3(0, Math.PI / 2, 0);

  private isRotating: boolean = false;
  private currentToolName: string | null = null;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // NEW: Флаги, чтобы не запускать одно и то же повторно
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

    this.initializeScene();

    this.CreateController();
    this.utilities.AddScreenshotButton();

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

  CreateController(): void {
    this.camera = new FreeCamera("camera", new Vector3(0, 1.5, 0), this.scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.applyGravity = false;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 0.75, 0.5);
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

  /**
   * Переносим сюда ВСЮ логику загрузки моделей: и "lab", и "dist".
   */
  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();
  
      // 1) Загружаем основную сцену (Lab)
      await this.modelLoader.loadMLabModel();
      const lab = this.modelLoader.getMeshes("lab") || [];

      // Пример работы со светящимися материалами
      const glowLayer = new GlowLayer("glow", this.scene);
      glowLayer.intensity = 1;

      lab.forEach((mesh) => {
        mesh.checkCollisions = false;
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

      // -------------------------------------------
      // ПРАВКИ ДЛЯ ПЕРВОГО ВОПРОСА:
      // Делим логику так, чтобы:
      // - При клике на SM_0_Wall_R отключался SM_0_Tools_Desk
      // - При клике на SM_0_Tools_Desk отключался SM_0_Wall_R
      // - Убираем курсор-«палец» (hoverCursor = "default")
      // -------------------------------------------
      
      // Ищем нужные меши в lab
      const meshWall = lab.find((m) => m.name === "SM_0_Wall_R");
      const meshDesk = lab.find((m) => m.name === "SM_0_Tools_Desk");

      // Настраиваем кликабельность для стены (если найдена)
      if (meshWall) {
        meshWall.isPickable = true;
        meshWall.actionManager = new ActionManager(this.scene);
        meshWall.actionManager.hoverCursor = "default"; // убрать «палец» при наведении

        meshWall.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            // Если уже запущен бетон-триггер - ничего не делаем
            if (this.isBetonTriggered) return;

            // Активируем "бетон"
            this.isBetonTriggered = true;
            this.BetonTrigger(); // запуск вашей логики

            // Отключаем "стол" (чтобы нельзя было кликать)
            if (meshDesk) {
              meshDesk.isPickable = false;   
              meshDesk.actionManager = null; // убираем actionManager
            }
          })
        );
      }

      // Настраиваем кликабельность для стола (если найден)
      if (meshDesk) {
        meshDesk.isPickable = true;
        meshDesk.actionManager = new ActionManager(this.scene);
        meshDesk.actionManager.hoverCursor = "default"; // убрать «палец» при наведении

        meshDesk.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            // Если уже нажимали на стол - ничего не делаем
            if (this.isToolDeskClicked) return;

            this.isToolDeskClicked = true;
            this.initToolHandling(); // запуск вашей логики

            // Отключаем "стену"
            if (meshWall) {
              meshWall.isPickable = false;
              meshWall.actionManager = null;  
            }
          })
        );
      }
      // -------------------------------------------

      console.log("Основные модели (LAB) успешно загружены.");
  
      // 2) Загружаем инструмент dist (rangeC)
      await this.modelLoader.loadRangeCentrModel();
      const dist = this.modelLoader.getMeshes("rangeC") || [];
      dist.forEach((mesh, index) => {
        if (index !== 0) {
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
      const distAbsolutePositions = dist.map((m) => m.getAbsolutePosition().clone());
      const distWorldRotQuats = dist.map((m) => m.rotationQuaternion!.clone());
  
      this.tools["dist"] = {
        meshes: dist,
        originalAbsolutePositions: distAbsolutePositions,
        originalWorldRotationQuaternions: distWorldRotQuats,
        isFront: false,
        onFrontCallback: () => {
          this.guiManager.DeleteDialogBox()
          this.createFileBox()
        },
        frontPosition: new Vector3(-0.3, 0, 0.9),
        frontRotation: new Vector3(Math.PI, Math.PI / 2, 0),
      };
      console.log("Модели 'dist' успешно загружены (CreateEnvironment).");
  
      // 3) Загружаем Rangefinder_LP.glb (раньше это было в BetonTrigger)
      try {
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Rangefinder_LP.glb", this.scene);
        this.rangefinderMeshes = meshes;
        this.rangefinderMeshes.forEach((mesh) => {
          mesh.position = new Vector3(0,-1,0);
        });
        console.log("Rangefinder_LP.glb загружен (CreateEnvironment).");
      } catch (err) {
        console.error("Ошибка при загрузке Rangefinder_LP.glb:", err);
      }
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    } finally {
      this.engine.hideLoadingUI();
    }
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
    this.removeFileBox()
    const startPage = this.dialogPage.addText("Выбирай инструмент, для приближения нажмите на клавиатуре Q/Й");
    const endPage = this.dialogPage.createStartPage("Для завершения нажмите на кнопку", "Завершить", () => {
      const page4 = this.dialogPage.addText("Выбирай инструмент, для приближения нажмите на клавиатуре Q/Й");
      this.guiManager.CreateDialogBox([page4]);
      this.triggerManager.enableCameraMovement();
      this.isToolDeskClicked = false;
      // Удаляем обработчик кликов
      this.scene.onPointerDown = undefined;

      // ------------------------------------------------------
      // Возвращаем стену в кликабельное состояние (если нужно)
      // ------------------------------------------------------
      const labMeshes = this.modelLoader.getMeshes("lab") || [];
      const meshWall = labMeshes.find((m) => m.name === "SM_0_Wall_R");
      if (meshWall) {
        meshWall.isPickable = true;
        meshWall.actionManager = new ActionManager(this.scene);
        meshWall.actionManager.hoverCursor = "default";
        meshWall.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            if (!this.isBetonTriggered) {
              this.isBetonTriggered = true;
              this.BetonTrigger();

              // Отключаем стол
              const meshDesk = labMeshes.find((m) => m.name === "SM_0_Tools_Desk");
              if (meshDesk) {
                meshDesk.isPickable = false;
                meshDesk.actionManager = null;
              }
            }
          })
        );
      }
    });
    this.guiManager.CreateDialogBox([startPage, endPage]);
  }

  private createFileBox(): void {
    // 1) Удаляем старый диалог, если есть
    if (this.currentDialogBox) {
        this.guiTexture.removeControl(this.currentDialogBox);
    }

    // ------------------------
    // 2) Создаем Rectangle-контейнер (справа)
    // ------------------------
    const dialogContainer = new Rectangle("dialogContainer");
    dialogContainer.width = "50%";
    dialogContainer.height = "100%";
    dialogContainer.thickness = 0;
    dialogContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    dialogContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    dialogContainer.top = "0%";
    dialogContainer.left = "3%";
    dialogContainer.zIndex = 1;
    this.guiTexture.addControl(dialogContainer);

    this.currentDialogBox = dialogContainer;

    // ------------------------
    // 3) Фоновое изображение (например, "папка")
    // ------------------------
    const dialogImage = new Image("dialogImage", "/models/filefolder.png");
    dialogImage.width = "100%";
    dialogImage.height = "100%";
    dialogImage.zIndex = 1;
    dialogContainer.addControl(dialogImage);

    // ------------------------
    // 4) Скролл с текстом (пример)
    // ------------------------
    const scrollViewer = new ScrollViewer("dialogScroll");
    scrollViewer.width = "60%";
    scrollViewer.height = "40%";
    scrollViewer.barSize = 7;
    // scrollViewer.background = "red";
    scrollViewer.thickness = 0;
    scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    scrollViewer.left = "2%";
    scrollViewer.top = "5%";
    scrollViewer.zIndex = 2;

    const dialogText = new TextBlock("dialogText");
    dialogText.text = "ЭТО ЖОПАЖОПАЖОПАЖОПАЖОПАЖОПА\nЖОПАЖОПАЖОПАЖОПАЖОПАЖОПАЖОПАЖОПАЖОПА\nЖОПАЖОПАЖОПАЖОПАЖОПАЖОПАЖОПА\nЖОПАЖОПАЖОПА";
    dialogText.color = "#212529";
    dialogText.fontSize = "5%";
    dialogText.fontFamily = "Segoe UI";
    dialogText.resizeToFit = true;
    dialogText.textWrapping = TextWrapping.WordWrap;
    dialogText.width = "100%";
    dialogText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

    scrollViewer.addControl(dialogText);
    dialogContainer.addControl(scrollViewer);

    // ---------------------------------------------------------------------------------------
    // 5) Вместо VideoRect + VideoGui,
    //    вставляем логику, аналогичную LoadingScreen, но под размеры "60% x 40%", bottom=5%, right=3%.
    // ---------------------------------------------------------------------------------------

    // 5.1 Создаём div-контейнер для видео (DOM-элемент), накладываем поверх canvas:
    const loadingContainer = document.createElement("div");
    loadingContainer.style.position = "absolute";
    loadingContainer.style.width = "28%";
    loadingContainer.style.height = "40%";
    loadingContainer.style.bottom = "5%";
    loadingContainer.style.right = "8%";
    loadingContainer.style.zIndex = "100"; // Поверх canvas
    loadingContainer.style.backgroundColor = "black"; // На случай, если видео не заполнит

    document.body.appendChild(loadingContainer);

    // Сохраняем ссылку
    this.loadingContainer = loadingContainer;

    // 5.2 Создаём <video>
    const videoElement = document.createElement("video");
    // Добавим динамический параметр "?v=..." как в LoadingScreen, чтобы кеш не мешал
    videoElement.src = "/models/film_1var_1_2K.mp4" + "?v=" + new Date().getTime();
    videoElement.autoplay = false; // Управляем вручную
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.preload = "auto";

    // Растягиваем на 100% контейнера
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.style.objectFit = "cover";
    videoElement.style.backgroundColor = "black";

    loadingContainer.appendChild(videoElement);

    // 5.3 При окончании видео — убрать
    videoElement.addEventListener("ended", () => {
        videoElement.pause();
        loadingContainer.remove();
    });

    // 5.4 Кнопка "Пропустить"
    const skipButton = document.createElement("button");
    skipButton.textContent = "Пропустить";
    skipButton.style.position = "absolute";
    skipButton.style.bottom = "20px";
    skipButton.style.right = "20px";
    skipButton.style.padding = "10px 20px";
    skipButton.style.fontSize = "16px";
    skipButton.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    skipButton.style.border = "none";
    skipButton.style.cursor = "pointer";
    skipButton.style.borderRadius = "5px";

    loadingContainer.appendChild(skipButton);

    skipButton.addEventListener("click", () => {
        videoElement.pause();
        loadingContainer.remove();
    });

    // 5.5 Наконец, пытаемся запустить видео
    videoElement.play().catch((err) => {
        console.warn("Video can't autoplay (maybe user gesture needed):", err);
    });
  }

  private removeFileBox(): void {
    // 1. Удаляем Babylon GUI-контейнер, если существует
    if (this.currentDialogBox) {
        this.guiTexture.removeControl(this.currentDialogBox); // Убираем из интерфейса
        this.currentDialogBox.dispose();                       // Освобождаем ресурсы GUI
        this.currentDialogBox = null;
    }

    // 2. Удаляем DOM-контейнер (loadingContainer) с видео
    if (this.loadingContainer) {
        // Останавливаем видео на всякий случай
        const video = this.loadingContainer.querySelector("video");
        if (video) {
            (video as HTMLVideoElement).pause();
        }

        // Удаляем сам <div> из документа
        if (this.loadingContainer.parentNode) {
            this.loadingContainer.parentNode.removeChild(this.loadingContainer);
        }
        this.loadingContainer = null;
    }
}


  





  public BetonTrigger(): void {
    // Показываем диалог перед началом
    const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.");
    this.guiManager.CreateDialogBox([page1]);
  
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
    ctx.font = font;
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
  
    console.log("Rangefinder_LP.glb успешно инициализирован в BetonTrigger.");
  
    const page2 = this.dialogPage.addText(
      "Вам нужно измерить длину конструкций... Кликните правой кнопкой, чтобы начать измерение и т.д."
    );
    const page3 = this.dialogPage.addInputGrid("Конструкции", ["Ширина двери", "Высота стола", "Шкаф", "Что-то еще"]);
  
    // Активируем режим измерения
    this.triggerManager.distanceMode();
    this.triggerManager.enableDistanceMeasurement();
  
    // Кнопка "Завершить"
    const page4 = this.dialogPage.createStartPage("Для завершения нажмите на кнопку", "Завершить", () => {
      const page4 = this.dialogPage.addText("Продолжай осмотр, для приближения нажмите на клавиатуре Q/Й");
      this.guiManager.CreateDialogBox([page4]);
      this.triggerManager.disableDistanceMeasurement();
      this.triggerManager.exitDisLaserMode2();
      this.isBetonTriggered = false;
      this.rangefinderMeshes.forEach((mesh) => {
        mesh.position = new Vector3(0, -1, 0);
      });

      // --------------------------------
      // Возвращаем стол обратно в работу
      // --------------------------------
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

              // Отключаем стену
              const meshWall = labMeshes.find((m) => m.name === "SM_0_Wall_R");
              if (meshWall) {
                meshWall.isPickable = false;
                meshWall.actionManager = null;
              }
            }
          })
        );
      }
    });
  
    this.guiManager.CreateDialogBox([page2, page3, page4]);
  }

  async initializeScene(): Promise<void> {
    try {
      await this.CreateEnvironment();
      // По умолчанию (можете менять логику):
      // this.showToolSelectionDialog();
      // Или сразу показывать другой текст, если нужно
      const page4 = this.dialogPage.addText("Сцена загружена. Можете кликать на стену или стол.");
      this.guiManager.CreateDialogBox([page4]);

    } catch (error) {
      console.error("Ошибка при инициализации сцены:", error);
    } finally {
      this.scene.onReadyObservable.add(() => {
        this.engine.hideLoadingUI();
    })
    }
  }

  // Заглушка, чтобы не было ошибок со ссылкой this.textMessages
  private textMessages = {
    showMessage: (msg: string) => {
      console.log("TextMessage:", msg);
    },
  };
}



  
  