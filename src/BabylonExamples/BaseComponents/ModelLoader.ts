// ModelLoader.ts
import { Scene, AbstractMesh, SceneLoader, Mesh, Vector3, FreeCamera, ISceneLoaderAsyncResult, DynamicTexture, StandardMaterial, Color3, MeshBuilder } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Grid, Rectangle, TextBlock } from "@babylonjs/gui";
import eventEmitter from "../../../EventEmitter";

export class ModelLoader {
  private scene: Scene;
  private loadedMeshes: { [key: string]: AbstractMesh[] } = {};
  private textBlocks: TextBlock[] = [];

  // Массивы с определёнными мешами
  private nonCollisionMeshNames: string[] = [
    "SM_ConcreteFence_LP.015",
    "SM_ConcreteFence_LP.030",
    "SM_0_FencePost_Road.016",
    "SM_0_FencePost_Road.020",
  ];

  private brokenMeshSubstring: string = "broken";

    // Одиночные меши, характерные для QuestionScene
    public questionSceneSingleMeshNames = [
      // Стена
      "SM_0_Retaining_wall_Block_LP_L",
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
      "SM_0_Road_Down",
      // Насыпь
      "SM_0_Landscape_R",
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

    public questionSceneMeshGroups = [
      // Пример
      { groupName: "SpanStructureBeam_L_4", baseNames: ["SM_0_SpanStructureBeam_L_4"] },
      { groupName: "SpanStructureBeam_L_5", baseNames: ["SM_0_SpanStructureBeam_L_5"] },
      // ... добавьте все остальные
    ];

  public meshGroups = [
    { groupName: "SpanStructureBeam_L_4", baseNames: ["SM_0_SpanStructureBeam_L_7"] },
    { groupName: "SpanStructureBeam_L_7", baseNames: ["SM_0_SpanStructureBeam_L_1","SM_0_SpanStructureBeam_L_2","SM_0_SpanStructureBeam_L_3","SM_0_SpanStructureBeam_L_4","SM_0_SpanStructureBeam_L_5","SM_0_SpanStructureBeam_L_6","SM_0_SpanStructureBeam_R",] },
    { groupName: "Drain_UP_2",           baseNames: ["SM_Drain_UP_2"] },
    { groupName: "Drain_Down_2",         baseNames: ["SM_Drain_Down_2"] },
    { groupName: "Drain_2",             baseNames: ["SM_Drain_2"] },
    // А вот пример, где мы явно кладём несколько разных мешей в одну группу
    { 
      groupName: "WaterPipes", 
      baseNames: [
        "SM_PipeWater_LP", 
        "SM_PipeWaterCollection_LP", 
        "SM_HalfPipe_LP_1"
      ] 
    },
  ];

  public singleMeshNames = [
    "SM_0_Retaining_wall_Block_LP_L",   // Стена
    "SM_0_MonolithicRack_R",            // Колонна монолит
    "SM_0_MonolithicRack_L_Column",     // Колонна
    "SM_0_MonolithicRack_L_Rostverc",   // Колонна ростверк основание
    "SM_0_MonolithicRack_L_Support",    // Колонна ригель вверх
    "SM_0_Stairs",                      // Лестница
    "SM_0_FencePost_Road.002",          // Барьерное ограждение (тип 1)
    "SM_0_FencePostBridge_base_.004",   // Барьерное ограждение (тип 2)
    "SM_0_connectingShaft_1",           // Шов
    "SM_0_Road_Down",               // Дорожное полотно
    "SM_0_BridgeAsfalt",                // Асфальт на мосту
    "SM_0_Stand_R",                     // Подферменник
    "SM_0_Road_1_R",                    // Дорога сверху
    "SM_ConcreteFence_LP.002",          // Бетонное ограждение по центру (Нью-Джерси)
    "SM_0_TransitionPlate8M_LP_L_primitive0", // Плита переходная
    "SM_0_PlotMonolithic",              // Плита над балками
    "SM_0_SupportLight_LP_Down_L",      // Фонари
    "SM_HalfPipe_LP",                   // Подвесной лоток
    "SM_Drain_Half_Pipe_2",        // Откосной лоток
    "SM_GridDrainageSmall_LP",          // Дождеприемник
    // Добавьте дополнительные одиночные меши по необходимости

          // "SM_0_SpanStructureBeam_1_Armature_R",
          // "SM_0_SpanStructureBeam_1_Cable_R",
          // "SM_0_SpanStructureBeam_2_Armature_L",
          // "SM_0_SpanStructureBeam_2_Cable_L"
  ];

  public textBlock1: TextBlock | null = null; // Добавляем в класс
  public textBlock2: TextBlock | null = null; // Добавляем в класс
  public textBlock3: TextBlock | null = null; // Добавляем в класс

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public async loadAllQuestionModels(): Promise<void> {
    // Пример: загружаем карту "Map_1_MOD.gltf" (как в вашем коде для QuestionScene)
    await this.loadMapModelForQuestion();

    // После загрузки настраиваем меши (коллизии, скрыть "broken" и т.д.)
    this.setupQuestionSceneMeshes();
  }

  private async loadMapModelForQuestion(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        // ИМЯ ФАЙЛА, соответствующее QuestionScene:
        "Map_1_MOD_V_7.gltf",
        this.scene
      );
      this.loadedMeshes["questionMap"] = result.meshes; 
      // ключ "questionMap" — чтобы отличать от "map", используемого в BookScene, 
      // если это разные файлы.
    } catch (error) {
      console.error("Ошибка при загрузке модели карты для QuestionScene:", error);
      throw error;
    }
  }

  /**
   * Настройки мешей для QuestionScene: включаем/отключаем коллизии,
   * скрываем "broken", и т.д.
   */
  private setupQuestionSceneMeshes(): void {
    const questionMapMeshes = this.loadedMeshes["questionMap"];
    if (!questionMapMeshes) {
      console.warn("Меши для QuestionScene не найдены (questionMap).");
      return;
    }

    // Включаем коллизии для всех
    questionMapMeshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    const transitionMeshes = questionMapMeshes.filter((mesh) =>
      mesh.name.includes("TransitionPlate8M")
    );
    if (transitionMeshes) {
      transitionMeshes.forEach((mesh) => {
        mesh.checkCollisions = false;
      });
    } else {
      console.warn(`Меш с именем "${transitionMeshes}" не найден для отключения коллизий.`);
    }

    // Отключаем коллизии для некоторых
    this.nonCollisionMeshNames.forEach((name) => {
      const mesh = this.scene.getMeshByName(name);
      if (mesh) {
        mesh.checkCollisions = false;
        mesh.visibility = 0.5;
      } else {
        console.warn(`(QuestionScene) Меш "${name}" не найден для отключения коллизий.`);
      }
    });

    // Скрываем "сломанные" меши
    const brokenMeshes = questionMapMeshes.filter((mesh) =>
      mesh.name.toLowerCase().includes(this.brokenMeshSubstring)
    );
    brokenMeshes.forEach((mesh) => {
      mesh.visibility = 0;
    });
  }

  /**
   * Метод для получения мешей, соответствующих *QuestionScene* (карта).
   * Возвращает массив `AbstractMesh[]` или `undefined`.
   */
  public getQuestionMapMeshes(): AbstractMesh[] | undefined {
    return this.loadedMeshes["questionMap"];
  }

  // Метод для загрузки всех моделей
  public async loadAllModels(): Promise<void> {
    await this.loadMapModel();
    await this.loadSignModel();
    this.setupMeshes();
  }

  public async loadBridge(hide = true): Promise<void> {
    await this.loadMapModel();
    this.setupMeshes(hide);
  }

  private async loadMapModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Map_1_MOD_V_7.gltf",
        this.scene
      );
      this.loadedMeshes["map"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели карты:", error);
      throw error;
    }
  }

  public async loadMLabModel(): Promise<void> {
    try {
      console.log("Загрузка модели лаборатории...");
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Laboratory_MOD_4.gltf",
        this.scene
      );

      // Сохраняем загруженные меши
      this.loadedMeshes["lab"] = result.meshes;

      // Включаем столкновения для каждого меша
      result.meshes.forEach(mesh => {
        if (mesh instanceof Mesh) {
          mesh.checkCollisions = true;
        }

        // Переопределение точки вращения (pivot) для модели SM_Door
        if (mesh.name === "SM_Door") {
          mesh.position.y = 0; // Установить модель на плоскость
          mesh.rotationQuaternion = null; // Очистить кватернион поворота
        }
      });
    } catch (error) {
      console.error("Ошибка при загрузке модели карты:", error);
      throw error;
    }
  }

  private async loadSignModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "MapPointerSimplev001.glb",
        this.scene
      );
      this.loadedMeshes["sign"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели указателя:", error);
      throw error;
    }
  }


  public async loadRangeCentrModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Rangefinder.gltf",
        this.scene
      );
      this.loadedMeshes["rangeC"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели карты:", error);
      throw error;
    }
  }
  public async loadUltraCentrModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "UltrasonicTester.gltf",
        this.scene
      );
      this.loadedMeshes["ultraC"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели карты:", error);
      throw error;
    }
  }

  public async loadRangeModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Rangefinder_LP.gltf",
        this.scene
      );
      this.loadedMeshes["range"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели карты:", error);
      throw error;
    }
  }

  public async addGUIRange(camera: FreeCamera, rangefinderMeshes: AbstractMesh[]): Promise<void> {

    rangefinderMeshes.forEach((mesh) => {
      // Отзеркаливание по оси Z и масштабирование
      mesh.scaling = new Vector3(2, 2, -2); // Масштабируем в 3 раза и отражаем по Z
      mesh.rotation.y = Math.PI / 2;
      mesh.rotation.z = 0.4;

      // Закрепление модели за камерой
      mesh.parent = camera;

      // Установка позиции относительно камеры
      const offset = new Vector3(0, -0.4, 0.6); // Настройте значения по необходимости
      mesh.position = offset;
  });

  const thirdMesh = rangefinderMeshes[2];

  // Получение размеров меша
  const boundingInfo = thirdMesh.getBoundingInfo();
  const boundingBox = boundingInfo.boundingBox;
  const size = boundingBox.maximum.subtract(boundingBox.minimum);
  const width = size.z;
  const height = size.y;

  // Определение размеров плоскости
  const planeWidth = width; // Ширина плоскости равна ширине меша
  const planeHeight = height; // Высота плоскости — 20% от высоты меша (можно настроить по необходимости)

  // Создание DynamicTexture с достаточным разрешением
  const dynamicTexture = new DynamicTexture("DynamicTexture", { width: 1024, height: 512 }, this.scene, false);
  dynamicTexture.hasAlpha = true;

  // Установка шрифта перед измерением текста
  const font = "bold 90px Arial";
  const ctx = dynamicTexture.getContext();
  ctx.font = font;

  // Определение максимальной ширины текста с учётом отступов
  const maxTextWidth = dynamicTexture.getSize().width - 100; // 50 пикселей отступа с каждой стороны

  // Функция для разбиения текста на строки с учётом символов \n и ширины
  function wrapText(context, text, maxWidth) {
      const lines = [];
      const paragraphs = text.split('\n');

      paragraphs.forEach(paragraph => {
          const words = paragraph.split(' ');
          let currentLine = '';

          words.forEach(word => {
              const testLine = currentLine + word + ' ';
              const metrics = context.measureText(testLine);
              const testWidth = metrics.width;

              if (testWidth > maxWidth && currentLine !== '') {
                  lines.push(currentLine.trim());
                  currentLine = word + ' ';
              } else {
                  currentLine = testLine;
              }
          });

          lines.push(currentLine.trim());
      });

      return lines;
  }

  // Функция для обновления текста с переносом
  function updateDynamicText(newText) {
      ctx.clearRect(0, 0, dynamicTexture.getSize().width, dynamicTexture.getSize().height);

      // Устанавливаем шрифт
      ctx.font = font;

      // Разбиваем текст на строки с учетом \n и ширины
      const lines = wrapText(ctx, newText, maxTextWidth);

      // Рисуем каждую строку с увеличивающимся смещением по Y
      const lineHeight = 90; // Можно настроить в зависимости от шрифта
      lines.forEach((line, index) => {
          ctx.fillStyle = "white"; // Цвет текста
          ctx.fillText(line, 50, 100 + index * lineHeight); // 50 и 100 - отступы от левого и верхнего края
      });

      // Обновляем текстуру
      dynamicTexture.update();
  }

  eventEmitter.on("updateDistanceAngleText", (newText) => {
    if (dynamicTexture) {
        updateDynamicText(newText);
    }
});

  // Создание материала для текста
  const textMaterial = new StandardMaterial("TextMaterial", this.scene);
  textMaterial.diffuseTexture = dynamicTexture;
  textMaterial.emissiveColor = new Color3(1, 1, 1); // Делает текст ярким
  textMaterial.backFaceCulling = false; // Текст виден с обеих сторон

  // Создание плоскости для текста
  const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth, height: planeHeight }, this.scene);
  textPlane.material = textMaterial;

  // Позиционируем плоскость относительно меша
  textPlane.parent = thirdMesh;
  textPlane.rotation.y = -Math.PI / 2;

  // Компенсируем отражение родителя по оси Z
  textPlane.scaling = new Vector3(-1, 1, 1);

  // Устанавливаем позицию
  textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0); //
  }



  public async loadUltraModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "UltrasonicTester_FR_LP.gltf",
        this.scene
      );
      this.loadedMeshes["ultra"] = result.meshes;

    } catch (error) {
      console.error("Ошибка при загрузке UltrasonicTester_FR_LP.glb:", error);
      throw error;
    }
  }
  
  public async loadUltranModel(camera: FreeCamera): Promise<void> {
    try {
      const meshes = this.loadedMeshes["ultra"];
      if (!meshes || meshes.length === 0) {
        console.error("Модель UltrasonicTester_FR_LP.glb не загружена или содержит пустые меши.");
        return;
      }
  
      // Настройка мешей первой модели
      meshes.forEach((mesh) => {
        mesh.scaling = new Vector3(0.04, 0.04, 0.04);
        mesh.parent = camera;
        mesh.rotation = new Vector3(Math.PI / 2, Math.PI, Math.PI / 6);
        const offset = new Vector3(-0.55, -0.5, 0.86);
        mesh.position = offset;
      });
  
      // Инверсия масштабирования для второго меша, если он существует
      if (meshes.length > 1) {
        meshes[1].scaling.x = -0.04;
      }
  
      // Добавление GUI к третьему мешу, если он существует
      if (meshes.length >= 3) {
        const texts = ["", "", "", ""];
        this.addGUIToTool(meshes[2], texts);
      } else {
        console.warn("meshes[2] не существует. GUI не добавлен.");
      }
  
      console.log("UltrasonicTester_FR_LP.glb meshes настроены:", meshes);
  
      // Загрузка и настройка второй модели
      await this.loadSMTiltSignModel(meshes[2]);
  
      console.log("UltrasonicTester_FR_LP.glb и SM_Tilt_sign_LP.glb успешно настроены.");
    } catch (error) {
      console.error("Ошибка при настройке UltrasonicTester_FR_LP.glb:", error);
      throw error;
    }
  }
  
  private async loadSMTiltSignModel(parentMesh: AbstractMesh): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "SM_Tilt_sign_LP.glb",
        this.scene
      );
  
      console.log("SM_Tilt_sign_LP.glb meshes успешно загружен:", result.meshes);
  
      result.meshes.forEach((mesh) => {
        mesh.scaling = new Vector3(0.5, 0.5, 0.5);
        mesh.parent = parentMesh;
        mesh.position = new Vector3(0, 6.5, -10.22);
        mesh.rotation = new Vector3(0, Math.PI, 0); // Начальное вращение
      });
  
      if (result.meshes.length > 1) {
        result.meshes[1].isVisible = false;
      } else {
        console.warn("SM_Tilt_sign_LP.glb содержит недостаточно мешей для скрытия.");
      }
  
      // Сохранение мешей второй модели под отдельным ключом
      this.loadedMeshes["image"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке SM_Tilt_sign_LP.glb:", error);
      throw error;
    }
  }


  // Добавьте новые методы для штангенциркуля, линейки и рулетки
