import {
  Scene,
  ActionManager,
  ExecuteCodeAction,
  AbstractMesh,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { AdvancedDynamicTexture } from '@babylonjs/gui';

export class TriggersManager {
  private distanceThreshold: number;

  constructor( private scene: Scene, private canvas: HTMLCanvasElement, private guiTexture: AdvancedDynamicTexture) {
      this.distanceThreshold = 10; // Установите порог расстояния для триггеров
      this.canvas = canvas;
      this.guiTexture = guiTexture;
      
  }

  // Добавляем метод start
  start() {
    console.log("Метод start в TriggersManager вызван.");

    // Здесь добавьте вашу логику для инициализации триггеров
    this.initializeTriggers(); // Вызов метода для инициализации триггеров
}
    // Пример метода инициализации триггеров
    private initializeTriggers() {
        // Логика для установки триггеров
        console.log("Инициализация триггеров выполнена.");

        // Пример создания триггеров
        // this.setupProximityTrigger();
        // this.setupClickTrigger();
    }
  

  // Настройка триггера на клик
  setupClickTrigger(mesh: AbstractMesh, callback: () => void): void {
      mesh.actionManager = new ActionManager(this.scene);

      // Создание материала для подсветки
      const highlightMaterial = new StandardMaterial("highlightMaterial", this.scene);
      highlightMaterial.diffuseColor = new Color3(1, 0, 0); // Красный цвет

      // Изменение курсора на pointer при наведении на меш
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
              this.canvas.style.cursor = "pointer";
              mesh.material = highlightMaterial; // Подсветка материала при наведении
          })
      );

      // Возврат материала на место
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
              this.canvas.style.cursor = "default";
              mesh.material = null; // Возврат к оригинальному материалу
          })
      );

      // Действие при клике
      mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
              callback();
          })
      );
  }

  // Настройка триггера по близости
  setupProximityTrigger(mesh: AbstractMesh, onEnter: () => void): void {
      const triggerZone = MeshBuilder.CreateBox("triggerZone", { size: this.distanceThreshold }, this.scene);
      triggerZone.position = mesh.position.clone(); // Установите позицию триггера в позицию лестницы
      triggerZone.isVisible = false; // Скрываем триггер
      triggerZone.checkCollisions = true; // Включите столкновения для триггера
  
      this.scene.onBeforeRenderObservable.add(() => {
          if (this.scene.activeCamera) {
              const cameraPosition = this.scene.activeCamera.position;
              // Проверьте пересечение с триггером
              if (triggerZone.intersectsPoint(cameraPosition)) {
                  console.log("Камера вошла в зону триггера!");
                  onEnter();
                  // Удаляем триггер, чтобы не срабатывал многократно
                  triggerZone.dispose(); 
              }
          }
      });
  }

  // Включение клика на объекте
  enableClickInteraction(mesh: AbstractMesh): void {
      mesh.isPickable = true; // Убедитесь, что меш доступен для клика
  }
}
