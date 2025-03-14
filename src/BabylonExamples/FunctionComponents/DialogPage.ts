import { Rectangle, TextBlock, Control, Grid, InputText, TextWrapping, ScrollViewer, Button, StackPanel, AdvancedDynamicTexture, Image } from "@babylonjs/gui";
import eventEmitter from "../../../EventEmitter"
import { Color3, FreeCamera, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3, VideoTexture } from "@babylonjs/core";

export class DialogPage {
    private scene: Scene;
    public pageContainer: Rectangle;
    public scrollViewer: ScrollViewer
    private videoMesh: Mesh;
    private videoTexture: VideoTexture;
    private skipButtonGui: Button;
    private htmlVideo: HTMLVideoElement;
    private videoContainer: HTMLDivElement | null = null;

    constructor() {
        this.pageContainer = new Rectangle();
        this.pageContainer.width = "55%";
        this.pageContainer.height = "85%";
        this.pageContainer.paddingRight = "-4%"
        // this.pageContainer.background = 'white'
        this.pageContainer.thickness = 0;
        
        // Создаем ScrollViewer и добавляем его в pageContainer
        this.scrollViewer = new ScrollViewer();
        this.scrollViewer.width = "100%";
        this.scrollViewer.height = "100%";
        this.scrollViewer.paddingTop = "10%"
        this.scrollViewer.paddingBottom = "5%"

        this.scrollViewer.barSize = 7
        // this.scrollViewer.background = 'white'
        this.scrollViewer.thickness = 0;
        this.pageContainer.addControl(this.scrollViewer);
    }

    // Метод для добавления текста на страницу
    addText(content: string, onComplete?: () => void): void {

        // if (this.currentPageBox) {
        //     this.advancedTexture.removeControl(this.currentPageBox);
        //   }
        this.pageContainer.clearControls();

        // Создаем ScrollViewer и добавляем его в pageContainer
        const scrollViewer = new ScrollViewer();
        scrollViewer.width = "60%";
        scrollViewer.height = "75%";
        scrollViewer.paddingRight = "-1.5%"
        scrollViewer.paddingBottom = "5%"
        scrollViewer.barSize = 7
        // scrollViewer.background = 'red'
        scrollViewer.thickness = 0;

        const dialogText = new TextBlock();
        dialogText.text = "";
        dialogText.color = "#212529";
        dialogText.fontSize = "4.5%";
        dialogText.fontFamily = "Segoe UI";
        dialogText.resizeToFit = true;
        dialogText.textWrapping = TextWrapping.WordWrap;
        dialogText.width = "100%";
        dialogText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        // dialogText.paddingTop = "10%";
        // dialogText.paddingLeft = "15%";
        // dialogText.paddingRight = "15%";
        // dialogText.paddingBottom = "7%";

        // Добавляем dialogText в ScrollViewer
        scrollViewer.addControl(dialogText);
        this.pageContainer.addControl(scrollViewer);

        let currentIndex = 0;

        // Функция для анимации печатания текста
        const typingInterval = setInterval(() => {
            dialogText.text += content[currentIndex];
            currentIndex++;
            if (currentIndex >= content.length) {
                clearInterval(typingInterval);
                if (onComplete) {
                    onComplete();
                }
            }
        }, 20);

        return scrollViewer;
    }

    cluePage(content: string): TextBlock {

        const pagcont = new Rectangle();
        pagcont.width = "55%";
        pagcont.height = "85%";
        pagcont.paddingRight = "-2%"
        // this.pageContainer.background = 'white'
        pagcont.thickness = 0;

        const dialogText = new TextBlock();
        dialogText.text = content;
        dialogText.color = "#212529";
        dialogText.fontSize = "4.5%";
        dialogText.fontFamily = "Segoe UI";
        dialogText.resizeToFit = true;
        dialogText.textWrapping = TextWrapping.WordWrap;
        dialogText.width = "90%";

        pagcont.addControl(dialogText);

        return pagcont;
    }
    

    // Метод для добавления сетки с текстовыми блоками и полями ввода
    addInputGrid(header: string, items: string[]): void {
        const grid = new Grid();
        grid.width = "60%";
        grid.height = "50%";
        grid.paddingBottom = "10%";

        grid.addColumnDefinition(1);
        grid.addColumnDefinition(1);
        grid.addRowDefinition(1);
        grid.addRowDefinition(1);
        grid.addRowDefinition(1);
        grid.addRowDefinition(1);
        grid.addRowDefinition(1);
        grid.addRowDefinition(1);

        const headerTextBlock = new TextBlock();
        headerTextBlock.text = header;
        headerTextBlock.color = "black";
        headerTextBlock.fontSize = "50%";
        headerTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        headerTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        grid.addControl(headerTextBlock, 0, 0);
        grid.addControl(headerTextBlock, 0, 1);

        items.forEach((item, i) => {
            const textBlock = new TextBlock();
            textBlock.text = item;
            textBlock.color = "black";
            textBlock.fontSize = "40%";
            grid.addControl(textBlock, i + 1, 0);

            const inputField = new InputText();
            inputField.width = "90%";
            inputField.height = "90%";
            inputField.color = "white";
            inputField.background = "grey";
            grid.addControl(inputField, i + 1, 1);
        });

        this.pageContainer.addControl(grid);

        return grid
    }

