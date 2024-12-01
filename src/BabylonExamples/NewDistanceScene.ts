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
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import eventEmitter from "../../EventEmitter";

export class NewDistanceScene {
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
  private nonCollizionMesh: AbstractMesh[]
  private bob: AbstractMesh;


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
    this.camera = new FreeCamera("camera", new Vector3(17, 2, 13), this.scene);
    this.camera.attachControl(this.canvas, true);

    this.camera.applyGravity = true;
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






  // async CreateEnvironment(): Promise<void> {
  //   try {
  //     this.engine.displayLoadingUI();
  
  //     // Загрузка карты
  //     const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
  
  //     map.forEach((mesh) => {
  //       mesh.checkCollisions = true;
  //       mesh.isPickable = true;
  //     });
  
  //     const nonCollizionMeshs = ["SM_ConcreteFence_LP.015", "SM_ConcreteFence_LP.030", "SM_0_FencePost_Road.087", "SM_0_FencePost_Road.088"];
  //     nonCollizionMeshs.forEach((item) => {
  //       const nonCollizionMesh = map.filter((mesh) => mesh.name === item);
  //       nonCollizionMesh.forEach((mesh) => {
  //         mesh.visibility = 0.5;
  //         mesh.checkCollisions = false;
  //       });
  //     });
  
  //     const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
  //     BrokenMeshes.forEach((mesh) => {
  //       mesh.visibility = 0;
  //     });
  
  //     this.targetMeshes2 = map.filter((mesh) => mesh.name.toLowerCase().includes("rack"));
  //     this.beam2 = this.targetMeshes2[1];
  
  //     this.nonCollizionMesh = map.filter((mesh) => mesh.name === "SM_0_Road_1_R");
  //     this.bob = this.nonCollizionMesh[0];
  
  //     console.log("Модели успешно загружены.");
  
  //     // Загрузка новой модели Rangefinder_LP.glb
  //     const { meshes: rangefinderMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Rangefinder_LP.glb", this.scene);
  //     console.log(rangefinderMeshes);
       


  //     rangefinderMeshes.forEach((mesh) => {
  //       // Отзеркаливание по оси X
  //       // mesh.scaling.z *= -1;
  //       // Установка масштаба
  //       mesh.scaling = new Vector3(3, 3, -3); // Увеличиваем в 3 раза, как было в запросе
  //       mesh.rotation.y = Math.PI / 3
      
  //       // // Закрепление модели за камерой
  //       mesh.parent = this.camera;
      
  //       // Установка позиции относительно камеры
  //       const offset = new Vector3(-0.7, -0.5, 1.1); // Настройте значения по необходимости
  //       mesh.position = offset;
  //     });


  //     const thirdMesh = rangefinderMeshes[2];

  //         // Получение размеров меша
  //   const boundingInfo = thirdMesh.getBoundingInfo();
  //   const boundingBox = boundingInfo.boundingBox;
  //   const size = boundingBox.maximum.subtract(boundingBox.minimum);
  //   const width = size.z;
  //   const height = size.y;

  //   // Определение размеров плоскости
  //   const planeWidth = width; // Ширина плоскости равна ширине меша
  //   const planeHeight = height; // Высота плоскости — 20% от высоты меша (можно настроить по необходимости)


  //     const dynamicTexture = new DynamicTexture("DynamicTexture", { width: 512, height: 256 }, this.scene, false);
  //     dynamicTexture.hasAlpha = true;

  //     eventEmitter.on("updateTextPlane", (newText: string) => {
  //       if (dynamicTexture) {
  //           // Очистка всей текстуры
  //           dynamicTexture.getContext().clearRect(0, 0, dynamicTexture.getSize().width, dynamicTexture.getSize().height);
  //           dynamicTexture.update();
            
  //           // Рисование нового текста
  //           dynamicTexture.drawText(newText, 50, 100, "bold 48px Arial", "white", "transparent");
  //       }
  //   });

  //   eventEmitter.on("updateAngleText", (newText: string) => {
  //     if (dynamicTexture) {
  //         // Очистка всей текстуры
  //         dynamicTexture.getContext().clearRect(0, 0, dynamicTexture.getSize().width, dynamicTexture.getSize().height);
  //         dynamicTexture.update();
          
  //         // Рисование нового текста углов
  //         dynamicTexture.drawText(newText, 50, 100, "bold 48px Arial", "white", "transparent");

  //         // Здесь можно добавить таймер для скрытия текста углов, если требуется
  //     }
  // });

  //     const textMaterial = new StandardMaterial("TextMaterial", this.scene);
  //     textMaterial.diffuseTexture = dynamicTexture;
  //     textMaterial.emissiveColor = new Color3(1, 1, 1); // Делает текст ярким
  //     textMaterial.backFaceCulling = false; // Текст виден с обеих сторон

  //     const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth, height: planeHeight }, this.scene);
  //     textPlane.material = textMaterial;

  //     // Позиционируем плоскость относительно меша
  //     textPlane.parent = thirdMesh;
  //     textPlane.rotation.y = -Math.PI / 2
  //     textPlane.scaling = new Vector3(-1, 1, 1);
  //     textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0); // Смещение по Y (вверх)
      






  
  //   } catch (error) {
  //     console.error("Ошибка при загрузке моделей:", error);
  //   } finally {
  //     this.engine.hideLoadingUI();
  //   }
  // }


  

