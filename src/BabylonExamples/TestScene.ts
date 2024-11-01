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
  HighlightLayer,
  Color3,
  EquiRectangularCubeTexture,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control, Image, Rectangle, TextBlock, TextWrapping } from "@babylonjs/gui";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import * as GUI from '@babylonjs/gui/2D';
import { FullExample } from './FullExample';
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";

export class TestScene {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private zoneTriggered: boolean = false;
  private highlightLayer: HighlightLayer;
  private beam: AbstractMesh;
  private beam2: AbstractMesh;
  private targetMeshes: AbstractMesh[];
  private targetMeshes2: AbstractMesh[];
  private markMeshes: AbstractMesh[] = [];
  private zoneSigns: AbstractMesh[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();
  
    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.guiManager = new GUIManager(this.scene);
    this.dialogPage = new DialogPage()
  
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.setupTriggers();     
    });
  
    this.CreateController();
    this.AddScreenshotButton();
    this.AddCameraPositionButton();

    const page1 = this.dialogPage.addText("Привет, на этой карте расположены восклизвтельные знаки. У каждого восклицательного знака тебя ждет задание на измерительный прибор. Подойди к знаку и следуй инструкциям.")
    this.guiManager.CreateDialogBox([page1]);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
  
  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5; // Установите желаемую интенсивность

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
    this.triggerManager.setupCameraKeys(camera);
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();
  
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);

        map.forEach((mesh) => {
        mesh.checkCollisions = true;
          });

          const nonCollizionMeshs = ["SM_ConcreteFence_LP.015", "SM_ConcreteFence_LP.030", "SM_0_FencePost_Road.087", "SM_0_FencePost_Road.088"]
          nonCollizionMeshs.map((item) => {
              const nonCollizionMesh = map.filter((mesh) => mesh.name === item);
              nonCollizionMesh.forEach((mesh) => {
                  mesh.visibility = 0.5;
                  mesh.checkCollisions = false
              });
          })

      // Находим сломаные меши
      const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
      const WholeMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("whole"));

      BrokenMeshes.forEach((mesh) => {
        mesh.visibility = 1; // Полностью видимый
      });
  
      WholeMeshes.forEach((mesh) => {
        mesh.visibility = 0; // Полностью невидимый
      });

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

  setupTriggers(): void {
    // Проверяем, что markMeshes загружены
    if (this.markMeshes && this.markMeshes.length > 0) {
        const markMeshTemplate = this.markMeshes[0]; // Используем первый mesh как шаблон
        

        // Создаем массив для хранения ссылок на знаки в зонах
        this.zoneSigns = [];

        // --- Первый триггер-зона ---
        const firstZonePosition = new Vector3(-10.622146207334794, 8.8, -3.62);
        const firstZoneSign = markMeshTemplate.clone("firstZoneSign");
        firstZoneSign.position = firstZonePosition.clone();
        firstZoneSign.position.y = 6; 
        firstZoneSign.isVisible = true;

        this.scene.addMesh(firstZoneSign);
        this.zoneSigns.push(firstZoneSign);

        const firstTriggerZone = this.triggerManager.setupZoneTrigger(
            firstZonePosition,
            () => {
              const page2 = this.dialogPage.addText("Здесь тебя ждет обучение по использованию дальнометра. Нажми на кнопку для перемещения в зону теста.")
              this.guiManager.CreateDialogBox([page2]);
                console.log("Вошли в первую зону");
                this.guiManager.createRouteButton('/distance'); // Создание кнопки с маршрутом
                if (firstZoneSign) {
                    firstZoneSign.dispose();
                }
            },
            undefined, // onExitZone
            2 // camSize
        );

        // --- Вторая триггер-зона ---
        const secondZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421);
        const secondZoneSign = markMeshTemplate.clone("secondZoneSign");
        secondZoneSign.position = secondZonePosition.clone();
        secondZoneSign.position.y = -1;
        secondZoneSign.isVisible = true;

        this.scene.addMesh(secondZoneSign);
        this.zoneSigns.push(secondZoneSign);

        const secondTriggerZone = this.triggerManager.setupZoneTrigger(
            secondZonePosition,
            () => {
              const page3 = this.dialogPage.addText("Здесь тебя ждет использование бетонометра (я не помню как он называется). Нажми на кнопку для перемещения в зону теста.")
              this.guiManager.CreateDialogBox([page3]);
                console.log("Вошли во вторую зону");
                this.guiManager.createRouteButton('/beton'); // Создание кнопки с маршрутом
                if (secondZoneSign) {
                    secondZoneSign.dispose();
                }
            },
            undefined, // onExitZone
            5 // camSize
        );

        // --- Третий триггер-зона ---
        const thirdZonePosition = new Vector3(12.46, 2.0, 4.79);
        const thirdZoneSign = markMeshTemplate.clone("thirdZoneSign");
        thirdZoneSign.position = thirdZonePosition.clone();
        thirdZoneSign.position.y = -1;
        thirdZoneSign.isVisible = true;

        this.scene.addMesh(thirdZoneSign);
        this.zoneSigns.push(thirdZoneSign);

        const thirdTriggerZone = this.triggerManager.setupZoneTrigger(
            thirdZonePosition,
            () => {
              const page3 = this.dialogPage.addText("Здесь тебя ждет использование линейки и штангенциркуля. Нажми на кнопку для перемещения в зону теста.")
              this.guiManager.CreateDialogBox([page3]);
                console.log("Вошли в третью зону");
                this.guiManager.createRouteButton('/full'); // Создание кнопки с маршрутом
                if (thirdZoneSign) {
                    thirdZoneSign.dispose();
                }
            },
            undefined, // onExitZone
            3 // camSize
        );

        // --- Четвертая триггер-зона ---
        const fourthZonePosition = new Vector3(41.14320937858243, 2.670984252631138, -0.04211929133677441);
        const fourthZoneSign = markMeshTemplate.clone("fourthZoneSign");
        fourthZoneSign.position = fourthZonePosition.clone();
        fourthZoneSign.position.y = -1;
        fourthZoneSign.isVisible = true;

        this.scene.addMesh(fourthZoneSign);
        this.zoneSigns.push(fourthZoneSign);

        const fourthTriggerZone = this.triggerManager.setupZoneTrigger(
            fourthZonePosition,
            () => {
              const page4 = this.dialogPage.addText("Здесь тебя ждет использование дальнометра. Нажми на кнопку для перемещение в зону теста.")
              this.guiManager.CreateDialogBox([page4]);
                console.log("Вошли в четвертую зону");
                this.guiManager.createRouteButton('/newdistance'); // Создание кнопки с маршрутом
                if (fourthZoneSign) {
                    fourthZoneSign.dispose();
                }
            },
            undefined, // onExitZone
            3 // camSize
        );
    } else {
        console.error("markMeshes не загружены или пусты.");
    }
}

      // Метод для отображения кнопки перехода
      showGoToFullExampleButton(): void {
        const goButton = Button.CreateSimpleButton("goToFullExample", "Go to FullExample Page");
        goButton.width = "150px";
        goButton.height = "60px";
        goButton.color = "white";
        goButton.background = "green";
        
        // Настройка события клика
        goButton.onPointerUpObservable.add(() => {
            // Переход на страницу при клике
            window.location.href = "/full";  // Либо используйте навигацию Link в реакте
        });
        
        // Добавляем кнопку в интерфейс
        this.guiTexture.addControl(goButton);
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