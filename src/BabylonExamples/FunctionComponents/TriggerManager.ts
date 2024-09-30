import {
  Scene,
  ActionManager,
  ExecuteCodeAction,
  AbstractMesh,
  MeshBuilder,
  Vector3,
  Mesh,
  FreeCamera,
  Animation,
  RayHelper,
  Color3,
  Ray,
} from "@babylonjs/core";
import { Control } from "@babylonjs/gui";
import { GUIManager } from "./GUIManager";

export class TriggersManager {
  private distanceThreshold: number;
  private zoneTriggered: boolean = false;
  private interactionZone: Mesh | null = null;

  constructor(
    private scene: Scene,
    private canvas: HTMLCanvasElement,
    private guiManager: GUIManager
  ) {
    this.distanceThreshold = 10;
  }

  // Метод для установки триггера на зону
  setupZoneTrigger(zone: number[]): void {
    this.interactionZone = MeshBuilder.CreateBox(
      "interactionZone",
      { size: 2 },
      this.scene
    );
    this.interactionZone.isVisible = true; // Зона невидима
    this.interactionZone.position = new Vector3(zone[0], zone[1], zone[2]);
    this.interactionZone.checkCollisions = false;

    // Создаем невидимый бокс для камеры
    const cameraCollider = MeshBuilder.CreateBox(
      "cameraCollider",
      { size: 1 },
      this.scene
    );
    cameraCollider.isVisible = false;
    cameraCollider.parent = this.scene.activeCamera;

    cameraCollider.actionManager = new ActionManager(this.scene);

    cameraCollider.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: { mesh: this.interactionZone },
        },
        () => {
          if (!this.zoneTriggered) {
            this.zoneTriggered = true;
            console.log("Camera intersected with the interaction zone!");
            this.createStartButton();
          }
        }
      )
    );
  }


  // Создание кнопки "Начать"
  // createStartButton(): void {
  //   const startButton = this.guiManager.createButton({
  //     name: "startBtn",
  //     text: "Начать",
  //     background: "green",
  //     onClick: () => {
  //       this.guiManager.advancedTexture.removeControl(startButton);
  //       this.disableCameraMovement();
  //       this.setCameraRotation(0); // Устанавливаем камеру параллельно полу
  //       this.createCameraControlButtons();
  //     },
  //   });
  // }


  createStartButton(): void {
    const startButton = this.guiManager.createButton({
      name: "startBtn",
      text: "Начать",
      background: "green",
      onClick: () => {
        this.guiManager.advancedTexture.removeControl(startButton); // Убираем кнопку
        
        this.disableCameraMovement();
        
        // Устанавливаем положение камеры без анимации
        const camera = this.scene.activeCamera as FreeCamera;
        const angle = 0; // Угол (камера будет прямо перед зоной)
        const distance = -10; // Расстояние от зоны
        
        // Установка камеры без анимации
        this.setCameraPositionAndTarget(camera, this.interactionZone, angle, distance);
        
        // Оставляем ссылку на уже существующую функцию создания кнопок
        this.createCameraControlButtons();
      },
    });
}

