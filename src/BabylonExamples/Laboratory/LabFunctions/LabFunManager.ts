// FileBox.ts
import { AdvancedDynamicTexture, Control, Rectangle, Image, ScrollViewer, TextBlock, TextWrapping } from "@babylonjs/gui";

export class LabFunManager {
    private guiTexture: AdvancedDynamicTexture;
    private currentDialogBox: Control | null = null;
    private loadingContainer: HTMLDivElement | null = null;

    constructor(guiTexture: AdvancedDynamicTexture) {
        this.guiTexture = guiTexture;
    }

    public createFileBox(dialogTextContent: string, videoFileName: string): void {
        // 1) Удаляем старый диалог, если есть
        if (this.currentDialogBox) {
            this.guiTexture.removeControl(this.currentDialogBox);
            this.loadingContainer?.remove();
        }

        // ------------------------
        // 2) Создаем Rectangle-контейнер (справа)
        // ------------------------
        const dialogContainer = new Rectangle("dialogContainer");
        dialogContainer.width = "50%";
        dialogContainer.height = "100%";
        dialogContainer.thickness = 0;
        dialogContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        dialogContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        dialogContainer.top = "0%";
        dialogContainer.left = "6%";
        dialogContainer.zIndex = 1;
        this.guiTexture.addControl(dialogContainer);

        this.currentDialogBox = dialogContainer;

        // ------------------------
        // 3) Фоновое изображение (например, "папка")
        // ------------------------
        const dialogImage = new Image("dialogImage", "/models/filefolder.png");
        dialogImage.width = "100%";
        dialogImage.height = "100%";
        dialogImage.zIndex = 1;
        dialogContainer.addControl(dialogImage);

        // ------------------------
        // 4) Скролл с текстом (пример)
        // ------------------------
        const scrollViewer = new ScrollViewer("dialogScroll");
        scrollViewer.width = "60%";
        scrollViewer.height = "40%";
        scrollViewer.barSize = 7;
        scrollViewer.thickness = 0;
        scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        scrollViewer.left = "2%";
        scrollViewer.top = "5%";
        scrollViewer.zIndex = 2;

        const dialogText = new TextBlock("dialogText");
        dialogText.text = dialogTextContent; // Используем переданный текст
        dialogText.color = "#212529";
        dialogText.fontSize = "5%";
        dialogText.fontFamily = "Segoe UI";
        dialogText.resizeToFit = true;
        dialogText.textWrapping = TextWrapping.WordWrap;
        dialogText.width = "100%";
        dialogText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        scrollViewer.addControl(dialogText);
        dialogContainer.addControl(scrollViewer);

        // ---------------------------------------------------------------------------------------
        // 5) Вместо VideoRect + VideoGui,
        //    вставляем логику, аналогичную LoadingScreen, но под размеры "60% x 40%", bottom=5%, right=3%.
        // ---------------------------------------------------------------------------------------

        // 5.1 Создаём div-контейнер для видео (DOM-элемент), накладываем поверх canvas:
        const parent = document.getElementById("app"); 
        const loadingContainer = document.createElement("div");
        loadingContainer.style.position = "absolute";
        loadingContainer.style.width = "28%";
        loadingContainer.style.height = "40%";
        loadingContainer.style.bottom = "5%";
        loadingContainer.style.right = "5.5%";
        loadingContainer.style.zIndex = "100"; // Поверх canvas
        loadingContainer.style.backgroundColor = "black"; // На случай, если видео не заполнит

        if (parent) {
            parent.appendChild(loadingContainer);
        }

        // Сохраняем ссылку
        this.loadingContainer = loadingContainer;

        // 5.2 Создаём <video>
        const videoElement = document.createElement("video");
        // Добавим динамический параметр "?v=..." как в LoadingScreen, чтобы кеш не мешал
        videoElement.src = `/models/${videoFileName}` + "?v=" + new Date().getTime();
        videoElement.autoplay = false; // Управляем вручную
        videoElement.muted = true;
        videoElement.loop = true;
        videoElement.preload = "auto";

        // Растягиваем на 100% контейнера
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
        videoElement.style.objectFit = "contain";
        videoElement.style.backgroundColor = "black";

        loadingContainer.appendChild(videoElement);

        // 5.3 При окончании видео — убрать
        videoElement.addEventListener("ended", () => {
            videoElement.pause();
            loadingContainer.remove();
        });

        // 5.4 Кнопка "Пауза"
        const skipButton = document.createElement("button");
        skipButton.textContent = "Пауза";
        skipButton.style.position = "absolute";
        skipButton.style.bottom = "20px";
        skipButton.style.right = "20px";
        skipButton.style.padding = "10px 20px";
        skipButton.style.fontSize = "16px";
        skipButton.style.backgroundColor = "rgba(255, 255, 255, 0.44)";
        skipButton.style.border = "none";
        skipButton.style.cursor = "pointer";
        skipButton.style.borderRadius = "5px";

        loadingContainer.appendChild(skipButton);

        let videoPlay = true;

        skipButton.addEventListener("click", () => {
            videoPlay = !videoPlay;
            if (videoPlay) {
                videoElement.pause();
                skipButton.textContent = "Пауза";
            } else {
                videoElement.play();
                skipButton.textContent = "Старт";
            }
        });

        // 5.5 Наконец, пытаемся запустить видео
        videoElement.play().catch((err) => {
            console.warn("Video can't autoplay (maybe user gesture needed):", err);
        });
    }

    public removeFileBox(): void {
        // 1. Удаляем Babylon GUI-контейнер, если существует
        if (this.currentDialogBox) {
            this.guiTexture.removeControl(this.currentDialogBox); // Убираем из интерфейса
            this.currentDialogBox.dispose();                       // Освобождаем ресурсы GUI
            this.currentDialogBox = null;
        }

        // 2. Удаляем DOM-контейнер (loadingContainer) с видео
        if (this.loadingContainer) {
            // Останавливаем видео на всякий случай
            const video = this.loadingContainer.querySelector("video");
            if (video) {
                (video as HTMLVideoElement).pause();
            }

            // Удаляем сам <div> из документа
            if (this.loadingContainer.parentNode) {
                this.loadingContainer.parentNode.removeChild(this.loadingContainer);
            }
            this.loadingContainer = null;
        }
    }
}
