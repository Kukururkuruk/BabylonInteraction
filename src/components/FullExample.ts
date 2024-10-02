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
    MeshBuilder,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from 'cannon-es'; 
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'; 
import { GUIManager } from '../components/GUIManager'; 
import { TriggersManager } from '../components/TriggerManager'; 
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { AdvancedDynamicTexture } from "@babylonjs/gui";

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
    secondaryCamera: FreeCamera; // Вторая камера
    textMessages: string[] = ["Нажмите на W", "Нажмите на S", "Нажмите на A", "Нажмите на D", "А теперь осмотритесь по комнате"];
    targetMeshes: AbstractMesh[] = [];
    handModel: AbstractMesh | null = null; 
    rulerModel: AbstractMesh | null = null;  
    selectedSize: number | null = null;
    interactionObject: AbstractMesh | null = null; // Объявите interactionObject с типом

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
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    console.log("Лестница кликнута:", mesh.name);
                    this.interactionObject = mesh; // Сохраните ссылку на объект
                    this.switchToSecondaryCamera(new InteractionObject(mesh)); // Передаем interactionObject для переключения камеры
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
        this.secondaryCamera.detachControl(this.canvas);
        // Включаем видимость модели Caja_-_Superior_1_pieza.stl
        if (this.handModel) {
        this.handModel.isVisible = true;
    }
        console.log("Камера переключена обратно на основную камеру");
    }

    switchToSecondaryCamera(interactionObject: InteractionObject): void {
        const position = interactionObject.getMesh().position; // Получаем позицию меша
        this.secondaryCamera.position = new Vector3(position.x + 4, position.y + 2, position.z + 0); // Позиция рядом с лестницей
        this.secondaryCamera.setTarget(new Vector3(position.x, position.y + 1, position.z)); // Камера нацелена чуть выше объекта
        this.scene.activeCamera = this.secondaryCamera;

        // Включаем управление камерой через мышь
        this.secondaryCamera.attachControl(this.canvas, true); // Второй параметр — это опция "noPreventDefault"
    
        // Настраиваем параметры вращения камеры
        this.secondaryCamera.angularSensibility = 1000; // Регулируем чувствительность вращения


        // Скрываем модель Caja_-_Superior_1_pieza.stl
        if (this.handModel) {
        this.handModel.isVisible = false;
    }
        console.log("Камера переключена на вторую камеру");
    }

    createRayAboveMesh(mesh: AbstractMesh): void {
        const rayHelper = new RayHelper(new Vector3(mesh.position.x, mesh.position.y + 1, mesh.position.z), new Vector3(0, 5, 11));
        rayHelper.show(this.scene, new Color3(1, 0, 0));
    }
}
