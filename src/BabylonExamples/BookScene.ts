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
    FreeCameraMouseInput,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import { GUIManager } from "./FunctionComponents/GUIManager"; // Импортируем GUIManager
import { DialogPage } from "./FunctionComponents/DialogPage";

export class BookScene {
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    camera: FreeCamera;
    private guiTexture: AdvancedDynamicTexture;
    private triggerManager: TriggerManager2;
    private guiManager: GUIManager;
    private dialogPage: DialogPage;
    openModal?: (keyword: string) => void;
    private greenHighlightLayer: HighlightLayer;
    private blueHighlightLayer: HighlightLayer;
    private groupNameToBaseName: { [groupName: string]: string } = {};
    textMessages: string[] = [
        "Чтобы идти вперед нажмите на 'W'",
        "Чтобы идти назад нажмите на 'S'",
        "Чтобы идти влево нажмите на 'A'",
        "Чтобы идти вправо нажмите на 'D'",
        "А теперь осмотритесь по комнате",
      ];

    // Счетчик прокликанных мешей
    private clickedMeshes: number = 0;
    private totalMeshes: number = 0;
    private counterText: TextBlock;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(this.canvas, true);
        this.engine.displayLoadingUI();

        this.scene = this.CreateScene();
        this.greenHighlightLayer = new HighlightLayer("greenHL", this.scene);
        this.blueHighlightLayer = new HighlightLayer("blueHL", this.scene);

        this.guiManager = new GUIManager(this.scene, this.textMessages);
        this.dialogPage = new DialogPage();

        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.triggerManager = new TriggerManager2(
            this.scene,
            this.canvas,
        );

        this.CreateEnvironment().then(async () => {
            this.engine.hideLoadingUI();

            const page1 = this.dialogPage.addText("Привет! Здесь ты можешь посмотреть информацию о сооружениях но перед этим пройди обучение по передвижению.", async () => {
                
                // После завершения печати первого текста вызываем createGui()
                await this.guiManager.createGui();
                
                const page2 = this.dialogPage.addText("aqweqweqweqweqwe qweq qe wqe qwe q qwe qwe qwe w w qweqw eq qweqwe qw eqw eqqwe wewe qwe wqweq we w w qwe qw eqweqw q q q q q q q q qweqwweqwe qwe wq qsssssssssssssdasdasd sd asd asd sdsd a sdsdasdasdasd asd asd asd asdsdsd asd asd asd sdsdsdsd as a asdds asd asd asd    Нажимая правой кнопкой мыши на подсвеченные объекты, ты можешь узнать про них информацию.\nСиним подсвечиваются те, на которые ты уже кликал.\nВ левом верхнем углу общее количество кликабельных сооружений.")
                this.guiManager.CreateDialogBox([page2]);
              })
 
            this.guiManager.CreateDialogBox([page1]);
          }
        );


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
            "/models/railway_bridges_4k.hdr",
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
        this.camera = new FreeCamera("camera", new Vector3(15, 3, 0), this.scene);
        this.camera.attachControl(this.canvas, true);
    
        // Настройки камеры
        this.camera.applyGravity = false;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.camera.minZ = 0.45;
        this.camera.speed = 0.55;
        this.camera.angularSensibility = 4000;
        this.camera.rotation.y = -Math.PI / 2;
        this.camera.keysUp.push(87); // W
        this.camera.keysLeft.push(65); // A
        this.camera.keysDown.push(83); // S
        this.camera.keysRight.push(68); // D
    
        // Отключаем стандартное управление камерой при использовании мыши
        this.camera.inputs.removeByType("FreeCameraMouseInput");
    
        // Создаем кастомный ввод для управления камерой по левому клику
        const customMouseInput = new FreeCameraMouseInput();
        customMouseInput.buttons = [0]; // Только левая кнопка мыши (0 - левая, 1 - средняя, 2 - правая)
    
        // Добавляем кастомный ввод к камере
        this.camera.inputs.add(customMouseInput);
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