    addInputGrid1(
        header: string,
        items: string[],
        ranges: { min: number; max: number }[],
        onCheckCallback?: () => void, // Новый параметр - коллбэк
        totalRows: number = 8
      ): Grid {
        const innerContainer = new Rectangle();
        innerContainer.width = "100%";
        innerContainer.height = "100%";
        innerContainer.thickness = 0
        const grid = new Grid();
        grid.width = "60%";
        grid.height = "50%";
        grid.top = "-15%";
      
        grid.addColumnDefinition(1);
        grid.addColumnDefinition(0.5);
        grid.addColumnDefinition(0.5);
      
        for (let i = 0; i < totalRows; i++) {
          grid.addRowDefinition(0.2);
        }
      
        const headerTextBlock = new TextBlock();
        headerTextBlock.text = header;
        headerTextBlock.color = "black";
        headerTextBlock.fontSize = "20px";
        headerTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        headerTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        headerTextBlock.columnSpan = 3;
        grid.addControl(headerTextBlock, 0, 0);
      
        const statusIcons: TextBlock[] = [];
        const inputFields: InputText[] = [];
      
        items.forEach((item, i) => {
          if (i + 1 >= totalRows) {
            console.warn(`Количество элементов превышает доступные строки (${totalRows - 1})`);
            return;
          }
      
          const currentRow = i + 1;
      
          const textBlock = new TextBlock();
          textBlock.text = item;
          textBlock.color = "black";
          textBlock.fontSize = "18px";
          grid.addControl(textBlock, currentRow, 0);
      
          const inputField = new InputText();
          inputField.width = "90%";
          inputField.height = "70%";
          inputField.color = "white";
          inputField.background = "grey";
          grid.addControl(inputField, currentRow, 1);
          inputFields.push(inputField);
      
          const statusIcon = new TextBlock();
          statusIcon.text = "";
          statusIcon.color = "transparent";
          statusIcon.fontSize = "18px";
          statusIcon.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          statusIcon.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          statusIcon.isVisible = false;
          grid.addControl(statusIcon, currentRow, 2);
          statusIcons.push(statusIcon);
        });
      
        const checkButton = Button.CreateSimpleButton("CheckBtn", "Проверка");
        checkButton.width = "150px";
        checkButton.height = "40px";
        checkButton.color = "white";
        checkButton.background = "green";
        checkButton.thickness = 2;
        checkButton.top = "20%"
        innerContainer.addControl(checkButton);
      
        checkButton.onPointerClickObservable.add(() => {
          statusIcons.forEach((statusIcon, index) => {
            statusIcon.isVisible = true;
            const inputField = inputFields[index];
            const value = parseFloat(inputField.text);
            const range = ranges[index];
            if (isNaN(value)) {
              statusIcon.text = "";
              statusIcon.color = "transparent";
            } else if (value >= range.min && value <= range.max) {
              statusIcon.text = "✔";
              statusIcon.color = "green";
            } else {
              statusIcon.text = "✖";
              statusIcon.color = "red";
            }
          });
      
          // Вызываем коллбэк для управления видимостью мешей
          if (onCheckCallback) {
            onCheckCallback();
          }
          
        });
      
        innerContainer.addControl(grid);
        this.pageContainer.addControl(innerContainer);
        return innerContainer;
      }
      
