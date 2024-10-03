// import {
//   Scene,
//   Engine,
//   SceneLoader,
//   Vector3,
//   HemisphericLight,
//   HDRCubeTexture,
//   Tools,
//   FreeCamera,
//   ActionManager,
//   ExecuteCodeAction,
//   MeshBuilder,
//   Ray,
//   RayHelper,
//   Color3,
//   AbstractMesh,
// } from "@babylonjs/core";
// import "@babylonjs/loaders"; // Поддержка загрузки моделей
// import { AdvancedDynamicTexture, Button, Control, StackPanel, RadioButton, TextBlock } from "@babylonjs/gui";

// export class TestScene {
//   scene: Scene;
//   engine: Engine;
//   openModal?: () => void;
//   zone: number[] = [-11.622146207334794, 9.429402500045683, -3.529072189835968];
//   private guiTexture: AdvancedDynamicTexture;
//   private interactionZone: AbstractMesh; // Зона взаимодействия
//   private zoneTriggered: boolean = false; // Флаг для отслеживания срабатывания триггера

//   constructor(private canvas: HTMLCanvasElement) {
//     this.engine = new Engine(this.canvas, true);
//     this.engine.displayLoadingUI();
    

//     this.scene = this.CreateScene();

//     this.CreateEnvironment().then(() => {
//       this.engine.hideLoadingUI();
//     });
//     this.CreateController();

//     // Создаем GUI-текстуру
//     this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

//     this.AddScreenshotButton(); // Добавляем кнопку скриншота
//     this.AddCameraPositionButton(); // Добавляем кнопку для отображения координат камеры

//     // Создаем триггер-зону
//     this.setupZoneTrigger(this.zone);

//     this.engine.runRenderLoop(() => {
//       this.scene.render();
//     });
//   }

//   CreateScene(): Scene {
//     const scene = new Scene(this.engine);
//     new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

//     const framesPerSecond = 60;
//     const gravity = -9.81;
//     scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//     scene.collisionsEnabled = true;

//     // Загружаем новую HDR текстуру
//     const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);

//     scene.environmentTexture = hdrTexture;
//     scene.createDefaultSkybox(hdrTexture, true);

// //     // Создаем skybox с указанным масштабом и получаем ссылку на него
// //     const skybox = scene.createDefaultSkybox(hdrTexture, true);

// //     // Изменяем размер skybox
// //     skybox.scaling = new Vector3(0.8, 0.8, 0.8); // Увеличиваем размер в 2 раза по всем осям

// //     // Изменяем позицию skybox
// //     skybox.position.y = -200; // Опускаем skybox на 100 единиц по оси Y

//     scene.environmentIntensity = 0.5;

//     return scene;
//   }

//   CreateController(): void {
//     const camera = new FreeCamera("camera", new Vector3(0, 15, -15), this.scene);
//     camera.attachControl(this.canvas, true);

//     camera.applyGravity = false;
//     camera.checkCollisions = true;
//     camera.ellipsoid = new Vector3(0.5, 1, 0.5);
//     camera.minZ = 0.45;
//     camera.speed = 0.55;
//     camera.angularSensibility = 4000;
//     camera.keysUp.push(87); // W
//     camera.keysLeft.push(65); // A
//     camera.keysDown.push(83); // S
//     camera.keysRight.push(68); // D
//   }

//   async CreateEnvironment(): Promise<void> {
//     try {
//       this.engine.displayLoadingUI();

//       const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
//       // console.log(meshes);
      

//       meshes.forEach((mesh) => {
//         mesh.checkCollisions = true;
//       });

//       this.targetMeshes = meshes.filter((mesh) =>
//         mesh.name.toLowerCase().includes("beam")
//       );
//       console.log(this.targetMeshes);

//       this.beam = this.targetMeshes[0]
//       console.log(this.beam);
      
      

//       this.setupModalInteraction()
//       this.createRayAboveMesh(this.beam)


//       console.log("Модели успешно загружены.");
//     } catch (error) {
//       console.error("Ошибка при загрузке моделей:", error);
//     } finally {
//       this.engine.hideLoadingUI();
//     }
//   }

