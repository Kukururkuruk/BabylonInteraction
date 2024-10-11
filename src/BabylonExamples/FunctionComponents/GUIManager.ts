import { AbstractMesh, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Control,
  Button,
} from "@babylonjs/gui";
import * as GUI from '@babylonjs/gui/2D';

interface ButtonOptions {
  name: string;
  text: string;
  width?: string;
  height?: string;
  color?: string;
  background?: string;
  horizontalAlignment?: number;
  verticalAlignment?: number;
  positionOffset?: { left?: string; top?: string };
  onClick: () => void;
}

export class GUIManager {
  private scene: Scene;
  public advancedTexture: AdvancedDynamicTexture;
  private textBlock: TextBlock;
  private textMessages: string[];
  private currentTextIndex: number = 0;

  constructor(scene: Scene, textMessages: string[]) {
    this.scene = scene;
    this.textMessages = textMessages;
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
      "UI",
      true,
      this.scene
    );
  }

  // Вспомогательная функция для создания кнопок с настройками по умолчанию
  createButton(options: ButtonOptions): Button {
    const {
      name,
      text,
      width = "150px",
      height = "50px",
      color = "white",
      background = "blue",
      horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER,
      verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER,
      positionOffset = {},
      onClick,
    } = options;

    const button = Button.CreateSimpleButton(name, text);
    button.width = width;
    button.height = height;
    button.color = color;
    button.background = background;
    button.horizontalAlignment = horizontalAlignment;
    button.verticalAlignment = verticalAlignment;

    if (positionOffset.left) {
      button.left = positionOffset.left;
    }
    if (positionOffset.top) {
      button.top = positionOffset.top;
    }

    button.onPointerDownObservable.add(onClick);
    this.advancedTexture.addControl(button);

    return button;
  }

  createGui(): void {
    // Создаем TextBlock
    this.textBlock = new TextBlock();
    this.textBlock.text = this.textMessages[this.currentTextIndex];
    this.textBlock.color = "white";
    this.textBlock.fontSize = 24;
    this.textBlock.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.advancedTexture.addControl(this.textBlock);

    // Добавляем обработчик событий для клавиатуры
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase(); // Приводим к нижнему регистру для упрощения сравнения
      if (/w|ц/.test(key)) {
        this.updateText(0);
      } else if (/s|ы/.test(key)) {
        this.updateText(1);
      } else if (/a|ф/.test(key)) {
        this.updateText(2);
      } else if (/d|в/.test(key)) {
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

  // Метод для создания кнопки над мешом
  createButtonAboveMesh(
    targetMesh: AbstractMesh,
    buttonText: string,
    onClick: () => void
  ): void {
    const plane = MeshBuilder.CreatePlane("plane", {
      width: 5,
      height: 1,
    });

    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(
      plane,
      512,
      64
    );

    const button = Button.CreateSimpleButton("meshButton", buttonText);
    button.width = "200px";
    button.height = "40px";
    button.color = "white";
    button.background = "deepskyblue";
    advancedTexture.addControl(button);

    // Привязываем плоскость к целевому мешу
    plane.parent = targetMesh;

    // Включаем режим билборда
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    // Устанавливаем позицию плоскости относительно целевого меша
    plane.position = new Vector3(0, 2, 0); // Над мешом

    // Обработчик нажатия на кнопку
    button.onPointerClickObservable.add(onClick);
  }

  async loadGUISnippet(): Promise<void> {
    const snippetId = "#4T7WYR";

    try {
      // Загружаем GUI из Snippet Server
      let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "GUI",
        true,
        this.scene
      );
      await advancedTexture.parseFromSnippetAsync(snippetId);

      // Если необходимо, можно настроить элементы в загруженной текстуре
      console.log("GUI элемент загружен и добавлен на сцену");
    } catch (error) {
      console.error("Ошибка при загрузке GUI из Snippet Server:", error);
    }
  }
}
