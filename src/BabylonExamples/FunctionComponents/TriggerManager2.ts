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
  GlowLayer,
  AxesViewer,
  KeyboardEventTypes,
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
import { ModelLoader } from "../BaseComponents/ModelLoader";
import eventEmitter from "../../../EventEmitter";
import { faL } from "@fortawesome/free-solid-svg-icons";

export class TriggerManager2 {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private guiTexture: AdvancedDynamicTexture;
  private triggerZones: TriggerZone[] = [];
  private centralCube: Mesh | null = null;
  private redRay: LinesMesh | null = null;
  private intersectionPoint: Mesh | null = null;
  private dynamicLine: LinesMesh | null = null;
  private sphere1: Mesh | null = null;
  private sphere2: Mesh | null = null;
  private sphere3: Mesh | null = null;
  private finishButton: Button | null = null;
  private messageText: TextBlock | null = null;
  private angleText: TextBlock | null = null;
  private currentIntersectedSphere: number | null = null;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private modelLoader: ModelLoader;
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

   private rangefinderMesh: Mesh;
   public modelNode: TransformNode | null = null; // Глобальное свойство
   public line: LinesMesh | null = null; // Глобальное свойство
   public axesViewer: AxesViewer | null = null; // Добавляем как свойство

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
      this.modelLoader = new ModelLoader(this.scene);
    }

    public setRangefinderMesh(mesh: Mesh): void {
      this.rangefinderMesh = mesh;
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
      targetPosition: Vector3,
      pos?: Vector3,
      rot?: Vector3,
    ): void {
      const camera = this.scene.activeCamera as FreeCamera;
      const x = targetPosition.x + distance * Math.sin(angle);
      const z = targetPosition.z + distance * Math.cos(angle);
      const y = targetPosition.y + positionY;
  
      camera.position = new Vector3(x, y, z);
      camera.setTarget(targetPosition);
      camera.rotation.x = rotationX;
      if (pos && rot) {
        camera.position = pos;
        camera.rotation = rot
      }

    }
  
    disableCameraMovement(): void {
      const camera = this.scene.activeCamera as FreeCamera;
      camera.detachControl();
    }
  
    enableCameraMovement(): void {
      const camera = this.scene.activeCamera as FreeCamera;
      camera.attachControl(this.canvas, true);
    }

    async createRadioButtons(onHide: () => void): Promise<void> {
      // Загрузка модели дальномера
      await this.modelLoader.loadRangeModel();
      const rangefinderMeshes = this.modelLoader.getMeshes('range') || [];
      console.log(rangefinderMeshes);
      
      
      // Если не нашли меши, завершаем
      if (rangefinderMeshes.length === 0) {
        console.error("Не удалось найти меши дальномера");
        return;
      }
    
      // Исходный меш (или корневой меш)
      const baseMesh = rangefinderMeshes[1];
      console.log(baseMesh);
      
      baseMesh.scaling = new Vector3(1, 1, -1)
      
      // Задаем список позиций, где мы хотим разместить модели
      // Замените данные координаты на нужные
      const positions = [
        { x: 12.32, y: 8.81, z: -3.60 },
        { x: 12.37, y: 8.24, z: -3.60 },
        { x: 12.12, y: 7.88, z: -3.60 },
        { x: 12.37, y: 7.43, z: -3.60 }
      ];
    
      // Предположим, что третья позиция (индекс 2) – правильная
      const correctIndex = 2;
    
      // Массив для хранение копий мешей
      const placedMeshes: AbstractMesh[] = [];
    
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
    
        // Клонируем исходный меш
        const meshClone = baseMesh.clone(`rangefinder_clone_${i}`, null);
        if (!meshClone) continue;
    
        // Устанавливаем позицию
        meshClone.position.set(pos.x, pos.y, pos.z);
        
        if(i === 0) {
          meshClone.rotation = new Vector3 (0, 0, Math.PI / 2)
        }
        if(i === 1) {
          meshClone.rotation = new Vector3 (0, 0, Math.PI / 2)
        }
        if(i === 2) {
          meshClone.rotation = new Vector3 (0, 0, Math.PI / 2)
        }
        if(i === 3) {
          meshClone.rotation = new Vector3 (0, 0, 1.2)
        }
    
        // Изначально полупрозрачный
        meshClone.visibility = 0.5;
    
        // Добавляем ActionManager для обработки событий мыши
        meshClone.actionManager = new ActionManager(this.scene);
    
        // При наведении курсора – сделать полностью видимым
        meshClone.actionManager.registerAction(new ExecuteCodeAction(
          ActionManager.OnPointerOverTrigger, 
          () => {
            meshClone.visibility = 1;
          }
        ));
    
        // При отводе курсора – сделать полупрозрачным
        meshClone.actionManager.registerAction(new ExecuteCodeAction(
          ActionManager.OnPointerOutTrigger, 
          () => {
            meshClone.visibility = 0.5;
          }
        ));
    
        // При клике по модели
        meshClone.actionManager.registerAction(new ExecuteCodeAction(
          ActionManager.OnPickTrigger,
          () => {
            if (i === correctIndex) {
              // Правильный выбор
              // Скрываем все модели
              placedMeshes.forEach(m => m.setEnabled(false));
              // Вызываем onHide()
              onHide();

            } else {
              // Неправильная позиция
              this.showMessage("Неправильная позиция");
            }
          }
        ));
    
        placedMeshes.push(meshClone);
      }
    }
    
  activateLaserMode(): void {
    const camera = this.scene.activeCamera as FreeCamera;

    camera.detachControl();
    camera.inputs.clear(); // Удаляем все входы
    camera.inputs.addMouse(); // Добавляем только вращение мышью
    camera.attachControl(this.canvas, true);
    const originalFov = camera.fov;

    // Обработка нажатия клавиши Q
    let isZoomedIn = false;
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        const key = kbInfo.event.key.toLowerCase();
        if (/q|й/.test(key)) {
          // Переключатель для FOV
          if (isZoomedIn) {
            camera.fov = originalFov;
          } else {
            camera.fov /= 2;
          }
          isZoomedIn = !isZoomedIn;
        }
      }
    });


    const fiveDegreesInRadians = 5 * Math.PI / 180;
    const initialRotation = Math.PI / 2;
    
    const minRotation = initialRotation - fiveDegreesInRadians;
    const maxRotation = initialRotation + fiveDegreesInRadians;
    
        this.scene.onBeforeRenderObservable.add(() => {
            // Ограничиваем вращение камеры по оси Y
            const euler = camera.rotation;
            if (euler.y > maxRotation) {
                euler.y = maxRotation;
            }
            if (euler.y < minRotation) {
                euler.y = minRotation;
            }
            camera.rotation = euler; // Применяем ограничение угла
        });

    // Сфера пересечения
    const pointSize = 0.05;
    this.intersectionPoint = MeshBuilder.CreateSphere("intersectionPoint", { diameter: pointSize }, this.scene);
    const pointMaterial = new StandardMaterial("pointMaterial", this.scene);
    pointMaterial.emissiveColor = new Color3(1, 0, 0);
    this.intersectionPoint.material = pointMaterial;
    this.intersectionPoint.isVisible = false;
    this.intersectionPoint.isPickable = false; // Сфера не участвует в пересечении

    this.createAdditionalSpheres();

    let dynamicLine: LinesMesh | null = null;
    let glowLayer: GlowLayer | null = null;

    const staticPoint = new Vector3(-12.12, 7.84, -3.60);

    const createOrUpdateLineBetweenPoints = (start: Vector3, end: Vector3, existingLine?: LinesMesh): LinesMesh => {
        if (!existingLine) {
            const line = MeshBuilder.CreateLines("dynamicLine", { points: [start, end], updatable: true }, this.scene);
            line.color = new Color3(0, 1, 0);
            line.isPickable = false; // Линия не участвует в пересечении
            if (!glowLayer) {
                glowLayer = new GlowLayer("glow", this.scene);
                glowLayer.intensity = 1;
            }
            glowLayer.addExcludedMesh(line); 
            glowLayer.addExcludedMesh(this.rangefinderMesh); 
            glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
                if (mesh === line) {
                    result.r = 0;
                    result.g = 1;
                    result.b = 0;
                }
            };
            glowLayer.addIncludedOnlyMesh(line);
            return line;
        } else {
            MeshBuilder.CreateLines("dynamicLine", { points: [start, end], updatable: true, instance: existingLine }, this.scene);
            return existingLine;
        }
    };



    this.scene.registerBeforeRender(() => {
        const origin = camera.globalPosition.clone();
        const forward = camera.getDirection(Vector3.Forward());
        const ray = new Ray(origin, forward, 200);

        // Исключаем служебные объекты из пересечения (сферу и динамическую линию)
        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh !== this.intersectionPoint && mesh.name !== "dynamicLine");

        if (hit && hit.pickedPoint) {
            this.intersectionPoint.position.copyFrom(hit.pickedPoint);
            this.intersectionPoint.isVisible = true;

            // Получаем позицию дальномера
            const rangefinderPosition = this.rangefinderMesh.parent ? 
    Vector3.TransformCoordinates(this.rangefinderMesh.position, this.rangefinderMesh.parent.getWorldMatrix()) : 
    this.rangefinderMesh.getAbsolutePosition();


            // Определяем, на сколько единиц смещать точку
            const offsetDistance = 1.4; // например, 0.5 единицы вперед

            // Получаем стартовую точку как позицию дальномера + смещенный вектор вперед
            const start = rangefinderPosition.add(forward.scale(offsetDistance));

            dynamicLine = createOrUpdateLineBetweenPoints(start, this.intersectionPoint.position, dynamicLine);

            const distance = Vector3.Distance(staticPoint, this.intersectionPoint.position);
            const euler = camera.rotation;
            const angleX = Tools.ToDegrees(euler.x);
            const angleY = Tools.ToDegrees(euler.y);
            const displayedAngleX = -angleX; // инвертируем знак для удобства отображения
            eventEmitter.emit(
                "updateDistanceAngleText",
                `Угол X: ${displayedAngleX.toFixed(2)}°\nУгол Y: ${angleY.toFixed(2)}°\nРасстояние:${distance.toFixed(2)} м`
            );
        } else {
            this.intersectionPoint.isVisible = false;
            if (dynamicLine) {
                dynamicLine.dispose();
                dynamicLine = null;
            }
        }
    });


}

