// import {
//     Scene,
//     Engine,
//     Vector3,
//     HemisphericLight,
//     HDRCubeTexture,
//     FreeCamera,
//     AbstractMesh,
//     Quaternion,
//     Mesh,
//     MeshBuilder,
//     StandardMaterial,
//     Color3,
//     Ray,
//     Tools,
//     DirectionalLight,
//     ShadowGenerator,
//     KeyboardEventTypes,
//     PBRMaterial,
//     Material,
//     GlowLayer,
//     SceneLoader,
//     DynamicTexture
//   } from "@babylonjs/core";
//   import "@babylonjs/loaders";
//   import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
//   import { TriggerManager2 } from "../FunctionComponents/TriggerManager2";
//   import { ModelLoader } from "../BaseComponents/ModelLoader";
//   import { GUIManager } from "../FunctionComponents/GUIManager";
//   import { DialogPage } from "../FunctionComponents/DialogPage";
//   import { BabylonUtilities } from "../FunctionComponents/BabylonUtilities"; // путь к файлу
//   import eventEmitter from "../../../EventEmitter";
  
//   interface ToolData {
//     meshes: AbstractMesh[],
//     originalAbsolutePositions: Vector3[],
//     originalWorldRotationQuaternions: Quaternion[],
//     isFront: boolean,
//     onFrontCallback?: () => void,
//     frontPosition?: Vector3,
//     frontRotation?: Vector3
//   }
  
//   export class DemoScene {
//     scene: Scene;
//     engine: Engine;
//     openModal?: (keyword: string) => void;
//     camera: FreeCamera;
//     private guiTexture: AdvancedDynamicTexture;
//     private triggerManager: TriggerManager2;
//     private modelLoader: ModelLoader;
//     private guiManager: GUIManager;
//     private dialogPage: DialogPage;
//     private utilities: BabylonUtilities
  
//     private tools: { [key: string]: ToolData } = {};
  
//     // Значения по умолчанию для позиции и ротации перед камерой
//     private defaultFrontPosition: Vector3 = new Vector3(0, -0.1, 0.9);
//     private defaultFrontRotation: Vector3 = new Vector3(0, Math.PI / 2, 0);
  
//     private isRotating: boolean = false;
//     private currentToolName: string | null = null;
//     private lastPointerX: number = 0;
//     private lastPointerY: number = 0;
  
//     constructor(private canvas: HTMLCanvasElement) {
//       this.engine = new Engine(this.canvas, true);
//       this.engine.displayLoadingUI();
  
//       this.scene = this.CreateScene();
//       this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
//       this.modelLoader = new ModelLoader(this.scene);
//       this.guiManager = new GUIManager(this.scene, this.textMessages);
//       this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
//       this.dialogPage = new DialogPage();
//       this.utilities = new BabylonUtilities(this.scene, this.engine, this.guiTexture);
  
//       this.initializeScene();
  
//       this.CreateController();
//       this.utilities.AddScreenshotButton();
//       // this.utilities.AddCameraPositionButton();
//       // this.utilities.combinedMethod()

//       this.BetonTrigger();
  
//       this.engine.runRenderLoop(() => {
//         this.scene.render();
//       });
  
//       this.scene.onPointerDown = (evt, pickInfo) => {
//         // Правая кнопка — перемещаем инструмент
//         if (evt.button === 2) {
//           if (pickInfo.hit && pickInfo.pickedMesh) {
//             const clickedTool = this.getToolNameByMesh(pickInfo.pickedMesh);
//             if (clickedTool) {
//               // Если уже есть инструмент перед камерой и мы кликаем на другой
//               if (this.currentToolName && this.currentToolName !== clickedTool) {
//                 this.returnCurrentTool();
//               }
//               this.toggleToolPosition(clickedTool);
//             }
//           }
//         } else if (evt.button === 0) {
//           // Левая кнопка — вращаем, если инструмент перед камерой
//           if (this.currentToolName && this.tools[this.currentToolName].isFront) {
//             this.isRotating = true;
//             this.lastPointerX = evt.clientX;
//             this.lastPointerY = evt.clientY;
//           }
//         }
//       };
  
//       this.scene.onPointerUp = (evt) => {
//         if (evt.button === 0 && this.isRotating) {
//           this.isRotating = false;
//         }
//       };
  
//       this.scene.onPointerMove = (evt) => {
//         if (this.isRotating && this.currentToolName) {
//           const toolData = this.tools[this.currentToolName];
//           if (!toolData.isFront) return;
  
