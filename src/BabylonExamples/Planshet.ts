import { AdvancedDynamicTexture, Rectangle, Button, TextBlock, Control, StackPanel } from "@babylonjs/gui";

export class Planshet {
    private guiTexture: AdvancedDynamicTexture;
    private container: Rectangle;
    private pages: Array<StackPanel>;
    private currentPageIndex: number;

    constructor(canvas: HTMLCanvasElement) {
        this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.container = new Rectangle();
        this.container.width = "50%";
        this.container.height = "70%";
        this.container.background = "black";
        this.container.thickness = 2;
        this.container.color = "white";
        this.container.isVisible = false;
        this.guiTexture.addControl(this.container);

        const stackPanel = new StackPanel();
        this.container.addControl(stackPanel);

        this.pages = [];
        this.currentPageIndex = 0;

        // Navigation buttons
        const navPanel = new StackPanel();
        navPanel.isVertical = false;

        const prevButton = Button.CreateSimpleButton("prev", "Previous");
        prevButton.width = "100px";
        prevButton.height = "40px";
        prevButton.color = "white";
        prevButton.background = "gray";
        prevButton.onPointerClickObservable.add(() => this.navigate(-1));

        const nextButton = Button.CreateSimpleButton("next", "Next");
        nextButton.width = "100px";
        nextButton.height = "40px";
        nextButton.color = "white";
        nextButton.background = "gray";
        nextButton.onPointerClickObservable.add(() => this.navigate(1));

        navPanel.addControl(prevButton);
        navPanel.addControl(nextButton);
        this.container.addControl(navPanel);
    }

    public addPage(content: (panel: StackPanel) => void) {
        const page = new StackPanel();
        content(page);
        this.pages.push(page);
    }

    public show() {
        if (this.pages.length > 0) {
            this.currentPageIndex = 0;
            this.updatePage();
            this.container.isVisible = true;
        }
    }

    public hide() {
        this.container.isVisible = false;
    }

    private navigate(direction: number) {
        const newIndex = this.currentPageIndex + direction;
        if (newIndex >= 0 && newIndex < this.pages.length) {
            this.currentPageIndex = newIndex;
            this.updatePage();
        }
    }

    private updatePage() {
        this.container.removeControl(this.pages[this.currentPageIndex]);
        this.container.addControl(this.pages[this.currentPageIndex]);
    }
}