import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  Tools,
  FreeCamera,
  ActionManager,
  ExecuteCodeAction,
  MeshBuilder,
  Ray,
  RayHelper,
  Color3,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders"; // Поддержка загрузки моделей
import { AdvancedDynamicTexture, Button, Control, StackPanel, RadioGroup, SelectionPanel, RadioButton, TextBlock } from "@babylonjs/gui";

export class TestScene {
  scene: Scene;
  engine: Engine;
  openModal?: () => void;
  zone: number[] = [-11.622146207334794, 9.429402500045683, -3.529072189835968];
  private guiTexture: AdvancedDynamicTexture;
  private interactionZone: any; // Зона взаимодействия
  private zoneTriggered: boolean = false; // Флаг для отслеживания срабатывания триггера

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
    this.CreateController();

    // Создаем GUI-текстуру
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // this.AddScreenshotButton(); // Добавляем кнопку скриншота
    // this.AddCameraPositionButton(); // Добавляем кнопку для отображения координат камеры

    // Создаем триггер-зону
    this.setupZoneTrigger(this.zone);

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

    // Загружаем новую HDR текстуру
    const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 15, -15), this.scene);
    camera.attachControl(this.canvas, true);

    camera.applyGravity = true;
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

      const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      console.log(meshes);
      

      meshes.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      this.beam = meshes[31]

      this.setupModalInteraction()
      this.createRayAboveMesh(this.beam)


      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    } finally {
      this.engine.hideLoadingUI();
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

  setupZoneTrigger(zone: number[]): void {
    this.interactionZone = MeshBuilder.CreateBox("interactionZone", { size: 2 }, this.scene);
    this.interactionZone.isVisible = false;
    this.interactionZone.position = new Vector3(zone[0], zone[1], zone[2]);
    this.interactionZone.checkCollisions = false;

    const cameraCollider = MeshBuilder.CreateBox("cameraCollider", { size: 1 }, this.scene);
    cameraCollider.isVisible = false;
    cameraCollider.parent = this.scene.activeCamera;

    cameraCollider.actionManager = new ActionManager(this.scene);

    cameraCollider.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: { mesh: this.interactionZone },
        },
        () => {
          if (!this.zoneTriggered) {
            this.zoneTriggered = true;
            console.log("Камера пересекла зону взаимодействия!");
            this.createStartButton();
          }
        }
      )
    );
  }

  createStartButton(): void {
    const startButton = Button.CreateSimpleButton("startBtn", "Начать");
    startButton.width = "150px";
    startButton.height = "40px";
    startButton.color = "white";
    startButton.cornerRadius = 20;
    startButton.background = "green";
    startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    this.guiTexture.addControl(startButton);

    startButton.onPointerUpObservable.add(() => {
      this.guiTexture.removeControl(startButton); // Убираем кнопку
      this.disableCameraMovement();
      this.setCameraPositionAndTarget();

      this.createRadioButtons(); // Создаем радиокнопки после фиксации камеры
    });
  }

  setCameraPositionAndTarget(): void {
    const camera = this.scene.activeCamera as FreeCamera;
    const targetPosition = this.interactionZone.getAbsolutePosition();
    const angle = Math.PI / 2;
    const distance = -1;

    const x = targetPosition.x + distance * Math.sin(angle);
    const z = targetPosition.z + distance * Math.cos(angle);
    const y = targetPosition.y - 0.5;

    camera.position = new Vector3(x, y, z);
    camera.setTarget(targetPosition);
    camera.rotation.x = 0;
  }

  disableCameraMovement(): void {
    const camera = this.scene.activeCamera as FreeCamera;
    camera.detachControl();
  }

  enableCameraMovement(): void {
    const camera = this.scene.activeCamera as FreeCamera;
    camera.attachControl(this.canvas, true);
  }

  createRadioButtons(): void {
    // Создаем панель для размещения радиокнопок
    const radioButtonPanel = new StackPanel();
    radioButtonPanel.isVertical = true; // Горизонтальное расположение кнопок
    radioButtonPanel.width = "100px";
    radioButtonPanel.height = "100%";
    radioButtonPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    radioButtonPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

    this.guiTexture.addControl(radioButtonPanel);

    // Массив для хранения радиокнопок
    const radioButtons: RadioButton[] = [];

    // Создаем 5 радиокнопок с разными отступами
    const paddings = [0, 70, 85, 30, 10]; // Определяем разные отступы между радиокнопками

    for (let i = 0; i < 5; i++) {
        const radioButton = new RadioButton();
        radioButton.width = "30px";
        radioButton.height = "30px";
        radioButton.color = "white";
        radioButton.background = "grey";

        // Текстовая метка для радиокнопки
        const label = new TextBlock();
        label.text = `Вариант ${i + 1}`;
        label.height = "30px";
        label.color = "white";
        label.paddingTop = "5px";
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

        // Создаем StackPanel для радиокнопки и метки
        const radioGroup = new StackPanel();
        radioGroup.isVertical = true;
        radioGroup.width = "120px";

        // Устанавливаем индивидуальные отступы между кнопками
        if (i > 0) {
            radioGroup.paddingTop = `${paddings[i]}px`;
        }

        radioGroup.addControl(radioButton);
        radioGroup.addControl(label);

        radioButtonPanel.addControl(radioGroup); // Добавляем радиогруппу на панель
        radioButtons.push(radioButton);
    }

    // Кнопка для скрытия радиокнопок
    const hideButton = Button.CreateSimpleButton("hideBtn", "Скрыть");
    hideButton.width = "100px";
    hideButton.height = "40px";
    hideButton.color = "white";
    hideButton.background = "red";
    hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    this.guiTexture.addControl(hideButton);

    hideButton.onPointerUpObservable.add(() => {
        this.guiTexture.removeControl(radioButtonPanel); // Убираем радиокнопки
        this.guiTexture.removeControl(hideButton); // Убираем кнопку скрытия
        this.enableCameraMovement(); // Возвращаем возможность управлять камерой
    });
}

setupModalInteraction(): void {
  if (!this.beam) return;

  this.beam.actionManager = new ActionManager(this.scene);

  this.beam.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
      this.canvas.style.cursor = 'pointer';
    })
  );

  this.beam.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
      this.canvas.style.cursor = 'default';
    })
  );

  this.beam.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
      console.log('Beam clicked!'); // Добавьте это для отладки
      if (this.openModal) {
        this.openModal();
      }
    })
  );
}

createRayAboveMesh(mesh: AbstractMesh): void {
  const rayOrigin = mesh.getAbsolutePosition().clone();
  const rayDirection = new Vector3(0, 1, 0);
  const rayLength = 100;

  const ray = new Ray(rayOrigin, rayDirection, rayLength);

  const rayHelper = new RayHelper(ray);
  rayHelper.show(this.scene, new Color3(1, 0, 0));
}

}

