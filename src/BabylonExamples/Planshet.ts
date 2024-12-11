import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, StackPanel, Control } from "@babylonjs/gui"; 
import * as BABYLON from "babylonjs";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: StackPanel[] = [];
    private currentPageIndex: number = 0;
    private isVisible: boolean = false;
    private navPanel: StackPanel | null = null;
    private popups: Rectangle[] = [];  // Массив для хранения всплывающих окон
    

    constructor(private scene: BABYLON.Scene) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = this.createContainer();
        this.guiTexture.addControl(this.container);

        this.initializePages();
    }

    private createContainer(): Rectangle {
        const container = new Rectangle();
        container.width = "50%";
        container.height = "70%";
        container.background = "black";
        container.thickness = 2;
        container.color = "white";
        container.isVisible = false;
        return container;
    }

    private initializePages() {
        this.pages = [
            this.createPage("Добро пожаловать на главный экран!", 24),
            this.createProjectsPage(),
            this.createPage("Текущий проект: TotalStationWork\nОписание: Этот проект включает в себя работу с тотальными станциями для измерения расстояний и углов.", 20),
            this.createPage("Конец презентации!", 20),
        ];
    }

    private createPage(content: string, fontSize: number): StackPanel {
        const page = new StackPanel();
        const text = new TextBlock();
        text.text = content;
        text.color = "white";
        text.fontSize = fontSize;
        page.addControl(text);
        return page;
    }

    private createProjectsPage(): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const headerContainer = new StackPanel();
        headerContainer.height = "80px";

        const header = new TextBlock();
        header.text = "Выберите проект, чтобы увидеть описание:";
        header.color = "white";
        header.fontSize = 18;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        headerContainer.addControl(header);
        page.addControl(headerContainer);

        const projectsContainer = new StackPanel();
        projectsContainer.paddingTop = "5px";

        const projects = [
            { id: "project1", name: "TotalStationWork", description: "Работа с тотальными станциями для измерения расстояний и углов." },
            { id: "project2", name: "TotalStation", description: "Программное обеспечение для обработки данных с тотальной станции." },
            { id: "project3", name: "TestScene2", description: "Простой тестовый проект для работы с Babylon.js." },
            { id: "project4", name: "QuestionScene", description: "Проект с вопросами и ответами." },
            { id: "project5", name: "NewDistanceScene", description: "Проект для работы с измерениями расстояний." },
            { id: "project6", name: "FullExample", description: "Полный пример работы с Babylon.js." },
            { id: "project7", name: "DistanceScene", description: "Проект для работы с дистанциями и измерениями." },
            { id: "project8", name: "BookScene2", description: "Проект с 3D книгой." },
            { id: "project9", name: "BookScene", description: "Проект с интерактивной книгой." },
            { id: "project10", name: "BetoneScene", description: "Проект с бетоном и строительными материалами." },
        ];

        projects.forEach(({ id, name, description }) => {
            const cell = this.createProjectCell(id, name, description);
            projectsContainer.addControl(cell);
        });

        page.addControl(projectsContainer);

        return page;
    }

    private createProjectCell(id: string, name: string, description: string): Rectangle {
    const cell = new Rectangle();
    cell.width = "80%";  // Еще уменьшаем ширину ячейки
    cell.height = "30px";  // Еще уменьшаем высоту ячейки
    cell.color = "white";
    cell.background = "blue";
    cell.paddingTop = "2px";  // Уменьшаем отступы сверху
    cell.paddingBottom = "2px";  // Уменьшаем отступы снизу
    cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    const cellText = new TextBlock();
    cellText.text = name;
    cellText.color = "white";
    cellText.fontSize = 14;  // Еще уменьшаем размер шрифта
    cellText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    cellText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    cell.addControl(cellText);

    // Обработчик клика по ячейке для отображения проекта
    cell.onPointerClickObservable.add(() => {
        // Создание всплывающего окна с описанием проекта
        const projectWindow = new Rectangle();
        projectWindow.width = "300px";
        projectWindow.height = "200px";
        projectWindow.color = "white";
        projectWindow.background = "black";
        projectWindow.cornerRadius = 10;
        projectWindow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        projectWindow.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const projectDescription = new TextBlock();
        projectDescription.text = `${name}\n${description}`;
        projectDescription.color = "white";
        projectDescription.fontSize = 16;
        projectDescription.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        projectDescription.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        projectWindow.addControl(projectDescription);

        // Добавление кнопки закрытия в окно
        const closeProjectButton = Button.CreateSimpleButton(`close-${id}-project`, "X");
        closeProjectButton.width = "20px";
        closeProjectButton.height = "20px";
        closeProjectButton.color = "white";
        closeProjectButton.background = "red";
        closeProjectButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeProjectButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        closeProjectButton.top = "-10px";  // Немного поднимем кнопку вверх
        closeProjectButton.onPointerClickObservable.add(() => {
            projectWindow.isVisible = false; // Закрытие окна с проектом
        });

        projectWindow.addControl(closeProjectButton);
        
        // Добавляем окно с описанием на экран
        this.guiTexture.addControl(projectWindow);
    });

    return cell;
}


    private openProjectWindow(name: string, description: string) {
        const popup = new Rectangle();
        popup.width = "60%";
        popup.height = "60%";
        popup.background = "black";
        popup.color = "white";
        popup.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        popup.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        popup.alpha = 0.9;

        const header = new TextBlock();
        header.text = `Проект: ${name}`;
        header.color = "white";
        header.fontSize = 18;
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        popup.addControl(header);

        const content = new TextBlock();
        content.text = description;
        content.color = "white";
        content.fontSize = 16;
        content.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        content.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        popup.addControl(content);

        const closeButton = this.createCloseButton(popup);
        popup.addControl(closeButton);

        this.guiTexture.addControl(popup);
        this.popups.push(popup);  // Сохраняем всплывающее окно для дальнейшего управления
    }

    private createCloseButton(popup: Rectangle): Button {
        const closeButton = Button.CreateSimpleButton("close", "X");
        closeButton.width = "30px";
        closeButton.height = "30px";
        closeButton.color = "white";
        closeButton.background = "red";
        closeButton.top = "-15px";
        closeButton.left = "calc(100% - 30px)";
        closeButton.onPointerClickObservable.add(() => {
            this.closePopup(popup);
        });
        return closeButton;
    }

    private closePopup(popup: Rectangle) {
        popup.isVisible = false;
        this.popups = this.popups.filter(p => p !== popup);  // Убираем всплывающее окно из списка
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.container.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updatePage();
        }
    }

    private navigate(direction: number) {
        const newIndex = this.currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < this.pages.length) {
            this.currentPageIndex = newIndex;
            this.updatePage();
        }
    }

    private updatePage() {
        this.container.clearControls();

        if (!this.navPanel) {
            this.navPanel = this.createNavigationPanel();
        }

        const navContainer = this.createNavContainer();
        navContainer.addControl(this.navPanel);

        this.container.addControl(navContainer);
        this.container.addControl(this.pages[this.currentPageIndex]);
    }

    private createNavigationPanel(): StackPanel {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.width = "100%";

        const prevButton = this.createNavButton("prev", "Previous", () => this.navigate(-1));
        const nextButton = this.createNavButton("next", "Next", () => this.navigate(1));

        panel.addControl(prevButton);
        panel.addControl(nextButton);

        return panel;
    }

    private createNavButton(id: string, label: string, callback: () => void): Button {
        const button = Button.CreateSimpleButton(id, label);
        button.width = "80px";
        button.height = "30px";
        button.color = "white";
        button.background = "gray";
        button.onPointerClickObservable.add(callback);
        return button;
    }

    private createNavContainer(): Rectangle {
        const container = new Rectangle();
        container.height = "60px";
        container.width = "100%";
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.thickness = 0;
        return container;
    }
}