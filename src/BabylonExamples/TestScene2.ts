// import {
//   Scene,
//   Engine,
//   SceneLoader,
//   Vector3,
//   HemisphericLight,
//   HDRCubeTexture,
//   FreeCamera,
//   Mesh,
//   DirectionalLight,
//   ShadowGenerator,
//   PBRMaterial,
//   Texture,
//   Quaternion,
//   AbstractMesh,
//   AxesViewer,
//   Color3,
//   Matrix,
//   CascadedShadowGenerator,
// } from "@babylonjs/core";
// import "@babylonjs/loaders";
// import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
// import Stats from 'stats.js';
// // import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
// import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

// export class TestScene2 {
//   scene: Scene;
//   engine: Engine;
//   openModal?: (keyword: string) => void;
//   private triggerManager: TriggerManager2;
//   shadowGenerator: ShadowGenerator;
//   private mergeGroupNames: string[] = [
//     "SM_0_SpanStructureBeam",
//     "SM_0_FencePostBridge_base",
//     "Fence_Bridge_Centre",
//     "SM_0_FencePost_Road",
//     "SM_ConcreteFence_LP"
//     // Добавляйте новые базовые имена для объединения здесь
//   ];

//   private instanceGroupNames: string[] = [
//     "SM_0_Retaining_wall_Block_LP_R",
//     "SM_0_Retaining_wall_Block_LP_L",
//   ];

//   private excludedCollisionGroupNames: string[] = [
//     "SM_0_Stand",
//     "SM_0_SpanStructureBeam",
//     "SM_Curbstone",
//     "SM_HalfPipe_LP",
//     "SM_0_PlotMonolithic",
//     "SM_0_TransitionPlate8M_LP",
//   ];

//   private giveShadowGroupNames: string[] = [
//     "SM_0_SupportLight_LP_UP_L",
//     "SM_0_SupportLight_LP_UP_R",
//     "SM_0_SupportLight_LP_Down_R",
//     "SM_0_SupportLight_LP_Down_L",
//     "SM_0_RailingsStairs",
//     "SM_0_Stairs",
//     "SM_0_Retaining_wall_Block_LP",
//     "SM_0_BlockBevel_LP",
//     "SM_0_Road",
//     "SM_0_BridgeAsfalt",
//     "SM_0_MonolithicRack",
//     "SM_Fence_Collection_2LP",
//     "SM_0_FencePostBridge_base_merged",
//     "Fence_Bridge_Centre_merged",
//     "SM_0_FencePost_Road_merged",
//     "SM_ConcreteFence_LP_merged",


//     // Добавляйте новые подстроки здесь по мере необходимости
//   ];

//   private takeShadowGroupNames: string[] = [
//     "SM_0_Retaining_wall_Block_LP",
//     "SM_0_BlockBevel_LP",
//     "SM_0_MonolithicRack",
//     "SM_0_Landscape_Gravel_LP",
//     "SM_0_Road_Down.008",
//     "SM_0_Landscape_2.029",
//     "SM_0_Landscape_2.028",
//     "SM_0_Road_Down.011",
//     "SM_0_Road_Down.010",
//     "SM_0_Landscape_2.025",
//     "SM_0_Landscape_2.024",
//     "SM_0_Road_Down",
//     "SM_0_Road_Down.007",
//     "SM_0_Landscape_2",
//     "SM_0_Landscape_2.015",
//     "SM_0_Landscape_2.016",
//     "SM_0_Landscape_2.031",
//     "SM_0_Landscape_2.031",
//     "SM_0_Landscape_2.030",
//     "SM_0_Landscape_2.029",
//     "SM_0_Landscape_2.014",
//     "SM_0_Landscape_2.013",
//     "SM_0_Landscape_1",
//     "SM_0_Landskape_3.001",
//     "SM_0_Landskape_3.003",
//     "SM_0_Road_Down.008",
//     "SM_0_Road_Down.009",
//     "SM_0_Landscape_2.010",
//     "SM_0_Landscape_2.011",
//     "SM_0_Landscape_2.012",
//     "SM_0_Road_1_L",
//     "SM_0_Road_1_R",
//     "SM_0_BridgeAsfalt",
//     "SM_0_Stairs.004",
//     "SM_0_Stairs.003",
//     "SM_0_Stairs.006",
//     "SM_0_Stairs.007",
//     // Добавляйте новые подстроки здесь по мере необходимости
//   ];