activateLaserMode1(): void {
  const camera = this.scene.activeCamera as FreeCamera;

  // camera.detachControl();
  // camera.inputs.clear(); // Удаляем все входы
  // camera.inputs.addMouse(); // Добавляем только вращение мышью
  // camera.attachControl(this.canvas, true);

  // Сфера пересечения
  const pointSize = 0.05;
  this.intersectionPoint = MeshBuilder.CreateSphere("intersectionPoint", { diameter: pointSize }, this.scene);
  const pointMaterial = new StandardMaterial("pointMaterial", this.scene);
  pointMaterial.emissiveColor = new Color3(1, 0, 0);
  this.intersectionPoint.material = pointMaterial;
  this.intersectionPoint.isVisible = false;
  this.intersectionPoint.isPickable = false; // Сфера не участвует в пересечении

  const createOrUpdateLineBetweenPoints = (start: Vector3, end: Vector3, existingLine?: LinesMesh): LinesMesh => {
      if (!existingLine) {
          const line = MeshBuilder.CreateLines("dynamicLine", { points: [start, end], updatable: true }, this.scene);
          line.color = new Color3(0, 1, 0);
          line.isPickable = false; // Линия не участвует в пересечении
          return line;
      } else {
          MeshBuilder.CreateLines("dynamicLine", { points: [start, end], updatable: true, instance: existingLine }, this.scene);
          return existingLine;
      }
  };

  this.scene.registerBeforeRender(() => {
      const origin = camera.globalPosition.clone();
      const forward = camera.getDirection(Vector3.Forward());
      const ray = new Ray(origin, forward, 200);

      // Исключаем служебные объекты из пересечения (сферу и динамическую линию)
      const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh !== this.intersectionPoint && mesh.name !== "dynamicLine");

      if (hit && hit.pickedPoint) {
          this.intersectionPoint.position.copyFrom(hit.pickedPoint);
          this.intersectionPoint.isVisible = true;

          // Получаем стартовую точку как позицию дальномера
          const rangefinderPosition = this.rangefinderMesh.parent ? 
    Vector3.TransformCoordinates(this.rangefinderMesh.position, this.rangefinderMesh.parent.getWorldMatrix()) : 
    this.rangefinderMesh.getAbsolutePosition();


          const start = rangefinderPosition;

          this.dynamicLine = createOrUpdateLineBetweenPoints(start, this.intersectionPoint.position, this.dynamicLine);

          const distance = Vector3.Distance(rangefinderPosition, this.intersectionPoint.position);
          const euler = camera.rotation;
          const angleX = Tools.ToDegrees(euler.x);
          const angleY = Tools.ToDegrees(euler.y);
          const displayedAngleX = -angleX + 6; // инвертируем знак для удобства отображения
          eventEmitter.emit(
              "updateDistanceAngleText",
              `Угол X: ${displayedAngleX.toFixed(2)}°\nУгол Y: ${angleY.toFixed(2)}°\nРасстояние: ${distance.toFixed(2)} м`
          );
      } else {
          this.intersectionPoint.isVisible = false;
          if (this.dynamicLine) {
            this.dynamicLine.dispose();
            this.dynamicLine = null;
          }
      }
  });
}








    