    addInputFields(header: string): void {
        const grid = new Grid();
        grid.width = "60%";  // Ограничим ширину сетки
        grid.height = "75%";  // Ограничим высоту сетки
        grid.paddingBottom = "5%";  // Уменьшаем padding снизу
    
        // Определяем 2 столбца и 4 строки
        grid.addColumnDefinition(0.5);  // Пропорциональная ширина столбцов
        grid.addColumnDefinition(0.5);  // Пропорциональная ширина столбцов
        grid.addRowDefinition(0.1);  // Заголовок
        grid.addRowDefinition(0.2);  // Поле ввода 1
        grid.addRowDefinition(0.2);  // Поле ввода 2
        grid.addRowDefinition(0.2);  // Поле ввода 3
        grid.addRowDefinition(0.2);  // Дополнительное пространство, если нужно
    
        // Заголовок
        const headerTextBlock = new TextBlock();
        headerTextBlock.text = header;
        headerTextBlock.color = "#212529";  // Цвет темный
        headerTextBlock.fontSize = "18px";  // Уменьшаем размер шрифта для заголовка
        headerTextBlock.fontFamily = "Segoe UI";  // Шрифт
        headerTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        headerTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
        grid.addControl(headerTextBlock, 0, 0);  // Заголовок в первую строку
        grid.addControl(headerTextBlock, 0, 1);  // Заголовок во второй столбец
    
        // Поля ввода
        const fields = [
            { placeholder: "Арматура гор.", correctValue: "4" },
            { placeholder: "Арматура верт.", correctValue: "4" },
            { placeholder: "Кабель (мм)", correctValue: "10" }
        ];

        
    
        fields.forEach((field, index) => {
            // Кликабельная кнопка
            const clickableButton = Button.CreateSimpleButton(`button${index}`, field.placeholder);
            clickableButton.width = "90%";  // Ширина кнопки
            clickableButton.height = "40px";  // Высота кнопки
            clickableButton.color = "white";  // Цвет текста
            clickableButton.background = "gray";  // Фон кнопки (синий)
            clickableButton.fontSize = "14px";  // Размер шрифта
            clickableButton.cornerRadius = 1;  // Скругление углов
            clickableButton.thickness = 1;  // Толщина границы
            clickableButton.borderColor = "#0056b3";  // Цвет границы
            clickableButton.hoverCursor = "pointer";  // Курсор указателя при наведении
    
            // Эффект при наведении
            clickableButton.onPointerEnterObservable.add(() => {
                clickableButton.background = "#0056b3";  // Более темный фон при наведении
            });
            clickableButton.onPointerOutObservable.add(() => {
                if (clickableButton.background !== "green") { // Если кнопка не зеленая, возвращаем цвет
                    clickableButton.background = "gray";  // Восстановить оригинальный фон
                }
            });
    
            // Логика нажатия
            clickableButton.onPointerUpObservable.add(() => {
                if (inputField.text === field.correctValue) {
                    clickableButton.background = "green"; // Оставляем кнопку зеленой
                } else {
                    clickableButton.background = "red"; // Кнопка красная, если значение неправильное
                }
            });
    
            grid.addControl(clickableButton, index + 1, 0);  // Кнопка в первый столбец
    
            // Поле ввода
            const inputField = new InputText();
            inputField.width = "90%";  // Поле ввода занимает 90% ширины
            inputField.height = "30px";  // Установим фиксированную высоту поля ввода
            inputField.color = "black";  // Цвет текста внутри поля
            inputField.background = "#f0f0f0";  // Светлый фон
            inputField.fontSize = "14px";  // Размер шрифта для текста
            inputField.placeholderText = field.placeholder;  // Текст-заполнитель
            inputField.focusedBackground = "#f0f0f0";  // Фон не меняется при фокусе
            inputField.focusedColor = "black";  // Цвет текста при фокусе остается черным
            inputField.placeholderColor = "gray";  // Цвет текста-заполнителя
            inputField.onBeforeKeyAddObservable.add(() => {
                inputField.fontSize = "14px"; // Увеличиваем размер шрифта при вводе
            });

            inputField.onBlurObservable.add(() => {
                if (!inputField.text) {
                    inputField.fontSize = "9px"; // Возвращаем меньший размер, если поле пустое
                }
            });

            grid.addControl(inputField, index + 1, 1);  // Поля ввода во второй столбец
        });
    
        // Добавляем сетку на страницу
        this.pageContainer.addControl(grid);
    
        return grid;
    }

    // Метод для создания контейнера под видео
    addVideoContainer(): HTMLDivElement {
        if (this.videoContainer) return this.videoContainer;

        // --- Создаём контейнер для видео ---
        this.videoContainer = document.createElement("div");
        this.videoContainer.style.position = "absolute";
        this.videoContainer.style.width = "60%";
        this.videoContainer.style.height = "40%";
        this.videoContainer.style.top = "20%";
        this.videoContainer.style.left = "20%";
        this.videoContainer.style.backgroundColor = "black";
        this.videoContainer.style.border = "2px solid white";
        this.videoContainer.style.borderRadius = "10px";
        this.videoContainer.style.overflow = "hidden";
        this.videoContainer.style.zIndex = "10";

        // --- Добавляем контейнер на экран ---
        document.body.appendChild(this.videoContainer);

        return this.videoContainer;
    }

    // Метод для удаления контейнера
    removeVideoContainer() {
        if (this.videoContainer) {
            document.body.removeChild(this.videoContainer);
            this.videoContainer = null;
        }
    }

    // createStartPage(ref: string): void {
    //     // Создаем отдельный контейнер для этой страницы
    //     const innerContainer = new Rectangle();
    //     innerContainer.width = "55%";
    //     innerContainer.height = "85%";
    //     innerContainer.thickness = 0;

    //     // Создаем текстовое сообщение
    //     const messageText = new TextBlock();
    //     messageText.text = "Если готовы начать тестирование нажмите на кнопку";
    //     messageText.color = "#212529";
    //     messageText.fontSize = "5%";
    //     messageText.fontFamily = "Segoe UI";
    //     messageText.textWrapping = TextWrapping.WordWrap;
    //     messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    //     messageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    //     // Добавляем текст в контейнер
    //     innerContainer.addControl(messageText);

    //     // Создаем кнопку
    //     const startButton = Button.CreateSimpleButton("startBtn", "Перейти");
    //     startButton.width = "150px";
    //     startButton.height = "50px";
    //     startButton.color = "white";
    //     startButton.background = "gray";
    //     startButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    //     startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    //     startButton.top = "-75px";

    //     // Добавляем кнопку в контейнер
    //     innerContainer.addControl(startButton);

    //     // Обработка нажатия на кнопку
    //     startButton.onPointerUpObservable.add(() => {
    //         window.location.href = ref;
    //     });

    //     // Добавляем контейнер со всеми элементами в ScrollViewer
    //     this.pageContainer.addControl(innerContainer);