//   private testBlockMesh: Mesh | null = null;

//   constructor(private canvas: HTMLCanvasElement) {
//     this.engine = new Engine(this.canvas, true);
//     this.engine.displayLoadingUI();

//     this.scene = this.CreateScene();

//     this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);

//     // this.scene.debugLayer.show();

//     this.initializeScene()

//     this.CreateController();

//     const stats = new Stats();
//     stats.showPanel(0); // 0: FPS, 1: MS, 2: MB, 3+: Custom
//     document.body.appendChild(stats.dom);

//     this.engine.runRenderLoop(() => {
//       stats.begin();
//       this.scene.render();
//       stats.end();
//     });

//   }

//   CreateScene(): Scene {
//     const scene = new Scene(this.engine);

//     const framesPerSecond = 60;
//     const gravity = -9.81;
//     scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
//     scene.collisionsEnabled = true;

//     const hdrTexture = new HDRCubeTexture(
//       "/models/test_5.hdr",
//       scene,
//       512
//     );

//     scene.environmentTexture = hdrTexture;
//     scene.createDefaultSkybox(hdrTexture, true);
//     scene.environmentIntensity = 1;

//     return scene;
//   }

//   CreateController(): void {
//     // Установка начальной позиции камеры для лучшей видимости
//     const camera = new FreeCamera("camera", new Vector3(35, 3, 0), this.scene);
//     camera.attachControl(this.canvas, true);

//     camera.applyGravity = false;
//     camera.checkCollisions = true;
//     camera.ellipsoid = new Vector3(0.5, 1, 0.5);
//     camera.rotation.y = -Math.PI / 2;
//     camera.minZ = 0.45;
//     camera.speed = 0.55;
//     camera.angularSensibility = 4000;
//     this.triggerManager.setupCameraKeys(camera);
// }

//   async CreateEnvironment(): Promise<void> {
//     try {
//       // Загрузка основной сцены
//       const result = await SceneLoader.ImportMeshAsync(
//         "",
//         "./models/",
//         "Map_1_MOD.gltf",
//         this.scene
//       );
//       const meshes = result.meshes;
//       // console.log("Основные меши загружены:", meshes);

//       const BrokenMeshes = meshes.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
//       BrokenMeshes.forEach((mesh) => {
//           mesh.visibility = 1;
//       });

//       // meshes.forEach((mesh) => {
//       //   mesh.checkCollisions = true;
//         // mesh.receiveShadows = true;

//         // // Оптимизация материалов
//         // if (mesh.material && mesh.material instanceof PBRMaterial) {
//         //   const material = mesh.material as PBRMaterial;
//         //   material.directIntensity = 1;
//         //   material.environmentIntensity = 1;

//         //   if (material.reflectionTexture) {
//         //     material.reflectionTexture.updateSamplingMode(
//         //       Texture.BILINEAR_SAMPLINGMODE
//         //     );
//         //   }
//         // }
//       // });


//       meshes.forEach((mesh) => {
//         const shouldExclude = this.excludedCollisionGroupNames.some(substring => mesh.name.includes(substring));
//         if (!shouldExclude) {
//           mesh.checkCollisions = true;
//         } else {
//           // Опционально: можно добавить логирование для отладки
//           // console.log(`Mesh "${mesh.name}" исключён из коллизий.`);
//         }
//       });

//             // Загрузка TestBlock.glb и сохранение его меша
//             const testBlockResult = await SceneLoader.ImportMeshAsync(
//               "",
//               "./models/",
//               "wall.glb",
//               this.scene
//             );
      
