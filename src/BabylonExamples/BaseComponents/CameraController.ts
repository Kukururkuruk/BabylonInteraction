// CameraController.ts
import { 
  Scene, 
  FreeCamera, 
  Vector3, 
  Ray, 
  ActionManager,
  KeyboardEventTypes,  // <-- Добавили для удобной работы с onKeyboardObservable
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";

export type CameraType = 'simple' | 'complex';

export class CameraController {
  public camera: FreeCamera;
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private isLocked: boolean = false;
  private cameraType: CameraType;

  // --- Новые поля для бега (dash) и прыжка (jump) ---
  private isDash: boolean = false;     // True, когда зажат Shift
  private wantToJump: boolean = false; // True, когда нажали пробел
  private isJumping: boolean = false;  // True, когда находимся на определённой высоте

  constructor(scene: Scene, canvas: HTMLCanvasElement, cameraType: CameraType = 'simple') {
    this.scene = scene;
    this.canvas = canvas;
    this.cameraType = cameraType;

    this.createCamera();

    // Если нужна "сложная" камера — добавим прицел, pointer lock и обработку мыши
    if (this.cameraType === 'complex') {
      this.createCrosshair();
      this.setupPointerLock();
      this.setupMouseEvents();
    }

    // В любом случае добавим логику прыжка/бега
    this.setupMovementEvents();
  }

  private createCamera(): void {
    this.camera = new FreeCamera("camera", new Vector3(35, 3, 0), this.scene);
    this.camera.attachControl(this.canvas, true);

    // Общие настройки камеры
    this.camera.applyGravity = true;        // Включаем "гравитацию" для камеры
    this.camera.checkCollisions = true;     // Столкновения с мешами, у которых checkCollisions = true
    this.camera.ellipsoid = new Vector3(0.5,0.8, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;              // Базовая скорость
    this.camera.angularSensibility = 4000;
    this.camera.rotation.y = -Math.PI / 2;
    this.camera.inertia = 0.82;

    // Настраиваем управление с клавиатуры (WASD)
    this.camera.keysUp.push(87);    // W
    this.camera.keysLeft.push(65);  // A
    this.camera.keysDown.push(83);  // S
    this.camera.keysRight.push(68); // D

    // Чтобы сразу реагировать на нажатия
    this.canvas.focus();
  }

  /**
   * Создаём прицел в центре экрана
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
   * Включаем/выключаем Pointer Lock по нажатию E
   */
  private setupPointerLock(): void {
    window.addEventListener("keydown", (event) => {
      // E или русская У (для некоторых раскладок)
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
   * Обработка кликов мышью.
   * Левая кнопка мыши — проверяем попадание лучом.
   */
  private setupMouseEvents(): void {
    this.scene.onPointerDown = (evt) => {
      if (!this.isLocked) {
        this.togglePointerLock();
      }

      // Проверка нажатия левой кнопки мыши (button === 0)
      if (evt.button === 0) {
        const origin = this.camera.globalPosition.clone();
        const forward = this.camera.getDirection(Vector3.Forward());
        const ray = new Ray(origin, forward, 200);

        // Проверяем пересечение с мешами
        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable);

        if (hit?.pickedMesh) {
          console.log("Попадание по объекту:", hit.pickedMesh.name);

          const pickedMesh = hit.pickedMesh;
          const actionManager = pickedMesh.actionManager;

          if (actionManager) {
            // Обработка события клика (как пример)
            actionManager.processTrigger(ActionManager.OnRightPickTrigger);
          }
        }
      }
    };
  }

  /**
   * Включаем/выключаем Pointer Lock
   */
  public togglePointerLock(): void {
    if (this.isLocked) {
      // Выход из режима PointerLock
      document.exitPointerLock?.();
    } else {
      // Вход в режим PointerLock
      this.canvas.requestPointerLock();
    }
  }

  /**
   * Срабатывает, когда браузер меняет состояние pointer lock
   */
  private pointerLockChange(): void {
    const controlEnabled =
      document.pointerLockElement === this.canvas ||
      (document as any).mozPointerLockElement === this.canvas ||
      (document as any).webkitPointerLockElement === this.canvas ||
      (document as any).msPointerLockElement === this.canvas;

    this.isLocked = controlEnabled;

    // Когда камера "захвачена", прячем курсор
    if (this.isLocked) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = '';
    }
  }

  // -------------------------------------------------------
  // НИЖЕ: Логика прыжка (Space) и ускорения (Shift)
  // -------------------------------------------------------

  /**
   * Подписываемся на события клавиатуры и раз в кадр обновляем камеру
   */
  private setupMovementEvents(): void {
    // Подписка на нажатие и отпускание клавиш
    this.scene.onKeyboardObservable.add((kbInfo) => {
      // KEYDOWN
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        // console.log("[KeyboardDown]", kbInfo.event.code);
        
        if (kbInfo.event.code === "ShiftLeft") {
          this.isDash = true;
          // console.log("Shift зажат — включаем бег. isDash =", this.isDash);
        }
        if (kbInfo.event.code === "Space") {
          this.wantToJump = true;
          // console.log("Пробел нажат — хотим прыгать. wantToJump =", this.wantToJump);
        }
      }
      // KEYUP
      else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
        // console.log("[KeyboardUp]", kbInfo.event.code);

        if (kbInfo.event.code === "ShiftLeft") {
          this.isDash = false;
          // console.log("Shift отпущен — выключаем бег. isDash =", this.isDash);
        }
      }
    });

    // Логика, которая срабатывает в каждом кадре
    this.scene.onBeforeRenderObservable.add(() => {
      // 1. Лог скорости камеры
      this.camera.speed = this.isDash ? 1.1 : 0.55;
      // Можно залогировать, какую скорость в итоге получаем:
      // console.log("Camera speed =", this.camera.speed);

      // 2. Луч вниз, чтобы проверить, "на земле" ли мы
      const rayDown = new Ray(this.camera.position, Vector3.Down(), 10);
      const pickInfo = this.scene.pickWithRay(rayDown, (mesh) => true);
      // console.log("pickInfo", pickInfo);

      // 3. Определяем, "на земле" ли
      let onGround = false;
      if (pickInfo?.hit && pickInfo.distance < 2.1) {
        onGround = true;
      }

      // Запоминаем, "в прыжке" ли мы. Если onGround, то нет
      this.isJumping = !onGround;

      // console.log(`onGround = ${onGround}, isJumping = ${this.isJumping}, wantToJump = ${this.wantToJump}`);

      // 4. Сам прыжок: если хотим прыгнуть и мы на земле
      if (this.wantToJump && onGround) {
        this.camera.cameraDirection.y += 0.5;
        // console.log(">>> Прыгаем! cameraDirection.y =", this.camera.cameraDirection.y);
      }

      // 5. Сбрасываем флаг, чтобы не прыгать бесконечно
      this.wantToJump = false;
    });
}


}
