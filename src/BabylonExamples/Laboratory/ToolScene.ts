// import {
//   Scene,
//   Engine,
//   Vector3,
//   HemisphericLight,
//   HDRCubeTexture,
//   FreeCamera,
//   AbstractMesh,
//   Quaternion,
//   Mesh,
//   MeshBuilder,
//   StandardMaterial,
//   Color3,
//   Ray,
//   Tools,
//   DirectionalLight,
//   ShadowGenerator,
//   KeyboardEventTypes,
//   PBRMaterial,
//   Material,
//   GlowLayer
// } from "@babylonjs/core";
// import "@babylonjs/loaders";
// import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
// import { ModelLoader } from "../BaseComponents/ModelLoader";
// import { GUIManager } from "../FunctionComponents/GUIManager";
// import { DialogPage } from "../FunctionComponents/DialogPage";
// import { BabylonUtilities } from "../FunctionComponents/BabylonUtilities"; // путь к файлу

// interface ToolData {
//   meshes: AbstractMesh[],
//   originalAbsolutePositions: Vector3[],
//   originalWorldRotationQuaternions: Quaternion[],
//   isFront: boolean,
//   onFrontCallback?: () => void,
//   frontPosition?: Vector3,
//   frontRotation?: Vector3
// }

// export class ToolScene {
//   scene: Scene;
//   engine: Engine;
//   openModal?: (keyword: string) => void;
//   camera: FreeCamera;
//   private guiTexture: AdvancedDynamicTexture;
//   private modelLoader: ModelLoader;
//   private guiManager: GUIManager;
//   private dialogPage: DialogPage;
//   private utilities: BabylonUtilities

//   private tools: { [key: string]: ToolData } = {};

//   // Значения по умолчанию для позиции и ротации перед камерой
//   private defaultFrontPosition: Vector3 = new Vector3(0, -0.1, 0.9);
//   private defaultFrontRotation: Vector3 = new Vector3(0, Math.PI / 2, 0);

//   private isRotating: boolean = false;
//   private currentToolName: string | null = null;
//   private lastPointerX: number = 0;
//   private lastPointerY: number = 0;

//   constructor(private canvas: HTMLCanvasElement) {
//     this.engine = new Engine(this.canvas, true);
//     this.engine.displayLoadingUI();

//     this.scene = this.CreateScene();
//     this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
//     this.modelLoader = new ModelLoader(this.scene);
//     this.guiManager = new GUIManager(this.scene, this.textMessages);
//     this.dialogPage = new DialogPage();
//     this.utilities = new BabylonUtilities(this.scene, this.engine, this.guiTexture);

//     this.initializeScene();

//     this.CreateController();
//     this.utilities.AddScreenshotButton();
//     // this.utilities.AddCameraPositionButton();
//     // this.utilities.combinedMethod()

//     this.engine.runRenderLoop(() => {
//       this.scene.render();
//     });

//     this.scene.onPointerDown = (evt, pickInfo) => {
//       // Правая кнопка — перемещаем инструмент
//       if (evt.button === 2) {
//         if (pickInfo.hit && pickInfo.pickedMesh) {
//           const clickedTool = this.getToolNameByMesh(pickInfo.pickedMesh);
//           if (clickedTool) {
//             // Если уже есть инструмент перед камерой и мы кликаем на другой
//             if (this.currentToolName && this.currentToolName !== clickedTool) {
//               this.returnCurrentTool();
//             }
//             this.toggleToolPosition(clickedTool);
//           }
//         }
//       } else if (evt.button === 0) {
//         // Левая кнопка — вращаем, если инструмент перед камерой
//         if (this.currentToolName && this.tools[this.currentToolName].isFront) {
//           this.isRotating = true;
//           this.lastPointerX = evt.clientX;
//           this.lastPointerY = evt.clientY;
//         }
//       }
//     };

//     this.scene.onPointerUp = (evt) => {
//       if (evt.button === 0 && this.isRotating) {
//         this.isRotating = false;
//       }
//     };

//     this.scene.onPointerMove = (evt) => {
//       if (this.isRotating && this.currentToolName) {
//         const toolData = this.tools[this.currentToolName];
//         if (!toolData.isFront) return;

//         const deltaX = evt.clientX - this.lastPointerX;
//         const deltaY = evt.clientY - this.lastPointerY;

//         this.lastPointerX = evt.clientX;
//         this.lastPointerY = evt.clientY;

//         const rotationSpeed = 0.005;
//         toolData.meshes.forEach((m) => {
//           if (!m.rotationQuaternion) {
//             m.rotationQuaternion = Quaternion.FromEulerAngles(m.rotation.x, m.rotation.y, m.rotation.z);
//           }

//           let deltaRotation = Quaternion.RotationYawPitchRoll(deltaX * rotationSpeed, deltaY * rotationSpeed, 0);

