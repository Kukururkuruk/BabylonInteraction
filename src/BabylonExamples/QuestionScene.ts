
// import {
//   Scene,
//   Engine,
//   SceneLoader,
//   Vector3,
//   HemisphericLight,
//   HDRCubeTexture,
//   FreeCamera,
//   HighlightLayer,
//   Color3,
// } from "@babylonjs/core";
// import "@babylonjs/loaders";
// import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
// import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";

// export class QuestionScene {
//   scene: Scene;
//   engine: Engine;
//   canvas: HTMLCanvasElement;
//   camera: FreeCamera;
//   private guiTexture: AdvancedDynamicTexture;
//   private triggerManager: TriggerManager2;
//   openModal?: (keyword: string) => void;
//   private highlightLayer: HighlightLayer;

//   // Переменные для счетчиков
//   private clickedMeshes: number = 0;
//   private totalMeshes: number = 0;
//   private correctAnswers: number = 0;
//   private counterText: TextBlock;
//   private correctAnswersText: TextBlock;

//   constructor(canvas: HTMLCanvasElement) {
//     this.canvas = canvas;
//     this.engine = new Engine(this.canvas, true);
//     this.engine.displayLoadingUI();

//     this.scene = this.CreateScene();
//     this.highlightLayer = new HighlightLayer("hl1", this.scene);

//     this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
//     this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);

//     this.CreateEnvironment().then(() => {
//       this.engine.hideLoadingUI();
//     });
//     this.CreateController();
//     this.CreateGUI(); // Вызов нового метода для создания GUI

//     this.engine.runRenderLoop(() => {
//       this.scene.render();
//     });
//   }

//   CreateScene(): Scene {
//     const scene = new Scene(this.engine);
//     new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

//     const framesPerSecond = 60;
//     const gravity = -9.81;
//     scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//     scene.collisionsEnabled = true;

//     const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);

//     scene.environmentTexture = hdrTexture;
//     scene.createDefaultSkybox(hdrTexture, true);
//     scene.environmentIntensity = 0.5;

//     return scene;
//   }

//   CreateController(): void {
//     // Установка начальной позиции камеры для лучшей видимости
//     this.camera = new FreeCamera("camera", new Vector3(0, 5, -10), this.scene);
//     this.camera.attachControl(this.canvas, true);

//     this.camera.applyGravity = true;
//     this.camera.checkCollisions = true;
//     this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
//     this.camera.minZ = 0.45;
//     this.camera.speed = 0.55;
//     this.camera.angularSensibility = 4000;
//     this.camera.keysUp.push(87); // W
//     this.camera.keysLeft.push(65); // A
//     this.camera.keysDown.push(83); // S
//     this.camera.keysRight.push(68); // D
//   }

//   async CreateEnvironment(): Promise<void> {
//     try {
//       this.engine.displayLoadingUI();

//       const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);

//       // Включаем коллизии для всех мешей
//       map.forEach((mesh) => {
//         mesh.checkCollisions = true;
//       });

//       // Определение группированных мешей и одиночных мешей
//       const meshGroups = [
//         // Первая группа: SpanStructureBeam_L_5
//         {
//           groupName: "SpanStructureBeam_L_5",
//           baseName: "SM_0_SpanStructureBeam_L_5",
//         },
//         // Вторая группа: SpanStructureBeam_L_4
//         {
//           groupName: "SpanStructureBeam_L_4",
//           baseName: "SM_0_SpanStructureBeam_L_4",
//         },
//         // Третья группа: Retaining_wall_Block_LP_L_5
//         {
//           groupName: "Retaining_wall_Block_LP_L_5",
//           baseName: "SM_0_Retaining_wall_Block_LP_L_5",
//         },
//       ];

