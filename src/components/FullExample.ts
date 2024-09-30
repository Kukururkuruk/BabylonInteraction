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
  PointerDragBehavior,
  PointerEventTypes,
  Axis,
  Space,
  MeshBuilder,
  Mesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from 'cannon-es'; 
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'; 
import { GUIManager } from '../components/GUIManager'; 
import { TriggersManager } from '../components/TriggerManager'; 
import { AdvancedDynamicTexture, Button, TextBlock } from "@babylonjs/gui";
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";


export class FullExample {
    scene: Scene;
    engine: Engine;
    guiManager: GUIManager;
    triggerManager: TriggersManager;
    textMessages: string[] = ["Нажмите на W", "Нажмите на S", "Нажмите на A", "Нажмите на D", "А теперь осмотритесь по комнате"];
    targetMeshes: AbstractMesh[] = [];
    handModel: AbstractMesh | null = null; 
    rulerModel: AbstractMesh | null = null;  // Добавлено для линейки
    selectedSize: number | null = null;

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
    
        mapMeshes.forEach((mesh) => {
            mesh.checkCollisions = true;
        });
    
        this.targetMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("box"));
    
        this.targetMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            this.createRayAboveMesh(mesh);
            this.guiManager.createButtonAboveMesh(mesh);
    
            // Создание объекта взаимодействия
            const interactionObject = new InteractionObject(this.scene, mesh.position);
    
            // Настройка зоны взаимодействия (триггер по близости)
            this.triggerManager.setupProximityTrigger(mesh, () => {
                console.log("Камера вошла в зону триггера лестницы:", mesh.name);
                // Здесь можно добавить логику, которая срабатывает при входе в зону триггера
            });
    
            // Включение клика на объекте
            this.triggerManager.enableClickInteraction(interactionObject.getMesh());
    
            // Настройка подсветки
            this.triggerManager.setupClickTrigger(mesh, () => {
                console.log("Лестница была кликнута:", mesh.name);
                // Здесь можно добавить дополнительную логику для обработки клика
            });
        });

        // Загрузка модели лестницы и размещение по центру
        const { meshes: stairMeshes } = await SceneLoader.ImportMeshAsync("", "./models/", "SM_Stairs_base512X512.gltf", this.scene);
        
        stairMeshes.forEach((mesh) => {
            mesh.checkCollisions = true;
            mesh.isPickable = true; // Убедитесь, что меш можно выбрать
            mesh.position = new Vector3(0, 0, 0);
            mesh.isVisible = true; // Убедитесь, что меш видим
            mesh.setEnabled(true); // Убедитесь, что меш активен
            mesh.actionManager = new ActionManager(this.scene);
            mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log("Лестница кликнута:", mesh.name);
        })
    );
});

        this.guiManager.createGui();
        await this.CreateHandModel(); // Загружаем модель руки
        await this.CreateRulerModel(); // Загружаем модель линейки
    }

    async CreateHandModel(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Caja_-_Superior_1_pieza.stl", this.scene);
        this.handModel = meshes[0];
        this.handModel.position = new Vector3(0, 0, 0);
        this.handModel.scaling = new Vector3(0.03, 0.03, 0.03); // Измените значения по осям X, Y, Z для нужного масштаба
        this.attachHandToCamera(); 

        this.handModel.physicsImpostor = new PhysicsImpostor(this.handModel, PhysicsImpostor.MeshImpostor, {
            mass: 0,
            friction: 0,
            restitution: 0
        });
        // Проверьте, где находится камера
        console.log(this.scene.activeCamera?.position); 
    }

    async CreateRulerModel(): Promise<void> { // Новый метод для загрузки линейки
        const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "Caja_-_Superior_1_pieza.stl", this.scene); // Путь к модели линейки
        this.rulerModel = meshes[0];
        this.rulerModel.position = new Vector3(0, 0, 0);
        this.rulerModel.scaling = new Vector3(0.3, 0.3, 0.3); // Размер линейки
        this.rulerModel.isVisible = false; // Скрываем линейку изначально
    }

    attachHandToCamera(): void {
        if (this.handModel) {
            const camera = this.scene.getCameraByName("camera") as FreeCamera;
            this.handModel.parent = camera;
            this.handModel.position = new Vector3(0.5, -1, 4);
            this.handModel.rotation.x += Math.PI / 2; // 90 градусов в радианах
            this.handModel.scaling = new Vector3(0.02, 0.02, 0.02);
        }
    }

    CreateController(): void {
        const camera = new FreeCamera("camera", new Vector3(20, 100, 0), this.scene);
        camera.attachControl(this.canvas, true);

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

        const ground = this.scene.getMeshByName("ground");
        if (ground) {
            ground.checkCollisions = true;
        }

        this.scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, CANNON));
    }

    activateRuler(mesh: AbstractMesh): void {
        console.log("Активирована линейка для меша:", mesh.name);
        this.guiManager.showRulerInterface(["3 см", "5 см", "10 см"]);

        const startPoint = mesh.getAbsolutePosition();
        const endPoint = startPoint.add(new Vector3(0, 0, 3)); 

        this.createRuler(startPoint, endPoint);

        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const panel = new TextBlock();
        panel.text = "Выберите размер дефекта: 3 см, 5 см или 10 см";
        panel.color = "white";
        panel.fontSize = 24;
        advancedTexture.addControl(panel);

        const button3 = Button.CreateSimpleButton("but3", "3 см");
        button3.onPointerClickObservable.add(() => this.selectSize(3, advancedTexture));
        advancedTexture.addControl(button3);

        const button5 = Button.CreateSimpleButton("but5", "5 см");
        button5.onPointerClickObservable.add(() => this.selectSize(5, advancedTexture));
        advancedTexture.addControl(button5);

        const button10 = Button.CreateSimpleButton("but10", "10 см");
        button10.onPointerClickObservable.add(() => this.selectSize(10, advancedTexture));
        advancedTexture.addControl(button10);

        this.attachRulerToHand(); // Привязываем линейку к руке
    }

    createRuler(start: Vector3, end: Vector3): void {
        if (this.rulerModel) {
            const ruler = this.rulerModel.clone("rulerClone");
            ruler.position = Vector3.Lerp(start, end, 0.5);
            ruler.lookAt(end);
            ruler.isVisible = true; // Показываем линейку
        }
    }

    selectSize(size: number, advancedTexture: AdvancedDynamicTexture): void {
        this.selectedSize = size;
        advancedTexture.dispose(); // Убираем интерфейс
        console.log("Выбранный размер дефекта:", this.selectedSize);
        // Дополнительная логика для обработки выбранного размера
    }

    attachRulerToHand(): void {
        if (this.rulerModel && this.handModel) {
            this.rulerModel.parent = this.handModel;
            this.rulerModel.position = new Vector3(0.5, -1, 0); // Позиция относительно руки
            this.rulerModel.rotation.y = Math.PI / 2; // Поворот линейки
        }
    }

    createRayAboveMesh(mesh: AbstractMesh): void {
        const rayHelper = new RayHelper();
        const ray = mesh.getBoundingInfo().boundingBox.centerWorld.add(new Vector3(0, 1, 0)); // Начало луча
        rayHelper.add(ray, new Vector3(0, -1, 0), 100); // Длина луча
        rayHelper.show(this.scene);
    }



         
}
