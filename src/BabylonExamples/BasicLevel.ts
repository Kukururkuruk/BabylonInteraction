import { 
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  FreeCamera,
  HDRCubeTexture,
  SceneLoader,
} from "@babylonjs/core";

export class Level {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();
    this.CreateController();

    this.CreateEnvironment().then(() => {
      this.engine.hideLoadingUI();
    });

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
  
  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);
    scene.collisionsEnabled = true;

    const hdrTexture = new HDRCubeTexture("/models/railway_bridges_4k.hdr", scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 0.5;

    return scene;
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 15, -15), this.scene);
    camera.attachControl(this.canvas, true);
    camera.applyGravity = false;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
  }

  async CreateEnvironment(): Promise<void> {
    try {
      const { meshes: map } = await SceneLoader.ImportMeshAsync("", "./models/", "Map_1.gltf", this.scene);
      map.forEach((mesh) => {
        mesh.checkCollisions = true;
      });
      console.log("Модели успешно загружены:", map);
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }
}