//       // Определение одиночных мешей с точными именами
//       const singleMeshNames = [
//         // Колонна монолит
//         "SM_0_MonolithicRack_R",
//         // Колонна
//         "SM_0_MonolithicRack_L_Column",
//         // Колонна ростверк основание
//         "SM_0_MonolithicRack_L_Rostverc",
//         // Колонна ригель вверх
//         "SM_0_MonolithicRack_L_Support",
//         // Лестница
//         "SM_0_Stairs",
//         // Барьерное ограждение что
//         "SM_0_FencePostBridge_base_.002",
//         // Барьерное ограждение зачем
//         "SM_0_FencePost_Road.002",
//         // Барьерное ограждение тип
//         "SM_0_FencePostBridge_base_.004",
//         // Барьер стойка
//         "SM_FenctRack_LP",
//         // Барьер баока
//         "SM_FenceWave_LP_1",
//         // Барьер соединение
//         "SM_FenceConsole_LP",
//         // Шов что
//         "SM_0_connectingShaft_1",
//         // Шов тип
//         "SM_0_connectingShaft_2",
//         // Дорожное полотно
//         "SM_0_Road_Down.001",
//         // Насыпь
//         "SM_0_Landscape_2.002",
//         // Асфальт на мосту
//         "SM_0_BridgeAsfalt",
//         //Кирпич
//         "SM_0_Retaining_wall_Block_LP_R_5",
//         //Подферменник
//         "SM_0_Stand_R",
//         //Ограждение на дороге
//         "SM_0_FencePost_Road.001"
//         // Добавьте остальные одиночные меши здесь
//       ];

//       // Общее количество взаимодействий (группы + одиночные меши)
//       this.totalMeshes = meshGroups.length + singleMeshNames.length;

//       // Обработка группированных мешей
//       meshGroups.forEach((group) => {
//         // Найти все меши в группе по базовому имени
//         const groupMeshes = map.filter(
//           (mesh) => mesh.name === group.baseName || mesh.name.startsWith(`${group.baseName}.`)
//         );

//         if (groupMeshes.length > 0) {
//           // Добавляем подсветку и устанавливаем флаг активности для всех мешей в группе
//           groupMeshes.forEach((mesh) => {
//             this.highlightLayer.addMesh(mesh, Color3.Green());
//             (mesh as any).isActive = true;
//           });

//           // Настраиваем взаимодействие для всех мешей в группе
//           groupMeshes.forEach((mesh) => {
//             this.triggerManager.setupModalInteraction(mesh, () => {
//               if (!(mesh as any).isActive) {
//                 // Если меш уже не активен, ничего не делаем
//                 return;
//               }

//               console.log(`${group.groupName} right-clicked!`);

//               if (this.openModal) {
//                 // Открываем модальное окно с именем группы
//                 const keyword = group.groupName
//                 this.openModal(keyword);
//                 console.log(keyword);
                
//               }

//               // Увеличиваем счетчик кликов
//               this.clickedMeshes++;
//               this.updateCounter();

//               // Отключаем подсветку и деактивируем все меши в группе
//               groupMeshes.forEach((m) => {
//                 this.highlightLayer.removeMesh(m);
//                 (m as any).isActive = false;

//                 // Удаляем все действия, связанные с кликами
//                 if (m.actionManager) {
//                   m.actionManager.actions = [];
//                 }
//               });

//               // Увеличиваем счетчик правильных ответов (если применимо)
//               this.incrementCorrectAnswers();
//             });
//           });
//         } else {
//           console.warn(`Группа "${group.groupName}" не найдена.`);
//         }
//       });

//       // Обработка одиночных мешей
//       singleMeshNames.forEach((keyword) => {
//         const mesh = map.find((m) => m.name === keyword);

//         if (mesh) {
//           // Добавляем подсветку и устанавливаем флаг активности
//           this.highlightLayer.addMesh(mesh, Color3.Green());
//           (mesh as any).isActive = true;

//           // Настраиваем взаимодействие
//           this.triggerManager.setupModalInteraction(mesh, () => {
//             if (!(mesh as any).isActive) {
//               return;
//             }

//             console.log(`${keyword} right-clicked!`);

//             if (this.openModal) {
//               // Открываем модальное окно с именем меша
//               this.openModal(keyword);
//             }

//             // Увеличиваем счетчик кликов
//             this.clickedMeshes++;
//             this.updateCounter();

