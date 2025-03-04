import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  Tools,
  FreeCamera,
  AbstractMesh,
  Animation,
  HighlightLayer,
  Color3,
  Mesh,

} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Button, Control, Image, Rectangle, TextBlock, TextWrapping } from "@babylonjs/gui";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { CameraController } from "./BaseComponents/CameraController";
import { ModelLoader } from "./BaseComponents/ModelLoader";

interface ZoneData {
  position: Vector3,
  name: string,
  height: number,
  dialogText: string,
  route: string,
}

export class TestScene {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  private cameraController: CameraController
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  private guiManager: GUIManager;
  private dialogPage: DialogPage;
  private modelLoader: ModelLoader;
  private markMeshes: AbstractMesh[] = [];
  private zoneSigns: AbstractMesh[] = [];
  private zoneData: { [key: string]: ZoneData } = {};
  private chosenArray: string[] = ['1','2','3','4','5','6']

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();
  
    this.scene = this.CreateScene();

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture, this.camera);
    this.guiManager = new GUIManager(this.scene);
    this.dialogPage = new DialogPage()
    this.modelLoader = new ModelLoader(this.scene);
  
    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
      this.createZoneObj()
      this.chosenZon()     
    });

    this.cameraController = new CameraController(this.scene, this.canvas, "complex", new Vector3(50, 2.5, 0));

    const page1 = this.dialogPage.addText("Задания, которые были тобой выбраны в личном кабинете, помечены специальными знаками. Подойди к знаку и следуй инструкциям.")
    this.guiManager.CreateDialogBox([page1]);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
  
  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    // hemiLight.intensity = 0.5; // Установите желаемую интенсивность

    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();
  
      // Загрузка всех моделей
      const hide = false
      await this.modelLoader.loadBridge(hide);
      
      // Загрузка markMeshes
      const assetContainer = await SceneLoader.LoadAssetContainerAsync(
        "./models/",           // rootUrl
        "exclamation_point.glb", // sceneFilename
        this.scene              // scene
      );

      this.markMeshes = assetContainer.meshes; // Сохраняем meshes из AssetContainer
      console.log(this.markMeshes);
      
  
      // Масштабируем шаблонный меш
      this.markMeshes.forEach((mesh) => {
        mesh.scaling = new Vector3(0.5, 0.7, 0.5);
        // mesh.visibility = 0.5;
      });

      this.guiManager.createBorderBox()
  
      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  createZoneObj(): void {
    this.zoneData['1'] = {
      position: new Vector3(-10.622146207334794, 8.8, -3.62),
      name: 'firstZoneSign',
      height: 6,
      dialogText: 'Здесь тебя ждет обучение по использованию дальнометра. Нажми на кнопку для перемещения в зону теста.',
      route: '/ДальнометрОбучение'
    }
    this.zoneData['2'] = {
      position: new Vector3(13.057004227460391, 2.0282419080806964, 13.477405516648421),
      name: 'secondZoneSign',
      height: -1,
      dialogText: "Здесь тебя ждет использование бетонометра (я не помню как он называется). Нажми на кнопку для перемещения в зону теста.",
      route: '/Бетонометр'
    }
    this.zoneData['3'] = {
      position: new Vector3(12.46, 2.0, 4.79),
      name: 'thirdZoneSign',
      height: -1,
      dialogText: "Здесь тебя ждет использование линейки и штангенциркуля. Нажми на кнопку для перемещения в зону теста.",
      route: '/Штангенциркуль'
    }
    this.zoneData['4'] = {
      position: new Vector3(41.14320937858243, 2.670984252631138, -0.04211929133677441),
      name: 'fourthZoneSign',
      height: -1,
      dialogText: "Здесь тебя ждет использование дальнометра. Нажми на кнопку для перемещение в зону теста.",
      route: '/ДальнометрТест'
    }
    this.zoneData['5'] = {
      position: new Vector3(-14.60972728503516, 2.672766933441162, -0.2746599608322637),
      name: 'fifthZoneSign',
      height: -1,
      dialogText: "Здесь тебя ждет бейсик левел. Нажми на кнопку для перемещения в зону.",
      route: '/УровеньПузырька'
    }
    this.zoneData['6'] = {
      position: new Vector3(11.72647800945137, 9.42517840874411, -4.931777454799131),
      name: 'secondZoneSign',
      height: 6,
      dialogText: "Здесь тебя ждет тотал стейшн. Нажми на кнопку для перемещения в зону.",
      route: '/Тахеометр'
    }
  }

  chosenZon(): void {
    this.chosenArray.filter((el) => {
      if(this.zoneData[el]) {
        const markMeshTemplate = this.markMeshes[0]; // Используем первый mesh как шаблон
        const zone = this.zoneData[el]

        // Создаем массив для хранения ссылок на знаки в зонах
        this.zoneSigns = [];

        // --- Первый триггер-зона ---
        const ZonePosition = zone.position
        const ZoneSign = markMeshTemplate.clone(zone.name, null);
        if (!ZoneSign) {
          console.error(`Failed to clone mesh for zone: ${zone.name}`);
          return;
        }
        ZoneSign.position = ZonePosition.clone();
        ZoneSign.position.y = zone.height; 
        ZoneSign.isVisible = true;

        ZoneSign.getChildMeshes().forEach(child => {
          child.isVisible = true;

          
        
          // --- Добавляем покачивание вверх-вниз ---
          const animationY = new Animation(
            "bounceAnimation",            // Имя анимации
            "position.y",                 // Свойство для анимации
            30,                           // Частота кадров
            Animation.ANIMATIONTYPE_FLOAT,  // Тип данных
            Animation.ANIMATIONLOOPMODE_CYCLE // Цикличная анимация
          );
        
          const keysY = [
            { frame: 0, value: child.position.y },       // Начальная позиция
            { frame: 30, value: child.position.y + 0.2 }, // Верхняя точка
            { frame: 60, value: child.position.y },       // Возвращение в начальную позицию
          ];
        
          animationY.setKeys(keysY);
          child.animations.push(animationY);
          this.scene.beginAnimation(child, 0, 60, true);
        
          // --- Добавляем сияние ---
          // const highlightLayer = new HighlightLayer("hl1", this.scene);
          
          // if (child instanceof Mesh) {
          //   highlightLayer.addMesh(child, Color3.Yellow());
          // }
        
          // --- Альтернативный вариант сияния через emissiveColor ---
          if (child.material) {
            const emissiveAnimation = new Animation(
              "emissiveAnimation",
              "material.emissiveColor",
              30,
              Animation.ANIMATIONTYPE_COLOR3,
              Animation.ANIMATIONLOOPMODE_CYCLE
            );
        
            const keysEmissive = [
              { frame: 0, value: new Color3(0.2, 0.2, 0) },  // Тусклый желтый
              { frame: 30, value: new Color3(1, 1, 0) },      // Яркий желтый
              { frame: 60, value: new Color3(0.2, 0.2, 0) },  // Возвращение в тусклый
            ];
        
            emissiveAnimation.setKeys(keysEmissive);
            child.animations.push(emissiveAnimation);
            this.scene.beginAnimation(child, 0, 60, true);
          }
        });

        this.scene.addMesh(ZoneSign);
        this.zoneSigns.push(ZoneSign);

        const TriggerZone = this.triggerManager.setupZoneTrigger(
            ZonePosition,
            () => {
              const page2 = this.dialogPage.createStartPage(zone.dialogText, "Перейти", () => {
                window.location.href = zone.route;
              })
              this.guiManager.CreateDialogBox([page2]); 
                if (ZoneSign) {
                    ZoneSign.getChildMeshes().forEach(child => {
                      child.visibility = 0.2
                    });
                }
            },
            () => {
              const page3 = this.dialogPage.addText("Продолжайте осмотр")
              this.guiManager.CreateDialogBox([page3]);
              if (ZoneSign) {
                ZoneSign.getChildMeshes().forEach(child => {
                  child.visibility = 1
                });
            }
            }, 
            3 
        );
      }
    })
  }

}