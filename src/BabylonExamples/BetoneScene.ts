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



        //   const { meshes: rangefinderMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "UltrasonicTester_LP2.glb", this.scene);
        //   console.log(rangefinderMeshes);
        //   rangefinderMeshes.forEach((mesh) => {
        //       mesh.scaling = new Vector3(-0.05, 0.05, 0.05);
        //       mesh.rotation.y = Math.PI / 2;

        //       mesh.parent = this.camera;
        //       const offset = new Vector3(-0.7, -0.6, 1.1);
        //       mesh.position = offset;

        //       mesh.rotate(Axis.X, Math.PI / 2, Space.LOCAL);
        //       mesh.rotate(Axis.Z, Math.PI / 6, Space.LOCAL);

        //       if (mesh.material) {
        //         simplifyMaterial(mesh.material, this.scene);
        //     }
        //   });
        //   function simplifyMaterial(material, scene) {
        //     if (material instanceof PBRMaterial) {
        //         // Для PBR материалов
        //         material.metallic = 0; // Убираем металлические отражения
        //         material.roughness = 1; // Максимальная шероховатость для минимальных бликов
        
        //         // Отключение карт, добавляющих сложность
        //         material.metallicTexture = null;
        //         material.roughnessTexture = null;
        //         material.reflectivityTexture = null;
        //         material.bumpTexture = null; // Отключение нормальной карты, если не нужна
        
        //         // Отключение эмиссии, если она используется
        //         material.emissiveColor = new Color3(0, 0, 0);
        
        //     } else if (material instanceof StandardMaterial) {
        //         // Для Standard материалов
        //         material.specularColor = new Color3(0, 0, 0); // Убираем блики
        
        //         // Отключение карт, добавляющих сложность
        //         material.specularTexture = null;
        //         material.bumpTexture = null; // Отключение нормальной карты, если не нужна
        
        //         // Отключение эмиссии, если она используется
        //         material.emissiveColor = new Color3(0, 0, 0);
        //     } else {
        //         // Для других типов материалов, если необходимо
        //         console.warn("Неизвестный тип материала:", material.getClassName());
        //     }
        
        //     // Дополнительные настройки, если необходимо
        //     // Например, можно установить diffuseColor или другие свойства
        //     // material.diffuseColor = new Color3(0.8, 0.8, 0.8); // Опционально
        //     }

            await this.modelLoader.loadUltranModel(this.camera)
            const rangefinderMeshes = this.modelLoader.getMeshes('ultra') || [];
            console.log(rangefinderMeshes);


            



          const thirdMesh = rangefinderMeshes[2];
          const boundingInfo = thirdMesh.getBoundingInfo();
          const boundingBox = boundingInfo.boundingBox;
          const size = boundingBox.maximum.subtract(boundingBox.minimum);
          const width = size.z;
          const height = size.y;

          const planeWidth = width;
          const planeHeight = height;

          // Создание DynamicTexture
          this.dynamicTexture = new DynamicTexture("DynamicTexture", { width: 512, height: 512 }, this.scene, false);
          this.dynamicTexture.hasAlpha = true;

          this.ctx = this.dynamicTexture.getContext();
          const font = "bold 90px Arial";
          this.ctx.font = font;

          const maxTextWidth = this.dynamicTexture.getSize().width + 100;

          const textMaterial = new StandardMaterial("TextMaterial", this.scene);
          textMaterial.diffuseTexture = this.dynamicTexture;
          textMaterial.emissiveColor = new Color3(1, 1, 1);
          textMaterial.backFaceCulling = false;

          const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth - 0.5, height: 3.5 }, this.scene);
          textPlane.material = textMaterial;

          textPlane.parent = thirdMesh;
          textPlane.rotation.x = -Math.PI / 2.3;
          textPlane.position = new Vector3(0.015, 7, -9.5);

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
    let clickCount = 0;
    let clickFour = 0
    let clickCountText: TextBlock | null = null;

    const targetMeshForLaser2 = this.beam2;

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
                            this.triggerManager.setupClickableMesh(this.beam2, () => {
                                clickFour++
                                
                                const randomValue = Math.floor(Math.random() * (5000 - 4000 + 1)) + 4000;

                                if (clickFour === 4) {
                                // Обновляем текст на динамической текстуре
                                this.updateDynamicText(`\n${randomValue}`);
                                clickCount++;
                                clickFour = 0
                                }


                            });

                            this.triggerManager.activateLaserMode2(this.beam2);

                            // Создаем страницу с кнопкой "Завершить"
                            const finishPage = this.dialogPage.createStartPage(
                                "Переместите мышку в то место, где хотите произвести измерение. На кнопки Q и E вы можете повернуть бетонометр. После нажмите на кнопку для завершения измерения.",
                                "Завершить",
                                () => {
                                    const totalClicksMessage = new TextBlock();
                                    totalClicksMessage.text = `Вы произвели измерение ${clickCount} раз(а)`;
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
                                    clickCount = 0;

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