//             // Отключаем подсветку и деактивируем меш
//             this.highlightLayer.removeMesh(mesh);
//             (mesh as any).isActive = false;

//             // Удаляем все действия, связанные с кликами
//             if (mesh.actionManager) {
//               mesh.actionManager.actions = [];
//             }

//             // Увеличиваем счетчик правильных ответов (если применимо)
//             this.incrementCorrectAnswers();
//           });
//         } else {
//           console.warn(`Меш с именем "${keyword}" не найден.`);
//         }
//       });

//       console.log("Модели успешно загружены.");
//     } catch (error) {
//       console.error("Ошибка при загрузке моделей:", error);
//     } finally {
//       this.engine.hideLoadingUI();
//     }
//   }

//   // Новый метод для создания GUI
//   private CreateGUI(): void {
//     // Создаем текст для отображения счетчика кликов
//     this.counterText = new TextBlock();
//     this.counterText.text = `${this.clickedMeshes} из ${this.totalMeshes}`;
//     this.counterText.color = "white";
//     this.counterText.fontSize = 24;
//     this.counterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
//     this.counterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//     this.counterText.paddingLeft = "20px";
//     this.counterText.paddingTop = "20px";
//     this.guiTexture.addControl(this.counterText);

//     // Создаем текст для отображения счетчика правильных ответов
//     this.correctAnswersText = new TextBlock();
//     this.correctAnswersText.text = `Правильные ответы: ${this.correctAnswers}`;
//     this.correctAnswersText.color = "white";
//     this.correctAnswersText.fontSize = 24;
//     this.correctAnswersText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
//     this.correctAnswersText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//     this.correctAnswersText.paddingRight = "20px";
//     this.correctAnswersText.paddingTop = "20px";
//     this.guiTexture.addControl(this.correctAnswersText);

//     console.log('correctAnswersText initialized:', this.correctAnswersText);
//   }

//   // Метод для обновления счетчика кликов
//   private updateCounter(): void {
//     this.counterText.text = `${this.clickedMeshes} из ${this.totalMeshes}`;
//   }

//   // Публичный метод для обновления счетчика правильных ответов
//   public incrementCorrectAnswers(): void {
//     this.correctAnswers++;
//     console.log('Before updating text:', this.correctAnswersText.text);
//     this.correctAnswersText.text = `Правильные ответы: ${this.correctAnswers}`;
//     console.log('After updating text:', this.correctAnswersText.text);
//     this.scene.render();
//   }
// }





import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  HighlightLayer,
  Color3,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";

export class QuestionScene {
  scene: Scene;
  engine: Engine;
  canvas: HTMLCanvasElement;
  camera: FreeCamera;
  private guiTexture: AdvancedDynamicTexture;
  private triggerManager: TriggerManager2;
  openModal?: (keyword: string) => void;
  private highlightLayer: HighlightLayer;

  // Переменные для счетчиков
  private clickedMeshes: number = 0;
  private totalMeshes: number = 0;
  private correctAnswers: number = 0;
  private incorrectAnswers: number = 0; // Добавили счетчик неправильных ответов
  private counterText: TextBlock;
  private correctAnswersText: TextBlock;
  private incorrectAnswersText: TextBlock; // Текстовый блок для неправильных ответов

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggerManager2(
      this.scene,
      this.canvas,
      this.guiTexture
    );

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
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

