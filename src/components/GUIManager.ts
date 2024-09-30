import { AbstractMesh, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock, Control, Button } from "@babylonjs/gui";
import * as GUI from '@babylonjs/gui/2D';

export class GUIManager {
  private scene: Scene;
  private advancedTexture: AdvancedDynamicTexture;
  private textBlock: TextBlock;
  private textMessages: string[];
  private currentTextIndex: number = 0;

  constructor(scene: Scene, textMessages: string[]) {
    this.scene = scene;
    this.textMessages = textMessages;
  }

  createGui(): void {
    // Создаем полноэкранный интерфейс
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);

    // Создаем TextBlock
    this.textBlock = new TextBlock();
    this.textBlock.text = this.textMessages[this.currentTextIndex];
    this.textBlock.color = "white";
    this.textBlock.fontSize = 24;
    this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.advancedTexture.addControl(this.textBlock);

    // Добавляем обработчик событий для клавиатуры
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase(); // Приводим к нижнему регистру для упрощения сравнения
      if (/w|ц/.test(key)) {
        this.updateText(0);
      } 
      else if (/s|ы/.test(key)) {
        this.updateText(1);
      }
      else if (/a|ф/.test(key)) {
        this.updateText(2);
      } 
      else if (/d|в/.test(key)) {
        this.updateText(3);
      }
    });
  }

  updateText(index: number): void {
    if (index === this.currentTextIndex) {
      this.currentTextIndex++;
      if (this.currentTextIndex <= 3) {
        this.textBlock.text = this.textMessages[this.currentTextIndex];
      } else {
        this.textBlock.text = this.textMessages[4];
        setTimeout(() => {
          this.textBlock.isVisible = false;
        }, 3000);
      }
    }
  }

  createButtonAboveMesh(targetMesh: AbstractMesh): void {
    // Создаем полноэкранный интерфейс
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Создаем кнопку
    const button = Button.CreateSimpleButton('myBtn', 'Click Me!');
    button.width = '200px';
    button.height = '40px';
    button.color = 'white';
    button.background = 'deepskyblue';
    advancedTexture.addControl(button);

    // Привязываем панель с кнопкой к сетке
    const panel = new GUI.StackPanel();
    panel.addControl(button);
    panel.isVertical = false;
    advancedTexture.addControl(panel);

    // Привязываем панель к сетке
    panel.linkWithMesh(targetMesh);

    const plane = MeshBuilder.CreatePlane('plane', {
      width: 5,
      height: 1,
    });
    const advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(plane, 512, 64);
    const button2 = Button.CreateSimpleButton('myBtn', 'Click Me!');
    button2.width = '200px';
    button2.height = '40px';
    button2.color = 'white';
    button2.background = 'deepskyblue';
    advancedTexture2.addControl(button2);

    // Привязываем плоскость к целевому мешу
    plane.parent = targetMesh;

    // Включаем режим билборда
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    // Устанавливаем позицию плоскости относительно целевого меша
    plane.position = new Vector3(0, -5, 0); // Если нужно разместить под мешом
  }

  async loadGUISnippet(): Promise<void> {
    const snippetId = "#4T7WYR";

    try {
      // Загружаем GUI из Snippet Server
      let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, this.scene);
      let loadedGUI = await advancedTexture.parseFromSnippetAsync(snippetId);

      // Если необходимо, можно настроить элементы в загруженной текстуре
      console.log("GUI элемент загружен и добавлен на сцену");

    } catch (error) {
      console.error("Ошибка при загрузке GUI из Snippet Server:", error);
    }
  }
}
