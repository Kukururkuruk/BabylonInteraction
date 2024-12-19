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
    "SM_0_FencePost_Road.087",
    "SM_0_FencePost_Road.088",
  ];

  private brokenMeshSubstring: string = "broken";

  public meshGroups = [
    { groupName: "SpanStructureBeam_L_7", baseName: "SM_0_SpanStructureBeam_L_7" },
    { groupName: "SpanStructureBeam_L_4", baseName: "SM_0_SpanStructureBeam_L_4" },
    // Добавьте дополнительные группы по необходимости
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
    "SM_0_Road_Down.001",               // Дорожное полотно
    "SM_0_BridgeAsfalt",                // Асфальт на мосту
    "SM_0_Stand_R",                     // Подферменник
    "SM_0_Road_1_R",                    // Дорога сверху
    "SM_ConcreteFence_LP.002",          // Бетонное ограждение по центру (Нью-Джерси)
    "SM_0_TransitionPlate8M_LP_L_primitive0", // Плита переходная
    "SM_0_PlotMonolithic",              // Плита над балками
    "SM_0_SupportLight_LP_Down_L",      // Фонари
    "SM_0_Landscape_Gravel_LP",         // Водосточный монолит
    "SM_HalfPipe_LP",                   // Подвесной лоток
    "SM_ConcreteTray_UP",               // Лоток верхняя часть
    "SM_ConcreteTelescopicTray",        // Откосной лоток
    "SM_PipeWater_LP",                  // Водосточная система
    "SM_GridDrainageSmall_LP",          // Дождеприемник
    // Добавьте дополнительные одиночные меши по необходимости
  ];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  // Метод для загрузки всех моделей
  public async loadAllModels(): Promise<void> {
    await this.loadMapModel();
    await this.loadSignModel();
    this.setupMeshes();
  }

  private async loadMapModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Map_1_MOD.gltf",
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
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Laboratory_01.glb",
            this.scene
        );

        // Сохраняем загруженные меши
        this.loadedMeshes["lab"] = result.meshes;

        // Включаем столкновения для каждого меша
        result.meshes.forEach(mesh => {
            if (mesh instanceof Mesh) { // Проверяем, что это Mesh
                mesh.checkCollisions = true;

                // Логируем меши для отладки
                console.log(`Меш "${mesh.name}" загружен с включёнными столкновениями.`);
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



  public async loadRangeModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Rangefinder_LP.glb",
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



  public async loadUltranModel(camera: FreeCamera): Promise<void> {
    try {
        // Загрузка первой модели
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "UltrasonicTester_FR_LP.glb",
            this.scene
        );

        result.meshes.forEach((mesh) => {
            mesh.scaling = new Vector3(0.04, 0.04, 0.04);
            mesh.parent = camera;
            mesh.rotation = new Vector3(Math.PI / 2, Math.PI, Math.PI / 6);
            const offset = new Vector3(-0.55, -0.5, 0.86);
            mesh.position = offset;
        });

        // Инверсия масштабирования для некоторых мешей
        if (result.meshes.length > 1) {
            result.meshes[1].scaling.x = -0.04;
        }

        // Добавление GUI к tools[2], если он существует
        if (result.meshes.length >= 3) {
            const texts = ["", "", "", ""];
            this.addGUIToTool(result.meshes[2], texts);
        } else {
            console.warn("tools[2] не существует. GUI не добавлен.");
        }

        console.log("UltrasonicTester_FR_LP.glb meshes:", result.meshes);

        // Сохранение мешей первой модели
        this.loadedMeshes["ultra"] = result.meshes;

        // Загрузка второй модели
        const image = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "SM_Tilt_sign_LP.glb",
            this.scene
        );

        console.log("SM_Tilt_sign_LP.glb meshes:", image.meshes);

        // Настройка второй модели
        image.meshes.forEach((mesh) => {
            mesh.scaling = new Vector3(0.5, 0.5, 0.5);
            mesh.parent = result.meshes[2];
            mesh.position = new Vector3(0, 6.5, -10.22);
            mesh.rotation = new Vector3(0, Math.PI, 0); // Начальное вращение
        });
        image.meshes[1].isVisible = false

        // Сохранение мешей второй модели под отдельным ключом
        this.loadedMeshes["image"] = image.meshes;
    } catch (error) {
        console.error("Ошибка при загрузке моделей:", error);
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

          // Создаём AdvancedDynamicTexture для меша
          const guiTexture = AdvancedDynamicTexture.CreateForMesh(mesh, 512, 512, true);
          guiTexture.rootContainer.rotation = Math.PI; // поворот на 180 градусов
          mesh.position.z -= 0.001; // Смещаем меш вперед на 1 единицу

          // Создаём Grid для размещения 4 прямоугольников
          const grid = new Grid();
          grid.width = "40%";
          grid.height = "25px";
          grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          grid.top = "-40px";
          grid.left = "-85px";

          // Одна строка и четыре колонки
          grid.addRowDefinition(1);
          grid.addColumnDefinition(0.25);
          grid.addColumnDefinition(0.25);
          grid.addColumnDefinition(0.25);
          grid.addColumnDefinition(0.25);

          guiTexture.addControl(grid);

          this.textBlocks = []; // Очищаем/инициализируем массив

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

              // Сохраняем ссылки на textBlock
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
  private setupMeshes(): void {
    const mapMeshes = this.loadedMeshes["map"];
    if (mapMeshes) {
      // Включаем коллизии для всех мешей
      mapMeshes.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

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

      // Скрываем "сломанные" меши
      const brokenMeshes = mapMeshes.filter((mesh) =>
        mesh.name.toLowerCase().includes(this.brokenMeshSubstring)
      );
      brokenMeshes.forEach((mesh) => {
        mesh.visibility = 0;
      });
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
