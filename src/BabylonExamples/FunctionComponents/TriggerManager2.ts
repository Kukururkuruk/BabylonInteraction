// import {
//     Scene,
//     Vector3,
//     ActionManager,
//     ExecuteCodeAction,
//     MeshBuilder,
//     Ray,
//     RayHelper,
//     Color3,
//     AbstractMesh,
//     FreeCamera,
//   } from "@babylonjs/core";
//   import {
//     AdvancedDynamicTexture,
//     Button,
//     Control,
//     StackPanel,
//     RadioButton,
//     TextBlock,
//   } from "@babylonjs/gui";
  
//   export class TriggerManager2 {
//     private scene: Scene;
//     private canvas: HTMLCanvasElement;
//     private guiTexture: AdvancedDynamicTexture;
//     private interactionZone: AbstractMesh;
  
//     constructor(
//       scene: Scene,
//       canvas: HTMLCanvasElement,
//       guiTexture: AdvancedDynamicTexture
//     ) {
//       this.scene = scene;
//       this.canvas = canvas;
//       this.guiTexture = guiTexture;
//     }
  
//     setupZoneTrigger(camSize: number, zonePosition: Vector3, onEnterZone: () => void): void {
//       this.interactionZone = MeshBuilder.CreateBox(
//         "interactionZone",
//         { size: camSize },
//         this.scene
//       );
//       this.interactionZone.isVisible = true;
//       this.interactionZone.position = zonePosition;
//       this.interactionZone.checkCollisions = false;
  
//       const cameraCollider = MeshBuilder.CreateBox(
//         "cameraCollider",
//         { size: 1 },
//         this.scene
//       );
//       cameraCollider.isVisible = false;
//       cameraCollider.parent = this.scene.activeCamera;
  
//       cameraCollider.actionManager = new ActionManager(this.scene);
  
//       cameraCollider.actionManager.registerAction(
//         new ExecuteCodeAction(
//           {
//             trigger: ActionManager.OnIntersectionEnterTrigger,
//             parameter: { mesh: this.interactionZone },
//           },
//           () => {
//             onEnterZone();
//           }
//         )
//       );
//     }
  
//     getInteractionZone(): AbstractMesh {
//       return this.interactionZone;
//     }
  
//     createStartButton(onClick: () => void): void {
//       const startButton = Button.CreateSimpleButton("startBtn", "Начать");
//       startButton.width = "150px";
//       startButton.height = "40px";
//       startButton.color = "white";
//       startButton.cornerRadius = 20;
//       startButton.background = "green";
//       startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  
//       this.guiTexture.addControl(startButton);
  
//       startButton.onPointerUpObservable.add(() => {
//         this.guiTexture.removeControl(startButton);
//         onClick();
//       });
//     }
  
//     setCameraPositionAndTarget(
//       angle: number,
//       distance: number,
//       rotationX: number,
//       targetPosition: Vector3
//     ): void {
//       const camera = this.scene.activeCamera as FreeCamera;
//       const x = targetPosition.x + distance * Math.sin(angle);
//       const z = targetPosition.z + distance * Math.cos(angle);
//       const y = targetPosition.y; // Настройте по необходимости
  
//       camera.position = new Vector3(x, y, z);
//       camera.setTarget(targetPosition);
//       camera.rotation.x = rotationX;
//     }
  
//     disableCameraMovement(): void {
//       const camera = this.scene.activeCamera as FreeCamera;
//       camera.detachControl();
//     }
  
//     enableCameraMovement(): void {
//       const camera = this.scene.activeCamera as FreeCamera;
//       camera.attachControl(this.canvas, true);
//     }
  
//     createRadioButtons(onHide: () => void): void {
//       const radioButtonPanel = new StackPanel();
//       radioButtonPanel.isVertical = true;
//       radioButtonPanel.width = "100px";
//       radioButtonPanel.height = "100%";
//       radioButtonPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//       radioButtonPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  
//       this.guiTexture.addControl(radioButtonPanel);
  
//       const radioButtons: RadioButton[] = [];
//       const paddings = [0, 70, 85, 30, 10];
  
//       for (let i = 0; i < 5; i++) {
//         const radioButton = new RadioButton();
//         radioButton.width = "30px";
//         radioButton.height = "30px";
//         radioButton.color = "white";
//         radioButton.background = "grey";
  
//         const label = new TextBlock();
//         label.text = `Вариант ${i + 1}`;
//         label.height = "30px";
//         label.color = "white";
//         label.paddingTop = "5px";
//         label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  
//         const radioGroup = new StackPanel();
//         radioGroup.isVertical = true;
//         radioGroup.width = "120px";
  
//         if (i > 0) {
//           radioGroup.paddingTop = `${paddings[i]}px`;
//         }
  
//         radioGroup.addControl(radioButton);
//         radioGroup.addControl(label);
  
//         radioButtonPanel.addControl(radioGroup);
//         radioButtons.push(radioButton);
//       }
  
//       const hideButton = Button.CreateSimpleButton("hideBtn", "Скрыть");
//       hideButton.width = "100px";
//       hideButton.height = "40px";
//       hideButton.color = "white";
//       hideButton.background = "red";
//       hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  
//       this.guiTexture.addControl(hideButton);
  
