import { Rectangle, TextBlock, Control, Grid, InputText, TextWrapping, ScrollViewer, Button } from "@babylonjs/gui";
import eventEmitter from "../../../EventEmitter"

export class DialogPage {
    public pageContainer: Rectangle;
    public scrollViewer: ScrollViewer

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
    addText(content: string, onComplete?: () => void): TextBlock {

        // if (this.currentPageBox) {
        //     this.advancedTexture.removeControl(this.currentPageBox);
        //   }
        this.scrollViewer.clearControls();

        const dialogText = new TextBlock();
        dialogText.text = "";
        dialogText.color = "#212529";
        dialogText.fontSize = "4.5%";
        dialogText.fontFamily = "Segoe UI";
        dialogText.resizeToFit = true;
        dialogText.textWrapping = TextWrapping.WordWrap;
        dialogText.width = "90%";
        dialogText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        // dialogText.paddingTop = "10%";
        // dialogText.paddingLeft = "15%";
        // dialogText.paddingRight = "15%";
        // dialogText.paddingBottom = "7%";

        // Добавляем dialogText в ScrollViewer
        this.scrollViewer.addControl(dialogText);

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
        }, 30);

        return this.pageContainer;
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

