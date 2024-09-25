import { Scene, ActionManager, ExecuteCodeAction, AbstractMesh, MeshBuilder, Vector3, Mesh, FreeCamera, Animation } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";

export class TriggersManager {
  private distanceThreshold: number
  private zone: number[];
  constructor(private scene: Scene, private canvas: HTMLCanvasElement) {
    this.distanceThreshold = 10
  }

  setupClickTrigger(mesh: AbstractMesh, callback: () => void): void {
    mesh.actionManager = new ActionManager(this.scene);
    
    // Изменение курсора на pointer при наведении на меш
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer";
      })
    );

    // Возврат к стандартному курсору при уходе с меша
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

  setupProximityTrigger(targetMesh: AbstractMesh, callback: () => void): void {
    const interactionZone = MeshBuilder.CreateBox("interactionZone", { size: 3 }, this.scene); 
    interactionZone.isVisible = true; // Зона невидима
    interactionZone.parent = targetMesh;
    interactionZone.position = new Vector3(0, 0, 0);
    
    // Невидимый бокс для камеры
    const cameraCollider = MeshBuilder.CreateBox("cameraCollider", { size: 3 }, this.scene);
    cameraCollider.isVisible = false;
    cameraCollider.parent = this.scene.activeCamera;

    cameraCollider.actionManager = new ActionManager(this.scene);

    // Действие при пересечении камеры с зоной взаимодействия
    cameraCollider.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: { mesh: interactionZone }, // Меш для проверки пересечения
        },
        () => {
          callback();
        }
      )
    );
  }

  enableClickInteraction(targetMesh: AbstractMesh) {
    const distance = this.getDistanceToCamera(targetMesh);
    
    // Проверяем расстояние между камерой и объектом
    if (distance <= this.distanceThreshold) {
        if (!targetMesh.actionManager) {
            targetMesh.actionManager = new ActionManager(this.scene);
            console.log("You are near!");

            // Добавляем действие на клик
            targetMesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnPickTrigger,
                    () => {
                        console.log("Object clicked!");
                        alert("You clicked on the object!");
                    }
                )
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
  setupZoneTrigger(zone: number[]): void {
    // Создаем interactionZone на указанных координатах
    const interactionZone = MeshBuilder.CreateBox("interactionZone", { size: 2 }, this.scene); 
    interactionZone.isVisible = true; // Зона невидима
    interactionZone.position = new Vector3(zone[0], zone[1], zone[2]); // Указанные координаты
    interactionZone.checkCollisions = false; // Не нужно для коллизий

    // Создаем невидимый бокс для камеры
    const cameraCollider = MeshBuilder.CreateBox("cameraCollider", { size: 1 }, this.scene);
    cameraCollider.isVisible = false; // Невидимый бокс
    cameraCollider.parent = this.scene.activeCamera; // Связываем с камерой

    // Устанавливаем ActionManager на этот бокс
    cameraCollider.actionManager = new ActionManager(this.scene);

    // Добавляем действие на пересечение с зоной взаимодействия
    cameraCollider.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: { mesh: interactionZone }, // Зона взаимодействия
        },
        () => {
          console.log("Camera intersected with the interaction zone!");
          alert("Camera reached the interaction zone!"); // Можно заменить на нужное действие
        }
      )
    );
  }

  setupClickAnimationTrigger(mesh: AbstractMesh, callback: () => void, camera: FreeCamera): void {
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
  
        // Перемещаем камеру к мешу
        const targetPosition = mesh.getAbsolutePosition().add(new Vector3(0, 2, 5)); // Позиция камеры относительно меша
        this.animateCameraToPosition(camera, targetPosition, () => {
          // Создаем кнопку возврата
          this.createReturnButton(originalPosition, camera);
        });
  
        callback();
      })
    );
  }
  
  // Анимация движения камеры
  animateCameraToPosition(camera: FreeCamera, targetPosition: Vector3, onAnimationEnd: () => void): void {
    const animation = new Animation(
      "cameraMove",
      "position",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
  
    const keys = [];
    keys.push({ frame: 0, value: camera.position.clone() });
    keys.push({ frame: 100, value: targetPosition });
    
    animation.setKeys(keys);
    camera.animations = [animation];
  
    this.scene.beginAnimation(camera, 0, 100, false, 1, onAnimationEnd);
  }
  
  // Создание кнопки для возврата камеры
  createReturnButton(originalPosition: Vector3, camera: FreeCamera): void {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  
    const returnButton = Button.CreateSimpleButton("returnBtn", "Return");
    returnButton.width = "150px";
    returnButton.height = "50px";
    returnButton.color = "white";
    returnButton.background = "green";
    returnButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    returnButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(returnButton);
  
    returnButton.onPointerDownObservable.add(() => {
      advancedTexture.removeControl(returnButton); // Удаляем кнопку после клика
      this.animateCameraToPosition(camera, originalPosition, () => {
        console.log("Camera returned to original position");
      });
    });
  }
  

}