//   AddScreenshotButton(): void {
//     const screenshotButton = Button.CreateSimpleButton("screenshotButton", "Сделать скриншот");
//     screenshotButton.width = "150px";
//     screenshotButton.height = "40px";
//     screenshotButton.color = "white";
//     screenshotButton.cornerRadius = 20;
//     screenshotButton.background = "blue";
//     screenshotButton.top = "20px";
//     screenshotButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

//     this.guiTexture.addControl(screenshotButton);

//     screenshotButton.onPointerUpObservable.add(() => {
//       Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, { width: 1920, height: 1080 });
//     });
//   }

//   AddCameraPositionButton(): void {
//     const cameraPositionButton = Button.CreateSimpleButton("cameraPositionButton", "Показать координаты камеры");
//     cameraPositionButton.width = "200px";
//     cameraPositionButton.height = "40px";
//     cameraPositionButton.color = "white";
//     cameraPositionButton.cornerRadius = 20;
//     cameraPositionButton.background = "green";
//     cameraPositionButton.top = "70px";
//     cameraPositionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

//     this.guiTexture.addControl(cameraPositionButton);

//     cameraPositionButton.onPointerUpObservable.add(() => {
//       const cameraPosition = this.scene.activeCamera?.position;
//       if (cameraPosition) {
//         console.log(`Координаты камеры: x=${cameraPosition.x}, y=${cameraPosition.y}, z=${cameraPosition.z}`);
//       } else {
//         console.log("Камера не инициализирована.");
//       }
//     });
//   }

//   setupZoneTrigger(zone: number[]): void {
//     this.interactionZone = MeshBuilder.CreateBox("interactionZone", { size: 2 }, this.scene);
//     this.interactionZone.isVisible = false;
//     this.interactionZone.position = new Vector3(zone[0], zone[1], zone[2]);
//     this.interactionZone.checkCollisions = false;

//     const cameraCollider = MeshBuilder.CreateBox("cameraCollider", { size: 1 }, this.scene);
//     cameraCollider.isVisible = false;
//     cameraCollider.parent = this.scene.activeCamera;

//     cameraCollider.actionManager = new ActionManager(this.scene);

//     cameraCollider.actionManager.registerAction(
//       new ExecuteCodeAction(
//         {
//           trigger: ActionManager.OnIntersectionEnterTrigger,
//           parameter: { mesh: this.interactionZone },
//         },
//         () => {
//           if (!this.zoneTriggered) {
//             this.zoneTriggered = true;
//             console.log("Камера пересекла зону взаимодействия!");
//             this.createStartButton();
//           }
//         }
//       )
//     );
//   }

//   createStartButton(): void {
//     const startButton = Button.CreateSimpleButton("startBtn", "Начать");
//     startButton.width = "150px";
//     startButton.height = "40px";
//     startButton.color = "white";
//     startButton.cornerRadius = 20;
//     startButton.background = "green";
//     startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

//     this.guiTexture.addControl(startButton);

//     startButton.onPointerUpObservable.add(() => {
//       this.guiTexture.removeControl(startButton); // Убираем кнопку
//       this.disableCameraMovement();
//       this.setCameraPositionAndTarget();

//       this.createRadioButtons(); // Создаем радиокнопки после фиксации камеры
//     });
//   }

//   setCameraPositionAndTarget(): void {
//     const camera = this.scene.activeCamera as FreeCamera;
//     const targetPosition = this.interactionZone.getAbsolutePosition();
//     const angle = Math.PI / 2; //положение камеры вокруг объекта
//     const distance = -1; //дистанция от объекта

//     const x = targetPosition.x + distance * Math.sin(angle);
//     const z = targetPosition.z + distance * Math.cos(angle);
//     const y = targetPosition.y - 0.5; //и высота камеры

//     camera.position = new Vector3(x, y, z);
//     camera.setTarget(targetPosition);
//     camera.rotation.x = 0; //угол обзопа, смотрим прямо
//   }

//   disableCameraMovement(): void {
//     const camera = this.scene.activeCamera as FreeCamera;
//     camera.detachControl();
//   }

//   enableCameraMovement(): void {
//     const camera = this.scene.activeCamera as FreeCamera;
//     camera.attachControl(this.canvas, true);
//   }

