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
    Axis,
    Space,
    Camera,
    Viewport,
    PBRMaterial,
  } from "@babylonjs/core";
  import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { ModelLoader } from "./BaseComponents/ModelLoader";
  
  export class BetoneScene {
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    camera: FreeCamera;
    private guiTexture: AdvancedDynamicTexture;
    private triggerManager: TriggerManager2;
    private guiManager: GUIManager;
    private dialogPage: DialogPage;
    private modelLoader: ModelLoader;
    private zoneTriggered: boolean = false;
    private targetMeshes2: AbstractMesh[];
    private beam2: AbstractMesh;

    private dynamicTexture: DynamicTexture;
    private ctx: CanvasRenderingContext2D;

    private clickCount = 0; // Счётчик всех кликов для цикла
    private clickFour = 0;  // Счётчик внутри цикла (каждый 4 клика)

  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.engine = new Engine(this.canvas, true);
      this.engine.displayLoadingUI();
  
      this.scene = this.CreateScene();
      this.guiManager = new GUIManager(this.scene, this.textMessages);
      this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
      this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
      this.dialogPage = new DialogPage()

      // Инициализация загрузчика моделей
        this.modelLoader = new ModelLoader(this.scene);
  
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
  
      const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
  
      scene.environmentTexture = hdrTexture;
      scene.createDefaultSkybox(hdrTexture, true);
      scene.environmentIntensity = 0.5;
  
      return scene;
    }

      //   CreateController(): void {
  //     // Установка начальной позиции основной камеры для лучшей видимости
  //     this.camera = new FreeCamera("MainCamera", new Vector3(17, 2, 13), this.scene);
  //     this.camera.attachControl(this.canvas, true);
  
  //     this.camera.applyGravity = false;
  //     this.camera.checkCollisions = true;
  //     this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
  //     this.camera.minZ = 0.45;
  //     this.camera.speed = 0.55;
  //     this.camera.angularSensibility = 4000;
  //     this.camera.rotation.y = -Math.PI / 2;
  //     this.camera.keysUp.push(87); // W
  //     this.camera.keysLeft.push(65); // A
  //     this.camera.keysDown.push(83); // S
  //     this.camera.keysRight.push(68); // D
  
  //     // Создание второй камеры для обзора с фиксированного положения
  //     const secondaryCamera = new FreeCamera("SecondaryCamera", new Vector3(20, 2, 13), this.scene);
  //     secondaryCamera.setTarget(Vector3.Zero()); // Устанавливаем направление на центр сцены
  //     // secondaryCamera.mode = Camera.ORTHOGRAPHIC_CAMERA; // Для более статичной перспективы можно использовать ортографический режим
  
  //     // Настройка viewport для второй камеры (маленькое окно в левом верхнем углу)
  //     secondaryCamera.viewport = new Viewport(0, 0.75, 0.25, 0.25); // Позиция и размеры: (x, y, width, height)
  
  //     // Добавление основной и вторичной камер в массив активных камер сцены
  //     this.scene.activeCameras = [this.camera, secondaryCamera];
  // }
  
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


  
  
    async CreateEnvironment(): Promise<void> {
      try {
          this.engine.displayLoadingUI();

          const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD.gltf", this.scene);

          map.forEach((mesh) => {
              mesh.checkCollisions = true;
          });

          const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
          BrokenMeshes.forEach((mesh) => {
              mesh.visibility = 0;
          });

          this.targetMeshes2 = map.filter((mesh) => mesh.name.toLowerCase().includes("rack"));
          this.beam2 = this.targetMeshes2[1];



            await this.modelLoader.loadUltranModel(this.camera)
            const rangefinderMeshes = this.modelLoader.getMeshes('ultra') || [];
            console.log(rangefinderMeshes);


            



        //   const thirdMesh = rangefinderMeshes[2];
        //   const boundingInfo = thirdMesh.getBoundingInfo();
        //   const boundingBox = boundingInfo.boundingBox;
        //   const size = boundingBox.maximum.subtract(boundingBox.minimum);
        //   const width = size.z;
        //   const height = size.y;

        //   const planeWidth = width;
        //   const planeHeight = height;

        //   // Создание DynamicTexture
        //   this.dynamicTexture = new DynamicTexture("DynamicTexture", { width: 512, height: 512 }, this.scene, false);
        //   this.dynamicTexture.hasAlpha = true;

        //   this.ctx = this.dynamicTexture.getContext();
        //   const font = "bold 90px Arial";
        //   this.ctx.font = font;

        //   const maxTextWidth = this.dynamicTexture.getSize().width + 100;

        //   const textMaterial = new StandardMaterial("TextMaterial", this.scene);
        //   textMaterial.diffuseTexture = this.dynamicTexture;
        //   textMaterial.emissiveColor = new Color3(1, 1, 1);
        //   textMaterial.backFaceCulling = false;

        //   const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth - 0.5, height: 3.5 }, this.scene);
        //   textPlane.material = textMaterial;

        //   textPlane.parent = thirdMesh;
        //   textPlane.rotation.x = -Math.PI / 2.3;
        //   textPlane.position = new Vector3(0.015, 7, -9.5);

          console.log("Модели успешно загружены.");
      } catch (error) {
          console.error("Ошибка при загрузке моделей:", error);
      } finally {
          this.engine.hideLoadingUI();
      }
  }

  // Функция для обновления текста с переносом
  updateDynamicText(newText: string) {
      this.ctx.clearRect(0, 0, this.dynamicTexture.getSize().width, this.dynamicTexture.getSize().height);
      this.ctx.font = "bold 80px Arial";

      // Разбиваем текст на строки с учетом ширины
      const lines = this.wrapText(this.ctx, newText, this.dynamicTexture.getSize().width + 100);
      const lineHeight = 90;

      lines.forEach((line, index) => {
          this.ctx.fillStyle = "white";
          this.ctx.fillText(line, 200, 100 + index * lineHeight);
      });

      this.dynamicTexture.update();
  }

  // Функция для разбиения текста на строки с учетом ширины
  wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
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