//           const deltaX = evt.clientX - this.lastPointerX;
//           const deltaY = evt.clientY - this.lastPointerY;
  
//           this.lastPointerX = evt.clientX;
//           this.lastPointerY = evt.clientY;
  
//           const rotationSpeed = 0.005;
//           toolData.meshes.forEach((m) => {
//             if (!m.rotationQuaternion) {
//               m.rotationQuaternion = Quaternion.FromEulerAngles(m.rotation.x, m.rotation.y, m.rotation.z);
//             }
  
//             let deltaRotation = Quaternion.RotationYawPitchRoll(deltaX * rotationSpeed, deltaY * rotationSpeed, 0);
  
//             if (evt.shiftKey) {
//               const zRotation = Quaternion.RotationAxis(new Vector3(0,0,1), deltaX * rotationSpeed);
//               deltaRotation = zRotation.multiply(deltaRotation);
//             }
  
//             m.rotationQuaternion = deltaRotation.multiply(m.rotationQuaternion);
//           });
//         }
//       };
//     }
  
//     CreateScene(): Scene {
//       const scene = new Scene(this.engine);
//       const framesPerSecond = 60;
//       const gravity = -9.81;
//       scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//       scene.collisionsEnabled = true;

//       const light = new DirectionalLight(
//         "dirLight",
//         new Vector3(-1, -1, -1),
//         this.scene
//       );
//       light.position = new Vector3(-20, 20, 20);
//       light.intensity = 2;
  
//       const hdrTexture = new HDRCubeTexture("/models/test_5.hdr", scene, 512);
//       scene.environmentTexture = hdrTexture;
//       scene.createDefaultSkybox(hdrTexture, true);
//       scene.environmentIntensity = 1;
  
//       return scene;
//     }
  
//     CreateController(): void {
//       this.camera = new FreeCamera("camera", new Vector3(0, 1.5, 0), this.scene);
//       this.camera.attachControl(this.canvas, true);
//       this.camera.applyGravity = false;
//       this.camera.checkCollisions = true;
//       this.camera.ellipsoid = new Vector3(0.5, 0.75, 0.5);
//       this.camera.minZ = 0.45;
//       this.camera.speed = 0.55;
//       this.camera.inertia = 0.7;
//       this.camera.angularSensibility = 2000;
//       this.camera.keysUp.push(87); // W
//       this.camera.keysLeft.push(65); // A
//       this.camera.keysDown.push(83); // S
//       this.camera.keysRight.push(68); // D
//           const originalFov = this.camera.fov;
//           let isZoomedIn = false;
//           this.scene.onKeyboardObservable.add((kbInfo) => {
//               if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
//                 const key = kbInfo.event.key.toLowerCase();
//                   if (/q|й/.test(key)) {
//                       if (isZoomedIn) {
//                           // Если камера уже уменьшена, восстанавливаем оригинальный FOV
//                           this.camera.fov = originalFov;
//                       } else {
//                           // Уменьшаем FOV камеры
//                           this.camera.fov /= 2;
//                       }
//                       // Переключаем флаг
//                       isZoomedIn = !isZoomedIn;
//                   }
//               }
//           });
  
//     }
  
//     async CreateEnvironment(): Promise<void> {
//       try {
//         this.engine.displayLoadingUI();
  
//         await this.modelLoader.loadMLabModel();
//         const lab = this.modelLoader.getMeshes('lab') || [];
        
//         const glowLayer = new GlowLayer("glow", this.scene); // Создаём GlowLayer
//         glowLayer.intensity = 1;
        
//         lab.forEach((mesh) => {
//           mesh.checkCollisions = false;
        
//           if (mesh.name === "SM_0_Tools_Desk" && mesh instanceof Mesh) {
//             const material = mesh.material;
        
//             if (material && material instanceof PBRMaterial) {
//               material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND; // Убираем прозрачность
//               material.emissiveColor = new Color3(1, 1, 1);
//               material.emissiveIntensity = 2;
        
//               // Убедимся, что у материала есть текстура эмиссии
//               if (material.emissiveTexture) {
//                 glowLayer.addIncludedOnlyMesh(mesh); // Только этот меш будет светиться
//               }
//             }
//           }
//         });
  
//         // Загрузка dist
//         await this.modelLoader.loadRangeCentrModel()
//         const dist = this.modelLoader.getMeshes('rangeC') || [];
//         dist.forEach((mesh, index) => {
          