// Метод для создания дополнительных сфер
    private createAdditionalSpheres(): void {
        // Координаты сфер
        const sphereCoordinates = [
            new Vector3(-1.00, 8.32, -3.58),
            new Vector3(-0.9, 7.95, -3.58),
            new Vector3(-0.81, 9.08, -3.58)
        ];

        // Общие настройки для всех сфер
        const sphereDiameter = 0.1;
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
        this.sphere1.visibility = 0.5;
        this.sphere1.checkCollisions = false
        this.sphere1.isPickable = false
        this.sphere2.visibility = 0.5;
        this.sphere2.checkCollisions = false
        this.sphere2.isPickable = false
        this.sphere3.visibility = 0.5;
        this.sphere3.checkCollisions = false
        this.sphere3.isPickable = false
    }

// Метод для проверки пересечения основной сферы с дополнительными сферами
    private checkSphereIntersection(): void {
        if (!this.intersectionPoint) return;

        const mainPosition = this.intersectionPoint.position;

        // Определяем радиус основной сферы
        const mainRadius = 0.1; // Половина диаметра 0.4

        // Определяем радиусы дополнительных сфер
        const additionalRadius = 0; // Половина диаметра 0.4

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

                this.guiManager.createRouteButton('/ВыборИнструмента')
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
  // Очистка динамической линии и её подсветки
  if (this.glowLayer) {
      this.glowLayer.dispose(); // Удаляем GlowLayer
      this.glowLayer = null;
  }
  if (this.dynamicLine) {
      this.dynamicLine.dispose(); // Удаляем линию
      this.dynamicLine = null;
  }

  // Очистка сферы пересечения
  if (this.intersectionPoint) {
      this.intersectionPoint.dispose(); // Удаляем точку пересечения
      this.intersectionPoint = null;
  }

  // Очистка дополнительных сфер
  this.removeAdditionalSpheres();

  // Удаление кнопки "Завершить" (если есть)
  this.removeFinishButton();

  // Удаление сообщения
  this.removeMessage();
  this.removeAngle();

  this.scene.render();
}

