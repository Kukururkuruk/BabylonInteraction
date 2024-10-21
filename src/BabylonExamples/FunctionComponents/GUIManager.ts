import { AbstractMesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Control,
  Button,
  Rectangle,
  Image,
  TextWrapping,
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
  private textMessages: string[] | null = null;;
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



  createGui(): Promise<void> {
    return new Promise((resolve) => {
      // Создаем TextBlock для отображения счетчика кликов
      this.textBlock = new TextBlock();
      this.textBlock.text = this.textMessages[this.currentTextIndex];
      this.textBlock.color = "white";
      this.textBlock.fontSize = 24;
      this.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      this.textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      this.advancedTexture.addControl(this.textBlock);

      // Добавляем обработчик событий для клавиатуры
      const keydownHandler = (event: KeyboardEvent) => {
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

        // Проверяем, достигли ли конца сообщений
        if (this.currentTextIndex >= this.textMessages.length - 1) {
          window.removeEventListener("keydown", keydownHandler);
          resolve();
        }
      };

      window.addEventListener("keydown", keydownHandler);
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
    plane.billboardMode = MeshBuilder.BILLBOARDMODE_ALL;

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

  // Новый метод для создания диалогового окна с переданным текстом
  CreateDialogBox(fullText: string, onComplete?: () => void): void {
    // Создаем контейнер для диалогового окна
    const dialogContainer = new Rectangle();
    dialogContainer.width = "30%";
    dialogContainer.height = "80%";
    dialogContainer.thickness = 0;
    dialogContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    dialogContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    dialogContainer.top = "-10%";
    dialogContainer.left = "2%";
    this.advancedTexture.addControl(dialogContainer);

    // Добавляем изображение диалогового облачка
    const dialogImage = new Image("dialogImage", "/models/pixelSpeech.png");
    dialogImage.width = "100%";
    dialogImage.height = "100%";
    dialogContainer.addControl(dialogImage);

    // Добавляем текст с эффектом печатания
    const dialogText = new TextBlock();
    dialogText.text = "";
    dialogText.color = "black";
    dialogText.fontSize = "4%"; // Адаптивный размер шрифта
    dialogText.resizeToFit = true;
    dialogText.textWrapping = TextWrapping.WordWrap; // Используем enum
    dialogText.paddingTop = "2%";
    dialogText.paddingLeft = "15%";
    dialogText.paddingRight = "15%";
    dialogText.paddingBottom = "7%";
    dialogContainer.addControl(dialogText);

    let currentIndex = 0;

    // Функция для анимации печатания текста
    const typingInterval = setInterval(() => {
      dialogText.text += fullText[currentIndex];
      currentIndex++;
      if (currentIndex >= fullText.length) {
        clearInterval(typingInterval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 50); // Скорость печатания (в миллисекундах)
  }
}


