import React from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, Button, StackPanel, TextBlock, Rectangle } from '@babylonjs/gui';

class BabylonScene extends React.Component {
  private canvasRef: React.RefObject<HTMLCanvasElement>;
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private guiTexture: AdvancedDynamicTexture | null = null;
  private inventoryPanel: StackPanel | null = null;

  constructor(props: {}) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    if (this.canvasRef.current) {
      this.engine = new BABYLON.Engine(this.canvasRef.current, true);
      this.scene = new BABYLON.Scene(this.engine);

      // Камера и свет
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 2,
        10,
        BABYLON.Vector3.Zero(),
        this.scene
      );
      camera.attachControl(this.canvasRef.current, true);

      const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);

      // Загрузка модели
      BABYLON.SceneLoader.Append('/models/', 'model.glb', this.scene, () => {
        // После загрузки модели можно настроить меши
        this.setupMeshes();
      });

      // Создание GUI
      this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, this.scene);

      // Создание панели инвентаря
      this.inventoryPanel = this.createInventoryPanel(this.guiTexture);

      this.engine.runRenderLoop(() => {
        if (this.scene) {
          this.scene.render();
        }
      });

      window.addEventListener('resize', this.handleResize);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.engine) {
      this.engine.dispose();
    }
  }

  handleResize = () => {
    if (this.engine) {
      this.engine.resize();
    }
  };

  // Метод для настройки мешей
  setupMeshes() {
    if (this.scene && this.guiTexture && this.inventoryPanel) {
      // Меш с кнопкой перед ним
      this.createMeshWithButton();

      // Меш, при приближении к которому появляется сообщение
      this.createMeshWithProximityMessage();

      // Меш, который исчезает при нажатии и заполняет ячейку инвентаря
      this.createCollectibleMesh();
    }
  }

  // Создание панели инвентаря
  createInventoryPanel(guiTexture: AdvancedDynamicTexture) {
    const inventoryPanel = new StackPanel();
    inventoryPanel.isVertical = false;
    inventoryPanel.height = '100px';
    inventoryPanel.width = '400px';
    inventoryPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    inventoryPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiTexture.addControl(inventoryPanel);

    // Добавление ячеек в инвентарь
    for (let i = 0; i < 4; i++) {
      const slot = new Rectangle();
      slot.width = '80px';
      slot.height = '80px';
      slot.thickness = 2;
      slot.color = 'white';
      slot.background = 'grey';
      slot.name = 'empty';
      inventoryPanel.addControl(slot);
    }

    return inventoryPanel;
  }

  // Меш с кнопкой перед ним
  createMeshWithButton() {
    if (this.scene) {
      const mesh = this.scene.getMeshByName('MeshWithButton'); // Замените на имя вашего меша

      if (mesh) {
        const buttonPlane = BABYLON.MeshBuilder.CreatePlane(
          'buttonPlane',
          { width: 2, height: 0.4 },
          this.scene
        );
        buttonPlane.parent = mesh;
        buttonPlane.position = new BABYLON.Vector3(0, 0, -2); // Разместить перед мешем

        const buttonTexture = AdvancedDynamicTexture.CreateForMesh(buttonPlane);

        const button = Button.CreateSimpleButton('button', 'Нажми меня');
        button.width = '200px';
        button.height = '40px';
        button.color = 'white';
        button.background = 'blue';
        button.onPointerUpObservable.add(() => {
          alert('Кнопка нажата!');
        });

        buttonTexture.addControl(button);
      }
    }
  }

  // Меш с сообщением при приближении
  createMeshWithProximityMessage() {
    if (this.scene && this.guiTexture) {
      const mesh = this.scene.getMeshByName('ProximityMesh'); // Замените на имя вашего меша

      if (mesh) {
        const message = new TextBlock();
        message.text = 'Я пришел в нужное место';
        message.color = 'white';
        message.fontSize = 24;
        message.isVisible = false;
        this.guiTexture.addControl(message);

        this.scene.registerBeforeRender(() => {
          const camera = this.scene!.activeCamera;
          if (camera) {
            const distance = BABYLON.Vector3.Distance(camera.position, mesh.position);
            message.isVisible = distance < 3;
          }
        });
      }
    }
  }

  // Меш, который исчезает при нажатии и заполняет ячейку инвентаря
  createCollectibleMesh() {
    if (this.scene && this.inventoryPanel) {
      const mesh = this.scene.getMeshByName('CollectibleMesh'); // Замените на имя вашего меша

      if (mesh) {
        mesh.actionManager = new BABYLON.ActionManager(this.scene);
        mesh.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
            mesh.isVisible = false;

            // Обновление инвентаря
            const emptySlot = this.inventoryPanel!.children.find(
              (slot) => slot.name === 'empty'
            ) as Rectangle;
            if (emptySlot) {
              emptySlot.background = 'red'; // Обозначение заполненной ячейки
              emptySlot.name = 'occupied';
            }
          })
        );
      }
    }
  }

  render() {
    return <canvas ref={this.canvasRef} style={{ width: '100%', height: '100vh' }} />;
  }
}

export default BabylonScene;