    //     return innerContainer
    // }

    createStartPage(message: string, buttonLabel: string, onButtonClick: () => void): void {
        // Создаем отдельный контейнер для этой страницы
        const innerContainer = new Rectangle();
        innerContainer.width = "55%";
        innerContainer.height = "85%";
        innerContainer.thickness = 0;
        // innerContainer.background = 'red'
    
        // Создаем текстовое сообщение
        const messageText = new TextBlock();
        messageText.text = message;
        messageText.color = "#212529";
        messageText.fontSize = "4.5%";
        messageText.fontFamily = "Segoe UI";
        messageText.textWrapping = TextWrapping.WordWrap;
        messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        messageText.paddingTop = "-50%"
    
        // Добавляем текст в контейнер
        innerContainer.addControl(messageText);
    
        // Создаем кнопку с переданным текстом
        const button = Button.CreateSimpleButton("actionBtn", buttonLabel);
        button.width = "150px";
        button.height = "50px";
        button.color = "white";
        button.background = "gray";
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        button.top = "-75px";
    
        // Добавляем обработчик нажатия на кнопку
        button.onPointerUpObservable.add(onButtonClick);
    
        // Добавляем кнопку в контейнер
        innerContainer.addControl(button);
    
        // Добавляем контейнер со всеми элементами в ScrollViewer или другой родительский контейнер
        this.pageContainer.addControl(innerContainer);
    
        return innerContainer;
    }
    
    createTextGridPage(header: string, items: string[]): void {
        // Создаем новый Grid
        const grid = new Grid();
        grid.width = "55%";
        grid.height = "50%";
        grid.paddingBottom = "10%";
    
        // Определяем одну колонку и три строки
        grid.addColumnDefinition(1);
        grid.addRowDefinition(1); // Первая строка для заголовка
        grid.addRowDefinition(1);
        grid.addRowDefinition(1);
        grid.addRowDefinition(1);
    
        // Создаем и добавляем заголовок
        const headerTextBlock = new TextBlock();
        headerTextBlock.text = header;
        headerTextBlock.color = "black";
        headerTextBlock.fontSize = "50%";
        headerTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        headerTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        grid.addControl(headerTextBlock, 0, 0);
    
        // Добавляем строки текста в каждую строку и подписываем их на события
        items.forEach((item, i) => {
            const textBlock = new TextBlock();
            textBlock.text = item;
            textBlock.color = "black";
            textBlock.fontSize = "35%";
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(textBlock, i + 1, 0);
    
            // Подписка на обновления для каждой строки, исходя из порядка
            if (i === 0) {
                eventEmitter.on("updateAnswers", (newText: string) => {
                    textBlock.text = newText;
                });
            } else if (i === 1) {
                eventEmitter.on("updateCorrectAnswers", (newText: string) => {
                    textBlock.text = newText;
                });
            } else if (i === 2) {
                eventEmitter.on("updateIncorrectAnswers", (newText: string) => {
                    textBlock.text = newText;
                });
            }
        });
    
        // Добавляем grid в scrollViewer
        this.pageContainer.addControl(grid);

        return grid
    }

    /**
     * Создает страницу с текстовым блоком, где указанные слова заменены на пробелы.
     * @param content - исходный текст
     * @param wordsToReplace - массив слов, которые нужно заменить пробелами
     */
    addClickableWordsPage(
        content: string, 
        clickableWords: { 
            word: string; 
            imageUrl?: string;  // Сделал опциональным
            videoUrl?: string;  // Добавил опциональное поле для видео
            top?: string; 
            left?: string; 
            width?: string 
        }[], 
        advancedTexture: AdvancedDynamicTexture,
        camera?: FreeCamera // Добавил опциональный параметр камеры для видео
    ): void {
        this.pageContainer.clearControls();
    
        let modifiedText = content;
    
        // Заменяем указанные слова на подчёркивания
        clickableWords.forEach((obj) => {
            const w = obj.word;
            const underscores = "..".repeat(w.length);
            modifiedText = modifiedText.replace(w, underscores);
        });
    
        const innerContainer = new Rectangle();
        innerContainer.width = "60%";
        innerContainer.height = "75%";
        innerContainer.thickness = 0;
        innerContainer.left = "2%"
        innerContainer.top = "-7%"
        // innerContainer.background = 'red'
    
        const dialogText = new TextBlock();
        dialogText.text = modifiedText;
        dialogText.color = "#212529";
        dialogText.fontSize = "4.5%";
        dialogText.fontFamily = "Segoe UI";
        dialogText.resizeToFit = true;
        dialogText.textWrapping = true;
        dialogText.width = "100%";
        dialogText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dialogText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        dialogText.textWrapping = TextWrapping.WordWrap;
        // dialogText.top = "-15%";
    
        innerContainer.addControl(dialogText);
    
        // Создаем оверлей для отображения картинок
        const overlay = this.createImageOverlay(advancedTexture);
    
        // Для каждого кликабельного слова создадим кнопку
        clickableWords.forEach((obj, index) => {
            const btn = Button.CreateSimpleButton("wordBtn" + index, obj.word);
            btn.fontSize = "4%";
            btn.width = obj.width ?? "25%";
            btn.height = "5%";
            btn.color = "#212529";
            btn.background = "#B9BFBF";
            btn.thickness = 1;
            btn.textBlock!.textWrapping = true;
            btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
            // Если top и left не указаны, используем значения по умолчанию
            btn.top = obj.top ?? "190px";
            btn.left = obj.left ?? "10px";
    
            // При клике на кнопку проверяем, что показывать
            btn.onPointerUpObservable.add(() => {
                if (obj.videoUrl && camera) {
                    // Если есть videoUrl и передана камера, показываем видео
                    this.showVideo(obj.videoUrl, advancedTexture, camera);
                } else if (obj.imageUrl) {
                    // Если есть imageUrl, показываем картинку
                    this.showImageInOverlay(overlay, obj.imageUrl);
                }
            });
    
            innerContainer.addControl(btn);
        });
    
        this.pageContainer.addControl(innerContainer);
    
        return innerContainer;
    }
    

