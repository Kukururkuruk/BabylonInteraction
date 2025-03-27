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
    Observable,
  } from "@babylonjs/core";
  import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { ModelLoader } from "./BaseComponents/ModelLoader";
  
  export class BetoneBaseScene {
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
      this.camera = new FreeCamera("camera", new Vector3(17, 2, -13), this.scene);
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
    
            const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_7.gltf", this.scene);
            map.forEach((mesh) => {
                mesh.checkCollisions = true;
            });
    
            const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
            BrokenMeshes.forEach((mesh) => {
                mesh.visibility = 0;
            });
    
            // Фильтруем все меши, которые нам нужны
            this.targetMeshes2 = map.filter((mesh) => 
                mesh.name === "SM_0_MonolithicRack_L_Rostverc" ||
                mesh.name === "SM_0_MonolithicRack_L_Column" ||
                mesh.name === "SM_0_MonolithicRack_L" ||
                mesh.name === "SM_0_TransitionPlate8M_LP_L_primitive0" ||
                mesh.name === "SM_0_Retaining_wall_Block_LP_L" ||
                mesh.name.match(/^SM_0_BlockBevel_LP_L_5_1_primitive\d$/) ||
                mesh.name === "SM_0_Stand_L" ||
                mesh.name === "SM_0_MonolithicRack_L_Support" ||
                mesh.name.match(/^SM_0_SpanStructureBeam_[RL]_\d$/)
            );
            console.log(this.targetMeshes2);
            
    
            await this.modelLoader.loadUltraModel();
            await this.modelLoader.loadUltranModel(this.camera);
            const rangefinderMeshes = this.modelLoader.getMeshes('ultra') || [];
            console.log("Рейки загружены:", rangefinderMeshes);
    
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
    const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, -13.477405516648421);
    let clickCountText: TextBlock | null = null;

    const rotationXValues = [
        2 * -Math.PI / 3, // 180 градусов
        -Math.PI / 2,     // 60 градусов
        -Math.PI / 3,     // -60 градусов
        Math.PI,          // 0 градусов
    ];

    // Изначально массив из 4 пустых значений для randomValues
    let randomValues: string[] = ["", "", "", ""];
    // Новый массив для textBlock2
    let textBlock2Values: string[] = ["", "", "", ""]; // Изначально 4 пустые строки

    // Функция для определения параметров в зависимости от имени меша
    const getMeshParams = (meshName: string): { randomMin: number; randomMax: number; textBlock1Value: string } => {
        if (meshName === "SM_0_MonolithicRack_L_Rostverc" ||
            meshName === "SM_0_MonolithicRack_L_Column" ||
            meshName === "SM_0_MonolithicRack_L" ||
            meshName === "SM_0_Retaining_wall_Block_LP_L" ||
            meshName === "SM_0_BlockBevel_LP_L_5_1" ||
            meshName === "SM_0_Stand_L" ||
            meshName === "SM_0_MonolithicRack_L_Support" ||
            meshName.match(/^SM_0_SpanStructureBeam_[RL]_\d$/)
        ) {
            return { randomMin: 4090, randomMax: 4170, textBlock1Value: "38.35" };
        } else if (meshName === "sm_0_transitionplate8m_lp_l_primitive0") {
            return { randomMin: 3650, randomMax: 3760, textBlock1Value: "32.11" };
        }
        return { randomMin: 4090, randomMax: 4170, textBlock1Value: "38.35" };
    };

    const secondTriggerZone = this.triggerManager.setupZoneTrigger(
        clickZonePosition,
        () => {
            if (!this.zoneTriggered) {
                this.zoneTriggered = true;
                console.log("Вошли в зону кликов");

                const startPage = this.dialogPage.createStartPage(
                    "Нажми на кнопку для начала измерения.",
                    "Начать",
                    () => {
                        if (this.targetMeshes2 && this.targetMeshes2.length > 0) {
                            const imageMeshes = this.modelLoader.getMeshes("image") || [];
                            imageMeshes[1].isVisible = true;

                            this.triggerManager.activateLaserMode2(this.targetMeshes2);

                            this.targetMeshes2.forEach((targetMesh) => {
                                this.triggerManager.setupClickableMesh(targetMesh, () => {
                                    this.clickFour++;
                                    this.clickCount++;

                                    const meshName = targetMesh.name.toLowerCase();
                                    console.log("Клик по мешу:", meshName);
                                    const params = getMeshParams(meshName);
                                    console.log("Параметры меша:", params);
                                    const randomValue = Math.floor(Math.random() * (params.randomMax - params.randomMin + 1)) + params.randomMin;
                                    const cellIndex = (this.clickCount - 1) % 5;

                                    // Обновляем ячейки в grid
                                    if (cellIndex < 4) {
                                        this.modelLoader.updateCellText(cellIndex, randomValue.toString());
                                    }

                                    // Обновляем randomValues
                                    randomValues.unshift(randomValue.toString());
                                    if (randomValues.length > 4) {
                                        randomValues.pop();
                                    }

                                    // Обновляем textBlock2Values только на cellIndex === 3
                                    if (cellIndex === 3) {
                                        textBlock2Values.unshift(params.textBlock1Value);
                                        if (textBlock2Values.length > 4) {
                                            textBlock2Values.pop();
                                        }
                                    }

                                    // Обновляем textBlock2
                                    if (this.modelLoader.textBlock2) {
                                        this.modelLoader.textBlock2.text = textBlock2Values.join("\n");
                                    }

                                    // Логика вращения targetMesh
                                    if (imageMeshes.length > 1 && cellIndex < 4) {
                                        const targetMeshImg = imageMeshes[1];
                                        const rotationIndex = cellIndex;
                                        targetMeshImg.rotation.y = rotationXValues[rotationIndex];
                                        console.log(`Установлен rotation.y: ${rotationXValues[rotationIndex]} для clickFour: ${this.clickFour}`);
                                    }

                                    // На 4-й клик (индекс 3): скрываем targetMesh, показываем textBlock1
                                    if (cellIndex === 3) {
                                        if (imageMeshes.length > 1) {
                                            imageMeshes[1].isVisible = false;
                                        }
                                        if (this.modelLoader.textBlock1 && this.modelLoader.textBlock3) {
                                            this.modelLoader.textBlock1.text = params.textBlock1Value;
                                            this.modelLoader.textBlock1.isVisible = true;
                                            this.modelLoader.textBlock3.text = Math.round(randomValues.reduce((acc, curr) => acc + Number(curr), 0) / randomValues.length).toString();
                                            console.log(this.modelLoader.textBlock3.text);
                                        }
                                    }

                                    // На 5-й клик (индекс 4): сброс
                                    if (cellIndex === 4) {
                                        this.modelLoader.resetAllCells();
                                        if (this.modelLoader.textBlock1 && this.modelLoader.textBlock3) {
                                            this.modelLoader.textBlock1.isVisible = false;
                                            this.modelLoader.textBlock3.text = "";
                                        }
                                        if (imageMeshes.length > 1) {
                                            imageMeshes[1].isVisible = true;
                                            imageMeshes[1].rotation.y = Math.PI;
                                        }
                                        // Сбрасываем textBlock2Values
                                        // textBlock2Values = ["", "", "", ""];
                                        if (this.modelLoader.textBlock2) {
                                            this.modelLoader.textBlock2.text = textBlock2Values.join("\n");
                                        }
                                        console.log("Сброс после 5 кликов");
                                    }
                                });
                            });

                            const checkResultObservable = new Observable<{ correctCount: number; total: number }>();

                            const page1 = this.dialogPage.addText("Вам нужно измерить прочность конструкций которые представлены на третьей странице. Для того чтобы начать измерение наведитесь мышкой на конструкцию, прочность которой хотите измерить. В этом месте появляется прибор. Используя кнопки Q/Й и E/У поверните его в нужную позицию. Затем кликните мышкой для проведения измерения. После четвертого клика, появившееся число введите на третьей странице. Для продолжение нажмите Вперед, для возврата на предыдущую страницу, Назад.");
                            const page2 = this.dialogPage.addText("На следующей странице вас ждет таблица из двух колонок. В первой название конструкции, во второй поле куда вводить показания. Когда введете все показания, нажмите на кнопку проверить. Галочкой подсветятся правильные измерения, крестиком неправильные. Как только все поля будут зелеными в планшете появится страничка где можно будет завершить тест");
                            const page3 = this.dialogPage.addInputGrid2(
                                "Конструкции",
                                ["Ростверк фундамента ", "Сопряжение", "Стойка (опоры)", "Шкафная стенка", "Подферменник (опора балок)", "Ригель", "Балка"],
                                [
                                  { min: 38.35, max: 38.35 }, 
                                  { min: 32.11, max: 32.11 },
                                  { min: 38.35, max: 38.35 },
                                  { min: 38.35, max: 38.35 }, 
                                  { min: 38.35, max: 38.35 },
                                  { min: 38.35, max: 38.35 },
                                  { min: 38.35, max: 38.35 },
                                ],
                                "../models/UltraInfo.jpg",
                                this.guiTexture,
                                () => {
                                  // Логика видимости мешей
                                    console.log("Готово");
                                },
                                8,
                                checkResultObservable
                              );
                            // const finishPage = this.dialogPage.createStartPage(
                            //     "Переместите мышку в то место, где хотите произвести измерение. На кнопки Q и E вы можете повернуть бетонометр. После нажмите на кнопку для завершения измерения.",
                            //     "Завершить",
                            //     () => {
                            //         const totalClicksMessage = new TextBlock();
                            //         totalClicksMessage.text = `Вы произвели измерение ${this.clickCount} раз(а)`;
                            //         totalClicksMessage.color = "white";
                            //         totalClicksMessage.fontSize = 24;
                            //         totalClicksMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                            //         totalClicksMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                            //         totalClicksMessage.top = "-10%";
                            //         this.guiTexture.addControl(totalClicksMessage);

                            //         setTimeout(() => {
                            //             this.guiTexture.removeControl(totalClicksMessage);
                            //         }, 3000);

                            //         if (clickCountText) {
                            //             this.guiTexture.removeControl(clickCountText);
                            //             clickCountText = null;
                            //         }
                            //         this.clickCount = 0;
                            //         this.clickFour = 0;

                            //         this.targetMeshes2.forEach((targetMesh) => {
                            //             this.triggerManager.removeMeshAction(targetMesh);
                            //         });

                            //         this.triggerManager.exitLaserMode2();

                            //         const routePage = this.dialogPage.createStartPage(
                            //             "Отлично, а теперь нажмите на кнопку для перемещения на основную карту",
                            //             "Перейти на основную карту",
                            //             () => {
                            //                 window.location.href = '/ВыборИнструмента';
                            //             }
                            //         );

                            //         this.guiManager.CreateDialogBox([routePage]);
                            //     }
                            // );
                            const endPageResult = this.dialogPage.createConditionButton(
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
                                    this.guiManager.CreateDialogBox([routePage]);
                                },
                                false // Кнопка изначально невидима
                            );
                            
                            // Подписка на результат проверки
                            let isButtonShown = false;
                            checkResultObservable.add((result) => {
                                if (result.correctCount === result.total && !isButtonShown) {
                                    endPageResult.messageText.text = "Все измерения верны! Нажмите 'Завершить' для продолжения.";
                                    endPageResult.actionButton.isVisible = true; // Показываем кнопку
                                    isButtonShown = true;
                                }
                            });

                            this.guiManager.CreateDialogBox([page1, page2, page3, endPageResult.rectangle]);
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