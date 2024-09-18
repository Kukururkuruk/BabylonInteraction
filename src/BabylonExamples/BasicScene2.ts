import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
  ActionManager,
  ExecuteCodeAction,
  AbstractMesh,
  PointerDragBehavior,
  PointerEventTypes,
  Axis,
  Space,
  MeshBuilder,
  Mesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";
import * as GUI from '@babylonjs/gui/2D';

export class BasicScene2 {
  scene: Scene;
  engine: Engine;
  ramp: AbstractMesh;
  tree: AbstractMesh;
  tree2: AbstractMesh;
  bucket: AbstractMesh;

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
      "campfire.glb",
      this.scene
    );

    this.ramp = meshes[24];
    this.tree = meshes[25];
    this.tree2 = meshes[30];
    this.bucket = meshes[3];
    console.log(meshes);
    

    meshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    this.setupRampInteraction();
    this.setupCubInteraction();
    this.createButtonAboveMesh();
    this.setupModalInteraction();
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 5, 0), this.scene);
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
    if (!this.tree) return;

    this.tree.actionManager = new ActionManager(this.scene);

    // Изменение курсора на pointer при наведении на рампу
    this.tree.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = "pointer";
      })
    );

    // Возврат к стандартному курсору при уходе с рампы
    this.tree.actionManager.registerAction(
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
                if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === this.tree) {
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
                    this.tree.rotate(Axis.Y, deltaX * rotationSpeed, Space.LOCAL); // Вращаем рампу вокруг оси Y
                    lastX = pointerInfo.event.clientX; // Обновляем последнюю позицию X
                }
                break;
        }
    });
}

  createButtonAboveMesh(): void {
    // Создаем полноэкранный интерфейс
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Создаем кнопку
    const button = Button.CreateSimpleButton('myBtn', 'Click Me!');
    button.width = '200px';
    button.height = '40px';
    button.color = 'white';
    button.background = 'deepskyblue';
    advancedTexture.addControl(button);

    // Привязываем панель с кнопкой к сетке
    const panel = new GUI.StackPanel();
    panel.addControl(button);
    panel.isVertical = false;
    advancedTexture.addControl(panel);

    // Привязываем панель к сетке
    panel.linkWithMesh(this.tree2);

      const plane = MeshBuilder.CreatePlane('plane', {
      width: 5,
      height: 1,
      });
      const advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(plane, 512, 64);
      const button2 = Button.CreateSimpleButton('myBtn', 'Click Me!');
      button2.width = '200px';
      button2.height = '40px';
      button2.color = 'white';
      button2.background = 'deepskyblue';
      advancedTexture2.addControl(button2);
      plane.parent = this.tree2;
      plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
      plane.position = new Vector3(this.tree2.position.x - 1,this.tree2.position.y - 5,this.tree2.position.z);



  }

  setupModalInteraction(): void {
    if (!this.ramp) return;

    // Добавляем ActionManager для изменения курсора при наведении
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

    // Добавляем обработчик для открытия модального окна при нажатии
    this.ramp.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        // Открываем модальное окно
        const modal = document.getElementById("modal");
        if (modal) {
          modal.style.display = "block";
        }
      })
    );

    // Добавляем обработчик для закрытия модального окна
    const closeModalBtn = document.getElementById("closeModal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        const modal = document.getElementById("modal");
        if (modal) {
          modal.style.display = "none";
        }
      });
    }
}


}