    /**
     * Создаем страницу с несколькими картинками (миниатюрами), расположенными по две в ряд.
     * При клике на миниатюру появляется оверлей с увеличенной версией картинки.
     * Под каждой картинкой размещаем название.
     * @param images - массив объектов: { thumbnailUrl: string, fullImageUrl: string, name: string }
     * @param advancedTexture - ссылка на AdvancedDynamicTexture
     */
    addZoomableImagePage(
        images: { thumbnailUrl: string; fullImageUrl: string; name?: string; }[],
        advancedTexture: AdvancedDynamicTexture,
        text?: string // Добавляем опциональный параметр для текста
    ): void {
        // Очищаем контейнер
        this.pageContainer.clearControls();
    
        // Создаём оверлей для увеличенной картинки
        const overlay = this.createImageOverlay(advancedTexture);
    
        // Количество колонок
        const cols = 2;
        const rows = Math.ceil(images.length / cols);
    
        const innerContainer = new Rectangle();
        innerContainer.width = "55%";
        innerContainer.height = "85%";
        innerContainer.thickness = 0;
    
        // Создаем Grid для размещения текста и картинок
        const mainGrid = new Grid();
        mainGrid.width = "100%";
        mainGrid.height = "100%";
    
        // Определяем строки: текст (если есть) и картинки
        if (text) {
            mainGrid.addRowDefinition(0.5); // 30% высоты для текста
            mainGrid.addRowDefinition(0.5); // 70% высоты для картинок
        } else {
            mainGrid.addRowDefinition(1); // 100% высоты для картинок
        }
        mainGrid.addColumnDefinition(1);
    
        // Если есть текст, добавляем TextBlock
// Если есть текст, добавляем TextBlock с прокруткой
if (text) {
    const scrollViewer = new ScrollViewer();
    scrollViewer.width = "100%"; // Устанавливаем ширину, чтобы соответствовать контейнеру
    scrollViewer.height = "90%"; // Оставляем высоту как есть
    scrollViewer.thickness = 0;
    scrollViewer.barSize = 7; // Размер полосы прокрутки
    scrollViewer.color = "#212529"; // Цвет полосы прокрутки (опционально)
    scrollViewer.background = "transparent"; // Фон прозрачный, чтобы не перекрывать

    const textBlock = new TextBlock();
    textBlock.text = text;
    textBlock.color = "#212529";
    textBlock.fontSize = "8%";
    textBlock.fontFamily = "Segoe UI";
    textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    textBlock.height = "100%"; // Задаем высоту, чтобы текст растягивался
    textBlock.resizeToFit = true; // Отключаем подгонку размера, чтобы включить прокрутку
    textBlock.textWrapping = TextWrapping.WordWrap;

    scrollViewer.addControl(textBlock);
    mainGrid.addControl(scrollViewer, 0, 0);
}
    
        // Создаём Grid для картинок
        const imageGrid = new Grid();
        imageGrid.width = "100%";
        imageGrid.height = "100%";
    
        // Определяем колонки по 50% ширины
        for (let c = 0; c < cols; c++) {
            imageGrid.addColumnDefinition(0.5);
        }
    
        // Определяем строки
        for (let r = 0; r < rows; r++) {
            imageGrid.addRowDefinition(1 / rows);
        }
    
        images.forEach((imgData, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
    
            // Контейнер для одной ячейки
            const imgContainer = new Rectangle();
            imgContainer.width = "90%";
            imgContainer.height = "90%";
            imgContainer.thickness = 0;
            imgContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            imgContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
            // Внутренний Grid для картинки и подписи
            const innerGrid = new Grid();
            innerGrid.width = "100%";
    
            // Если есть подпись, две строки: одна под картинку, одна под текст
            if (imgData.name) {
                innerGrid.addRowDefinition(150, true); // 150px под картинку
                innerGrid.addRowDefinition(30, true);  // 30px под подпись
            } else {
                // Без подписи одна строка
                innerGrid.addRowDefinition(150, true);
            }
            innerGrid.addColumnDefinition(1);
    
            // Создаём миниатюру картинки
            const thumbImage = new Image("thumbImage" + index, imgData.thumbnailUrl);
            thumbImage.width = "100%";
            thumbImage.height = "100%";
            thumbImage.stretch = Image.STRETCH_UNIFORM;
    
            // При клике - увеличенная картинка
            thumbImage.onPointerUpObservable.add(() => {
                this.showImageInOverlay(overlay, imgData.fullImageUrl);
            });
    
            // Добавляем картинку в первую строку
            innerGrid.addControl(thumbImage, 0, 0);
    
            // Если есть подпись, добавляем текст
            if (imgData.name) {
                const nameText = new TextBlock();
                nameText.text = imgData.name;
                nameText.color = "#212529";
                nameText.fontSize = "50%";
                nameText.textWrapping = true;
                nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                nameText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                innerGrid.addControl(nameText, 1, 0);
            }
    
            imgContainer.addControl(innerGrid);
            imageGrid.addControl(imgContainer, row, col);
        });
    
        // Добавляем imageGrid в основную сетку
        mainGrid.addControl(imageGrid, text ? 1 : 0, 0); // Если есть текст, картинки во второй строке
        innerContainer.addControl(mainGrid);
        this.pageContainer.addControl(innerContainer);
    
        return innerContainer;
    }

