import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, StackPanel, Control, Image } from "@babylonjs/gui";
import * as BABYLON from "babylonjs";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: StackPanel[] = [];
    private currentPageIndex: number = 0;
    private isVisible: boolean = false;
    private navPanel: StackPanel | null = null;
    private popups: Rectangle[] = [];  // Массив для хранения всплывающих окон
    private pageDescriptions: string[] = [];  // Массив для хранения описаний страниц
    
    constructor(private scene: BABYLON.Scene) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = this.createContainer();
        this.guiTexture.addControl(this.container);
        this.initializePages();
    }

    private createContainer(): Rectangle {
        const container = new Rectangle();
        container.width = "50%"; // Ширина контейнера
        container.height = "70%"; // Высота контейнера
        container.background = "black";
        container.thickness = 2;
        container.color = "white";
        container.isVisible = false;
        return container;
    }
    
    private initializePages() {
        this.pageDescriptions = [
            "Добро пожаловать на главный экран!",
            "Текущий проект: TotalStationWork\nОписание: Этот проект включает в себя работу с тотальными станциями для измерения расстояний и углов.",
            "Конец презентации!"
        ];
    
        this.pages = [
            this.createPage(this.pageDescriptions[0], 24),
            this.createProjectsPage(),
            this.createPage(this.pageDescriptions[1], 20),
            this.createPage(this.pageDescriptions[2], 20),
        ];
    }
    
    private createPage(content: string, fontSize: number): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const headerContainer = new StackPanel();
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        headerContainer.paddingTop = 10; // Добавляем отступ сверху
    
        const text = new TextBlock();
        text.text = content;
        text.color = "white";
        text.fontSize = fontSize;
        text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        text.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        text.paddingTop = "10px";
        text.width = "90%"; // Устанавливаем максимальную ширину текста
        text.textWrapping = true; // Разворачивание текста по ширине
    
        // Рассчитаем высоту контейнера для текста
        const lineHeight = fontSize + 4; // Дополнительные отступы
        const textLines = content.split('\n').length;
        const maxTextHeight = lineHeight * textLines + 60; // Увеличиваем еще больше дополнительную высоту для отступов
        headerContainer.height = `${Math.min(maxTextHeight, 400)}px`; // Ограничиваем максимальную высоту контейнера
    
        page.addControl(text);
        page.addControl(headerContainer);
        return page;
    }
    
    
    
    
    
    
    
    
    private createProjectsPage(): StackPanel {
        const page = new StackPanel();
        page.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const headerContainer = new StackPanel();
        headerContainer.height = "80px";
        headerContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    
        const header = new TextBlock();
        header.text = "Выберите проект, чтобы увидеть описание:";
        header.color = "white";
        header.fontSize = 18;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
        headerContainer.addControl(header);
        page.addControl(headerContainer);
    
        const projectsContainer = new StackPanel();
        projectsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        projectsContainer.paddingTop = "5px";
    
        const projects = [
            {
                id: "project1",
                name: "TotalStationWork",
                description: "Работа с тотальными станциями для измерения расстояний и углов.",
                image: "models/image14.png",
                video: "path/to/total_station_work.mp4",
            },
            {
                id: "project2",
                name: "TotalStation",
                description: "Программное обеспечение для обработки данных с тотальной станции.",
                image: "path/to/total_station.jpg",
                video: null,
            },
        ];
    
        projects.forEach(({ id, name, description, image, video }) => {
            const cell = this.createProjectCell(id, name, description, image, video);
            projectsContainer.addControl(cell);
        });
    
        page.addControl(projectsContainer);
    
        return page;
    }
    

    private createProjectCell(id: string, name: string, description: string, image?: string, video?: string | null): Rectangle {
        const cell = new Rectangle();
        cell.width = "80%";
        cell.height = "30px";
        cell.color = "white";
        cell.background = "blue";
        cell.paddingTop = "2px";
        cell.paddingBottom = "2px";
        cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        const cellText = new TextBlock();
        cellText.text = name;
        cellText.color = "white";
        cellText.fontSize = 14;
        cellText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        cellText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        cell.addControl(cellText);

        if (description) {
            cell.onPointerClickObservable.add(() => {
                const popup = this.createPopup(description, image);
                this.guiTexture.addControl(popup);
            });
        }

        return cell;
    }

    private createPopup(description: string, image?: string): Rectangle {
        const popup = new Rectangle();
        popup.width = "80%";
        popup.height = "80%";
        popup.color = "white";
        popup.background = "black";
        popup.cornerRadius = 10;
        popup.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        popup.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const projectDescription = new TextBlock();
        projectDescription.text = description;
        projectDescription.color = "white";
        projectDescription.fontSize = 16;
        projectDescription.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        projectDescription.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        popup.addControl(projectDescription);

        if (image) {
            const projectImage = new Image("image", image);
            projectImage.width = "30%";
            projectImage.height = "30%";
            projectImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            projectImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

            let isExpanded = false;
            projectImage.onPointerClickObservable.add(() => {
                if (!isExpanded) {
                    projectImage.width = "100%";
                    projectImage.height = "100%";
                } else {
                    projectImage.width = "50%";
                    projectImage.height = "50%";
                }
                isExpanded = !isExpanded;
            });

            popup.addControl(projectImage);
        }

        const closeButton = this.createCloseButton(popup);
        popup.addControl(closeButton);

        return popup;
    }

    private createCloseButton(popup: Rectangle): Button {
        const closeButton = Button.CreateSimpleButton("close", "X");
        closeButton.width = "30px";
        closeButton.height = "30px";
        closeButton.color = "white";
        closeButton.background = "red";
        closeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        closeButton.paddingRight = "10px";
        closeButton.paddingTop = "10px";

        closeButton.onPointerClickObservable.add(() => {
            popup.isVisible = false;
            this.guiTexture.removeControl(popup);
        });

        return closeButton;
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
