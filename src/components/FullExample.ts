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
    StandardMaterial,
    Color3,
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
    thirdCamera: FreeCamera | null = null;
    textMessages: string[] = [];
    targetMeshes: AbstractMesh[] = [];
    handModel: AbstractMesh | null = null; 
    rulerModel: AbstractMesh | null = null;  
    selectedSize: number | null = null;
    interactionObject: AbstractMesh | null = null; // Объявите interactionObject с типом
    firstPoint: Vector3 | null = null;
    secondPoint: Vector3 | null = null;
    measuringDistance: boolean = false; // Флаг, указывающий, что мы находимся в процессе измерения
    points: AbstractMesh[] = []; // Массив для хранения точек
    advancedTexture: AdvancedDynamicTexture | null = null;

    constructor(private canvas: HTMLCanvasElement) {
        this.engine = new Engine(this.canvas, true);
        this.scene = this.CreateScene();

        // Инициализация GUIManager и TriggersManager
        this.guiManager = new GUIManager(this.scene, []);
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

        // Инициализируем камеры
        this.secondaryCamera = new FreeCamera("secondaryCamera", new Vector3(0, 5, -10), scene);
        this.thirdCamera = new FreeCamera("thirdCamera", new Vector3(10, 5, 0), scene);
        
        // Устанавливаем активную камеру по умолчанию
        scene.activeCamera = this.secondaryCamera;

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



// Координаты точек
const pointsPositions = [
    new Vector3(12.46, 6.3, 4.79),   // Первая точка
    new Vector3(12.46, 6.3, 5.21),   // Вторая точка
    new Vector3(12.46, 6.11, 4.72),     // Третья точка
    new Vector3(12.46, 0.7, 4.72)     // Четвертая точка
    
];


// Создаем точки и применяем одинаковый материал
pointsPositions.forEach((position, index) => {
    // Задаем разные размеры для первой, второй и третьей точки
    const diameter = index === 3 ? 0.05 : 0.01; // Увеличиваем диаметр третьей точки

    const point = MeshBuilder.CreateSphere("point" + index, { diameter: diameter }, this.scene);
    
    // Устанавливаем фиксированное положение точки
    // Используем mesh.position и добавляем координаты для создания точек выше меша
    point.position = mesh.position.add(new Vector3(position.x, position.y , position.z)); 

    // Увеличиваем y для размещения точек выше меша
    //point.position.y += 1; // Поднимаем точки над мешом на 1 единицу

    // Отладочные сообщения
    console.log(`Точка создана на позиции: ${point.position.x}, ${point.position.y}, ${point.position.z}`);

    // Настраиваем материал для точки
    const pointMaterial = new StandardMaterial("pointMaterial" + index, this.scene);
    pointMaterial.emissiveColor = new Color3(0, 1, 0); // Зеленый цвет для лучшей видимости
    point.material = pointMaterial;


    // Убедитесь, что точки изначально скрыты
    this.points.forEach(point => {
    point.isVisible = false; // Принудительно скрываем все точки
    });

    // Делаем точку кликабельной
    point.isPickable = true;
    pointMaterial.wireframe = true; // Использование каркасного материала для проверки видимости
    point.actionManager = new ActionManager(this.scene);
    point.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log("Точка кликнута:", point.name);
            // Здесь можно добавить дополнительную логику для точки
        })
    );
    // Сохраняем точку в массив
    this.points.push(point);

    
});







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

    createQuestionInterface(): void {
        // Проверяем, существует ли уже интерфейс, чтобы избежать повторного создания
        if (this.advancedTexture) {
            return; // Если интерфейс уже создан, выходим из функции
        }
    
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
        // Вопрос
        const questionText = new TextBlock();
        questionText.text = "Что вы хотите сделать?";
        questionText.color = "white";
        questionText.fontSize = 30;
        this.advancedTexture.addControl(questionText);
    
        // Кнопка 1
        const button1 = Button.CreateSimpleButton("button1", "Измерить размер повреждений линейкой");
        button1.width = "150px";
        button1.height = "60px";
        button1.top = "100px";
        button1.left = "-100px";
        button1.color = "white";
        button1.background = "blue";
        button1.onPointerUpObservable.add(() => {
            this.handleButtonClick("Дерево", this.secondaryCamera);
        });
        this.advancedTexture.addControl(button1);
    
        // Кнопка 2
        const button2 = Button.CreateSimpleButton("button2", "Измерить толщину штангенцирулем");
        button2.width = "150px";
        button2.height = "60px";
        button2.top = "100px";
        button2.left = "100px";
        button2.color = "white";
        button2.background = "blue";
        button2.onPointerUpObservable.add(() => {
            this.handleButtonClick("Металл", this.thirdCamera);
        });
        this.advancedTexture.addControl(button2);
    }
    
    handleButtonClick(selectedAnswer: string, targetCamera: FreeCamera | null): void {
        this.checkAnswer(selectedAnswer);
    
        // Переключаем активную камеру
        // Переключаем активную камеру, если она не null
        if (targetCamera) {
            this.scene.activeCamera = targetCamera;
            console.log(`Переключено на ${targetCamera.name || "камера не инициализирована"} при нажатии на кнопку`); // Используем оператор "или"
        } else {
            console.log("Целевая камера не инициализирована");
        }
    
        // Убираем UI после нажатия на кнопку
        if (this.advancedTexture) {
            this.advancedTexture.dispose();
            this.advancedTexture = null; // Обнуляем переменную интерфейса
        }
    
        
    }
    
    checkAnswer(selectedAnswer: string): void {
        const correctAnswer = "Металл"; // Укажите правильный ответ
    
        if (selectedAnswer === correctAnswer) {
            console.log("Правильный ответ!");
        } else {
            console.log("Неправильный ответ. Попробуйте снова.");
        }
    
        // Восстанавливаем активную камеру
        if (this.secondaryCamera) {
            this.scene.activeCamera = this.secondaryCamera;
        } else {
            this.scene.activeCamera = this.thirdCamera;
        }
    }



    async CreateHandModel(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "calipers.stl", this.scene);
        this.handModel = meshes[0];
        this.handModel.position = new Vector3(2, -4.5, 2);
        this.handModel.scaling = new Vector3(5, 5, 5); 
        this.attachHandToCamera(); 

        this.handModel.physicsImpostor = new PhysicsImpostor(this.handModel, PhysicsImpostor.MeshImpostor, {
            mass: 0,
            friction: 0,
            restitution: 0
        });
    }

    async CreateRulerModel(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "calipers.stl", this.scene);
        this.rulerModel = meshes[0];
        this.rulerModel.position = new Vector3(2, -4.5, 2);
        this.rulerModel.scaling = new Vector3(5, 5, 5); 
        this.rulerModel.isVisible = false; 
    }

    attachHandToCamera(): void {
        if (this.handModel) {
            const camera = this.scene.getCameraByName("camera") as FreeCamera;
            this.handModel.parent = camera;
            this.handModel.position = new Vector3(2, -4.5, 2);
            this.handModel.rotation.x += Math.PI / 2; 
            this.handModel.rotation.y = Math.PI / 4;  // Вращение на 45 градусов по Y
            this.handModel.scaling = new Vector3(5, 5, 5);
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

    switchToThirdCamera(): void {
        if (!this.thirdCamera) {
            this.thirdCamera = new FreeCamera("thirdCamera", new Vector3(0, 0, -10), this.scene);
            this.thirdCamera.setTarget(Vector3.Zero());
            this.thirdCamera.attachControl(this.canvas, true);
            this.thirdCamera.fov = 1.2; // Увеличиваем поле зрения для эффекта приближения
    
            // Устанавливаем позицию камеры на меш "broken"
            if (this.interactionObject) {
                this.thirdCamera.position = this.interactionObject.position.add(new Vector3(0, 1, -5)); // Поднимаем на 1 для лучшего вида
                console.log("Камера переключена на объект broken:", this.interactionObject.name);
            }
    
            
        }
    }
    


    // Метод для переключения на основную камеру
    switchToMainCamera(camera: FreeCamera): void {
        this.scene.activeCamera = camera;
    
        // Скрыть точки при переключении на основную камеру
        this.points.forEach(point => point.isVisible = false);
    
        // Отключаем управление вторичной камерой
        if (this.secondaryCamera) {
            this.secondaryCamera.detachControl(); 
        }
    
        // Включаем видимость модели руки
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
        const position = mesh.position;
        
 
        
        // Установим значения смещений и углы камеры в зависимости от типа объекта
        let offsetX = 4, offsetY = 2, offsetZ = 5; // Смещения по умолчанию
        let targetYOffset = 1; // Смещение по оси Y для цели по умолчанию (камера нацелена чуть выше объекта)
        // Определение типа объекта по его имени
        if (mesh.name.toLowerCase().includes("whole")) {
            offsetX = 13.7; // Увеличиваем смещение по оси X
            offsetY = 6.5; // Камера выше
            offsetZ = -5; // Камера дальше
            targetYOffset = 1; // Камера нацелена чуть выше объекта "whole"
        } else if (mesh.name.toLowerCase().includes("broken")) {
            offsetX = 13.7; // Среднее смещение по оси X
            offsetY = 6.5; // Камера чуть выше объекта
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


            // Вызов интерфейса вопросов
            this.createQuestionInterface();

            // Включаем видимость точек
            this.points.forEach(point => point.isVisible = true);

            // Включаем управление камерой через мышь
            this.secondaryCamera.attachControl(this.canvas, true); // true для разрешения захвата мыши
    
            // Настраиваем параметры вращения камеры (можете изменить чувствительность, если требуется)
            this.secondaryCamera.angularSensibility = 800; // Чувствительность вращения камеры


            console.log(`Камера переключена на вторичную камеру, цель: ${mesh.name}`);
        } else {
            console.error("Вторичная камера не инициализирована.");
        }

        
        // Скрываем модель руки, если она есть
         // Скрываем модель руки только если меш не является "whole"
        if (this.handModel && !mesh.name.toLowerCase().includes("whole")) {
        this.handModel.isVisible = false;
        } else if (this.handModel && mesh.name.toLowerCase().includes("whole")) {
        this.handModel.isVisible = true; // Оставляем модель рук видимой
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
                        // Получаем позицию указателя
                        const pointerX = evt.clientX;
                        const pointerY = evt.clientY;
                    
                        console.log(`Клик по координатам: (${pointerX}, ${pointerY})`);
                    
                    // Проверяем, был ли клик правой кнопкой мыши
                    if (evt.button === 2) {
                        console.log("Правый клик.");
        
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
                            // Показываем расстояние через GUI
                            this.guiManager.showDistanceMessage(`Расстояние: ${distance.toFixed(2)} м`);
        
                            // Сброс для нового измерения
                            this.firstPoint = null;
                            this.secondPoint = null;
                }
            }
        }
    } 
    
    else if (evt.button === 0) {
        console.log("Левый клик. Замеры не проводятся.");
    }

        };

    }


}