    addZoomableVideoPage(
        items: { thumbnailUrl: string; videoUrl: string; name?: string; }[],
        advancedTexture: AdvancedDynamicTexture,
        camera: FreeCamera
    ): void {
        this.pageContainer.clearControls();
    
        // Количество колонок
        const cols = 2;
    
        // Определяем минимальное количество элементов
        const minItems = items.length < 3 ? 3 : items.length;
    
        // Рассчитываем количество строк
        const rows = Math.ceil(minItems / cols);
    
        /**
         * Заполняет массив до необходимого количества элементов.
         * @param items Исходный массив элементов.
         * @param minItems Минимальное количество элементов.
         * @returns Новый массив с добавленными пустыми объектами при необходимости.
         */
        function fillItems(items: { thumbnailUrl: string; videoUrl: string; name?: string; }[], minItems: number): { thumbnailUrl: string; videoUrl: string; name?: string; }[] {
            const filledItems = [...items];
            while (filledItems.length < minItems) {
                filledItems.push({
                    thumbnailUrl: "", // Пустая ссылка на изображение
                    videoUrl: "",     // Пустая ссылка на видео
                    name: "",         // Пустое имя
                });
            }
            return filledItems;
        }
    
        // Заполняем массив до необходимого количества элементов
        const filledItems = fillItems(items, rows * cols);
    
        // Создаем внутренний контейнер
        const innerContainer = new Rectangle();
        innerContainer.width = "60%";
        innerContainer.height = "75%";
        innerContainer.paddingBottom = "5%";
        innerContainer.thickness = 0;
        innerContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        innerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    
        // Создаем основную сетку
        const grid = new Grid();
        grid.width = "100%";
        grid.height = "100%";
        // grid.background = "red"; // Для отладки можно оставить
    
        // Определение столбцов
        for (let c = 0; c < cols; c++) {
            grid.addColumnDefinition(1 / cols);
        }
    
        // Определение строк
        for (let r = 0; r < rows; r++) {
            grid.addRowDefinition(1 / rows);
        }
    
        // Проходим по всем заполненным элементам
        filledItems.forEach((item, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
    
            const imgContainer = new Rectangle();
            imgContainer.width = "90%";
            imgContainer.height = "90%";
            imgContainer.thickness = 0;
            imgContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            imgContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
            // Проверяем, является ли элемент пустым
            const isEmpty = !item.thumbnailUrl && !item.videoUrl && !item.name;
    
            if (!isEmpty) {
                const innerGrid = new Grid();
                innerGrid.width = "100%";
                innerGrid.height = "100%";
                innerGrid.thickness = 0;
    
                // Определяем строки внутри innerGrid: изображение и текст
                innerGrid.addRowDefinition(4); // Изображение занимает 4 части
                innerGrid.addRowDefinition(1); // Текст занимает 1 часть
                innerGrid.addColumnDefinition(1);
    
                // Создаем Image
                const thumbImage = new Image("thumb" + index, item.thumbnailUrl);
                thumbImage.width = "100%";
                thumbImage.height = "100%";
                thumbImage.stretch = Image.STRETCH_UNIFORM;
    
                // Добавляем обработчик клика только если есть видео
                if (item.videoUrl) {
                    thumbImage.onPointerUpObservable.add(() => {
                        this.showVideo(item.videoUrl, advancedTexture, camera);
                    });
                }
    
                innerGrid.addControl(thumbImage, 0, 0);
    
                // Создаем TextBlock
                const nameText = new TextBlock();
                nameText.text = item.name || "";
                nameText.color = "#212529";
                nameText.fontSize = 14;
                nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                nameText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                // Не задаем высоту, чтобы текст занимал минимально необходимое пространство
    
                innerGrid.addControl(nameText, 1, 0);
    
                imgContainer.addControl(innerGrid);
            } else {
                // Если элемент пустой, делаем контейнер невидимым
                imgContainer.isVisible = false;
            }
    
            grid.addControl(imgContainer, row, col);
        });
    
        innerContainer.addControl(grid);
        this.pageContainer.addControl(innerContainer);
        return innerContainer;
    }
    
    
    