//       hideButton.onPointerUpObservable.add(() => {
//         this.guiTexture.removeControl(radioButtonPanel);
//         this.guiTexture.removeControl(hideButton);
//         onHide();
//       });
//     }
  
//     setupModalInteraction(mesh: AbstractMesh, onRightClick: () => void): void {
//       mesh.actionManager = new ActionManager(this.scene);
  
//       mesh.actionManager.registerAction(
//         new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
//           this.canvas.style.cursor = "pointer";
//         })
//       );
  
//       mesh.actionManager.registerAction(
//         new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
//           this.canvas.style.cursor = "default";
//         })
//       );
  
//       mesh.actionManager.registerAction(
//         new ExecuteCodeAction(ActionManager.OnRightPickTrigger, () => {
//           onRightClick();
//         })
//       );
//     }
  
//     createRayAboveMesh(mesh: AbstractMesh): void {
//       const rayOrigin = mesh.getAbsolutePosition().clone();
//       const rayDirection = new Vector3(0, 1, 0);
//       const rayLength = 100;
  
//       const ray = new Ray(rayOrigin, rayDirection, rayLength);
  
//       const rayHelper = new RayHelper(ray);
//       rayHelper.show(this.scene, new Color3(1, 0, 0));
//     }
//   }

import {
    Scene,
    Vector3,
    Ray,
    RayHelper,
    Color3,
    AbstractMesh,
    FreeCamera,
    ActionManager,
    ExecuteCodeAction,
  } from "@babylonjs/core";
  import {
    AdvancedDynamicTexture,
    Button,
    Control,
    StackPanel,
    RadioButton,
    TextBlock,
    Grid,
    Rectangle,
  } from "@babylonjs/gui";
  import { TriggerZone } from "./TriggerZone";
  
  export class TriggerManager2 {
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private guiTexture: AdvancedDynamicTexture;
    private triggerZones: TriggerZone[] = [];
  
    constructor(
      scene: Scene,
      canvas: HTMLCanvasElement,
      guiTexture: AdvancedDynamicTexture
    ) {
      this.scene = scene;
      this.canvas = canvas;
      this.guiTexture = guiTexture;
    }
  
    // setupZoneTrigger(
    //   zonePosition: Vector3,
    //   onEnterZone: () => void,
    //   onExitZone?: () => void,
    //   camSize: number = 2
    // ): TriggerZone {
    //   const triggerZone = new TriggerZone(
    //     this.scene,
    //     this.canvas,
    //     zonePosition,
    //     onEnterZone,
    //     onExitZone,
    //     camSize
    //   );
  
    //   this.triggerZones.push(triggerZone);
  
    //   return triggerZone;
    // }

// В классе TriggerManager2

// В вашем классе TriggerManager2

// В вашем классе TriggerManager2

    setupZoneTrigger(
      zonePosition: Vector3,
      onEnterZone: () => void,
      onExitZone?: () => void,
      camSize: number = 2,
      markMeshTemplate?: AbstractMesh,
      markMeshHeight?: number // Новый параметр для высоты знака
    ): TriggerZone {
      const triggerZone = new TriggerZone(
        this.scene,
        this.canvas,
        zonePosition,
        onEnterZone,
        onExitZone,
        camSize
      );

      this.triggerZones.push(triggerZone);

      // Если передан шаблон markMesh, создаем его экземпляр на позиции зоны
      if (markMeshTemplate) {
        const markMeshInstance = markMeshTemplate.clone("markMeshInstance");

        // Устанавливаем позицию знака
        markMeshInstance.position = zonePosition.clone();

        // Если задана высота знака, устанавливаем ее
        if (typeof markMeshHeight === "number") {
          markMeshInstance.position.y = markMeshHeight;
        } else {
          // Иначе корректируем позицию по оси Y, чтобы знак был над землей
          const boundingInfo = markMeshInstance.getBoundingInfo();
          const meshHeight =
            boundingInfo.boundingBox.maximum.y - boundingInfo.boundingBox.minimum.y;
          markMeshInstance.position.y += meshHeight / 2; // Поднимаем на половину высоты
        }

        // Убираем анимацию
      }

      return triggerZone;
    }



  
    // Остальные методы без изменений
  
    createStartButton(onClick: () => void): void {
      const startButton = Button.CreateSimpleButton("startBtn", "Начать");
      startButton.width = "150px";
      startButton.height = "40px";
      startButton.color = "white";
      startButton.cornerRadius = 20;
      startButton.background = "green";
      startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  
      this.guiTexture.addControl(startButton);
  
      startButton.onPointerUpObservable.add(() => {
        this.guiTexture.removeControl(startButton);
        onClick();
      });
    }
  
    setCameraPositionAndTarget(
      angle: number,
      distance: number,
      rotationX: number,
      targetPosition: Vector3
    ): void {
      const camera = this.scene.activeCamera as FreeCamera;
      const x = targetPosition.x + distance * Math.sin(angle);
      const z = targetPosition.z + distance * Math.cos(angle);
      const y = targetPosition.y;
  
      camera.position = new Vector3(x, y, z);
      camera.setTarget(targetPosition);
      camera.rotation.x = rotationX;
    }
  
    disableCameraMovement(): void {
      const camera = this.scene.activeCamera as FreeCamera;
      camera.detachControl();
    }
  
    enableCameraMovement(): void {
      const camera = this.scene.activeCamera as FreeCamera;
      camera.attachControl(this.canvas, true);
    }



    createRadioButtons(onHide: () => void): void {
      const radioButtons: RadioButton[] = [];
      const paddings = ["0%", "5%", "35%", "10%", "20%"]; // Отступы в процентах для каждой кнопки
    
      // Создаем контейнер для радио-кнопок
      const container = new Rectangle();
      container.width = "30%"; // Адаптивная ширина
      container.height = "70%"; // Адаптивная высота
      container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      container.thickness = 0; // Без границ
      container.background = "transparent";
    
      // Создаем Grid внутри контейнера
      const grid = new Grid();
      grid.width = "100%";
      grid.height = "100%";
    
      // Добавляем строки в Grid для отступов и кнопок
      for (let i = 0; i < 5; i++) {
        // Добавляем строку для отступа
        grid.addRowDefinition(parseFloat(paddings[i]) / 100); // Отступ в процентах
    
        // Добавляем строку для кнопки
        grid.addRowDefinition(0.1); // Фиксированная высота для кнопки (10% от контейнера)
      }
    
      // Добавляем колонки: одна для радио-кнопок, одна для лейблов
      grid.addColumnDefinition(0.2); // 20% для радио-кнопок
      grid.addColumnDefinition(0.8); // 80% для лейблов
    
      // Индекс текущей строки в Grid
      let currentRow = 0;
    
      for (let i = 0; i < 5; i++) {
        // Пропускаем строку с отступом
        currentRow++;
    
        // Радио-кнопка
        const radioButton = new RadioButton();
        radioButton.width = "30%"; // Занимает всю ширину ячейки
        radioButton.height = "65%"; // Занимает всю высоту ячейки
        radioButton.color = "white";
        radioButton.background = "grey";
    
        // Лейбл
        const label = new TextBlock();
        label.text = `Вариант ${i + 1}`;
        label.fontSize = "50%"; // Адаптивный размер шрифта
        label.color = "white";
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        label.paddingLeft = "2%";
    
        // Контейнер для радио-кнопки
        const radioContainer = new Rectangle();
        radioContainer.width = "100%";
        radioContainer.height = "100%";
        radioContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        radioContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        radioContainer.thickness = 0;
    
        // Добавляем радио-кнопку в контейнер
        radioContainer.addControl(radioButton);
    
        // Добавляем радио-кнопку и лейбл в Grid
        grid.addControl(radioContainer, currentRow, 0);
        grid.addControl(label, currentRow, 1);
    
        // Выравнивание внутри ячеек
        radioContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        radioContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        label.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
        // Добавляем радио-кнопку в массив
        radioButtons.push(radioButton);
    
        // Переходим к следующей строке (для отступа)
        currentRow++;
      }
    
      // Добавляем Grid в контейнер
      container.addControl(grid);
    
      // Добавляем контейнер на экран
      this.guiTexture.addControl(container);
    
      // Кнопка "Скрыть"
      const hideButton = Button.CreateSimpleButton("hideBtn", "Скрыть");
      hideButton.width = "20%";
      hideButton.height = "5%";
      hideButton.color = "white";
      hideButton.background = "red";
      hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      hideButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      hideButton.top = "-5%"; // Сдвиг вверх от нижнего края
    
      this.guiTexture.addControl(hideButton);
    
      hideButton.onPointerUpObservable.add(() => {
        this.guiTexture.removeControl(container);
        this.guiTexture.removeControl(hideButton);
        onHide();
      });
    }


    
  
    setupModalInteraction(mesh: AbstractMesh, onRightClick: () => void): void {
      mesh.actionManager = new ActionManager(this.scene);
  
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
          this.canvas.style.cursor = "pointer";
        })
      );
  
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
          this.canvas.style.cursor = "default";
        })
      );
  
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnRightPickTrigger, () => {
          onRightClick();
        })
      );
    }
  
    createRayAboveMesh(mesh: AbstractMesh): void {
      const rayOrigin = mesh.getAbsolutePosition().clone();
      const rayDirection = new Vector3(0, 1, 0);
      const rayLength = 100;
  
      const ray = new Ray(rayOrigin, rayDirection, rayLength);
  
      const rayHelper = new RayHelper(ray);
      rayHelper.show(this.scene, new Color3(1, 0, 0));
    }
  
    setupClickableMesh(mesh: AbstractMesh, onClick: () => void): void {
      mesh.actionManager = new ActionManager(this.scene);
  
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          onClick();
        })
      );
    }
  
    removeMeshAction(mesh: AbstractMesh): void {
      if (mesh.actionManager) {
        mesh.actionManager.actions = [];
      }
    }
  }
  