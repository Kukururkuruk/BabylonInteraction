import {
    Scene,
    Engine,
    SceneLoader,
    Vector3,
    HemisphericLight,
    FreeCamera,
    Mesh,
    StandardMaterial,
    Color3,
    MeshBuilder,
    DynamicTexture,
    AbstractMesh,
} from "@babylonjs/core";
import { 
    AdvancedDynamicTexture, 
    Control, 
    Rectangle, 
    StackPanel, 
    TextBlock, 
    Grid 
} from "@babylonjs/gui";
import "@babylonjs/loaders";
import { ModelLoader } from "./BaseComponents/ModelLoader";

export class TextureScene {
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    camera: FreeCamera;
    mediaRecorder: MediaRecorder | null = null;
    private modelLoader: ModelLoader;
    recordedChunks: Blob[] = [];

    // Свойства для куба, лазера и точки пересечения
    centralCube: Mesh | null = null;
    redRay: Mesh | null = null;
    intersectionPoint: Mesh | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(this.canvas, true);
        this.engine.displayLoadingUI();

        this.scene = this.CreateScene();

        this.modelLoader = new ModelLoader(this.scene);
        this.initializeScene();
        this.CreateController();
        

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Обработка изменения размера окна
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    CreateScene(): Scene {
        const scene = new Scene(this.engine);
        new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

        const framesPerSecond = 60;
        const gravity = -9.81;
        scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
        scene.collisionsEnabled = true;

        // Можно раскомментировать, если нужен skybox
        // const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);
        // scene.environmentTexture = hdrTexture;
        // scene.createDefaultSkybox(hdrTexture, true);
        // scene.environmentIntensity = 0.5;

        return scene;
    }

    CreateController(): void {
        // Установка начальной позиции камеры для лучшей видимости
        this.camera = new FreeCamera("camera", new Vector3(0, 5.5, -7), this.scene);
        this.camera.attachControl(this.canvas, true);

        this.camera.applyGravity = false;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.camera.minZ = 0.45;
        this.camera.speed = 0.55;
        // this.camera.rotation.y = Math.PI
        this.camera.angularSensibility = 4000;
        this.camera.keysUp.push(87); // W
        this.camera.keysLeft.push(65); // A
        this.camera.keysDown.push(83); // S
        this.camera.keysRight.push(68); // D
    }

    async CreateEnvironment(): Promise<void> {
        try {
            this.engine.displayLoadingUI();

            await this.modelLoader.loadRangeModel()
            const rangefinderMeshes = this.modelLoader.getMeshes('range') || [];
            console.log(rangefinderMeshes);
            

            await this.modelLoader.addGUIRange(this.camera, rangefinderMeshes)

            // // Загрузка инструментов
            // const { meshes: tools } = await SceneLoader.ImportMeshAsync("", "./models/", "UltrasonicTester_FR_LP.glb", this.scene);

            // // Проверка количества мешей
            // console.log(`Загружено инструментов: ${tools.length}`);
            // if (tools.length < 3) {
            //     console.warn("Недостаточно мешей в tools. Ожидается минимум 3.");
            // }

            // // Позиционирование и масштабирование инструментов
            // tools.forEach((mesh, index) => {
            //     mesh.position = new Vector3(0, 2.5, -4);
            //     mesh.scaling = new Vector3(0.5, 0.5, 0.5);

            //     // Инвертирование масштаба по оси X для tools[1] и tools[2]
            //     if (index === 1) {
            //         mesh.scaling.x = -0.5;
            //     }
            // });

            // console.log("Модели успешно загружены.");

            // // Добавление GUI к tools[2], если он существует
            // if (tools.length >= 3) {
            //     const texts = ["1234"];
            //     this.addGUIToTool(tools[2], texts);
            // } else {
            //     console.warn("tools[2] не существует. GUI не добавлен.");
            // }

            this.engine.hideLoadingUI();
        } catch (error) {
            console.error("Ошибка при загрузке моделей:", error);
            this.engine.hideLoadingUI();
        }
    }

    addGUIToTool(mesh, texts): void {
        // Проверяем, что mesh существует и является действительным
        if (!mesh) {
            console.error("Меш не существует. GUI не может быть добавлен.");
            return;
        }

        try {

            const guiPlane = mesh.clone("guiPlane");
            guiPlane.scaling.x = -0.5;

            // Создаём AdvancedDynamicTexture для меша
            // mesh.position.z = 0
            const guiTexture = AdvancedDynamicTexture.CreateForMesh(mesh, 512, 512, true);

            guiTexture.rootContainer.rotation = Math.PI; // поворот на 180 градусов

            // Создаём Grid для размещения 4 прямоугольников
            const grid = new Grid();
            grid.width = "40%";   // Делаем больше, чтобы все 4 влезли
            grid.height = "25px";
            grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.top = "-40px";   // Сдвинет весь грид вниз на 50px
            grid.left = "-85px"; // Сдвинет весь грид влево на 80px
            
            // Одна строка и четыре колонки
            grid.addRowDefinition(1);
            grid.addColumnDefinition(0.25);
            grid.addColumnDefinition(0.25);
            grid.addColumnDefinition(0.25);
            grid.addColumnDefinition(0.25);
            guiTexture.addControl(grid);

            for (let i = 0; i < 4; i++) {

                // Создаём прямоугольник
                const rect = new Rectangle();
          rect.width = "100%";
          rect.height = "100%";
          rect.color = "white";
          rect.background = "rgba(0, 0, 0, 0.5)";
          rect.thickness = 0;
          rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

          // Создаём текстовый блок
          const textBlock = new TextBlock();
          textBlock.text = texts[i] || ``;
          textBlock.color = "white";
          textBlock.fontSize = 18;
          textBlock.textWrapping = true;
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                // Добавляем текст в прямоугольник
                rect.addControl(textBlock);

                // Добавляем прямоугольник в Grid
                grid.addControl(rect, 0, i);

            }
        } catch (error) {
            console.error("Ошибка при добавлении GUI к мешу:", error);
        }
    }

    addGUIRange(camera: FreeCamera, rangefinderMeshes: AbstractMesh[]): void {

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

      updateDynamicText("жопа")
  
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

    async initializeScene(): Promise<void> {
        try {
            await this.CreateEnvironment();
        } catch (error) {
            console.error("Ошибка при инициализации сцены:", error);
        } finally {
            this.engine.hideLoadingUI();
        }
    }
}

