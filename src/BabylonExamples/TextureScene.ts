// import {
//     Scene,
//     Engine,
//     SceneLoader,
//     Vector3,
//     HemisphericLight,
//     FreeCamera,
//     Mesh,
//     StandardMaterial,
//     Color3,
//     MeshBuilder,
//     DynamicTexture,
//     AbstractMesh,
//     PBRMaterial,
//     Material,
// } from "@babylonjs/core";
// import { 
//     AdvancedDynamicTexture, 
//     Control, 
//     Rectangle, 
//     StackPanel, 
//     TextBlock, 
//     Grid 
// } from "@babylonjs/gui";
// import "@babylonjs/loaders";
// import { ModelLoader } from "./BaseComponents/ModelLoader";

// export class TextureScene {
//     scene: Scene;
//     engine: Engine;
//     canvas: HTMLCanvasElement;
//     camera: FreeCamera;
//     mediaRecorder: MediaRecorder | null = null;
//     private modelLoader: ModelLoader;
//     recordedChunks: Blob[] = [];

//     // Свойства для куба, лазера и точки пересечения
//     centralCube: Mesh | null = null;
//     redRay: Mesh | null = null;
//     intersectionPoint: Mesh | null = null;

//     constructor(canvas: HTMLCanvasElement) {
//         this.canvas = canvas;
//         this.engine = new Engine(this.canvas, true);
//         this.engine.displayLoadingUI();

//         this.scene = this.CreateScene();

//         this.modelLoader = new ModelLoader(this.scene);
//         this.initializeScene();
//         this.CreateController();
        

//         this.engine.runRenderLoop(() => {
//             this.scene.render();
//         });

//         // Обработка изменения размера окна
//         window.addEventListener("resize", () => {
//             this.engine.resize();
//         });
//     }

//     CreateScene(): Scene {
//         const scene = new Scene(this.engine);
//         new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

//         const framesPerSecond = 60;
//         const gravity = -9.81;
//         scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//         scene.collisionsEnabled = true;

//         // Можно раскомментировать, если нужен skybox
//         // const hdrTexture = new HDRCubeTexture("/models/cape_hill_4k.hdr", scene, 512);
//         // scene.environmentTexture = hdrTexture;
//         // scene.createDefaultSkybox(hdrTexture, true);
//         // scene.environmentIntensity = 0.5;

//         return scene;
//     }

//     CreateController(): void {
//         // Установка начальной позиции камеры для лучшей видимости
//         this.camera = new FreeCamera("camera", new Vector3(0, 5.5, -7), this.scene);
//         this.camera.attachControl(this.canvas, true);

//         this.camera.applyGravity = false;
//         this.camera.checkCollisions = true;
//         this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
//         this.camera.minZ = 0.45;
//         this.camera.speed = 0.55;
//         // this.camera.rotation.y = Math.PI
//         this.camera.angularSensibility = 4000;
//         this.camera.keysUp.push(87); // W
//         this.camera.keysLeft.push(65); // A
//         this.camera.keysDown.push(83); // S
//         this.camera.keysRight.push(68); // D
//     }

//     async CreateEnvironment(): Promise<void> {
//         try {
//             this.engine.displayLoadingUI();

//             // await this.modelLoader.loadRangeModel()
//             // const rangefinderMeshes = this.modelLoader.getMeshes('range') || [];
//             // console.log(rangefinderMeshes);
            

//             // await this.modelLoader.addGUIRange(this.camera, rangefinderMeshes)

//             // Загрузка инструментов
//             const { meshes: tools } = await SceneLoader.ImportMeshAsync("", "./models/", "UltrasonicTester_FR_LP.glb", this.scene);
//             const { meshes: rack } = await SceneLoader.ImportMeshAsync("", "./models/", "Test_Rack_Sign.gltf", this.scene);

//             // Проверка количества мешей
//             console.log(`Загружено инструментов: ${tools.length}`);
//             if (tools.length < 3) {
//                 console.warn("Недостаточно мешей в tools. Ожидается минимум 3.");
//             }

