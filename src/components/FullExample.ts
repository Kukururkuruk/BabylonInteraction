import {
    Scene,
    Engine,
    SceneLoader,
    Vector3,
    HemisphericLight,
    FreeCamera,
    ActionManager,
    ExecuteCodeAction,
    AbstractMesh,
    Ray,
    MeshBuilder,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from 'cannon-es'; 
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'; 
import { GUIManager } from '../components/GUIManager'; 
import { TriggersManager } from '../components/TriggerManager'; 
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { AdvancedDynamicTexture, TextBlock, Button, Control } from "@babylonjs/gui";
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture";


// Определение класса InteractionObject
export class InteractionObject {
    private mesh: AbstractMesh; // Сохраняем ссылку на меш

    constructor(mesh: AbstractMesh) {
        this.mesh = mesh; // Инициализируем меш
    }

    getMesh(): AbstractMesh {
        return this.mesh; // Возвращаем меш
    }
}

export class FullExample {
    scene: Scene;
    engine: Engine;
    guiManager: GUIManager;
    triggerManager: TriggersManager;
    secondaryCamera: FreeCamera | null = null; // Инициализируем с null
    textMessages: string[] = ["Нажмите на W", "Нажмите на S", "Нажмите на A", "Нажмите на D", "А теперь осмотритесь по комнате"];
    targetMeshes: AbstractMesh[] = [];
    handModel: AbstractMesh | null = null; 
    rulerModel: AbstractMesh | null = null;  
    selectedSize: number | null = null;
    interactionObject: AbstractMesh | null = null; // Объявите interactionObject с типом
    firstPoint: Vector3 | null = null;
    secondPoint: Vector3 | null = null;
    measuringDistance: boolean = false; // Флаг, указывающий, что мы находимся в процессе измерения

    constructor(private canvas: HTMLCanvasElement) {
        this.engine = new Engine(this.canvas, true);
        this.scene = this.CreateScene();

        // Инициализация GUIManager и TriggersManager
        this.guiManager = new GUIManager(this.scene, this.textMessages);
        this.triggerManager = new TriggersManager(this.scene, this.canvas);

        this.CreateEnvironment();
        this.CreateController();

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    CreateScene(): Scene {
        const scene = new Scene(this.engine);
        new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

        

        // Настройка физической среды
        const framesPerSecond = 60;
        const gravity = -9.81;
        scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
        scene.collisionsEnabled = true;
        const hdrTexture = new HDRCubeTexture("./models/cape_hill_4k.hdr", scene, 512);
        scene.environmentTexture = hdrTexture;
        scene.createDefaultSkybox(hdrTexture, true, 1000);  // Последний параметр - размер skybox
        scene.environmentIntensity = 0.5;

        

        return scene;
    }

    async CreateEnvironment(): Promise<void> {
        // Загрузка основной карты
        const { meshes: mapMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
        // Фильтрация мешей по названию "stairs"
    this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("stairs"));
    
        mapMeshes.forEach((mesh) => {
            mesh.checkCollisions = true;
        });
    
        this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("box"));
    
        this.targetMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            this.createRayAboveMesh(mesh);
            this.guiManager.createButtonAboveMesh(mesh);
    
            // Создание объекта взаимодействия
            const interactionObject = new InteractionObject(mesh); // Создаем объект взаимодействия
            this.triggerManager.setupProximityTrigger(mesh, () => {
                console.log("Камера вошла в зону триггера лестницы:", mesh.name);
                this.switchToSecondaryCamera(interactionObject); // Передаем interactionObject для переключения камеры
            });
    
            // Включение клика на объекте
            this.triggerManager.enableClickInteraction(interactionObject.getMesh());
    
            // Настройка подсветки
            this.triggerManager.setupClickTrigger(mesh, () => {
                console.log("Лестница была кликнута:", mesh.name);

            });
        });

        // Загрузка модели лестницы и размещение по центру
        const { meshes: stairMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_Stairs_base512X512.gltf", this.scene);
        
        stairMeshes.forEach((mesh) => {
            mesh.checkCollisions = true;
            mesh.isPickable = true; 
            mesh.position = new Vector3(0, 0, 0);
            mesh.isVisible = true; 
            mesh.setEnabled(true); 
            mesh.actionManager = new ActionManager(this.scene);
            // Создаем объект InteractionObject для данного меша
            const interactionObject = new InteractionObject(mesh);
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Лестница кликнута:", mesh.name);
                    // Привязываем к interactionObject выбранный mesh
                    this.interactionObject = interactionObject.getMesh(); // Сохраняем ссылку на объект
                    this.switchToSecondaryCamera(new InteractionObject(mesh)); // Передаем interactionObject для переключения камеры
                })
            );
        });

        // Работа с мешами типа "broken"
    const brokenMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
    brokenMeshes.forEach((mesh) => {
        mesh.checkCollisions = true;
        mesh.isPickable = true;
        mesh.isVisible = true; // Делаем видимым
        mesh.setEnabled(true);
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                console.log("Broken меш кликнут:", mesh.name, "Координаты:", mesh.position);
                this.interactionObject = mesh;
                this.switchToSecondaryCamera(new InteractionObject(mesh));
            })
        );
    });

    // Работа с мешами типа "whole"
    const wholeMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("whole"));
    wholeMeshes.forEach((mesh) => {
        mesh.checkCollisions = true;
        mesh.isPickable = true;
        mesh.visibility = 0; // Делаем невидимым
        mesh.setEnabled(true);
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                console.log("Whole меш кликнут:", mesh.name, "Координаты:", mesh.position);
                this.interactionObject = mesh;
                this.switchToSecondaryCamera(new InteractionObject(mesh));
                
            })
        );
    });



        this.guiManager.createGui();
        await this.CreateHandModel(); 
        await this.CreateRulerModel(); 
    }

    async CreateHandModel(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Caja_-_Superior_1_pieza.stl", this.scene);
        this.handModel = meshes[0];
        this.handModel.position = new Vector3(0, 0, 0);
        this.handModel.scaling = new Vector3(0.03, 0.03, 0.03); 
        this.attachHandToCamera(); 

        this.handModel.physicsImpostor = new PhysicsImpostor(this.handModel, PhysicsImpostor.MeshImpostor, {
            mass: 0,
            friction: 0,
            restitution: 0
        });
    }

    async CreateRulerModel(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Caja_-_Superior_1_pieza.stl", this.scene);
        this.rulerModel = meshes[0];
        this.rulerModel.position = new Vector3(0, 0, 0);
        this.rulerModel.scaling = new Vector3(0.3, 0.3, 0.3); 
        this.rulerModel.isVisible = false; 
    }

    attachHandToCamera(): void {
        if (this.handModel) {
            const camera = this.scene.getCameraByName("camera") as FreeCamera;
            this.handModel.parent = camera;
            this.handModel.position = new Vector3(0.5, -1, 4);
            this.handModel.rotation.x += Math.PI / 2; 
            this.handModel.scaling = new Vector3(0.02, 0.02, 0.02);
        }
    }

    CreateController(): void {
        const camera = new FreeCamera("camera", new Vector3(20, 100, 0), this.scene);
        camera.attachControl(this.canvas, true);
        this.scene.activeCamera = camera;

        camera.applyGravity = true;
        camera.checkCollisions = true;
        camera.ellipsoid = new Vector3(1, 2, 1);
        camera.minZ = 0.45;
        camera.speed = 0.75;
        camera.angularSensibility = 4000;
        camera.keysUp.push(87); // W
        camera.keysLeft.push(65); // A
        camera.keysDown.push(83); // S
        camera.keysRight.push(68); // D

        this.scene.gravity = new Vector3(0, -0.98, 0);
        camera.needMoveForGravity = true;
        // Инициализация второй камеры
        this.secondaryCamera = new FreeCamera("secondaryCamera", new Vector3(0, 5, -10), this.scene);
        this.secondaryCamera.setTarget(Vector3.Zero());
    

        const ground = this.scene.getMeshByName("ground");
        if (ground) {
            ground.checkCollisions = true;
        }

        this.scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, CANNON));

        // Обработчик нажатия клавиши для возврата к основной камере
        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape") { // Измените на нужную вам клавишу
                this.switchToMainCamera(camera);
            }
        });
    }

    // Метод для переключения на основную камеру
    switchToMainCamera(camera: FreeCamera): void {
        this.scene.activeCamera = camera;


        // Отключаем управление вторичной камерой
        // Отключаем управление вторичной камерой, если она не равна null
        if (this.secondaryCamera) {
        this.secondaryCamera.detachControl(); // Вызываем без аргументов
    }


        // Включаем видимость модели Caja_-_Superior_1_pieza.stl
        if (this.handModel) {
        this.handModel.isVisible = true;
    }
         // Отключаем измерение расстояния
        this.disableDistanceMeasurement();
        console.log("Камера переключена обратно на основную камеру");
    }
        disableDistanceMeasurement(): void {
        this.measuringDistance = false;
        this.scene.onPointerDown = undefined; // Отключаем обработку кликов
    }

    switchToSecondaryCamera(interactionObject: InteractionObject): void {
        const mesh = interactionObject.getMesh();
        const position = mesh.position; // Получаем позицию меша
        
        
        // Установим значения смещений и углы камеры в зависимости от типа объекта
        let offsetX = 4, offsetY = 2, offsetZ = 5; // Смещения по умолчанию
        let targetYOffset = 1; // Смещение по оси Y для цели по умолчанию (камера нацелена чуть выше объекта)
    
        // Определение типа объекта по его имени
        if (mesh.name.toLowerCase().includes("whole")) {
            offsetX = -10; // Увеличиваем смещение по оси X
            offsetY = 6; // Камера выше
            offsetZ = -5; // Камера дальше
            targetYOffset = 1.5; // Камера нацелена чуть выше объекта "whole"
        } else if (mesh.name.toLowerCase().includes("broken")) {
            offsetX = -10; // Среднее смещение по оси X
            offsetY = 6; // Камера чуть выше объекта
            offsetZ = -5; // Камера чуть ближе
            targetYOffset = 1; // Камера нацелена чуть выше объекта "broken"
        } else if (mesh.name.toLowerCase().includes("stairs")) {
            offsetX = 4; // Стандартное смещение по оси X
            offsetY = 2; // Камера на обычной высоте
            offsetZ = 0; // Стандартное расстояние
            targetYOffset = 1; // Камера нацелена чуть выше объекта "stairs"
        }
        
    
        if (this.secondaryCamera) {
            // Устанавливаем позицию камеры относительно объекта
            this.secondaryCamera.position = new Vector3(position.x + offsetX, position.y + offsetY, position.z - offsetZ);
    
            // Камера нацелена на объект
            this.secondaryCamera.setTarget(new Vector3(position.x, position.y + targetYOffset, position.z));
    
            // Переключаем активную камеру на вторичную
            this.scene.activeCamera = this.secondaryCamera;
    
            // Включаем управление камерой через мышь
            this.secondaryCamera.attachControl(this.canvas, true); // true для разрешения захвата мыши
    
            // Настраиваем параметры вращения камеры (можете изменить чувствительность, если требуется)
            this.secondaryCamera.angularSensibility = 800; // Чувствительность вращения камеры
        } else {
            console.error("Вторичная камера не инициализирована.");
        }

        
        // Скрываем модель руки, если она есть
        if (this.handModel) {
            this.handModel.isVisible = false;
        }
        
        

        // Включаем измерение расстояния, если нужно
        this.enableDistanceMeasurement();
    
        console.log(`Камера переключена на вторичную камеру, цель: ${mesh.name}`);
    
    




 // Создаем GUI
 const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
 const questionText = new TextBlock();
 questionText.text = "Выберите правильный ответ:";
 questionText.color = "white";
 questionText.fontSize = 24;
 questionText.height = "50px";
 questionText.top = "-200px";
 advancedTexture.addControl(questionText);

 const correctAnswer = "Ответ 48 сантиметров"; // Правильный ответ

 // Функция для создания кнопки ответа
 const createAnswerButton = (answerText: string, leftPosition: string) => {
    const button = Button.CreateSimpleButton("answer", answerText);
    button.width = "200px";
    button.height = "60px";
    button.color = "white";
    button.background = "blue";
    button.left = leftPosition; // Устанавливаем положение кнопки по горизонтали
    button.top = "-10px"; // Отступ от нижнего края экрана (с отрицательным значением, чтобы кнопки не были слишком высоко)
    button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // Выравнивание по левому краю
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM; // Выравнивание по нижнему краю экрана

    advancedTexture.addControl(button);

    button.onPointerClickObservable.add(() => {
        console.log(`Нажата кнопка: ${answerText}, правильный ответ: ${correctAnswer}`);
        if (answerText === correctAnswer) {
            console.log("Правильный ответ!");
            questionText.text = "Правильный ответ!";
        } else {
            console.log("Неправильный ответ.");
            questionText.text = "Неправильный ответ.";
        }
        // Удалить все элементы GUI после выбора
        setTimeout(() => {
            advancedTexture.dispose();
        }, 2000); // Убираем через 2 секунды
    });
};

// Создаем 4 кнопки с разными вариантами ответов, расположенными в ряд снизу экрана
const buttonSpacing = 20; // Пробел между кнопками
const buttonWidth = 200; // Ширина кнопки
const startXPosition = (window.innerWidth - (buttonWidth * 4 + buttonSpacing * 3)) / 2; // Центрируем кнопки

// Создаем 4 кнопки с разными вариантами ответов
createAnswerButton("Ответ 52 сантиметров", `${startXPosition}px`); // 1-я кнопка
createAnswerButton("Ответ 50 сантиметров", `${startXPosition + buttonWidth + buttonSpacing}px`); // 2-я кнопка
createAnswerButton("Ответ 48 сантиметров", `${startXPosition + (buttonWidth + buttonSpacing) * 2}px`); // 3-я кнопка
createAnswerButton("Ответ 46 сантиметров", `${startXPosition + (buttonWidth + buttonSpacing) * 3}px`); // 4-я кнопка













    }

    createRayAboveMesh(mesh: AbstractMesh): void {
        // Создаем луч с начальной позицией выше меша и направлением
        const origin = new Vector3(mesh.position.x, mesh.position.y + 1, mesh.position.z);
        const direction = new Vector3(0, 1, 0); // Направление луча (например, вверх)
        
        // Создаем луч
        const ray = new Ray(origin, direction, 5); // Третий аргумент - длина луча
        
        // Используем RayHelper для визуализации луча
        const rayHelper = new RayHelper(ray);
        rayHelper.show(this.scene, new Color3(1, 0, 0)); // Показать луч в сцене
    }

    enableDistanceMeasurement(): void {
        this.measuringDistance = true;
        this.firstPoint = null;
        this.secondPoint = null;
    
        // Обработчик кликов
        this.scene.onPointerDown = (evt, pickResult) => {
            if (pickResult.hit && pickResult.pickedPoint) {
                if (!this.firstPoint) {
                    // Запоминаем первую точку
                    this.firstPoint = pickResult.pickedPoint.clone();
                    console.log("Первая точка:", this.firstPoint);
                } else if (!this.secondPoint) {
                    // Запоминаем вторую точку
                    this.secondPoint = pickResult.pickedPoint.clone();
                    console.log("Вторая точка:", this.secondPoint);
    
                    // Вычисляем расстояние
                    const distance = Vector3.Distance(this.firstPoint, this.secondPoint);
                    console.log("Расстояние между точками:", distance);

                    if (this.firstPoint && this.secondPoint) {
                        const distance = Vector3.Distance(this.firstPoint, this.secondPoint);
                        console.log("Расстояние между точками:", distance);
    
                    // Показываем расстояние через GUI
                    this.guiManager.showDistanceMessage(`Расстояние: ${distance.toFixed(2)} м`);
    
                    // Сброс для нового измерения
                    this.firstPoint = null;
                    this.secondPoint = null;
                }
            }
        };
    }



}
}