//   createRadioButtons(): void {
//     // Создаем панель для размещения радиокнопок
//     const radioButtonPanel = new StackPanel();
//     radioButtonPanel.isVertical = true; // Горизонтальное расположение кнопок
//     radioButtonPanel.width = "100px";
//     radioButtonPanel.height = "100%";
//     radioButtonPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//     radioButtonPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

//     this.guiTexture.addControl(radioButtonPanel);

//     // Массив для хранения радиокнопок
//     const radioButtons: RadioButton[] = [];

//     // Создаем 5 радиокнопок с разными отступами
//     const paddings = [0, 70, 85, 30, 10]; // Определяем разные отступы между радиокнопками

//     for (let i = 0; i < 5; i++) {
//         const radioButton = new RadioButton();
//         radioButton.width = "30px";
//         radioButton.height = "30px";
//         radioButton.color = "white";
//         radioButton.background = "grey";

//         // Текстовая метка для радиокнопки
//         const label = new TextBlock();
//         label.text = `Вариант ${i + 1}`;
//         label.height = "30px";
//         label.color = "white";
//         label.paddingTop = "5px";
//         label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

//         // Создаем StackPanel для радиокнопки и метки
//         const radioGroup = new StackPanel();
//         radioGroup.isVertical = true;
//         radioGroup.width = "120px";

//         // Устанавливаем индивидуальные отступы между кнопками
//         if (i > 0) {
//             radioGroup.paddingTop = `${paddings[i]}px`;
//         }

//         radioGroup.addControl(radioButton);
//         radioGroup.addControl(label);

//         radioButtonPanel.addControl(radioGroup); // Добавляем радиогруппу на панель
//         radioButtons.push(radioButton);
//     }

//     // Кнопка для скрытия радиокнопок
//     const hideButton = Button.CreateSimpleButton("hideBtn", "Скрыть");
//     hideButton.width = "100px";
//     hideButton.height = "40px";
//     hideButton.color = "white";
//     hideButton.background = "red";
//     hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

//     this.guiTexture.addControl(hideButton);

//     hideButton.onPointerUpObservable.add(() => {
//         this.guiTexture.removeControl(radioButtonPanel); // Убираем радиокнопки
//         this.guiTexture.removeControl(hideButton); // Убираем кнопку скрытия
//         this.enableCameraMovement(); // Возвращаем возможность управлять камерой
//     });
// }

// setupModalInteraction(): void {
//   if (!this.beam) return;

//   this.beam.actionManager = new ActionManager(this.scene);

//   this.beam.actionManager.registerAction(
//     new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
//       this.canvas.style.cursor = 'pointer';
//     })
//   );

//   this.beam.actionManager.registerAction(
//     new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
//       this.canvas.style.cursor = 'default';
//     })
//   );

//   // Используем OnRightPickTrigger для обработки правого клика
//   this.beam.actionManager.registerAction(
//     new ExecuteCodeAction(ActionManager.OnRightPickTrigger, () => {
//       console.log('Beam right-clicked!');
//       if (this.openModal) {
//         this.openModal();
//       }
//     })
//   );
// }


// createRayAboveMesh(mesh: AbstractMesh): void {
//   const rayOrigin = mesh.getAbsolutePosition().clone();
//   const rayDirection = new Vector3(0, 1, 0);
//   const rayLength = 100;

//   const ray = new Ray(rayOrigin, rayDirection, rayLength);

//   const rayHelper = new RayHelper(ray);
//   rayHelper.show(this.scene, new Color3(1, 0, 0));
// }

// }

// import {
//   Scene,
//   Engine,
//   SceneLoader,
//   Vector3,
//   HemisphericLight,
//   HDRCubeTexture,
//   Tools,
//   FreeCamera,
//   AbstractMesh,
// } from "@babylonjs/core";
// import "@babylonjs/loaders";
// import {
//   AdvancedDynamicTexture,
//   Button,
//   Control,
// } from "@babylonjs/gui";
// import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";

// export class TestScene {
//   scene: Scene;
//   engine: Engine;
//   openModal?: () => void;
//   zone: number[] = [-11.622146207334794, 9.429402500045683, -3.529072189835968];
//   zone2: number[] = [13.057004227460391, 2.0282419080806964, 13.477405516648421]
//   private guiTexture: AdvancedDynamicTexture;
//   private triggerManager: TriggerManager2;
//   private zoneTriggered: boolean = false;
//   private beam: AbstractMesh;
//   private beam2: AbstractMesh;
//   private targetMeshes: AbstractMesh[];
//   private targetMeshes2: AbstractMesh[];