//             const testBlockMeshes = testBlockResult.meshes;
            
      
//             if (testBlockMeshes.length === 0) {
//               throw new Error("wall.glb не содержит мешей.");
//             }
            
      
//             // Предполагаем, что первый меш является нужным нам мешем
//             this.testBlockMesh = testBlockMeshes[1] as Mesh;
//             this.testBlockMesh.visibility = 0
      
      
      
      
//             // // Находим сломанные меши
//             // const BrokenMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
//             // const WholeMeshes = map.filter((mesh) => mesh.name.toLowerCase().includes("whole"));
      
//             // BrokenMeshes.forEach((mesh) => {
//             //   mesh.visibility = 1; // Полностью видимый
//             // });
      
//             // WholeMeshes.forEach((mesh) => {
//             //   mesh.visibility = 0; // Полностью невидимый
//             // });
      
//             console.log("Модели успешно загружены.");
//           } catch (error) {
//             console.error("Ошибка при загрузке моделей:", error);
//           } finally {
//             // Удаляем вызов this.engine.hideLoadingUI(); отсюда
//           }
//         }


//   async GroupAndInstanceMeshes(): Promise<void> {
//     this.instanceGroupNames.forEach((baseName) => {
//       // Извлекаем меши, которые начинаются с baseName и являются экземплярами Mesh с геометрией
//       const matchingMeshes = this.scene.meshes.filter(
//         (mesh) =>
//           mesh.name.startsWith(baseName) &&
//           mesh.name !== "SM_0_Retaining_wall_Block_LP_R_5" &&
//           mesh.isEnabled() &&
//           mesh instanceof Mesh &&
//           mesh.geometry
//       ) as Mesh[];
  
//       // console.log(`Обрабатываем группу "${baseName}" с ${matchingMeshes.length} мешами.`);
  
//       if (matchingMeshes.length > 1) {
//         const originalMesh = this.testBlockMesh.clone(`${baseName}_prototype`) as Mesh;

//         // Опционально: настройка позиции, вращения и масштаба прототипного меша
//         originalMesh.isVisible = true; // Скрываем прототипный меш
//         originalMesh.setParent(null);
        
  
//         // Обновляем мировые матрицы оригинального меша
//         originalMesh.computeWorldMatrix(true);
  
//         // Создаём инстансы для остальных мешей в группе
//         for (let i = 1; i < matchingMeshes.length; i++) {
//           const mesh = matchingMeshes[i];
  
//           // Обновляем мировые матрицы текущего меша
//           mesh.computeWorldMatrix(true);
  
//           // Получаем центр bounding box в мировых координатах
//           const worldCenter = mesh.getBoundingInfo().boundingBox.centerWorld.clone();
  
//           // console.log(`Создаём инстанс для меша "${mesh.name}" в позиции ${worldCenter}`);
  
//           // Создаём инстанс оригинального меша
//           const instance = originalMesh.createInstance(`${mesh.name}`);
//           // instance.setParent(mesh.parent);

  
//           // Устанавливаем абсолютную позицию инстанса
//           instance.setAbsolutePosition(worldCenter);
  
//           // // Получение мировых ротации и масштаба
//           // const worldRotation = mesh.rotationQuaternion
//           //   ? mesh.rotationQuaternion.clone()
//           //   : Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
//           // const worldScaling = mesh.scaling.clone();
  
//           // // Устанавливаем вращение
//           // if (worldRotation) {
//           //   instance.rotationQuaternion = worldRotation.clone();
//           // } else {
//           //   instance.rotation = mesh.rotation.clone();
//           // }
  
//           // // Устанавливаем масштаб
//           // instance.scaling = worldScaling.clone();
  
//           // Настройка дополнительных свойств инстанса
//           // instance.receiveShadows = mesh.receiveShadows;
//           // instance.checkCollisions = mesh.checkCollisions;
  
//           // Удаляем оригинальный меш
//           mesh.dispose();
  
//           // console.log(`Создан инстанс: ${instance.name} из оригинала: ${originalMesh.name}`);
//           // console.log(instance.name);
          
