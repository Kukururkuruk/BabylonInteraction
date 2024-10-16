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
  LinesMesh,
  Mesh,
  RayHelper,
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
  private centralCube: Mesh | null = null;
  private redRay: LinesMesh | null = null;
  private intersectionPoint: Mesh | null = null;
  private sphere1: Mesh | null = null;
  private sphere2: Mesh | null = null;
  private sphere3: Mesh | null = null;
  private finishButton: Button | null = null;
  private messageText: TextBlock | null = null;
  private currentIntersectedSphere: number | null = null;

  
    constructor(
      scene: Scene,
      canvas: HTMLCanvasElement,
      guiTexture: AdvancedDynamicTexture
    ) {
      this.scene = scene;
      this.canvas = canvas;
      this.guiTexture = guiTexture;
    }
  
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







    createRadioButtons(onHide: () => void): void {
      const radioButtons: RadioButton[] = [];
  
      // Создаем контейнер для радио-кнопок
      const container = new Rectangle();
      container.width = "80%"; // Увеличили ширину для горизонтального размещения
      container.height = "50%"; // Уменьшили высоту
      container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      container.thickness = 0;
      container.background = "transparent";
  
      // Создаем Grid внутри контейнера
      const grid = new Grid();
      grid.width = "100%";
      grid.height = "100%";
  
      // Определяем колонки для кнопок
      grid.addColumnDefinition(1); // Колонка для кнопки 1
      grid.addColumnDefinition(1); // Колонка для кнопок 2 и 3
      grid.addColumnDefinition(1); // Колонка для кнопки 4
      grid.addColumnDefinition(1); // Колонка для кнопки 5
  
      // Определяем строки
      grid.addRowDefinition(1); // Строка 0
      grid.addRowDefinition(1); // Строка 1 (для кнопки 3)
  
      for (let i = 0; i < 5; i++) {
          // Контейнер для радио-кнопки и лейбла
          const buttonContainer = new Rectangle();
          buttonContainer.width = "100%";
          buttonContainer.height = "100%";
          buttonContainer.thickness = 0;
          buttonContainer.background = "transparent";
  
          // Радио-кнопка
          const radioButton = new RadioButton();
          radioButton.width = "30%";
          radioButton.height = "30%"; // Занимает 30% высоты контейнера
          radioButton.color = "white";
          radioButton.background = "grey";
          radioButton.group = "group1";
  
          // Позиционируем радио-кнопку внутри контейнера
          radioButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          radioButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  
          // Лейбл
          const label = new TextBlock();
          label.text = `Вариант ${i + 1}`;
          label.fontSize = "14px";
          label.color = "white";
          label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          label.top = "35%"; // Отступ сверху, чтобы разместить под радио-кнопкой
          label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  
          // Добавляем радио-кнопку и лейбл в контейнер
          buttonContainer.addControl(radioButton);
          buttonContainer.addControl(label);
  
          // Определяем позицию в Grid
          let row = 0;
          let column = 0;
  
          if (i === 0) {
              column = 0; // Кнопка 1 в колонке 0, строке 0
              row = 0;
          } else if (i === 1) {
              column = 1; // Кнопка 2 в колонке 1, строке 0
              row = 0;
          } else if (i === 2) {
              column = 1; // Кнопка 3 в колонке 1, строке 1
              row = 1;
          } else if (i === 3) {
              column = 2; // Кнопка 4 в колонке 2, строке 0
              row = 0;
          } else if (i === 4) {
              column = 3; // Кнопка 5 в колонке 3, строке 0
              row = 0;
          }
  
          // Добавляем контейнер кнопки в Grid
          grid.addControl(buttonContainer, row, column);
  
          // Добавляем радио-кнопку в массив
          radioButtons.push(radioButton);
  
          // Обработчик события при выборе радио-кнопки
          radioButton.onIsCheckedChangedObservable.add((state) => {
              if (state) {
                  console.log(`Выбрана радио-кнопка: ${i + 1}`);
                  if (i === 2) { // Третья кнопка
                      this.guiTexture.removeControl(container);
                      onHide();
                      this.activateLaserMode();
                  }
              }
          });
      }
  
      // Добавляем Grid в контейнер
      container.addControl(grid);
  
      // Добавляем контейнер на экран
      this.guiTexture.addControl(container);
  }
  