public async loadCaliperModel(): Promise<void> {
  try {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "SM_Caliper.gltf",
      this.scene
    );
    this.loadedMeshes["caliper"] = result.meshes;
  } catch (error) {
    console.error("Ошибка при загрузке SM_Caliper.gltf:", error);
    throw error;
  }
}

public async loadRulerModel(): Promise<void> {
  try {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "SM_Ruler_LP.gltf",
      this.scene
    );
    this.loadedMeshes["ruler"] = result.meshes;
  } catch (error) {
    console.error("Ошибка при загрузке SM_Ruler_LP.gltf:", error);
    throw error;
  }
}

public async loadTapeMeasureModel(): Promise<void> {
  try {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "SM_TapeMeasure_LP_MOD_1.gltf",
      this.scene
    );
    this.loadedMeshes["tape"] = result.meshes;
  } catch (error) {
    console.error("Ошибка при загрузке SM_TapeMeasure_LP_MOD_1.gltf:", error);
    throw error;
  }
}

  
  public async loadTestCubeModel(): Promise<void> { 
    try {
        // Загрузка модели TestCube.gltf
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "TestCube.gltf",
            this.scene
        );

        // Сохранение загруженных мешей
        this.loadedMeshes["TestCube"] = result.meshes;

        // Настройка мешей модели TestCube
        const meshes = this.loadedMeshes["TestCube"];
        if (meshes.length === 0) {
            console.error("TestCube.gltf не содержит мешей.");
            return;
        }

        // Применение масштабирования и позиции
        meshes.forEach((mesh) => {
            mesh.isVisible = true;
            mesh.scaling = new Vector3(0.1, 0.1, 0.1);
            const offset = new Vector3(-0.55, -0.5, 0.86);
            mesh.position = offset;
            mesh.rotation = new Vector3(Math.PI / 2, Math.PI, Math.PI / 6);
        });

        console.log("TestCube.gltf успешно загружен и настроен:", meshes);
    } catch (error) {
        console.error("Ошибка при загрузке TestCube.gltf", error);
        throw error;
    }
}
  