//           if (evt.shiftKey) {
//             const zRotation = Quaternion.RotationAxis(new Vector3(0,0,1), deltaX * rotationSpeed);
//             deltaRotation = zRotation.multiply(deltaRotation);
//           }

//           m.rotationQuaternion = deltaRotation.multiply(m.rotationQuaternion);
//         });
//       }
//     };
//   }

//   CreateScene(): Scene {
//     const scene = new Scene(this.engine);
//     const framesPerSecond = 60;
//     const gravity = -9.81;
//     scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//     scene.collisionsEnabled = true;

//     const hdrTexture = new HDRCubeTexture("/models/NEW_HDRI_Town_3.HDR", scene, 1024);
//     scene.environmentTexture = hdrTexture;
//     scene.createDefaultSkybox(hdrTexture, true);
//     scene.environmentIntensity = 1;

//     return scene;
//   }

//   CreateController(): void {
//     this.camera = new FreeCamera("camera", new Vector3(-2.0532259325547524, 1.5075, 1.9956260534309331), this.scene);
//     this.camera.rotation = new Vector3(0.1571380321207439, -1.5679675730797253, 0);
//     this.camera.attachControl(this.canvas, true);
//     this.camera.applyGravity = false;
//     this.camera.checkCollisions = true;
//     this.camera.ellipsoid = new Vector3(0.5, 0.75, 0.5);
//     this.camera.minZ = 0.45;
//     this.camera.speed = 0.55;
//     this.camera.inertia = 0.7;
//     this.camera.angularSensibility = 2000;
//     this.camera.keysUp.push(87); // W
//     this.camera.keysLeft.push(65); // A
//     this.camera.keysDown.push(83); // S
//     this.camera.keysRight.push(68); // D
//         const originalFov = this.camera.fov;
//         let isZoomedIn = false;
//         this.scene.onKeyboardObservable.add((kbInfo) => {
//             if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
//               const key = kbInfo.event.key.toLowerCase();
//                 if (/q|й/.test(key)) {
//                     if (isZoomedIn) {
//                         // Если камера уже уменьшена, восстанавливаем оригинальный FOV
//                         this.camera.fov = originalFov;
//                     } else {
//                         // Уменьшаем FOV камеры
//                         this.camera.fov /= 2;
//                     }
//                     // Переключаем флаг
//                     isZoomedIn = !isZoomedIn;
//                 }
//             }
//         });

//   }

//   public async CreateEnvironment(): Promise<void> {
//     try {
//       this.engine.displayLoadingUI();
  
//       const light = new DirectionalLight(
//         "dirLight",
//         new Vector3(-1, -1, -1),
//         this.scene
//       );
//       light.position = new Vector3(-20, 20, 20);
//       light.intensity = 2;
  
//       // Загружаем все модели параллельно
//       await Promise.all([
//         this.modelLoader.loadMLabModel(),
//         this.modelLoader.loadUltraModel(),
//         this.modelLoader.loadRangeCentrModel(),
//         this.modelLoader.loadCaliperModel(),
//         this.modelLoader.loadRulerModel(),
//         this.modelLoader.loadTapeMeasureModel(),
//       ]);
  
//       // ---------------------
//       // 1) Обрабатываем "lab"
//       // ---------------------
//       const lab = this.modelLoader.getMeshes("lab") || [];
//       const glowLayer = new GlowLayer("glow", this.scene);
//       glowLayer.intensity = 1;
  
//       lab.forEach((mesh) => {
//         mesh.checkCollisions = false;
  
//         if (mesh.name === "SM_0_Tools_Desk" && mesh instanceof Mesh) {
//           const material = mesh.material;
  
//           if (material && material instanceof PBRMaterial) {
//             material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND; // Убираем прозрачность
//             material.emissiveColor = new Color3(1, 1, 1);
//             material.emissiveIntensity = 2;
  
//             // Добавляем в glowLayer, если у материала есть Emissive-текстура
//             if (material.emissiveTexture) {
//               glowLayer.addIncludedOnlyMesh(mesh);
//             }
//           }
//         }
//       });
  
//       // ---------------------
//       // 2) Обрабатываем "ultra"
//       // ---------------------
//       const ultra = this.modelLoader.getMeshes("ultra") || [];
//       ultra.forEach((mesh, index) => {
//         if (index !== 0) {
//           mesh.position = new Vector3(3.71, 0.95, 1.43);
//           mesh.rotation = new Vector3(0, 0, Math.PI / 2);
//           if (!mesh.rotationQuaternion) {
//             mesh.rotationQuaternion = Quaternion.FromEulerAngles(
//               mesh.rotation.x,
//               mesh.rotation.y,
//               mesh.rotation.z
//             );
//           }
//         }
//       });
  