//   constructor(private canvas: HTMLCanvasElement) {
//     this.engine = new Engine(this.canvas, true);
//     this.engine.displayLoadingUI();

//     this.scene = this.CreateScene();

//     this.CreateEnvironment().then(() => {
//       this.engine.hideLoadingUI();
//     });
//     this.CreateController();

//     this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
//     this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);

//     // this.AddScreenshotButton();
//     this.AddCameraPositionButton();

//     this.setupTriggers();

//     this.engine.runRenderLoop(() => {
//       this.scene.render();
//     });
//   }

//   CreateScene(): Scene {
//     const scene = new Scene(this.engine);
//     new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

//     const framesPerSecond = 60;
//     const gravity = -9.81;
//     scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//     scene.collisionsEnabled = true;

//     const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);

//     scene.environmentTexture = hdrTexture;
//     scene.createDefaultSkybox(hdrTexture, true);
//     scene.environmentIntensity = 0.5;

//     return scene;
//   }

//   CreateController(): void {
//     const camera = new FreeCamera("camera", new Vector3(0, 15, -15), this.scene);
//     camera.attachControl(this.canvas, true);

//     camera.applyGravity = true;
//     camera.checkCollisions = true;
//     camera.ellipsoid = new Vector3(0.5, 1, 0.5);
//     camera.minZ = 0.45;
//     camera.speed = 0.55;
//     camera.angularSensibility = 4000;
//     camera.keysUp.push(87); // W
//     camera.keysLeft.push(65); // A
//     camera.keysDown.push(83); // S
//     camera.keysRight.push(68); // D
//   }

//   async CreateEnvironment(): Promise<void> {
//     try {
//       this.engine.displayLoadingUI();

//       const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);

//       meshes.forEach((mesh) => {
//         mesh.checkCollisions = true;
//       });



//       this.targetMeshes = meshes.filter((mesh) => mesh.name.toLowerCase().includes("beam"));
//       this.beam = this.targetMeshes[0]
//       this.targetMeshes2 = meshes.filter((mesh) => mesh.name.toLowerCase().includes("rack"));
//       this.beam2 = this.targetMeshes2[1]
//       console.log("Arr", this.targetMeshes2);
//       console.log("Beam", this.beam2);
      

//       if (this.beam) {
//         this.triggerManager.setupModalInteraction(this.beam, () => {
//           console.log("Beam right-clicked!");
//           if (this.openModal) {
//             this.openModal();
//           }
//         });

//         this.triggerManager.createRayAboveMesh(this.beam2);
//       }

//       console.log("Модели успешно загружены.");
//     } catch (error) {
//       console.error("Ошибка при загрузке моделей:", error);
//     } finally {
//       this.engine.hideLoadingUI();
//     }
//   }

//   AddScreenshotButton(): void {
//     const screenshotButton = Button.CreateSimpleButton("screenshotButton", "Сделать скриншот");
//     screenshotButton.width = "150px";
//     screenshotButton.height = "40px";
//     screenshotButton.color = "white";
//     screenshotButton.cornerRadius = 20;
//     screenshotButton.background = "blue";
//     screenshotButton.top = "20px";
//     screenshotButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

//     this.guiTexture.addControl(screenshotButton);

//     screenshotButton.onPointerUpObservable.add(() => {
//       Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, { width: 1920, height: 1080 });
//     });
//   }

//   AddCameraPositionButton(): void {
//     const cameraPositionButton = Button.CreateSimpleButton("cameraPositionButton", "Показать координаты камеры");
//     cameraPositionButton.width = "200px";
//     cameraPositionButton.height = "40px";
//     cameraPositionButton.color = "white";
//     cameraPositionButton.cornerRadius = 20;
//     cameraPositionButton.background = "green";
//     cameraPositionButton.top = "70px";
//     cameraPositionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

//     this.guiTexture.addControl(cameraPositionButton);