    const hdrTexture = new HDRCubeTexture(
      "/models/cape_hill_4k.hdr",
      scene,
      512
    );

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    // Установка начальной позиции камеры для лучшей видимости
    this.camera = new FreeCamera("camera", new Vector3(0, 5, -10), this.scene);
    this.camera.attachControl(this.canvas, true);

    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.angularSensibility = 4000;
    this.camera.keysUp.push(87); // W
    this.camera.keysLeft.push(65); // A
    this.camera.keysDown.push(83); // S
    this.camera.keysRight.push(68); // D
  }

  async CreateEnvironment(): Promise<void> {
    try {
      this.engine.displayLoadingUI();

      const { meshes: map } = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Map_1.gltf",
        this.scene
      );

      // Включаем коллизии для всех мешей
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      // Определение группированных мешей
      const meshGroups = [
        // Первая группа
        {
          groupName: "SpanStructureBeam_L_5",
          baseName: "SM_0_SpanStructureBeam_L_5",
        },
        // Вторая группа
        {
          groupName: "SpanStructureBeam_L_4",
          baseName: "SM_0_SpanStructureBeam_L_4",
        },
        // Третья группа
        {
          groupName: "Retaining_wall_Block_LP_L_5",
          baseName: "SM_0_Retaining_wall_Block_LP_L_5",
        },
        // Добавьте дополнительные группы по необходимости
      ];

      // Определение одиночных мешей с точными именами
      const singleMeshNames = [
        // Колонна монолит
        "SM_0_MonolithicRack_R",
        // Колонна
        "SM_0_MonolithicRack_L_Column",
        // Колонна ростверк основание
        "SM_0_MonolithicRack_L_Rostverc",
        // Колонна ригель вверх
        "SM_0_MonolithicRack_L_Support",
        // Лестница
        "SM_0_Stairs",
        // Барьерное ограждение что
        "SM_0_FencePostBridge_base_.002",
        // Барьерное ограждение зачем
        "SM_0_FencePost_Road.002",
        // Барьерное ограждение тип
        "SM_0_FencePostBridge_base_.004",
        // Барьер стойка
        "SM_FenctRack_LP",
        // Барьер балка
        "SM_FenceWave_LP_1",
        // Барьер соединение
        "SM_FenceConsole_LP",
        // Шов что
        "SM_0_connectingShaft_1",
        // Шов тип
        "SM_0_connectingShaft_2",
        // Дорожное полотно
        "SM_0_Road_Down.001",
        // Насыпь
        "SM_0_Landscape_2.002",
        // Асфальт на мосту
        "SM_0_BridgeAsfalt",
        // Кирпич
        "SM_0_Retaining_wall_Block_LP_R_5",
        // Подферменник
        "SM_0_Stand_R",
        // Ограждение на дороге
        "SM_0_FencePost_Road.001",
        // Добавьте остальные одиночные меши по необходимости
      ];

      // Объединяем меши и группы в один список
      const allMeshes = [
        ...meshGroups.map((group) => ({ type: "group", data: group })),
        ...singleMeshNames.map((name) => ({ type: "single", data: name })),
      ];

      // Функция для выбора N случайных элементов из массива без повторений
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

      // Выбираем 10 случайных элементов
      const selectedMeshes = getRandomElements(allMeshes, 10);

      // Обновляем общее количество мешей для взаимодействия
      this.totalMeshes = selectedMeshes.length;

      // Создаем GUI после установки totalMeshes
      this.CreateGUI();

      // Обновляем счетчик
      this.updateCounter();

      // Обрабатываем выбранные меши
      selectedMeshes.forEach((item) => {
        if (item.type === "group") {
          const group = item.data;
          // Обработка группы
          const groupMeshes = map.filter(
            (mesh) =>
              mesh.name === group.baseName ||
              mesh.name.startsWith(`${group.baseName}.`)
          );

          if (groupMeshes.length > 0) {
            groupMeshes.forEach((mesh) => {
              this.highlightLayer.addMesh(mesh, Color3.Green());
              (mesh as any).isActive = true;
            });

            groupMeshes.forEach((mesh) => {
              this.triggerManager.setupModalInteraction(mesh, () => {
                if (!(mesh as any).isActive) {
                  return;
                }

                console.log(`${group.groupName} clicked!`);

                if (this.openModal) {
                  const keyword = group.groupName;
                  this.openModal(keyword);
                }
              });
            });
          } else {
            console.warn(`Группа "${group.groupName}" не найдена.`);
          }
        } else if (item.type === "single") {
          const keyword = item.data;
          const mesh = map.find((m) => m.name === keyword);

          if (mesh) {
            this.highlightLayer.addMesh(mesh, Color3.Green());
            (mesh as any).isActive = true;

            this.triggerManager.setupModalInteraction(mesh, () => {
              if (!(mesh as any).isActive) {
                return;
              }

              console.log(`${keyword} clicked!`);

              if (this.openModal) {
                this.openModal(keyword);
              }
            });
          } else {
            console.warn(`Меш с именем "${keyword}" не найден.`);
          }
        }
      });

      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    } finally {
      this.engine.hideLoadingUI();
    }
  }

  // Метод для создания GUI
  private CreateGUI(): void {
    // Создаем текст для отображения счетчика кликов
    this.counterText = new TextBlock();
    this.counterText.text = `${this.clickedMeshes} из ${this.totalMeshes}`;
    this.counterText.color = "white";
    this.counterText.fontSize = 24;
    this.counterText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.counterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.counterText.paddingLeft = "20px";
    this.counterText.paddingTop = "20px";
    this.guiTexture.addControl(this.counterText);

    // Создаем текст для отображения счетчика правильных ответов
    this.correctAnswersText = new TextBlock();
    this.correctAnswersText.text = `Правильные ответы: ${this.correctAnswers}`;
    this.correctAnswersText.color = "white";
    this.correctAnswersText.fontSize = 24;
    this.correctAnswersText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.correctAnswersText.textVerticalAlignment =
      Control.VERTICAL_ALIGNMENT_TOP;
    this.correctAnswersText.paddingRight = "20px";
    this.correctAnswersText.paddingTop = "20px";
    this.guiTexture.addControl(this.correctAnswersText);

    // Создаем текст для отображения счетчика неправильных ответов
    this.incorrectAnswersText = new TextBlock();
    this.incorrectAnswersText.text = `Неправильные ответы: ${this.incorrectAnswers}`;
    this.incorrectAnswersText.color = "white";
    this.incorrectAnswersText.fontSize = 24;
    this.incorrectAnswersText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.incorrectAnswersText.textVerticalAlignment =
      Control.VERTICAL_ALIGNMENT_TOP;
    this.incorrectAnswersText.paddingTop = "50px";
    this.guiTexture.addControl(this.incorrectAnswersText);

    console.log(
      "correctAnswersText initialized:",
      this.correctAnswersText.text
    );
    console.log(
      "incorrectAnswersText initialized:",
      this.incorrectAnswersText.text
    );
  }

  // Метод для обновления счетчика кликов
  private updateCounter(): void {
    this.counterText.text = `${this.clickedMeshes} из ${this.totalMeshes}`;
  }

  // Публичный метод для обновления счетчика правильных ответов
  public incrementCorrectAnswers(): void {
    this.correctAnswers++;
    console.log("Before updating text:", this.correctAnswersText.text);
    this.correctAnswersText.text = `Правильные ответы: ${this.correctAnswers}`;
    console.log("After updating text:", this.correctAnswersText.text);
    this.scene.render();
  }

  // Публичный метод для обновления счетчика неправильных ответов
  public incrementIncorrectAnswers(): void {
    this.incorrectAnswers++;
    this.incorrectAnswersText.text = `Неправильные ответы: ${this.incorrectAnswers}`;
    this.scene.render();
  }

  // Метод для деактивации мешей после ответа
  public deactivateMesh(keyword: string): void {
    console.log(`Deactivating mesh with keyword: ${keyword}`);

    // Ищем меш по имени
    const mesh = this.scene.getMeshByName(keyword);
    if (mesh) {
      this.highlightLayer.removeMesh(mesh);
      (mesh as any).isActive = false;
      if (mesh.actionManager) {
        mesh.actionManager.actions = [];
      }
    } else {
      // Если меш не найден, предполагаем, что это группа
      const groupMeshes = this.scene.meshes.filter(
        (mesh) =>
          mesh.name === keyword || mesh.name.startsWith(`${keyword}.`)
      );
      groupMeshes.forEach((m) => {
        this.highlightLayer.removeMesh(m);
        (m as any).isActive = false;
        if (m.actionManager) {
          m.actionManager.actions = [];
        }
      });
    }

    // Увеличиваем счетчик кликов и обновляем GUI
    this.clickedMeshes++;
    this.updateCounter();
  }
}









