// CameraController.ts
import { Scene, FreeCamera, Vector3, Ray, ActionManager } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";

export type CameraType = 'simple' | 'complex';

export class CameraController {
  public camera: FreeCamera;
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private isLocked: boolean = false;
  private cameraType: CameraType;

  constructor(scene: Scene, canvas: HTMLCanvasElement, cameraType: CameraType = 'simple') {
    this.scene = scene;
    this.canvas = canvas;
    this.cameraType = cameraType;

    this.createCamera();

    if (this.cameraType === 'complex') {
      this.createCrosshair();
      this.setupPointerLock();
      this.setupMouseEvents();
    }
  }

  private createCamera(): void {
    this.camera = new FreeCamera("camera", new Vector3(35, 3, 0), this.scene);
    this.camera.attachControl(this.canvas, true);

    // Общие настройки камеры
    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.angularSensibility = 4000;
    this.camera.rotation.y = -Math.PI / 2;
    this.camera.inertia = 0.82;
    this.camera.keysUp.push(87);    // W
    this.camera.keysLeft.push(65);  // A
    this.camera.keysDown.push(83);  // S
    this.camera.keysRight.push(68); // D

    this.canvas.focus();
  }

  private createCrosshair(): void {
    // Создание прицела в центре экрана без передачи сцены и изменения DOM
    const crosshair = AdvancedDynamicTexture.CreateFullscreenUI("FullscreenUI");
  
    const xRect = new Rectangle("xRect");
    xRect.width = "20px";
    xRect.height = "2px";
    xRect.color = "White";
    xRect.background = "White";
    crosshair.addControl(xRect);
  
    const yRect = new Rectangle("yRect");
    yRect.width = "2px";
    yRect.height = "20px";
    yRect.color = "White";
    yRect.background = "White";
    crosshair.addControl(yRect);
  }
  

  private setupPointerLock(): void {
    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "e" || event.key.toLowerCase() === "у") {
        this.togglePointerLock();
      }
    });

    document.addEventListener("pointerlockchange", this.pointerLockChange.bind(this));
    document.addEventListener("mozpointerlockchange", this.pointerLockChange.bind(this));
    document.addEventListener("webkitpointerlockchange", this.pointerLockChange.bind(this));
    document.addEventListener("mspointerlockchange", this.pointerLockChange.bind(this));
  }

  private setupMouseEvents(): void {
    this.scene.onPointerDown = (evt) => {
      if (!this.isLocked) {
        this.togglePointerLock();
      }

      // Проверка нажатия левой кнопки мыши
      if (evt.button === 0) {
        const origin = this.camera.globalPosition.clone();
        const forward = this.camera.getDirection(Vector3.Forward());
        const ray = new Ray(origin, forward, 200);

        // Проверка попадания луча по объектам
        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable);

        if (hit?.pickedMesh) {
          console.log("Попадание по объекту:", hit.pickedMesh.name);

          const pickedMesh = hit.pickedMesh;
          const actionManager = pickedMesh.actionManager;

          if (actionManager) {
            // Обработка события клика по объекту
            actionManager.processTrigger(ActionManager.OnRightPickTrigger);
          }
        }
      }
    };
  }

   togglePointerLock(): void {
    if (this.isLocked) {
      // Выход из режима PointerLock
      document.exitPointerLock?.();
    } else {
      // Вход в режим PointerLock
      this.canvas.requestPointerLock();
    }
  }

  private pointerLockChange(): void {
    const controlEnabled =
      document.pointerLockElement === this.canvas ||
      (document as any).mozPointerLockElement === this.canvas ||
      (document as any).webkitPointerLockElement === this.canvas ||
      (document as any).msPointerLockElement === this.canvas;

    this.isLocked = controlEnabled;

    // Обновление состояния курсора
    if (this.isLocked) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = '';
    }
  }
}
