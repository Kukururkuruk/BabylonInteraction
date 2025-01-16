import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  Tools,
  FreeCamera,
  AbstractMesh,
  Mesh,
  ActionManager, 
  ExecuteCodeAction
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { ModelLoader } from "../BaseComponents/ModelLoader";
import * as BABYLON from "@babylonjs/core";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { GUIManager } from "../FunctionComponents/GUIManager";


export class ToolScenePC {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  camera!: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private modelLoader: ModelLoader;
  private originalCameraSettings?: { position: Vector3; target: Vector3 };
  private isScreenMode = false;
  private isDoorOpen: boolean = false; // Флаг состояния двери (открыта/закрыта)
  private isScreenClicked: boolean = false; // Флаг клика на экран
  private guiManager: GUIManager;
  private isCooldown: boolean = false; // Флаг для проверки на задержку


  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.modelLoader = new ModelLoader(this.scene);
    this.guiManager = new GUIManager(this.scene);
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });

    this.CreateController();
    this.AddScreenshotButton();
    this.AddCameraPositionButton();
    this.AddScreenClickHandler();
    this.AddDoorClickHandler();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    this.AddEscapeKeyHandler();
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

    // Настройка свойств освещения
    hemiLight.intensity = 0.7;
    hemiLight.diffuse = new Color3(1, 1, 1);
    hemiLight.specular = new Color3(0.5, 0.5, 0.5);

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
    this.camera = new FreeCamera("camera", new Vector3(0, 1.5, 0), this.scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 0.75, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.angularSensibility = 6000;
    this.camera.inertia = 0.8;
    this.camera.keysUp.push(87); // W
    this.camera.keysLeft.push(65); // A
    this.camera.keysDown.push(83); // S
    this.camera.keysRight.push(68); // D
  }

  async CreateEnvironment(): Promise<void> {
    try {
        this.engine.displayLoadingUI();

        // Загрузка моделей
        await this.modelLoader.loadMLabModel();

        // Обработка экрана
        const screenMesh = this.scene.getMeshByName("SM_0_Screen_1");
        if (screenMesh) {
            // Настройка кликабельности экрана
            screenMesh.checkCollisions = true;
            screenMesh.actionManager = new ActionManager(this.scene);
            screenMesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Экран был нажат напрямую!");
                    this.activateScreenView(screenMesh);
                })
            );

            // Добавление плоского меша на экран
            const boundingInfo = screenMesh.getBoundingInfo();
            const size = boundingInfo.boundingBox.extendSizeWorld;

            // Уменьшаем размер плоского меша в 4 раза и помещаем его в левую часть экрана
            const interactivePlane = MeshBuilder.CreatePlane(
                "InteractivePlane",
                { width: size.x * 2 / 4, height: size.y * 2 / 4 }, // Уменьшаем размер в 4 раза
                this.scene
            );

            // Вычисляем позицию и поворот для плоского меша
            const worldCenter = boundingInfo.boundingBox.centerWorld;
            interactivePlane.position = new Vector3(
                worldCenter.x - size.x / 2, // Сдвиг влево относительно центра
                worldCenter.y,
                worldCenter.z
            );
            interactivePlane.rotation = screenMesh.rotation.clone(); // Наследуем поворот от экрана
            interactivePlane.isPickable = true;

            // Создание материала с зеленой эмиссией
            const greenMaterial = new StandardMaterial("GreenMaterial", this.scene);
            greenMaterial.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет
            greenMaterial.emissiveColor = new Color3(0, 1, 0); // Свечение зеленого цвета
            interactivePlane.material = greenMaterial;

            // Добавление эффекта свечения
            const glowLayer = new GlowLayer("GlowLayer", this.scene);
            glowLayer.addIncludedOnlyMesh(interactivePlane); // Подсвечиваем только interactivePlane

            // Действия при клике на плоский меш
            interactivePlane.actionManager = new ActionManager(this.scene);
            interactivePlane.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Плоский меш перед экраном был нажат!");
                    this.isScreenClicked = true;
                })
            );
            console.log("SM_0_Screen_1 и плоский меш настроены.");
        } else {
            console.warn("SM_0_Screen_1 не найден.");
        }

        // Обработка двери
        const doorMesh = this.scene.getMeshByName("SM_Door");
        if (doorMesh) {
            doorMesh.checkCollisions = true;
            doorMesh.actionManager = new ActionManager(this.scene);
            doorMesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Дверь была нажата!");

                    if (this.isScreenClicked) {
                        console.log("Переход на другую страницу!");
                        this.showRoutePage();
                    } else {
                        console.warn("Сначала нажмите на экран!");
                    }

                    if (this.isDoorOpen) {
                        this.closeDoor(doorMesh);
                    } else {
                        this.openDoor(doorMesh);
                    }
                })
            );
            console.log("SM_Door настроен.");
        } else {
            console.warn("SM_Door не найден.");
        }

        console.log("Модели успешно загружены.");
    } catch (error) {
        console.error("Ошибка при загрузке моделей:", error);
    } finally {
        this.engine.hideLoadingUI();
    }
}

