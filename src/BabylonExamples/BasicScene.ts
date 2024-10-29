import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Control
} from "@babylonjs/gui";

export class BasicScene {
  scene: Scene;
  engine: Engine;
  advancedTexture: AdvancedDynamicTexture;
  textBlock: TextBlock;
  textMessages: string[] = ["Нажмите на W", "Нажмите на S", "Нажмите на A", "Нажмите на D"];
  currentTextIndex: number = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

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
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "envSetting.glb",
      this.scene
    );

    console.log(meshes);
    

    meshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });

    this.createGui();
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(20, 50, 0), this.scene);
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
  }

  createGui(): void {
    // Create the advanced dynamic texture
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);

    // Create a TextBlock
    this.textBlock = new TextBlock();
    this.textBlock.text = this.textMessages[this.currentTextIndex];
    this.textBlock.color = "white";
    this.textBlock.fontSize = 24;
    this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.advancedTexture.addControl(this.textBlock);

    // Add keyboard event listener
    window.addEventListener("keydown", (event) => {
      if (event.key === "w" || event.key === "W") {
        this.updateText(0); 
      } else if (event.key === "s" || event.key === "S") {
        this.updateText(1);
      } else if (event.key === "a" || event.key === "A") {
        this.updateText(2);
      } else if (event.key === "d" || event.key === "D") {
        this.updateText(3);
      }
    });
  }

  updateText(index: number): void {
    if (index === this.currentTextIndex) {
      this.currentTextIndex++;
      if (this.currentTextIndex < this.textMessages.length) {
        this.textBlock.text = this.textMessages[this.currentTextIndex];
      } else {
        this.textBlock.isVisible = false; // Hide text when all messages have been shown
      }
    }
  }
}