//         }
  
//         // console.log(`Группа "${baseName}" успешно инстанцирована.`);
//       }
//     });
//   }

//   async GroupAndMergeMeshes(): Promise<void> {
//     this.mergeGroupNames.forEach((baseName) => {
//       // Извлекаем меши, которые начинаются с baseName
//       const matchingMeshes = this.scene.meshes.filter(
//         (mesh) => mesh.name.startsWith(baseName) && mesh.isEnabled()
//       );

//       if (matchingMeshes.length > 1) {
//         // Группируем по материалу
//         const materialGroups: { [key: string]: Mesh[] } = {};

//         matchingMeshes.forEach((mesh) => {
//           const material = mesh.material;
//           const materialKey = material ? material.uniqueId : "no-material";

//           if (!materialGroups[materialKey]) {
//             materialGroups[materialKey] = [];
//           }

//           materialGroups[materialKey].push(mesh);
//         });

//         // Объединяем меши в каждой группе по материалу
//         Object.keys(materialGroups).forEach((materialKey) => {
//           const groupMeshes = materialGroups[materialKey];
//           if (groupMeshes.length > 1) {
//             const mergedMesh = Mesh.MergeMeshes(
//               groupMeshes,
//               true, // Удалить исходные меши
//               true, // Сохранить позиции
//               undefined, // Родительский меш
//               false, // Не использовать коллизии
//               true // Сохранить материалы
//             );

//             if (mergedMesh) {
//               mergedMesh.name = `${baseName}_merged`;
//               mergedMesh.isVisible = true;
//               // mergedMesh.checkCollisions = true;
//               // mergedMesh.receiveShadows = true;

//               console.log(
//                 `Объединённая группа: ${mergedMesh.name}, количество мешей: ${groupMeshes.length}`
//               );
//             }
//           }
//         });
//       }
//     });
//   }

//   async CreateShadows(): Promise<void> {
//     const light = new DirectionalLight(
//       "dirLight",
//       new Vector3(-1, -1, 0.5),
//       this.scene
//     );
//     light.position = new Vector3(50, 50, -50);
//     light.intensity = 2;
  
//     this.shadowGenerator = new CascadedShadowGenerator(2048, light);
//     this.shadowGenerator.useContactHardeningShadow = true;
//     this.shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
  
//     const shadowMap = this.shadowGenerator.getShadowMap();
//     if (shadowMap) {
//       shadowMap.renderList = [];
  
//       this.scene.meshes.forEach((mesh) => {
//         // Проверяем, должен ли меш отбрасывать тени
//         const isShadowCaster = this.giveShadowGroupNames.some(
//           (name) => mesh.name === name || mesh.name.startsWith(name)
//         );
  
//         // Проверяем, должен ли меш принимать тени
//         const shouldReceiveShadows = this.takeShadowGroupNames.some(
//           (name) => mesh.name === name || mesh.name.startsWith(name)
//         );
  
//         // Устанавливаем свойство receiveShadows
//         mesh.receiveShadows = shouldReceiveShadows;
  
//         if (isShadowCaster) {
//           // Добавляем меш в генератор теней
//           this.shadowGenerator.addShadowCaster(mesh);
//           shadowMap.renderList!.push(mesh);
//         }
//       });
//     }
//   }

//   // async CreateShadows(): Promise<void> {
//   //   const light = new DirectionalLight(
//   //     "dirLight",
//   //     new Vector3(-1, -1, 0.5),
//   //     this.scene
//   //   );
//   //   light.position = new Vector3(50, 50, -50);
//   //   light.intensity = 2; // Оптимизируйте интенсивность по необходимости

//   //   this.shadowGenerator = new ShadowGenerator(2048, light); // Уменьшено разрешение теней
//   //   // this.shadowGenerator.useBlurExponentialShadowMap = true; // Используйте размытие для улучшения качества
//   //   // this.shadowGenerator.blurKernel = 32;
//   //   this.shadowGenerator.useContactHardeningShadow = true;
//   //   this.shadowGenerator.contactHardeningLightSizeUVRatio = 0.05; // Настройте по желанию
    

