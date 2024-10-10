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
        new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

        const framesPerSecond = 60;
        const gravity = -9.81;
        scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
        scene.collisionsEnabled = true;

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
                this.interactionObject = mesh; // Сохраняем ссылку на объект
            this.switchToSecondaryCamera(interactionObject); // Передаем interactionObject для переключения камеры
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
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Лестница кликнута:", mesh.name);
                    this.interactionObject = mesh; // Сохраните ссылку на объект
                    this.switchToSecondaryCamera(new InteractionObject(mesh)); // Передаем interactionObject для переключения камеры
                })
            );
        });

        
        // Дополнительная фильтрация по именам "broken" и "whole"
        this.targetMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
        this.targetMeshes = mapMeshes.filter((mesh) => mesh.name.toLowerCase().includes("whole"));

        // Сделать все меши с "broken" видимыми
    this.targetMeshes.forEach((mesh) => {
        mesh.visibility = 1; // Полностью видимый
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
            this.interactionObject = mesh; // Сохраняем ссылку на объект
        this.switchToSecondaryCamera(interactionObject); // Передаем interactionObject для переключения камеры
        });
        
    });

    // Сделать все меши с "whole" невидимыми
    this.targetMeshes.forEach((mesh) => {
        mesh.visibility = 0; // Полностью невидимый
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
        const position = interactionObject.getMesh().position; // Получаем позицию меша
        if (this.secondaryCamera) {
    this.secondaryCamera.position = new Vector3(position.x + 4, position.y + 2, position.z + 0); // Позиция рядом с лестницей
} else {
    console.error("Вторичная камера не инициализирована.");
    
}       // Позиция рядом с лестницей
        if (this.secondaryCamera) {
    this.secondaryCamera.setTarget(new Vector3(position.x, position.y + 1, position.z)); // Камера нацелена чуть выше объекта
} else {
    console.error("Вторичная камера не инициализирована.");
}       
        // Камера нацелена чуть выше объекта
        this.scene.activeCamera = this.secondaryCamera;

        // Включаем управление камерой через мышь
        if (this.secondaryCamera) {
        this.secondaryCamera.attachControl(this.canvas, true); // Второй параметр — это опция "noPreventDefault"
        } else {
        console.error("Вторичная камера не инициализирована.");
        } // Второй параметр — это опция "noPreventDefault"
    
        // Настраиваем параметры вращения камеры
        if (this.secondaryCamera) {
    this.secondaryCamera.angularSensibility = 800; // Регулируем чувствительность вращения
} else {
    console.error("Вторичная камера не инициализирована.");
}


        // Скрываем модель Caja_-_Superior_1_pieza.stl
        if (this.handModel) {
        this.handModel.isVisible = false;
    }

        // Включаем измерение расстояния
        this.enableDistanceMeasurement();
        console.log("Камера переключена на вторую камеру");




 // Создаем GUI
 const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
 const questionText = new TextBlock();
 questionText.text = "Выберите правильный ответ:";
 questionText.color = "white";
 questionText.fontSize = 24;
 questionText.height = "50px";
 questionText.top = "-200px";
 advancedTexture.addControl(questionText);

 const correctAnswer = "Ответ 2"; // Правильный ответ

 // Функция для создания кнопки ответа
 const createAnswerButton = (answerText: string, topPosition: string) => {
     const button = Button.CreateSimpleButton("answer", answerText);
     button.width = "200px";
     button.height = "60px";
     button.color = "white";
     button.background = "blue";
     button.top = topPosition;
     button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
     button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
     advancedTexture.addControl(button);

     button.onPointerClickObservable.add(() => {
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

         // Создаем 4 кнопки с разными вариантами ответов
            createAnswerButton("Ответ 1", "-100px");
            createAnswerButton("Ответ 2", "-20px");
            createAnswerButton("Ответ 3", "60px");
            createAnswerButton("Ответ 4", "140px");













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





Точки должны быть одного цвета, клик по 2 точкам.
высота проёма должна тоже фиксироваться.




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




    const createClickablePoint = (position) => {
            const point = BABYLON.MeshBuilder.CreateSphere("clickablePoint", { diameter: 0.1 }, this.scene);
            point.position = position;
            point.checkCollisions = true;
            point.isPickable = true;
            point.actionManager = new ActionManager(this.scene);
            point.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Точка кликнута:", point.position);
                    this.switchToSecondaryCamera(new InteractionObject(point));
                })
            );
        
            // Задаем цвет точки
            const material = new BABYLON.StandardMaterial("pointMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Красный цвет
            point.material = material;
        
            return point;
        };



            // Создаем кликабельные точки с фиксированными смещениями
    createClickablePoint(mesh.position.add(new BABYLON.Vector3(0, 0.5, 0))); // Точка над мешом
    createClickablePoint(mesh.position.add(new BABYLON.Vector3(0, -0.5, 0))); // Точка под мешом











Сценарий для третей камеры
    ShowScenarioSelection(): void {
        console.log("Инициализация меню с кнопками для выбора сценария");

        // Создаем меню с кнопками для выбора сценария
        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        console.log("Fullscreen UI создано");

        // Кнопка для 1-го сценария (secondaryCamera)
        const button1 = Button.CreateSimpleButton("btn1", "Сценарий 1");
        button1.width = "150px";
        button1.height = "40px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerClickObservable.add(() => {
            console.log("Кнопка Сценарий 1 нажата");
            this.SwitchToCamera(this.secondaryCamera);
            console.log("Переключено на secondaryCamera");
            advancedTexture.dispose(); // Убираем меню после выбора
            console.log("Меню удалено");
        });

        // Кнопка для 2-го сценария (thirdCamera)
        const button2 = Button.CreateSimpleButton("btn2", "Сценарий 2");
        button2.width = "150px";
        button2.height = "40px";
        button2.color = "white";
        button2.background = "blue";
        button2.onPointerClickObservable.add(() => {
            console.log("Кнопка Сценарий 2 нажата");
            this.CreateThirdCamera();
            console.log("Создана thirdCamera");
            advancedTexture.dispose(); // Убираем меню после выбора
            console.log("Меню удалено");
        });

        // Расположение кнопок
        button1.top = "-50px";
        button2.top = "50px";

        // Добавляем кнопки на экран
        advancedTexture.addControl(button1);
        advancedTexture.addControl(button2);
        console.log("Кнопки добавлены на экран");
    }

    CreateThirdCamera(): void {
        if (this.secondaryCamera) {
            console.log("Создание thirdCamera на основе secondaryCamera");
            this.thirdCamera = new FreeCamera("thirdCamera", this.secondaryCamera.position.clone(), this.scene);
            this.thirdCamera.setTarget(this.secondaryCamera.getTarget());
            this.SwitchToCamera(this.thirdCamera);
            console.log("Переключено на thirdCamera");
        } else {
            console.error("Ошибка: secondaryCamera не определена");
        }
    }

    SwitchToCamera(camera: FreeCamera | null): void {
        if (camera) {
            console.log(`Переключение на камеру: ${camera.name}`);
            this.scene.activeCamera = camera;
            camera.attachControl(this.canvas, true);
        } else {
            console.error("Ошибка: камера не передана для переключения");
        }
    }