exitLaserMode1(): void {

  if (this.dynamicLine) {
      this.dynamicLine.dispose(); // Удаляем линию
      this.dynamicLine = null;
  }

  // Очистка сферы пересечения
  if (this.intersectionPoint) {
      this.intersectionPoint.dispose(); // Удаляем точку пересечения
      this.intersectionPoint = null;
  }

  this.scene.render();
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
            mesh.isPickable = false
          });
    
          // Устанавливаем начальные настройки для родительского узла
          parentNode.rotationQuaternion = Quaternion.Identity();
          parentNode.scaling.x *= -1
    
          // Корректируем ориентацию модели
          // Предположим, что модель должна быть повернута на 90 градусов вокруг оси Y
          // Измените углы поворота в соответствии с вашей моделью
          const correctionRotation = Quaternion.FromEulerAngles(0, -Math.PI / 2, 0); // 90 градусов по Y
          parentNode.rotationQuaternion = correctionRotation.multiply(parentNode.rotationQuaternion || Quaternion.Identity());
    
          // Сохраняем родительский узел как centralCube2
          this.centralCube2 = parentNode;
          console.log(meshes);
          
    
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

  public distanceMode(): void {
    // Создаем маленький шарик вместо куба
    this.centralCube2 = MeshBuilder.CreateSphere("centralCube2", { diameter: 0.05 }, this.scene); // Уменьшенный диаметр для указателя
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

//Старая версия
// enableDistanceMeasurement(): void {
//   this.measuringDistance = true;
//   this.firstPoint = null;
//   this.secondPoint = null;

//   let sphere: Mesh | null = null; // Сфера, отображающая первую точку
//   let line: LinesMesh | null = null; // Линия, соединяющая первую точку с курсором
//   let axesViewer: AxesViewer | null = null; // Визуализатор осей

//   // Создаем текстовый блок для отображения углов
//   if (!this.angleText) {
//       this.angleText = new TextBlock();
//       this.angleText.text = "";
//       this.angleText.color = "white";
//       this.angleText.fontSize = 24;
//       this.angleText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
//       this.angleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//       this.angleText.top = "10px";
//       this.angleText.left = "10px";
//       this.angleText.isHitTestVisible = false;
//   }

//   // Обработчик кликов
//   this.scene.onPointerDown = (evt, pickResult) => {
//       if (evt.button === 2) { // Правая кнопка мыши
//           if (pickResult.hit && pickResult.pickedPoint) {
//               if (!this.firstPoint) {
//                   // Установка первой точки
//                   this.firstPoint = pickResult.pickedPoint.clone();

//                   // Создаем сферу в месте первого клика
//                   if (sphere) {
//                       sphere.dispose();
//                   }
//                   sphere = MeshBuilder.CreateSphere("sphere", { diameter: 0.05 }, this.scene);
//                   sphere.position = this.firstPoint;
//                   const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
//                   sphereMaterial.diffuseColor = new Color3(1, 0, 0); // Красный цвет
//                   sphereMaterial.emissiveColor = new Color3(1, 0, 0);
//                   sphere.material = sphereMaterial;

//                   // Создаем линию
//                   if (line) {
//                       line.dispose();
//                   }
//                   if (!this.glowLayer) {
//                       this.glowLayer = new GlowLayer("glow", this.scene);
//                       this.glowLayer.intensity = 1;
//                   }
//                   line = MeshBuilder.CreateLines("line", {
//                       points: [this.firstPoint, this.firstPoint.clone()],
//                       updatable: true,
//                   }, this.scene);
//                   line.color = new Color3(0, 1, 0); // Зеленый цвет
//                   line.isPickable = false;
//                   this.glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
//                       if (mesh === line) {
//                           result.r = 0;
//                           result.g = 1;
//                           result.b = 0;
//                       }
//                   };
//                   this.glowLayer.intensity = 1; // Регулировка яркости свечения
//                   this.glowLayer.addIncludedOnlyMesh(line);

//                   // Создаем оси координат
//                   if (!axesViewer) {
//                       axesViewer = new AxesViewer(this.scene, 0.5); // Длина осей 0.5 единиц
//                   }
//                   axesViewer.update(
//                     this.firstPoint,
//                     new Vector3(1, 0, 0), // X-ось
//                     new Vector3(0, 1, 0), // Y-ось
//                     new Vector3(0, 0, 1)  // Z-ось
//                 );
//               } else if (!this.secondPoint) {
//                   // Установка второй точки и завершение измерения
//                   this.secondPoint = pickResult.pickedPoint.clone();

//                   // Вычисляем расстояние
//                   const distance = Vector3.Distance(this.firstPoint, this.secondPoint);

//                   // Эмитируем событие с расстоянием
//                   eventEmitter.emit("updateTextPlane", `Расстояние:\n${distance.toFixed(2)} м`);

//                   // Сброс состояния для нового измерения
//                   this.firstPoint = null;
//                   this.secondPoint = null;

//                   // Удаление объектов
//                   if (sphere) {
//                       sphere.dispose();
//                       sphere = null;
//                   }
//                   if (line) {
//                       line.dispose();
//                       line = null;
//                   }
//                   if (axesViewer) {
//                       axesViewer.dispose();
//                       axesViewer = null;
//                   }
//                   this.angleText.isVisible = false;
//               }
//           }
//       } else if (evt.button === 0) {
//           console.log("Левый клик. Замеры не проводятся.");
//       }
//   };

//   // Обновление углов и линии перед каждым кадром
//   this.scene.registerBeforeRender(() => {
//       if (this.firstPoint && !this.secondPoint) {
//           const pointerRay = this.scene.createPickingRay(
//               this.scene.pointerX,
//               this.scene.pointerY,
//               Matrix.Identity(),
//               this.scene.activeCamera
//           );
//           const pickResult = this.scene.pickWithRay(pointerRay);

//           if (pickResult.hit && pickResult.pickedPoint) {
//               const currentVector = pickResult.pickedPoint.subtract(this.firstPoint).normalize();

//               // Глобальные оси
//               const globalX = new Vector3(1, 0, 0);
//               const globalY = new Vector3(0, 1, 0);
//               const globalZ = new Vector3(0, 0, 1);

//               // Вычисляем углы относительно осей X, Y и Z
//               const angleX = Math.acos(Vector3.Dot(currentVector, globalX)) * (180 / Math.PI);
//               const angleY = Math.acos(Vector3.Dot(currentVector, globalY)) * (180 / Math.PI);
//               const angleZ = Math.acos(Vector3.Dot(currentVector, globalZ)) * (180 / Math.PI);

//               // Обновляем текст углов
//               this.angleText.text = `Угол X: ${angleX.toFixed(2)}°\nУгол Y: ${angleY.toFixed(2)}°\nУгол Z: ${angleZ.toFixed(2)}°`;
//               this.angleText.isVisible = true;

//               // Эмитируем событие для обновления углов
//               eventEmitter.emit("updateAngleText", this.angleText.text);

//               // Обновляем линию
//               if (line) {
//                   const updatedPoints = [this.firstPoint, pickResult.pickedPoint];
//                   line = MeshBuilder.CreateLines("line", {
//                       points: updatedPoints,
//                       updatable: true,
//                       instance: line,
//                   }, this.scene);
//               }

//               // Обновляем позицию осей координат
//               if (axesViewer) {
//                 axesViewer.update(
//                   this.firstPoint,
//                   new Vector3(1, 0, 0), // X-ось
//                   new Vector3(0, 1, 0), // Y-ось
//                   new Vector3(0, 0, 1)  // Z-ось
//               );
//               }
//           }
//       }
//   });
// }

enableDistanceMeasurement(): void {
  this.measuringDistance = true;
  this.firstPoint = null;
  this.secondPoint = null;

  let rotationOffsetY = 0;

  // Обработчик нажатий клавиш для вращения модели
  window.addEventListener("keydown", (evt) => {
    const angleStep = (Math.PI / 180) * 10;
    if (evt.key === "z") {
      rotationOffsetY -= angleStep;
    } else if (evt.key === "c") {
      rotationOffsetY += angleStep;
    }
  });

  // Инициализация текстового блока для углов
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
  }

  // Обработчик кликов
  this.scene.onPointerDown = (evt, pickResult) => {
    if (evt.button === 2) { // Правая кнопка мыши
      if (pickResult.hit && pickResult.pickedPoint) {
        if (!this.firstPoint) {
          // Первый клик: ставим модель и начинаем линию
          this.firstPoint = pickResult.pickedPoint.clone();

          // Очищаем старую модель, если она есть
          if (this.modelNode) {
            this.modelNode.dispose();
            this.modelNode = null;
          }

          // Загружаем модель
          SceneLoader.ImportMesh(
            "",
            "./models/",
            "Rangefinder_LP.gltf",
            this.scene,
            (meshes) => {
              if (meshes.length === 0) {
                console.error("Модель не содержит мешей.");
                return;
              }
              const parentNode = new TransformNode("measureModel", this.scene);
              meshes.forEach((m) => {
                m.parent = parentNode;
                m.isPickable = false;
              });
              parentNode.position.copyFrom(this.firstPoint);
              this.modelNode = parentNode;
            },
            null,
            (scene, message, exception) => {
              console.error("Ошибка загрузки модели:", message, exception);
            }
          );

          // Создаём линию
          if (this.line) {
            this.line.dispose();
          }
          if (!this.glowLayer) {
            this.glowLayer = new GlowLayer("glow", this.scene);
            this.glowLayer.intensity = 1;
          }
          this.line = MeshBuilder.CreateLines(
            "line",
            {
              points: [this.firstPoint, this.firstPoint.clone()],
              updatable: true,
            },
            this.scene
          );
          this.line.color = new Color3(0, 1, 0);
          this.line.isPickable = false;
          this.glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
            if (mesh === this.line) {
              result.r = 0;
              result.g = 1;
              result.b = 0;
            }
          };
          this.glowLayer.intensity = 1;
          this.glowLayer.addIncludedOnlyMesh(this.line);

          // AxesViewer
          if (!this.axesViewer) {
            this.axesViewer = new AxesViewer(this.scene, 0.2);
            const xAxisChildren = this.axesViewer.xAxis.getChildMeshes();
            xAxisChildren.forEach((childMesh) => {
              if ("visibility" in childMesh) {
                (childMesh as LinesMesh).visibility = 0.5;
              }
            });
            const yAxisChildren = this.axesViewer.yAxis.getChildMeshes();
            yAxisChildren.forEach((childMesh) => {
              if ("visibility" in childMesh) {
                (childMesh as LinesMesh).visibility = 0.5;
              }
            });
            const zAxisChildren = this.axesViewer.zAxis.getChildMeshes();
            zAxisChildren.forEach((childMesh) => {
              if ("visibility" in childMesh) {
                (childMesh as LinesMesh).visibility = 0.5;
              }
            });
          }
          this.axesViewer.update(
            this.firstPoint,
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1)
          );
        } else if (!this.secondPoint) {
          // Второй клик: фиксируем расстояние
          this.secondPoint = pickResult.pickedPoint.clone();
          const distance = Vector3.Distance(this.firstPoint, this.secondPoint);
          eventEmitter.emit("updateTextPlane", `Расстояние:\n${distance.toFixed(2)} м`);

          // Сброс состояния
          this.firstPoint = null;
          this.secondPoint = null;
          rotationOffsetY = 0;

          // Очистка
          if (this.modelNode) {
            this.modelNode.dispose();
            this.modelNode = null;
          }
          if (this.line) {
            this.line.dispose();
            this.line = null;
          }
          if (this.axesViewer) {
            this.axesViewer.dispose();
            this.axesViewer = null;
          }
          this.angleText.isVisible = false;
        }
      }
    } else if (evt.button === 0) {
      console.log("Левый клик. Замеры не проводятся.");
    }
  };

  // Обновление перед рендерингом
  this.scene.registerBeforeRender(() => {
    if (this.firstPoint && !this.secondPoint) {
      const pointerRay = this.scene.createPickingRay(
        this.scene.pointerX,
        this.scene.pointerY,
        Matrix.Identity(),
        this.scene.activeCamera
      );
      const pickResult = this.scene.pickWithRay(pointerRay);

      if (pickResult.hit && pickResult.pickedPoint) {
        // 1) Обновление углов
        const currentVector = pickResult.pickedPoint.subtract(this.firstPoint).normalize();
        const globalX = new Vector3(1, 0, 0);
        const globalY = new Vector3(0, 1, 0);
        const globalZ = new Vector3(0, 0, 1);

        const angleX = Math.acos(Vector3.Dot(currentVector, globalX)) * (180 / Math.PI);
        const angleY = Math.acos(Vector3.Dot(currentVector, globalY)) * (180 / Math.PI);
        const angleZ = Math.acos(Vector3.Dot(currentVector, globalZ)) * (180 / Math.PI);

        this.angleText.text = `Угол X: ${angleX.toFixed(2)}°\nУгол Y: ${angleY.toFixed(2)}°\nУгол Z: ${angleZ.toFixed(2)}°`;
        this.angleText.isVisible = true;

        eventEmitter.emit("updateAngleText", this.angleText.text);

        // 2) Обновление линии
        if (this.line) {
          const updatedPoints = [this.firstPoint, pickResult.pickedPoint];
          this.line = MeshBuilder.CreateLines(
            "line",
            {
              points: updatedPoints,
              updatable: true,
              instance: this.line,
            },
            this.scene
          );
        }

        // 3) Обновление осей
        if (this.axesViewer) {
          this.axesViewer.update(
            this.firstPoint,
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1)
          );
        }

        // 4) Поворот модели
        if (this.modelNode) {
          const direction = pickResult.pickedPoint.subtract(this.firstPoint);
          if (direction.length() > 0.0001) {
            const forward = direction.normalize();
            const up = new Vector3(0, 1, 0);
            const right = Vector3.Cross(up, forward).normalize();
            const realUp = Vector3.Cross(forward, right).normalize();

            const rotMatrix = Matrix.Identity();
            Matrix.FromXYZAxesToRef(right, realUp, forward, rotMatrix);
            const rotationQ = Quaternion.FromRotationMatrix(rotMatrix);
            const correction = Quaternion.FromEulerAngles(Math.PI, -Math.PI / 2, -Math.PI / 2);
            let final = rotationQ.multiply(correction);

            const extraRotation = Quaternion.FromEulerAngles(0, rotationOffsetY, 0);
            final = final.multiply(extraRotation);

            this.modelNode.rotationQuaternion = Quaternion.Slerp(
              this.modelNode.rotationQuaternion || Quaternion.Identity(),
              final,
              0.3
            );
          }
        }
      }
    }
  });
}