//             rack.forEach((mesh) => {
//                 const material = mesh.material;
//                 if (material && material instanceof PBRMaterial) {
//                     material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND;
//                   }
//             })
//             // Позиционирование и масштабирование инструментов
//             tools.forEach((mesh, index) => {
//                 mesh.position = new Vector3(0, 2.5, -4);
//                 mesh.scaling = new Vector3(0.5, 0.5, 0.5);

//                 // Инвертирование масштаба по оси X для tools[1] и tools[2]
//                 if (index === 1) {
//                     mesh.scaling.x = -0.5;
//                 }
//             });

//             console.log("Модели успешно загружены.");

//             // Добавление GUI к tools[2], если он существует
//             if (tools.length >= 3) {
//                 const texts = ["1234", "1234", "1234", "1234"];
//                 this.addGUIToTool(tools[2], texts);
//             } else {
//                 console.warn("tools[2] не существует. GUI не добавлен.");
//             }

//             this.engine.hideLoadingUI();
//         } catch (error) {
//             console.error("Ошибка при загрузке моделей:", error);
//             this.engine.hideLoadingUI();
//         }
//     }

//     addGUIToTool(mesh, texts): void {
//         // Проверяем, что mesh существует и является действительным
//         if (!mesh) {
//             console.error("Меш не существует. GUI не может быть добавлен.");
//             return;
//         }

//         try {

//             const guiPlane = mesh.clone("guiPlane");
//             guiPlane.scaling.x = -0.5;

//             // Создаём AdvancedDynamicTexture для меша
//             // mesh.position.z = 0
//             const guiTexture = AdvancedDynamicTexture.CreateForMesh(mesh, 512, 512, true);

//             guiTexture.rootContainer.rotation = Math.PI; // поворот на 180 градусов

//             const rect1 = new Rectangle();
//             rect1.width = "41%";
//             rect1.height = "18%";
//             rect1.color = "white";
//             rect1.background = "rgba(0, 0, 0, 0.5)";
//             rect1.thickness = 0;
//             rect1.top = "-20%"
//             rect1.left = "-17%"
//             guiTexture.addControl(rect1);

//             const textBlock1 = new TextBlock();
//             textBlock1.text = "39,5_MPa";
//             textBlock1.color = "white";
//             textBlock1.fontSize = 45;
//             textBlock1.textWrapping = true;
//             textBlock1.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//             textBlock1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//             rect1.addControl(textBlock1);

//             const rect2 = new Rectangle();
//             rect2.width = "18%";
//             rect2.height = "17%";
//             rect2.color = "white";
//             rect2.background = "rgba(0, 0, 0, 0.5)";
//             rect2.thickness = 0;
//             rect2.top = "10.5%"
//             rect2.left = "-3%"
//             guiTexture.addControl(rect2);

//             const textBlock2 = new TextBlock();
//             textBlock2.text = "1234\n1234\n1234\n1234";
//             textBlock2.color = "white";
//             textBlock2.fontSize = 17;
//             textBlock2.lineSpacing = "-5%";
//             textBlock2.textWrapping = true;
//             textBlock2.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
//             textBlock2.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//             rect2.addControl(textBlock2);

//             // Создаём Grid для размещения 4 прямоугольников
//             const grid = new Grid();
//             grid.width = "40%";   // Делаем больше, чтобы все 4 влезли
//             grid.height = "25px";
//             grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//             grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//             grid.top = "-40px";   // Сдвинет весь грид вниз на 50px
//             grid.left = "-85px"; // Сдвинет весь грид влево на 80px
            
//             // Одна строка и четыре колонки
//             grid.addRowDefinition(1);
//             grid.addColumnDefinition(0.25);
//             grid.addColumnDefinition(0.25);
//             grid.addColumnDefinition(0.25);
//             grid.addColumnDefinition(0.25);
//             guiTexture.addControl(grid);

//             for (let i = 0; i < 4; i++) {

//                 // Создаём прямоугольник
//           const rect = new Rectangle();
//           rect.width = "100%";
//           rect.height = "100%";
//           rect.color = "white";
//           rect.background = "rgba(0, 0, 0, 0.5)";
//           rect.thickness = 0;
//           rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//           rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