//       const ultraAbsolutePositions = ultra.map((m) =>
//         m.getAbsolutePosition().clone()
//       );
//       const ultraWorldRotQuats = ultra.map((m) => m.rotationQuaternion!.clone());
  
//       this.tools["ultra"] = {
//         meshes: ultra,
//         originalAbsolutePositions: ultraAbsolutePositions,
//         originalWorldRotationQuaternions: ultraWorldRotQuats,
//         isFront: false,
//         onFrontCallback: () => {
//           const ultraPage = this.dialogPage.addText("Это вот штука бетономер");
//           this.guiManager.CreateDialogBox([ultraPage]);
//         },
//         frontPosition: new Vector3(0, -0.1, 0.9),
//         frontRotation: new Vector3(Math.PI / 2, 0, 0),
//       };
  
//       // ---------------------
//       // 3) Обрабатываем "dist"
//       // ---------------------
//       const dist = this.modelLoader.getMeshes("rangeC") || [];
//       dist.forEach((mesh, index) => {
//         if (index !== 0) {
//           mesh.scaling = new Vector3(1, 1, 1);
//           mesh.position = new Vector3(3.56, 0.95, 1.99);
//           mesh.rotation = new Vector3(0, Math.PI, Math.PI / 2);
//           if (!mesh.rotationQuaternion) {
//             mesh.rotationQuaternion = Quaternion.FromEulerAngles(
//               mesh.rotation.x,
//               mesh.rotation.y,
//               mesh.rotation.z
//             );
//           }
//         }
//       });
  
//       const distAbsolutePositions = dist.map((m) =>
//         m.getAbsolutePosition().clone()
//       );
//       const distWorldRotQuats = dist.map((m) => m.rotationQuaternion!.clone());
  
//       this.tools["dist"] = {
//         meshes: dist,
//         originalAbsolutePositions: distAbsolutePositions,
//         originalWorldRotationQuaternions: distWorldRotQuats,
//         isFront: false,
//         onFrontCallback: () => {
//           const distPage = this.dialogPage.addText("Это вот штука дальномер");
//           this.guiManager.CreateDialogBox([distPage]);
//         },
//         frontPosition: new Vector3(0, 0, 0.9),
//         frontRotation: new Vector3(Math.PI, Math.PI / 2, 0),
//       };
  
//       // ---------------------
//       // 4) Обрабатываем "caliper" (штангенциркуль)
//       // ---------------------
//       const caliper = this.modelLoader.getMeshes("caliper") || [];
//       caliper.forEach((mesh, index) => {
//         if (index !== 0) {
//           // Устанавливаем позицию по вашим координатам
//           mesh.position = new Vector3(3.45, 0.90, 1.64);
//           // Если надо - масштаб и вращение (пример):
//           mesh.scaling = new Vector3(1, 1, 1);
//           mesh.rotation = new Vector3(Math.PI / 2, 0, 0);
//           if (!mesh.rotationQuaternion) {
//             mesh.rotationQuaternion = Quaternion.FromEulerAngles(
//               mesh.rotation.x,
//               mesh.rotation.y,
//               mesh.rotation.z
//             );
//           }
//         }
//       });
  
//       const caliperPositions = caliper.map((m) => m.getAbsolutePosition().clone());
//       const caliperRotQuats = caliper.map((m) => m.rotationQuaternion!.clone());
  
//       this.tools["caliper"] = {
//         meshes: caliper,
//         originalAbsolutePositions: caliperPositions,
//         originalWorldRotationQuaternions: caliperRotQuats,
//         isFront: false,
//         onFrontCallback: () => {
//           const page = this.dialogPage.addText("Это штангенциркуль");
//           this.guiManager.CreateDialogBox([page]);
//         },
//         frontPosition: new Vector3(0, 0, 0.9),      // Подправите при необходимости
//         frontRotation: new Vector3(Math.PI, Math.PI, 0),        // Тоже подправите при необходимости
//       };
  
//       // ---------------------
//       // 5) Обрабатываем "ruler" (линейка)
//       // ---------------------
//       const ruler = this.modelLoader.getMeshes("ruler") || [];
//       ruler.forEach((mesh, index) => {
//         if (index !== 0) {
//           mesh.position = new Vector3(3.71, 0.89, 2.33);
//           if (!mesh.rotationQuaternion) {
//             mesh.rotationQuaternion = Quaternion.FromEulerAngles(
//               mesh.rotation.x,
//               mesh.rotation.y,
//               mesh.rotation.z
//             );
//           }
//         }
//       });
  
//       const rulerPositions = ruler.map((m) => m.getAbsolutePosition().clone());
//       const rulerRotQuats = ruler.map((m) => m.rotationQuaternion!.clone());
  
