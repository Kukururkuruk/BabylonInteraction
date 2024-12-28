import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  AbstractMesh,
  Quaternion,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Ray,
  Tools,
  DirectionalLight,
  ShadowGenerator,
  KeyboardEventTypes,
  PBRMaterial,
  Material,
  GlowLayer
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { ModelLoader } from "../BaseComponents/ModelLoader";
import { GUIManager } from "../FunctionComponents/GUIManager";
import { DialogPage } from "../FunctionComponents/DialogPage";
import { BabylonUtilities } from "../FunctionComponents/BabylonUtilities"; // путь к файлу

interface ToolData {
  meshes: AbstractMesh[],
  originalAbsolutePositions: Vector3[],
  originalWorldRotationQuaternions: Quaternion[],
  isFront: boolean,
  onFrontCallback?: () => void,
  frontPosition?: Vector3,
  frontRotation?: Vector3
}

export class ToolScene {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private modelLoader: ModelLoader;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private utilities: BabylonUtilities

  private tools: { [key: string]: ToolData } = {};

  // Значения по умолчанию для позиции и ротации перед камерой
  private defaultFrontPosition: Vector3 = new Vector3(0, -0.1, 0.9);
  private defaultFrontRotation: Vector3 = new Vector3(0, Math.PI / 2, 0);

  private isRotating: boolean = false;
  private currentToolName: string | null = null;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.modelLoader = new ModelLoader(this.scene);
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    this.utilities = new BabylonUtilities(this.scene, this.engine, this.guiTexture);

    this.initializeScene();

    this.CreateController();
    this.utilities.AddScreenshotButton();
    // this.utilities.AddCameraPositionButton();
    // this.utilities.combinedMethod()

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    this.scene.onPointerDown = (evt, pickInfo) => {
      // Правая кнопка — перемещаем инструмент
      if (evt.button === 2) {
        if (pickInfo.hit && pickInfo.pickedMesh) {
          const clickedTool = this.getToolNameByMesh(pickInfo.pickedMesh);
          if (clickedTool) {
            // Если уже есть инструмент перед камерой и мы кликаем на другой
            if (this.currentToolName && this.currentToolName !== clickedTool) {
              this.returnCurrentTool();
            }
            this.toggleToolPosition(clickedTool);
          }
        }
      } else if (evt.button === 0) {
        // Левая кнопка — вращаем, если инструмент перед камерой
        if (this.currentToolName && this.tools[this.currentToolName].isFront) {
          this.isRotating = true;
          this.lastPointerX = evt.clientX;
          this.lastPointerY = evt.clientY;
        }
      }
    };

    this.scene.onPointerUp = (evt) => {
      if (evt.button === 0 && this.isRotating) {
        this.isRotating = false;
      }
    };

    this.scene.onPointerMove = (evt) => {
      if (this.isRotating && this.currentToolName) {
        const toolData = this.tools[this.currentToolName];
        if (!toolData.isFront) return;

        const deltaX = evt.clientX - this.lastPointerX;
        const deltaY = evt.clientY - this.lastPointerY;

        this.lastPointerX = evt.clientX;
        this.lastPointerY = evt.clientY;

        const rotationSpeed = 0.005;
        toolData.meshes.forEach((m) => {
          if (!m.rotationQuaternion) {
            m.rotationQuaternion = Quaternion.FromEulerAngles(m.rotation.x, m.rotation.y, m.rotation.z);
          }

          let deltaRotation = Quaternion.RotationYawPitchRoll(deltaX * rotationSpeed, deltaY * rotationSpeed, 0);

          if (evt.shiftKey) {
            const zRotation = Quaternion.RotationAxis(new Vector3(0,0,1), deltaX * rotationSpeed);
            deltaRotation = zRotation.multiply(deltaRotation);
          }

          m.rotationQuaternion = deltaRotation.multiply(m.rotationQuaternion);
        });
      }
    };
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
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

