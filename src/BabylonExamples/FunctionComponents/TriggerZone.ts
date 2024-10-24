import {
    Scene,
    Vector3,
    ActionManager,
    ExecuteCodeAction,
    MeshBuilder,
    AbstractMesh,
    Mesh, // Импортируем Mesh для доступа к константам sideOrientation
  } from "@babylonjs/core";
  
  export class TriggerZone {
    interactionZone: AbstractMesh;
    cameraCollider: AbstractMesh;
    onEnterZone: () => void;
    onExitZone?: () => void;
  
    constructor(
      scene: Scene,
      canvas: HTMLCanvasElement,
      zonePosition: Vector3,
      onEnterZone: () => void,
      onExitZone?: () => void,
      camSize: number = 2,
      enableCollision: boolean = false
    ) {
      this.onEnterZone = onEnterZone;
      this.onExitZone = onExitZone;
  
      // Создаём куб с инвертированными нормалями
      this.interactionZone = MeshBuilder.CreateBox(
        "interactionZone",
        { 
          size: camSize,
          sideOrientation: Mesh.BACKSIDE // Инвертируем нормали
        },
        scene
      );
      this.interactionZone.isVisible = false; // Сделаем куб невидимым, если не требуется визуализация
      this.interactionZone.position = zonePosition;
      this.interactionZone.checkCollisions = enableCollision;
      this.interactionZone.isPickable = false;
  
      this.cameraCollider = MeshBuilder.CreateBox(
        "cameraCollider",
        { size: 1 },
        scene
      );
      this.cameraCollider.isVisible = false;
      this.cameraCollider.parent = scene.activeCamera;
      this.cameraCollider.isPickable = false;
  
      this.cameraCollider.actionManager = new ActionManager(scene);
  
      this.cameraCollider.actionManager.registerAction(
        new ExecuteCodeAction(
          {
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: { mesh: this.interactionZone },
          },
          () => {
            this.onEnterZone();
          }
        )
      );
  
      if (this.onExitZone) {
        this.cameraCollider.actionManager.registerAction(
          new ExecuteCodeAction(
            {
              trigger: ActionManager.OnIntersectionExitTrigger,
              parameter: { mesh: this.interactionZone },
            },
            () => {
              this.onExitZone!();
            }
          )
        );
      }
    }
  
    getInteractionZone(): AbstractMesh {
      return this.interactionZone;
    }
  
    dispose() {
      this.interactionZone.dispose();
      this.cameraCollider.dispose();
    }
  }
  