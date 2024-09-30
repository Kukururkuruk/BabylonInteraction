import {
  Scene,
  ActionManager,
  ExecuteCodeAction,
  AbstractMesh,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Engine,
  Color3,
} from "@babylonjs/core";

export class TriggersManager {
  private distanceThreshold: number;
  

  constructor(private scene: Scene, private canvas: HTMLCanvasElement) {
      this.distanceThreshold = 10; // Установите порог расстояния для триггеров
  }

  // Настройка триггера на клик
  setupClickTrigger(mesh: AbstractMesh, callback: () => void): void {
      mesh.actionManager = new ActionManager(this.scene);

      // Создание материала для подсветки
      const highlightMaterial = new StandardMaterial("highlightMaterial", this.scene);
      highlightMaterial.diffuseColor = new Color3(1, 0, 0); // Красный цвет

      // Изменение курсора на pointer при наведении на меш
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log("Меш кликнут:", mesh.name);
          })
      );

      // Возврат к стандартному материалу при уходе с меша
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
              this.canvas.style.cursor = "default";
              mesh.material = null; // Возврат к стандартному материалу
          })
      );

      // Действие при клике на меш
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              callback(); // Вызов коллбека при клике
              // Дополнительная логика при клике на объект
              mesh.material.diffuseColor = new Color3(0, 1, 0); // Изменение цвета на зеленый
          })
      );
  }

  // Настройка триггера на приближение
  setupProximityTrigger(targetMesh: AbstractMesh, callback: () => void): void {
      // Создаем видимую зону взаимодействия
      const interactionZone = MeshBuilder.CreateBox("interactionZone", { size: 3 }, this.scene);
      interactionZone.isVisible = true; // Зона видима

      // Создание материала для зоны триггера
      const zoneMaterial = new StandardMaterial("zoneMaterial", this.scene);
      zoneMaterial.diffuseColor = new Color3(1, 0, 0); // Красный цвет
      interactionZone.material = zoneMaterial; // Применение материала

      interactionZone.parent = targetMesh; // Привязываем зону к целевому мешу
      interactionZone.position = Vector3.Zero(); // Позиция зоны

      // Создаем коллайдер для камеры
      const cameraCollider = MeshBuilder.CreateBox("cameraCollider", { size: 3 }, this.scene);
      cameraCollider.isVisible = false; // Невидимый коллайдер
      cameraCollider.parent = this.scene.activeCamera; // Привязываем коллайдер к камере

      cameraCollider.actionManager = new ActionManager(this.scene);

      // Действие при пересечении камеры с зоной взаимодействия
      cameraCollider.actionManager.registerAction(
          new ExecuteCodeAction(
              {
                  trigger: ActionManager.OnIntersectionEnterTrigger,
                  parameter: interactionZone, // Меш для проверки пересечения
              },
              () => {
                  console.log("Камера вошла в зону триггера:", interactionZone.name);
                  callback(); // Вызываем коллбек при входе в зону
                  interactionZone.material.diffuseColor = new Color3(1, 1, 0); // Подсветка желтым при входе
              }
          )
      );
  }

  // Включение взаимодействия при клике
  enableClickInteraction(targetMesh: AbstractMesh): void {
      const distance = this.getDistanceToCamera(targetMesh);
      

      // Проверяем расстояние между камерой и объектом
      if (distance <= this.distanceThreshold) {
          if (!targetMesh.actionManager) {
              targetMesh.actionManager = new ActionManager(this.scene);
              console.log("Вы близко!");

              // Добавляем действие на клик
              targetMesh.actionManager.registerAction(
                  new ExecuteCodeAction(
                      ActionManager.OnPickTrigger,
                      () => {
                          console.log("Объект кликнут!");
                          alert("Вы кликнули на объект!");
                      }
                  )
              );
          }
      } 
      // Удаляем actionManager, если слишком далеко, если это нужно
      else {
          targetMesh.actionManager = null; 
      }
  }

  // Метод для вычисления расстояния между камерой и объектом
  private getDistanceToCamera(targetMesh: AbstractMesh): number {
      const cameraPosition = this.scene.activeCamera!.globalPosition;
      const objectPosition = targetMesh.getAbsolutePosition();
      return Vector3.Distance(cameraPosition, objectPosition); // Вычисление расстояния
  }
}