//Версия с как в бетоне
// enableDistanceMeasurement(): void {
//   this.measuringDistance = true;
//   this.firstPoint = null;
//   this.secondPoint = null;
  
//   // Будем хранить модель в переменной вместо sphere
//   let modelNode: TransformNode | null = null; // <-- Изменено

//   let line: LinesMesh | null = null;
//   let axesViewer: AxesViewer | null = null;

//   // Дополнительно сохраняем нормаль от первого клика:
//   this.firstNormal = null; // <-- Изменено

//   // Создаём текстовый блок для отображения углов
//   if (!this.angleText) {
//     this.angleText = new TextBlock();
//     this.angleText.text = "";
//     this.angleText.color = "white";
//     this.angleText.fontSize = 24;
//     this.angleText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
//     this.angleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//     this.angleText.top = "10px";
//     this.angleText.left = "10px";
//     this.angleText.isHitTestVisible = false;
//   }

//   // Обработчик кликов
//   this.scene.onPointerDown = (evt, pickResult) => {
//     if (evt.button === 2) {
//       // Правая кнопка мыши
//       if (pickResult.hit && pickResult.pickedPoint) {
//         if (!this.firstPoint) {
//           // =======================
//           // 1) Установка первой точки
//           // =======================
//           this.firstPoint = pickResult.pickedPoint.clone();
//           this.firstNormal = pickResult.getNormal(true)?.normalize() || Vector3.Up(); // <-- Изменено

