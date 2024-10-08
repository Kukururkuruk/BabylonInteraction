import {
  Scene,
  Vector3,
  Ray,
  Color3,
  AbstractMesh,
  FreeCamera,
  ActionManager,
  ExecuteCodeAction,
  MeshBuilder,
  StandardMaterial,
  Observer,
  LinesMesh,
  Mesh,
} from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  Button,
  Control,
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
  private laserRenderObserver: Observer<Scene> | null = null;
  private laserLine: LinesMesh | null = null;
  private hitSphere: Mesh | null = null;
  private laserModeCleanup: () => void;

    // Свойства для куба, лазера и точки пересечения
    centralCube: Mesh | null = null;
    redRay: Mesh | null = null;
    intersectionPoint: Mesh | null = null;
  
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

      }

      return triggerZone;
    }
  
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






    // createRadioButtons(onHide: () => void): void {
    //   const radioButtons: RadioButton[] = [];
    //   const paddings = ["0%", "5%", "35%", "10%", "20%"]; // Отступы в процентах для каждой кнопки
    
    //   // Создаем контейнер для радио-кнопок
    //   const container = new Rectangle();
    //   container.width = "30%"; // Адаптивная ширина
    //   container.height = "70%"; // Адаптивная высота
    //   container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    //   container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    //   container.thickness = 0; // Без границ
    //   container.background = "transparent";
    
    //   // Создаем Grid внутри контейнера
    //   const grid = new Grid();
    //   grid.width = "100%";
    //   grid.height = "100%";
    
    //   // Добавляем строки в Grid для отступов и кнопок
    //   for (let i = 0; i < 5; i++) {
    //     // Добавляем строку для отступа
    //     grid.addRowDefinition(parseFloat(paddings[i]) / 100); // Отступ в процентах
    
    //     // Добавляем строку для кнопки
    //     grid.addRowDefinition(0.1); // Фиксированная высота для кнопки (10% от контейнера)
    //   }
    
    //   // Добавляем колонки: одна для радио-кнопок, одна для лейблов
    //   grid.addColumnDefinition(0.2); // 20% для радио-кнопок
    //   grid.addColumnDefinition(0.8); // 80% для лейблов
    
    //   // Индекс текущей строки в Grid
    //   let currentRow = 0;
    
    //   for (let i = 0; i < 5; i++) {
    //     // Пропускаем строку с отступом
    //     currentRow++;
    
    //     // Радио-кнопка
    //     const radioButton = new RadioButton();
    //     radioButton.width = "30%"; // Занимает всю ширину ячейки
    //     radioButton.height = "65%"; // Занимает всю высоту ячейки
    //     radioButton.color = "white";
    //     radioButton.background = "grey";
    
    //     // Лейбл
    //     const label = new TextBlock();
    //     label.text = `Вариант ${i + 1}`;
    //     label.fontSize = "50%"; // Адаптивный размер шрифта
    //     label.color = "white";
    //     label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    //     label.paddingLeft = "2%";
    
    //     // Контейнер для радио-кнопки
    //     const radioContainer = new Rectangle();
    //     radioContainer.width = "100%";
    //     radioContainer.height = "100%";
    //     radioContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    //     radioContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    //     radioContainer.thickness = 0;
    
    //     // Добавляем радио-кнопку в контейнер
    //     radioContainer.addControl(radioButton);
    
    //     // Добавляем радио-кнопку и лейбл в Grid
    //     grid.addControl(radioContainer, currentRow, 0);
    //     grid.addControl(label, currentRow, 1);
    
    //     // Выравнивание внутри ячеек
    //     radioContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    //     radioContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    //     label.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
    //     // Добавляем радио-кнопку в массив
    //     radioButtons.push(radioButton);
    
    //     // Переходим к следующей строке (для отступа)
    //     currentRow++;
    //   }
    
    //   // Добавляем Grid в контейнер
    //   container.addControl(grid);
    
    //   // Добавляем контейнер на экран
    //   this.guiTexture.addControl(container);
    
    //   // Кнопка "Скрыть"
    //   const hideButton = Button.CreateSimpleButton("hideBtn", "Скрыть");
    //   hideButton.width = "20%";
    //   hideButton.height = "5%";
    //   hideButton.color = "white";
    //   hideButton.background = "red";
    //   hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    //   hideButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    //   hideButton.top = "-5%"; // Сдвиг вверх от нижнего края
    
    //   this.guiTexture.addControl(hideButton);
    
    //   hideButton.onPointerUpObservable.add(() => {
    //     this.guiTexture.removeControl(container);
    //     this.guiTexture.removeControl(hideButton);
    //     onHide();
    //   });
    // }

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
          radioButton.group = "group1"; // Группа радио-кнопок

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

          // Обработчик события при выборе радио-кнопки
          radioButton.onIsCheckedChangedObservable.add((state) => {
              if (state) {
                  console.log(`Выбрана радио-кнопка: ${i + 1}`);
                  if (i === 2) {
                      // Третья кнопка
                      this.guiTexture.removeControl(container);
                      this.guiTexture.removeControl(hideButton);
                      onHide();
                      this.activateLaserMode(); // Активируем режим лазера
                      this.AddSpherePositionButton();
                  }
              }
          });

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
  
    activateLaserMode(): void {
      const camera = this.scene.activeCamera as FreeCamera;

      // Отключаем управление камерой и оставляем только вращение мышью
      camera.detachControl();
      camera.inputs.clear(); // Удаляем все входы
      camera.inputs.addMouse(); // Добавляем только вращение мышью
      camera.attachControl(this.canvas, true);

      const cubeSize = 0.5; // Уменьшенный размер куба
      this.centralCube = MeshBuilder.CreateBox("centralCube", { size: cubeSize }, this.scene);

      // 2. Привязка куба к камере
      this.centralCube.parent = camera;

      // 3. Установка относительной позиции куба (чуть правее и вперёд)
      this.centralCube.position = new Vector3(0, 0, 3); // Измените значения по своему усмотрению

      // 4. Создание материала для куба
      const cubeMaterial = new StandardMaterial("cubeMaterial", this.scene);
      cubeMaterial.diffuseColor = new Color3(0, 1, 0); // Зелёный цвет для куба
      this.centralCube.material = cubeMaterial;
      

      // 5. Сделать куб видимым для отладки
      this.centralCube.isVisible = false;

      // 6. Создание красного луча (линии) исходящего из передней грани куба
      const rayLength = 100; // Длина лазера
      const rayPoints = [
        new Vector3(0, 0, cubeSize / 2 + 0.01), // Начало чуть перед грани куба
        new Vector3(0, 0, cubeSize / 2 + 0.01 + rayLength), // Конец луча
      ];
      this.redRay = MeshBuilder.CreateLines("redRay", { points: rayPoints }, this.scene);

      // 7. Привязка луча к кубу, чтобы он двигался вместе с ним
      this.redRay.parent = this.centralCube;

      // 8. Создание материала для луча
      const rayMaterial = new StandardMaterial("rayMaterial", this.scene);
      rayMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет
      this.redRay.color = rayMaterial.emissiveColor;

      // 9. Создание точки пересечения (маленькая сфера), изначально скрытая
      const pointSize = 0.3;
      this.intersectionPoint = MeshBuilder.CreateSphere("intersectionPoint", { diameter: pointSize }, this.scene);
      const pointMaterial = new StandardMaterial("pointMaterial", this.scene);
      pointMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет
      this.intersectionPoint.material = pointMaterial;
      this.intersectionPoint.isVisible = false; // Скрыта по умолчанию
  }

  updateRayIntersection(): void {
    // Проверяем, инициализированы ли куб и луч
    if (!this.centralCube || !this.redRay || !this.intersectionPoint) {
      return;
    }

    // Получаем глобальную позицию начала луча
    const origin = this.redRay.getAbsolutePosition();

    // Получаем направление луча в глобальных координатах
    const direction = this.redRay.getDirection(new Vector3(0, 0, 1)).normalize();

    // Длина луча
    const rayLength = 100;

    // Создаём Ray с заданной длиной
    const ray = new Ray(origin, direction, rayLength);

    // Используем scene.pickWithRay для обнаружения пересечений
    const pickInfo = this.scene.pickWithRay(ray, (mesh) =>
      mesh !== this.redRay && mesh !== this.centralCube && mesh !== this.intersectionPoint
    );

    if (pickInfo?.hit && pickInfo.pickedPoint) {
      // Устанавливаем позицию точки пересечения
      this.intersectionPoint.position = pickInfo.pickedPoint;
      this.intersectionPoint.isVisible = true;
    } else {
      // Скрываем точку, если пересечения нет
      this.intersectionPoint.isVisible = false;
    }
  }

  AddSpherePositionButton(): void {
    const spherePositionButton = Button.CreateSimpleButton("spherePositionButton", "Показать координаты сферы");
    spherePositionButton.width = "200px";
    spherePositionButton.height = "40px";
    spherePositionButton.color = "white";
    spherePositionButton.cornerRadius = 20;
    spherePositionButton.background = "blue"; // Изменил цвет кнопки для различия
    spherePositionButton.top = "120px"; // Позиционируем ниже предыдущей кнопки, если она есть
    spherePositionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    this.guiTexture.addControl(spherePositionButton);

    spherePositionButton.onPointerUpObservable.add(() => {
      if (this.intersectionPoint && this.intersectionPoint.isVisible) {
        const spherePosition = this.intersectionPoint.position;
        console.log(`Координаты сферы: x=${spherePosition.x.toFixed(2)}, y=${spherePosition.y.toFixed(2)}, z=${spherePosition.z.toFixed(2)}`);
      } else {
        console.log("Сфера не видна или не инициализирована.");
      }
    });
  }


exitLaserMode(): void {
    if (this.laserModeCleanup) {
        this.laserModeCleanup();
        this.laserModeCleanup = null;
    }
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
  