//           if (index !== 0) {
//             mesh.scaling = new Vector3(1,1,1);
//             mesh.position = new Vector3(3.56, 0.95, 1.99);
//             mesh.rotation = new Vector3(0, Math.PI, Math.PI/2);
//             if (!mesh.rotationQuaternion) {
//               mesh.rotationQuaternion = Quaternion.FromEulerAngles(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
//             }
//           }
//         });
//         const distAbsolutePositions = dist.map(m => m.getAbsolutePosition().clone());
//         const distWorldRotQuats = dist.map(m => m.rotationQuaternion!.clone());
  
//         this.tools['dist'] = {
//           meshes: dist,
//           originalAbsolutePositions: distAbsolutePositions,
//           originalWorldRotationQuaternions: distWorldRotQuats,
//           isFront: false,
//           onFrontCallback: () => {
//             const distPage = this.dialogPage.addText("Это вот штука дальномер");
//             this.guiManager.CreateDialogBox([distPage]);
//           },
//           // Задаём индивидуальные передние позицию и ротацию
//           frontPosition: new Vector3(0, 0, 0.9),
//           frontRotation: new Vector3(Math.PI, Math.PI / 2, 0)
//         };

//         // Загрузка новой модели Rangefinder_LP.glb
//         const { meshes: rangefinderMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Rangefinder_LP.glb", this.scene);
//         console.log(rangefinderMeshes);

//         rangefinderMeshes.forEach((mesh) => {
//             // Отзеркаливание по оси Z и масштабирование
//             mesh.scaling = new Vector3(3, 3, -3); // Масштабируем в 3 раза и отражаем по Z
//             mesh.rotation.y = Math.PI / 3;

//             // Закрепление модели за камерой
//             mesh.parent = this.camera;

//             // Установка позиции относительно камеры
//             const offset = new Vector3(-0.7, -0.5, 1.1); // Настройте значения по необходимости
//             mesh.position = offset;
//         });

//         const thirdMesh = rangefinderMeshes[2];

//         // Получение размеров меша
//         const boundingInfo = thirdMesh.getBoundingInfo();
//         const boundingBox = boundingInfo.boundingBox;
//         const size = boundingBox.maximum.subtract(boundingBox.minimum);
//         const width = size.z;
//         const height = size.y;

//         // Определение размеров плоскости
//         const planeWidth = width; // Ширина плоскости равна ширине меша
//         const planeHeight = height; // Высота плоскости — 20% от высоты меша (можно настроить по необходимости)

//         // Создание DynamicTexture с достаточным разрешением
//         const dynamicTexture = new DynamicTexture("DynamicTexture", { width: 1024, height: 512 }, this.scene, false);
//         dynamicTexture.hasAlpha = true;

//         // Установка шрифта перед измерением текста
//         const font = "bold 90px Arial";
//         const ctx = dynamicTexture.getContext();
//         ctx.font = font;

//         // Определение максимальной ширины текста с учётом отступов
//         const maxTextWidth = dynamicTexture.getSize().width - 100; // 50 пикселей отступа с каждой стороны

//         // Функция для разбиения текста на строки с учётом символов \n и ширины
//         function wrapText(context, text, maxWidth) {
//             const lines = [];
//             const paragraphs = text.split('\n');

//             paragraphs.forEach(paragraph => {
//                 const words = paragraph.split(' ');
//                 let currentLine = '';

//                 words.forEach(word => {
//                     const testLine = currentLine + word + ' ';
//                     const metrics = context.measureText(testLine);
//                     const testWidth = metrics.width;

//                     if (testWidth > maxWidth && currentLine !== '') {
//                         lines.push(currentLine.trim());
//                         currentLine = word + ' ';
//                     } else {
//                         currentLine = testLine;
//                     }
//                 });

//                 lines.push(currentLine.trim());
//             });

//             return lines;
//         }

//         // Функция для обновления текста с переносом
//         function updateDynamicText(newText) {
//             ctx.clearRect(0, 0, dynamicTexture.getSize().width, dynamicTexture.getSize().height);

//             // Устанавливаем шрифт
//             ctx.font = font;

//             // Разбиваем текст на строки с учетом \n и ширины
//             const lines = wrapText(ctx, newText, maxTextWidth);

