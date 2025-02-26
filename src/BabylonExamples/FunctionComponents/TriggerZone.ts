// import {
//     Scene,
//     Vector3,
//     ActionManager,
//     ExecuteCodeAction,
//     MeshBuilder,
//     AbstractMesh,
//     Mesh, // Импортируем Mesh для доступа к константам sideOrientation
//   } from "@babylonjs/core";
  
//   export class TriggerZone {
//     interactionZone: AbstractMesh;
//     cameraCollider: AbstractMesh;
//     onEnterZone: () => void;
//     onExitZone?: () => void;
  
//     constructor(
//       scene: Scene,
//       canvas: HTMLCanvasElement,
//       zonePosition: Vector3,
//       onEnterZone: () => void,
//       onExitZone?: () => void,
//       camSize: number = 2,
//       enableCollision: boolean = false
//     ) {
//       this.onEnterZone = onEnterZone;
//       this.onExitZone = onExitZone;
  
//       // Создаём куб с инвертированными нормалями
//       this.interactionZone = MeshBuilder.CreateBox(
//         "interactionZone",
//         { 
//           size: camSize,
//           sideOrientation: Mesh.BACKSIDE // Инвертируем нормали
//         },
//         scene
//       );
//       this.interactionZone.isVisible = false; // Сделаем куб невидимым, если не требуется визуализация
//       this.interactionZone.position = zonePosition;
//       this.interactionZone.checkCollisions = enableCollision;
//       this.interactionZone.isPickable = false;
  
//       this.cameraCollider = MeshBuilder.CreateBox(
//         "cameraCollider",
//         { size: 1 },
//         scene
//       );
//       this.cameraCollider.isVisible = false;
//       this.cameraCollider.parent = scene.activeCamera;
//       this.cameraCollider.isPickable = false;
  
//       this.cameraCollider.actionManager = new ActionManager(scene);
  
//       this.cameraCollider.actionManager.registerAction(
//         new ExecuteCodeAction(
//           {
//             trigger: ActionManager.OnIntersectionEnterTrigger,
//             parameter: { mesh: this.interactionZone },
//           },
//           () => {
//             this.onEnterZone();
//           }
//         )
//       );
  
//       if (this.onExitZone) {
//         this.cameraCollider.actionManager.registerAction(
//           new ExecuteCodeAction(
//             {
//               trigger: ActionManager.OnIntersectionExitTrigger,
//               parameter: { mesh: this.interactionZone },
//             },
//             () => {
//               this.onExitZone!();
//             }
//           )
//         );
//       }
//     }
  
//     getInteractionZone(): AbstractMesh {
//       return this.interactionZone;
//     }
  
//     dispose() {
//       this.interactionZone.dispose();
//       this.cameraCollider.dispose();
//     }
//   }
  

import {
  Scene,
  Vector3,
  MeshBuilder,
  AbstractMesh,
  Mesh,
  FreeCamera
} from "@babylonjs/core";

export class TriggerZone {
  interactionZone: AbstractMesh;
  onEnterZone: () => void;
  onExitZone?: () => void;
  private _isCameraInside: boolean = false;

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

    // Создаём куб с инвертированными нормалями – оставляем без изменений
    this.interactionZone = MeshBuilder.CreateBox(
      "interactionZone",
      { 
        size: camSize,
        sideOrientation: Mesh.BACKSIDE // инвертируем нормали
      },
      scene
    );
    this.interactionZone.isVisible = false; // если не нужна визуализация
    this.interactionZone.position = zonePosition;
    this.interactionZone.checkCollisions = enableCollision;
    this.interactionZone.isPickable = false;

    scene.onBeforeRenderObservable.add(() => {
      const camera = scene.activeCamera;
      if (!camera) return;

      // Определяем "радиус" камеры на основе её ellipsoid (для FreeCamera)
      let cameraRadius = 0;
      if ((camera as FreeCamera).ellipsoid) {
        const ellipsoid = (camera as FreeCamera).ellipsoid;
        // Берём максимальный размер как радиус (можно настроить по необходимости)
        cameraRadius = Math.max(ellipsoid.x, ellipsoid.y, ellipsoid.z);
      } else {
        // Если ellipsoid не задан, можно задать значение по умолчанию
        cameraRadius = 1;
      }

      // Получаем ограничивающий объём (AABB) зоны в мировых координатах
      const boundingBox = this.interactionZone.getBoundingInfo().boundingBox;
      const min = boundingBox.minimumWorld;
      const max = boundingBox.maximumWorld;

      const camPos = camera.position;

      // Вычисляем квадрат расстояния от точки (центр камеры) до AABB
      let sqDist = 0;

      if (camPos.x < min.x) {
        sqDist += (min.x - camPos.x) * (min.x - camPos.x);
      } else if (camPos.x > max.x) {
        sqDist += (camPos.x - max.x) * (camPos.x - max.x);
      }

      if (camPos.y < min.y) {
        sqDist += (min.y - camPos.y) * (min.y - camPos.y);
      } else if (camPos.y > max.y) {
        sqDist += (camPos.y - max.y) * (camPos.y - max.y);
      }

      if (camPos.z < min.z) {
        sqDist += (min.z - camPos.z) * (min.z - camPos.z);
      } else if (camPos.z > max.z) {
        sqDist += (camPos.z - max.z) * (camPos.z - max.z);
      }

      // Если квадрат расстояния меньше или равен квадрату радиуса,
      // значит сфера (камера) касается или пересекает AABB
      if (sqDist <= cameraRadius * cameraRadius) {
        if (!this._isCameraInside) {
          this._isCameraInside = true;
          this.onEnterZone();
        }
      } else {
        if (this._isCameraInside) {
          this._isCameraInside = false;
          if (this.onExitZone) {
            this.onExitZone();
          }
        }
      }
    });
  }

  getInteractionZone(): AbstractMesh {
    return this.interactionZone;
  }

  dispose() {
    this.interactionZone.dispose();
  }
}