//           // Создаём текстовый блок
//           const textBlock = new TextBlock();
//           textBlock.text = texts[i] || ``;
//           textBlock.color = "white";
//           textBlock.fontSize = 18;
//           textBlock.textWrapping = true;
//           textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//           textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
//                 // Добавляем текст в прямоугольник
//                 rect.addControl(textBlock);

//                 // Добавляем прямоугольник в Grid
//                 grid.addControl(rect, 0, i);

//             }
//         } catch (error) {
//             console.error("Ошибка при добавлении GUI к мешу:", error);
//         }
//     }

//     addGUIRange(camera: FreeCamera, rangefinderMeshes: AbstractMesh[]): void {

//         rangefinderMeshes.forEach((mesh) => {
//           // Отзеркаливание по оси Z и масштабирование
//           mesh.scaling = new Vector3(2, 2, -2); // Масштабируем в 3 раза и отражаем по Z
//           mesh.rotation.y = Math.PI / 2;
//           mesh.rotation.z = 0.4;
  
//           // Закрепление модели за камерой
//           mesh.parent = camera;
  
//           // Установка позиции относительно камеры
//           const offset = new Vector3(0, -0.4, 0.6); // Настройте значения по необходимости
//           mesh.position = offset;
//       });
  
//       const thirdMesh = rangefinderMeshes[2];
  
//       // Получение размеров меша
//       const boundingInfo = thirdMesh.getBoundingInfo();
//       const boundingBox = boundingInfo.boundingBox;
//       const size = boundingBox.maximum.subtract(boundingBox.minimum);
//       const width = size.z;
//       const height = size.y;
  
//       // Определение размеров плоскости
//       const planeWidth = width; // Ширина плоскости равна ширине меша
//       const planeHeight = height; // Высота плоскости — 20% от высоты меша (можно настроить по необходимости)
  
//       // Создание DynamicTexture с достаточным разрешением
//       const dynamicTexture = new DynamicTexture("DynamicTexture", { width: 1024, height: 512 }, this.scene, false);
//       dynamicTexture.hasAlpha = true;
  
//       // Установка шрифта перед измерением текста
//       const font = "bold 90px Arial";
//       const ctx = dynamicTexture.getContext();
//       ctx.font = font;
  
//       // Определение максимальной ширины текста с учётом отступов
//       const maxTextWidth = dynamicTexture.getSize().width - 100; // 50 пикселей отступа с каждой стороны
  
//       // Функция для разбиения текста на строки с учётом символов \n и ширины
//       function wrapText(context, text, maxWidth) {
//           const lines = [];
//           const paragraphs = text.split('\n');
  
//           paragraphs.forEach(paragraph => {
//               const words = paragraph.split(' ');
//               let currentLine = '';
  
//               words.forEach(word => {
//                   const testLine = currentLine + word + ' ';
//                   const metrics = context.measureText(testLine);
//                   const testWidth = metrics.width;
  
//                   if (testWidth > maxWidth && currentLine !== '') {
//                       lines.push(currentLine.trim());
//                       currentLine = word + ' ';
//                   } else {
//                       currentLine = testLine;
//                   }
//               });
  
//               lines.push(currentLine.trim());
//           });
  
//           return lines;
//       }
  
//       // Функция для обновления текста с переносом
//       function updateDynamicText(newText) {
//           ctx.clearRect(0, 0, dynamicTexture.getSize().width, dynamicTexture.getSize().height);
  
//           // Устанавливаем шрифт
//           ctx.font = font;
  
//           // Разбиваем текст на строки с учетом \n и ширины
//           const lines = wrapText(ctx, newText, maxTextWidth);
  
//           // Рисуем каждую строку с увеличивающимся смещением по Y
//           const lineHeight = 90; // Можно настроить в зависимости от шрифта
//           lines.forEach((line, index) => {
//               ctx.fillStyle = "white"; // Цвет текста
//               ctx.fillText(line, 50, 100 + index * lineHeight); // 50 и 100 - отступы от левого и верхнего края
//           });
  