//     cameraPositionButton.onPointerUpObservable.add(() => {
//       const cameraPosition = this.scene.activeCamera?.position;
//       if (cameraPosition) {
//         console.log(`Координаты камеры: x=${cameraPosition.x}, y=${cameraPosition.y}, z=${cameraPosition.z}`);
//       } else {
//         console.log("Камера не инициализирована.");
//       }
//     });
//   }

//   setupTriggers(): void {
//     this.triggerManager.setupZoneTrigger(2, new Vector3(...this.zone), () => {
//       if (!this.zoneTriggered) {
//         this.zoneTriggered = true;
//         console.log("Камера пересекла зону взаимодействия!");
//         this.triggerManager.createStartButton(() => {
//           this.triggerManager.disableCameraMovement();
//           const targetPosition = this.triggerManager.getInteractionZone().getAbsolutePosition();
//           this.triggerManager.setCameraPositionAndTarget(Math.PI / 2, -1, 0, targetPosition);
//           this.triggerManager.createRadioButtons(() => {
//             this.triggerManager.enableCameraMovement();
//           });
//         });
//       }
//     });
//   }

//   setupThirdMission(): void {
//     this.triggerManager.setupZoneTrigger(4, new Vector3(...this.zone2), () => {

//     })
//   }


// }

import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  Tools,
  FreeCamera,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control, Image, Rectangle, TextBlock, TextWrapping } from "@babylonjs/gui";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";

export class TestScene {
  scene: Scene;
  engine: Engine;
  openModal?: () => void;
  zone: number[] = [-11.622146207334794, 9.429402500045683, -3.529072189835968];
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private zoneTriggered: boolean = false;
  private beam: AbstractMesh;
  private beam2: AbstractMesh;
  private targetMeshes: AbstractMesh[];
  private targetMeshes2: AbstractMesh[];

  // constructor(private canvas: HTMLCanvasElement) {
  //   this.engine = new Engine(this.canvas, true);
  //   this.engine.displayLoadingUI();

  //   this.scene = this.CreateScene();

  //   this.CreateEnvironment().then(() => {
  //     this.engine.hideLoadingUI();
  //   });
  //   this.CreateController();
    

  //   this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  //   this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);
  //   // this.CreateDialogBox();

  //   this.AddScreenshotButton();
  //   // this.AddCameraPositionButton();

  //   this.setupTriggers();

  //   this.engine.runRenderLoop(() => {
  //     this.scene.render();
  //   });
  // }



  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();
  