//             // Рисуем каждую строку с увеличивающимся смещением по Y
//             const lineHeight = 90; // Можно настроить в зависимости от шрифта
//             lines.forEach((line, index) => {
//                 ctx.fillStyle = "white"; // Цвет текста
//                 ctx.fillText(line, 50, 100 + index * lineHeight); // 50 и 100 - отступы от левого и верхнего края
//             });

//             // Обновляем текстуру
//             dynamicTexture.update();
//         }

//         // Обработчики событий
//         eventEmitter.on("updateTextPlane", (newText) => {
//             if (dynamicTexture) {
//                 updateDynamicText(newText);
//             }
//         });

//         eventEmitter.on("updateAngleText", (newText) => {
//             if (dynamicTexture) {
//                 updateDynamicText(newText);
//             }
//         });

//         // Создание материала для текста
//         const textMaterial = new StandardMaterial("TextMaterial", this.scene);
//         textMaterial.diffuseTexture = dynamicTexture;
//         textMaterial.emissiveColor = new Color3(1, 1, 1); // Делает текст ярким
//         textMaterial.backFaceCulling = false; // Текст виден с обеих сторон

//         // Создание плоскости для текста
//         const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth, height: planeHeight }, this.scene);
//         textPlane.material = textMaterial;

//         // Позиционируем плоскость относительно меша
//         textPlane.parent = thirdMesh;
//         textPlane.rotation.y = -Math.PI / 2;

//         // Компенсируем отражение родителя по оси Z
//         textPlane.scaling = new Vector3(-1, 1, 1);

//         // Устанавливаем позицию
//         textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0); // Смещение по Y (вверх)
  
//         console.log("Модели успешно загружены.");
//       } catch (error) {
//         console.error("Ошибка при загрузке моделей:", error);
//       }
//     }
  
//     private getToolNameByMesh(mesh: AbstractMesh): string | null {
//       for (const toolName in this.tools) {
//         if (this.tools[toolName].meshes.includes(mesh)) {
//           return toolName;
//         }
//       }
//       return null;
//     }
  
//     private returnCurrentTool(): void {
//       if (!this.currentToolName) return;
//       const toolData = this.tools[this.currentToolName];
  
//       if (toolData.isFront) {
//         this.camera.attachControl(this.canvas, true);
  
//         toolData.meshes.forEach((mesh, index) => {
//           mesh.setParent(null);
//           mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
//           mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
//         });
  
//         toolData.isFront = false;
//         this.currentToolName = null;
  
//         this.checkAndShowToolSelectionDialog();
//       }
//     }
  
//     private toggleToolPosition(toolName: string): void {
//       const toolData = this.tools[toolName];
//       if (!toolData) return;
  
//       toolData.isFront = !toolData.isFront;
//       if (toolData.isFront) {
//         this.currentToolName = toolName;
//         this.camera.detachControl();
  
//         const pos = toolData.frontPosition || this.defaultFrontPosition;
//         const rot = toolData.frontRotation || this.defaultFrontRotation;
  
//         toolData.meshes.forEach((mesh) => {
//           mesh.setParent(this.camera);
//           mesh.position = pos.clone();
//           mesh.rotationQuaternion = Quaternion.FromEulerAngles(rot.x, rot.y, rot.z);
//         });
  
//         if (toolData.onFrontCallback) {
//           toolData.onFrontCallback();
//         }
  
//       } else {
//         this.camera.attachControl(this.canvas, true);
  
//         toolData.meshes.forEach((mesh, index) => {
//           mesh.setParent(null);
//           mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
//           mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
//         });
  
//         if (this.currentToolName === toolName) {
//           this.currentToolName = null;
//         }
  
//         this.checkAndShowToolSelectionDialog();
//       }
//     }
  
//     private checkAndShowToolSelectionDialog(): void {
//       if (!this.currentToolName) {
//         this.showToolSelectionDialog();
//       }
//     }
  
//     private showToolSelectionDialog(): void {
//       const startPage = this.dialogPage.addText("Выбирай инструмен, для приближения нажмите на клавиатуре Q/Й");
//       this.guiManager.CreateDialogBox([startPage]);
//     }

//         BetonTrigger(): void {
//         const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
//         this.guiManager.CreateDialogBox([page1])
    
