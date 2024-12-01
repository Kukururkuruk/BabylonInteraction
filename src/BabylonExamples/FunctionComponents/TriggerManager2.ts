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
  Tools,
  Quaternion,
  PointerInfo,
  PointerEventTypes,
  Space,
  Matrix,
  Color4,
  SceneLoader,
  TransformNode,
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
import { GUIManager } from "./GUIManager";
import { DialogPage } from "./DialogPage";
import eventEmitter from "../../../EventEmitter";

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
  private angleText: TextBlock | null = null;
  private currentIntersectedSphere: number | null = null;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private camera: FreeCamera;


   // Новые свойства для второго режима лазера
   private redRay2: LinesMesh | null = null;
   private intersectionSphere2: Mesh | null = null;
   private targetMeshLaser2: AbstractMesh | null = null;
   private centralCube2: Mesh | null = null;
   private pointerMoveHandler: ((pointerInfo: PointerInfo) => void) | null = null;


   firstPoint: Vector3 | null = null;
   secondPoint: Vector3 | null = null;
   measuringDistance: boolean = false;


   private keyDownHandler: ((evt: KeyboardEvent) => void) | null = null;
   private keyUpHandler: ((evt: KeyboardEvent) => void) | null = null;
   private rotateDirection: number = 0;
   private beforeRenderHandler = () => this.onBeforeRender();
   private beforeDisRenderHandler = () => this.onBeforeDisRender();
 
   private targetPosition: Vector3 = new Vector3();
   private targetRotationQuaternion: Quaternion = new Quaternion();
   private accumulatedRotation: number = 0;

   measurementLine: LinesMesh | null = null;
  
    constructor(
      scene: Scene,
      canvas: HTMLCanvasElement,
      guiTexture: AdvancedDynamicTexture,
      camera: FreeCamera
    ) {
      this.scene = scene;
      this.canvas = canvas;
      this.guiTexture = guiTexture;
      this.camera = camera;
      this.guiManager = new GUIManager(this.scene, this.textMessages);
      this.dialogPage = new DialogPage()
    }
  
    setupZoneTrigger(
      zonePosition: Vector3,
      onEnterZone: () => void,
      onExitZone?: () => void,
      camSize: number = 2,
      enableCollision: boolean = false,
      markMeshTemplate?: AbstractMesh,
      markMeshHeight?: number // Новый параметр для высоты знака
    ): TriggerZone {
      const triggerZone = new TriggerZone(
        this.scene,
        this.canvas,
        zonePosition,
        onEnterZone,
        onExitZone,
        camSize,
        enableCollision
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
  
    createStartButton(text: string, onClick: () => void): void {
      const startButton = Button.CreateSimpleButton("Btn", text);
      startButton.width = "11%";
      startButton.height = "7%";
      startButton.paddingBottom = "2%"
      startButton.color = "white";
      startButton.cornerRadius = 20;
      startButton.background = "green";
      startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      startButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

  
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
      positionY: number,
      targetPosition: Vector3
    ): void {
      const camera = this.scene.activeCamera as FreeCamera;
      const x = targetPosition.x + distance * Math.sin(angle);
      const z = targetPosition.z + distance * Math.cos(angle);
      const y = targetPosition.y + positionY;
  
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
      container.width = "15%"; // Увеличили ширину для горизонтального размещения
      container.height = "50%"; // Уменьшили высоту
      container.top = "3%"
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
  
      // Определяем строки
      grid.addRowDefinition(1); // Строка 0
      grid.addRowDefinition(1); // Строка 1 (для кнопки 3)
  
      for (let i = 0; i < 4; i++) {
          // Контейнер для радио-кнопки и лейбла
          const buttonContainer = new Rectangle();
          buttonContainer.width = "100%";
          buttonContainer.height = "100%";
          buttonContainer.thickness = 0;
          buttonContainer.background = "transparent";
  
          // Радио-кнопка
          const radioButton = new RadioButton();
          radioButton.width = "30%";
          radioButton.height = "13%"; // Занимает 30% высоты контейнера
          radioButton.color = "white";
          radioButton.background = "grey";
          radioButton.group = "group1";
  
          // Позиционируем радио-кнопку внутри контейнера
          radioButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          radioButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  
          // Добавляем радио-кнопку и лейбл в контейнер
          buttonContainer.addControl(radioButton);

  
          // Определяем позицию в Grid
          let row = 0;
          let column = 0;
  
          if (i === 0) {
              column = 0; // Кнопка 1 в колонке 0, строке 0
              row = 0;
              buttonContainer.top = "85%"
              buttonContainer.left = "35%"

          } else if (i === 1) {
              column = 1; // Кнопка 2 в колонке 1, строке 0
              row = 0;
              buttonContainer.top = "40%"

          } else if (i === 2) {
              column = 1; // Кнопка 3 в колонке 1, строке 1
              row = 1;
              buttonContainer.top = "15%"

          } else if (i === 3) {
              column = 2; // Кнопка 4 в колонке 2, строке 0
              row = 0;
              buttonContainer.top = "85%"

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
                  } else if (i !== 2) {
                    this.showMessage("Неправильный выбор. Попробуйте снова.");
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
        camera.fov /= 2;

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
        const pointSize = 0.15;
        this.intersectionPoint = MeshBuilder.CreateSphere("intersectionPoint", { diameter: pointSize }, this.scene);
        const pointMaterial = new StandardMaterial("pointMaterial", this.scene);
        pointMaterial.emissiveColor = new Color3(1, 0, 0); // Красный цвет
        this.intersectionPoint.material = pointMaterial;
        this.intersectionPoint.isVisible = false; // Скрыта по умолчанию

        // Создание дополнительных сфер
        this.createAdditionalSpheres();

        // Добавление кнопки отображения координат сферы (опционально)
        // this.AddSpherePositionButton();

        if (!this.angleText) {
        this.angleText = new TextBlock();
        this.angleText.text = "Угол X: 0°, Угол Y: 0°";
        this.angleText.color = "white";
        this.angleText.fontSize = 24;
        this.angleText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.angleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.angleText.top = "10px";
        this.angleText.left = "10px";
        this.angleText.isHitTestVisible = false;
        this.guiTexture.addControl(this.angleText);
      }
        
        

        // Добавление обновления пересечений перед каждым кадром
        this.scene.registerBeforeRender(() => {
            this.updateRayIntersection();
            this.checkSphereIntersection();

            const euler = camera.rotation;
                const angleX = Tools.ToDegrees(euler.x);
                const angleY = Tools.ToDegrees(euler.y);
                if (this.angleText) {
                  this.angleText.text = `Угол X: ${angleX.toFixed(2)}°, Угол Y: ${angleY.toFixed(2)}°`;
              }
        });
    }

// Метод для создания дополнительных сфер
    private createAdditionalSpheres(): void {
        // Координаты сфер
        const sphereCoordinates = [
            new Vector3(-1.00, 8.32, -3.59),
            new Vector3(-0.98, 8.09, -3.59),
            new Vector3(-0.81, 9.08, -3.59)
        ];

        // Общие настройки для всех сфер
        const sphereDiameter = 0.2;
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
        const mainRadius = 0.1; // Половина диаметра 0.4

        // Определяем радиусы дополнительных сфер
        const additionalRadius = 0.1; // Половина диаметра 0.4

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
      const camera = this.scene.activeCamera as FreeCamera;
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
                this.exitLaserMode(); // Завершаем режим лазера

                const page1 = this.dialogPage.addText("Отлично, теперь переходи к следующему заданию.")
                this.guiManager.CreateDialogBox([page1])

                this.guiManager.createRouteButton('/test')
                camera.fov = 0.8
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
                this.removeMessage();
            }
        }, 2000);
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
        this.removeAngle();
        this.scene.render();

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

    private removeAngle(): void {
      if (this.angleText) {
          this.guiTexture.removeControl(this.angleText);
          this.angleText = null;
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


    
    // public activateLaserMode2(targetMesh: Mesh): void {
    //   this.targetMeshLaser2 = targetMesh; // Сохраняем целевой меш

    //   // Создаем куб
    //   this.centralCube2 = MeshBuilder.CreateBox(
    //     "centralCube2",
    //     { size: 0.5 },
    //     this.scene
    //   );
    //   this.centralCube2.rotationQuaternion = Quaternion.Identity();

    //   // Создаем материал для куба
    //   const cubeMaterial = new StandardMaterial("cubeMaterial", this.scene);
    //   cubeMaterial.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет
    //   cubeMaterial.emissiveColor = new Color3(0, 1, 0); // Зеленый цвет
    //   this.centralCube2.material = cubeMaterial;

    //   this.centralCube2.isPickable = false;

    //   // Скрываем куб по умолчанию
    //   this.centralCube2.isVisible = false;

    //   // Добавляем обработчик движения указателя
    //   this.pointerMoveHandler = (pointerInfo: PointerInfo) => {
    //     if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
    //       this.onPointerMove(pointerInfo);
    //     }
    //   };
    //   this.scene.onPointerObservable.add(this.pointerMoveHandler);

    //   // Добавляем обработчики клавиатуры
    //   this.keyDownHandler = (evt: KeyboardEvent) => this.onKeyDown(evt);
    //   this.keyUpHandler = (evt: KeyboardEvent) => this.onKeyUp(evt);
    //   window.addEventListener("keydown", this.keyDownHandler);
    //   window.addEventListener("keyup", this.keyUpHandler);

    //   // Добавляем функцию в цикл рендера
    //   this.scene.registerBeforeRender(this.beforeRenderHandler);
    // }


    public activateLaserMode2(targetMesh: Mesh): void {
      this.targetMeshLaser2 = targetMesh; // Сохраняем целевой меш
    
      // Загружаем модель вместо создания куба
      SceneLoader.ImportMesh(
        "", // Импортируем все меши
        "./models/", // Путь к папке с моделью
        "UltrasonicTester_LP2.glb", // Имя файла модели
        this.scene, // Сцена, в которую загружается модель
        (meshes) => {
          if (meshes.length === 0) {
            console.error("Модель не содержит мешей.");
            return;
          }
    
          // Создаём родительский узел для модели
          const parentNode = new TransformNode("centralCube2", this.scene);
    
          // Привязываем все загруженные меши к родительскому узлу
          meshes.forEach((mesh) => {
            mesh.parent = parentNode;
          });
    
          // Устанавливаем начальные настройки для родительского узла
          parentNode.rotationQuaternion = Quaternion.Identity();
          parentNode.isPickable = false;
          parentNode.isVisible = false;
          parentNode.scaling.x *= -1
    
          // Корректируем ориентацию модели
          // Предположим, что модель должна быть повернута на 90 градусов вокруг оси Y
          // Измените углы поворота в соответствии с вашей моделью
          const correctionRotation = Quaternion.FromEulerAngles(0, -Math.PI / 2, 0); // 90 градусов по Y
          parentNode.rotationQuaternion = correctionRotation.multiply(parentNode.rotationQuaternion || Quaternion.Identity());
    
          // Сохраняем родительский узел как centralCube2
          this.centralCube2 = parentNode;
    
        },
        null,
        (scene, message, exception) => {
          console.error("Ошибка загрузки модели:", message, exception);
        }
      );
    
      // Добавляем обработчик движения указателя
      this.pointerMoveHandler = (pointerInfo: PointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
          this.onPointerMove(pointerInfo);
        }
      };
      this.scene.onPointerObservable.add(this.pointerMoveHandler);
    
      // Добавляем обработчики клавиатуры
      this.keyDownHandler = (evt: KeyboardEvent) => this.onKeyDown(evt);
      this.keyUpHandler = (evt: KeyboardEvent) => this.onKeyUp(evt);
      window.addEventListener("keydown", this.keyDownHandler);
      window.addEventListener("keyup", this.keyUpHandler);
    
      // Добавляем функцию в цикл рендера
      this.scene.registerBeforeRender(this.beforeRenderHandler);
    }
    
    private onPointerMove(pointerInfo: PointerInfo): void {
      const pickResult = pointerInfo.pickInfo;
    
      if (
        pickResult?.hit &&
        pickResult.pickedMesh === this.targetMeshLaser2 &&
        this.centralCube2
      ) {
        // Делаем модель видимой
        this.centralCube2.isVisible = true;
    
        // Обновляем целевую позицию модели
        this.targetPosition.copyFrom(pickResult.pickedPoint);
    
        // Получаем нормаль поверхности в точке пересечения
        const normal = pickResult.getNormal(true);
        if (normal) {
          // Смещаем модель вдоль нормали на половину её размера (или другое значение)
          const offsetDistance = 0; // Измените значение по необходимости
          const offset = normal.scale(offsetDistance);
          this.targetPosition.addInPlace(offset);
    
          // Используем ваш метод расчёта вращения
          const axis1 = normal;
          const axis2 = Vector3.Up();
          const axis3 = Vector3.Zero();
          const start = new Vector3(Math.PI / 2, Math.PI / 2, 0);
    
          Vector3.CrossToRef(start, axis1, axis2);
          Vector3.CrossToRef(axis2, axis1, axis3);
          const tmpVec = Vector3.RotationFromAxis(
            axis3.negate(),
            axis1,
            axis2
          );
          const quat = Quaternion.RotationYawPitchRoll(
            tmpVec.y,
            tmpVec.x,
            tmpVec.z
          );
    
          // Применяем накопленную ротацию
          this.targetRotationQuaternion = quat;
        }
      } else if (this.centralCube2) {
        // Скрываем модель, если указатель не над `this.targetMeshLaser2`
        this.centralCube2.isVisible = false;
      }
    }
    
    private onBeforeRender(): void {
      if (this.centralCube2 && this.centralCube2.isVisible) {
        // Плавное перемещение модели к целевой позиции
        this.centralCube2.position = Vector3.Lerp(
          this.centralCube2.position,
          this.targetPosition,
          0.2 // Скорость интерполяции
        );
    
        // Накопление вращения от клавиш Q/E или Й/У
        if (this.rotateDirection !== 0) {
          const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
          const rotationSpeed = Math.PI; // Скорость вращения
          const angle = rotationSpeed * deltaTime * this.rotateDirection;
          this.accumulatedRotation += angle;
        }
    
        // Объединение ориентации от поверхности и накопленного вращения
        const totalRotation = Quaternion.RotationAxis(Vector3.Up(), this.accumulatedRotation);
        const combinedRotation = this.targetRotationQuaternion.multiply(totalRotation);
    
        // Плавное вращение модели к комбинированному вращению
        this.centralCube2.rotationQuaternion = Quaternion.Slerp(
          this.centralCube2.rotationQuaternion || Quaternion.Identity(),
          combinedRotation,
          0.2 // Скорость интерполяции
        );
      }
    }





    private onKeyDown(evt: KeyboardEvent): void {
      const key = evt.key.toLowerCase();
      if ((key === "q" || key === "й") && this.rotateDirection !== -1) {
        this.rotateDirection = -1; // Вращение против часовой стрелки
      } else if ((key === "e" || key === "у") && this.rotateDirection !== 1) {
        this.rotateDirection = 1; // Вращение по часовой стрелке
      }
    }

    private onKeyUp(evt: KeyboardEvent): void {
      const key = evt.key.toLowerCase();
      if ((key === "q" || key === "й") && this.rotateDirection === -1) {
        this.rotateDirection = 0;
      } else if ((key === "e" || key === "у") && this.rotateDirection === 1) {
        this.rotateDirection = 0;
      }
    }

    public exitLaserMode2(): void {
      // Удаляем обработчик движения указателя
      if (this.pointerMoveHandler) {
        this.scene.onPointerObservable.removeCallback(this.pointerMoveHandler);
        this.pointerMoveHandler = null;
      }

      // Удаляем обработчики клавиатуры
      if (this.keyDownHandler) {
        window.removeEventListener("keydown", this.keyDownHandler);
        this.keyDownHandler = null;
      }
      if (this.keyUpHandler) {
        window.removeEventListener("keyup", this.keyUpHandler);
        this.keyUpHandler = null;
      }

      // Удаляем функцию из цикла рендера
      this.scene.unregisterBeforeRender(this.beforeRenderHandler);

      // Удаляем куб из сцены
      if (this.centralCube2) {
        this.centralCube2.dispose();
        this.centralCube2 = null;
      }

      this.targetMeshLaser2 = null;
    }


  //   public distanceMode(): void {
  //     // Создаем куб
  //     this.centralCube2 = MeshBuilder.CreateBox(
  //         "centralCube2",
  //         { size: 0.5 },
  //         this.scene
  //     );
  
  //     // Создаем материал для куба
  //     const cubeMaterial = new StandardMaterial("cubeMaterial", this.scene);
  //     cubeMaterial.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет
  //     cubeMaterial.emissiveColor = new Color3(0, 1, 0); // Зеленый цвет
  //     this.centralCube2.material = cubeMaterial;
  
  //     this.centralCube2.isPickable = false; // Куб не должен быть "пикэйбл"
  //     this.centralCube2.isVisible = false;  // По умолчанию куб скрыт
  
  //     // Добавляем обработчик движения указателя
  //     this.pointerMoveHandler = (pointerInfo: PointerInfo) => {
  //         if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
  //             this.onPointerDistanceMove();
  //         }
  //     };
  //     this.scene.onPointerObservable.add(this.pointerMoveHandler);
  
  //     // Добавляем функцию в цикл рендера
  //     this.scene.registerBeforeRender(this.beforeDisRenderHandler);
  // }
  
  // private onPointerDistanceMove(): void {
  //     // Выполняем ручное определение пересечения указателя с поверхностями
  //     const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
  
  //     if (pickResult?.hit && pickResult.pickedMesh && this.centralCube2) {
  //         // Делаем куб видимым при пересечении
  //         this.centralCube2.isVisible = true;
  //         this.targetPosition.copyFrom(pickResult.pickedPoint);
  //     } else if (this.centralCube2) {
  //         // Скрываем куб, если указатель не над поверхностью
  //         this.centralCube2.isVisible = false;
  //     }
  // }
  
  // private onBeforeDisRender(): void {
  //     if (this.centralCube2 && this.centralCube2.isVisible) {
  //         // Плавное перемещение куба к целевой позиции
  //         this.centralCube2.position = Vector3.Lerp(
  //             this.centralCube2.position,
  //             this.targetPosition,
  //             0.2 // Скорость интерполяции
  //         );
  //     }
  // }
  
  // public exitDisLaserMode2(): void {
  //     // Удаляем обработчик движения указателя
  //     if (this.pointerMoveHandler) {
  //         this.scene.onPointerObservable.removeCallback(this.pointerMoveHandler);
  //         this.pointerMoveHandler = null;
  //     }
  
  //     // Удаляем функцию из цикла рендера
  //     this.scene.unregisterBeforeRender(this.beforeRenderHandler);
  
  //     // Удаляем куб из сцены
  //     if (this.centralCube2) {
  //         this.centralCube2.dispose();
  //         this.centralCube2 = null;
  //     }
  // }




  public distanceMode(): void {
    // Создаем маленький шарик вместо куба
    this.centralCube2 = MeshBuilder.CreateSphere("centralCube2", { diameter: 0.3 }, this.scene); // Уменьшенный диаметр для указателя
    const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
    sphereMaterial.diffuseColor = new Color3(0, 1, 0); // Зеленый цвет
    sphereMaterial.emissiveColor = new Color3(0, 1, 0); // Добавляем свечение, чтобы шарик выделялся
    this.centralCube2.material = sphereMaterial;

    this.centralCube2.isPickable = false; // Шарик не будет "пикэйбл"
    this.centralCube2.isVisible = false;  // По умолчанию шарик скрыт

    // Обработчик движения указателя
    this.pointerMoveHandler = (pointerInfo: PointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
            this.onPointerDistanceMove();
        }
    };
    this.scene.onPointerObservable.add(this.pointerMoveHandler);

    // Регистрация в цикле рендера для плавного перемещения
    this.scene.registerBeforeRender(this.onBeforeDisRender.bind(this));
}

  
  private onPointerDistanceMove(): void {
      const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
      if (pickResult?.hit && pickResult.pickedMesh) {
          this.centralCube2.isVisible = true;
          this.targetPosition.copyFrom(pickResult.pickedPoint);
      } else {
          this.centralCube2.isVisible = false; // Скрывайте куб, когда указатель не над поверхностью
      }
  }
  
  private onBeforeDisRender(): void {
      if (this.centralCube2 && this.centralCube2.isVisible) {
          this.centralCube2.position = Vector3.Lerp(
              this.centralCube2.position,
              this.targetPosition,
              0.5 // Увеличьте скорость интерполяции
          );
      }
  }
  
  
  public exitDisLaserMode2(): void {
      if (this.pointerMoveHandler) {
          this.scene.onPointerObservable.removeCallback(this.pointerMoveHandler);
          this.pointerMoveHandler = null;
      }
      this.scene.unregisterBeforeRender(this.onBeforeDisRender.bind(this)); // Привязка контекста
      if (this.centralCube2) {
          this.centralCube2.dispose();
          this.centralCube2 = null;
      }
  }
  
  

//   enableDistanceMeasurement(): void {
//     this.measuringDistance = true;
//     this.firstPoint = null;
//     this.secondPoint = null;

//     let sphere = null; // Сфера, которая будет отображаться

//     // Создаем текстовый блок для отображения углов после первого клика
//     if (!this.angleText) {
//         this.angleText = new TextBlock();
//         this.angleText.text = "";
//         this.angleText.color = "white";
//         this.angleText.fontSize = 24;
//         this.angleText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
//         this.angleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//         this.angleText.top = "10px";
//         this.angleText.left = "10px";
//         this.angleText.isHitTestVisible = false;
//         // this.guiTexture.addControl(this.angleText);
//     }

//     // Обработчик кликов
//     this.scene.onPointerDown = (evt, pickResult) => {
//         // Проверяем, был ли клик правой кнопкой мыши
//         if (evt.button === 2) {
//             if (pickResult.hit && pickResult.pickedPoint) {
//                 if (!this.firstPoint) {
//                     // Запоминаем первую точку
//                     this.firstPoint = pickResult.pickedPoint.clone();

//                     // Создаем сферу в месте первого клика
//                     if (sphere) {
//                         sphere.dispose(); // Убираем предыдущую сферу, если она была
//                     }
//                     sphere = MeshBuilder.CreateSphere("sphere", { diameter: 0.2 }, this.scene);
//                     sphere.position = this.firstPoint; // Помещаем сферу в первую точку
//                     const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
//                     sphereMaterial.diffuseColor = new Color3(1, 0, 0); // Красный цвет
//                     sphereMaterial.emissiveColor = new Color3(1, 0, 0); // Добавляем свечение, чтобы шарик выделялся
//                     sphere.material = sphereMaterial;

//                 } else if (!this.secondPoint) {
//                     // Запоминаем вторую точку и завершаем измерение
//                     this.secondPoint = pickResult.pickedPoint.clone();

//                     // Вычисляем расстояние
//                     const distance = Vector3.Distance(this.firstPoint, this.secondPoint);

//                     // // Вектор от первой точки ко второй
//                     // const directionVector = this.secondPoint.subtract(this.firstPoint).normalize();

//                     // // Глобальные оси
//                     // const globalX = new Vector3(1, 0, 0);
//                     // const globalY = new Vector3(0, 1, 0);
//                     // const globalZ = new Vector3(0, 0, 1);

//                     // // Вычисляем углы относительно глобальных осей
//                     // const angleX = Math.acos(Vector3.Dot(directionVector, globalX)) * (180 / Math.PI);
//                     // const angleY = Math.acos(Vector3.Dot(directionVector, globalY)) * (180 / Math.PI);
//                     // const angleZ = Math.acos(Vector3.Dot(directionVector, globalZ)) * (180 / Math.PI);

//                     // Показываем расстояние и углы через GUI
//                     // this.guiManager.showDistanceMessage(
//                     //     `Расстояние: ${distance.toFixed(2)}`
//                     // );
//                     // Эмитируем событие с расстоянием
//                     eventEmitter.emit("updateTextPlane", `Расстояние:\n${distance.toFixed(2)} м`);

//                     // Сброс для нового измерения
//                     this.firstPoint = null;
//                     this.secondPoint = null;

//                     // Убираем сферу и текст угла после второго клика
//                     if (sphere) {
//                         sphere.dispose();
//                         sphere = null;
//                     }
//                     this.angleText.isVisible = false;
//                 }
//             }
//         } else if (evt.button === 0) {
//             console.log("Левый клик. Замеры не проводятся.");
//         }
//     };

//     // Добавляем обновление угла перед каждым кадром, если была установлена первая точка
//     this.scene.registerBeforeRender(() => {
//         if (this.firstPoint && !this.secondPoint) {
//             const pointerRay = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.scene.activeCamera);
//             const pickResult = this.scene.pickWithRay(pointerRay);

//             if (pickResult.hit && pickResult.pickedPoint) {
//                 const currentVector = pickResult.pickedPoint.subtract(this.firstPoint).normalize();

//                 // Глобальные оси
//                 const globalX = new Vector3(1, 0, 0);
//                 const globalY = new Vector3(0, 1, 0);
//                 const globalZ = new Vector3(0, 0, 1);

//                 // Вычисляем углы относительно осей X и Y и Z
//                 const angleX = Math.acos(Vector3.Dot(currentVector, globalX)) * (180 / Math.PI);
//                 const angleY = Math.acos(Vector3.Dot(currentVector, globalY)) * (180 / Math.PI);
//                 const angleZ = Math.acos(Vector3.Dot(currentVector, globalZ)) * (180 / Math.PI);

//                 // Обновляем текст углов
//                 this.angleText.text = `Угол X: ${angleX.toFixed(2)}°\n Угол Y: ${angleY.toFixed(2)}°\n Угол Z: ${angleZ.toFixed(2)}°`;
//                 this.angleText.isVisible = true;
//                                     // Эмитируем событие для обновления углов
//                                     eventEmitter.emit("updateAngleText", this.angleText.text);
//             }
//         }
//     });
// }



enableDistanceMeasurement(): void {
  this.measuringDistance = true;
  this.firstPoint = null;
  this.secondPoint = null;

  let sphere: Mesh | null = null; // Сфера, которая будет отображаться
  let rayHelper: RayHelper | null = null; // RayHelper для визуализации луча
  let currentRay: Ray | null = null; // Текущий луч

  // Создаем текстовый блок для отображения углов после первого клика
  if (!this.angleText) {
    this.angleText = new TextBlock();
    this.angleText.text = "";
    this.angleText.color = "white";
    this.angleText.fontSize = 24;
    this.angleText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.angleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.angleText.top = "10px";
    this.angleText.left = "10px";
    this.angleText.isHitTestVisible = false;
    // Добавьте текстовый блок в вашу GUI, если необходимо
    // this.guiTexture.addControl(this.angleText);
  }

  // Обработчик кликов
  this.scene.onPointerDown = (evt, pickResult) => {
    // Проверяем, был ли клик правой кнопкой мыши
    if (evt.button === 2) { // Правая кнопка мыши
      if (pickResult.hit && pickResult.pickedPoint) {
        if (!this.firstPoint) {
          // Первый клик: установка первой точки
          this.firstPoint = pickResult.pickedPoint.clone();

          // Создаем сферу в месте первого клика
          if (sphere) {
            sphere.dispose(); // Убираем предыдущую сферу, если она была
          }
          sphere = MeshBuilder.CreateSphere("sphere", { diameter: 0.2 }, this.scene);
          sphere.position = this.firstPoint; // Помещаем сферу в первую точку
          const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
          sphereMaterial.diffuseColor = new Color3(1, 0, 0); // Красный цвет
          sphereMaterial.emissiveColor = new Color3(1, 0, 0); // Добавляем свечение, чтобы шарик выделялся
          sphere.material = sphereMaterial;

          // Создаем начальный луч (Ray) направленный вперед
          currentRay = new Ray(this.firstPoint, new Vector3(0, 0, 1), 1000);

          // Создаем RayHelper для визуализации луча
          rayHelper = new RayHelper(currentRay);
          rayHelper.show(this.scene, new Color3(1, 1, 1)); // Белый цвет луча

        } else if (!this.secondPoint) {
          // Второй клик: установка второй точки и завершение измерения
          this.secondPoint = pickResult.pickedPoint.clone();

          // Вычисляем расстояние между точками
          const distance = Vector3.Distance(this.firstPoint, this.secondPoint);

          // Эмитируем событие с расстоянием
          eventEmitter.emit("updateTextPlane", `Расстояние:\n${distance.toFixed(2)} м`);

          // Сброс для нового измерения
          this.firstPoint = null;
          this.secondPoint = null;

          // Убираем сферу и луч после второго клика
          if (sphere) {
            sphere.dispose();
            sphere = null;
          }
          if (rayHelper) {
            rayHelper.hide();
            rayHelper.dispose();
            rayHelper = null;
          }
          this.angleText.isVisible = false;
        }
      }
    } else if (evt.button === 0) {
      console.log("Левый клик. Замеры не проводятся.");
    }
  };

  // Добавляем обновление луча и углов перед каждым кадром, если была установлена первая точка
  this.scene.registerBeforeRender(() => {
    if (this.firstPoint && !this.secondPoint && rayHelper && currentRay) {
      // Создаем луч от первой точки к текущей позиции курсора
      const pointerRay = this.scene.createPickingRay(
        this.scene.pointerX,
        this.scene.pointerY,
        Matrix.Identity(),
        this.scene.activeCamera
      );
      const pickResult = this.scene.pickWithRay(pointerRay);

      if (pickResult.hit && pickResult.pickedPoint) {
        // Обновляем направление луча от первой точки к текущей позиции курсора
        const direction = pickResult.pickedPoint.subtract(this.firstPoint).normalize();
        currentRay.direction = direction;

        // Обновляем RayHelper с новым лучом
        rayHelper.update(currentRay);

        // Вычисляем углы относительно глобальных осей X, Y и Z
        const angleX = Math.acos(Vector3.Dot(direction, new Vector3(1, 0, 0))) * (180 / Math.PI);
        const angleY = Math.acos(Vector3.Dot(direction, new Vector3(0, 1, 0))) * (180 / Math.PI);
        const angleZ = Math.acos(Vector3.Dot(direction, new Vector3(0, 0, 1))) * (180 / Math.PI);

        // Обновляем текст углов
        this.angleText.text = `Угол X: ${angleX.toFixed(2)}°\nУгол Y: ${angleY.toFixed(2)}°\nУгол Z: ${angleZ.toFixed(2)}°`;
        this.angleText.isVisible = true;

        // Эмитируем событие для обновления углов
        eventEmitter.emit("updateAngleText", this.angleText.text);
      }
    }
  });
}






    disableDistanceMeasurement(): void {
        this.measuringDistance = false;
        this.firstPoint = null;
        this.secondPoint = null;

        // Удаляем обработчик кликов
        this.scene.onPointerDown = undefined;

        // Опционально: очищаем сообщение о расстоянии
        this.guiManager.showDistanceMessage("");
        
        console.log("Режим измерения расстояния отключен.");
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
  


  