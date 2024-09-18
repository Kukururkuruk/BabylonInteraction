import {
  Scene,
  Mesh,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
  ActionManager,
  ExecuteCodeAction,
  AbstractMesh,
  PointerEventTypes,
  PointerDragBehavior,
  MeshBuilder,
  Axis,
  Space
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as GUI from "@babylonjs/gui"; // Import GUI components

export class BasicScene {
  scene: Scene;
  engine: Engine;
  ramp: AbstractMesh;
  prop1: AbstractMesh;
  prop2: AbstractMesh;
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    this.CreateEnvironment();
    this.CreateController();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Prototype_Level.glb",
      this.scene
    );

    this.ramp = meshes[8];
    this.prop1 = meshes[7];
    this.prop2 = meshes[6];
    console.log(meshes[7]);
    console.log(meshes);

    meshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    this.setupRampInteraction();
    this.setupCubInteraction();

    // Create a plane above prop2
    const plane = MeshBuilder.CreatePlane("plane", { size: 2 }, this.scene);
    plane.position = new Vector3(this.prop2.position.x, this.prop2.position.y + 7, this.prop2.position.z);

    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    
    // Create GUI advanced texture and button
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane);

    const button1 = GUI.Button.CreateSimpleButton("but1", "Click Me");
    button1.width = 1;
    button1.height = 0.4;
    button1.color = "white";
    button1.fontSize = 24;
    button1.background = "green";
    button1.onPointerUpObservable.add(() => {
      alert("you did it!");
    });
    advancedTexture.addControl(button1);
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 10, 0), this.scene);
    camera.attachControl(this.canvas, false);

    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(1, 2, 1);
    camera.minZ = 0.45;
    camera.speed = 0.75;
    camera.angularSensibility = 4000;
    camera.keysUp.push(87); // W
    camera.keysLeft.push(65); // A
    camera.keysDown.push(83); // S
    camera.keysRight.push(68); // D
  }

  setupRampInteraction(): void {
    if (!this.ramp) return;

    this.ramp.actionManager = new ActionManager(this.scene);

    this.ramp.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer";
      })
    );

    this.ramp.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = "default";
      })
    );

    const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) });
    dragBehavior.useObjectOrientationForDragging = false;
    this.ramp.addBehavior(dragBehavior);
  }

  setupCubInteraction(): void {
    if (!this.prop1) return;

    this.prop1.actionManager = new ActionManager(this.scene);

    // Изменение курсора на pointer при наведении на рампу
    this.prop1.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer";
      })
    );

    // Возврат к стандартному курсору при уходе с рампы
    this.prop1.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = "default";
      })
    );

    let isRotating = false;
    let lastX = 0;

    // Добавляем события для нажатия мыши на рампу
    this.scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case PointerEventTypes.POINTERDOWN:
                // Проверяем, нажата ли рампа
                if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === this.prop1) {
                    isRotating = true;
                    lastX = pointerInfo.event.clientX; // Сохраняем текущую позицию X
                    this.canvas.style.cursor = "grabbing";
                }
                break;
            case PointerEventTypes.POINTERUP:
                isRotating = false;
                this.canvas.style.cursor = "pointer";
                break;
            case PointerEventTypes.POINTERMOVE:
                if (isRotating) {
                    const deltaX = pointerInfo.event.clientX - lastX; // Изменение позиции по X
                    const rotationSpeed = 0.01; // Скорость вращения
                    this.prop1.rotate(Axis.Y, deltaX * rotationSpeed, Space.LOCAL); // Вращаем рампу вокруг оси Y
                    lastX = pointerInfo.event.clientX; // Обновляем последнюю позицию X
                }
                break;
        }
    });
}
}
