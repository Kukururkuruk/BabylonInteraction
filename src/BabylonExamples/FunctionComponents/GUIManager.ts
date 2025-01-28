import { AbstractMesh, Animation, Mesh, MeshBuilder, Scene, Sound, Vector3 } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Control,
  Button,
  Rectangle,
  Image,
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
  private WASDContainer: Rectangle
  private textMessages: string[] | null = null;
  private currentTextIndex: number = 0;
  private dialogAnimation: Animation;
  private nondialogAnimation: Animation;
  private dialogContainer: Rectangle;
  private currentDialogBox: Rectangle | null = null;
  private hideButton: Button
  private clickSound: Sound;
  dialogVisible: boolean = true;

  constructor(scene: Scene, textMessages?: string[]) {
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
    const startButton = Button.CreateSimpleButton("startBtn", "Перейти");
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

  clearDialogBox(): void {
    if (this.advancedTexture) {
        this.advancedTexture.rootContainer.children.forEach((control) => {
            this.advancedTexture.removeControl(control);
        });
    }
}
  
  createGui(): Promise<void> {
    return new Promise((resolve) => {

      this.WASDContainer = new Rectangle();
      this.WASDContainer.width = "50%";
      this.WASDContainer.height = "50%";
      this.WASDContainer.thickness = 0;
      this.WASDContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.WASDContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.WASDContainer.top = "55%";
      this.WASDContainer.left = "-23%";
      // this.WASDContainer.background = 'red'
      this.dialogContainer.addControl(this.WASDContainer);

      // Создаем TextBlock для отображения счетчика кликов
      this.textBlock = new TextBlock();
      this.textBlock.text = this.textMessages[this.currentTextIndex];
      this.textBlock.color = "#212529";
      // this.textBlock.fontSize = "4%";
      this.textBlock.fontFamily = "Segoe UI";
      this.textBlock.width = '70%';
      // this.textBlock.paddingTop = "2%";
      this.textBlock.paddingLeft = "-11%";
      // this.textBlock.paddingRight = "15%";
      // this.textBlock.paddingBottom = "7%";
      this.textBlock.textWrapping = GUI.TextWrapping.WordWrap;
      this.textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      this.textBlock.isPointerBlocker = false;
      this.WASDContainer.addControl(this.textBlock);


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

//     CreateDialogBox(fullText: string, onComplete?: () => void): void {

//     if (this.currentDialogBox) {
//       this.advancedTexture.removeControl(this.currentDialogBox);
//     }
//     // Флаг для видимости окна диалога
//     this.dialogVisible = true;

//     // Создаем контейнер для диалогового окна
//     this.dialogContainer = new Rectangle();
//     this.dialogContainer.width = "30%";
//     this.dialogContainer.height = "67%";
//     this.dialogContainer.thickness = 0;
//     this.dialogContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
//     this.dialogContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//     this.dialogContainer.top = "0%";
//     this.dialogContainer.left = "2%";
//     this.advancedTexture.addControl(this.dialogContainer);

//     this.currentDialogBox = this.dialogContainer;

//     const backgroundRect = new Rectangle();
//     backgroundRect.width = "70%";
//     backgroundRect.height = "90%";
//     backgroundRect.thickness = 0;
//     backgroundRect.background = "#B9BFBF"; // Цвет фона с прозрачностью
    
//     // Добавляем фон внутрь контейнера диалогового окна
//     this.dialogContainer.addControl(backgroundRect);
    
//     // Добавляем изображение рамки поверх фона
//     const dialogImage = new Image("dialogImage", "/models/frame4.png");
//     dialogImage.width = "100%";
//     dialogImage.height = "100%";
//     this.dialogContainer.addControl(dialogImage);

//     const page1 = new Rectangle();
//     page1.width = "100%";
//     page1.height = "100%";
//     page1.thickness = 0;
//     page1.isVisible = false;

//     // Добавляем текст с эффектом печатания
//     const dialogText = new TextBlock();
//     dialogText.text = "";
//     dialogText.color = "#212529";
//     dialogText.fontSize = "4%"; // Адаптивный размер шрифта
//     dialogText.fontFamily = "Segoe UI"
//     dialogText.resizeToFit = true;
//     dialogText.textWrapping = TextWrapping.WordWrap; // Используем enum
//     dialogText.width = '90%'
//     dialogText.paddingTop = "2%";
//     dialogText.paddingLeft = "15%";
//     dialogText.paddingRight = "15%";
//     dialogText.paddingBottom = "7%";
//     page1.addControl(dialogText);
//     this.dialogContainer.addControl(page1);

//     let currentIndex = 0;

//     // Функция для анимации печатания текста
//     const typingInterval = setInterval(() => {
//       dialogText.text += fullText[currentIndex];
//       currentIndex++;
//       if (currentIndex >= fullText.length) {
//         clearInterval(typingInterval);
//         if (onComplete) {
//           onComplete();
//         }
//       }
//     }, 50); // Скорость печатания (в миллисекундах)



//     const textBlocks: TextBlock[] = [];
//     const inputFields: InputText[] = [];

//     const page2 = new Rectangle();
//     page2.width = "100%";
//     page2.height = "100%";
//     page2.thickness = 0;
//     page2.isVisible = false;

//     // Создаем Grid внутри контейнера
//     const grid = new Grid();
//     grid.width = "60%";
//     grid.height = "50%";
//     grid.paddingBottom = '10%';
//     // grid.background = 'red';

//     // Определяем 2 колонки для текст-блоков и полей ввода
//     grid.addColumnDefinition(1); // Колонка для TextBlock
//     grid.addColumnDefinition(1); // Колонка для InputText

//     // Определяем 6 строк: первая строка займет 2 колонки
//     grid.addRowDefinition(1); // Строка 0 (для заголовка)
//     grid.addRowDefinition(1); // Строка 1
//     grid.addRowDefinition(1); // Строка 2
//     grid.addRowDefinition(1); // Строка 3
//     grid.addRowDefinition(1); // Строка 4
//     grid.addRowDefinition(1); // Строка 5

//     // Добавляем текстовый блок в первую строку, объединяя его на две колонки
//     const headerTextBlock = new TextBlock();
//     headerTextBlock.text = "Конструкции"; // Заголовок
//     headerTextBlock.color = "black";
//     headerTextBlock.fontSize = "50%";
//     headerTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//     headerTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

//     // Объединяем ячейки заголовка
//     grid.addControl(headerTextBlock, 0, 0); // Заголовок в первой ячейке
//     grid.addControl(headerTextBlock, 0, 1); // Вторую ячейку также заполняем для объединения
//     const construction = ["Дорога", "Опора", "Ограждение", "Что-то еще", "Эта рабочая неделя"]
//     // Создаем текстовые блоки и поля ввода
//     for (let i = 0; i < 5; i++) {
//         // Создаем текстовый блок
//         const textBlock = new TextBlock();
//         textBlock.text = `${construction[i]}`;
//         textBlock.color = "black";
//         textBlock.fontSize = "40%";
//         textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
//         textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

//         // Добавляем TextBlock в первую колонку Grid
//         grid.addControl(textBlock, i + 1, 0); // Начинаем с 1, чтобы пропустить заголовок
//         textBlocks.push(textBlock);

//         // Создаем поле ввода
//         const inputField = new InputText();
//         inputField.width = "90%";
//         inputField.height = "90%";
//         inputField.color = "white";
//         inputField.background = "grey";

//         // Добавляем InputText во вторую колонку Grid
//         grid.addControl(inputField, i + 1, 1);
//         inputFields.push(inputField);

//         // Пример использования: при изменении текста
//         inputField.onBlurObservable.add(() => {
//             console.log(`Введенное значение в поле ${i + 1}: ${inputField.text}`);
//         });
//     }

//     // Устанавливаем rowspan для заголовка, чтобы он занимал обе колонки
//     headerTextBlock.height = "100%";
//     headerTextBlock.width = "100%";
    
//     // Добавляем Grid в контейнер
//     page2.addControl(grid);
//     this.dialogContainer.addControl(page2);



//     let currentPageIndex = 0;
//     const pages = [page1, page2];

//     const updatePageVisibility = () => {
//         pages.forEach((page, index) => page.isVisible = index === currentPageIndex);
//     };
//     updatePageVisibility();

//     const navigationGrid = new Grid();
// navigationGrid.width = "30%";
// navigationGrid.height = "7%";
// navigationGrid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
// navigationGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
// navigationGrid.top = "-10%";

// // Определяем 2 колонки для кнопок
// navigationGrid.addColumnDefinition(1);
// navigationGrid.addColumnDefinition(1);

// const initializeSound = () => {
//   if (!this.clickSound) {
//       this.clickSound = new Sound("clickSound", "/models/Dust_3.wav", this.scene, null, { autoplay: false });
//       this.clickSound.setVolume(0.3);
//   }
// };

// // Создаем кнопки "Previous" и "Next"
// const prevPageButton = Button.CreateSimpleButton("prevPageButton", "Назад");
// prevPageButton.width = "90%";
// prevPageButton.height = "90%";
// prevPageButton.color = "white";
// prevPageButton.background = "gray";
// prevPageButton.fontSize = "40%"
// prevPageButton.onPointerUpObservable.add(() => {
//   initializeSound();
//     currentPageIndex = (currentPageIndex - 1 + pages.length) % pages.length;
//     updatePageVisibility();
//     this.clickSound.play()
// });

// const nextPageButton = Button.CreateSimpleButton("nextPageButton", "Вперед");
// nextPageButton.width = "90%";
// nextPageButton.height = "90%";
// nextPageButton.color = "white";
// nextPageButton.background = "gray";
// nextPageButton.fontSize = "40%"
// nextPageButton.onPointerUpObservable.add(() => {
//   initializeSound();
//     currentPageIndex = (currentPageIndex + 1) % pages.length;
//     updatePageVisibility();
//     this.clickSound.play()
// });

// // Добавляем кнопки в соответствующие колонки Grid
// navigationGrid.addControl(prevPageButton, 0, 0);
// navigationGrid.addControl(nextPageButton, 0, 1);

// // Добавляем Grid с кнопками в контейнер диалога
// this.dialogContainer.addControl(navigationGrid);



//     // Создаем кнопку для скрытия диалогового окна
//     const hideButton = Button.CreateSimpleButton("hideButton", "Hide Dialog");
//     hideButton.width = "150px";
//     hideButton.height = "50px";
//     hideButton.color = "white";
//     hideButton.background = "gray";
//     hideButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
//     hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
//     hideButton.top = "-10px";
//     this.advancedTexture.addControl(hideButton);

//     // Анимация появления и исчезновения диалогового окна
//     this.dialogAnimation = new Animation(
//         "dialogAnimation",
//         "left",
//         30,
//         Animation.ANIMATIONTYPE_FLOAT,
//         Animation.ANIMATIONLOOPMODE_CONSTANT
//     );

//     // Обработка события клика по кнопке
//     hideButton.onPointerUpObservable.add(() => {
//       this.dialogVisible = !this.dialogVisible;
//         this.updateDialogAnimation(this.dialogVisible);
//     });

//     // Запускаем анимацию для первоначального появления
//     this.updateDialogAnimation(this.dialogVisible);
//   }




    CreateDialogBox( pages: Rectangle[], target?: TextBlock | undefined): void {

      if (this.currentDialogBox) {
        this.advancedTexture.removeControl(this.currentDialogBox);
        this.advancedTexture.removeControl(this.hideButton)
      }
      // Флаг для видимости окна диалога
      this.dialogVisible = true;

      // Создаем контейнер для диалогового окна
      this.dialogContainer = new Rectangle();
      this.dialogContainer.width = "30%";
      this.dialogContainer.height = "67%";
      this.dialogContainer.thickness = 0;
      this.dialogContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.dialogContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.dialogContainer.top = "0%";
      this.dialogContainer.left = "3%";
      this.advancedTexture.addControl(this.dialogContainer);

      this.currentDialogBox = this.dialogContainer;

      const backgroundRect = new Rectangle();
      backgroundRect.width = "70%";
      backgroundRect.height = "90%";
      backgroundRect.thickness = 0;
      backgroundRect.background = "#B9BFBF"; // Цвет фона с прозрачностью
      
      // Добавляем фон внутрь контейнера диалогового окна
      this.dialogContainer.addControl(backgroundRect);
      
      // Добавляем изображение рамки поверх фона
      const dialogImage = new Image("dialogImage", "/models/frame4.png");
      dialogImage.width = "100%";
      dialogImage.height = "100%";
      this.dialogContainer.addControl(dialogImage);

      

      pages.forEach((page) => {
        page.isVisible = false;  // Все страницы скрыты изначально
        this.dialogContainer.addControl(page);
    });



      let currentPageIndex = 0;

      const updatePageVisibility = () => {
          pages.forEach((page, index) => page.isVisible = index === currentPageIndex);
      };
      updatePageVisibility();



      if (pages.length > 1) {  
        const navigationGrid = new Grid();
        navigationGrid.width = "40%";
        navigationGrid.height = "7%";
        navigationGrid.top = "-10%";
        navigationGrid.left = "6%"
        navigationGrid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        navigationGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        

        // Определяем 3 колонки для кнопок
        navigationGrid.addColumnDefinition(1);
        navigationGrid.addColumnDefinition(1);
        navigationGrid.addColumnDefinition(1);

        const initializeSound = () => {
        if (!this.clickSound) {
            this.clickSound = new Sound("clickSound", "/models/Dust_3.wav", this.scene, null, { autoplay: false });
            this.clickSound.setVolume(0.05);
        }
        };

        const numberPage = new TextBlock();
        numberPage.text = `Страница\n${currentPageIndex + 1}/${pages.length}`;
        numberPage.color = "#212529";
        numberPage.fontSize = "35%";
        numberPage.fontFamily = "Segoe UI";
        numberPage.resizeToFit = true;

        // Создаем кнопки "Previous" и "Next"
        const prevPageButton = Button.CreateSimpleButton("prevPageButton", "Назад");
        prevPageButton.width = "90%";
        prevPageButton.height = "90%";
        prevPageButton.color = "white";
        prevPageButton.background = "gray";
        prevPageButton.fontSize = "40%"
        prevPageButton.onPointerUpObservable.add(() => {
        initializeSound();
          currentPageIndex = (currentPageIndex - 1 + pages.length) % pages.length;
          updatePageVisibility();
          this.clickSound.play()
          numberPage.text = `Страница\n${currentPageIndex + 1}/${pages.length}`
        });

        const nextPageButton = Button.CreateSimpleButton("nextPageButton", "Вперед");
        nextPageButton.width = "90%";
        nextPageButton.height = "90%";
        nextPageButton.color = "white";
        nextPageButton.background = "gray";
        nextPageButton.fontSize = "40%"
        nextPageButton.onPointerUpObservable.add(() => {
        initializeSound();
          currentPageIndex = (currentPageIndex + 1) % pages.length;
          updatePageVisibility();
          this.clickSound.play()
          numberPage.text = `Страница\n${currentPageIndex + 1}/${pages.length}`
        });

        // Добавляем кнопки в соответствующие колонки Grid
        navigationGrid.addControl(prevPageButton, 0, 0);
        navigationGrid.addControl(nextPageButton, 0, 1);
        navigationGrid.addControl(numberPage, 0, 2);

        // Добавляем Grid с кнопками в контейнер диалога
        this.dialogContainer.addControl(navigationGrid);
      }



      // Создаем кнопку для скрытия диалогового окна
      this.hideButton = Button.CreateSimpleButton("hideButton", "Скрыть\nпланшет");
      this.hideButton.width = "150px";
      this.hideButton.height = "50px";
      this.hideButton.color = "white";
      this.hideButton.background = "gray";
      this.hideButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.hideButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      this.hideButton.top = "-10px";
      this.advancedTexture.addControl(this.hideButton);

      // Анимация появления и исчезновения диалогового окна
      this.dialogAnimation = new Animation(
          "dialogAnimation",
          "left",
          30,
          Animation.ANIMATIONTYPE_FLOAT,
          Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Обработка события клика по кнопке
      this.hideButton.onPointerUpObservable.add(() => {
        this.dialogVisible = !this.dialogVisible;
          this.updateDialogAnimation(this.dialogVisible, this.dialogContainer);
          // if (this.WASDContainer) {
          //   this.updateNonDialogAnimation(this.dialogVisible, this.WASDContainer);
          // }
          if (target) {
            this.updateNonDialogAnimation(this.dialogVisible, target);
          }

          // Обновление текста кнопки
          this.updateButtonText();
      });
    }

    // Функция для обновления текста кнопки
    private updateButtonText() {
      if (this.dialogVisible) {
          this.hideButton.textBlock.text = "Скрыть\nпланшет";
      } else {
          this.hideButton.textBlock.text = "Показать планшет";
      }
    }

    DeleteDialogBox(): void {
      if (this.currentDialogBox) {
        this.advancedTexture.removeControl(this.currentDialogBox);
        this.advancedTexture.removeControl(this.hideButton)
      }
    }


    updateNonDialogAnimation(visible: boolean, targetObject: Rectangle) {
      this.nondialogAnimation = new Animation(
        "nondialogAnimation",
        "left",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

      const keys = [];
      if (visible) {
          keys.push({ frame: 0, value: 450 });
          keys.push({ frame: 30, value: 0 });
      } else {
          keys.push({ frame: 0, value: 0 });
          keys.push({ frame: 30, value: 450 });
      }
      this.nondialogAnimation.setKeys(keys);
      this.scene.beginDirectAnimation(targetObject, [this.nondialogAnimation], 0, 30, false);
  }

    updateDialogAnimation(visible: boolean, targetObject: Rectangle) {
      const keys = [];
      if (visible) {
          keys.push({ frame: 0, value: 500 });
          keys.push({ frame: 30, value: 50 });
      } else {
          keys.push({ frame: 0, value: 50 });
          keys.push({ frame: 30, value: 500 });
      }
      this.dialogAnimation.setKeys(keys);
      this.scene.beginDirectAnimation(targetObject, [this.dialogAnimation], 0, 30, false);
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
    grid.paddingBottom = '10%';
    grid.background = 'red';

    // Определяем 2 колонки для текст-блоков и полей ввода
    grid.addColumnDefinition(1); // Колонка для TextBlock
    grid.addColumnDefinition(1); // Колонка для InputText

    // Определяем 6 строк: первая строка займет 2 колонки
    grid.addRowDefinition(1); // Строка 0 (для заголовка)
    grid.addRowDefinition(1); // Строка 1
    grid.addRowDefinition(1); // Строка 2
    grid.addRowDefinition(1); // Строка 3
    grid.addRowDefinition(1); // Строка 4
    grid.addRowDefinition(1); // Строка 5

    // Добавляем текстовый блок в первую строку, объединяя его на две колонки
    const headerTextBlock = new TextBlock();
    headerTextBlock.text = "Заголовок"; // Заголовок
    headerTextBlock.color = "black";
    headerTextBlock.fontSize = 24;
    headerTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    headerTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    // Объединяем ячейки заголовка
    grid.addControl(headerTextBlock, 0, 0); // Заголовок в первой ячейке
    grid.addControl(headerTextBlock, 0, 1); // Вторую ячейку также заполняем для объединения

    // Создаем текстовые блоки и поля ввода
    for (let i = 0; i < 5; i++) {
        // Создаем текстовый блок
        const textBlock = new TextBlock();
        textBlock.text = `Текст ${i + 1}`;
        textBlock.color = "black";
        textBlock.fontSize = 24;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        // Добавляем TextBlock в первую колонку Grid
        grid.addControl(textBlock, i + 1, 0); // Начинаем с 1, чтобы пропустить заголовок
        textBlocks.push(textBlock);

        // Создаем поле ввода
        const inputField = new InputText();
        inputField.width = "90%";
        inputField.height = "30px";
        inputField.color = "white";
        inputField.background = "grey";

        // Добавляем InputText во вторую колонку Grid
        grid.addControl(inputField, i + 1, 1);
        inputFields.push(inputField);

        // Пример использования: при изменении текста
        inputField.onBlurObservable.add(() => {
            console.log(`Введенное значение в поле ${i + 1}: ${inputField.text}`);
        });
    }

    // Устанавливаем rowspan для заголовка, чтобы он занимал обе колонки
    headerTextBlock.height = "100%";
    headerTextBlock.width = "100%";
    
    // Добавляем Grid в контейнер
    container.addControl(grid);

    // Добавляем контейнер на экран
    this.advancedTexture.addControl(container);
}

  // Метод для показа сообщения с расстоянием
  showDistanceMessage(message: string): void {
    const textBlock = new TextBlock();
    textBlock.text = message;
    textBlock.color = "white";
    textBlock.fontSize = 24;
    this.advancedTexture.addControl(textBlock);
    
    // Удаление сообщения через 5 секунд
    setTimeout(() => {
      this.advancedTexture.removeControl(textBlock); // Удаляем текстовый блок
    }, 3000);
  }

  createBorderBox(): void {
    const boundaryBoxSize = 130; // Увеличенная ширина
    const boundaryBoxHeight = 50; // Высота стенки
    
    const boundaryBox = MeshBuilder.CreateBox("boundaryBox", { 
      width: boundaryBoxSize, 
      height: boundaryBoxHeight, 
      depth: boundaryBoxSize, 
      sideOrientation: Mesh.BACKSIDE
    }, this.scene);
    
    // Устанавливаем положение куба, чтобы центр находился на уровне пола
    boundaryBox.position.y = boundaryBoxHeight / 2;
    boundaryBox.checkCollisions = true;
    
    // Делаем куб невидимым, чтобы он не отвлекал от сцены
    boundaryBox.isVisible = false;
  }






}