//           // Вместо сферы — загрузка модели
//           if (modelNode) {
//             modelNode.dispose();
//             modelNode = null;
//           }

//           SceneLoader.ImportMesh(
//             "",
//             "./models/",
//             "Rangefinder_LP.glb", // <-- Укажите свою модель
//             this.scene,
//             (meshes) => {
//               if (meshes.length === 0) {
//                 console.error("Модель не содержит мешей.");
//                 return;
//               }

//               // Создаём родительский TransformNode
//               const parentNode = new TransformNode("measureModel", this.scene);
//               // Привязываем все загруженные меши к родителю
//               meshes.forEach((m) => {
//                 m.parent = parentNode;
//                 m.isPickable = false;
//               });

//               // Начальная позиция модели = точка клика
//               parentNode.position.copyFrom(this.firstPoint);

//               // Если модель требует первоначального поворота
//               // (как в вашем примере, где было `parentNode.scaling.x *= -1` и т.д.):
//               parentNode.scaling.x *= -1; // К примеру
//               const correctionRotation = Quaternion.FromEulerAngles(0, -Math.PI / 2, 0);
//               parentNode.rotationQuaternion = correctionRotation.multiply(
//                 parentNode.rotationQuaternion || Quaternion.Identity()
//               );

//               // Сохраняем, чтобы использовать в registerBeforeRender
//               modelNode = parentNode;
//             },
//             null,
//             (scene, message, exception) => {
//               console.error("Ошибка загрузки модели:", message, exception);
//             }
//           );