//           // Обновляем текстуру
//           dynamicTexture.update();
//       }

//       updateDynamicText("жопа")
  
//       // Создание материала для текста
//       const textMaterial = new StandardMaterial("TextMaterial", this.scene);
//       textMaterial.diffuseTexture = dynamicTexture;
//       textMaterial.emissiveColor = new Color3(1, 1, 1); // Делает текст ярким
//       textMaterial.backFaceCulling = false; // Текст виден с обеих сторон
  
//       // Создание плоскости для текста
//       const textPlane = MeshBuilder.CreatePlane("TextPlane", { width: planeWidth, height: planeHeight }, this.scene);
//       textPlane.material = textMaterial;
  
//       // Позиционируем плоскость относительно меша
//       textPlane.parent = thirdMesh;
//       textPlane.rotation.y = -Math.PI / 2;
  
//       // Компенсируем отражение родителя по оси Z
//       textPlane.scaling = new Vector3(-1, 1, 1);
  
//       // Устанавливаем позицию
//       textPlane.position = new Vector3(0.015, height / 2 + planeHeight / 2 + 0.05, 0); //
//   }

//     async initializeScene(): Promise<void> {
//         try {
//             await this.CreateEnvironment();
//         } catch (error) {
//             console.error("Ошибка при инициализации сцены:", error);
//         } finally {
//             this.engine.hideLoadingUI();
//         }
//     }
// }


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
    PointerEventTypes,
    Plane,
    KeyboardEventTypes,
    Axis,
    Space,
    Quaternion,
    HDRCubeTexture,
    Observable,
} from "@babylonjs/core";
import { 
    AdvancedDynamicTexture, 
    Control, 
    Rectangle, 
    StackPanel, 
    TextBlock, 
    Grid, 
    Image,
    ScrollViewer,
    TextWrapping,
    Button
} from "@babylonjs/gui";
import "@babylonjs/loaders";
import { ModelLoader } from "./BaseComponents/ModelLoader";
import { VideoGui } from "../BabylonExamples/BaseComponents/VideoGui"
import { BabylonUtilities } from "./FunctionComponents/BabylonUtilities";
import { GUIManager } from "./FunctionComponents/GUIManager";
import { DialogPage } from "./FunctionComponents/DialogPage";

export class TextureScene {
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    camera: FreeCamera;
    private guiTexture: AdvancedDynamicTexture;
    mediaRecorder: MediaRecorder | null = null;
    private modelLoader: ModelLoader;
    private guiManager: GUIManager;
    private dialogPage: DialogPage;
    recordedChunks: Blob[] = [];
    private currentDialogBox: Rectangle | null = null;

    // Свойства для куба, лазера и точки пересечения
    centralCube: Mesh | null = null;
    redRay: Mesh | null = null;
    intersectionPoint: Mesh | null = null;

    private fixedPoint: Vector3 | null = null;         // Первая зафиксированная точка
    private secondFixedPoint: Vector3 | null = null;     // Вторая зафиксированная точка
    private measurementStage: 0 | 1 | 2 = 0;             // 0 – нет кликов, 1 – первый клик, 2 – второй клик (измерение зафиксировано)
    private rulerMesh: Mesh | null = null;               // Меш линейки (фиксированная часть)
    private tapeRollMesh: Mesh | null = null;            // Меш рулетки (следует за курсором)
    private lastPointerPoint: Vector3 | null = null;
    private utils: BabylonUtilities

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(this.canvas, true);
        this.engine.displayLoadingUI();

        this.scene = this.CreateScene();
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.guiManager = new GUIManager(this.scene, this.textMessages);
        this.modelLoader = new ModelLoader(this.scene);
        this.dialogPage = new DialogPage()
        this.utils = new BabylonUtilities(this.scene, this.engine, this.guiTexture)
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
        new HemisphericLight("hemi", new Vector3(0, 0, 1), scene);

        const framesPerSecond = 60;
        const gravity = -9.81;
        scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
        scene.collisionsEnabled = true;

        const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
        scene.environmentTexture = hdrTexture;
        