addGUIToTool(mesh, texts): void {
  if (!mesh) {
      console.error("Меш не существует. GUI не может быть добавлен.");
      return;
  }

  try {
      const guiPlane = mesh.clone("guiPlane");
      guiPlane.scaling.x = -0.04;

      const guiTexture = AdvancedDynamicTexture.CreateForMesh(mesh, 512, 512, true);
      guiTexture.rootContainer.rotation = Math.PI;
      mesh.position.z -= 0.001;

      const rect1 = new Rectangle();
      rect1.width = "41%";
      rect1.height = "18%";
      rect1.color = "white";
      rect1.background = "rgba(0, 0, 0, 0)";
      rect1.thickness = 0;
      rect1.top = "-20%";
      rect1.left = "-17%";
      guiTexture.addControl(rect1);

      const textBlock1 = new TextBlock();
      textBlock1.text = "39,5_MPa";
      textBlock1.fontFamily = 'MyCustomFont';
      textBlock1.color = "white";
      textBlock1.fontSize = 45;
      textBlock1.textWrapping = true;
      textBlock1.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      textBlock1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      textBlock1.isVisible = false; // Изначально невидим
      rect1.addControl(textBlock1);
      this.textBlock1 = textBlock1;

      const rect2 = new Rectangle();
      rect2.width = "18%";
      rect2.height = "17%";
      rect2.color = "white";
      rect2.background = "rgba(0, 0, 0, 0)";
      rect2.thickness = 0;
      rect2.top = "10.5%";
      rect2.left = "-2%";
      guiTexture.addControl(rect2);

      const textBlock2 = new TextBlock();
      textBlock2.text = "\n\n\n"; // Изначально 4 пустые строки (3 \n создают 4 строки)
      textBlock2.fontFamily = 'MyCustomFont';
      textBlock2.color = "white";
      textBlock2.fontSize = 18;
      textBlock2.lineSpacing = "-5%";
      textBlock2.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      textBlock2.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      rect2.addControl(textBlock2);
      this.textBlock2 = textBlock2;

      const rect3 = new Rectangle();
      rect3.width = "12%";
      rect3.height = "4%";
      rect3.color = "white";
      rect3.background = "rgba(0, 0, 0, 0.5)";
      rect3.thickness = 0;
      rect3.top = "-3%";
      rect3.left = "1%";
      guiTexture.addControl(rect3);

      const textBlock3 = new TextBlock();
      textBlock3.text = ""; // Изначально 4 пустые строки (3 \n создают 4 строки)
      textBlock3.fontFamily = 'MyCustomFont';
      textBlock3.color = "white";
      textBlock3.fontSize = 18;
      textBlock3.lineSpacing = "-5%";
      textBlock3.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      textBlock3.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      rect3.addControl(textBlock3);
      this.textBlock3 = textBlock3;

      const grid = new Grid();
      grid.width = "40%";
      grid.height = "25px";
      grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      grid.top = "-40px";
      grid.left = "-85px";
      grid.addRowDefinition(1);
      grid.addColumnDefinition(0.25);
      grid.addColumnDefinition(0.25);
      grid.addColumnDefinition(0.25);
      grid.addColumnDefinition(0.25);
      guiTexture.addControl(grid);

      this.textBlocks = [];

      for (let i = 0; i < 4; i++) {
          const rect = new Rectangle();
          rect.width = "100%";
          rect.height = "100%";
          rect.color = "white";
          rect.background = "rgba(0, 0, 0, 0.5)";
          rect.thickness = 0;
          rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

          const textBlock = new TextBlock();
          textBlock.text = texts[i] || ``;
          textBlock.fontFamily = 'MyCustomFont';
          textBlock.color = "white";
          textBlock.fontSize = 18;
          textBlock.textWrapping = true;
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

          rect.addControl(textBlock);
          grid.addControl(rect, 0, i);
          this.textBlocks.push(textBlock);
      }
  } catch (error) {
      console.error("Ошибка при добавлении GUI к мешу:", error);
  }
}