private showRoutePage(): void {
  const routeButton = Button.CreateSimpleButton("routeButton", "Перейти");
  routeButton.width = "150px";
  routeButton.height = "50px";
  routeButton.color = "white";
  routeButton.background = "green";

  
  this.guiManager.createRouteButton('/ТахеометрЗадание'); // Переход на карту
  // Добавляем кнопку в GUI
  this.guiTexture.addControl(routeButton);
}

  AddScreenClickHandler(): void {
    const screenMesh = this.scene.getMeshByName("SM_0_Screen_1");
    if (!screenMesh) {
        console.error("Меш SM_0_Screen_1 не найден.");
        return;
    }

    screenMesh.actionManager = new BABYLON.ActionManager(this.scene);
    screenMesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
                if (!this.isScreenMode) {
                    this.activateScreenView(screenMesh as BABYLON.AbstractMesh);
                } else {
                    console.log("Вы уже находитесь в режиме просмотра экрана.");
                }
            }
        )
    );
}

AddDoorClickHandler(): void {
    const doorMesh = this.scene.getMeshByName("SM_Door");
    if (!doorMesh) {
        console.error("Меш SM_Door не найден.");
        return;
    }

    doorMesh.actionManager = new BABYLON.ActionManager(this.scene);
    doorMesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
                this.toggleDoorState(doorMesh as BABYLON.AbstractMesh);
            }
        )
    );
}



  activateScreenView(screenMesh: AbstractMesh): void {
    if (this.isScreenMode) {
        console.log("Режим просмотра уже активирован.");
        return; // Если режим экрана уже активен, не делаем ничего
    }

    this.isScreenMode = true; // Устанавливаем флаг режима экрана

    // Устанавливаем точные координаты камеры
    this.camera.position.set(-0.03605546142586176, 1.5076749996840952, 2.7365113870411744);

    // Вычисляем направление камеры на 180 градусов от текущей цели
    const target = screenMesh.getAbsolutePosition();
    const direction = this.camera.position.subtract(target).normalize(); // Направление от камеры к цели
    const oppositeTarget = this.camera.position.add(direction.scale(2)); // Точка в противоположную сторону

    // Устанавливаем развернутую цель
    this.camera.setTarget(oppositeTarget);

    // Добавляем наклон камеры вниз на 20 градусов
    const downTiltAngle = BABYLON.Angle.FromDegrees(20).radians(); // Преобразование градусов в радианы
    this.camera.rotation.x = downTiltAngle; // Установка угла поворота по оси X

    // Отключаем управление камерой
    this.camera.detachControl();

    // Отключаем взаимодействие с экраном
    screenMesh.isPickable = false;

    console.log("Режим просмотра активирован. Нажмите Esc, чтобы выйти.");

    // Обработка клавиши Escape для выхода из режима
    this.scene.onKeyboardObservable.add((keyboardInfo) => {
        if (keyboardInfo.type === BABYLON.KeyboardEventTypes.KEYUP && keyboardInfo.event.key === "Escape") {
            this.exitScreenView(screenMesh);
        }
    });
}


exitScreenView(screenMesh: AbstractMesh): void {
  if (!this.isScreenMode) {
      console.log("Режим просмотра уже отключен.");
      return; // Если режим экрана не активен, не делаем ничего
  }

  this.isScreenMode = false; // Сбрасываем флаг режима экрана

  // Восстанавливаем управление камерой
  this.camera.attachControl();

  // Включаем взаимодействие с экраном
  screenMesh.isPickable = true;

  console.log("Режим просмотра отключен. Теперь вы можете снова взаимодействовать с экраном.");
}


SwitchToScreenMode(screenMesh: Mesh): void {
  if (this.isScreenMode) return;

  // Сохраняем текущее положение камеры
  this.originalCameraSettings = {
      position: this.camera.position.clone(),
      target: this.camera.getTarget(),
  };

  // Отключаем свободное перемещение
  this.camera.detachControl();

  // Устанавливаем конкретные координаты камеры
  this.camera.position.set(-0.03605546142586176, 1.5076749996840952, 2.7365113870411744);

  // Устанавливаем камере цель — центр меша экрана
  this.camera.setTarget(screenMesh.getAbsolutePosition());

  this.isScreenMode = true;
}

  AddEscapeKeyHandler(): void {
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isScreenMode) {
        this.ExitScreenMode();
      }
    });
  }

  ExitScreenMode(): void {
    if (!this.originalCameraSettings) return;

    // Восстанавливаем исходное положение камеры
    this.camera.position = this.originalCameraSettings.position;
    this.camera.setTarget(this.originalCameraSettings.target);

    // Включаем свободное перемещение
    this.camera.attachControl(this.canvas, true);

    this.isScreenMode = false;
  }

  toggleDoorState(doorMesh: BABYLON.AbstractMesh): void {
    if (this.isDoorOpen) {
        this.closeDoor(doorMesh);
    } else {
        this.openDoor(doorMesh);
    }
}

