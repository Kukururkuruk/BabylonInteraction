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
    Mesh,
  } from "@babylonjs/core";
  import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { ModelLoader } from "./BaseComponents/ModelLoader";
import { BabylonUtilities } from "./FunctionComponents/BabylonUtilities";
  
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
    private utils: BabylonUtilities
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
      this.utils = new BabylonUtilities(this.scene, this.engine, this.guiTexture)

      // Инициализация загрузчика моделей
        this.modelLoader = new ModelLoader(this.scene);
  
      this.CreateEnvironment().then(() => {
        this.BetonTrigger();
        this.engine.hideLoadingUI();
        
    });
    
      this.CreateController();

      

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
  
    CreateController(): void {
      // Установка начальной позиции камеры для лучшей видимости
      this.camera = new FreeCamera("camera", new Vector3(17.68, 1.92, -13.45), this.scene);
      this.camera.attachControl(this.canvas, true);
  
      this.camera.applyGravity = true;
      this.camera.checkCollisions = true;
      this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
      this.camera.minZ = 0.45;
      this.camera.speed = 0.55;
      this.camera.inertia = 0.5
      this.camera.angularSensibility = 4000;
      this.camera.rotation = new Vector3(0.00175, -3.1723155844980004, 0)
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
                mesh.name === "SM_0_Retaining_wall_Block_LP_L" ||
                mesh.name.match(/^SM_0_BlockBevel_LP_L_5_1_primitive\d$/)
            );

            
    
            await this.modelLoader.loadUltraCentrModel()
            const mod = this.modelLoader.getMeshes("ultraC") || []
            mod[1].isVisible = false
            this.beam2 = mod[3]
            this.beam2.scaling = new Vector3(2,2,2)

            await this.modelLoader.loadUltraModel();
            await this.modelLoader.loadUltranModel(this.camera);
            const rangefinderMeshes = this.modelLoader.getMeshes('ultra') || [];
    
            console.log("Модели успешно загружены.");
        } catch (error) {
            console.error("Ошибка при загрузке моделей:", error);
        } finally {
            this.engine.hideLoadingUI();
        }
    }

    BetonTrigger(): void {
        const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, -13.477405516648421);
        let clickCountText: TextBlock | null = null;
      
        const rotationXValues = [
          2 * -Math.PI / 3,
          -Math.PI / 2,
          -Math.PI / 3,
          Math.PI,
        ];
      
        let randomValues: string[] = ["", "", "", ""];
        let textBlock2Values: string[] = ["", "", "", ""];
      
        // Определяем четыре промежутка ротации (в радианах)
        const rotationIntervals = [
            { min: -0.2638, max: 0.2638 }, // 90 градусов влево (~1.5208 до 1.6208)
            { min: -1.0832, max: -0.4542 }, // 45 градусов влево (~0.7354 до 0.8354)
            { min: -1.5728, max: -1.0832 },                            // Вверх (~-0.05 до 0.05)
            { min: -1.1686, max: -0.3829 }, // 45 градусов вправо (~-0.8354 до -0.7354)
          ];
      
        // Индекс текущего активного промежутка
        let currentRotationIntervalIndex = 0;
      
        const getMeshParams = (meshName: string): { randomMin: number; randomMax: number; textBlock1Value: string } => {
          if (
            meshName === "SM_0_Retaining_wall_Block_LP_L" ||
            meshName === "SM_0_BlockBevel_LP_L_5_1" 
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
              this.triggerManager.disableCameraMovement()
      
              const imageMeshes = this.modelLoader.getMeshes("image") || [];
              imageMeshes[1].isVisible = true;

              const startPage = this.dialogPage.addClickableWordsPage(
                "Перед вами Ультразвуковой тестер UK1401, с параметрами можно ознакомиться в модуле «Оборудование». Принцип работы показан в видеоролике.  . Краткое описание функционала кнопок прибора показано на схеме  . Для использования навигации в планшете с подсказками нажмите кнопку вперед для продолжения. Или назад, для повторного ознакомления с предыдущей страницей.",
                [
                    { word: "видеоролике", videoUrl: "../models/UltratronicTester_Preview_1K.mp4", top: "33%", left: "53%", width: "35%" },
                    { word: "схеме", imageUrl: "../models/ultraStudy.jpg", top: "51%", left: "0.1%", width: "17%" },
                ],
                this.guiTexture,
                this.camera // Передаем камеру для видео
              );
              const explanationPage = this.dialogPage.addText("На приборе, в левом нижнем углу, расположен индикатор ориентации. Выберите тот вариант положения прибора, что соответствует индикатору")
              this.guiManager.CreateDialogBox([startPage, explanationPage])
      
              this.triggerManager.createRadioButtons(
                () => {
                  const measurementPage = this.dialogPage.createNumericInputPage("С помощью мыши наведитесь на место где хотите провести измерение. Используя кнопки Q/Й и E/У поверните прибор согласно индикатору. Для проведения измерения нажмите кнопку мыши. Для получения результата проведите измерение 4 раза и запишите их в поле ниже", "Плотность бетона", 38.35,38.35,() => {
            
                  const page4 = this.dialogPage.createStartPage("Хорошая работа, а теперь нажми на кнопку для перехода на основную карту", "Перейти", () => {
                    window.location.href = '/ВыборИнструмента';
                  })
                  this.guiManager.CreateDialogBox([page4])
                })
          
                  this.guiManager.CreateDialogBox([measurementPage])

                  this.triggerManager.activateLaserMode2(this.targetMeshes2);
      
                  this.targetMeshes2.forEach((targetMesh) => {
                    this.triggerManager.setupClickableMesh(targetMesh, () => {
                      // Получаем текущий угол поворота прибора
                      const currentRotationY = this.triggerManager.getCentralCubeRotationY();
                      const meshName = targetMesh.name.toLowerCase();
                      const params = getMeshParams(meshName);
      
                      // Проверяем, попадает ли текущий угол в активный промежуток
                      const currentInterval = rotationIntervals[currentRotationIntervalIndex];
                      const isCorrectRotation =
                        currentRotationY !== null &&
                        currentRotationY >= currentInterval.min &&
                        currentRotationY <= currentInterval.max;
      
                      if (isCorrectRotation) {
                        this.clickFour++;
                        this.clickCount++;
      
                        console.log("Клик по мешу:", meshName);
                        console.log("Параметры меша:", params);
                        console.log("Правильный угол в промежутке:", currentInterval);
                        const randomValue = Math.floor(Math.random() * (params.randomMax - params.randomMin + 1)) + params.randomMin;
                        const cellIndex = (this.clickCount - 1) % 5;
      
                        if (cellIndex < 4) {
                          this.modelLoader.updateCellText(cellIndex, randomValue.toString());
                        }
      
                        randomValues.unshift(randomValue.toString());
                        if (randomValues.length > 4) {
                          randomValues.pop();
                        }
      
                        if (cellIndex === 3) {
                          textBlock2Values.unshift(params.textBlock1Value);
                          if (textBlock2Values.length > 4) {
                            textBlock2Values.pop();
                          }
                        }
      
                        if (this.modelLoader.textBlock2) {
                          this.modelLoader.textBlock2.text = textBlock2Values.join("\n");
                        }
      
                        if (imageMeshes.length > 1 && cellIndex < 4) {
                          const targetMeshImg = imageMeshes[1];
                          const rotationIndex = cellIndex;
                          targetMeshImg.rotation.y = rotationXValues[rotationIndex];
                          console.log(`Установлен rotation.y: ${rotationXValues[rotationIndex]} для clickFour: ${this.clickFour}`);
                        }
      
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
                          this.triggerManager.exitLaserMode2()
                          targetMesh.actionManager?.dispose()
                        }
      
                        // Переход к следующему промежутку после правильного клика
                        if (cellIndex < 4) { // Переключаем только для первых 4 кликов
                          currentRotationIntervalIndex = (currentRotationIntervalIndex + 1) % 4;
                          console.log("Переход к следующему промежутку:", rotationIntervals[currentRotationIntervalIndex]);
                        }
                      } else {
                        console.log("Неправильный угол поворота прибора:", currentRotationY, "Ожидаемый промежуток:", currentInterval);
                        this.triggerManager.showMessage("Поверните прибор в правильное положение!");
                      }
                    });
                  });
      
                },
                this.beam2,
                undefined,
                [
                  { x: -18.51, y: 2.23, z: -16.38 },
                  { x: -17.04, y: 2.23, z: -16.38 },
                  { x: -17.04, y: 1.62, z: -16.38 },
                  { x: -18.51, y: 1.62, z: -16.38 },
                ],
                [
                  new Vector3(0, 0, 1),
                  new Vector3(0, 0, Math.PI / 2),
                  new Vector3(0, 0, -1),
                  new Vector3(0, 0, 0),
                ],
                new Vector3(2, 2, 2),
                1
              );
            }
          },
          undefined,
          20,
          true
        );
      }



}