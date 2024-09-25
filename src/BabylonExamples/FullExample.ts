import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
  Ray,
  AbstractMesh,
  RayHelper,
  Color3,
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { GUIManager } from './FunctionComponents/GUIManager';
import { TriggersManager } from './FunctionComponents/TriggerManager';

export class FullExample {
  scene: Scene;
  engine: Engine;
  guiManager: GUIManager;
  triggerManager: TriggersManager;
  camera: FreeCamera; // Добавлено свойство для камеры
  onOpenModal?: () => void; // Callback для открытия модального окна
  textMessages: string[] = [
      'Нажмите на W',
      'Нажмите на S',
      'Нажмите на A',
      'Нажмите на D',
      'А теперь осмотритесь по комнате',
  ];
  zone: number[] = [-6.446488282388818, 34.01996502991, 20.47696419056087];
  targetMeshes: AbstractMesh[] = [];
  potato: AbstractMesh;

  constructor(private canvas: HTMLCanvasElement) {
      this.engine = new Engine(this.canvas, true);
      this.scene = this.CreateScene();

      this.guiManager = new GUIManager(this.scene, this.textMessages);
      this.triggerManager = new TriggersManager(this.scene, this.canvas);

      this.CreateEnvironment();
      this.CreateController();

      this.engine.runRenderLoop(() => {
          this.scene.render();
          this.targetMeshes.forEach((mesh) => {
              this.triggerManager.enableClickInteraction(mesh);
          });
      });
  }

  CreateScene(): Scene {
      const scene = new Scene(this.engine);
      new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);

      const framesPerSecond = 60;
      const gravity = -9.81;
      scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
      scene.collisionsEnabled = true;

      return scene;
  }

  async CreateEnvironment(): Promise<void> {
      const { meshes } = await SceneLoader.ImportMeshAsync(
          '',
          './models/',
          'envSetting.glb',
          this.scene
      );

      this.targetMeshes = meshes.filter((mesh) =>
          mesh.name.toLowerCase().includes('box')
      );
      this.potato = meshes[67];
      this.createRayAboveMesh(this.potato);

      // Передаем камеру в триггер
      this.triggerManager.setupClickAnimationTrigger(this.potato, () => {
          console.log("Mesh clicked!");
      }, this.camera);

      console.log('Target meshes:', this.targetMeshes);

      this.targetMeshes.forEach((mesh) => {
          mesh.checkCollisions = true;
          this.createRayAboveMesh(mesh);
          this.guiManager.createButtonAboveMesh(mesh);

          // Устанавливаем триггер для открытия модального окна
          this.triggerManager.setupProximityTrigger(mesh, () => {
              console.log('Camera intersected with the mesh!');
              if (this.onOpenModal) {
                  this.onOpenModal();
              }
          });

          this.triggerManager.enableClickInteraction(mesh);
      });

      console.log(meshes);
      this.triggerManager.setupZoneTrigger(this.zone);
      this.guiManager.createGui();
  }

  CreateController(): void {
      this.camera = new FreeCamera('camera', new Vector3(20, 100, 0), this.scene);
      this.camera.attachControl(this.canvas, false);

      this.camera.applyGravity = false;
      this.camera.checkCollisions = true;
      this.camera.ellipsoid = new Vector3(1, 2, 1);
      this.camera.minZ = 0.45;
      this.camera.speed = 0.75;
      this.camera.angularSensibility = 4000;
      this.camera.keysUp.push(87); // W
      this.camera.keysLeft.push(65); // A
      this.camera.keysDown.push(83); // S
      this.camera.keysRight.push(68); // D

      // Optionally, you can show camera position each frame
      // const showCameraPosition = () => {
      //     const position = this.camera.position;
      //     console.log(`Camera Position: X: ${position.x}, Y: ${position.y}, Z: ${position.z}`);
      // };
      // this.scene.onBeforeRenderObservable.add(() => {
      //     showCameraPosition();
      // });
  }

  // Функция для создания луча над мешом
  createRayAboveMesh(mesh: AbstractMesh): void {
      const rayOrigin = mesh.getAbsolutePosition().clone();
      const rayDirection = new Vector3(0, 1, 0);
      const rayLength = 100;

      const ray = new Ray(rayOrigin, rayDirection, rayLength);

      const rayHelper = new RayHelper(ray);
      rayHelper.show(this.scene, new Color3(1, 0, 0));
  }
}