//   //   // Ограничьте область камеры теней
//   //   // light.shadowMinZ = 1;
//   //   // light.shadowMaxZ = 100;

//   //   // // Настройка размера теней
//   //   // this.shadowGenerator.mapSize = 1024; // Установите mapSize как число

//   //   // Добавление мешей в renderList с проверкой на null
//   //   const shadowMap = this.shadowGenerator.getShadowMap();
//   //   if (shadowMap) {
//   //     shadowMap.renderList = [];
//   //     this.scene.meshes.forEach((mesh) => {
//   //       if (mesh.isVisible && mesh.receiveShadows) {
//   //         this.shadowGenerator.addShadowCaster(mesh);
//   //         shadowMap.renderList!.push(mesh);
//   //       }
//   //     });
//   //   }

//   //   // Дополнительные настройки теней (опционально)
//   //   // this.shadowGenerator.usePoissonSampling = true;
//   // }

//   async initializeScene(): Promise<void> {
//     try {
//       await this.CreateEnvironment();
//       // await this.GroupAndInstanceMeshes();
//       await this.GroupAndMergeMeshes();
//       // Если CreateShadows асинхронный, раскомментируйте следующую строку:
//       await this.CreateShadows();
//     } catch (error) {
//       console.error("Ошибка при инициализации сцены:", error);
//     } finally {
//       this.engine.hideLoadingUI();
//     }
//   }

// }


import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  HDRCubeTexture,
  FreeCamera,
  Mesh,
  DirectionalLight,
  ShadowGenerator,
  PBRMaterial,
  Texture,
  Quaternion,
  AbstractMesh,
  AxesViewer,
  Color3,
  Matrix,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { TriggerManager2 } from "./FunctionComponents/TriggerManager2";
import Stats from 'stats.js';
import "@babylonjs/inspector";

export class TestScene2 {
  scene: Scene;
  engine: Engine;
  openModal?: (keyword: string) => void;
  private triggerManager: TriggerManager2;
  shadowGenerator: ShadowGenerator;
  private mergeGroupNames: string[] = [
    "SM_0_SpanStructureBeam",
    "SM_0_FencePostBridge_base",
    "Fence_Bridge_Centre",
    "SM_0_FencePost_Road",
    "SM_ConcreteFence_LP"
    // Добавляйте новые базовые имена для объединения здесь
  ];

  private instanceGroupNames: string[] = [
    "SM_0_Retaining_wall_Block_LP_R",
    "SM_0_Retaining_wall_Block_LP_L",
  ];

  private excludedCollisionGroupNames: string[] = [
    "SM_0_Stand",
    "SM_0_SpanStructureBeam_merged",
    "SM_Curbstone",
    "SM_HalfPipe_LP",
    "SM_0_PlotMonolithic",
    "SM_0_TransitionPlate8M_LP",
  ];

  private giveShadowGroupNames: string[] = [
    "SM_0_SupportLight_LP_UP_L",
    "SM_0_SupportLight_LP_UP_R",
    "SM_0_SupportLight_LP_Down_R",
    "SM_0_SupportLight_LP_Down_L",
    "SM_0_RailingsStairs",
    "SM_0_Stairs",
    "SM_0_Retaining_wall_Block_LP",
    "SM_0_BlockBevel_LP",
    "SM_0_Road",
    "SM_0_BridgeAsfalt",
    "SM_0_MonolithicRack",
    "SM_Fence_Collection_2LP",
    "SM_0_FencePostBridge_base_merged",
    "Fence_Bridge_Centre_merged",
    "SM_0_FencePost_Road_merged",
    "SM_ConcreteFence_LP_merged",
    // Добавляйте новые подстроки здесь по мере необходимости
  ];