//   BetonTrigger(): void {
//       const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.");
//       this.guiManager.CreateDialogBox([page1]);

//       const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421);
//       let clickCount = 0;
//       let clickCountText: TextBlock | null = null;

//       const targetMeshForLaser2 = this.beam2;

//       const secondTriggerZone = this.triggerManager.setupZoneTrigger(
//           clickZonePosition,
//           () => {
//               if (!this.zoneTriggered) {
//                   this.zoneTriggered = true;
//                   console.log("Вошли в зону кликов");
//                   this.triggerManager.createStartButton('Начать', () => {
//                       const page2 = this.dialogPage.addText("Переместите мышку в то место, где хотите произвести измерение. На кнопки Q и E вы можете повернуть бетонометр. После нажмите на кнопку для завершения измерения.");
//                       this.guiManager.CreateDialogBox([page2]);

//                       if (this.beam2) {
//                           this.triggerManager.setupClickableMesh(this.beam2, () => {
//                               clickCount++;
//                               const randomValue = Math.floor(Math.random() * (5000 - 4000 + 1)) + 4000;

//                               // Обновляем текст на динамической текстуре
//                               this.updateDynamicText(`\n${randomValue}`);
//                           });

//                           this.triggerManager.activateLaserMode2(this.beam2);
//                           this.triggerManager.createStartButton('Завершить', () => {
//                               const page3 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для перемещения на основную карту");
//                               this.guiManager.CreateDialogBox([page3]);

//                               const totalClicksMessage = new TextBlock();
//                               totalClicksMessage.text = `Вы произвели измерение ${clickCount} раз(а)`;
//                               totalClicksMessage.color = "white";
//                               totalClicksMessage.fontSize = 24;
//                               totalClicksMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//                               totalClicksMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//                               totalClicksMessage.top = "-10%";
//                               this.guiTexture.addControl(totalClicksMessage);

//                               setTimeout(() => {
//                                   this.guiTexture.removeControl(totalClicksMessage);
//                               }, 3000);

//                               if (clickCountText) {
//                                   this.guiTexture.removeControl(clickCountText);
//                                   clickCountText = null;
//                               }
//                               clickCount = 0;

//                               if (this.beam2) {
//                                   this.triggerManager.removeMeshAction(this.beam2);
//                               }

//                               this.triggerManager.exitLaserMode2();
//                               this.guiManager.createRouteButton('/test');
//                           });
//                       }
//                   });
//               }
//           },
//           undefined,
//           20,
//           true
//       );
//   }