//       this.tools["ruler"] = {
//         meshes: ruler,
//         originalAbsolutePositions: rulerPositions,
//         originalWorldRotationQuaternions: rulerRotQuats,
//         isFront: false,
//         onFrontCallback: () => {
//           const page = this.dialogPage.addText("Это линейка");
//           this.guiManager.CreateDialogBox([page]);
//         },
//         frontPosition: new Vector3(0, 0, 0.9),
//         frontRotation: new Vector3(Math.PI / 2, 0, 0),
//       };
  
//       // ---------------------
//       // 6) Обрабатываем "tape" (рулетка)
//       // ---------------------
//       const tape = this.modelLoader.getMeshes("tape") || [];
//       tape.forEach((mesh, index) => {
//         if (index !== 0) {
//           mesh.position = new Vector3(3.36, 0.90, 2.29);
//           mesh.rotation = new Vector3(Math.PI / 2, 0, 0);
//           if (!mesh.rotationQuaternion) {
//             mesh.rotationQuaternion = Quaternion.FromEulerAngles(
//               mesh.rotation.x,
//               mesh.rotation.y,
//               mesh.rotation.z
//             );
//           }
//         }
//       });
  
//       const tapePositions = tape.map((m) => m.getAbsolutePosition().clone());
//       const tapeRotQuats = tape.map((m) => m.rotationQuaternion!.clone());
  
//       this.tools["tape"] = {
//         meshes: tape,
//         originalAbsolutePositions: tapePositions,
//         originalWorldRotationQuaternions: tapeRotQuats,
//         isFront: false,
//         onFrontCallback: () => {
//           const page = this.dialogPage.addText("Это рулетка");
//           this.guiManager.CreateDialogBox([page]);
//         },
//         frontPosition: new Vector3(0, 0, 0.9),
//         frontRotation: new Vector3(Math.PI, 0, 0),
//       };
  
//       console.log("Модели успешно загружены.");
//     } catch (error) {
//       console.error("Ошибка при загрузке моделей:", error);
//     }
//   }
  

//   private getToolNameByMesh(mesh: AbstractMesh): string | null {
//     for (const toolName in this.tools) {
//       if (this.tools[toolName].meshes.includes(mesh)) {
//         return toolName;
//       }
//     }
//     return null;
//   }

//   private returnCurrentTool(): void {
//     if (!this.currentToolName) return;
//     const toolData = this.tools[this.currentToolName];

//     if (toolData.isFront) {
//       this.camera.attachControl(this.canvas, true);

//       toolData.meshes.forEach((mesh, index) => {
//         mesh.setParent(null);
//         mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
//         mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
//       });

//       toolData.isFront = false;
//       this.currentToolName = null;

//       this.checkAndShowToolSelectionDialog();
//     }
//   }

//   private toggleToolPosition(toolName: string): void {
//     const toolData = this.tools[toolName];
//     if (!toolData) return;

//     toolData.isFront = !toolData.isFront;
//     if (toolData.isFront) {
//       this.currentToolName = toolName;
//       this.camera.detachControl();

//       const pos = toolData.frontPosition || this.defaultFrontPosition;
//       const rot = toolData.frontRotation || this.defaultFrontRotation;

//       toolData.meshes.forEach((mesh) => {
//         mesh.setParent(this.camera);
//         mesh.position = pos.clone();
//         mesh.rotationQuaternion = Quaternion.FromEulerAngles(rot.x, rot.y, rot.z);
//       });

//       if (toolData.onFrontCallback) {
//         toolData.onFrontCallback();
//       }

//     } else {
//       this.camera.attachControl(this.canvas, true);

//       toolData.meshes.forEach((mesh, index) => {
//         mesh.setParent(null);
//         mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
//         mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
//       });

//       if (this.currentToolName === toolName) {
//         this.currentToolName = null;
//       }

//       this.checkAndShowToolSelectionDialog();
//     }
//   }

//   private checkAndShowToolSelectionDialog(): void {
//     if (!this.currentToolName) {
//       this.showToolSelectionDialog();
//     }
//   }

//   private showToolSelectionDialog(): void {
//     const startPage = this.dialogPage.addText("Выбирай инструмен, для приближения нажмите на клавиатуре Q/Й");
//     this.guiManager.CreateDialogBox([startPage]);
//   }

//   private async CreateShadows(): Promise<void> {
//     const light = new DirectionalLight(
//       "dirLight",
//       new Vector3(-1, -1, -1),
//       this.scene
//     );
//     light.position = new Vector3(0, 10, 10);
//     light.intensity = 2;
//     // // Здесь можно добавить логику для генерации теней, если требуется
//     const shadowGenerator = new ShadowGenerator(2048, light); // 1024, 2048, 4096, 8192 
//     shadowGenerator.useContactHardeningShadow = true;
//     shadowGenerator.contactHardeningLightSizeUVRatio = 0.05; // Настройте по желанию

