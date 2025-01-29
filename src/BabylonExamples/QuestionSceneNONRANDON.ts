import {
    Scene,
    Engine,
    Vector3,
    HemisphericLight,
    HDRCubeTexture,
    HighlightLayer,
    Color3,
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
  
  export class QuestionSceneNONRANDOM {
    private scene: Scene;
    private engine: Engine;
    private canvas: HTMLCanvasElement;
  
    // Камера
    private cameraController: CameraController;
  
    // GUI
    private guiTexture!: AdvancedDynamicTexture;
    private guiManager!: GUIManager;
    private dialogPage!: DialogPage;
  
    // Триггеры взаимодействия
    private triggerManager!: TriggerManager2;
  
    // Подсветка
    private highlightLayer!: HighlightLayer;
  
    // Счётчики
    private clickedMeshes: number = 0;
    private totalMeshes: number = 0;
    private correctAnswers: number = 0;
    private incorrectAnswers: number = 0;
  
    // Текстовые блоки для счётчиков
    private counterText!: TextBlock;
    private correctAnswersText!: TextBlock;
    private incorrectAnswersText!: TextBlock;
  
    // Общий ModelLoader (такой же, как в BookScene)
    private modelLoader: ModelLoader;
  
    // Загрузочный экран (используем тот же класс, что в BookScene)
    private loadingScreen: LoadingScreen;
  
    // Флаг, что сцена полностью загружена
    private isSceneLoaded: boolean = false;
  
    // Опциональный обработчик для открытия модального окна
    public openModal?: (keyword: string) => void;
  
    // Текстовые сообщения для обучения (передаём в GUIManager)
    private readonly textMessages: string[] = [
      "Чтобы идти вперёд нажмите W",
      "Чтобы идти назад нажмите S",
      "Чтобы идти влево нажмите A",
      "Чтобы идти вправо нажмите D",
      "Осмотритесь по комнате",
    ];
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.engine = new Engine(this.canvas, true);
      this.scene = this.createScene();
  
      // Инициализируем CameraController (по аналогии с BookScene)
      this.cameraController = new CameraController(this.scene, this.canvas, "complex");
  
      // Инициализируем общий ModelLoader
      this.modelLoader = new ModelLoader(this.scene);
  
      // Инициализируем менеджеры (GUI, Trigger и т.д.)
      this.initializeManagers();
  
      // Инициализируем слой подсветки
      this.initializeHighlightLayers();
  
      // Создаем загрузочный экран и запускаем видео
      this.loadingScreen = new LoadingScreen();
        // === СЮДА ДОБАВИЛИ ПРОВЕРКУ skipVideo ===
      const params = new URLSearchParams(window.location.search);
      const skipVideo = params.get("skipVideo"); 
      // skipVideo будет строкой "true", если ?skipVideo=true. Иначе null.
  
      if (skipVideo === "true") {
        // Если переходим из BookScene — НЕ проигрываем видео
        console.log("Перешли из BookScene, пропускаем видео загрузки");
      } else {
        // Если прямой заход на /тестирование — проигрываем видео
        this.loadingScreen.playLoadingVideo();
      }
  
      // Запускаем основной цикл рендеринга
      this.runRenderLoop();
  
      // Запускаем загрузку и настройку сцены
      this.startSceneSetup();
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
  
    /**
     * Инициализация слоя подсветки.
     */
    private initializeHighlightLayers(): void {
      this.highlightLayer = new HighlightLayer("hl1", this.scene);
      this.highlightLayer.outerGlow = false;
    }
  
    /**
     * Основной метод настройки сцены:
     * - показываем LoadingUI,
     * - грузим модели (через ModelLoader),
     * - настраиваем взаимодействие (подсветка, клики),
     * - создаём GUI, диалоги,
     * - скрываем LoadingUI.
     */
    private async startSceneSetup(): Promise<void> {
      this.engine.displayLoadingUI();
      try {
        // Загружаем модели, необходимые для QuestionScene (уже добавлено в ModelLoader)
        await this.modelLoader.loadAllQuestionModels();
  
        // Настраиваем подсветку и клики по случайным мешам
        this.setupMeshesInteraction();
  
        // Создаём тексты для счётчиков (GUI)
        this.initializeGUI();
  
        // Настраиваем диалоговые страницы
        this.setupDialogPages();
  
        // Флаг: сцена загружена
        this.isSceneLoaded = true;
      } catch (error) {
        console.error("Ошибка при загрузке QuestionScene:", error);
      } finally {
        // Скрываем LoadingUI движка (вертушку в центре)
        this.engine.hideLoadingUI();
        // LoadingScreen (видео) сам удалится по окончании воспроизведения
      }
    }
  
    /**
     * Случайный выбор N мешей/групп из ModelLoader, подсветка и назначение клика.
     */
    private setupMeshesInteraction(): void {
      // Достаём меши карты, загруженные для QuestionScene
      // (Смотрите внутри ModelLoader: getQuestionMapMeshes() или getMeshes("map"))
      const questionMapMeshes = this.modelLoader.getQuestionMapMeshes() || [];
      if (questionMapMeshes.length === 0) {
        console.warn("В QuestionScene нет мешей (questionMap) после загрузки.");
        return;
      }
  
      // Массивы групп и одиночных мешей (добавлены в ModelLoader)
      const meshGroups = this.modelLoader.questionSceneMeshGroups;
      const singleMeshNames = this.modelLoader.questionSceneSingleMeshNames;
  
      // Формируем общий массив для дальнейшей рандомной выборки
      const allMeshes: { type: "group" | "single"; data: any }[] = [];
  
      meshGroups.forEach((g) => {
        allMeshes.push({ type: "group", data: g });
      });
      singleMeshNames.forEach((name) => {
        allMeshes.push({ type: "single", data: name });
      });
  
      // Функция для выбора N случайных элементов без повторений
      function getRandomElements(array: any[], n: number) {
        const result = [];
        const takenIndices = new Set<number>();
        while (result.length < n && result.length < array.length) {
          const index = Math.floor(Math.random() * array.length);
          if (!takenIndices.has(index)) {
            takenIndices.add(index);
            result.push(array[index]);
          }
        }
        return result;
      }
  
      // Допустим, выбираем 10
      const selected = allMeshes
      this.totalMeshes = selected.length; // Для счётчика
  
      // Обрабатываем каждый выбранный элемент
      selected.forEach((item) => {
        if (item.type === "group") {
          // Работа с группой
          const group = item.data; // { groupName, baseNames }
          // Фильтруем реальные меши, чьи имена начинаются на baseName
          const groupMeshes = questionMapMeshes.filter((mesh) =>
            group.baseNames.some((base: string) => mesh.name.startsWith(base))
          );
  
          if (groupMeshes.length > 0) {
            // Подсветка и обработка клика
            groupMeshes.forEach((mesh) => {
              this.highlightLayer.addMesh(mesh, Color3.Green());
              (mesh as any).isActive = true; // Флаг, что меш активен
  
              this.triggerManager.setupModalInteraction(mesh, () => {
                if (!(mesh as any).isActive) return;
                console.log(`Group "${group.groupName}" clicked!`);
                // Вызываем модалку, если прописан метод openModal
                if (this.openModal) {
                  this.openModal(group.groupName);
                }
              });
            });
          } else {
            console.warn(`Группа "${group.groupName}" не найдена в загруженных мешах.`);
          }
        } else {
          // Одиночный меш
          const meshName = item.data;
          const mesh = questionMapMeshes.find((m) => m.name === meshName);
          if (mesh) {
            this.highlightLayer.addMesh(mesh, Color3.Green());
            (mesh as any).isActive = true;
  
            this.triggerManager.setupModalInteraction(mesh, () => {
              if (!(mesh as any).isActive) return;
              console.log(`Single mesh "${meshName}" clicked!`);
              if (this.openModal) {
                this.openModal(meshName);
              }
            });
          } else {
            console.warn(`Одиночный меш "${meshName}" не найден среди questionMapMeshes.`);
          }
        }
      });
    }
  
    /**
     * Создание текстовых блоков для счётчиков (GUI).
     */
    private initializeGUI(): void {
      // Текст для "Найдено X из Y"
      this.counterText = new TextBlock();
      this.counterText.text = this.getCounterText();
      this.counterText.color = "#ffffff";
      this.counterText.fontSize = "3%";
      this.counterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      this.counterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.counterText.paddingLeft = "2%";
      this.counterText.paddingTop = "2%";
  
      // Текст для правильных ответов
      this.correctAnswersText = new TextBlock();
      this.correctAnswersText.text = `Правильные ответы: ${this.correctAnswers}`;
      this.correctAnswersText.color = "#ffffff";
      this.correctAnswersText.fontSize = "2.5%";
      this.correctAnswersText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.correctAnswersText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.correctAnswersText.paddingRight = "2%";
      this.correctAnswersText.paddingTop = "2%";
  
      // Текст для неправильных ответов
      this.incorrectAnswersText = new TextBlock();
      this.incorrectAnswersText.text = `Неправильные ответы: ${this.incorrectAnswers}`;
      this.incorrectAnswersText.color = "#ffffff";
      this.incorrectAnswersText.fontSize = "2.5%";
      this.incorrectAnswersText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      this.incorrectAnswersText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.incorrectAnswersText.paddingTop = "6%";
    }
  
    /**
     * Возвращает строку для счётчика "Найдено X из Y".
     */
    private getCounterText(): string {
      return `Найдено конструкций ${this.clickedMeshes} из ${this.totalMeshes}`;
    }
  
    /**
     * Обновляет текст счётчика найденных мешей.
     */
    private updateCounter(): void {
      this.counterText.text = this.getCounterText();
      // Если нужно, пробрасываем событие
      eventEmitter.emit("updateAnswers", this.counterText.text);
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
  
      // На второй странице отобразим счётчики
      const page2 = this.dialogPage.createTextGridPage("Статистика:", [
        this.counterText.text,
        this.correctAnswersText.text,
        this.incorrectAnswersText.text
      ]);
  
      this.guiManager.CreateDialogBox([page1, page2]);
    }
  
    /**
     * Публичный метод для инкремента счётчика правильных ответов.
     */
    public incrementCorrectAnswers(): void {
      this.correctAnswers++;
      this.correctAnswersText.text = `Правильные ответы: ${this.correctAnswers}`;
      eventEmitter.emit("updateCorrectAnswers", this.correctAnswersText.text);
      this.scene.render();
    }
  
    /**
     * Публичный метод для инкремента счётчика неправильных ответов.
     */
    public incrementIncorrectAnswers(): void {
      this.incorrectAnswers++;
      this.incorrectAnswersText.text = `Неправильные ответы: ${this.incorrectAnswers}`;
      eventEmitter.emit("updateIncorrectAnswers", this.incorrectAnswersText.text);
      this.scene.render();
    }
  
    /**
     * "Деактивируем" меш, когда пользователь ответил на вопрос (не даём кликать повторно).
     */
    public deactivateMesh(keyword: string): void {
      console.log(`Deactivating mesh with keyword: ${keyword}`);
  
      // Сначала пытаемся найти одиночный меш
      const mesh = this.scene.getMeshByName(keyword);
      if (mesh) {
        // Удаляем подсветку
        this.highlightLayer.removeMesh(mesh);
        (mesh as any).isActive = false;
        // Если есть actionManager — очищаем
        if (mesh.actionManager) {
          mesh.actionManager.actions = [];
        }
      } else {
        // Если не нашли меш, значит это может быть имя группы
        const group = this.modelLoader.questionSceneMeshGroups.find(
          (g) => g.groupName === keyword
        );
        if (group) {
          // Для всех мешей группы
          group.baseNames.forEach((base) => {
            this.scene.meshes.forEach((m) => {
              if (m.name.startsWith(base)) {
                this.highlightLayer.removeMesh(m);
                (m as any).isActive = false;
                if (m.actionManager) {
                  m.actionManager.actions = [];
                }
              }
            });
          });
        } else {
          console.warn(`Не нашли ни меш, ни группу: ${keyword}`);
        }
      }
  
      // Обновляем счётчик "Найдено X из Y"
      this.clickedMeshes++;
      this.updateCounter();
    }
  
    /**
     * Включение/выключение PointerLock (по аналогии с BookScene).
     */
    public togglePointerLock(): void {
      this.cameraController.togglePointerLock();
    }
  }
  
  
  
  