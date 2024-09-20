import { Scene, ActionManager, ExecuteCodeAction, AbstractMesh, MeshBuilder, Vector3, Mesh } from "@babylonjs/core";

export class TriggersManager {
  private distanceThreshold: number
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
        targetMesh.actionManager = new ActionManager(this.scene);
        console.log("You are near!")

        // Добавляем действие на клик
        targetMesh.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnPickTrigger, // Триггер на клик
                () => {
                    console.log("Object clicked!");
                    alert("You clicked on the object!");
                }
            )
        );
    } else {
        console.log("Too far from the object to interact.");
    }
}

// Метод для вычисления расстояния между камерой и объектом
  getDistanceToCamera(targetMesh: AbstractMesh): number {
      const cameraPosition = this.scene.activeCamera!.globalPosition;
      const objectPosition = targetMesh.getAbsolutePosition();
      return Vector3.Distance(cameraPosition, objectPosition); // Вычисление расстояния
  }
}