    private showVideo(videoUrl: string, advancedTexture: AdvancedDynamicTexture, camera: FreeCamera): void {
        // Если видео уже отображается, сначала удаляем его
        if (this.videoMesh) {
            this.hideVideo();
        }
    
        // Создаём видео элемент
        this.htmlVideo = document.createElement('video');
        this.htmlVideo.src = videoUrl;
        this.htmlVideo.crossOrigin = "anonymous";
        this.htmlVideo.autoplay = true;
        this.htmlVideo.loop = true;
        this.htmlVideo.muted = false; // Измените по необходимости
        this.htmlVideo.play();
    
        // Создаём VideoTexture
        this.videoTexture = new VideoTexture("videoTexture", this.htmlVideo, this.scene, true, true, VideoTexture.TRILINEAR_SAMPLINGMODE, {
            autoUpdateTexture: true,
            loop: true
        });
    
        // Создаём материал с видео текстурой
        const videoMaterial = new StandardMaterial("videoMaterial", this.scene);
        videoMaterial.diffuseTexture = this.videoTexture;
        videoMaterial.emissiveTexture = this.videoTexture;
        videoMaterial.disableLighting = true;
        videoMaterial.emissiveColor = new Color3(1, 1, 1);
    
        // Создаём плоскость для отображения видео
        this.videoMesh = MeshBuilder.CreatePlane("videoPlane", { width: 0.8, height: 0.5 }, this.scene);
        this.videoMesh.material = videoMaterial;
        // this.videoMesh.scaling.x *= -1
        this.videoMesh.scaling.y *= -1
    
        if (camera) {
            // Делаем плоскость дочерним объектом камеры
            this.videoMesh.parent = camera;
    
            // Устанавливаем позицию плоскости относительно камеры
            // Например, перед камерой на 2 единицы
            this.videoMesh.position = new Vector3(0, 0, 1);
    
            // Опционально: ориентируем плоскость, чтобы она всегда смотрела в ту же сторону, что и камера
            this.videoMesh.rotation = new Vector3(0, 0, 0);
        } else {
            console.warn("Активная камера не найдена. Видео не будет позиционироваться относительно камеры.");
        }
    
        // Создаём кнопку "Пропустить" в Babylon GUI
        this.skipButtonGui = Button.CreateSimpleButton("skipButton", "Закрыть");
        this.skipButtonGui.width = "7%";
        this.skipButtonGui.height = "5%";
        this.skipButtonGui.color = "white";
        this.skipButtonGui.background = "gray";
        this.skipButtonGui.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.skipButtonGui.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.skipButtonGui.top = "27%";
        this.skipButtonGui.left = "20.3%";
    
        this.skipButtonGui.onPointerUpObservable.add(() => {
            this.hideVideo();
        });
    
        advancedTexture.addControl(this.skipButtonGui);
    }
    
    

    private hideVideo(): void {
        // Останавливаем видео
        if (this.htmlVideo) {
            this.htmlVideo.pause();
            this.htmlVideo.src = "";
            this.htmlVideo.load();
            this.htmlVideo = null;
        }
    
        // Удаляем VideoTexture
        if (this.videoTexture) {
            this.videoTexture.dispose();
            this.videoTexture = null;
        }
    
        // Удаляем плоскость с видео
        if (this.videoMesh) {
            this.videoMesh.dispose();
            this.videoMesh = null;
        }
    
        // Удаляем кнопку "Пропустить"
        if (this.skipButtonGui) {
            this.skipButtonGui.dispose();
            this.skipButtonGui = null;
        }
    }
    
    
    
    /**
     * Создаем оверлей для отображения картинок в полный размер.
     * По умолчанию невидим, показывается при вызове showImageInOverlay.
     */
    private createImageOverlay(advancedTexture: AdvancedDynamicTexture): Rectangle {
        const overlay = new Rectangle();
        overlay.width = "100%";
        overlay.height = "100%";
        overlay.background = "rgba(0, 0, 0, 0.8)";
        overlay.thickness = 0;
        overlay.isVisible = false;
        overlay.zIndex = 999; // Чтобы было поверх всех

        const fullImage = new Image("fullImage", "");
        fullImage.width = "70%";
        fullImage.height = "70%";
        fullImage.stretch = Image.STRETCH_UNIFORM;
        fullImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        fullImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        // Добавляем кнопку закрытия
        const closeButton = Button.CreateSimpleButton("closeOverlay", "Закрыть");
        closeButton.width = "7%";
        closeButton.height = "5%";
        closeButton.color = "white";
        closeButton.background = "gray";
        closeButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        closeButton.top = "-10%";
        closeButton.onPointerUpObservable.add(() => {
            overlay.isVisible = false;
        });

        overlay.addControl(fullImage);
        overlay.addControl(closeButton);

        advancedTexture.addControl(overlay);

        return overlay;
    }

    /**
     * Показываем картинку в оверлее
     */
    private showImageInOverlay(overlay: Rectangle, imageUrl: string) {
        // Находим Image внутри оверлея
        const fullImage = overlay.getChildByName("fullImage") as Image;
        fullImage.source = imageUrl;
        overlay.isVisible = true;
    }

