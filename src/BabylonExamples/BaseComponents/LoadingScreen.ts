// LoadingScreen.ts
export class LoadingScreen {
    private videoElement: HTMLVideoElement;
    private loadingContainer: HTMLDivElement;
    private isSceneLoaded: boolean = false; // Флаг для отслеживания загрузки сцены
  
    constructor() {
      // Конструктор может быть пустым или содержать базовую инициализацию
    }
  
    public playLoadingVideo(): void {
      this.createLoadingScreen();
      this.videoElement.play();
    }
  
    private createLoadingScreen(): void {
      // Создаем контейнер для загрузочного экрана
      this.loadingContainer = document.createElement("div");
      this.loadingContainer.style.position = "absolute";
      this.loadingContainer.style.top = "0";
      this.loadingContainer.style.left = "0";
      this.loadingContainer.style.width = "100%";
      this.loadingContainer.style.height = "100%";
      this.loadingContainer.style.zIndex = "100";
      document.body.appendChild(this.loadingContainer);
  
      // Создаем видео элемент
      this.videoElement = document.createElement("video");
      this.videoElement.src = `${this.getVideoSrc()}?v=${new Date().getTime()}`;
      this.videoElement.autoplay = false; // Установлено в false, чтобы контролировать воспроизведение
      this.videoElement.muted = true;
      this.videoElement.loop = false;
      this.videoElement.preload = "auto";
      this.videoElement.style.width = "100%";
      this.videoElement.style.height = "100%";
      this.videoElement.style.objectFit = "cover";
      this.videoElement.style.backgroundColor = "black";
      this.loadingContainer.appendChild(this.videoElement);
  
      // Добавляем обработчик события окончания видео
      this.videoElement.addEventListener("ended", () => {
        this.remove(); // Удаляем загрузочный экран после окончания видео
      });
  
      // Создаем кнопку "Пропустить"
      const skipButton = document.createElement("button");
      skipButton.textContent = "Пропустить";
      skipButton.style.position = "absolute";
      skipButton.style.bottom = "20px";
      skipButton.style.right = "20px";
      skipButton.style.padding = "10px 20px";
      skipButton.style.fontSize = "16px";
      skipButton.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
      skipButton.style.border = "none";
      skipButton.style.cursor = "pointer";
      skipButton.style.borderRadius = "5px";
      this.loadingContainer.appendChild(skipButton);
  
      // Обработчик нажатия на кнопку "Пропустить"
      skipButton.addEventListener("click", () => {
        this.remove();
      });
  
      // Здесь вы можете добавить дополнительные элементы интерфейса
      // Например, логотип, текст загрузки, прогресс-бар и т.д.
    }
  
    private getVideoSrc(): string {
      // Здесь вы можете реализовать логику выбора видео
      return "/models/film_1var_1_2K.mp4";
    }
  
    public remove(): void {
      if (this.videoElement) {
        this.videoElement.pause();
      }
      if (this.loadingContainer) {
        this.loadingContainer.remove();
      }
    }
  }
  