// Метод для активации режима лазера
activateLaserMode(): void {
    const camera = this.scene.activeCamera as FreeCamera;

    // Отключаем управление камерой и оставляем только вращение мышью
    camera.detachControl();
    camera.inputs.clear(); // Удаляем все входы
    camera.inputs.addMouse(); // Добавляем только вращение мышью
    camera.attachControl(this.canvas, true);

    const cubeSize = 0.5; // Уменьшенный размер куба
    this.centralCube = MeshBuilder.CreateBox("centralCube", { size: cubeSize }, this.scene);

    // Привязка куба к камере
    this.centralCube.parent = camera;

    // Установка относительной позиции куба (чуть правее и вперед)
    this.centralCube.position = new Vector3(0, 0, 3); // Измените значения по своему усмотрению

    // Создание материала для куба
    const cubeMaterial = new StandardMaterial("cubeMaterial", this.scene);
    cubeMaterial.diffuseColor = new Color3(0, 1, 0); // Зелёный цвет для куба
    this.centralCube.material = cubeMaterial;

    // Сделать куб невидимым для отладки
    this.centralCube.isVisible = false;

    // Создание красного луча (линии) исходящего из передней грани куба
    const rayLength = 100; // Длина лазера
    const rayPoints = [
        new Vector3(0, 0, cubeSize / 2 + 0.01), // Начало чуть перед грани куба
        new Vector3(0, 0, cubeSize / 2 + 0.01 + rayLength), // Конец луча
    ];
    this.redRay = MeshBuilder.CreateLines("redRay", { points: rayPoints }, this.scene);

    // Привязка луча к кубу, чтобы он двигался вместе с ним
    this.redRay.parent = this.centralCube;

    // Создание материала для луча
    const rayMaterial = new StandardMaterial("rayMaterial", this.scene);
    rayMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет
    this.redRay.color = rayMaterial.emissiveColor;

    // Создание точки пересечения (маленькая сфера), изначально скрытая
    const pointSize = 0.3;
    this.intersectionPoint = MeshBuilder.CreateSphere("intersectionPoint", { diameter: pointSize }, this.scene);
    const pointMaterial = new StandardMaterial("pointMaterial", this.scene);
    pointMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет
    this.intersectionPoint.material = pointMaterial;
    this.intersectionPoint.isVisible = false; // Скрыта по умолчанию

    // Создание дополнительных сфер
    this.createAdditionalSpheres();

    // Добавление кнопки отображения координат сферы (опционально)
    this.AddSpherePositionButton();

    // Добавление обновления пересечений перед каждым кадром
    this.scene.registerBeforeRender(() => {
        this.updateRayIntersection();
        this.checkSphereIntersection();
    });
}

// Метод для создания дополнительных сфер
private createAdditionalSpheres(): void {
    // Координаты сфер
    const sphereCoordinates = [
        new Vector3(12.35, 8.80, -3.64),
        new Vector3(12.42, 8.55, -3.62),
        new Vector3(12.18, 7.85, -3.62)
    ];

    // Общие настройки для всех сфер
    const sphereDiameter = 0.4;
    const sphereMaterial = new StandardMaterial("additionalSphereMaterial", this.scene);
    sphereMaterial.diffuseColor = new Color3(0, 0, 1); // Синий цвет
    sphereMaterial.emissiveColor = new Color3(0, 0, 1);

    // Создание сфер
    this.sphere1 = MeshBuilder.CreateSphere("sphere1", { diameter: sphereDiameter }, this.scene);
    this.sphere1.position = sphereCoordinates[0];
    this.sphere1.material = sphereMaterial;

    this.sphere2 = MeshBuilder.CreateSphere("sphere2", { diameter: sphereDiameter }, this.scene);
    this.sphere2.position = sphereCoordinates[1];
    this.sphere2.material = sphereMaterial;

    this.sphere3 = MeshBuilder.CreateSphere("sphere3", { diameter: sphereDiameter }, this.scene);
    this.sphere3.position = sphereCoordinates[2];
    this.sphere3.material = sphereMaterial;

    // Опционально: сделать сферы невидимыми и отображать их только для отладки
    // this.sphere1.isVisible = false;
    // this.sphere2.isVisible = false;
    // this.sphere3.isVisible = false;
}

// Метод для проверки пересечения основной сферы с дополнительными сферами
private checkSphereIntersection(): void {
    if (!this.intersectionPoint) return;

    const mainPosition = this.intersectionPoint.position;

    // Определяем радиус основной сферы
    const mainRadius = 0.2; // Половина диаметра 0.4

    // Определяем радиусы дополнительных сфер
    const additionalRadius = 0.2; // Половина диаметра 0.4

    // Функция для вычисления расстояния между двумя точками
    const distance = (a: Vector3, b: Vector3): number => {
        return Vector3.Distance(a, b);
    };

    // Сброс текущего пересечения
    this.currentIntersectedSphere = null;

    if (this.sphere1 && distance(mainPosition, this.sphere1.position) <= (mainRadius + additionalRadius)) {
        this.currentIntersectedSphere = 1;
    } else if (this.sphere2 && distance(mainPosition, this.sphere2.position) <= (mainRadius + additionalRadius)) {
        this.currentIntersectedSphere = 2;
    } else if (this.sphere3 && distance(mainPosition, this.sphere3.position) <= (mainRadius + additionalRadius)) {
        this.currentIntersectedSphere = 3;
    }

    if (this.currentIntersectedSphere && !this.finishButton) { // Проверяем, чтобы кнопка появлялась только один раз
        this.createFinishButton();
    } else if (!this.currentIntersectedSphere && this.finishButton) {
        // Если нет пересечения, удаляем кнопку "Завершить"
        this.removeFinishButton();
    }
}