//     this.scene.meshes.forEach((mesh) => {
//       mesh.receiveShadows = true;
//       shadowGenerator.addShadowCaster(mesh);
//     })
//   }

//   public async initializeScene(): Promise<void> {
//     try {
//       // 1. Загружаем окружение (модели, свет и т.д.)
//       await this.CreateEnvironment();
  
//       // 2. Если есть метод CreateShadows (или что-то ещё),
//       //    вызывайте тут, если он нужен.
//       // await this.CreateShadows();
  
//       // 3. Дожидаемся, пока сцена действительно будет готова (шейдеры скомпилированы, текстуры загружены).
//       await this.scene.whenReadyAsync();
  
//       // 4. Только теперь скрываем loading UI
//       this.engine.hideLoadingUI();
  
//       // 5. И вызываем дополнительные методы, например диалог выбора инструментов
//       this.showToolSelectionDialog();
  
//     } catch (error) {
//       console.error("Ошибка при инициализации сцены:", error);
  
//       // Если произошла ошибка, то тоже можно спрятать лоадер (если это нужно).
//       this.engine.hideLoadingUI();
//     }
//   }
  


// }


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
  GlowLayer
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { ModelLoader } from "../BaseComponents/ModelLoader";
import { GUIManager } from "../FunctionComponents/GUIManager";
import { DialogPage } from "../FunctionComponents/DialogPage";
import { BabylonUtilities } from "../FunctionComponents/BabylonUtilities"; // путь к файлу

interface ToolData {
  meshes: AbstractMesh[]; // Для удобства храним массив, но фактически будет один root
  originalAbsolutePositions: Vector3[];
  originalWorldRotationQuaternions: Quaternion[];
  isFront: boolean;
  onFrontCallback?: () => void;
  frontPosition?: Vector3;
  frontRotation?: Vector3;
}

export class ToolScene {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private modelLoader: ModelLoader;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private utilities: BabylonUtilities;

  private tools: { [key: string]: ToolData } = {};

  // Значения по умолчанию для позиции и ротации перед камерой
  private defaultFrontPosition: Vector3 = new Vector3(0, -0.1, 0.9);
  private defaultFrontRotation: Vector3 = new Vector3(0, Math.PI / 2, 0);

  private isRotating: boolean = false;
  private currentToolName: string | null = null;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.modelLoader = new ModelLoader(this.scene);
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    this.utilities = new BabylonUtilities(this.scene, this.engine, this.guiTexture);

    // Инициализация всей сцены
    this.initializeScene();

    // Камера, управление и т.д.
    this.CreateController();
    this.utilities.AddScreenshotButton();