  CreateController(): void {
    this.camera = new FreeCamera("camera", new Vector3(-2.0532259325547524, 1.5075, 1.9956260534309331), this.scene);
    this.camera.rotation = new Vector3(0.1571380321207439, -1.5679675730797253, 0);
    this.camera.attachControl(this.canvas, true);
    this.camera.applyGravity = false;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 0.75, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.inertia = 0.7;
    this.camera.angularSensibility = 2000;
    this.camera.keysUp.push(87); // W
    this.camera.keysLeft.push(65); // A
    this.camera.keysDown.push(83); // S
    this.camera.keysRight.push(68); // D
        const originalFov = this.camera.fov;
        let isZoomedIn = false;
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
              const key = kbInfo.event.key.toLowerCase();
                if (/q|й/.test(key)) {
                    if (isZoomedIn) {
                        // Если камера уже уменьшена, восстанавливаем оригинальный FOV
                        this.camera.fov = originalFov;
                    } else {
                        // Уменьшаем FOV камеры
                        this.camera.fov /= 2;
                    }
                    // Переключаем флаг
                    isZoomedIn = !isZoomedIn;
                }
            }
        });

  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      const light = new DirectionalLight(
        "dirLight",
        new Vector3(-1, -1, -1),
        this.scene
      );
      light.position = new Vector3(-20, 20, 20);
      light.intensity = 2;
      // // // Здесь можно добавить логику для генерации теней, если требуется
      // const shadowGenerator = new ShadowGenerator(2048, light); // 1024, 2048, 4096, 8192 
      // shadowGenerator.useContactHardeningShadow = true;
      // shadowGenerator.contactHardeningLightSizeUVRatio = 0.3; // Настройте по желанию
      // shadowGenerator.shadowMinZ = 0;  // Минимальная глубина для теней
      // shadowGenerator.shadowMaxZ = 50; // Увеличь, если объекты находятся дальше

      await this.modelLoader.loadMLabModel();
      const lab = this.modelLoader.getMeshes('lab') || [];
      
      
      const glowLayer = new GlowLayer("glow", this.scene); // Создаём GlowLayer
      glowLayer.intensity = 1;
      
      lab.forEach((mesh) => {
        mesh.checkCollisions = false;
      
        if (mesh.name === "SM_0_Tools_Desk" && mesh instanceof Mesh) {
          const material = mesh.material;
      
          if (material && material instanceof PBRMaterial) {
            material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND; // Убираем прозрачность
            material.emissiveColor = new Color3(1, 1, 1);
            material.emissiveIntensity = 2;
      
            // Убедимся, что у материала есть текстура эмиссии
            if (material.emissiveTexture) {
              glowLayer.addIncludedOnlyMesh(mesh); // Только этот меш будет светиться
            }
          }
        }
      });
      
      console.log(lab);

      // Загрузка ultra
      await this.modelLoader.loadUltraModel();
      const ultra = this.modelLoader.getMeshes('ultra') || [];
      ultra.forEach((mesh, index) => {
        if (index !== 0) {
          mesh.position = new Vector3(3.71, 0.95, 1.43);
          mesh.rotation = new Vector3(0, 0, Math.PI/2);
          if (!mesh.rotationQuaternion) {
            mesh.rotationQuaternion = Quaternion.FromEulerAngles(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
          }
        }
      });
      
      const ultraAbsolutePositions = ultra.map(m => m.getAbsolutePosition().clone());
      const ultraWorldRotQuats = ultra.map(m => m.rotationQuaternion!.clone());
      this.tools['ultra'] = {
        meshes: ultra,
        originalAbsolutePositions: ultraAbsolutePositions,
        originalWorldRotationQuaternions: ultraWorldRotQuats,
        isFront: false,
        onFrontCallback: () => {
          const ultraPage = this.dialogPage.addText("Это вот штука бетономер");
          this.guiManager.CreateDialogBox([ultraPage]);
        },
        // Задаём индивидуальные передние позицию и ротацию
        frontPosition: new Vector3(0, -0.1, 0.9),
        frontRotation: new Vector3(Math.PI/2, 0, 0)
      };

      // Загрузка dist
      await this.modelLoader.loadRangeCentrModel()
      const dist = this.modelLoader.getMeshes('rangeC') || [];
      dist.forEach((mesh, index) => {
        
        if (index !== 0) {
          mesh.scaling = new Vector3(1,1,1);
          mesh.position = new Vector3(3.56, 0.95, 1.99);
          mesh.rotation = new Vector3(0, Math.PI, Math.PI/2);
          if (!mesh.rotationQuaternion) {
            mesh.rotationQuaternion = Quaternion.FromEulerAngles(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
          }
        }
      });
      const distAbsolutePositions = dist.map(m => m.getAbsolutePosition().clone());
      const distWorldRotQuats = dist.map(m => m.rotationQuaternion!.clone());

      this.tools['dist'] = {
        meshes: dist,
        originalAbsolutePositions: distAbsolutePositions,
        originalWorldRotationQuaternions: distWorldRotQuats,
        isFront: false,
        onFrontCallback: () => {
          const distPage = this.dialogPage.addText("Это вот штука дальномер");
          this.guiManager.CreateDialogBox([distPage]);
        },
        // Задаём индивидуальные передние позицию и ротацию
        frontPosition: new Vector3(0, 0, 0.9),
        frontRotation: new Vector3(Math.PI, Math.PI / 2, 0)
      };

      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  private getToolNameByMesh(mesh: AbstractMesh): string | null {
    for (const toolName in this.tools) {
      if (this.tools[toolName].meshes.includes(mesh)) {
        return toolName;
      }
    }
    return null;
  }

  private returnCurrentTool(): void {
    if (!this.currentToolName) return;
    const toolData = this.tools[this.currentToolName];

    if (toolData.isFront) {
      this.camera.attachControl(this.canvas, true);

      toolData.meshes.forEach((mesh, index) => {
        mesh.setParent(null);
        mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
        mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
      });

      toolData.isFront = false;
      this.currentToolName = null;

      this.checkAndShowToolSelectionDialog();
    }
  }

  private toggleToolPosition(toolName: string): void {
    const toolData = this.tools[toolName];
    if (!toolData) return;

    toolData.isFront = !toolData.isFront;
    if (toolData.isFront) {
      this.currentToolName = toolName;
      this.camera.detachControl();

      const pos = toolData.frontPosition || this.defaultFrontPosition;
      const rot = toolData.frontRotation || this.defaultFrontRotation;

      toolData.meshes.forEach((mesh) => {
        mesh.setParent(this.camera);
        mesh.position = pos.clone();
        mesh.rotationQuaternion = Quaternion.FromEulerAngles(rot.x, rot.y, rot.z);
      });

      if (toolData.onFrontCallback) {
        toolData.onFrontCallback();
      }

    } else {
      this.camera.attachControl(this.canvas, true);

      toolData.meshes.forEach((mesh, index) => {
        mesh.setParent(null);
        mesh.setAbsolutePosition(toolData.originalAbsolutePositions[index].clone());
        mesh.rotationQuaternion = toolData.originalWorldRotationQuaternions[index].clone();
      });

      if (this.currentToolName === toolName) {
        this.currentToolName = null;
      }

      this.checkAndShowToolSelectionDialog();
    }
  }

  private checkAndShowToolSelectionDialog(): void {
    if (!this.currentToolName) {
      this.showToolSelectionDialog();
    }
  }

  private showToolSelectionDialog(): void {
    const startPage = this.dialogPage.addText("Выбирай инструмен, для приближения нажмите на клавиатуре Q/Й");
    this.guiManager.CreateDialogBox([startPage]);
  }

  private async CreateShadows(): Promise<void> {
    const light = new DirectionalLight(
      "dirLight",
      new Vector3(-1, -1, -1),
      this.scene
    );
    light.position = new Vector3(0, 10, 10);
    light.intensity = 2;
    // // Здесь можно добавить логику для генерации теней, если требуется
    const shadowGenerator = new ShadowGenerator(2048, light); // 1024, 2048, 4096, 8192 
    shadowGenerator.useContactHardeningShadow = true;
    shadowGenerator.contactHardeningLightSizeUVRatio = 0.05; // Настройте по желанию

    this.scene.meshes.forEach((mesh) => {
      mesh.receiveShadows = true;
      shadowGenerator.addShadowCaster(mesh);
    })
  }

  async initializeScene(): Promise<void> {
    try {
      await this.CreateEnvironment();
      // await this.CreateShadows();
      this.showToolSelectionDialog();
    } catch (error) {
      console.error("Ошибка при инициализации сцены:", error);
    } finally {
      this.scene.onReadyObservable.add(() => {
        this.engine.hideLoadingUI();
    })
      
    }
  }


}