  async CreateEnvironment(): Promise<void> {
    try {
        this.engine.displayLoadingUI();

        // Загрузка карты
        const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);

        map.forEach((mesh) => {
            mesh.checkCollisions = true;
            mesh.isPickable = true;
        });

        const nonCollizionMeshs = ["SM_ConcreteFence_LP.015", "SM_ConcreteFence_LP.030", "SM_0_FencePost_Road.087", "SM_0_FencePost_Road.088"];
        nonCollizionMeshs.forEach((item) => {
            const nonCollizionMesh = map.filter((mesh) => mesh.name === item);
            nonCollizionMesh.forEach((mesh) => {
                mesh.visibility = 0.5;
                mesh.checkCollisions = false;
            });
        });

        const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
        BrokenMeshes.forEach((mesh) => {
            mesh.visibility = 0;
        });

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





  // BetonTrigger(): void {
  //     const fullText1 = "Нажми на кнопку для начала измерения.";
  //     const fullText2 = "Переместите мышку в то место шде хотите произвести измерение. На кнопки Q и E вы можете повернуть бетонометр. После нажмите на кнопку для завершения измерения";
  //     const fullText3 = "Отлично, а теперь нажмите на кнопку для премещение на основную карту";
  //     this.guiManager.CreateDialogBox(fullText1)
  //     const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421);
  //     let clickCount = 0;
  //     let clickCountText: TextBlock | null = null;
  
  //     // Предположим, что beam2 — это меш, с которым будем взаимодействовать в режиме лазера
  //     const targetMeshForLaser2 = this.bob; // Убедитесь, что this.beam2 инициализирован
      
  //     // Создаем вторую триггер-зону
  //     const secondTriggerZone = this.triggerManager.setupZoneTrigger(
  //       clickZonePosition,
  //       () => {
  //         if (!this.zoneTriggered) {
  //             this.zoneTriggered = true;
  //             this.triggerManager.createStartButton('Начать', () => {
  //             // Показываем сообщение
  //             this.guiManager.CreateDialogBox(fullText2)
      
  //             // Активируем взаимодействие с beam2
  //             if (this.bob) {
  //               this.triggerManager.setupClickableMesh(this.bob, () => {
  //                 clickCount++;
  //                 // Обновляем или создаем текст с количеством кликов
  //                 if (!clickCountText) {
  //                   clickCountText = new TextBlock();
  //                   clickCountText.text = `Клики: ${clickCount}`;
  //                   clickCountText.color = "white";
  //                   clickCountText.fontSize = 24;
  //                   clickCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  //                   clickCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  //                   clickCountText.top = "100px";
  //                   clickCountText.right = "20px";
  //                   clickCountText.isHitTestVisible = false;
  //                   this.guiTexture.addControl(clickCountText);
  //                 } else {
  //                   clickCountText.text = `Клики: ${clickCount}`;
  //                 }
  //               });
      
  //               // Активируем режим лазера для второй триггер-зоны
  //               this.triggerManager.distanceMode();
  //               this.triggerManager.enableDistanceMeasurement()
  //               this.triggerManager.createStartButton('Завершить', () => {
  //                 this.guiManager.CreateDialogBox(fullText3)
  //                 // Показываем сообщение с общим количеством кликов
  //                 const totalClicksMessage = new TextBlock();
  //                 totalClicksMessage.text = `Вы кликнули ${clickCount} раз(а)`;
  //                 totalClicksMessage.color = "white";
  //                 totalClicksMessage.fontSize = 24;
  //                 totalClicksMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  //                 totalClicksMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  //                 totalClicksMessage.top = "-10%";
  //                 this.guiTexture.addControl(totalClicksMessage);
          
  //                 // Удаляем сообщение через 3 секунды
  //                 setTimeout(() => {
  //                   this.guiTexture.removeControl(totalClicksMessage);
  //                 }, 3000);
          
  //                 // Очищаем
  //                 if (clickCountText) {
  //                   this.guiTexture.removeControl(clickCountText);
  //                   clickCountText = null;
  //                 }
  //                 clickCount = 0;
          
  //                 // Отключаем взаимодействие с beam2
  //                 if (this.bob) {
  //                   this.triggerManager.removeMeshAction(this.bob);
  //                 }
          
  //                 // Деактивируем режим лазера для второй триггер-зоны
  //                 this.triggerManager.exitDisLaserMode2();
  //                 this.guiManager.createRouteButton('/test')
  //             })
  //             }
              
  //             })
      
  //         }

  //       },
  //       undefined,
  //       20, // camSize
  //       // Не передаем markMeshTemplate и markMeshHeight, так как знак мы уже создали вручную
  //     );

  // }

  BetonTrigger(): void {
    const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
    this.guiManager.CreateDialogBox([page1])

            this.triggerManager.createStartButton('Начать', () => {
            // Показываем сообщение
            const page2 = this.dialogPage.addText("Вам нужно измерить длину конструкций которые представлены на второй странице. Для того чтобы начать измерение нажмите на правую кнопку мыши в месте откуда хотите начать. Второй раз кликните в том месте где нужно закончить измерение. Появившуюся цифру введите на второй странице")
            const page3 = this.dialogPage.addInputGrid("Конструкции", ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"])
            this.guiManager.CreateDialogBox([page2, page3])

              // Активируем режим лазера для второй триггер-зоны
              this.triggerManager.distanceMode();
              this.triggerManager.enableDistanceMeasurement()
              this.triggerManager.createStartButton('Завершить', () => {
                const page4 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для премещение на основную карту")
                this.guiManager.CreateDialogBox([page4])
                this.triggerManager.disableDistanceMeasurement()

                this.triggerManager.exitDisLaserMode2();
                this.guiManager.createRouteButton('/test')
            })

            
            })

}

}