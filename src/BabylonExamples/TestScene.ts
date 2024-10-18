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

export class TestScene {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  zone: number[] = [-10.622146207334794, 8.8, -3.62];
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private zoneTriggered: boolean = false;
  private highlightLayer: HighlightLayer;
  private beam: AbstractMesh;
  private beam2: AbstractMesh;
  private targetMeshes: AbstractMesh[];
  private targetMeshes2: AbstractMesh[];

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();
  
    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);
  
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.setupTriggers();
    });
  
    this.CreateController();
  

    // this.CreateDialogBox();
  
    this.AddScreenshotButton();
    // this.AddCameraPositionButton();
  
    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.triggerManager.updateRayIntersection();
    });
  }
  
  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    // const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    // hemiLight.intensity = 0.5; // Установите желаемую интенсивность

    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    const hdrTexture = new HDRCubeTexture("/models/test_5.hdr", scene, 512);

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 1;

    return scene;
  }


//   CreateScene(): Scene {
//     const scene = new Scene(this.engine);
//     const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
//         hemiLight.intensity = 0.3; // Установите желаемую интенсивность

//     const framesPerSecond = 60;
//     const gravity = -9.81;
//     scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//     scene.collisionsEnabled = true;

//     // Загрузка панорамной JPEG-текстуры для окружения
//     const equirectangularTexture = new EquiRectangularCubeTexture(
//         "/models/test_4.jpg",
//         scene,
//         512,
//         false,
//         true // gammaSpace
//     );

//     scene.environmentTexture = equirectangularTexture;
//     scene.environmentIntensity = 1.0; // Настройте интенсивность по необходимости

//     // Создание skybox с использованием панорамной текстуры
//     scene.createDefaultSkybox(equirectangularTexture, true, 50000, undefined, false);

//     return scene;
// }


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

          

      // Находим сломаные меши
      this.BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
      this.WholeMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("whole"));

      this.BrokenMeshes.forEach((mesh) => {
        mesh.visibility = 1; // Полностью видимый
      });
  
      this.WholeMeshes.forEach((mesh) => {
        mesh.visibility = 0; // Полностью невидимый
      });
    
      const keywords = ["beam", "rack", "stairs", "wall", "stand", "anchor", "console", "wave", "fenctrack", "column", "rostverc", "support", "whole"];
      let clickedMeshes = 0;
      const totalMeshes = keywords.length;
      
      // Создаем текст для отображения счетчика в Babylon.js
      const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
      const counterText = new GUI.TextBlock();
      counterText.text = `0 из ${totalMeshes}`;
      counterText.color = "white";
      counterText.fontSize = 24;
      counterText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      counterText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      counterText.paddingRight = "20px";
      counterText.paddingTop = "20px";
      advancedTexture.addControl(counterText);
      
      // Функция для обновления счетчика
      const updateCounter = () => {
        counterText.text = `${clickedMeshes} из ${totalMeshes}`;
      };
      
      // Инициализация мешей и взаимодействий
      keywords.forEach((keyword) => {
        const targetMesh = map.find((mesh) => mesh.name.toLowerCase().includes(keyword));
        
        
        if (targetMesh) {
          // Добавляем подсветку
          this.highlightLayer.addMesh(targetMesh, Color3.Green());
      
          // Устанавливаем флаг активности
          targetMesh.isActive = true;
      
          // Настраиваем взаимодействие
          this.triggerManager.setupModalInteraction(targetMesh, () => {
            if (!targetMesh.isActive) {
              // Если меш уже не активен, ничего не делаем
              return;
            }
      
            console.log(`${keyword} right-clicked!`);
      
            if (this.openModal) {
              // Открываем модальное окно с ключевым словом
              this.openModal(keyword);
            }
      
            // Увеличиваем счетчик кликов
            clickedMeshes++;
            updateCounter();
      
            // Отключаем подсветку
            this.highlightLayer.removeMesh(targetMesh);
      
            // Деактивируем меш, чтобы больше не реагировал на клики
            targetMesh.isActive = false;
      
            // Удаляем все действия, связанные с кликами
            if (targetMesh.actionManager) {
              targetMesh.actionManager.actions = [];
            }
          });
        }
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
                              4,
                              0,
                              targetPosition
                          );
                          this.triggerManager.createRadioButtons(() => {
                            this.triggerManager.setCameraPositionAndTarget(
                              Math.PI / 2,
                              -1,
                              0,
                              targetPosition
                            );
                            this.triggerManager.enableCameraMovement();
                          });
                      });
                  }
              },
              undefined, // onExitZone
              2 // camSize
              // Не передаем markMeshTemplate и markMeshHeight, так как знак мы уже создали вручную
          );

          // --- Второй триггер (с отображением знака и лазером) ---

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
    let clickCountText: TextBlock | null = null;

    // Предположим, что beam2 — это меш, с которым будем взаимодействовать в режиме лазера
    const targetMeshForLaser2 = this.beam2; // Убедитесь, что this.beam2 инициализирован

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

          // Активируем режим лазера для второй триггер-зоны
          this.triggerManager.activateLaserMode2(this.beam2);
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
        totalClicksMessage.top = "-10%";
        this.guiTexture.addControl(totalClicksMessage);

        // Удаляем сообщение через 3 секунды
        setTimeout(() => {
          this.guiTexture.removeControl(totalClicksMessage);
        }, 3000);

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

        // Деактивируем режим лазера для второй триггер-зоны
        this.triggerManager.exitLaserMode2();
      },
      10 // camSize
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