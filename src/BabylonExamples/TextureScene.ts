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

export class TextureScene {
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    camera: FreeCamera;
    private guiTexture: AdvancedDynamicTexture;
    mediaRecorder: MediaRecorder | null = null;
    private modelLoader: ModelLoader;
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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(this.canvas, true);
        this.engine.displayLoadingUI();

        this.scene = this.CreateScene();
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

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

        return scene;
    }

    CreateController(): void {
        // Установка начальной позиции камеры для лучшей видимости
        this.camera = new FreeCamera("camera", new Vector3(0, 2, -2), this.scene);
        this.camera.attachControl(this.canvas, true);

        this.camera.applyGravity = false;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.camera.minZ = 0.45;
        this.camera.speed = 0.55;
        this.camera.angularSensibility = 4000;
        this.camera.keysUp.push(87);   // W
        this.camera.keysLeft.push(65); // A
        this.camera.keysDown.push(83); // S
        this.camera.keysRight.push(68); // D

        // Переменные для Q-зума
        const originalFov = this.camera.fov;
        let isZoomedIn = false;
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                const key = kbInfo.event.key.toLowerCase();
                if (/q|й/.test(key)) {
                    // Зумируем только если измерение зафиксировано (состояние 2) и есть вторая точка
                    if (this.measurementStage === 2 && this.secondFixedPoint) {
                        if (!isZoomedIn) {
                            // Приближение: уменьшаем FOV и устанавливаем цель на вторую точку
                            this.camera.fov /= 4;
                            this.camera.setTarget(this.secondFixedPoint);
                        } else {
                            // Отдаление: восстанавливаем FOV и цель (например, на первую точку или исходное направление)
                            this.camera.fov = originalFov;
                            this.camera.setTarget(this.fixedPoint || new Vector3(0, 0, 0));
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

            await this.modelLoader.loadMLabModel();
            await this.modelLoader.loadTapeMeasureModel();

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
        } catch (error) {
            console.error("Ошибка при инициализации сцены:", error);
        } finally {
            this.engine.hideLoadingUI();
        }
    }
}