    this.scene = this.CreateScene();
  
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.setupTriggers(); // Переместили вызов сюда
    });
  
    this.CreateController();
  
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);
    // this.CreateDialogBox();
  
    this.AddScreenshotButton();
    // this.AddCameraPositionButton();
  
    // Удалили вызов this.setupTriggers() отсюда
  
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

    const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 15, -15), this.scene);
    camera.attachControl(this.canvas, true);

    camera.applyGravity = false;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    camera.minZ = 0.45;
    camera.speed = 0.55;
    camera.angularSensibility = 4000;
    camera.keysUp.push(87); // W
    camera.keysLeft.push(65); // A
    camera.keysDown.push(83); // S
    camera.keysRight.push(68); // D
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();
  
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
  
        map.forEach((mesh) => {
        mesh.checkCollisions = true;
          });

      // Находим сломаные меши
      // this.targetMeshes = meshes.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
      // this.targetMeshes2 = meshes.filter((mesh) => mesh.name.toLowerCase().includes("whole"));

      // this.targetMeshes.forEach((mesh) => {
      //   mesh.visibility = 1; // Полностью видимый
      // });
  
      // this.targetMeshes2.forEach((mesh) => {
      //   mesh.visibility = 0; // Полностью невидимый
      // });
    
      this.beam = map.find((mesh) => mesh.name.toLowerCase().includes("beam"));
      if (this.beam) {
        this.triggerManager.setupModalInteraction(this.beam, () => {
          console.log("Beam right-clicked!");
          if (this.openModal) {
            this.openModal();
          }
        });

        this.triggerManager.createRayAboveMesh(this.beam);
      }

      this.targetMeshes2 = map.filter((mesh) => mesh.name.toLowerCase().includes("rack"));
      this.beam2 = this.targetMeshes2[1];

  
      // Загрузка markMeshes
      const assetContainer = await SceneLoader.LoadAssetContainerAsync(
        "./models/",           // rootUrl
        "exclamation_point.glb", // sceneFilename
        this.scene              // scene
      );

      this.markMeshes = assetContainer.meshes; // Сохраняем meshes из AssetContainer
  
      // Масштабируем шаблонный меш
      this.markMeshes.forEach((mesh) => {
        mesh.scaling = new Vector3(0.5, 0.7, 0.5);
      });
  
      console.log("mark", this.markMeshes);
      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    } finally {
      // Удаляем вызов this.engine.hideLoadingUI(); отсюда
    }
  }
  



  AddScreenshotButton(): void {
    const screenshotButton = Button.CreateSimpleButton("screenshotButton", "Сделать скриншот");
    screenshotButton.width = "150px";
    screenshotButton.height = "40px";
    screenshotButton.color = "white";
    screenshotButton.cornerRadius = 20;
    screenshotButton.background = "blue";
    screenshotButton.top = "20px";
    screenshotButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    this.guiTexture.addControl(screenshotButton);

    screenshotButton.onPointerUpObservable.add(() => {
      Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, { width: 1920, height: 1080 });
    });
  }

  AddCameraPositionButton(): void {
    const cameraPositionButton = Button.CreateSimpleButton("cameraPositionButton", "Показать координаты камеры");
    cameraPositionButton.width = "200px";
    cameraPositionButton.height = "40px";
    cameraPositionButton.color = "white";
    cameraPositionButton.cornerRadius = 20;
    cameraPositionButton.background = "green";
    cameraPositionButton.top = "70px";
    cameraPositionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    this.guiTexture.addControl(cameraPositionButton);

    cameraPositionButton.onPointerUpObservable.add(() => {
      const cameraPosition = this.scene.activeCamera?.position;
      if (cameraPosition) {
        console.log(`Координаты камеры: x=${cameraPosition.x}, y=${cameraPosition.y}, z=${cameraPosition.z}`);
      } else {
        console.log("Камера не инициализирована.");
      }
    });
  }








// setupTriggers(): void {
//   // Убедимся, что markMeshes загружены
//   if (this.markMeshes && this.markMeshes.length > 0) {
//     const markMeshTemplate = this.markMeshes[0]; // Используем первый mesh как шаблон

//     // Первый триггер
//     const firstTriggerZone = this.triggerManager.setupZoneTrigger(
//       new Vector3(...this.zone),
//       () => {
//         if (!this.zoneTriggered) {
//           this.zoneTriggered = true;
//           console.log("Камера пересекла зону взаимодействия!");
//           this.triggerManager.createStartButton(() => {
//             this.triggerManager.disableCameraMovement();
//             const targetPosition = firstTriggerZone.getInteractionZone().getAbsolutePosition();
//             this.triggerManager.setCameraPositionAndTarget(Math.PI / 2, -1, 0, targetPosition);
//             this.triggerManager.createRadioButtons(() => {
//               this.triggerManager.enableCameraMovement();
//             });
//           });
//         }
//       },
//       undefined, // onExitZone
//       2, // camSize
//       markMeshTemplate, // Передаем шаблон markMesh
//       6.5 // Устанавливаем высоту знака для первой зоны (например, 3)
//     );

//     // Второй триггер
//     const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421);

//     let clickCount = 0;
//     let clickCountText: TextBlock;

//     const secondTriggerZone = this.triggerManager.setupZoneTrigger(
//       clickZonePosition,
//       () => {
//         console.log("Вошли в зону кликов");
//         // Активируем взаимодействие с beam2
//         if (this.beam2) {
//           this.triggerManager.setupClickableMesh(this.beam2, () => {
//             clickCount++;
//             // Обновляем или создаем текст с количеством кликов
//             if (!clickCountText) {
//               clickCountText = new TextBlock();
//               clickCountText.text = `Клики: ${clickCount}`;
//               clickCountText.color = "white";
//               clickCountText.fontSize = 24;
//               clickCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
//               clickCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//               clickCountText.top = "100px";
//               clickCountText.right = "20px";
//               this.guiTexture.addControl(clickCountText);
//             } else {
//               clickCountText.text = `Клики: ${clickCount}`;
//             }
//           });
//         }
//       },
//       () => {
//         console.log("Вышли из зоны кликов");
//         // Показываем сообщение с общим количеством кликов
//         const totalClicksMessage = new TextBlock();
//         totalClicksMessage.text = `Вы кликнули ${clickCount} раз(а)`;
//         totalClicksMessage.color = "white";
//         totalClicksMessage.fontSize = 24;
//         totalClicksMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//         totalClicksMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//         this.guiTexture.addControl(totalClicksMessage);