//           // =======================
//           // Создаём линию (как раньше)
//           // =======================
//           if (line) {
//             line.dispose();
//           }
//           if (!this.glowLayer) {
//             this.glowLayer = new GlowLayer("glow", this.scene);
//             this.glowLayer.intensity = 1;
//           }
//           line = MeshBuilder.CreateLines(
//             "line",
//             {
//               points: [this.firstPoint, this.firstPoint.clone()],
//               updatable: true,
//             },
//             this.scene
//           );
//           line.color = new Color3(0, 1, 0);
//           line.isPickable = false;
//           this.glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
//             if (mesh === line) {
//               result.r = 0;
//               result.g = 1;
//               result.b = 0;
//             }
//           };
//           this.glowLayer.intensity = 1;
//           this.glowLayer.addIncludedOnlyMesh(line);

//           // Создаём оси координат
//           if (!axesViewer) {
//             axesViewer = new AxesViewer(this.scene, 0.2); // Делаем оси короче
        
//             // Например, ось X
//             // axesViewer.xAxis — это TransformNode
//             // внутри него будет 1 или более мешей (обычно LinesMesh).
//             const xAxisChildren = axesViewer.xAxis.getChildMeshes();
//             xAxisChildren.forEach(childMesh => {
//               if ("visibility" in childMesh) {  // childMesh должно быть LinesMesh
//                 (childMesh as LinesMesh).visibility = 0.5; 
//               }
//             });
            
//             // Аналогично для Y
//             const yAxisChildren = axesViewer.yAxis.getChildMeshes();
//             yAxisChildren.forEach(childMesh => {
//               if ("visibility" in childMesh) {
//                 (childMesh as LinesMesh).visibility = 0.5;
//               }
//             });
        
//             // И для Z
//             const zAxisChildren = axesViewer.zAxis.getChildMeshes();
//             zAxisChildren.forEach(childMesh => {
//               if ("visibility" in childMesh) {
//                 (childMesh as LinesMesh).visibility = 0.5;
//               }
//             });
//         }
//           axesViewer.update(
//             this.firstPoint,
//             new Vector3(1, 0, 0),
//             new Vector3(0, 1, 0),
//             new Vector3(0, 0, 1)
//           );
//         } else if (!this.secondPoint) {
//           // =======================
//           // 2) Установка второй точки, завершение измерения
//           // =======================
//           this.secondPoint = pickResult.pickedPoint.clone();

//           // Вычисляем расстояние
//           const distance = Vector3.Distance(this.firstPoint, this.secondPoint);
//           eventEmitter.emit("updateTextPlane", `Расстояние:\n${distance.toFixed(2)} м`);

//           // Сброс состояния
//           this.firstPoint = null;
//           this.secondPoint = null;

//           // Удаление объектов
//           if (modelNode) {
//             modelNode.dispose(); // <-- уничтожаем модель вместо сферы
//             modelNode = null;
//           }
//           if (line) {
//             line.dispose();
//             line = null;
//           }
//           if (axesViewer) {
//             axesViewer.dispose();
//             axesViewer = null;
//           }
//           this.angleText.isVisible = false;
//         }
//       }
//     } else if (evt.button === 0) {
//       console.log("Левый клик. Замеры не проводятся.");
//     }
//   };

