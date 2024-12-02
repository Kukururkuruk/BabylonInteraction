import {
    Scene,
    Engine,
    SceneLoader,
    Vector3,
    HemisphericLight,
    HDRCubeTexture,
    FreeCamera,
    AbstractMesh,
    MeshBuilder,
    Color3,
    StandardMaterial,
    DynamicTexture,
  } from "@babylonjs/core";
  import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
  
  export class BetoneScene {
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    camera: FreeCamera;
    private guiTexture: AdvancedDynamicTexture;
    private triggerManager: TriggerManager2;
    private guiManager: GUIManager;
    private dialogPage: DialogPage;
    private zoneTriggered: boolean = false;
    private targetMeshes2: AbstractMesh[];
    private beam2: AbstractMesh;

  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.engine = new Engine(this.canvas, true);
      this.engine.displayLoadingUI();
  
      this.scene = this.CreateScene();
      this.guiManager = new GUIManager(this.scene, this.textMessages);
      this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
      this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
      this.dialogPage = new DialogPage()
  
      this.CreateEnvironment().then(() => {
        this.engine.hideLoadingUI();
        
    });
    
      this.CreateController();

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
      this.camera = new FreeCamera("camera", new Vector3(17, 2, 13), this.scene);
      this.camera.attachControl(this.canvas, true);
  
      this.camera.applyGravity = false;
      this.camera.checkCollisions = true;
      this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
      this.camera.minZ = 0.45;
      this.camera.speed = 0.55;
      this.camera.angularSensibility = 4000;
      this.camera.rotation.y = -Math.PI/2
      this.camera.keysUp.push(87); // W
      this.camera.keysLeft.push(65); // A
      this.camera.keysDown.push(83); // S
      this.camera.keysRight.push(68); // D
    }
  
    async CreateEnvironment(): Promise<void> {
      try {
        this.engine.displayLoadingUI();
  
        const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
  
        map.forEach((mesh) => {
          mesh.checkCollisions = true;
        });

        const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
        BrokenMeshes.forEach((mesh) => {
            mesh.visibility = 0;
        });

        this.targetMeshes2 = map.filter((mesh) => mesh.name.toLowerCase().includes("rack"));
        this.beam2 = this.targetMeshes2[1];


        // Загрузка новой модели Rangefinder_LP.glb
        const { meshes: rangefinderMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "UltrasonicTester_LP2.glb", this.scene);
        console.log(rangefinderMeshes);

        rangefinderMeshes.forEach((mesh) => {
            // Отзеркаливание по оси Z и масштабирование
            mesh.scaling = new Vector3(-0.1, 0.1, 0.1); // Масштабируем в 3 раза и отражаем по Z
            mesh.rotation.x = Math.PI / 2;

            // Закрепление модели за камерой
            mesh.parent = this.camera;

            // Установка позиции относительно камеры
            const offset = new Vector3(-0.7, -0.5, 1.1); // Настройте значения по необходимости
            mesh.position = offset;
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

        // // Обработчики событий
        // eventEmitter.on("updateTextPlane", (newText) => {
        //     if (dynamicTexture) {
        //         updateDynamicText(newText);
        //     }
        // });

        // eventEmitter.on("updateAngleText", (newText) => {
        //     if (dynamicTexture) {
        //         updateDynamicText(newText);
        //     }
        // });

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
        textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0); // Смещение по Y (вверх)

  
        console.log("Модели успешно загружены.");
      } catch (error) {
        console.error("Ошибка при загрузке моделей:", error);
      } finally {
        this.engine.hideLoadingUI();
      }
    }

    BetonTrigger(): void {

        const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
        this.guiManager.CreateDialogBox([page1]);

        const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421);
        let clickCount = 0;
        let clickCountText: TextBlock | null = null;
    
        // Предположим, что beam2 — это меш, с которым будем взаимодействовать в режиме лазера
        const targetMeshForLaser2 = this.beam2; // Убедитесь, что this.beam2 инициализирован
    
        // Создаем вторую триггер-зону
        const secondTriggerZone = this.triggerManager.setupZoneTrigger(
          clickZonePosition,
          () => {
            if (!this.zoneTriggered) {
                this.zoneTriggered = true;
                console.log("Вошли в зону кликов");
                this.triggerManager.createStartButton('Начать', () => {

                const page2 = this.dialogPage.addText("Переместите мышку в то место шде хотите произвести измерение. На кнопки Q и E вы можете повернуть бетонометр. После нажмите на кнопку для завершения измерения")
                this.guiManager.CreateDialogBox([page2]);
        
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
                      clickCountText.isHitTestVisible = false;
                      this.guiTexture.addControl(clickCountText);
                    } else {
                      clickCountText.text = `Клики: ${clickCount}`;
                    }
                  });
        
                  // Активируем режим лазера для второй триггер-зоны
                  this.triggerManager.activateLaserMode2(this.beam2);
                  this.triggerManager.createStartButton('Завершить', () => {

                    const page3 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для премещение на основную карту")
                    this.guiManager.CreateDialogBox([page3]);

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
                    this.guiManager.createRouteButton('/test')
                })
                }
                
                })
        
            }

          },
          undefined,
          20, // camSize
          true
          // Не передаем markMeshTemplate и markMeshHeight, так как знак мы уже создали вручную
        );
  
    }
}