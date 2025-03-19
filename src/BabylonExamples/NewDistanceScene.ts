import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  AbstractMesh,
  ActionManager,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  DynamicTexture,
  KeyboardEventTypes,
  Ray,
  Observable,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import eventEmitter from "../../EventEmitter";
import { CameraController } from "./BaseComponents/CameraController";

export class NewDistanceScene {
  scene: Scene;
  engine: Engine;
  canvas: HTMLCanvasElement;
  camera: FreeCamera;
  private cameraFPS: CameraController;
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private zoneTriggered: boolean = false;
  private targetMeshes2: AbstractMesh[];
  private beam2: AbstractMesh;
  private nonCollizionMesh: AbstractMesh[]
  private bob: AbstractMesh;

    // Поля для бега (dash) и прыжка (jump)
    private isDash: boolean = false;     // true, когда зажат Shift
    private wantToJump: boolean = false;   // true, когда нажали пробел
    private isJumping: boolean = false;    // true, когда камера не касается земли


  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.dialogPage = new DialogPage();

    this.CreateController();
    // this.cameraFPS = new CameraController(this.scene, this.canvas, "complex")

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      
  });
  
    

    this.BetonTrigger();

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
    // Установка начальной позиции камеры для лучшей видимости
    this.camera = new FreeCamera("camera", new Vector3(50, 2.5, 0), this.scene);
    this.camera.attachControl(this.canvas, true);

    // Общие настройки камеры
    this.camera.applyGravity = true;        // Включаем гравитацию
    this.camera.checkCollisions = true;       // Включаем столкновения (учитываются у мешей, у которых checkCollisions = true)
    this.camera.ellipsoid = new Vector3(0.5, 0.8, 0.5); // Ellipsoid для камеры (важен для определения "ног")
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;                 // Базовая скорость
    this.camera.angularSensibility = 4000;
    this.camera.rotation.y = -Math.PI / 2;
    this.camera.inertia = 0.82;

    // Настройка клавиш (WASD)
    this.camera.keysUp.push(87);    // W
    this.camera.keysLeft.push(65);  // A
    this.camera.keysDown.push(83);  // S
    this.camera.keysRight.push(68); // D

    // Фокусируемся на канвасе
    this.canvas.focus();
    this.setupMovementEvents()
  }

    private setupMovementEvents(): void {
      // Подписка на нажатие/отпускание клавиш
      this.scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
          if (kbInfo.event.code === "ShiftLeft") {
            this.isDash = true;
          }
          if (kbInfo.event.code === "Space") {
            this.wantToJump = true;
          }
        } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
          if (kbInfo.event.code === "ShiftLeft") {
            this.isDash = false;
          }
        }
      });
  
      // Логика, выполняемая каждый кадр перед рендерингом
      this.scene.onBeforeRenderObservable.add(() => {
        // 1. Устанавливаем скорость камеры (учитывая бег)
        this.camera.speed = this.isDash ? 1.1 : 0.55;
  
        // 2. Луч вниз для проверки, находится ли камера на земле
        const rayDown = new Ray(this.camera.position, Vector3.Down(), 10);
        const pickInfo = this.scene.pickWithRay(rayDown, (mesh) => true);
        let onGround = false;
        if (pickInfo?.hit && pickInfo.distance < 2.1) {
          onGround = true;
        }
  
        // 3. Определяем, на земле ли камера
        this.isJumping = !onGround;
  
        // 4. Если хотим прыгнуть и камера на земле, задаём импульс прыжка
        if (this.wantToJump && onGround) {
          // Применяем вертикальный импульс для прыжка
          this.camera.cameraDirection.y += 0.7;
        }
  
        /* 
           5. Если камера на земле, обнуляем вертикальную составляющую направления движения.
           Это предотвращает накопление вертикального компонента при движении назад, если камера наклонена вниз.
           При этом, если был инициирован прыжок, импульс уже добавлен.
        */
        if (onGround && !this.wantToJump) {
          this.camera.cameraDirection.y = 0;
        }
  
        // 6. Сбрасываем флаг желания прыгнуть, чтобы прыжок не повторялся каждый кадр
        this.wantToJump = false;
      });
    }

    async CreateEnvironment(): Promise<void> {
        try {
            this.engine.displayLoadingUI();

            // Загрузка карты
            const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD.gltf", this.scene);

            map.forEach((mesh) => {
                mesh.checkCollisions = true;
                mesh.isPickable = true;
            });

            // const nonCollizionMeshs = ["SM_ConcreteFence_LP.015", "SM_ConcreteFence_LP.030", "SM_0_FencePost_Road.087", "SM_0_FencePost_Road.088"];
            // nonCollizionMeshs.forEach((item) => {
            //     const nonCollizionMesh = map.filter((mesh) => mesh.name === item);
            //     nonCollizionMesh.forEach((mesh) => {
            //         mesh.visibility = 0.5;
            //         mesh.checkCollisions = false;
            //     });
            // });

            const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
            BrokenMeshes.forEach((mesh) => {
                mesh.visibility = 0;
            });

            this.guiManager.createBorderBox()

            this.targetMeshes2 = map.filter((mesh) => mesh.name.toLowerCase().includes("rack"));
            this.beam2 = this.targetMeshes2[1];

            this.nonCollizionMesh = map.filter((mesh) => mesh.name === "SM_0_Road_1_R");
            this.bob = this.nonCollizionMesh[0];

            console.log("Модели успешно загружены.");

            // Загрузка новой модели Rangefinder_LP.glb
            const { meshes: rangefinderMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Rangefinder_LP.glb", this.scene);
            console.log(rangefinderMeshes);

            rangefinderMeshes.forEach((mesh) => {
                // Отзеркаливание по оси Z и масштабирование
                mesh.scaling = new Vector3(3, 3, -3); // Масштабируем в 3 раза и отражаем по Z
                mesh.rotation.y = Math.PI / 3;

                // Закрепление модели за камерой
                mesh.parent = this.camera;

                // Установка позиции относительно камеры
                const offset = new Vector3(-0.7, -0.5, 1.1); // Настройте значения по необходимости
                mesh.position = offset;
                mesh.isPickable = false
            });

            const thirdMesh = rangefinderMeshes[2];

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

            // Обработчики событий
            eventEmitter.on("updateTextPlane", (newText) => {
                if (dynamicTexture) {
                    updateDynamicText(newText);
                }
            });

            eventEmitter.on("updateAngleText", (newText) => {
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
            textPlane.isPickable = false

            // Позиционируем плоскость относительно меша
            textPlane.parent = thirdMesh;
            textPlane.rotation.y = -Math.PI / 2;

            // Компенсируем отражение родителя по оси Z
            textPlane.scaling = new Vector3(-1, 1, 1);

            // Устанавливаем позицию
            textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0); // Смещение по Y (вверх)
        } catch (error) {
            console.error("Ошибка при загрузке моделей:", error);
        } finally {
            this.engine.hideLoadingUI();
        }
    }

    BetonTrigger(): void {

      const page1 = this.dialogPage.addText("Вам нужно измерить длину конструкций которые представлены на третьей странице. Для того чтобы начать измерение нажмите на правую кнопку мыши в месте откуда хотите начать. В этом месте создается ось координат, которая поможет вам правильно определить угол, отображаемый на экране дальномера. Второй раз кликните в том месте где нужно закончить измерение. Появившееся число на дисплее дальномера введите на второй странице. Измерения проводите на правом мосту. Для продолжение нажмите Вперед, для возврата на предыдущую страницу, Назад.");
      const page2 = this.dialogPage.addText("На следующей странице вас ждет таблица из трех колонок. В первой название конструкции, во второй поле куда вводить показания, в третьей кнопка, нажав на которую появится схема этой конструкции. Когда введете все показания, нажмите на кнопку проверить. Зеленым подсветятся правильные измерения, красным неправильные. Как только все поля будут зелеными в планшете появится страничка где можно будет завершить тест");
      
      const ranges = [
        { min: 5.4, max: 5.5 },
        { min: 11.1, max: 11.2 },
        { min: 0.5, max: 0.55 },
        { min: 1.45, max: 1.55 },
        { min: 2.45, max: 2.55 },
        { min: 2.45, max: 2.55 },
        { min: 0.95, max: 1.05 },
        { min: 0.95, max: 1.05 },
        { min: 10.95, max: 11.1 },
        { min: 5.4, max: 5.6 },
        { min: 15.4, max: 15.6 },
      ];
      
      const checkResultObservable = new Observable<{ correctCount: number; total: number }>();
      
      const page3 = this.dialogPage.addInputGridDistance(
        "Конструкции",
        ["Подмостовой габарит", "Ширина проезда", "Высота ограждения", "Ширина ограждения", "Расстояние между стойками ограждения", "Ширина правой полосы безопасности", "Ширина левой полосы безопасности", "Размеры опоры", "Ширина укрепленной поверхности", "Расстояние от края проезда до опоры", "Ширина препятствия, пересекаемой дороги"],
        ["../models/UnderBridge.png", "../models/PassageWidth.png", "../models/HWFence.png", "../models/HWFence.png", "../models/rangeStudy.png", "../models/rangeStudy.png", "../models/rangeStudy.png", "../models/SupportDimensions.png", "../models/WidthOfReinforcedSurface.png", "../models/ObstacleWidth.png", "../models/ObstacleWidth.png"],
        ranges,
        this.guiTexture,
        13,
        checkResultObservable
      );
      
      const endPageResult = this.dialogPage.createStartPage(
        "Здесь появится кнопка позволяющая завершить тест, но только после всех правильных ответов. Нажмите на предыдущей странице 'Проверка' чтобы узнать результат",
        "Завершить",
        () => {
          const routePage = this.dialogPage.createStartPage(
            "Отлично, а теперь нажмите на кнопку для перемещения на основную карту",
            "Перейти на основную карту",
            () => {
              window.location.href = "/ВыборИнструмента";
            }
          );
          this.triggerManager.disableDistanceMeasurement();
          this.triggerManager.exitDisLaserMode2();
          this.guiManager.CreateDialogBox([routePage.rectangle]);
        },
        false // Кнопка изначально невидима
      );
      
      let isButtonShown = false;
      checkResultObservable.add((result) => {
        if (result.correctCount === result.total && !isButtonShown) {
          endPageResult.messageText.text = "Все измерения верны! Нажмите 'Завершить' для продолжения."; // Меняем текст сообщения
          endPageResult.actionButton.isVisible = true; // Показываем кнопку
          isButtonShown = true;
        } else if (result.correctCount !== result.total && isButtonShown) {
          endPageResult.messageText.text = "Для завершения измерений введите корректные значения и нажмите 'Проверка' на предыдущей странице"; // Возвращаем исходный текст
          endPageResult.actionButton.isVisible = false; // Скрываем кнопку
          isButtonShown = false;
        }
      });
      
      this.guiManager.CreateDialogBox([page1, page2, page3, endPageResult.rectangle]);

                

                // Активируем режим лазера для второй триггер-зоны
                this.triggerManager.distanceMode();
                this.triggerManager.enableDistanceMeasurement()
                

    }

}