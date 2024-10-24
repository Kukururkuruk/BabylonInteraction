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
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
  
  export class DistanceScene {
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    camera: FreeCamera;
    private guiTexture: AdvancedDynamicTexture;
    private triggerManager: TriggerManager2;
    private guiManager: GUIManager;
    private zoneTriggered: boolean = false;
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.engine = new Engine(this.canvas, true);
      this.engine.displayLoadingUI();
  
      this.scene = this.CreateScene();
      this.guiManager = new GUIManager(this.scene, this.textMessages);
      this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
      this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);
  
      this.CreateEnvironment().then(() => {
        this.engine.hideLoadingUI();
        
    });
    
      this.CreateController();

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
  
      const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);
  
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
  
        meshes.forEach((mesh) => {
          mesh.checkCollisions = true;
        });
  
        console.log("Модели успешно загружены.");
      } catch (error) {
        console.error("Ошибка при загрузке моделей:", error);
      } finally {
        this.engine.hideLoadingUI();
      }
    }

    DistanceTrigger(): void {
        const fullText1 =
              "Нажми на кнопку для начала измерения.";
        const fullText2 = "Перед тобой позиции в которую можно поставить дальнометр, выбери правильную";
        const fullText3 = "Куда нужно направить дальнометр";
        this.guiManager.CreateDialogBox(fullText1)
        const firstZonePosition = new Vector3(-10.622146207334794, 8.8, -3.62);
        const firstTriggerZone = this.triggerManager.setupZoneTrigger(
            firstZonePosition,
            () => {
                if (!this.zoneTriggered) {
                    this.zoneTriggered = true;
                    this.triggerManager.createStartButton('Начать',() => {
                        this.guiManager.CreateDialogBox(fullText2)
                        this.triggerManager.disableCameraMovement();
                        const targetPosition = firstTriggerZone.getInteractionZone().getAbsolutePosition();
                        this.triggerManager.setCameraPositionAndTarget(
                            Math.PI / 2,
                            4,
                            Math.PI / 12,
                            1,
                            targetPosition
                        );
                        this.triggerManager.createRadioButtons(() => {
                            this.guiManager.CreateDialogBox(fullText3)
                          this.triggerManager.setCameraPositionAndTarget(
                            Math.PI / 2,
                            -1,
                            -Math.PI / 12,
                            -0.9,
                            targetPosition
                          );
                          this.triggerManager.enableCameraMovement();
                        });
                    });
                }
            },
            undefined, // onExitZone
            3 // camSize
        );
  
    }
}