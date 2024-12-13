import {
    Scene,
    Engine,
    SceneLoader,
    Vector3,
    HemisphericLight,
    HDRCubeTexture,
    FreeCamera,
  } from "@babylonjs/core";
  import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { ModelLoader } from "./BaseComponents/ModelLoader";
  
  export class DistanceScene {
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
    private rangefinderMeshes: AbstractMesh[]
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.engine = new Engine(this.canvas, true);
      this.engine.displayLoadingUI();
  
      this.scene = this.CreateScene();
      this.guiManager = new GUIManager(this.scene, this.textMessages);
      this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
      this.dialogPage = new DialogPage()
      this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);
      this.modelLoader = new ModelLoader(this.scene);
  
      this.CreateEnvironment().then(() => {
        this.engine.hideLoadingUI();
        
    });
      
      this.CreateController();
      this.createLogCameraButton()

      this.DistanceTrigger();
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
      this.camera = new FreeCamera("camera", new Vector3(-8.622146207334794, 9.5, -3.62), this.scene);
      this.camera.attachControl(this.canvas, true);
  
      this.camera.applyGravity = false;
      this.camera.checkCollisions = true;
      this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
      this.camera.minZ = 0.45;
      this.camera.speed = 0.55;
      this.camera.angularSensibility = 4000;
      this.camera.rotation.y = -Math.PI/2
      this.camera.rotation.x = Math.PI / 12
      this.camera.keysUp.push(87); // W
      this.camera.keysLeft.push(65); // A
      this.camera.keysDown.push(83); // S
      this.camera.keysRight.push(68); // D
    }
  
    async CreateEnvironment(): Promise<void> {
      try {
        this.engine.displayLoadingUI();
  
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);

        await this.modelLoader.loadRangeModel()
        this.rangefinderMeshes = this.modelLoader.getMeshes('range') || [];
        this.rangefinderMeshes.forEach((mesh) => {
          mesh.isVisible = false
        })
        console.log(this.rangefinderMeshes);
        

        await this.modelLoader.addGUIRange(this.camera, this.rangefinderMeshes)
        this.triggerManager.setRangefinderMesh(this.rangefinderMeshes[1]);
  
        meshes.forEach((mesh) => {
          mesh.checkCollisions = false;
        });
  
        console.log("Модели успешно загружены.");
      } catch (error) {
        console.error("Ошибка при загрузке моделей:", error);
      } finally {
        this.engine.hideLoadingUI();
      }
    }

    public createLogCameraButton(): void {
      // Создаём кнопку
      const button = Button.CreateSimpleButton("logCameraButton", "Логировать Камеру");
      button.width = "150px";
      button.height = "40px";
      button.color = "white";
      button.background = "green";
      button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      button.top = "20px";
      button.left = "-20px";

      // Добавляем обработчик события нажатия
      button.onPointerUpObservable.add(() => {


          console.log("Позиция камеры:", this.camera.position);
          console.log("Вращение камеры:", this.camera.rotation);
      });

      // Добавляем кнопку в интерфейс
      this.guiTexture.addControl(button);
  }

    DistanceTrigger(): void {
        // const fullText2 = "Перед тобой позиции в которую можно поставить дальнометр, выбери правильную";
        // const fullText3 = "Куда нужно направить дальнометр";

        // const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
        // this.guiManager.CreateDialogBox([page1])

          const clickableWords = [
            { 
                word: "здесь", 
                imageUrl: "../models/image2.png",
                top: "180px",
                left: "112px",
                width: "50px"
            },
            { 
                word: "схеме", 
                imageUrl: "../models/image1.png",
                top: "290px",
                left: "143px",
                width: "50px"
            }
        ];

        const clickablImage = [
          { 
            thumbnailUrl: "../models/image2.png", 
            fullImageUrl: "../models/image2.png",
            name: "Изображение",
          },
          { 
            thumbnailUrl: "../models/image1.png", 
            fullImageUrl: "../models/image1.png",
            name: "Схема",
          }
        ];

        const clickablVideo = [
          { 
            thumbnailUrl: "../models/image2.png", 
            videoUrl: "../models/film_1var_1_2K.mp4",
            name: "Изображение",
          }
        ];

        const firstZonePosition = new Vector3(-10.622146207334794, 8.8, -3.6);
        const firstTriggerZone = this.triggerManager.setupZoneTrigger(
            firstZonePosition,
            () => {
                if (!this.zoneTriggered) {
                    this.zoneTriggered = true;

                        // const page2 = this.dialogPage.addText("Перед вами Дальномер – Leica Disto D510, с его параметрами можно ознакомиться в модуле «Оборудование».  Принцип работы показан в видеоролике:")
                        // this.guiManager.CreateDialogBox([page2])

                        const page1 = this.dialogPage.addText("Перед вами Дальномер – Leica Disto D510, с его параметрами можно ознакомиться в модуле «Оборудование».  Принцип работы показан в видеоролике на второй странице")
                        const pageZoomable = this.dialogPage.addZoomableImagePage(clickablImage, this.guiTexture);
                        const pageClickable = this.dialogPage.addClickableWordsPage(
                          "Установите дальномер в правильном положение, для измерения ширины проезжей части. Схема барьерного ограждения изображена здесь. Ширина проезжей части измеряется по двум крайним точкам барьерного ограждения, как показано на схеме",
                          clickableWords,
                          this.guiTexture
                        );
                        const pageVideobl = this.dialogPage.addZoomableVideoPage(clickablVideo, this.guiTexture, this.camera);
                        
                        this.guiManager.CreateDialogBox([ page1, pageVideobl, pageZoomable, pageClickable,  ])




                        // this.triggerManager.disableCameraMovement();
                        const targetPosition = firstTriggerZone.getInteractionZone().getAbsolutePosition();
                        this.triggerManager.setCameraPositionAndTarget(
                            Math.PI,
                            2,
                            Math.PI / 6,
                            1,
                            targetPosition,
                            new Vector3(-10.696560546325838, 7.893929668249585, -4.8873197656921485),
                            new Vector3(-0.0975716378981855, -0.9512389923294013, 0)
                        );
                        this.triggerManager.createRadioButtons(() => {

                            const page3 = this.dialogPage.addText("Куда нужно направить дальнометр")
                            this.guiManager.CreateDialogBox([page3])
                            this.rangefinderMeshes.forEach((mesh) => {
                              mesh.isVisible = true
                            })

                          this.triggerManager.setCameraPositionAndTarget(
                            Math.PI / 2,
                            -1,
                            -Math.PI / 12,
                            -0.47, //-0.9
                            new Vector3(-11, 8.8, -3.6)
                          );
                          this.triggerManager.enableCameraMovement();
                        });
                }
            },
            undefined, // onExitZone
            3 // camSize
        );
  
    }
}