// Метод для создания кнопки "Завершить"
private createFinishButton(): void {
    this.finishButton = Button.CreateSimpleButton("finishBtn", "Завершить");
    this.finishButton.width = "150px";
    this.finishButton.height = "50px";
    this.finishButton.color = "white";
    this.finishButton.background = "orange";
    this.finishButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.finishButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.finishButton.top = "-20%"; // Сдвиг вверх от нижнего края

    this.guiTexture.addControl(this.finishButton);

    this.finishButton.onPointerUpObservable.add(() => {
        if (this.currentIntersectedSphere === 1) {
            // Пересечение с первой сферой
            this.showMessage("Все правильно! Все исчезает.");
            this.exitLaserMode(); // Завершаем режим лазера
        } else if (this.currentIntersectedSphere === 2 || this.currentIntersectedSphere === 3) {
            // Пересечение с второй или третьей сферой
            this.showMessage("Неправильный выбор. Попробуйте снова.");
            // Оставляем режим лазера активным для продолжения игры
            this.removeFinishButton(); // Удаляем кнопку, чтобы её можно было создать снова при новом пересечении
        }
    });
}

// Метод для отображения сообщений
private showMessage(message: string): void {
    if (!this.messageText) {
        this.messageText = new TextBlock();
        this.messageText.text = "";
        this.messageText.color = "white";
        this.messageText.fontSize = "24px";
        this.messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.messageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.messageText.top = "-10%";
        this.guiTexture.addControl(this.messageText);
    }
    this.messageText.text = message;

    // Автоматически скрыть сообщение через 3 секунды
    setTimeout(() => {
        if (this.messageText) {
            this.messageText.text = "";
        }
    }, 3000);
}

// Метод для выхода из режима лазера
exitLaserMode(): void {
    // Очистка центрального куба и луча
    if (this.centralCube) {
        this.centralCube.dispose();
        this.centralCube = null;
    }
    if (this.redRay) {
        this.redRay.dispose();
        this.redRay = null;
    }
    if (this.intersectionPoint) {
        this.intersectionPoint.dispose();
        this.intersectionPoint = null;
    }

    // Очистка дополнительных сфер
    this.removeAdditionalSpheres();

    // Удаление кнопки "Завершить"
    this.removeFinishButton();

    // Удаление сообщения
    this.removeMessage();

    // Восстановление управления камерой
    const camera = this.scene.activeCamera as FreeCamera;
    camera.detachControl();
    camera.inputs.clear();
    camera.inputs.addKeyboard();
    camera.inputs.addMouse();
    camera.attachControl(this.canvas, true);
    this.setupCameraKeys(camera);
}

// Метод для удаления дополнительных сфер
private removeAdditionalSpheres(): void {
    if (this.sphere1) {
        this.sphere1.dispose();
        this.sphere1 = null;
    }
    if (this.sphere2) {
        this.sphere2.dispose();
        this.sphere2 = null;
    }
    if (this.sphere3) {
        this.sphere3.dispose();
        this.sphere3 = null;
    }
}

// Метод для удаления кнопки "Завершить"
private removeFinishButton(): void {
    if (this.finishButton) {
        this.guiTexture.removeControl(this.finishButton);
        this.finishButton = null;
    }
}

// Метод для удаления сообщения
private removeMessage(): void {
    if (this.messageText) {
        this.guiTexture.removeControl(this.messageText);
        this.messageText = null;
    }
}

// Метод для обновления пересечения луча с объектами
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

// Метод для добавления кнопки отображения координат сферы (опционально)
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

setupCameraKeys(camera: FreeCamera): void {
  // Удаляем существующие клавиши, чтобы избежать дублирования
  camera.keysUp = [];
  camera.keysLeft = [];
  camera.keysDown = [];
  camera.keysRight = [];

  // Добавляем клавиши WASD
  camera.keysUp.push(87); // W
  camera.keysLeft.push(65); // A
  camera.keysDown.push(83); // S
  camera.keysRight.push(68); // D
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
  