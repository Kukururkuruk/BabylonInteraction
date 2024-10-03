import { AbstractMesh, Mesh, MeshBuilder, Matrix, Scene, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock, Control, Button } from "@babylonjs/gui";
import * as GUI from '@babylonjs/gui/2D';

export class GUIManager {
  private scene: Scene;
  private advancedTexture: AdvancedDynamicTexture;
  private textBlock: TextBlock;
  private textMessages: string[];
  private currentTextIndex: number = 0;
  private isSecondaryCameraActive: boolean = false; // Флаг для проверки активной камеры

  constructor(scene: Scene, textMessages: string[]) {
    this.scene = scene;
    this.textMessages = textMessages;
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene); // Инициализация advancedTexture здесь
    this.textBlock = new TextBlock(); // Инициализация textBlock здесь
    this.createGui(); // Вызов метода для создания GUI
    this.initClickListener(scene); // Переносим вызов сюда
  }

  // Метод для инициализации обработчика клика
initClickListener(scene: Scene): void {
  scene.onPointerDown = (evt, pickResult) => {
    if (this.isSecondaryCameraActive && pickResult.hit && pickResult.pickedPoint) { // Проверяем, что pickedPoint не null
      this.showRedDot(pickResult.pickedPoint, this.advancedTexture);
    }
  };
}

  // Метод для отображения красной точки
  showRedDot(position: Vector3, advancedTexture: AdvancedDynamicTexture): void {
    const redDot = new GUI.Ellipse();
    redDot.width = "10px";
    redDot.height = "10px";
    redDot.color = "red";
    redDot.thickness = 2;
    redDot.background = "red";

    // Получаем размеры канваса
    const width = this.scene.getEngine().getRenderWidth();
    const height = this.scene.getEngine().getRenderHeight();

    // Преобразование 3D координат в 2D (экранные координаты)
    const projectedPosition = Vector3.Project(
        position, // Вектор для проекции
        Matrix.IdentityReadOnly, // Матрица преобразования (можно использовать Identity)
        this.scene.activeCamera!.getViewMatrix(), // Матрица видовой трансформации
        this.scene.activeCamera!.getProjectionMatrix() // Матрица проекционной трансформации
    );

    redDot.left = (projectedPosition.x * width - width / 2) + "px";
    redDot.top = (-projectedPosition.y * height + height / 2) + "px";
    
    advancedTexture.addControl(redDot);

    // Удаляем точку через 5 секунд
    setTimeout(() => {
      advancedTexture.removeControl(redDot);
    }, 5000);
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
    }, 5000);
  }

  createGui(): void {
    // Создаем полноэкранный интерфейс
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
    this.textBlock.isVisible = false; // Скрываем текст изначально

    // Создаем TextBlock
    this.textBlock = new TextBlock(); // Создаем новый текстовый блок
    this.textBlock.text = this.textMessages[this.currentTextIndex]; // Устанавливаем текст по умолчанию
    this.textBlock.color = "white";
    this.textBlock.fontSize = 24;
    this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.advancedTexture.addControl(this.textBlock);



    // Добавляем обработчик событий для клавиатуры
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase(); // Приводим к нижнему регистру для упрощения сравнения
      if (/w|ц/.test(key)) {
        this.updateText(0);
      } 
      else if (/s|ы/.test(key)) {
        this.updateText(1);
      }
      else if (/a|ф/.test(key)) {
        this.updateText(2);
      } 
      else if (/d|в/.test(key)) {
        this.updateText(3);
      }
    });
  }

  updateText(index: number): void {
    if (index === this.currentTextIndex) {
      this.currentTextIndex++;
      if (this.currentTextIndex < this.textMessages.length) { // Если есть следующее сообщение
        this.textBlock.text = this.textMessages[this.currentTextIndex];
      } else {
        this.textBlock.text = this.textMessages[this.textMessages.length - 1]; // Используем последний элемент
        setTimeout(() => {
          this.textBlock.isVisible = false; // Скрываем текстовый блок
        }, 3000);
      }
    } else {
      // Если индекс не соответствует текущему, можно скрыть текст
      this.textBlock.isVisible = false; // Скрываем текстовый блок, если он больше не актуален
    }
  }

  createButtonAboveMesh(targetMesh: AbstractMesh): void {
    // Создаем кнопку
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    const button = Button.CreateSimpleButton('myBtn', 'Click Me!');
    button.width = '200px';
    button.height = '40px';
    button.color = 'white';
    button.background = 'deepskyblue';
    advancedTexture.addControl(button);

    // Привязываем панель с кнопкой к сетке
    const panel = new GUI.StackPanel();
    panel.addControl(button);
    panel.isVertical = false;
    advancedTexture.addControl(panel);

    // Привязываем панель к целевому мешу
    panel.linkWithMesh(targetMesh);

    const plane = MeshBuilder.CreatePlane('plane', {
      width: 5,
      height: 1,
    });
    const advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(plane, 512, 64);
    const button2 = Button.CreateSimpleButton('myBtn2', 'Click Me!'); // Изменено имя кнопки для уникальности
    button2.width = '200px';
    button2.height = '40px';
    button2.color = 'white';
    button2.background = 'deepskyblue';
    advancedTexture2.addControl(button2);

    // Привязываем плоскость к целевому мешу
    plane.parent = targetMesh;

    // Включаем режим билборда
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    // Устанавливаем позицию плоскости относительно целевого меша
    plane.position = new Vector3(0, -5, 0); // Если нужно разместить под мешом
  }

  async loadGUISnippet(): Promise<void> {
    const snippetId = "#4T7WYR";

    try {
      // Загружаем GUI из Snippet Server
      const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, this.scene);
      await advancedTexture.parseFromSnippetAsync(snippetId);

      // Если необходимо, можно настроить элементы в загруженной текстуре
      console.log("GUI элемент загружен и добавлен на сцену");

    } catch (error) {
      console.error("Ошибка при загрузке GUI из Snippet Server:", error);
    }
  }

    // Метод для переключения камеры
    switchCamera(camera: FreeCamera): void {
    this.isSecondaryCameraActive = camera.name === "secondaryCamera"; // Проверяем, какая камера активна
    this.scene.activeCamera = camera;
  }



}
