import { Scene, FreeCamera, Vector3, Ray, MeshBuilder, StandardMaterial, Color3, Engine, Tools, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";

export class BabylonUtilities {
  private scene: Scene;
  private engine: Engine;
  private guiTexture: AdvancedDynamicTexture;

  constructor(scene: Scene, engine: Engine, guiTexture: AdvancedDynamicTexture) {
    this.scene = scene;
    this.engine = engine;
    this.guiTexture = guiTexture;
  }

  combinedMethod(): void {
    const camera = this.scene.activeCamera as FreeCamera;

    // Создаем сферу пересечения
    const pointSize = 0.05;
    const intersectionPoint = MeshBuilder.CreateSphere("intersectionPoint", { diameter: pointSize }, this.scene);
    const pointMaterial = new StandardMaterial("pointMaterial", this.scene);
    pointMaterial.emissiveColor = new Color3(1, 0, 0);
    intersectionPoint.material = pointMaterial;
    intersectionPoint.isVisible = false;
    intersectionPoint.isPickable = false;

    this.scene.registerBeforeRender(() => {
      const origin = camera.globalPosition.clone();
      const forward = camera.getDirection(Vector3.Forward());
      const ray = new Ray(origin, forward, 200);

      const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh !== intersectionPoint);

      if (hit && hit.pickedPoint) {
        intersectionPoint.position.copyFrom(hit.pickedPoint);
        intersectionPoint.isVisible = true;
      } else {
        intersectionPoint.isVisible = false;
      }
    });

    const spherePositionButton = Button.CreateSimpleButton("spherePositionButton", "Показать координаты сферы");
    spherePositionButton.width = "200px";
    spherePositionButton.height = "40px";
    spherePositionButton.color = "white";
    spherePositionButton.cornerRadius = 20;
    spherePositionButton.background = "blue";
    spherePositionButton.top = "120px";
    spherePositionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    this.guiTexture.addControl(spherePositionButton);

    spherePositionButton.onPointerUpObservable.add(() => {
      if (intersectionPoint && intersectionPoint.isVisible) {
        const spherePosition = intersectionPoint.position;
        console.log(`Координаты сферы: x=${spherePosition.x.toFixed(2)}, y=${spherePosition.y.toFixed(2)}, z=${spherePosition.z.toFixed(2)}`);
      } else {
        console.log("Сфера не видна или не инициализирована.");
      }
    });
  }

  AddScreenshotButton(): void {
    const screenshotButton = Button.CreateSimpleButton("screenshotButton", "Сделать скриншот");
    screenshotButton.width = "150px";
    screenshotButton.height = "40px";
    screenshotButton.color = "white";
    screenshotButton.cornerRadius = 20;
    screenshotButton.background = "blue";
    screenshotButton.top = "20px";
    screenshotButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    this.guiTexture.addControl(screenshotButton);

    screenshotButton.onPointerUpObservable.add(() => {
      Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera!, { width: 1920, height: 1080 });
    });
  }

  AddCameraPositionButton(): void {
    const camera = this.scene.activeCamera as FreeCamera;
    const cameraPositionButton = Button.CreateSimpleButton("cameraPositionButton", "Показать координаты камеры");
    cameraPositionButton.width = "200px";
    cameraPositionButton.height = "40px";
    cameraPositionButton.color = "white";
    cameraPositionButton.cornerRadius = 20;
    cameraPositionButton.background = "green";
    cameraPositionButton.top = "70px";
    cameraPositionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    this.guiTexture.addControl(cameraPositionButton);

    cameraPositionButton.onPointerUpObservable.add(() => {
      const cameraPosition = camera.position;
      const cameraRotation = camera.rotation;
      if (cameraPosition) {
        console.log(`Координаты камеры: x=${cameraPosition.x}, y=${cameraPosition.y}, z=${cameraPosition.z}`);
        console.log(`Поворот камеры: x=${cameraRotation.x}, y=${cameraRotation.y}, z=${cameraRotation.z}`);
      } else {
        console.log("Камера не инициализирована.");
      }
    });
  }

  patchCollisionDebug(): void {
    // 1) Переопределяем _collideForSubMesh у Mesh
    const originalCollideForSubMesh = Mesh.prototype._collideForSubMesh;
    Mesh.prototype._collideForSubMesh = function (subMesh, transformMatrix, collider) {
      // Здесь this = сам Mesh (потому что .call(this, ...))
      console.log(`[DEBUG] _collideForSubMesh => mesh="${this.name}", subMeshID=${subMesh._id}`);
      return originalCollideForSubMesh.call(this, subMesh, transformMatrix, collider);
    };

  }

  logClickedMesh(): void {
    this.scene.onPointerDown = (evt) => {
      // Проверяем, что нажата левая кнопка мыши (button === 0)
      if (evt.button === 0) {
        const camera = this.scene.activeCamera as FreeCamera;
        const origin = camera.globalPosition.clone();
        const forward = camera.getDirection(Vector3.Forward());
        const ray = new Ray(origin, forward, 200);
  
        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable);
        if (hit?.pickedMesh) {
          console.log("Клик по мешу:", hit.pickedMesh.name);
        }
      }
    };
  }
}
