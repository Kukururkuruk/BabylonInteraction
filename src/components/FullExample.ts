import {
    Scene,
    Engine,
    SceneLoader,
    Vector3,
    HemisphericLight,
    FreeCamera,
    Ray,
    AbstractMesh,
    RayHelper,
    Color3, // Импортируем Ray для создания луча
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from 'cannon-es'; // Используйте одну версию Cannon.js
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'; // Импортируем PhysicsImpostor
import { GUIManager } from '../components/GUIManager'; // Путь к GUIManager
import { TriggersManager } from '../components/TriggerManager'; // Путь к TriggerManager
export class FullExample {
    scene: Scene;
    engine: Engine;
    guiManager: GUIManager; // Добавляем GUIManager
    triggerManager: TriggersManager
    textMessages: string[] = ["Нажмите на W", "Нажмите на S", "Нажмите на A", "Нажмите на D", "А теперь осмотритесь по комнате"];
    targetMeshes: AbstractMesh[] = [];

    constructor(private canvas: HTMLCanvasElement) {
        this.engine = new Engine(this.canvas, true);
        this.scene = this.CreateScene();

        // Инициализация GUIManager и передача данных
        this.guiManager = new GUIManager(this.scene, this.textMessages);
        this.triggerManager = new TriggersManager(this.scene, this.canvas)

        this.CreateEnvironment();
        this.CreateController();

        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.targetMeshes.forEach(mesh => {
                this.triggerManager.enableClickInteraction(mesh);
                // пока подумать, возможно чет не то
            });
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
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Map_1.gltf",
            this.scene
        );

        meshes.forEach((mesh) => {
            mesh.checkCollisions = true;
          });

        this.targetMeshes = meshes.filter(mesh => mesh.name.toLowerCase().includes("box"));

        console.log("Нужный меш:", this.targetMeshes);

        this.targetMeshes.forEach(mesh => {
            mesh.checkCollisions = true;
            this.createRayAboveMesh(mesh);
            this.guiManager.createButtonAboveMesh(mesh);
            this.triggerManager.setupProximityTrigger(mesh, () => {
                console.log("Camera intersected with the ramp!");
                // alert("Camera reached the ramp!");
                // this.guiManager.loadGUISnippet();
            });
            this.triggerManager.enableClickInteraction(mesh);
        });

        console.log(meshes);

        this.guiManager.createGui();
    }

    CreateController(): void {
        const camera = new FreeCamera("camera", new Vector3(20, 100, 0), this.scene);
        camera.attachControl(this.canvas, false);

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

         // Настройка гравитации для сцены и камеры
        this.scene.gravity = new Vector3(0, -0.98, 0);
        camera.needMoveForGravity = true;

          // Включаем коллизии для объектов сцены
        this.scene.collisionsEnabled = true;

        // Применение коллизий к земле или моделям
        const ground = this.scene.getMeshByName("ground"); // например, если у вас есть меш "ground"
        if (ground) {
        ground.checkCollisions = true;
        }


        // Пример для других объектов
        const mesh = this.scene.getMeshByName("yourMesh");
        if (mesh) {
        mesh.checkCollisions = true;
        }



        // Подключение физики к сцене
        this.scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, CANNON)); // Использование Cannon.js

        // Установка физического тела для модели
        const groundMesh = this.scene.getMeshByName("ground");
        if (groundMesh) {
        groundMesh.physicsImpostor = new PhysicsImpostor(groundMesh, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 });
}

        const complexModel = this.scene.getMeshByName("complexModel");
        if (complexModel) {
        complexModel.physicsImpostor = new PhysicsImpostor(complexModel, PhysicsImpostor.MeshImpostor, { mass: 1 });
}


    }

    // Функция для создания луча над мешом
    createRayAboveMesh(mesh: AbstractMesh): void {
        // Используем мировую позицию меша, учитывая его родителя
        const rayOrigin = mesh.getAbsolutePosition().clone(); 
        const rayDirection = new Vector3(0, 1, 0); // Направление луча (вверх)

    
        // Создаем луч
        const rayLength = 10; // или другое подходящее значение
        const ray = new Ray(rayOrigin, rayDirection, rayLength);
    
        // При желании можно визуализировать луч, используя debug слой
        const rayHelper = new RayHelper(ray);
        rayHelper.show(this.scene, new Color3(1, 0, 0)); // Красный цвет для визуализации
    }
}
