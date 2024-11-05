import { Rectangle, TextBlock, Control, Grid, InputText, TextWrapping } from "@babylonjs/gui";

export class DialogPage {
    public pageContainer: Rectangle;

    constructor() {
        this.pageContainer = new Rectangle();
        this.pageContainer.width = "100%";
        this.pageContainer.height = "100%";
        this.pageContainer.thickness = 0;
    }

    // Метод для добавления текста на страницу
    addText(content: string, onComplete?: () => void): TextBlock {
        const dialogText = new TextBlock();
        dialogText.text = "";
        dialogText.color = "#212529";
        dialogText.fontSize = "4%";
        dialogText.fontFamily = "Segoe UI";
        dialogText.resizeToFit = true;
        dialogText.textWrapping = TextWrapping.WordWrap;
        dialogText.width = "90%";
        dialogText.paddingTop = "2%";
        dialogText.paddingLeft = "15%";
        dialogText.paddingRight = "15%";
        dialogText.paddingBottom = "7%";
    
        this.pageContainer.addControl(dialogText);
    
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
        }, 50); // Скорость печатания (в миллисекундах)
    
        return dialogText; // Возвращаем созданный элемент
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