// Метод для обновления текста в нужной ячейке (0 - первая ячейка, 1 - вторая и т.д.)
  public updateCellText(index: number, newValue: string): void {
      if (this.textBlocks[index]) {
          this.textBlocks[index].text = newValue;
      } else {
          console.warn(`Ячейка с индексом ${index} не найдена.`);
      }
  }
// Метод для сброса всех значений
  public resetAllCells(): void {
      for (let tb of this.textBlocks) {
          tb.text = "";
      }
  }



  /*public async loadGeoModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "lowpoly_workplace.glb",
        this.scene
      );
      this.loadedMeshes["geo"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели карты:", error);
      throw error;
    }
  }*/



  // Метод для настройки мешей после загрузки
  private setupMeshes(hide: boolean): void {
    const mapMeshes = this.loadedMeshes["map"];
    if (mapMeshes) {
      // Включаем коллизии для всех мешей
      mapMeshes.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      const transitionMeshes = mapMeshes.filter((mesh) =>
        mesh.name.includes("TransitionPlate8M")
      );
      if (transitionMeshes) {
        transitionMeshes.forEach((mesh) => {
          mesh.checkCollisions = false;
        });
      } else {
        console.warn(`Меш с именем "${transitionMeshes}" не найден для отключения коллизий.`);
      }

      // Отключаем коллизии и уменьшаем видимость для определённых мешей
      this.nonCollisionMeshNames.forEach((name) => {
        const mesh = this.scene.getMeshByName(name);
        if (mesh) {
          mesh.checkCollisions = false;
          mesh.visibility = 0.5;
        } else {
          console.warn(`Меш с именем "${name}" не найден для отключения коллизий.`);
        }
      });

      // Находим сломаные меши
      const BrokenMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
      const WholeMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("whole"));

      if (hide) {
      BrokenMeshes.forEach((mesh) => {
        mesh.visibility = 0; // Полностью видимый
      });
      } else {
        WholeMeshes.forEach((mesh) => {
          mesh.visibility = 0; // Полностью невидимый
        });
      }


    } else {
      console.warn("Меши карты не найдены для настройки.");
    }

    // Дополнительная настройка указателя (если необходимо)
    const signMeshes = this.loadedMeshes["sign"];
    if (signMeshes) {
      // Настройка мешей указателя (если требуется)
    } else {
      console.warn("Меши указателя не найдены для настройки.");
    }
  }

  // Метод для получения загруженных мешей по имени модели
  public getMeshes(modelName: string): AbstractMesh[] | undefined {
    return this.loadedMeshes[modelName];
  }
}
