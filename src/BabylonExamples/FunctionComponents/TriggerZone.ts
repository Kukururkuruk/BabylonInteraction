import {
  Scene,
  Vector3,
  ActionManager,
  ExecuteCodeAction,
  MeshBuilder,
  AbstractMesh,
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
      camSize: number = 2
  ) {
      this.onEnterZone = onEnterZone;
      this.onExitZone = onExitZone;

      this.interactionZone = MeshBuilder.CreateBox(
          "interactionZone",
          { size: camSize },
          scene
      );
      this.interactionZone.isVisible = false;
      this.interactionZone.position = zonePosition;
      this.interactionZone.checkCollisions = false;
      this.interactionZone.isPickable = false; // Добавляем эту строку

      this.cameraCollider = MeshBuilder.CreateBox(
          "cameraCollider",
          { size: 1 },
          scene
      );
      this.cameraCollider.isVisible = false;
      this.cameraCollider.parent = scene.activeCamera;
      this.cameraCollider.isPickable = false; // Добавляем эту строку

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