//                 this.triggerManager.createStartButton('Начать', () => {
//                 // Показываем сообщение
//                 const page2 = this.dialogPage.addText("Вам нужно измерить длину конструкций которые представлены на второй странице. Для того чтобы начать измерение нажмите на правую кнопку мыши в месте откуда хотите начать. В этом месте создается ось координат, которая поможет вам правильно определить угол. Второй раз кликните в том месте где нужно закончить измерение. Появившееся число введите на второй странице")
//                 const page3 = this.dialogPage.addInputGrid("Конструкции", ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"])
//                 this.guiManager.CreateDialogBox([page2, page3])
    
//                   // Активируем режим лазера для второй триггер-зоны
//                   this.triggerManager.distanceMode();
//                   this.triggerManager.enableDistanceMeasurement()
//                   this.triggerManager.createStartButton('Завершить', () => {
//                     const page4 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для премещение на основную карту")
//                     this.guiManager.CreateDialogBox([page4])
//                     this.triggerManager.disableDistanceMeasurement()
    
//                     this.triggerManager.exitDisLaserMode2();
//                     this.guiManager.createRouteButton('/test')
//                 })
    
                
//                 })
    
//     }
  
  
//     async initializeScene(): Promise<void> {
//       try {
//         await this.CreateEnvironment();
//         this.showToolSelectionDialog();
//       } catch (error) {
//         console.error("Ошибка при инициализации сцены:", error);
//       } finally {
//         // this.scene.onReadyObservable.add(() => {
//           this.engine.hideLoadingUI();
//     //   })
        
//       }
//     }


  
  
//   }


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
  ActionManager // Добавить
} from "@babylonjs/core";
import { ExecuteCodeAction } from "@babylonjs/core/Actions"; // Добавить

