import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  HighlightLayer,
  Color3,
  FreeCamera,
  KeyboardEventTypes,
  Mesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";

import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";

import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";
import { CameraController } from "./BaseComponents/CameraController";
import { LoadingScreen } from "./BaseComponents/LoadingScreen";
// Важно: используем тот же ModelLoader, что и в BookScene
import { ModelLoader } from "./BaseComponents/ModelLoader";

import eventEmitter from "../../EventEmitter";

export class TapeScene {
  private scene: Scene;
  private engine: Engine;
  private canvas: HTMLCanvasElement;

  // Камера
  private camera: FreeCamera;

  // GUI
  private guiTexture!: AdvancedDynamicTexture;
  private guiManager!: GUIManager;
  private dialogPage!: DialogPage;

  // Триггеры взаимодействия
  private triggerManager!: TriggerManager2;

  // Общий ModelLoader (такой же, как в BookScene)
  private modelLoader: ModelLoader;

  private fixedPoint: Vector3 | null = null;         // Первая зафиксированная точка
  private secondFixedPoint: Vector3 | null = null;     // Вторая зафиксированная точка
  private measurementStage: 0 | 1 | 2 = 0;             // 0 – нет кликов, 1 – первый клик, 2 – второй клик (измерение зафиксировано)
  private rulerMesh: Mesh | null = null;               // Меш линейки (фиксированная часть)
  private tapeRollMesh: Mesh | null = null;            // Меш рулетки (следует за курсором)
  private lastPointerPoint: Vector3 | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = this.createScene();

    // Инициализируем CameraController (по аналогии с BookScene)
    this.CreateController();

    // Инициализируем общий ModelLoader
    this.modelLoader = new ModelLoader(this.scene);

    // Инициализируем менеджеры (GUI, Trigger и т.д.)
    this.initializeManagers();

    // Запускаем основной цикл рендеринга
    this.runRenderLoop();

    // Запускаем загрузку и настройку сцены
    this.CreateEnvironment();
  }

  /**
   * Создание базовой сцены (свет, окружение, коллизии).
   */
  private createScene(): Scene {
    const scene = new Scene(this.engine);

    // Включаем коллизии и гравитацию
    scene.gravity = new Vector3(0, -9.81 / 60, 0);
    scene.collisionsEnabled = true;

    // Освещение
    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

    // Окружение (HDR)
    const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

      CreateController(): void {
          // Установка начальной позиции камеры для лучшей видимости
          this.camera = new FreeCamera("camera", new Vector3(0, 2, -2), this.scene);
          this.camera.attachControl(this.canvas, true);
  
          this.camera.applyGravity = false;
          this.camera.checkCollisions = true;
          this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
          this.camera.minZ = 0.45;
          this.camera.speed = 0.55;
          this.camera.angularSensibility = 4000;
          this.camera.keysUp.push(87);   // W
          this.camera.keysLeft.push(65); // A
          this.camera.keysDown.push(83); // S
          this.camera.keysRight.push(68); // D
  
          // Переменные для Q-зума
          const originalFov = this.camera.fov;
          let isZoomedIn = false;
          this.scene.onKeyboardObservable.add((kbInfo) => {
              if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                  const key = kbInfo.event.key.toLowerCase();
                  if (/q|й/.test(key)) {
                      // Зумируем только если измерение зафиксировано (состояние 2) и есть вторая точка
                      if (this.measurementStage === 2 && this.secondFixedPoint) {
                          if (!isZoomedIn) {
                              // Приближение: уменьшаем FOV и устанавливаем цель на вторую точку
                              this.camera.fov /= 4;
                              this.camera.setTarget(this.secondFixedPoint);
                          } else {
                              // Отдаление: восстанавливаем FOV и цель (например, на первую точку или исходное направление)
                              this.camera.fov = originalFov;
                              this.camera.setTarget(this.fixedPoint || new Vector3(0, 0, 0));
                          }
                          isZoomedIn = !isZoomedIn;
                      }
                  }
              }
          });
      }

  /**
   * Запуск рендер-цикла.
   */
  private runRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * Инициализация менеджеров (GUIManager, TriggerManager, DialogPage).
   */
  private initializeManagers(): void {
    this.guiManager = new GUIManager(this.scene, this.textMessages);
    this.dialogPage = new DialogPage();
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(this.scene, this.canvas);

    // Пример: создаём рамку (border box) через GUIManager
    this.guiManager.createBorderBox();
  }

  private async CreateEnvironment(): Promise<void> {
    this.engine.displayLoadingUI();
    try {
      // Загружаем модели, необходимые для QuestionScene (уже добавлено в ModelLoader)
      await this.modelLoader.loadAllQuestionModels();

      // Настраиваем диалоговые страницы
      this.setupDialogPages();

    } catch (error) {
      console.error("Ошибка при загрузке QuestionScene:", error);
    } finally {
      // Скрываем LoadingUI движка (вертушку в центре)
      this.engine.hideLoadingUI();
      // LoadingScreen (видео) сам удалится по окончании воспроизведения
    }
  }


  /**
   * Настройка диалоговых страниц (по аналогии с BookScene).
   */
  private setupDialogPages(): void {
    // Пример: простая пара страниц
    const page1 = this.dialogPage.addText(
      "Привет! Здесь тест по конструкциям.\n" +
      "Кликай по подсвеченным объектам и выбирай правильный ответ."
    );


    this.guiManager.CreateDialogBox([page1]);
  }

  
}