        // Создаем скайбокс и сохраняем ссылку на него
        const skybox = scene.createDefaultSkybox(hdrTexture, true);
        
        // Поворачиваем скайбокс по оси Z
        skybox.rotation.x = -Math.PI / 2; // Поворот на 90 градусов по оси Z
        
        scene.environmentIntensity = 1;
              

        return scene;
    }

    CreateController(): void {
        // Установка начальной позиции камеры
        this.camera = new FreeCamera("camera", new Vector3(-5.007400745390228, 13.16294333460046, -6.3342779582678235), this.scene);
        this.camera.attachControl(this.canvas, true);
    
        this.camera.applyGravity = false;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.camera.rotation = new Vector3(1.570546, -3.1431781384928, 0)
        this.camera.minZ = 0.45;
        this.camera.speed = 0.55;
        this.camera.angularSensibility = 4000;
        this.camera.inertia = 0.4;
        this.camera.keysUp.push(87);   // W
        this.camera.keysLeft.push(65); // A
        this.camera.keysDown.push(83); // S
        this.camera.keysRight.push(68); // D
    
        // Переменные для зума
        const originalFov = this.camera.fov;
        let isZoomedIn = false;
        let originalPosition = this.camera.position.clone(); // Сохраняем исходную позицию
    
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                const key = kbInfo.event.key.toLowerCase();
                if (/q|й/.test(key)) {
                    // Зумируем только если измерение зафиксировано (состояние 2) и есть вторая точка
                    if (this.measurementStage === 2 && this.secondFixedPoint) {
                        if (!isZoomedIn) {
                            // Сохраняем текущую позицию перед зумом
                            originalPosition = this.camera.position.clone();
    
                            // Вычисляем новую позицию перед secondFixedPoint
                            const direction = this.camera.getDirection(Vector3.Forward()).normalize();
                            const distance = 1.0; // Расстояние от точки, можно настроить
                            const newPosition = this.secondFixedPoint.subtract(direction.scale(distance));

                            const zOffset = 0.1; // Смещение вверх на 0.5 единицы (можно настроить)
                            newPosition.x += zOffset;

                            this.camera.position = newPosition; // Перемещаем камеру
    
                            // Уменьшаем FOV для эффекта зума
                            this.camera.fov /= 4;
                        } else {
                            // Возвращаем камеру в исходную позицию
                            this.camera.position = originalPosition.clone();
    
                            // Восстанавливаем FOV
                            this.camera.fov = originalFov;
                        }
                        isZoomedIn = !isZoomedIn;
                    }
                }
            }
        });
    }

    private makeRootFromMeshes(meshes: AbstractMesh[]): AbstractMesh | null {
        if (meshes.length === 0) return null;
        const root = meshes[0];
        root.scaling = new Vector3(-1, 1, -1);
        for (let i = 1; i < meshes.length; i++) {
            meshes[i].setParent(root);
        }
        return root;
    }

    async CreateEnvironment(): Promise<void> {
        try {
            this.engine.displayLoadingUI();

            const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_4.gltf", this.scene);

              const wholeMeshes = map.filter(mesh => mesh.name.toLowerCase().includes("whole"));
              wholeMeshes.forEach(mesh => {
                  mesh.checkCollisions = true;
                  mesh.isPickable = false; // "whole" остаются кликабельными
                  mesh.visibility = 0;
              });

            await this.modelLoader.loadTapeMeasureModel();

            map.forEach((mesh) => {
                mesh.rotation = new Vector3(Math.PI / 2, 0, -Math.PI / 2 )
            })

            console.log("Модели успешно загружены.");
            this.engine.hideLoadingUI();
        } catch (error) {
            console.error("Ошибка при загрузке моделей:", error);
            this.engine.hideLoadingUI();
        }
    }

    private addTapeMode(): void {
        const tapeMeshes = this.modelLoader.getMeshes('tape') || [];
        if (tapeMeshes.length === 0) return;
        
        const tapeRoot = this.makeRootFromMeshes(tapeMeshes);
        if (tapeRoot) {
            const mergeArr: Mesh[] = [];
            tapeRoot.getChildMeshes().forEach((m, index) => {
                if (index !== 0 && index !== 12) {
                    mergeArr.push(m as Mesh);
                }
            });
            const combined = Mesh.MergeMeshes(mergeArr);
            if (combined) {
                combined.scaling = new Vector3(1, 1, -1);
                // Предполагаем: combined – это линейка, а tapeMeshes[12] – рулетка.
                this.rulerMesh = combined;
                this.tapeRollMesh = tapeMeshes[12] as Mesh;
                if (this.rulerMesh) {
                    this.rulerMesh.isVisible = false;
                }
            }
        }
    }

    private setupPointerEvents(): void {
        // Создаём клип-плоскость
        const clipPlane = new Plane(1, 0, 0, 0);
    
        // Применяем клип-плоскость только к линейке (если она существует)
        if (this.rulerMesh) {
            this.rulerMesh.onBeforeRenderObservable.add(() => {
                this.scene.clipPlane = clipPlane;
            });
            this.rulerMesh.onAfterRenderObservable.add(() => {
                this.scene.clipPlane = null;
            });
        }
    
        // Функция для обновления позиций и ориентаций
        const updateMeasurement = (currentPoint: Vector3) => {
            if (this.fixedPoint) {
                // Ограничиваем расстояние до 1 метра от фиксированной точки
                const dir = currentPoint.subtract(this.fixedPoint);
                const dist = dir.length();
                if (dist > 1) {
                    dir.normalize();
                    currentPoint = this.fixedPoint.add(dir.scale(1));
                }
    
                // Обновляем положение и ориентацию рулетки (вторая точка)
                this.tapeRollMesh.position.copyFrom(currentPoint);
                this.tapeRollMesh.lookAt(this.fixedPoint);
                this.tapeRollMesh.rotation.set(0, 0, 0);
                this.tapeRollMesh.rotate(Axis.Y, -Math.PI / 2, Space.LOCAL);
                // this.tapeRollMesh.rotate(Axis.X, Math.PI / 2, Space.LOCAL);
    
                // Обновляем положение и ориентацию линейки (начиная от фиксированной точки)
                this.rulerMesh.position.copyFrom(this.fixedPoint);
                this.rulerMesh.lookAt(currentPoint);
                this.rulerMesh.rotation.set(0, 0, 0);
                this.rulerMesh.rotate(Axis.Y, Math.PI / 2, Space.LOCAL);
                // this.rulerMesh.rotate(Axis.X, Math.PI / 2, Space.LOCAL);
    
                // Обновляем клип-плоскость
                const direction = this.tapeRollMesh.position.subtract(this.rulerMesh.position).normalize();
                const newPlane = Plane.FromPositionAndNormal(this.tapeRollMesh.position, direction);
                clipPlane.normal.copyFrom(newPlane.normal);
                clipPlane.d = newPlane.d;
            }
        };
    
        // Обработка событий указателя
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERMOVE: {
                    const pickResult = this.scene.pick(
                        this.scene.pointerX,
                        this.scene.pointerY,
                        (mesh) => mesh !== this.rulerMesh && mesh !== this.tapeRollMesh
                    );
                    if (pickResult?.hit && pickResult.pickedPoint) {
                        const currentPoint = pickResult.pickedPoint.clone();
    
                        if (this.measurementStage === 1 && this.fixedPoint) {
                            // Если это первое движение после фиксации, делаем линейку видимой
                            if (!this.rulerMesh.isVisible) {
                                this.rulerMesh.isVisible = true;
                            }
                            updateMeasurement(currentPoint);
                        } else if (this.measurementStage === 0) {
                            // В состоянии 0 обновляем только положение рулетки
                            this.tapeRollMesh.position.copyFrom(currentPoint);
                        }
                        // В состоянии 2 обновление не производится
                    }
                    break;
                }
    
                case PointerEventTypes.POINTERPICK: {
                    const pickResult = this.scene.pick(
                        this.scene.pointerX,
                        this.scene.pointerY,
                        (mesh) => mesh !== this.rulerMesh && mesh !== this.tapeRollMesh
                    );
                    if (pickResult?.hit && pickResult.pickedPoint) {
                        if (this.measurementStage === 0) {
                            // Первый клик: фиксируем первую точку, но не показываем линейку сразу
                            this.fixedPoint = pickResult.pickedPoint.clone();
                            this.measurementStage = 1;
                            // Оставляем линейку скрытой до первого движения мыши
                        } else if (this.measurementStage === 1) {
                            // Второй клик: фиксируем положение рулетки (как вторую точку)
                            this.secondFixedPoint = this.tapeRollMesh.position.clone();
                            // Обновляем клип-плоскость
                            const direction = this.tapeRollMesh.position.subtract(this.fixedPoint).normalize();
                            const newPlane = Plane.FromPositionAndNormal(this.tapeRollMesh.position, direction);
                            clipPlane.normal.copyFrom(newPlane.normal);
                            clipPlane.d = newPlane.d;
                            this.measurementStage = 2;
                        } else if (this.measurementStage === 2) {
                            // Третий клик: сбрасываем измерение
                            this.fixedPoint = null;
                            this.secondFixedPoint = null;
                            this.measurementStage = 0;
                            this.rulerMesh.isVisible = false;
                        }
                    }
                    break;
                }
            }
        });
    }
    
    
    

    async initializeScene(): Promise<void> {
        try {
            await this.CreateEnvironment();
            this.addTapeMode();
            this.setupPointerEvents();
            this.utils.AddCameraPositionButton()

            const checkResultObservable = new Observable<{ correctCount: number; total: number }>();

            const page1 = this.dialogPage.addText("Вам нужно измерить длину данного повреждения. Для того чтобы начать измерение наведитесь мышкой на начало повреждения, в этом месте появляется прибор. Затем кликните мышкой, и ведите ее в место окончания измерения. По клику зафиксируйте прибор и нажмите Q/Й для увеличения обзора (нажмите опять чтобы выйти), появившееся число введите на третьей странице. Для продолжение нажмите Вперед, для возврата на предыдущую страницу, Назад.");
            const page2 = this.dialogPage.addText("На следующей странице вас ждет таблица из двух колонок. В первой название конструкции с повреждением, во второй поле куда вводить показания. Когда введете все показания, нажмите на кнопку проверить. Галочкой подсветятся правильные измерения, крестиком неправильные. Как только все поля будут зелеными в планшете появится страничка где можно будет завершить тест");
            const page3 = this.dialogPage.addInputGrid2(
                "Конструкции",
                ["Балка"],
                [
                  { min: 59.5, max: 60.5 }, 
                ],
                "../models/UltraInfo.jpg",
                this.guiTexture,
                () => {
                  // Логика видимости мешей
                    console.log("Готово");
                },
                8,
                checkResultObservable
              );

            const endPageResult = this.dialogPage.createConditionButton(
                "Здесь появится кнопка позволяющая завершить тест, но только после всех правильных ответов. Нажмите на предыдущей странице 'Проверка' чтобы узнать результат",
                "Завершить",
                () => {
                    const routePage = this.dialogPage.createStartPage(
                        "Отлично, а теперь нажмите на кнопку для перемещения на основную карту",
                        "Перейти на основную карту",
                        () => {
                            window.location.href = "/ВыборИнструмента";
                        }
                    );
                    this.guiManager.CreateDialogBox([routePage]);
                },
                false // Кнопка изначально невидима
            );
            
            // Подписка на результат проверки
            let isButtonShown = false;
            checkResultObservable.add((result) => {
                if (result.correctCount === result.total && !isButtonShown) {
                    endPageResult.messageText.text = "Все измерения верны! Нажмите 'Завершить' для продолжения.";
                    endPageResult.actionButton.isVisible = true; // Показываем кнопку
                    isButtonShown = true;
                }
            });

            this.guiManager.CreateDialogBox([page1, page2, page3, endPageResult.rectangle]);
        } catch (error) {
            console.error("Ошибка при инициализации сцены:", error);
        } finally {
            this.engine.hideLoadingUI();
        }
    }
}