// Функция мгновенного перемещения камеры и установки цели
  setCameraPositionAndTarget(
    camera: FreeCamera,
    targetZone: AbstractMesh,
    angle: number,
    distance: number
  ): void {
    const targetPosition = targetZone.getAbsolutePosition();

    // Вычисляем новую позицию камеры на основе угла и расстояния
    const x = targetPosition.x + distance * Math.sin(angle);
    const z = targetPosition.z + distance * Math.cos(angle);
    const y = targetPosition.y + 1.5; // Высота камеры

    // Мгновенно устанавливаем новую позицию камеры
    camera.position = new Vector3(x, y, z);

    // Устанавливаем направление камеры на зону
    camera.setTarget(targetPosition);
  }

  // Отключение движения камеры
  disableCameraMovement(): void {
    const camera = this.scene.activeCamera as FreeCamera;
    camera.detachControl();
  }

  // Включение движения камеры
  enableCameraMovement(): void {
    const camera = this.scene.activeCamera as FreeCamera;
    camera.attachControl(this.canvas, true);
  }

  // Установка наклона камеры
  setCameraRotation(angle: number): void {
    const camera = this.scene.activeCamera as FreeCamera;
    camera.rotation.x = angle;
  }

  // Создание кнопок управления камерой
  createCameraControlButtons(): void {
    const lookUpButton = this.guiManager.createButton({
      name: "lookUpBtn",
      text: "Вверх 45°",
      horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_LEFT,
      verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
      positionOffset: { left: "10px" },
      onClick: () => {
        this.setCameraRotation(-Math.PI / 4); // Наклон вверх на 45 градусов
      },
    });

    const lookDownButton = this.guiManager.createButton({
      name: "lookDownBtn",
      text: "Вниз 45°",
      horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_RIGHT,
      verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
      positionOffset: { left: "-10px" },
      onClick: () => {
        this.setCameraRotation(Math.PI / 4); // Наклон вниз на 45 градусов
      },
    });

    const lookLevelButton = this.guiManager.createButton({
      name: "lookLevelBtn",
      text: "Параллельно",
      verticalAlignment: Control.VERTICAL_ALIGNMENT_TOP,
      positionOffset: { top: "10px" },
      onClick: () => {
        this.setCameraRotation(0); // Параллельно полу
      },
    });

    const unlockButton = this.guiManager.createButton({
      name: "unlockBtn",
      text: "Разблокировать движение",
      width: "200px",
      background: "red",
      verticalAlignment: Control.VERTICAL_ALIGNMENT_BOTTOM,
      positionOffset: { top: "-10px" },
      onClick: () => {
        // Удаляем все кнопки
        this.guiManager.advancedTexture.removeControl(lookUpButton);
        this.guiManager.advancedTexture.removeControl(lookDownButton);
        this.guiManager.advancedTexture.removeControl(lookLevelButton);
        this.guiManager.advancedTexture.removeControl(unlockButton);

        // Включаем движение камеры
        this.enableCameraMovement();

        // Уничтожаем триггер-зону
        if (this.interactionZone) {
          this.interactionZone.dispose();
          this.interactionZone = null;
        }

        // Сбрасываем флаг триггера
        this.zoneTriggered = false;

        // Сбрасываем наклон камеры
        this.setCameraRotation(0);
      },
    });
  }

  // Модифицированный метод setupClickAnimationTrigger
  setupClickAnimationTrigger(
    mesh: AbstractMesh,
    callback: () => void,
    camera: FreeCamera
  ): void {
    mesh.actionManager = new ActionManager(this.scene);

    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer";
      })
    );

    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = "default";
      })
    );

    // Действие при клике на меш
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        const originalPosition = camera.position.clone(); // Сохраняем исходную позицию камеры

        // Угол и расстояние для новой позиции камеры
        const angle = 0; // Угол в радианах (0 - прямо перед объектом)
        const distance = 10; // Расстояние от объекта до камеры

        // Анимируем камеру к новой позиции под заданным углом и расстоянием
        this.animateCameraToAngle(camera, mesh, angle, distance, () => {
          // Отключаем движение камеры
          this.disableCameraMovement();

          // Создаем кнопку возврата
          this.createReturnButton(originalPosition, camera);
        });

        callback();
      })
    );
  }

  // Функция для анимации камеры под определенным углом относительно объекта
  animateCameraToAngle(
    camera: FreeCamera,
    targetMesh: AbstractMesh,
    angle: number,
    distance: number,
    onAnimationEnd: () => void
  ): void {
    const targetPosition = targetMesh.getAbsolutePosition();

    // Вычисляем новую позицию камеры на основе угла и расстояния
    const x = targetPosition.x + distance * Math.sin(angle);
    const z = targetPosition.z + distance * Math.cos(angle);
    const y = targetPosition.y + 1.5; // Высота камеры

    const targetCameraPosition = new Vector3(x, y, z);

    this.animateCamera(camera, targetCameraPosition, null, () => {
      // Устанавливаем направление камеры на объект
      camera.setTarget(targetPosition);

      // Наклоняем камеру вверх на 45 градусов
      camera.rotation.x -= Math.PI / 4; // Вычитаем, чтобы наклонить вверх

      onAnimationEnd();
    });
  }

  // Объединенный метод анимации камеры
  animateCamera(
    camera: FreeCamera,
    targetPosition: Vector3,
    targetRotation?: Vector3,
    onAnimationEnd?: () => void
  ): void {
    // Анимация позиции
    const positionAnimation = new Animation(
      "cameraPositionAnimation",
      "position",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const positionKeys = [
      { frame: 0, value: camera.position.clone() },
      { frame: 100, value: targetPosition },
    ];

    positionAnimation.setKeys(positionKeys);

    camera.animations = [positionAnimation];

    // Если требуется анимация вращения
    if (targetRotation) {
      const rotationAnimation = new Animation(
        "cameraRotationAnimation",
        "rotation",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const rotationKeys = [
        { frame: 0, value: camera.rotation.clone() },
        { frame: 100, value: targetRotation },
      ];

      rotationAnimation.setKeys(rotationKeys);

      camera.animations.push(rotationAnimation);
    }

    this.scene.beginAnimation(camera, 0, 100, false, 1, onAnimationEnd);
  }

  // Создание кнопки для возврата камеры
  createReturnButton(originalPosition: Vector3, camera: FreeCamera): void {
    const returnButton = this.guiManager.createButton({
      name: "returnBtn",
      text: "Вернуться",
      background: "green",
      verticalAlignment: Control.VERTICAL_ALIGNMENT_BOTTOM,
      onClick: () => {
        this.guiManager.advancedTexture.removeControl(returnButton); // Удаляем кнопку после клика
        this.animateCamera(camera, originalPosition, null, () => {
          // Возвращаем камеру к исходному положению и сбрасываем цель
          camera.setTarget(camera.position.add(camera.getForwardRay().direction));

          // Включаем движение камеры
          this.enableCameraMovement();

          console.log("Camera returned to original position");
        });
      },
    });
  }

  // Метод для установки триггера на клик
  setupClickTrigger(mesh: AbstractMesh, callback: () => void): void {
    mesh.actionManager = new ActionManager(this.scene);

    // Изменение курсора на pointer при наведении на меш
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer";
      })
    );

    // Возврат к стандартному курсу при уходе с меша
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = "default";
      })
    );

    // Действие при клике на меш
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        callback();
      })
    );
  }

  // Метод для установки триггера на приближение к мешу
  setupProximityTrigger(
    targetMesh: AbstractMesh,
    callback: () => void
  ): void {
    const interactionZone = MeshBuilder.CreateBox(
      "interactionZone",
      { size: 3 },
      this.scene
    );
    interactionZone.isVisible = true; // Зона невидима
    interactionZone.parent = targetMesh;
    interactionZone.position = new Vector3(0, 0, 0);

    // Невидимый бокс для камеры
    const cameraCollider = MeshBuilder.CreateBox(
      "cameraCollider",
      { size: 3 },
      this.scene
    );
    cameraCollider.isVisible = false;
    cameraCollider.parent = this.scene.activeCamera;

    cameraCollider.actionManager = new ActionManager(this.scene);

    // Действие при пересечении камеры с зоной взаимодействия
    cameraCollider.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: { mesh: interactionZone },
        },
        () => {
          callback();
        }
      )
    );
  }

  // Метод для активации клика по мешу, когда камера рядом
  enableClickInteraction(targetMesh: AbstractMesh): void {
    const distance = this.getDistanceToCamera(targetMesh);

    // Проверяем расстояние между камерой и объектом
    if (distance <= this.distanceThreshold) {
      if (!targetMesh.actionManager) {
        targetMesh.actionManager = new ActionManager(this.scene);
        console.log("You are near!");

        // Добавляем действие на клик
        targetMesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log("Object clicked!");
            alert("You clicked on the object!");
          })
        );
      }
    } else {
      targetMesh.actionManager = null; // Удаляем actionManager, если слишком далеко
    }
  }

  // Метод для вычисления расстояния между камерой и объектом
  getDistanceToCamera(targetMesh: AbstractMesh): number {
    const cameraPosition = this.scene.activeCamera!.globalPosition;
    const objectPosition = targetMesh.getAbsolutePosition();
    return Vector3.Distance(cameraPosition, objectPosition); // Вычисление расстояния
  }

  // Функция для создания луча над мешом (если требуется)
  createRayAboveMesh(mesh: AbstractMesh): void {
    const rayOrigin = mesh.getAbsolutePosition().clone();
    const rayDirection = new Vector3(0, 1, 0);
    const rayLength = 100;

    const ray = new Ray(rayOrigin, rayDirection, rayLength);

    const rayHelper = new RayHelper(ray);
    rayHelper.show(this.scene, new Color3(1, 0, 0));
  }
}
