import { 
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  FreeCamera,
  HDRCubeTexture,
  HighlightLayer,
  SceneLoader,
  AbstractMesh,
  Mesh,
  Color3,
  ActionManager,
  ExecuteCodeAction
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { TriggersManager } from "./FunctionComponents/TriggerManager3";

export class FullExample {
  scene: Scene;
  engine: Engine;
  camera!: FreeCamera;
  triggerManager: TriggersManager;
  guiTexture: AdvancedDynamicTexture;
  highlightLayer: HighlightLayer;

  constructor(private canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.highlightLayer = new HighlightLayer("hl1", this.scene);
    this.highlightLayer.innerGlow = true; // Включаем внутреннее свечение
    this.highlightLayer.outerGlow = true; // Включаем внешнее свечение

    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.triggerManager = new TriggersManager(
      this.scene,
      this.canvas,
      this.guiTexture
    );

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });
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
      "/models/cape_hill_4k.hdr",
      scene,
      512
    );

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    this.camera = new FreeCamera("camera", new Vector3(13.7, 6.3, 5.0), this.scene);
    this.camera.attachControl(this.canvas, true);

    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.camera.minZ = 0.45;
    this.camera.speed = 0.55;
    this.camera.angularSensibility = 4000;
  }

  async CreateEnvironment(): Promise<void> {
    try {
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1_MOD_V_2.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      this.setupMeshes(map); // Настройка всех мешей
      this.highlightSpecificMeshes(); // Подсвечиваем заранее указанные объекты

      // Настройка мешей типа "broken" и "whole"
      this.setupBrokenMeshes(map);
      this.setupWholeMeshes(map);

    } catch (error) {
      console.error("Ошибка при загрузке окружения:", error);
    }
  }

  private setupMeshes(mapMeshes: AbstractMesh[]): void {
    mapMeshes.forEach((mesh) => {
      // Убираем кликабельность для всех объектов, кроме "broken" и "whole"
      if (
        mesh.name.toLowerCase().includes("broken") ||
        mesh.name.toLowerCase().includes("whole")
      ) {
        mesh.isPickable = true;
      } else {
        mesh.isPickable = false;
      }

      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        console.log(`${mesh.name} был кликнут`);
      }));
    });
  }

  private highlightSpecificMeshes(): void {
    const meshNames = [
      "SM_0_SpanStructureBeam_1_Armature_R",
      "SM_0_SpanStructureBeam_1_Cable_R",
      "SM_0_SpanStructureBeam_2_Armature_L",
      "SM_0_SpanStructureBeam_2_Cable_L"
    ];

    const meshesToHighlight = meshNames
      .map(name => this.scene.getMeshByName(name))
      .filter((mesh): mesh is Mesh => mesh instanceof Mesh); // Приводим к типу Mesh

    meshesToHighlight.forEach(mesh => {
      this.highlightLayer.addMesh(mesh, Color3.FromHexString("#FF0000")); // Яркая красная подсветка
    });
  }

  // Метод для настройки мешей типа "broken" с точками и действиями
  private setupBrokenMeshes(mapMeshes: AbstractMesh[]): void {
    const brokenMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("broken"));
    brokenMeshes.forEach(mesh => {
        mesh.checkCollisions = true;
        mesh.isPickable = true; // "broken" остаются кликабельными
        mesh.isVisible = true;
        mesh.setEnabled(true);
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                console.log("Broken меш кликнут:", mesh.name, "Координаты:", mesh.position);
                this.scene.activeCamera = this.camera;
            })
        );
    });
  }

  // Метод для настройки мешей типа "whole"
  private setupWholeMeshes(mapMeshes: AbstractMesh[]): void {
    const wholeMeshes = mapMeshes.filter(mesh => mesh.name.toLowerCase().includes("whole"));
    wholeMeshes.forEach(mesh => {
        mesh.checkCollisions = true;
        mesh.isPickable = true; // "whole" остаются кликабельными
        mesh.visibility = 0;
        mesh.setEnabled(true);
        mesh.actionManager = new ActionManager(this.scene);
        mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                console.log("Whole меш кликнут:", mesh.name, "Координаты:", mesh.position);
                this.scene.activeCamera = this.camera;
            })
        );
    });
  }
}