  private takeShadowGroupNames: string[] = [
    "SM_0_Retaining_wall_Block_LP",
    "SM_0_BlockBevel_LP",
    "SM_0_MonolithicRack",
    "SM_0_Landscape_Gravel_LP",
    "SM_0_Road_Down.008",
    "SM_0_Landscape_2.029",
    "SM_0_Landscape_2.028",
    "SM_0_Road_Down.011",
    "SM_0_Road_Down.010",
    "SM_0_Landscape_2.025",
    "SM_0_Landscape_2.024",
    "SM_0_Road_Down",
    "SM_0_Road_Down.007",
    "SM_0_Landscape_2",
    "SM_0_Landscape_2.015",
    "SM_0_Landscape_2.016",
    "SM_0_Landscape_2.031",
    "SM_0_Landscape_2.030",
    "SM_0_Landscape_2.029",
    "SM_0_Landscape_2.014",
    "SM_0_Landscape_2.013",
    "SM_0_Landscape_1",
    "SM_0_Landskape_3.001",
    "SM_0_Landskape_3.003",
    "SM_0_Road_Down.008",
    "SM_0_Road_Down.009",
    "SM_0_Landscape_2.010",
    "SM_0_Landscape_2.011",
    "SM_0_Landscape_2.012",
    "SM_0_Road_1_L",
    "SM_0_Road_1_R",
    "SM_0_BridgeAsfalt",
    "SM_0_Stairs.004",
    "SM_0_Stairs.003",
    "SM_0_Stairs.006",
    "SM_0_Stairs.007",
    // Добавляйте новые подстроки здесь по мере необходимости
  ];

  private testBlockMesh: Mesh | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    // Оптимизация 9: Отключение антиалиасинга и настройка аппаратного масштабирования
    this.engine = new Engine(this.canvas, true, { antialias: false });
    this.engine.setHardwareScalingLevel(1); // Настройте уровень масштабирования по необходимости

    this.engine.displayLoadingUI();

    this.scene = this.CreateScene();

    this.triggerManager = new TriggerManager2(this.scene, this.canvas, this.guiTexture);

    // this.scene.debugLayer.show();

    this.initializeScene();

    this.CreateController();

    const stats = new Stats();
    stats.showPanel(0); // 0: FPS, 1: MS, 2: MB, 3+: Custom
    document.body.appendChild(stats.dom);

    this.engine.runRenderLoop(() => {
      stats.begin();
      this.scene.render();
      stats.end();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    const hdrTexture = new HDRCubeTexture(
      "/models/test_5.hdr",
      scene,
      512
    );

    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true);
    scene.environmentIntensity = 1;

    return scene;
  }

  CreateController(): void {
    // Установка начальной позиции камеры для лучшей видимости
    const camera = new FreeCamera("camera", new Vector3(35, 3, 0), this.scene);
    camera.attachControl(this.canvas, true);

    camera.applyGravity = false;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    camera.rotation.y = -Math.PI / 2;
    camera.minZ = 0.45;
    camera.speed = 0.55;
    camera.angularSensibility = 4000;
    this.triggerManager.setupCameraKeys(camera);
  }

  async CreateEnvironment(): Promise<void> {
    try {
      // Загрузка основной сцены
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "Map_1_MOD.gltf",
        this.scene
      );
      const meshes = result.meshes;

      const BrokenMeshes = meshes.filter((mesh) => mesh.name.toLowerCase().includes("broken"));
      BrokenMeshes.forEach((mesh) => {
        mesh.visibility = 1;
      });

      // Загрузка TestBlock.glb и сохранение его меша
      const testBlockResult = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "wall.glb",
        this.scene
      );

      const testBlockMeshes = testBlockResult.meshes;

      if (testBlockMeshes.length === 0) {
        throw new Error("wall.glb не содержит мешей.");
      }

      // Предполагаем, что первый меш является нужным нам мешем
      this.testBlockMesh = testBlockMeshes[1] as Mesh;
      this.testBlockMesh.visibility = 0;