// Вызов анимации при нажатии на дверь
openDoor(doorMesh: BABYLON.AbstractMesh): void {
  if (this.isCooldown) return; // Прерываем выполнение, если идет задержка
  this.isCooldown = true; // Включаем задержку

  this.isDoorOpen = true;

  // Найти ручку двери
  const doorHandleMesh = this.scene.getMeshByName("SM_Door_Handle_1");
  if (!doorHandleMesh) {
      console.warn("Меш ручки двери SM_Door_Handle_1 не найден.");
  }

  // Анимация для двери
  const doorAnimation = new BABYLON.Animation(
      "OpenDoor",
      "rotation.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const doorKeys = [
      { frame: 0, value: doorMesh.rotation.y },
      { frame: 30, value: doorMesh.rotation.y + Math.PI / 2 },
  ];
  doorAnimation.setKeys(doorKeys);
  doorMesh.animations = [];
  doorMesh.animations.push(doorAnimation);

  // Анимация для ручки двери
  if (doorHandleMesh) {
      const handleAnimation = new BABYLON.Animation(
          "MoveHandle",
          "position.y",
          30,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const handleKeys = [
          { frame: 0, value: doorHandleMesh.position.y },
          { frame: 15, value: doorHandleMesh.position.y - 0.05 }, // Опускаем ручку
          { frame: 30, value: doorHandleMesh.position.y },       // Возвращаем в исходное положение
      ];
      handleAnimation.setKeys(handleKeys);
      doorHandleMesh.animations = [];
      doorHandleMesh.animations.push(handleAnimation);
  }

  // Запуск анимации
  this.scene.beginAnimation(doorMesh, 0, 30, false);
  if (doorHandleMesh) {
      this.scene.beginAnimation(doorHandleMesh, 0, 30, false);
  }

  console.log("Дверь открывается.");

  // Устанавливаем задержку в 2 секунды перед следующим кликом
  setTimeout(() => {
      this.isCooldown = false; // Разрешаем следующий клик
  }, 2000);
}

closeDoor(doorMesh: BABYLON.AbstractMesh): void {
  if (this.isCooldown) return; // Прерываем выполнение, если идет задержка
  this.isCooldown = true; // Включаем задержку

  this.isDoorOpen = false;

  // Найти ручку двери
  const doorHandleMesh = this.scene.getMeshByName("SM_Door_Handle_1");
  if (!doorHandleMesh) {
      console.warn("Меш ручки двери SM_Door_Handle_1 не найден.");
  }

  // Анимация для двери
  const doorAnimation = new BABYLON.Animation(
      "CloseDoor",
      "rotation.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const doorKeys = [
      { frame: 0, value: doorMesh.rotation.y },
      { frame: 30, value: doorMesh.rotation.y - Math.PI / 2 },
  ];
  doorAnimation.setKeys(doorKeys);
  doorMesh.animations = [];
  doorMesh.animations.push(doorAnimation);

  // Анимация для ручки двери
  if (doorHandleMesh) {
      const handleAnimation = new BABYLON.Animation(
          "MoveHandle",
          "position.y",
          30,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const handleKeys = [
          { frame: 0, value: doorHandleMesh.position.y },
          { frame: 15, value: doorHandleMesh.position.y - 0.05 }, // Опускаем ручку
          { frame: 30, value: doorHandleMesh.position.y },       // Возвращаем в исходное положение
      ];
      handleAnimation.setKeys(handleKeys);
      doorHandleMesh.animations = [];
      doorHandleMesh.animations.push(handleAnimation);
  }

  // Запуск анимации
  this.scene.beginAnimation(doorMesh, 0, 30, false);
  if (doorHandleMesh) {
      this.scene.beginAnimation(doorHandleMesh, 0, 30, false);
  }

  console.log("Дверь закрывается.");

  // Устанавливаем задержку в 2 секунды перед следующим кликом
  setTimeout(() => {
      this.isCooldown = false; // Разрешаем следующий клик
  }, 2000);
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
      Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, {
        width: 1920,
        height: 1080,
      });
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
}
