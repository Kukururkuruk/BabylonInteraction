// CameraController.ts
import { 
  Scene, 
  FreeCamera, 
  Vector3, 
  Ray, 
  ActionManager,
  KeyboardEventTypes 
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";

export type CameraType = 'simple' | 'complex';

export class CameraController {
  public camera: FreeCamera;
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private isLocked: boolean = false;
  private cameraType: CameraType;

  // Поля для бега (dash) и прыжка (jump)
  private isDash: boolean = false;     // true, когда зажат Shift
  private wantToJump: boolean = false;   // true, когда нажали пробел
  private isJumping: boolean = false;    // true, когда камера не касается земли

  constructor(scene: Scene, canvas: HTMLCanvasElement, cameraType: CameraType = 'simple') {
    this.scene = scene;
    this.canvas = canvas;
    this.cameraType = cameraType;

    this.createCamera();

    // Если нужна "сложная" камера — добавляем прицел, pointer lock и обработку мыши
    if (this.cameraType === 'complex') {
      this.createCrosshair();
      this.setupPointerLock();
      this.setupMouseEvents();
    }

    // Подписываемся на события движения, прыжка и бега
    this.setupMovementEvents();
  }

  private createCamera(): void {
    this.camera = new FreeCamera("camera", new Vector3(35, 3, 0), this.scene);
    this.camera.attachControl(this.canvas, true);

    // Общие настройки камеры
    this.camera.applyGravity = true;        // Включаем гравитацию
    this.camera.checkCollisions = true;       // Включаем столкновения (учитываются у мешей, у которых checkCollisions = true)
    this.camera.ellipsoid = new Vector3(0.5, 0.8, 0.5); // Ellipsoid для камеры (важен для определения "ног")
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;                 // Базовая скорость
    this.camera.angularSensibility = 4000;
    this.camera.rotation.y = -Math.PI / 2;
    this.camera.inertia = 0.82;

    // Настройка клавиш (WASD)
    this.camera.keysUp.push(87);    // W
    this.camera.keysLeft.push(65);  // A
    this.camera.keysDown.push(83);  // S
    this.camera.keysRight.push(68); // D

    // Фокусируемся на канвасе
    this.canvas.focus();
  }

  /**
   * Создаём прицел (crosshair) в центре экрана
   */
  private createCrosshair(): void {
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

  /**
   * Включаем/выключаем Pointer Lock по нажатию E (или русской "У")
   */
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

  /**
   * Обработка кликов мышью. Левая кнопка — проверка попадания лучом.
   */
  private setupMouseEvents(): void {
    this.scene.onPointerDown = (evt) => {
      if (!this.isLocked) {
        this.togglePointerLock();
      }

      // Если нажата левая кнопка мыши (button === 0)
      if (evt.button === 0) {
        const origin = this.camera.globalPosition.clone();
        const forward = this.camera.getDirection(Vector3.Forward());
        const ray = new Ray(origin, forward, 200);

        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable);
        if (hit?.pickedMesh) {
          console.log("Попадание по объекту:", hit.pickedMesh.name);
          const pickedMesh = hit.pickedMesh;
          const actionManager = pickedMesh.actionManager;
          if (actionManager) {
            actionManager.processTrigger(ActionManager.OnRightPickTrigger);
          }
        }
      }
    };
  }

  /**
   * Включаем/выключаем Pointer Lock.
   */
  public togglePointerLock(): void {
    if (this.isLocked) {
      document.exitPointerLock?.();
    } else {
      this.canvas.requestPointerLock();
    }
  }

  /**
   * Обработчик изменения состояния Pointer Lock.
   */
  private pointerLockChange(): void {
    const controlEnabled =
      document.pointerLockElement === this.canvas ||
      (document as any).mozPointerLockElement === this.canvas ||
      (document as any).webkitPointerLockElement === this.canvas ||
      (document as any).msPointerLockElement === this.canvas;

    this.isLocked = controlEnabled;
    document.body.style.cursor = this.isLocked ? 'none' : '';
  }

  // -------------------------------------------------------
  // Логика прыжка (Space) и ускорения (Shift)
  // -------------------------------------------------------

  /**
   * Подписываемся на события клавиатуры и обновляем движение камеры каждый кадр.
   * Здесь используется первоначальный рабочий вариант прыжка,
   * с доработкой: если камера находится на земле, вертикальная составляющая движения обнуляется,
   * чтобы при движении (например, назад при наклоне вниз) камера не поднималась.
   */
  private setupMovementEvents(): void {
    // Подписка на нажатие/отпускание клавиш
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        if (kbInfo.event.code === "ShiftLeft") {
          this.isDash = true;
        }
        if (kbInfo.event.code === "Space") {
          this.wantToJump = true;
        }
      } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
        if (kbInfo.event.code === "ShiftLeft") {
          this.isDash = false;
        }
      }
    });

    // Логика, выполняемая каждый кадр перед рендерингом
    this.scene.onBeforeRenderObservable.add(() => {
      // 1. Устанавливаем скорость камеры (учитывая бег)
      this.camera.speed = this.isDash ? 1.1 : 0.55;

      // 2. Луч вниз для проверки, находится ли камера на земле
      const rayDown = new Ray(this.camera.position, Vector3.Down(), 10);
      const pickInfo = this.scene.pickWithRay(rayDown, (mesh) => true);
      let onGround = false;
      if (pickInfo?.hit && pickInfo.distance < 2.1) {
        onGround = true;
      }

      // 3. Определяем, на земле ли камера
      this.isJumping = !onGround;

      // 4. Если хотим прыгнуть и камера на земле, задаём импульс прыжка
      if (this.wantToJump && onGround) {
        // Применяем вертикальный импульс для прыжка
        this.camera.cameraDirection.y += 0.7;
      }

      /* 
         5. Если камера на земле, обнуляем вертикальную составляющую направления движения.
         Это предотвращает накопление вертикального компонента при движении назад, если камера наклонена вниз.
         При этом, если был инициирован прыжок, импульс уже добавлен.
      */
      if (onGround && !this.wantToJump) {
        this.camera.cameraDirection.y = 0;
      }

      // 6. Сбрасываем флаг желания прыгнуть, чтобы прыжок не повторялся каждый кадр
      this.wantToJump = false;
    });
  }
}