      console.log("Модели успешно загружены.");
    } catch (error) {
      console.error("Ошибка при загрузке моделей:", error);
    }
  }

  async GroupAndInstanceMeshes(): Promise<void> {
    this.instanceGroupNames.forEach((baseName) => {
      // Извлекаем меши, которые начинаются с baseName и являются экземплярами Mesh с геометрией
      const matchingMeshes = this.scene.meshes.filter(
        (mesh) =>
          mesh.name.startsWith(baseName) &&
          mesh.name !== "SM_0_Retaining_wall_Block_LP_R_5" &&
          mesh.isEnabled() &&
          mesh instanceof Mesh &&
          mesh.geometry
      ) as Mesh[];
  
      // console.log(`Обрабатываем группу "${baseName}" с ${matchingMeshes.length} мешами.`);
  
      if (matchingMeshes.length > 1) {
        const originalMesh = this.testBlockMesh.clone(`${baseName}_prototype`) as Mesh;

        // Опционально: настройка позиции, вращения и масштаба прототипного меша
        originalMesh.isVisible = true; // Скрываем прототипный меш
        originalMesh.setParent(null);
        
  
        // Обновляем мировые матрицы оригинального меша
        originalMesh.computeWorldMatrix(true);
  
        // Создаём инстансы для остальных мешей в группе
        for (let i = 1; i < matchingMeshes.length; i++) {
          const mesh = matchingMeshes[i];
  
          // Обновляем мировые матрицы текущего меша
          mesh.computeWorldMatrix(true);
  
          // Получаем центр bounding box в мировых координатах
          const worldCenter = mesh.getBoundingInfo().boundingBox.centerWorld.clone();
  
          // console.log(`Создаём инстанс для меша "${mesh.name}" в позиции ${worldCenter}`);
  
          // Создаём инстанс оригинального меша
          const instance = originalMesh.createInstance(`${mesh.name}`);
          // instance.setParent(mesh.parent);

  
          // Устанавливаем абсолютную позицию инстанса
          instance.setAbsolutePosition(worldCenter);
  
          // // Получение мировых ротации и масштаба
          // const worldRotation = mesh.rotationQuaternion
          //   ? mesh.rotationQuaternion.clone()
          //   : Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
          // const worldScaling = mesh.scaling.clone();
  
          // // Устанавливаем вращение
          // if (worldRotation) {
          //   instance.rotationQuaternion = worldRotation.clone();
          // } else {
          //   instance.rotation = mesh.rotation.clone();
          // }
  
          // // Устанавливаем масштаб
          // instance.scaling = worldScaling.clone();
  
          // Настройка дополнительных свойств инстанса
          // instance.receiveShadows = mesh.receiveShadows;
          // instance.checkCollisions = mesh.checkCollisions;
  
          // Удаляем оригинальный меш
          mesh.dispose();
  
          // console.log(`Создан инстанс: ${instance.name} из оригинала: ${originalMesh.name}`);
          // console.log(instance.name);
          
        }
  
        // console.log(`Группа "${baseName}" успешно инстанцирована.`);
      }
    });
  }

  async GroupAndMergeMeshes(): Promise<void> {
    this.mergeGroupNames.forEach((baseName) => {
      // Извлекаем меши, которые начинаются с baseName
      const matchingMeshes = this.scene.meshes.filter(
        (mesh) => mesh.name.startsWith(baseName) && mesh.isEnabled()
      );

      if (matchingMeshes.length > 1) {
        // Группируем по материалу
        const materialGroups: { [key: string]: Mesh[] } = {};

        matchingMeshes.forEach((mesh) => {
          const material = mesh.material;
          const materialKey = material ? material.uniqueId : "no-material";

          if (!materialGroups[materialKey]) {
            materialGroups[materialKey] = [];
          }

          materialGroups[materialKey].push(mesh);
        });

        // Объединяем меши в каждой группе по материалу
        Object.keys(materialGroups).forEach((materialKey) => {
          const groupMeshes = materialGroups[materialKey];
          if (groupMeshes.length > 1) {
            const mergedMesh = Mesh.MergeMeshes(
              groupMeshes,
              true, // Удалить исходные меши
              true, // Сохранить позиции
              undefined, // Родительский меш
              false, // Не использовать коллизии
              true // Сохранить материалы
            );

            if (mergedMesh) {
              mergedMesh.name = `${baseName}_merged`;
              mergedMesh.isVisible = true;
              // mergedMesh.checkCollisions = true;
              // mergedMesh.receiveShadows = true;

              console.log(
                `Объединённая группа: ${mergedMesh.name}, количество мешей: ${groupMeshes.length}`
              );
            }
          }
        });
      }
    });
  }

  async CreateShadows(): Promise<void> {
    const light = new DirectionalLight(
      "dirLight",
      new Vector3(-1, -1, 0.5),
      this.scene
    );
    light.position = new Vector3(50, 50, -50);
    light.intensity = 2;
  
    this.shadowGenerator = new ShadowGenerator(2048, light);
    this.shadowGenerator.useContactHardeningShadow = true;
    this.shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
  
    const shadowMap = this.shadowGenerator.getShadowMap();
    if (shadowMap) {
      shadowMap.renderList = [];
  
      this.scene.meshes.forEach((mesh) => {
        // Проверяем, должен ли меш отбрасывать тени
        const isShadowCaster = this.giveShadowGroupNames.some(
          (name) => mesh.name === name || mesh.name.startsWith(name)
        );
  
        // Проверяем, должен ли меш принимать тени
        const shouldReceiveShadows = this.takeShadowGroupNames.some(
          (name) => mesh.name === name || mesh.name.startsWith(name)
        );
  
        // Устанавливаем свойство receiveShadows
        mesh.receiveShadows = shouldReceiveShadows;
  
        if (isShadowCaster) {
          // Добавляем меш в генератор теней
          this.shadowGenerator.addShadowCaster(mesh);
          shadowMap.renderList!.push(mesh);
        }
      });
    }
  }

  // Метод для присвоения коллизий
  async assignCollisions():  Promise<void> {
    this.scene.meshes.forEach((mesh) => {
      const shouldExclude = this.excludedCollisionGroupNames.some(substring => mesh.name.includes(substring));
      if (!shouldExclude) {
        mesh.checkCollisions = true;
      } else {
        // Опционально: можно добавить логирование для отладки
        // console.log(`Mesh "${mesh.name}" исключён из коллизий.`);
      }
    });
  }

  // Метод для оптимизации материалов (Оптимизация 1)
  async optimizeMaterials():  Promise<void> {
    this.scene.meshes.forEach((mesh) => {
      if (mesh.material && mesh.material instanceof PBRMaterial) {
        const material = mesh.material as PBRMaterial;
        material.directIntensity = 1;
        material.environmentIntensity = 1;
        material.specularIntensity = 0;
        material.disableBumpMap = true;
        material.disableLighting = false;

        if (material.reflectionTexture) {
          material.reflectionTexture.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        }
      }
    });
  }

  // Метод для заморозки мировых матриц (Оптимизация 3)
  async freezeWorldMatrices():  Promise<void> {
    this.scene.meshes.forEach((mesh) => {
      if (mesh.isEnabled() && mesh.isVisible && mesh.getTotalVertices() > 0) {
        mesh.freezeWorldMatrix();
      }
    });
  }

  // Метод для заморозки активных мешей (Оптимизация 4)
  async freezeActiveMeshes():  Promise<void> {
    this.scene.freezeActiveMeshes();
  }

  async initializeScene(): Promise<void> {
    try {
      await this.CreateEnvironment();
      // await this.GroupAndInstanceMeshes(); // Если не используете, можно закомментировать
      await this.GroupAndMergeMeshes();
      await this.CreateShadows();

      // Вызов методов оптимизации в конце асинхронной загрузки
      await this.assignCollisions();
      await this.optimizeMaterials();
      await this.freezeWorldMatrices();
      await this.freezeActiveMeshes();
    } catch (error) {
      console.error("Ошибка при инициализации сцены:", error);
    } finally {
      this.engine.hideLoadingUI();
    }
  }
}