    // Рендер-цикл
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Логика нажатия
    this.scene.onPointerDown = (evt, pickInfo) => {
      // Правая кнопка — перемещаем инструмент
      if (evt.button === 2) {
        if (pickInfo.hit && pickInfo.pickedMesh) {
          const clickedTool = this.getToolNameByMesh(pickInfo.pickedMesh);
          if (clickedTool) {
            // Если уже есть инструмент перед камерой и мы кликаем на другой - возвращаем предыдущий
            if (this.currentToolName && this.currentToolName !== clickedTool) {
              this.returnCurrentTool();
            }
            this.toggleToolPosition(clickedTool);
          }
        }
      } else if (evt.button === 0) {
        // Левая кнопка — вращаем, если инструмент перед камерой
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

        // Поскольку в toolData.meshes у нас (по новой логике) будет 1 root-меш,
        // пройдёмся по всем, но фактически там 1.
        toolData.meshes.forEach((m) => {
          if (!m.rotationQuaternion) {
            m.rotationQuaternion = Quaternion.FromEulerAngles(
              m.rotation.x,
              m.rotation.y,
              m.rotation.z
            );
          }

          let deltaRotation = Quaternion.RotationYawPitchRoll(
            deltaX * rotationSpeed,
            deltaY * rotationSpeed,
            0
          );

          if (evt.shiftKey) {
            const zRotation = Quaternion.RotationAxis(
              new Vector3(0, 0, 1),
              deltaX * rotationSpeed
            );
            deltaRotation = zRotation.multiply(deltaRotation);
          }

          m.rotationQuaternion = deltaRotation.multiply(m.rotationQuaternion);
        });
      }
    };
  }

  private textMessages: string[] = []; // если GUIManager требует массив текстовых сообщений

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    const hdrTexture = new HDRCubeTexture("/models/NEW_HDRI_Town_3.HDR", scene, 1024);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 1;

    return scene;
  }

  CreateController(): void {
    this.camera = new FreeCamera(
      "camera",
      new Vector3(-2.0532259325547524, 1.5075, 1.9956260534309331),
      this.scene
    );
    this.camera.rotation = new Vector3(0.1571380321207439, -1.5679675730797253, 0);
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
          if (isZoomedIn) {
            // Если камера уже уменьшена, восстанавливаем оригинальный FOV
            this.camera.fov = originalFov;
          } else {
            // Уменьшаем FOV камеры
            this.camera.fov /= 2;
          }
          isZoomedIn = !isZoomedIn;
        }
      }
    });
  }

  /**
   * Универсальная функция, которая берёт массив meshes[0..n],
   * делает meshes[1..n] дочерними к meshes[0] (root) и
   * возвращает сам root.
   */
  private makeRootFromMeshes(meshes: AbstractMesh[]): AbstractMesh | null {
    if (meshes.length === 0) return null;
    const root = meshes[0];
    for (let i = 1; i < meshes.length; i++) {
      meshes[i].setParent(root);
    }
    return root;
  }

  public async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      const light = new DirectionalLight(
        "dirLight",
        new Vector3(-1, -1, -1),
        this.scene
      );
      light.position = new Vector3(-20, 20, 20);
      light.intensity = 2;

      // 1) Загружаем все модели параллельно
      await Promise.all([
        this.modelLoader.loadMLabModel(),
        this.modelLoader.loadUltraModel(),
        this.modelLoader.loadRangeCentrModel(),
        this.modelLoader.loadCaliperModel(),
        this.modelLoader.loadRulerModel(),
        this.modelLoader.loadTapeMeasureModel(),
      ]);

      // 2) "lab" - это окружение, с ним можно отдельно работать
      const lab = this.modelLoader.getMeshes("lab") || [];
      const glowLayer = new GlowLayer("glow", this.scene);
      glowLayer.intensity = 1;

      lab.forEach((mesh) => {
        mesh.checkCollisions = false;

        // Пример подсветки конкретного меша
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

      // -------------------------------------------------------------------
      // 3) Ниже — инструменты. Для каждого:
      //    a) Берём все меши
      //    b) Делам [1..n] дочерними [0]-му (root)
      //    c) Задаём root позицию/вращение
      //    d) Сохраняем root в this.tools[..].meshes = [root]
      // -------------------------------------------------------------------

      // --------------------- ULTRA ---------------------
      {
        const ultraMeshes = this.modelLoader.getMeshes("ultra") || [];
        if (ultraMeshes.length > 0) {
          // Создаём root (привязываем дочерние)
          const ultraRoot = this.makeRootFromMeshes(ultraMeshes);
          if (ultraRoot) {
            // Ставим начальную позицию / вращение для root
            // (это примерно то, что раньше делалось для index !== 0)
            ultraRoot.position = new Vector3(-3.71, 0.95, 1.43);
            ultraRoot.rotation = new Vector3(0, Math.PI / 2, Math.PI / 2);
            ultraRoot.scaling = new Vector3(1, -1, 1);
            // Убеждаемся, что используется rotationQuaternion
            if (!ultraRoot.rotationQuaternion) {
              ultraRoot.rotationQuaternion = Quaternion.FromEulerAngles(
                ultraRoot.rotation.x,
                ultraRoot.rotation.y,
                ultraRoot.rotation.z
              );
            }

            // Запоминаем
            const originalPos = ultraRoot.getAbsolutePosition().clone();
            const originalRot = ultraRoot.rotationQuaternion.clone();

            this.tools["ultra"] = {
              meshes: [ultraRoot],
              originalAbsolutePositions: [originalPos],
              originalWorldRotationQuaternions: [originalRot],
              isFront: false,
              onFrontCallback: () => {
                const ultraPage = this.dialogPage.addText("Это вот штука бетономер");
                this.guiManager.CreateDialogBox([ultraPage]);
              },
              frontPosition: new Vector3(0, -0.1, 0.9),
              frontRotation: new Vector3(Math.PI, 0, 0),
            };
          }
        }
      }

      // --------------------- DIST (rangeC) ---------------------
      {
        const distMeshes = this.modelLoader.getMeshes("rangeC") || [];
        if (distMeshes.length > 0) {
          const distRoot = this.makeRootFromMeshes(distMeshes);
          if (distRoot) {
            distRoot.position = new Vector3(-3.56, 0.95, 1.99);
            distRoot.rotation = new Vector3(0, Math.PI, Math.PI / 2);
            distRoot.scaling = new Vector3(1, -1, 1);
            if (!distRoot.rotationQuaternion) {
              distRoot.rotationQuaternion = Quaternion.FromEulerAngles(
                distRoot.rotation.x,
                distRoot.rotation.y,
                distRoot.rotation.z
              );
            }
            const originalPos = distRoot.getAbsolutePosition().clone();
            const originalRot = distRoot.rotationQuaternion.clone();

            this.tools["dist"] = {
              meshes: [distRoot],
              originalAbsolutePositions: [originalPos],
              originalWorldRotationQuaternions: [originalRot],
              isFront: false,
              onFrontCallback: () => {
                const distPage = this.dialogPage.addText("Это вот штука дальномер");
                this.guiManager.CreateDialogBox([distPage]);
              },
              frontPosition: new Vector3(0, 0, 0.9),
              frontRotation: new Vector3(Math.PI, Math.PI / 2, 0),
            };
          }
        }
      }

      // --------------------- CALIPER ---------------------
      {
        const caliperMeshes = this.modelLoader.getMeshes("caliper") || [];
        if (caliperMeshes.length > 0) {
          const caliperRoot = this.makeRootFromMeshes(caliperMeshes);
          if (caliperRoot) {
            // Примерно как у вас было
            caliperRoot.position = new Vector3(-3.45, 0.90, 1.64);
            caliperRoot.rotation = new Vector3(Math.PI / 2, 0, 0);
            caliperRoot.scaling = new Vector3(1, -1, 1);
            if (!caliperRoot.rotationQuaternion) {
              caliperRoot.rotationQuaternion = Quaternion.FromEulerAngles(
                caliperRoot.rotation.x,
                caliperRoot.rotation.y,
                caliperRoot.rotation.z
              );
            }
            const originalPos = caliperRoot.getAbsolutePosition().clone();
            const originalRot = caliperRoot.rotationQuaternion.clone();

            this.tools["caliper"] = {
              meshes: [caliperRoot],
              originalAbsolutePositions: [originalPos],
              originalWorldRotationQuaternions: [originalRot],
              isFront: false,
              onFrontCallback: () => {
                const page = this.dialogPage.addText("Это штангенциркуль");
                this.guiManager.CreateDialogBox([page]);
              },
              // frontPosition/Rotation можете подобрать на вкус
              frontPosition: new Vector3(0, 0, 0.9),
              frontRotation: new Vector3(0, 0, Math.PI),
            };
          }
        }
        this.debugToolTransform("caliper", "after loading");
      }

      // --------------------- RULER ---------------------
      {
        const rulerMeshes = this.modelLoader.getMeshes("ruler") || [];
        if (rulerMeshes.length > 0) {
          const rulerRoot = this.makeRootFromMeshes(rulerMeshes);
          if (rulerRoot) {
            rulerRoot.position = new Vector3(-3.71, 0.89, 2.4);
            rulerRoot.rotation = Vector3.Zero(); // К примеру
            rulerRoot.scaling = new Vector3(1, -1, 1);
            if (!rulerRoot.rotationQuaternion) {
              rulerRoot.rotationQuaternion = Quaternion.FromEulerAngles(
                rulerRoot.rotation.x,
                rulerRoot.rotation.y,
                rulerRoot.rotation.z
              );
            }

            const originalPos = rulerRoot.getAbsolutePosition().clone();
            const originalRot = rulerRoot.rotationQuaternion.clone();

            this.tools["ruler"] = {
              meshes: [rulerRoot],
              originalAbsolutePositions: [originalPos],
              originalWorldRotationQuaternions: [originalRot],
              isFront: false,
              onFrontCallback: () => {
                const page = this.dialogPage.addText("Это линейка");
                this.guiManager.CreateDialogBox([page]);
              },
              frontPosition: new Vector3(0, 0, 0.9),
              frontRotation: new Vector3(Math.PI / 2, 0, 0),
            };
          }
        }
      }

      // --------------------- TAPE (рулетка) ---------------------
      {
        const tapeMeshes = this.modelLoader.getMeshes("tape") || [];
        if (tapeMeshes.length > 0) {
          const tapeRoot = this.makeRootFromMeshes(tapeMeshes);
          if (tapeRoot) {
            tapeRoot.position = new Vector3(-3.36, 0.90, 2.29);
            tapeRoot.rotation = new Vector3(Math.PI / 2, 0, 0);
            tapeRoot.scaling = new Vector3(1, -1, 1);
            if (!tapeRoot.rotationQuaternion) {
              tapeRoot.rotationQuaternion = Quaternion.FromEulerAngles(
                tapeRoot.rotation.x,
                tapeRoot.rotation.y,
                tapeRoot.rotation.z
              );
            }

            const originalPos = tapeRoot.getAbsolutePosition().clone();
            const originalRot = tapeRoot.rotationQuaternion.clone();

            this.tools["tape"] = {
              meshes: [tapeRoot],
              originalAbsolutePositions: [originalPos],
              originalWorldRotationQuaternions: [originalRot],
              isFront: false,
              onFrontCallback: () => {
                const page = this.dialogPage.addText("Это рулетка");
                this.guiManager.CreateDialogBox([page]);
              },
              frontPosition: new Vector3(0, 0, 0.9),
              frontRotation: new Vector3(Math.PI, 0, 0),
            };
          }
        }
      }

      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  private getToolNameByMesh(mesh: AbstractMesh): string | null {
    for (const toolName in this.tools) {
      // Теперь у нас в this.tools[toolName].meshes обычно 1 root
      if (this.tools[toolName].meshes.includes(mesh)) {
        return toolName;
      }
      // Но если вы вдруг захотите проверять дочерние меши,
      // можете сделать рекурсивный поиск. Например:
      for (const rootMesh of this.tools[toolName].meshes) {
        if (rootMesh.getChildMeshes(false).includes(mesh)) {
          return toolName;
        }
      }
    }
    return null;
  }

  private returnCurrentTool(): void {
    if (!this.currentToolName) return;
    const toolData = this.tools[this.currentToolName];

    if (toolData.isFront) {
      this.camera.attachControl(this.canvas, true);

      // Теперь у нас 1 root, берём rootMesh = toolData.meshes[0]
      toolData.meshes.forEach((rootMesh, index) => {
        rootMesh.setParent(null);
        rootMesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
        rootMesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
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
      // 1) Выбираем инструмент
      this.currentToolName = toolName;
      this.camera.detachControl();

      // 2) Ставим root как дочерний к камере и задаём позицию/вращение
      const pos = toolData.frontPosition || this.defaultFrontPosition;
      const rot = toolData.frontRotation || this.defaultFrontRotation;

      toolData.meshes.forEach((rootMesh) => {
        rootMesh.setParent(this.camera);
        rootMesh.position = pos.clone();
        rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(rot.x, rot.y, rot.z);
      });

      // 3) Колбэк
      if (toolData.onFrontCallback) {
        toolData.onFrontCallback();
      }
    } else {
      // Возвращаем на место
      this.camera.attachControl(this.canvas, true);

      toolData.meshes.forEach((rootMesh, index) => {
        rootMesh.setParent(null);
        rootMesh.setAbsolutePosition(toolData.originalAbsolutePositions[index]);
        rootMesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
      });
      this.debugToolTransform(toolName, "after returning");

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
    const startPage = this.dialogPage.addText(
      "Выбирайте инструмент (ПКМ на инструмент), для приближения нажмите Q/Й."
    );
    this.guiManager.CreateDialogBox([startPage]);
  }

  private async CreateShadows(): Promise<void> {
    const light = new DirectionalLight(
      "dirLight",
      new Vector3(-1, -1, -1),
      this.scene
    );
    light.position = new Vector3(0, 10, 10);
    light.intensity = 2;

    const shadowGenerator = new ShadowGenerator(2048, light);
    shadowGenerator.useContactHardeningShadow = true;
    shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;

    // Пример: все меши в сцене отбрасывают тени
    this.scene.meshes.forEach((mesh) => {
      mesh.receiveShadows = true;
      shadowGenerator.addShadowCaster(mesh);
    });
  }

  private debugToolTransform(toolName: string, phase: string): void {
    const toolData = this.tools[toolName];
    if (!toolData) {
      console.warn(`debugToolTransform: no tool found with name "${toolName}"`);
      return;
    }
  
    console.log(`===== [${toolName}] Transforms at "${phase}" =====`);
    toolData.meshes.forEach((mesh, idx) => {
      const pos = mesh.position;
      const scl = mesh.scaling;
      let rotEul = "";
      if (mesh.rotationQuaternion) {
        // Преобразуем rotationQuaternion в углы Эйлера (для наглядности).
        const eul = mesh.rotationQuaternion.toEulerAngles();
        rotEul = `Euler(${eul.x.toFixed(2)}, ${eul.y.toFixed(2)}, ${eul.z.toFixed(2)})`;
      } else {
        // Если используется .rotation (Vector3)
        rotEul = `rotation(${mesh.rotation.x.toFixed(2)}, ${mesh.rotation.y.toFixed(2)}, ${mesh.rotation.z.toFixed(2)})`;
      }
  
      console.log(
        `Mesh #${idx}: Position=(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}) ` +
        `| Rotation=${rotEul} | Scaling=(${scl.x},${scl.y},${scl.z})`,
        mesh // можно передать сам mesh вторым аргументом, чтобы раскрыть в консоли
      );
    });
    console.log("================================================");
  }
  

  public async initializeScene(): Promise<void> {
    try {
      // 1. Загружаем окружение (модели, свет и т.д.)
      await this.CreateEnvironment();

      // 2. Если нужен метод создания теней:
      // await this.CreateShadows();

      // 3. Дожидаемся, пока сцена действительно будет готова
      await this.scene.whenReadyAsync();

      // 4. Скрываем loading UI
      this.engine.hideLoadingUI();

      // 5. Показываем диалог
      this.showToolSelectionDialog();
    } catch (error) {
      console.error("Ошибка при инициализации сцены:", error);
      this.engine.hideLoadingUI();
    }
  }
}