    createNumericInputPage(
        headerText: string, 
        gridLabelText: string, 
        minVal: number, 
        maxVal: number, 
        onValidInput: () => void
    ): void {
        // Очищаем текущий контейнер страницы
        this.pageContainer.clearControls();
        
        // Создаём общий контейнер для этой страницы
        const innerContainer = new Rectangle();
        innerContainer.width = "60%";
        innerContainer.height = "75%";
        innerContainer.thickness = 0;
        innerContainer.paddingBottom = "5%";
        // innerContainer.background = "white"; // При необходимости можно задать фон
    
        // Верхний текстовый блок
        const headerTextBlock = new TextBlock();
        headerTextBlock.text = headerText;
        headerTextBlock.color = "#212529";
        headerTextBlock.fontSize = "4.5%";
        headerTextBlock.fontFamily = "Segoe UI";
        headerTextBlock.textWrapping = TextWrapping.WordWrap;
        headerTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        headerTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        headerTextBlock.paddingBottom = "5%";
        innerContainer.addControl(headerTextBlock);
    
        // Создаём Grid с одной строкой и двумя колонками для текстблока и поля ввода
        const grid = new Grid();
        grid.width = "100%";
        grid.height = "10%";
        grid.top = "20%"
        // grid.background = "red"
        grid.addColumnDefinition(0.7);
        grid.addColumnDefinition(0.3);
        grid.addRowDefinition(1);
    
        // Текст в первой ячейке
        const labelTextBlock = new TextBlock();
        labelTextBlock.text = gridLabelText;
        labelTextBlock.color = "black";
        labelTextBlock.fontSize = "40%";
        labelTextBlock.textWrapping = TextWrapping.WordWrap;
        labelTextBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        labelTextBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        grid.addControl(labelTextBlock, 0, 0);
    
        // Поле ввода во второй ячейке
        const inputField = new InputText();
        inputField.width = "90%";
        inputField.height = "70%";
        inputField.color = "white";
        inputField.background = "grey";
        inputField.text = ""; 
        inputField.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        grid.addControl(inputField, 0, 1);
    
        innerContainer.addControl(grid);
    
        // Кнопка снизу страницы
        const actionButton = Button.CreateSimpleButton("actionBtn", "Проверить");
        actionButton.width = "150px";
        actionButton.height = "50px";
        actionButton.color = "white";
        actionButton.background = "gray";
        actionButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        actionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        actionButton.top = "-5%";
    
        // Обработчик нажатия на кнопку
        actionButton.onPointerUpObservable.add(() => {
            const userValue = parseFloat(inputField.text.trim());
    
            // Проверяем, является ли введённое значение числом и попадает ли оно в диапазон
            if (!isNaN(userValue) && userValue >= minVal && userValue <= maxVal) {
                // Если в диапазоне - вызываем переданную функцию
                onValidInput(userValue);
            } else {
                // Если не в диапазоне - выводим сообщение о неверной длине
                actionButton.textBlock!.text = "не верная длина";
            }
        });
    
        innerContainer.addControl(actionButton);
        this.pageContainer.addControl(innerContainer);
        return innerContainer
    }
    
}

// Это работает, в addText мы ретерним не текст а контейнер, вот почему
// import { Rectangle, TextBlock, Control, ScrollViewer } from "@babylonjs/gui";

// export class DialogPage {
//     public pageContainer: ScrollViewer;

//     constructor() {
//         this.pageContainer = new ScrollViewer();
//         this.pageContainer.width = "100%";
//         this.pageContainer.height = "100%";
//         this.pageContainer.thickness = 0;
//         this.pageContainer.background = "#B9BFBF"; // Полупрозрачный фон для проверки видимости
//         this.pageContainer.color = "black"; // Цвет границы
//         this.pageContainer.barSize = 15; // Размер полос прокрутки
//         this.pageContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
//         this.pageContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
//     }

//     // Метод для добавления текста в ScrollViewer
//     addText(content: string, onComplete?: () => void): ScrollViewer {
//         const dialogText = new TextBlock();
//         dialogText.text = "";
//         dialogText.color = "#212529";
//         dialogText.fontSize = "4%";
//         dialogText.fontFamily = "Segoe UI";
//         dialogText.resizeToFit = true;
//         dialogText.textWrapping = TextWrapping.WordWrap;
//         dialogText.paddingTop = "2%";
//         dialogText.paddingLeft = "5%";
//         dialogText.paddingRight = "5%";
//         dialogText.paddingBottom = "7%";

//         // Добавляем TextBlock в ScrollViewer
//         this.pageContainer.addControl(dialogText);

//         let currentIndex = 0;

//         // Функция для анимации печатания текста
//         const typingInterval = setInterval(() => {
//             dialogText.text += content[currentIndex];
//             currentIndex++;
//             if (currentIndex >= content.length) {
//                 clearInterval(typingInterval);
//                 if (onComplete) {
//                     onComplete();
//                 }
//             }
//         }, 50); // Скорость печатания (в миллисекундах)

//         return this.pageContainer; // Возвращаем ScrollViewer с текстом
//     }
// }