//   // =======================
//   // Обновление углов, линии и поворот модели (если создана) перед кадром
//   // =======================
//   this.scene.registerBeforeRender(() => {
//     // Если выбрана первая точка, но вторая ещё не выбрана
//     if (this.firstPoint && !this.secondPoint) {
//       const pointerRay = this.scene.createPickingRay(
//         this.scene.pointerX,
//         this.scene.pointerY,
//         Matrix.Identity(),
//         this.scene.activeCamera
//       );
//       const pickResult = this.scene.pickWithRay(pointerRay);

//       if (pickResult.hit && pickResult.pickedPoint) {
//         // -----------------------
//         // 1. Вычисляем вектор от первой точки до курсора
//         // -----------------------
//         const currentVector = pickResult.pickedPoint.subtract(this.firstPoint).normalize();

//         // -----------------------
//         // 2. Углы относительно глобальных осей (как и было)
//         // -----------------------
//         const globalX = new Vector3(1, 0, 0);
//         const globalY = new Vector3(0, 1, 0);
//         const globalZ = new Vector3(0, 0, 1);

//         const angleX = Math.acos(Vector3.Dot(currentVector, globalX)) * (180 / Math.PI);
//         const angleY = Math.acos(Vector3.Dot(currentVector, globalY)) * (180 / Math.PI);
//         const angleZ = Math.acos(Vector3.Dot(currentVector, globalZ)) * (180 / Math.PI);

//         this.angleText.text = `Угол X: ${angleX.toFixed(2)}°\nУгол Y: ${angleY.toFixed(2)}°\nУгол Z: ${angleZ.toFixed(2)}°`;
//         this.angleText.isVisible = true;

//         eventEmitter.emit("updateAngleText", this.angleText.text);

//         // -----------------------
//         // 3. Обновляем линию
//         // -----------------------
//         if (line) {
//           const updatedPoints = [this.firstPoint, pickResult.pickedPoint];
//           line = MeshBuilder.CreateLines(
//             "line",
//             {
//               points: updatedPoints,
//               updatable: true,
//               instance: line,
//             },
//             this.scene
//           );
//         }

//         // -----------------------
//         // 4. Обновляем оси координат
//         // -----------------------
//         if (axesViewer) {
//           axesViewer.update(
//             this.firstPoint,
//             new Vector3(1, 0, 0),
//             new Vector3(0, 1, 0),
//             new Vector3(0, 0, 1)
//           );
//         }

//         // -----------------------
//         // 5. Вращаем модель, чтобы она
//         //    - Всегда "смотрела" нормалью к поверхности (this.firstNormal)
//         //    - Повернулась в сторону курсора (по сути вокруг нормали)
//         // -----------------------
//         if (modelNode && this.firstNormal) {
//           // Нормаль, полученная при первом клике
//           const normal = this.firstNormal;

//           // Вектор, указывающий от "первой точки" к курсору
//           // При желании можно взять проекцию на плоскость, перпендикулярную normal,
//           // чтобы вращение шло строго вокруг normal.
//           const toCursor = pickResult.pickedPoint.subtract(this.firstPoint).normalize();

//           // Простейший подход:
//           //  - "Верх" (up) модели = нормаль поверхности
//           //  - Ориентация "вперёд" = проекция направления наCursor на плоскость
//           //    перпендикулярную normal.

//           // Проецируем toCursor на плоскость, перпендикулярную normal
//           // (убираем компоненту, направленную вдоль normal)
//           const dot = Vector3.Dot(toCursor, normal);
//           // Компонента вдоль normal:
//           const alongNormal = normal.scale(dot);
//           // Остаток — это проекция на плоскость:
//           const forward = toCursor.subtract(alongNormal).normalize();

//           // Если проекция получилась очень маленькой, чтобы избежать ошибок:
//           if (forward.length() < 0.0001) {
//             return;
//           }

//           // Находим оси: forward, normal, right
//           //  - forward = X
//           //  - normal  = Y
//           //  - right   = Z
//           // Или любая удобная вам ориентация.
//           const right = Vector3.Cross(normal, forward).normalize();
//           // Собираем матрицу поворота из трёх перпендикулярных векторов
//           //   columns: right, normal, forward (или в другом порядке, в зависимости от того,
//           //   как именно должна «стоять» ваша модель)
//           const rotMatrix = Matrix.Identity();
//           Matrix.FromXYZAxesToRef(right, normal, forward, rotMatrix);

//           // Преобразуем матрицу в кватернион
//           const rotationQ = Quaternion.FromRotationMatrix(rotMatrix);
//           const correction = Quaternion.FromEulerAngles(0, -Math.PI / 2, -Math.PI / 2);
//           const final = rotationQ.multiply(correction);
          
//           modelNode.rotationQuaternion = Quaternion.Slerp(
//             modelNode.rotationQuaternion || Quaternion.Identity(),
//             final,
//             0.3
//           );
//         }
//       }
//     }
//   });
// }

cleanupDistanceMeasurement(): void {
  if (this.modelNode) {
    this.modelNode.dispose();
    this.modelNode = null;
  }
  if (this.line) {
    this.line.dispose();
    this.line = null;
  }
  if (this.axesViewer) {
    this.axesViewer.dispose();
    this.axesViewer = null;
  }
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
  


  