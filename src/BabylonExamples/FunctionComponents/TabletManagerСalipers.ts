import { AdvancedDynamicTexture, Button, Rectangle, TextBlock, Control } from "@babylonjs/gui";

export class TabletManager {
    private guiTexture: AdvancedDynamicTexture;

    constructor() {
        // Создаем GUI текстуру
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    }

    createAlwaysVisibleTablet(): void {
        // Создаем контейнер планшета
        const tabletContainer = new Rectangle();
        tabletContainer.width = "50%";
        tabletContainer.height = "50%";
        tabletContainer.background = "black";
        tabletContainer.alpha = 0.8;
        tabletContainer.thickness = 2;
        tabletContainer.cornerRadius = 10;
        tabletContainer.color = "white";
        this.guiTexture.addControl(tabletContainer);

        // Заголовок планшета
        const title = new TextBlock();
        title.text = "Интерактивный планшет";
        title.color = "white";
        title.fontSize = 24;
        title.height = "10%";
        title.top = "-40%";
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tabletContainer.addControl(title);

        // Текст на планшете
        const tabletText = new TextBlock();
        tabletText.text = "Нажмите на кнопку для выполнения действия.";
        tabletText.color = "white";
        tabletText.fontSize = 20;
        tabletText.textWrapping = true;
        tabletText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        tabletContainer.addControl(tabletText);

        // Кнопка действия
        const actionButton = Button.CreateSimpleButton("actionButton", "Выполнить");
        actionButton.width = "30%";
        actionButton.height = "10%";
        actionButton.color = "white";
        actionButton.background = "green";
        actionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        actionButton.top = "-10%";
        actionButton.onPointerUpObservable.add(() => {
            console.log("Кнопка планшета нажата!");
            tabletText.text = "Действие выполнено!";
        });
        tabletContainer.addControl(actionButton);
    }
}