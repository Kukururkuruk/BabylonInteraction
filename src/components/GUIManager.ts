import { AbstractMesh, Mesh, MeshBuilder, Matrix, Scene, FreeCamera, StandardMaterial, Color3, Vector3, PointerEventTypes } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock, Control, Button } from "@babylonjs/gui";
import * as GUI from '@babylonjs/gui/2D';


export class GUIManager {
  private scene: Scene;
  private advancedTexture: AdvancedDynamicTexture;
  private textBlock: TextBlock;
  private textMessages: string[];
  private currentTextIndex: number = 0;
  private isSecondaryCameraActive: boolean = false; // Флаг для проверки активной камеры
  private currentAngle: number = 90; // Начальный угол 90 градусов
  private angleText: TextBlock;
  private line: AbstractMesh | null = null;
  private isDragging: boolean = false; // Флаг для отслеживания перемещения мыши
  private initialMousePosition: Vector3 | null = null; // Начальная позиция мыши
  private initialAngle: number = 90; // Начальный угол перед перемещением мыши

  constructor(scene: Scene, textMessages: string[]) {
    this.scene = scene;
    this.textMessages = textMessages;
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene); // Инициализация advancedTexture здесь
    this.textBlock = new TextBlock(); // Инициализация textBlock здесь
    this.angleText = new TextBlock();
    this.createGui(); // Вызов метода для создания GUI
    this.addMouseInteraction(); // Добавляем обработчики для взаимодействия с мышью
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
    }, 3000);
  }

  createGui(): void {
    // Создаем полноэкранный интерфейс
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
    this.textBlock.isVisible = false; // Скрываем текст изначально

    // Создаем TextBlock
     // Устанавливаем текст только если массив не пустой
     if (this.textMessages.length > 0) {
      this.textBlock.text = this.textMessages[this.currentTextIndex] || ""; // Проверяем текст на пустоту
    } else {
      this.textBlock.text = "No messages available."; // Текст по умолчанию, если массив пустой
    }
    this.textBlock.color = "white";
    this.textBlock.fontSize = 24;
    this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.advancedTexture.addControl(this.textBlock);

 
     // Текстовый блок для отображения угла
     this.angleText = new TextBlock();
     this.angleText.text = "";
     this.angleText.color = "white";
     this.angleText.fontSize = 24;
     this.angleText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
     this.angleText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
     this.angleText.paddingTop = "80px";
     this.advancedTexture.addControl(this.angleText);





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




 // Добавление взаимодействия с мышью
 private addMouseInteraction(): void {
  // Отслеживание нажатия кнопки мыши
  this.scene.onPointerObservable.add((pointerInfo) => {
    const pointerEvent = pointerInfo.event as PointerEvent; // Приведение типа

    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERDOWN:
        if (pointerEvent.button === 2) { // Проверяем, что нажата правая кнопка мыши
          this.startDragging(pointerEvent); // Начинаем отслеживать движение мыши
        }
        break;
      case PointerEventTypes.POINTERUP:
        this.stopDragging(); // Прекращаем отслеживание движения
        break;
      case PointerEventTypes.POINTERMOVE:
        if (this.isDragging) {
          this.updateAngle(pointerEvent); // Обновляем угол при движении мыши
        }
        break;
    }
  });
}

// Начало отслеживания движения мыши
private startDragging(event: PointerEvent): void {
  this.isDragging = true;
  this.initialMousePosition = this.getMousePositionOnScene(event); // Запоминаем начальную позицию мыши
  this.initialAngle = this.currentAngle; // Запоминаем текущий угол
}

// Остановка отслеживания движения мыши
private stopDragging(): void {
  this.isDragging = false;
  this.initialMousePosition = null;
}

// Обновление угла при движении мыши
// Обновление угла при движении мыши
private updateAngle(event: PointerEvent): void {
  const currentMousePosition = this.getMousePositionOnScene(event);
  if (this.initialMousePosition && currentMousePosition) {
    // Рассчитываем разницу в положении мыши
    const deltaX = currentMousePosition.x - this.initialMousePosition.x;
    const deltaY = currentMousePosition.y - this.initialMousePosition.y;

    // Вычисляем угол на основе перемещения мыши
    const angleChange = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Угол в градусах
    this.currentAngle = this.initialAngle + angleChange; // Обновляем угол

    // Обновляем текст угла
    this.angleText.text = `Angle: ${this.currentAngle.toFixed(2)}°`;

    // Перемещаем линию
    this.updateLine();
  }
}

// Получение позиции мыши в сцене
private getMousePositionOnScene(event: PointerEvent): Vector3 {
  const pickResult = this.scene.pick(event.clientX, event.clientY);
  return pickResult.pickedPoint ? pickResult.pickedPoint : Vector3.Zero();
}





        // Обновление линии на основе текущего угла
        private updateLine(): void {
          if (this.line) {
            const angleRad = (this.currentAngle * Math.PI) / 180; // Переводим угол в радианы
            const lineEnd = new Vector3(Math.cos(angleRad) * 5, Math.sin(angleRad) * 5, 0); // Конечная точка линии
            this.line = MeshBuilder.CreateLines(
      "verticalLine",
      {
        points: [
          new Vector3(0, 0, 0),
          lineEnd,
        ],
      },
      this.scene
    );

    const lineMaterial = new StandardMaterial("lineMaterial", this.scene);
    lineMaterial.diffuseColor = Color3.Red();
    this.line.material = lineMaterial;
  }
}


  // Метод для обновления текста
  updateText(index: number): void {
    this.currentTextIndex = index;
    this.textBlock.text = this.textMessages[this.currentTextIndex];
  }

  // Метод для изменения угла
  changeAngle(delta: number): void {
    this.currentAngle += delta; // Изменяем угол
    this.angleText.text = `Angle: ${this.currentAngle.toFixed(2)}°`; // Обновляем текст угла
    this.updateLine(); // Обновляем линию
  }

  // Переключение камер
  toggleSecondaryCamera(): void {
    this.isSecondaryCameraActive = !this.isSecondaryCameraActive;
    this.textBlock.isVisible = this.isSecondaryCameraActive; // Показываем текст только при активной вторичной камере
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