import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { TriggerManager2 } from "../FunctionComponents/TriggerManager2";
import { ModelLoader } from "../BaseComponents/ModelLoader";
import { GUIManager } from "../FunctionComponents/GUIManager";
import { DialogPage } from "../FunctionComponents/DialogPage";
import { BabylonUtilities } from "../FunctionComponents/BabylonUtilities";
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
    // this.utilities.AddCameraPositionButton();
    // this.utilities.combinedMethod()

    // УБРАНО: this.BetonTrigger(); 
    // Теперь BetonTrigger() вызывается только по клику на меш SM_0_Wall_R

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

    const hdrTexture = new HDRCubeTexture("/models/test_5.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 1;

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

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      // 1) ЗАГРУЗКА LAB
      await this.modelLoader.loadMLabModel();
      const lab = this.modelLoader.getMeshes("lab") || [];

      // GlowLayer для LAB
      const glowLayer = new GlowLayer("glow", this.scene);
      glowLayer.intensity = 1;

      lab.forEach((mesh) => {
        mesh.checkCollisions = false;
        // Пример для SM_0_Tools_Desk
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

      lab.forEach((mesh) => {
        // --- Клик по стене => BetonTrigger() ---
        if (mesh.name === "SM_0_Wall_R") {
          mesh.actionManager = new ActionManager(this.scene);
          mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              // Проверяем, не вызывали ли уже
              if (this.isBetonTriggered) return;
              this.isBetonTriggered = true;

              this.BetonTrigger();
            })
          );
        }

        // --- Клик по столу => initToolHandling() ---
        if (mesh.name === "SM_0_Tools_Desk") {
          mesh.actionManager = new ActionManager(this.scene);
          mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              // Проверяем, не кликали ли уже
              if (this.isToolDeskClicked) return;
              this.isToolDeskClicked = true;

              this.initToolHandling();
            })
          );
        }
      });

      console.log("Основные модели (LAB) успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  /**
   * Метод, который будет вызываться по клику на SM_0_Tools_Desk.
   * Здесь:
   *  - инициализируем логику по загрузке dist и rangefinder (бывшая часть CreateEnvironment),
   *  - регистрируем onPointerDown / onPointerUp / onPointerMove (бывшие в constructor),
   *  - определяем методы работы с инструментами (getToolNameByMesh, returnCurrentTool и т.п.).
   */
  private async initToolHandling(): Promise<void> {
    // ---------------------
    // 1) ДОГРУЖАЕМ "dist" (часть из CreateEnvironment после // Загрузка dist)
    // ---------------------
    try {
      await this.modelLoader.loadRangeCentrModel();
      const dist = this.modelLoader.getMeshes("rangeC") || [];
      dist.forEach((mesh, index) => {
        if (index !== 0) {
          mesh.scaling = new Vector3(1, 1, 1);
          mesh.position = new Vector3(3.56, 0.95, 1.99);
          mesh.rotation = new Vector3(0, Math.PI, Math.PI / 2);
          if (!mesh.rotationQuaternion) {
            mesh.rotationQuaternion = Quaternion.FromEulerAngles(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
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
          const distPage = this.dialogPage.addText("Это вот штука дальномер");
          this.guiManager.CreateDialogBox([distPage]);
        },
        frontPosition: new Vector3(0, 0, 0.9),
        frontRotation: new Vector3(Math.PI, Math.PI / 2, 0),
      };

      console.log("Модели 'dist' и 'rangefinder' успешно догружены (initToolHandling).");
    } catch (e) {
      console.error("Ошибка при догрузке 'dist' / 'rangefinder':", e);
    }

    // ---------------------
    // 2) Регистрируем события мыши onPointerDown, onPointerUp, onPointerMove
    //    (Вместо того, чтобы делать это в constructor)
    // ---------------------
    this.scene.onPointerDown = (evt, pickInfo) => {
      // Правая кнопка — перемещаем инструмент
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

    // ---------------------
    // 3) Методы для работы с инструментами:
    //    (перенесены из тела класса в виде приватных вложенных функций
    //     либо можно оставить их "обычными" приватными методами класса)
    // ---------------------
  }

  // Оставляем эти методы приватными в самом классе,
  // но помним, что они вызываются из initToolHandling (и обработчиков мыши).
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
      this.camera.attachControl(this.canvas, true);

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
      this.camera.detachControl();

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
      this.camera.attachControl(this.canvas, true);

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
    const startPage = this.dialogPage.addText("Выбирай инструмент, для приближения нажмите на клавиатуре Q/Й");
    this.guiManager.CreateDialogBox([startPage]);
  }

  public async BetonTrigger(): Promise<void> {
    // Показываем диалог перед началом
    const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.");
    this.guiManager.CreateDialogBox([page1]);

    // NEW: Подгружаем Rangefinder_LP.glb
    try {
      // Загрузка новой модели Rangefinder_LP.glb
      const { meshes: rangefinderMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Rangefinder_LP.glb", this.scene);

      // Пример позиционирования и "динамического текста"
      rangefinderMeshes.forEach((mesh) => {
        // Отзеркаливание по оси Z и масштабирование
        mesh.scaling = new Vector3(3, 3, -3);
        mesh.rotation.y = Math.PI / 3;
        // Родитель = камера
        mesh.parent = this.camera;
        const offset = new Vector3(-0.7, -0.5, 1.1);
        mesh.position = offset;
      });

      // Допустим, хотим работать именно с 3-м мешем
      const thirdMesh = rangefinderMeshes[2];
      const boundingInfo = thirdMesh.getBoundingInfo();
      const boundingBox = boundingInfo.boundingBox;
      const size = boundingBox.maximum.subtract(boundingBox.minimum);
      const width = size.z;
      const height = size.y;

      // DynamicTexture
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

      console.log("Rangefinder_LP.glb загружен и настроен");
    } catch (err) {
      console.error("Ошибка при загрузке Rangefinder_LP.glb:", err);
    }

    // Дальше - ваша логика работы с BetonTrigger
      const page2 = this.dialogPage.addText(
        "Вам нужно измерить длину конструкций... Кликните правой кнопкой, чтобы начать измерение и т.д."
      );
      const page3 = this.dialogPage.addInputGrid("Конструкции", ["Ширина двери", "Высота стола", "Шкаф", "Что-то еще"]);
      

      this.triggerManager.distanceMode();
      this.triggerManager.enableDistanceMeasurement();
      const page4 = this.dialogPage.createStartPage('Для завершения нажмите на кнопку', 'Завершить', () => {
        const page4 = this.dialogPage.addText("Отлично, теперь нажмите на кнопку для перехода на основную карту");
        this.guiManager.CreateDialogBox([page4]);
        this.triggerManager.disableDistanceMeasurement();
        this.triggerManager.exitDisLaserMode2();
        this.isBetonTriggered = false
        
      })

      this.guiManager.CreateDialogBox([page2, page3, page4]);
  }

  async initializeScene(): Promise<void> {
    try {
      await this.CreateEnvironment();
      // Выводим диалог, что можно выбрать инструмент
      this.showToolSelectionDialog();
    } catch (error) {
      console.error("Ошибка при инициализации сцены:", error);
    } finally {
      this.engine.hideLoadingUI();
    }
  }
}

  
  