            // Определение группированных мешей
            const meshGroups = [
                {
                    groupName: "SpanStructureBeam_L_7",
                    baseName: "SM_0_SpanStructureBeam_L_7",
                },
                {
                    groupName: "SpanStructureBeam_L_4",
                    baseName: "SM_0_SpanStructureBeam_L_4",
                },
                {
                    groupName: "Retaining_wall_Block_LP_L_5",
                    baseName: "SM_0_Retaining_wall_Block_LP_L",
                },
                // Добавьте дополнительные группы по необходимости
            ];

            meshGroups.forEach((group) => {
                this.groupNameToBaseName[group.groupName] = group.baseName;
            });

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
                //Просто дорога сверху
                "SM_0_Road_1_R",
                //Бетонка по середине НьюДжерси
                "SM_ConcreteFence_LP.002",
                //Плита переходная
                "SM_0_TransitionPlate8M_LP_L_primitive0",
                // Добавьте дополнительные одиночные меши по необходимости
            ];

            // Объединяем группы и одиночные меши в один список
            const allMeshes = [
                ...meshGroups.map((group) => ({ type: "group", data: group })),
                ...singleMeshNames.map((name) => ({ type: "single", data: name })),
            ];

            // Обрабатываем все меши
            allMeshes.forEach((item) => {
                if (item.type === "group") {
                    const group = item.data;
                    const groupMeshes = map.filter(
                        (mesh) =>
                            mesh.name === group.baseName ||
                            mesh.name.startsWith(`${group.baseName}`)
                    );
                    console.log(groupMeshes);
                    

                    if (groupMeshes.length > 0) {
                        // Подсвечиваем все меши группы зеленым
                        groupMeshes.forEach((mesh) => {
                            this.greenHighlightLayer.addMesh(mesh, Color3.Green());
                            this.greenHighlightLayer.outerGlow = false;
                            (mesh as any).isClicked = false;
                        });

                        // Устанавливаем обработчик клика для каждого меша группы
                        groupMeshes.forEach((mesh) => {
                            this.triggerManager.setupModalInteraction(mesh, () => {
                                if (!(mesh as any).isClicked) {
                                    // Увеличиваем счетчик только при первом клике на группу
                                    this.clickedMeshes++;
                                    this.updateCounter();
                                    // Меняем цвет всех мешей группы на синий
                                    groupMeshes.forEach((m) => {
                                        this.greenHighlightLayer.removeMesh(m);
                                        this.blueHighlightLayer.addMesh(m, Color3.Blue());
                                        this.blueHighlightLayer.outerGlow = false;
                                        (m as any).isClicked = true;
                                    });
                                }
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
                        this.greenHighlightLayer.addMesh(mesh, Color3.Green());
                        this.greenHighlightLayer.outerGlow = false;
                        (mesh as any).isClicked = false;

                        this.triggerManager.setupModalInteraction(mesh, () => {
                            if (!(mesh as any).isClicked) {
                                this.clickedMeshes++;
                                this.updateCounter();
                                this.greenHighlightLayer.removeMesh(mesh);
                                this.blueHighlightLayer.addMesh(mesh, Color3.Blue());
                                this.blueHighlightLayer.outerGlow = false;
                                (mesh as any).isClicked = true;
                            }
                            if (this.openModal) {
                                this.openModal(keyword);
                            }
                        });
                    } else {
                        console.warn(`Меш с именем "${keyword}" не найден.`);
                    }
                }
            });

            // Устанавливаем общее количество мешей для взаимодействия
            this.totalMeshes = allMeshes.length;

            // Создаем GUI после установки totalMeshes
            this.CreateGUI();

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
        this.counterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.counterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.counterText.paddingLeft = "20px";
        this.counterText.paddingTop = "20px";
        this.guiTexture.addControl(this.counterText);

        console.log("Счетчик инициализирован:", this.counterText.text);
    }

    // Метод для обновления счетчика кликов
    private updateCounter(): void {
        this.counterText.text = `${this.clickedMeshes} из ${this.totalMeshes}`;
    }

}


  
  
  
  
  
  
  
  
  
  
  
  
  