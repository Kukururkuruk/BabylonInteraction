import {
    Scene,
    FreeCamera,
    AbstractMesh,
    ActionManager,
    ExecuteCodeAction,
    Mesh,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Angle,
  } from "@babylonjs/core";
  import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
  
  export class ScreenViewManager {
    private scene: Scene;
    private camera: FreeCamera;
    private isScreenMode: boolean = false;
    private originalCameraSettings?: { position: Vector3; target: Vector3 };
    private isScreenClicked: boolean = false; // Флаг клика на interactivePlane
  
    constructor(scene: Scene, camera: FreeCamera) {
      this.scene = scene;
      this.camera = camera;
      this.AddEscapeKeyHandler();
    }
  
    public setupScreenInteraction(screenMeshName: string): void {
      const screenMesh = this.scene.getMeshByName(screenMeshName);
      if (!screenMesh) {
        console.error(`Меш ${screenMeshName} не найден.`);
        return;
      }
  
      // Настройка основного экрана
      screenMesh.checkCollisions = true;
      screenMesh.actionManager = new ActionManager(this.scene);
      screenMesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          if (!this.isScreenMode) {
            this.activateScreenView(screenMesh as AbstractMesh);
          } else {
            console.log("Вы уже находитесь в режиме просмотра экрана.");
          }
        })
      );
  
      // Добавление интерактивного плоского меша перед экраном
      const boundingInfo = screenMesh.getBoundingInfo();
      const size = boundingInfo.boundingBox.extendSizeWorld;
  
      const interactivePlane = MeshBuilder.CreatePlane(
        "InteractivePlane",
        { width: size.x * 2 / 4, height: size.y * 2 / 4 },
        this.scene
      );
  
      const worldCenter = boundingInfo.boundingBox.centerWorld;
      interactivePlane.position = new Vector3(
        worldCenter.x - size.x / 2, // Сдвиг влево относительно центра
        worldCenter.y,
        worldCenter.z
      );
      interactivePlane.rotation = screenMesh.rotation.clone();
      interactivePlane.isPickable = true;
  
      // Создание материала с зеленой эмиссией
      const greenMaterial = new StandardMaterial("GreenMaterial", this.scene);
      greenMaterial.diffuseColor = new Color3(0, 1, 0);
      greenMaterial.emissiveColor = new Color3(0, 1, 0);
      interactivePlane.material = greenMaterial;
  
      // Добавление эффекта свечения
      const glowLayer = new GlowLayer("GlowLayer", this.scene);
      glowLayer.addIncludedOnlyMesh(interactivePlane);
  
      // Действия при клике на interactivePlane
      interactivePlane.actionManager = new ActionManager(this.scene);
      interactivePlane.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          console.log("Плоский меш перед экраном был нажат!");
          this.isScreenClicked = true;
        })
      );
    }
  
    public activateScreenView(screenMesh: AbstractMesh): void {
      if (this.isScreenMode) {
        console.log("Режим просмотра уже активирован.");
        return;
      }
  
      this.isScreenMode = true;
  
      this.camera.position.set(-0.03605546142586176, 1.5076749996840952, 2.7365113870411744);
      const target = screenMesh.getAbsolutePosition();
      const direction = this.camera.position.subtract(target).normalize();
      const oppositeTarget = this.camera.position.add(direction.scale(2));
      this.camera.setTarget(oppositeTarget);
  
      const downTiltAngle = Angle.FromDegrees(20).radians();
      this.camera.rotation.x = downTiltAngle;
  
      this.camera.detachControl();
      screenMesh.isPickable = false;
  
      console.log("Режим просмотра активирован. Нажмите Esc, чтобы выйти.");
    }
  
    public exitScreenView(screenMesh: AbstractMesh): void {
      if (!this.isScreenMode) {
        console.log("Режим просмотра уже отключен.");
        return;
      }
  
      this.isScreenMode = false;
      this.camera.attachControl();
      screenMesh.isPickable = true;
  
      console.log("Режим просмотра отключен. Теперь вы можете снова взаимодействовать с экраном.");
    }
  
    public SwitchToScreenMode(screenMesh: Mesh): void {
      if (this.isScreenMode) return;
  
      this.originalCameraSettings = {
        position: this.camera.position.clone(),
        target: this.camera.getTarget(),
      };
  
      this.camera.detachControl();
      this.camera.position.set(-0.03605546142586176, 1.5076749996840952, 2.7365113870411744);
      this.camera.setTarget(screenMesh.getAbsolutePosition());
  
      this.isScreenMode = true;
    }
  
    private AddEscapeKeyHandler(): void {
      window.addEventListener("keydown", (event) => {
        const screenMesh = this.scene.getMeshByName("SM_0_Screen_1");
        if (event.key === "Escape" && this.isScreenMode && screenMesh) {
          this.exitScreenView(screenMesh as AbstractMesh);
        }
      });
    }
  
    public ExitScreenMode(): void {
      if (!this.originalCameraSettings) return;
  
      this.camera.position = this.originalCameraSettings.position;
      this.camera.setTarget(this.originalCameraSettings.target);
      this.camera.attachControl();
  
      this.isScreenMode = false;
    }
  
    // Доступ к флагу клика на interactivePlane
    public getIsScreenClicked(): boolean {
      return this.isScreenClicked;
    }
  }