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
import { AdvancedDynamicTexture, Button, StackPanel, Rectangle } from "@babylonjs/gui";
import * as GUI from '@babylonjs/gui/2D';

export class BasicScene2 {
  scene: Scene;
  engine: Engine;
  ramp: AbstractMesh;
  tree: AbstractMesh;
  tree2: AbstractMesh;
  bucket: AbstractMesh;
  inventoryPanel: StackPanel;
  private openModal: () => void;

  constructor(private canvas: HTMLCanvasElement, openModal: () => void) {
    this.engine = new Engine(this.canvas, true);
    
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.openModal = openModal;

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
    this.bucket = meshes[2];
    // console.log(meshes);
    

    meshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    this.setupRampInteraction();
    this.setupCubInteraction();
    this.createButtonAboveMesh();
    this.setupModalInteraction();
    this.setupRampTrigger();
     // Создаем панель инвентаря
     this.createInventoryPanel();
     // Создаем коллекционный меш
     this.createCollectibleMesh();
    

    this.engine.hideLoadingUI();
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

  // Создаем панель инвентаря
  createInventoryPanel(): void {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Создаем панель
    this.inventoryPanel = new StackPanel();
    this.inventoryPanel.isVertical = false;
    this.inventoryPanel.height = "100px";
    this.inventoryPanel.width = "400px";
    this.inventoryPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.inventoryPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(this.inventoryPanel);

    // Добавляем слоты для инвентаря
    for (let i = 0; i < 4; i++) {
      const slot = new Rectangle();
      slot.width = "80px";
      slot.height = "80px";
      slot.thickness = 2;
      slot.color = "white";
      slot.background = "grey";
      slot.name = "empty";
      this.inventoryPanel.addControl(slot);
    }
  }

  // Создаем коллекционный меш
  createCollectibleMesh(): void {
    const mesh = this.tree2; // Используем ваше дерево (tree2) как коллекционный объект

    if (mesh) {
      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          mesh.isVisible = false;

          // Обновляем инвентарь
          const emptySlot = this.inventoryPanel.children.find(
            (slot) => slot.name === "empty"
          ) as Rectangle;

          if (emptySlot) {
            emptySlot.background = "red"; // Обозначение заполненной ячейки
            emptySlot.name = "occupied";
          }
        })
      );
    }
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
    if (!this.bucket) return;
  
    this.bucket.actionManager = new ActionManager(this.scene);
  
    this.bucket.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        this.canvas.style.cursor = 'pointer';
      })
    );
  
    this.bucket.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.canvas.style.cursor = 'default';
      })
    );
  
    this.bucket.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        console.log('Bucket clicked!'); // Добавьте это для отладки
        this.openModal(); // Открываем модальное окно
      })
    );
  }

  setupRampTrigger(): void {
    if (!this.ramp) return;

    const interactionZone = MeshBuilder.CreateBox("interactionZone", { size: 2 }, this.scene); 
    interactionZone.isVisible = false; // Зона невидима
    interactionZone.parent = this.ramp // Размещаем зону рядом с рампой
    interactionZone.position = new Vector3 (this.ramp.position.x, this.ramp.position.y + 3, this.ramp.position.z)
    interactionZone.checkCollisions = false; // Не нужно для коллизий

    // Создаем невидимый бокс для камеры
    const cameraCollider = MeshBuilder.CreateBox("cameraCollider", { size: 1 }, this.scene);
    cameraCollider.isVisible = false; // Невидимый бокс
    cameraCollider.parent = this.scene.activeCamera; // Связываем с камерой

    // Устанавливаем ActionManager на этот бокс
    cameraCollider.actionManager = new ActionManager(this.scene);

    // Добавляем действие на пересечение с рампой
    cameraCollider.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: { mesh: interactionZone }, // Рампа, с которой пересекается камера
        },
        () => {
          console.log("Camera intersected with the ramp!");
          alert("Camera reached the ramp!"); // Можно заменить на нужное действие
        }
      )
    );
  }
  
}