//         // Удаляем сообщение через 3 секунды
//         setTimeout(() => {
//           this.guiTexture.removeControl(totalClicksMessage);
//         }, 3000);

//         // Очищаем
//         if (clickCountText) {
//           this.guiTexture.removeControl(clickCountText);
//           clickCountText = null;
//         }
//         clickCount = 0;

//         // Отключаем взаимодействие с beam2
//         if (this.beam2) {
//           this.triggerManager.removeMeshAction(this.beam2);
//         }
//       },
//       5, // camSize
//       markMeshTemplate, // Передаем шаблон markMesh
//       -1 // Устанавливаем высоту знака для второй зоны (например, 4)
//     );
//   } else {
//     console.error("markMeshes не загружены или пусты.");
//   }
// }
// В вашем классе TestScene

setupTriggers(): void {
  // Проверяем, что markMeshes загружены
  if (this.markMeshes && this.markMeshes.length > 0) {
    const markMeshTemplate = this.markMeshes[0]; // Используем первый mesh как шаблон

    // Создаем массив для хранения ссылок на знаки в зонах
    this.zoneSigns = [];

    // --- Первый триггер (с отображением знака) ---

    // Позиция первой триггер-зоны
    const firstZonePosition = new Vector3(...this.zone);

    // Клонируем знак для первой зоны
    const firstZoneSign = markMeshTemplate.clone("firstZoneSign");
    firstZoneSign.position = firstZonePosition.clone();
    firstZoneSign.position.y = 6; // Устанавливаем высоту знака для первой зоны
    firstZoneSign.isVisible = true; // Убеждаемся, что знак видим

    // Добавляем знак в сцену
    this.scene.addMesh(firstZoneSign);

    // Сохраняем ссылку на знак для дальнейшего удаления
    this.zoneSigns.push(firstZoneSign);

    // Создаем первую триггер-зону
    const firstTriggerZone = this.triggerManager.setupZoneTrigger(
      firstZonePosition,
      () => {
        // Вход в первую зону
        if (!this.zoneTriggered) {
          this.zoneTriggered = true;
          console.log("Камера пересекла зону взаимодействия!");

          // Удаляем знак
          if (firstZoneSign) {
            firstZoneSign.dispose();
          }

          this.triggerManager.createStartButton(() => {
            this.triggerManager.disableCameraMovement();
            const targetPosition = firstTriggerZone.getInteractionZone().getAbsolutePosition();
            this.triggerManager.setCameraPositionAndTarget(
              Math.PI / 2,
              -1,
              0,
              targetPosition
            );
            this.triggerManager.createRadioButtons(() => {
              this.triggerManager.enableCameraMovement();
            });
          });
        }
      },
      undefined, // onExitZone
      2 // camSize
      // Не передаем markMeshTemplate и markMeshHeight, так как знак мы уже создали вручную
    );

    // --- Второй триггер (с отображением знака) ---

    // Позиция второй триггер-зоны
    const clickZonePosition = new Vector3(
      13.057004227460391,
      2.0282419080806964,
      13.477405516648421
    );

    // Клонируем знак для второй зоны
    const secondZoneSign = markMeshTemplate.clone("secondZoneSign");
    secondZoneSign.position = clickZonePosition.clone();
    secondZoneSign.position.y = -1; // Устанавливаем высоту знака для второй зоны
    secondZoneSign.isVisible = true; // Убеждаемся, что знак видим

    // Добавляем знак в сцену
    this.scene.addMesh(secondZoneSign);

    // Сохраняем ссылку на знак для дальнейшего удаления
    this.zoneSigns.push(secondZoneSign);

    let clickCount = 0;
    let clickCountText: TextBlock;

    // Создаем вторую триггер-зону
    const secondTriggerZone = this.triggerManager.setupZoneTrigger(
      clickZonePosition,
      () => {
        console.log("Вошли в зону кликов");

        // Удаляем знак
        if (secondZoneSign) {
          secondZoneSign.dispose();
        }

        // Показываем сообщение
        const warningText = new TextBlock();
        warningText.text = "Не отходите далеко от колонны пока не сделаете измерения";
        warningText.color = "white";
        warningText.fontSize = 24;
        warningText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        warningText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        warningText.top = "10%";
        this.guiTexture.addControl(warningText);

        // Скрываем сообщение через 5 секунд
        setTimeout(() => {
          this.guiTexture.removeControl(warningText);
        }, 5000);

        // Активируем взаимодействие с beam2
        if (this.beam2) {
          this.triggerManager.setupClickableMesh(this.beam2, () => {
            clickCount++;
            // Обновляем или создаем текст с количеством кликов
            if (!clickCountText) {
              clickCountText = new TextBlock();
              clickCountText.text = `Клики: ${clickCount}`;
              clickCountText.color = "white";
              clickCountText.fontSize = 24;
              clickCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
              clickCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
              clickCountText.top = "100px";
              clickCountText.right = "20px";
              this.guiTexture.addControl(clickCountText);
            } else {
              clickCountText.text = `Клики: ${clickCount}`;
            }
          });
        }
      },
      () => {
        console.log("Вышли из зоны кликов");
                // Показываем сообщение с общим количеством кликов
        const totalClicksMessage = new TextBlock();
        totalClicksMessage.text = `Вы кликнули ${clickCount} раз(а)`;
        totalClicksMessage.color = "white";
        totalClicksMessage.fontSize = 24;
        totalClicksMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        totalClicksMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.guiTexture.addControl(totalClicksMessage);

        // Удаляем сообщение через 3 секунды
        setTimeout(() => {
          this.guiTexture.removeControl(totalClicksMessage);
        }, 3000);

        // Ваш существующий код по выходу из зоны...

        // Очищаем
        if (clickCountText) {
          this.guiTexture.removeControl(clickCountText);
          clickCountText = null;
        }
        clickCount = 0;

        // Отключаем взаимодействие с beam2
        if (this.beam2) {
          this.triggerManager.removeMeshAction(this.beam2);
        }
      },
      5 // camSize
      // Не передаем markMeshTemplate и markMeshHeight, так как знак мы уже создали вручную
    );
  } else {
    console.error("markMeshes не загружены или пусты.");
  }
}







  CreateDialogBox(): void {
    // Создаем контейнер для диалогового окна
    const dialogContainer = new Rectangle();
    dialogContainer.width = "30%";
    dialogContainer.height = "80%";
    dialogContainer.thickness = 0;
    dialogContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    dialogContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    dialogContainer.top = "2%";
    dialogContainer.left = "-2%";
    this.guiTexture.addControl(dialogContainer);
  
    // Добавляем изображение диалогового облачка
    const dialogImage = new Image("dialogImage", "/models/pixelSpeech.png");
    dialogImage.width = "100%";
    dialogImage.height = "100%";
    dialogContainer.addControl(dialogImage);
  
    // Добавляем текст с эффектом печатания
    const dialogText = new TextBlock();
    dialogText.text = "";
    dialogText.color = "black";
    dialogText.fontSize = "5%"; // Адаптивный размер шрифта
    dialogText.resizeToFit = true;
    dialogText.textWrapping = TextWrapping.WordWrap; // Используем enum
    dialogText.paddingTop = "2%";
    dialogText.paddingLeft = "15%";
    dialogText.paddingRight = "15%";
    dialogText.paddingBottom = "7%";
    dialogContainer.addControl(dialogText);
  
    // Текст, который нужно отобразить
    const fullText = "Привет! Это диалоговое окно с анимацией печатания текста. Теперь оно масштабируется по размеру экрана.";
  
    let currentIndex = 0;
  
    // Функция для анимации печатания текста
    const typingInterval = setInterval(() => {
      dialogText.text += fullText[currentIndex];
      currentIndex++;
      if (currentIndex >= fullText.length) {
        clearInterval(typingInterval);
      }
    }, 50); // Скорость печатания (в миллисекундах)
  }
  
  
  



}


