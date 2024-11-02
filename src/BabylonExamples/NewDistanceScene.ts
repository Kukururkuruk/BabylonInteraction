import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  AbstractMesh,
  ActionManager,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";

export class NewDistanceScene {
  scene: Scene;
  engine: Engine;
  canvas: HTMLCanvasElement;
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private zoneTriggered: boolean = false;
  private targetMeshes2: AbstractMesh[];
  private beam2: AbstractMesh;
  private nonCollizionMesh: AbstractMesh[]
  private bob: AbstractMesh;


  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.dialogPage = new DialogPage();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      
  });
  
    this.CreateController();

    this.BetonTrigger();

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

    const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    // Установка начальной позиции камеры для лучшей видимости
    this.camera = new FreeCamera("camera", new Vector3(17, 2, 13), this.scene);
    this.camera.attachControl(this.canvas, true);

    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.angularSensibility = 4000;
    this.camera.rotation.y = -Math.PI/2
    this.camera.keysUp.push(87); // W
    this.camera.keysLeft.push(65); // A
    this.camera.keysDown.push(83); // S
    this.camera.keysRight.push(68); // D
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);

      map.forEach((mesh) => {
        mesh.checkCollisions = true;
        mesh.isPickable = true;
      });

      const nonCollizionMeshs = ["SM_ConcreteFence_LP.015", "SM_ConcreteFence_LP.030", "SM_0_FencePost_Road.087", "SM_0_FencePost_Road.088"]
      nonCollizionMeshs.map((item) => {
          const nonCollizionMesh = map.filter((mesh) => mesh.name === item);
          nonCollizionMesh.forEach((mesh) => {
              mesh.visibility = 0.5;
              mesh.checkCollisions = false
          });
      })

      const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
      BrokenMeshes.forEach((mesh) => {
          mesh.visibility = 0;
      });

      this.targetMeshes2 = map.filter((mesh) => mesh.name.toLowerCase().includes("rack"));
      this.beam2 = this.targetMeshes2[1];

      this.nonCollizionMesh = map.filter((mesh) => mesh.name === "SM_0_Road_1_R");
      this.bob = this.nonCollizionMesh[0]

      console.log("nonCollizionMesh", this.bob);
      


      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    } finally {
      this.engine.hideLoadingUI();
    }
  }

  // BetonTrigger(): void {
  //     const fullText1 = "Нажми на кнопку для начала измерения.";
  //     const fullText2 = "Переместите мышку в то место шде хотите произвести измерение. На кнопки Q и E вы можете повернуть бетонометр. После нажмите на кнопку для завершения измерения";
  //     const fullText3 = "Отлично, а теперь нажмите на кнопку для премещение на основную карту";
  //     this.guiManager.CreateDialogBox(fullText1)
  //     const clickZonePosition = new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421);
  //     let clickCount = 0;
  //     let clickCountText: TextBlock | null = null;
  
  //     // Предположим, что beam2 — это меш, с которым будем взаимодействовать в режиме лазера
  //     const targetMeshForLaser2 = this.bob; // Убедитесь, что this.beam2 инициализирован
      
  //     // Создаем вторую триггер-зону
  //     const secondTriggerZone = this.triggerManager.setupZoneTrigger(
  //       clickZonePosition,
  //       () => {
  //         if (!this.zoneTriggered) {
  //             this.zoneTriggered = true;
  //             this.triggerManager.createStartButton('Начать', () => {
  //             // Показываем сообщение
  //             this.guiManager.CreateDialogBox(fullText2)
      
  //             // Активируем взаимодействие с beam2
  //             if (this.bob) {
  //               this.triggerManager.setupClickableMesh(this.bob, () => {
  //                 clickCount++;
  //                 // Обновляем или создаем текст с количеством кликов
  //                 if (!clickCountText) {
  //                   clickCountText = new TextBlock();
  //                   clickCountText.text = `Клики: ${clickCount}`;
  //                   clickCountText.color = "white";
  //                   clickCountText.fontSize = 24;
  //                   clickCountText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  //                   clickCountText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  //                   clickCountText.top = "100px";
  //                   clickCountText.right = "20px";
  //                   clickCountText.isHitTestVisible = false;
  //                   this.guiTexture.addControl(clickCountText);
  //                 } else {
  //                   clickCountText.text = `Клики: ${clickCount}`;
  //                 }
  //               });
      
  //               // Активируем режим лазера для второй триггер-зоны
  //               this.triggerManager.distanceMode();
  //               this.triggerManager.enableDistanceMeasurement()
  //               this.triggerManager.createStartButton('Завершить', () => {
  //                 this.guiManager.CreateDialogBox(fullText3)
  //                 // Показываем сообщение с общим количеством кликов
  //                 const totalClicksMessage = new TextBlock();
  //                 totalClicksMessage.text = `Вы кликнули ${clickCount} раз(а)`;
  //                 totalClicksMessage.color = "white";
  //                 totalClicksMessage.fontSize = 24;
  //                 totalClicksMessage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  //                 totalClicksMessage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  //                 totalClicksMessage.top = "-10%";
  //                 this.guiTexture.addControl(totalClicksMessage);
          
  //                 // Удаляем сообщение через 3 секунды
  //                 setTimeout(() => {
  //                   this.guiTexture.removeControl(totalClicksMessage);
  //                 }, 3000);
          
  //                 // Очищаем
  //                 if (clickCountText) {
  //                   this.guiTexture.removeControl(clickCountText);
  //                   clickCountText = null;
  //                 }
  //                 clickCount = 0;
          
  //                 // Отключаем взаимодействие с beam2
  //                 if (this.bob) {
  //                   this.triggerManager.removeMeshAction(this.bob);
  //                 }
          
  //                 // Деактивируем режим лазера для второй триггер-зоны
  //                 this.triggerManager.exitDisLaserMode2();
  //                 this.guiManager.createRouteButton('/test')
  //             })
  //             }
              
  //             })
      
  //         }

  //       },
  //       undefined,
  //       20, // camSize
  //       // Не передаем markMeshTemplate и markMeshHeight, так как знак мы уже создали вручную
  //     );

  // }

  BetonTrigger(): void {
    const page1 = this.dialogPage.addText("Нажми на кнопку для начала измерения.")
    this.guiManager.CreateDialogBox([page1])

            this.triggerManager.createStartButton('Начать', () => {
            // Показываем сообщение
            const page2 = this.dialogPage.addText("Вам нужно измерить длину конструкций которые представлены на второй странице. Для того чтобы начать измерение нажмите на правую кнопку мыши в месте откуда хотите начать. Второй раз кликните в том месте где нужно закончить измерение. Появившуюся цифру введите на второй странице")
            const page3 = this.dialogPage.addInputGrid("Конструкции", ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"])
            this.guiManager.CreateDialogBox([page2, page3])

              // Активируем режим лазера для второй триггер-зоны
              this.triggerManager.distanceMode();
              this.triggerManager.enableDistanceMeasurement()
              this.triggerManager.createStartButton('Завершить', () => {
                const page4 = this.dialogPage.addText("Отлично, а теперь нажмите на кнопку для премещение на основную карту")
                this.guiManager.CreateDialogBox([page4])
                this.triggerManager.disableDistanceMeasurement()

                this.triggerManager.exitDisLaserMode2();
                this.guiManager.createRouteButton('/test')
            })

            
            })

}

}