BetonTrigger(): void {
    const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421);
    let clickCountText: TextBlock | null = null;

    const targetMeshForLaser2 = this.beam2;

    // Углы вращения по оси Y (пример из кода)
    const rotationXValues = [
        2 * -Math.PI / 3,       // 180 градусов
        -Math.PI / 2,   // 60 градусов
        -Math.PI / 3,   // -60 градусов
        Math.PI 
    ];


    
    const secondTriggerZone = this.triggerManager.setupZoneTrigger(
        clickZonePosition,
        () => {
            if (!this.zoneTriggered) {
                this.zoneTriggered = true;
                console.log("Вошли в зону кликов");

                // Создаем страницу с кнопкой "Начать"
                const startPage = this.dialogPage.createStartPage(
                    "Нажми на кнопку для начала измерения.",
                    "Начать",
                    () => {
                        if (this.beam2) {
                            // Привязываем клик к beam2
                            const imageMeshes = this.modelLoader.getMeshes("image") || [];
                            imageMeshes[1].isVisible = true
                            this.triggerManager.setupClickableMesh(this.beam2, () => {
                                this.clickFour++;
                                this.clickCount++;

                                // Логика вращения второй модели
                                
                                if (imageMeshes.length > 1) {
                                    const targetMesh = imageMeshes[1]; // Предполагается, что это нужный меш
                                    const rotationIndex = (this.clickFour - 1) % rotationXValues.length;
                                    targetMesh.rotation.y = rotationXValues[rotationIndex];
                                    console.log(`Установлен rotation.y: ${rotationXValues[rotationIndex]} для clickFour: ${this.clickFour}`);
                                } else {
                                    console.warn("Меш 'image' или его второй элемент не найден.");
                                }

                                // Генерируем случайное число
                                const randomValue = Math.floor(Math.random() * (5000 - 4000 + 1)) + 4000;

                                // Определяем индекс ячейки для обновления
                                const cellIndex = (this.clickCount - 1) % 4;

                                // Если мы делаем пятый клик (или 9, 13 и т.д.), то сначала сбрасываем все ячейки
                                if (cellIndex === 0 && this.clickCount > 1) {
                                    this.modelLoader.resetAllCells();
                                }

                                // Обновляем нужную ячейку в GUI
                                this.modelLoader.updateCellText(cellIndex, randomValue.toString());

                                // Если 4 клика достигнуты, мы можем ввести дополнительную логику. Например:
                                if (this.clickCount % 4 === 0) {
                                    console.log("Заполнены все 4 ячейки, следующий клик начнет новый цикл.");
                                }

                            });

                            this.triggerManager.activateLaserMode2(this.beam2);

                            // Создаем страницу с кнопкой "Завершить"
                            const finishPage = this.dialogPage.createStartPage(
                                "Переместите мышку в то место, где хотите произвести измерение. На кнопки Q и E вы можете повернуть бетонометр. После нажмите на кнопку для завершения измерения.",
                                "Завершить",
                                () => {
                                    const totalClicksMessage = new TextBlock();
                                    totalClicksMessage.text = `Вы произвели измерение ${this.clickCount} раз(а)`;
                                    totalClicksMessage.color = "white";
                                    totalClicksMessage.fontSize = 24;
                                    totalClicksMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                                    totalClicksMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                                    totalClicksMessage.top = "-10%";
                                    this.guiTexture.addControl(totalClicksMessage);

                                    setTimeout(() => {
                                        this.guiTexture.removeControl(totalClicksMessage);
                                    }, 3000);

                                    if (clickCountText) {
                                        this.guiTexture.removeControl(clickCountText);
                                        clickCountText = null;
                                    }
                                    this.clickCount = 0;
                                    this.clickFour = 0;

                                    if (this.beam2) {
                                        this.triggerManager.removeMeshAction(this.beam2);
                                    }

                                    this.triggerManager.exitLaserMode2();

                                    // Создаем страницу с кнопкой "Перейти на основную карту"
                                    const routePage = this.dialogPage.createStartPage(
                                        "Отлично, а теперь нажмите на кнопку для перемещения на основную карту",
                                        "Перейти на основную карту",
                                        () => {
                                            window.location.href = '/ВыборИнструмента';
                                        }
                                    );

                                    this.guiManager.CreateDialogBox([routePage]);
                                }
                            );

                            this.guiManager.CreateDialogBox([finishPage]);
                        }
                    }
                );

                this.guiManager.CreateDialogBox([startPage]);
            }
        },
        undefined,
        20,
        true
    );
}



}