// ModelLoader.ts
import { Scene, AbstractMesh, SceneLoader, Mesh, Vector3, FreeCamera } from "@babylonjs/core";

export class ModelLoader {
  private scene: Scene;
  private loadedMeshes: { [key: string]: AbstractMesh[] } = {};

  // Массивы с определёнными мешами
  private nonCollisionMeshNames: string[] = [
    "SM_ConcreteFence_LP.015",
    "SM_ConcreteFence_LP.030",
    "SM_0_FencePost_Road.087",
    "SM_0_FencePost_Road.088",
  ];

  private brokenMeshSubstring: string = "broken";

  public meshGroups = [
    { groupName: "SpanStructureBeam_L_7", baseName: "SM_0_SpanStructureBeam_L_7" },
    { groupName: "SpanStructureBeam_L_4", baseName: "SM_0_SpanStructureBeam_L_4" },
    // Добавьте дополнительные группы по необходимости
  ];

  public singleMeshNames = [
    "SM_0_Retaining_wall_Block_LP_L",   // Стена
    "SM_0_MonolithicRack_R",            // Колонна монолит
    "SM_0_MonolithicRack_L_Column",     // Колонна
    "SM_0_MonolithicRack_L_Rostverc",   // Колонна ростверк основание
    "SM_0_MonolithicRack_L_Support",    // Колонна ригель вверх
    "SM_0_Stairs",                      // Лестница
    "SM_0_FencePost_Road.002",          // Барьерное ограждение (тип 1)
    "SM_0_FencePostBridge_base_.004",   // Барьерное ограждение (тип 2)
    "SM_0_connectingShaft_1",           // Шов
    "SM_0_Road_Down.001",               // Дорожное полотно
    "SM_0_BridgeAsfalt",                // Асфальт на мосту
    "SM_0_Stand_R",                     // Подферменник
    "SM_0_Road_1_R",                    // Дорога сверху
    "SM_ConcreteFence_LP.002",          // Бетонное ограждение по центру (Нью-Джерси)
    "SM_0_TransitionPlate8M_LP_L_primitive0", // Плита переходная
    "SM_0_PlotMonolithic",              // Плита над балками
    "SM_0_SupportLight_LP_Down_L",      // Фонари
    "SM_0_Landscape_Gravel_LP",         // Водосточный монолит
    "SM_HalfPipe_LP",                   // Подвесной лоток
    "SM_ConcreteTray_UP",               // Лоток верхняя часть
    "SM_ConcreteTelescopicTray",        // Откосной лоток
    "SM_PipeWater_LP",                  // Водосточная система
    "SM_GridDrainageSmall_LP",          // Дождеприемник
    // Добавьте дополнительные одиночные меши по необходимости
  ];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  // Метод для загрузки всех моделей
  public async loadAllModels(): Promise<void> {
    await this.loadMapModel();
    await this.loadSignModel();
    this.setupMeshes();
  }

  private async loadMapModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Map_1_MOD.gltf",
        this.scene
      );
      this.loadedMeshes["map"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели карты:", error);
      throw error;
    }
  }

  private async loadSignModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "MapPointerSimplev001.glb",
        this.scene
      );
      this.loadedMeshes["sign"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели указателя:", error);
      throw error;
    }
  }

  public async loadUltranModel(camera: FreeCamera): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "UltrasonicTester_FR_LP.glb",
        this.scene
      );
      const image = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "SM_Tilt_sign_LP.glb",
        this.scene
      );
      console.log(image.meshes);
      
      result.meshes.forEach((mesh) => {
        mesh.scaling = new Vector3(0.04, 0.04, 0.04)
        mesh.parent = camera;
        mesh.rotation = new Vector3(Math.PI / 2, Math.PI, Math.PI/6)
        const offset = new Vector3(-0.55, -0.5, 0.86);
        mesh.position = offset;
      })
      result.meshes[1].scaling.x = -0.04
      result.meshes[2].scaling.x = -0.04
      console.log(result.meshes);

      image.meshes[1].scaling = new Vector3(0.5, 0.5, 0.5)
      image.meshes[1].parent = result.meshes[2]
      image.meshes[1].position =  new Vector3 (0, 6.5, -10.22)
      image.meshes[1].rotation = new Vector3(  0, Math.PI / 2, Math.PI / 9) // менять по X:  2 ← , -2 → , 0 ↑ , 3 ↖ , -3 ↗

      this.loadedMeshes["ultra"] = result.meshes;
    } catch (error) {
      console.error("Ошибка при загрузке модели указателя:", error);
      throw error;
    }
  }

  // Метод для настройки мешей после загрузки
  private setupMeshes(): void {
    const mapMeshes = this.loadedMeshes["map"];
    if (mapMeshes) {
      // Включаем коллизии для всех мешей
      mapMeshes.forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      // Отключаем коллизии и уменьшаем видимость для определённых мешей
      this.nonCollisionMeshNames.forEach((name) => {
        const mesh = this.scene.getMeshByName(name);
        if (mesh) {
          mesh.checkCollisions = false;
          mesh.visibility = 0.5;
        } else {
          console.warn(`Меш с именем "${name}" не найден для отключения коллизий.`);
        }
      });

      // Скрываем "сломанные" меши
      const brokenMeshes = mapMeshes.filter((mesh) =>
        mesh.name.toLowerCase().includes(this.brokenMeshSubstring)
      );
      brokenMeshes.forEach((mesh) => {
        mesh.visibility = 0;
      });
    } else {
      console.warn("Меши карты не найдены для настройки.");
    }

    // Дополнительная настройка указателя (если необходимо)
    const signMeshes = this.loadedMeshes["sign"];
    if (signMeshes) {
      // Настройка мешей указателя (если требуется)
    } else {
      console.warn("Меши указателя не найдены для настройки.");
    }
  }

  // Метод для получения загруженных мешей по имени модели
  public getMeshes(modelName: string): AbstractMesh[] | undefined {
    return this.loadedMeshes[modelName];
  }
}
