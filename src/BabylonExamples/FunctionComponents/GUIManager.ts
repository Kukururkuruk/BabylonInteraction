import { AbstractMesh, Animation, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Control,
  Button,
  Rectangle,
  Image,
  TextWrapping,
  Grid,
  InputText,
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
  private textMessages: string[] | null = null;
  private currentTextIndex: number = 0;
  private dialogAnimation: Animation;
  private dialogContainer: Rectangle;
  private currentDialogBox: Rectangle | null = null;
  dialogVisible: boolean = true;

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


  createRouteButton(ref: string): void {
    const startButton = Button.CreateSimpleButton("startBtn", "Вернуться на карту");
    startButton.width = "150px";
    startButton.height = "40px";
    startButton.color = "white";
    startButton.cornerRadius = 20;
    startButton.background = "green";
    startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    this.advancedTexture.addControl(startButton);

    startButton.onPointerUpObservable.add(() => {
      window.location.href = ref;
    });
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
      this.textBlock.isPointerBlocker = false;
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

  CreateDialogBox(fullText: string, onComplete?: () => void): void {

    if (this.currentDialogBox) {
      this.advancedTexture.removeControl(this.currentDialogBox);
    }
    // Флаг для видимости окна диалога
    this.dialogVisible = true;

    // Создаем контейнер для диалогового окна
    this.dialogContainer = new Rectangle();
    this.dialogContainer.width = "30%";
    this.dialogContainer.height = "80%";
    this.dialogContainer.thickness = 0;
    this.dialogContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.dialogContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.dialogContainer.top = "-13%";
    this.dialogContainer.left = "2%";
    this.advancedTexture.addControl(this.dialogContainer);

    this.currentDialogBox = this.dialogContainer;

    // Добавляем изображение диалогового облачка
    const dialogImage = new Image("dialogImage", "/models/pixelSpeech.png");
    dialogImage.width = "100%";
    dialogImage.height = "100%";
    this.dialogContainer.addControl(dialogImage);

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
    this.dialogContainer.addControl(dialogText);

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

    // Создаем кнопку для скрытия диалогового окна
    const hideButton = Button.CreateSimpleButton("hideButton", "Hide Dialog");
    hideButton.width = "150px";
    hideButton.height = "50px";
    hideButton.color = "white";
    hideButton.background = "gray";
    hideButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    hideButton.top = "-10px";
    this.advancedTexture.addControl(hideButton);

    // Анимация появления и исчезновения диалогового окна
    this.dialogAnimation = new Animation(
        "dialogAnimation",
        "left",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Обработка события клика по кнопке
    hideButton.onPointerUpObservable.add(() => {
      this.dialogVisible = !this.dialogVisible;
        this.updateDialogAnimation(this.dialogVisible);
    });

    // Запускаем анимацию для первоначального появления
    this.updateDialogAnimation(this.dialogVisible);
  }

  updateDialogAnimation(visible) {
    const keys = [];
    if (visible) {
        keys.push({ frame: 0, value: 400 });
        keys.push({ frame: 30, value: 20 });
    } else {
        keys.push({ frame: 0, value: 20 });
        keys.push({ frame: 30, value: 400 });
    }
    this.dialogAnimation.setKeys(keys);
    this.scene.beginDirectAnimation(this.dialogContainer, [this.dialogAnimation], 0, 30, false);
  }

  createTextInputDialog(): void {
    const textBlocks: TextBlock[] = [];
    const inputFields: InputText[] = [];

    // Создаем контейнер для элементов
    const container = new Rectangle();
    container.width = "30%";
    container.height = "80%";
    container.thickness = 0;
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    container.top = "-13%";
    container.left = "2%";
    this.advancedTexture.addControl(container);

    // Добавляем изображение диалогового облачка
    const containerImage = new Image("dialogImage", "/models/pixelSpeech.png");
    containerImage.width = "100%";
    containerImage.height = "100%";
    container.addControl(containerImage);

    // Создаем Grid внутри контейнера
    const grid = new Grid();
    grid.width = "80%";
    grid.height = "50%";
    grid.paddingBottom = '10%'
    grid.background = 'red'

    // Определяем 2 колонки для текст-блоков и полей ввода
    grid.addColumnDefinition(1); // Колонка для TextBlock
    grid.addColumnDefinition(1); // Колонка для InputText

    // Определяем 3 строки для трех элементов
    grid.addRowDefinition(1); // Строка 0
    grid.addRowDefinition(1); // Строка 1
    grid.addRowDefinition(1); // Строка 2

    for (let i = 0; i < 3; i++) {
        // Создаем текстовый блок
        const textBlock = new TextBlock();
        textBlock.text = `Текст ${i + 1}`;
        textBlock.color = "black";
        textBlock.fontSize = 24;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        
        // Добавляем TextBlock в первую колонку Grid
        grid.addControl(textBlock, i, 0);
        textBlocks.push(textBlock);

        // Создаем поле ввода
        const inputField = new InputText();
        inputField.width = "90%";
        inputField.height = "30px";
        inputField.color = "white";
        inputField.background = "grey";
        
        // Добавляем InputText во вторую колонку Grid
        grid.addControl(inputField, i, 1);
        inputFields.push(inputField);

        // Пример использования: при изменении текста
        inputField.onBlurObservable.add(() => {
            console.log(`Введенное значение в поле ${i + 1}: ${inputField.text}`);
        });
    }

    // Добавляем Grid в контейнер
    container.addControl(grid);

    // Добавляем контейнер на экран
    this.advancedTexture.addControl(container);
}


}


