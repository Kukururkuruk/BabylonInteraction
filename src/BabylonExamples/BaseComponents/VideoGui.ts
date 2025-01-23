import {
    Observable,
    ICanvasRenderingContext,
    Nullable
} from "@babylonjs/core";
import { Control, Image, Measure } from "@babylonjs/gui";

/**
 * Класс для отображения video (HTMLVideoElement) в Babylon.js GUI.
 */
export class VideoGui extends Control {
    private _domVideo!: HTMLVideoElement;
    private _imageWidth!: number;
    private _imageHeight!: number;
    private _loaded = false;
    private _stretch = Image.STRETCH_FILL;
    private _source: string | null = null;
    private _autoScale = false;

    /**
     * Вызывается, когда видео успешно загружено (onloadeddata).
     */
    public onVideoLoadedObservable = new Observable<VideoGui>();

    /** Константы растяжения (как в BabylonJS.GUI.Image). */
    public static readonly STRETCH_NONE = 0;
    public static readonly STRETCH_FILL = 1;
    public static readonly STRETCH_UNIFORM = 2;
    public static readonly STRETCH_EXTEND = 3;

    /** Возвращает true, если видео загружено. */
    public get isLoaded(): boolean {
        return this._loaded;
    }

    /** Автоматически подгонять размеры контрола под размер видео. */
    public get autoScale(): boolean {
        return this._autoScale;
    }
    public set autoScale(value: boolean) {
        if (this._autoScale === value) {
            return;
        }
        this._autoScale = value;
        if (value && this._loaded) {
            this.synchronizeSizeWithContent();
        }
    }

    /** Текущий режим растяжения (STRETCH_...). */
    public get stretch(): number {
        return this._stretch;
    }
    public set stretch(value: number) {
        if (this._stretch === value) {
            return;
        }
        this._stretch = value;
        this._markAsDirty();
    }

    /**
     * Привязка к существующему video-элементу (если нужно),
     * вместо source/url. Можно установить вручную.
     */
    public set domVideo(value: HTMLVideoElement) {
        this._domVideo = value;
        this._loaded = false;

        // Когда видео загрузится, вызываем _onVideoLoaded
        this._domVideo.onloadeddata = () => {
            this._onVideoLoaded();
        };
    }
    public get domVideo(): HTMLVideoElement {
        return this._domVideo;
    }

    /**
     * URL-источник видео. При установке создаётся <video>.
     */
    public get source() {
        return this._source;
    }
    public set source(value: string | null) {
        if (this._source === value) {
            return;
        }
        this._source = value;
        this._loaded = false;

        if (value) {
            // Создаём новый HTMLVideoElement
            this._domVideo = document.createElement("video");
            this._domVideo.src = value;
            this._domVideo.muted = true;
            this._domVideo.autoplay = true;
            this._domVideo.loop = true;
            this._domVideo.setAttribute("playsinline", "");

            this._domVideo.onloadeddata = () => {
                this._onVideoLoaded();
            };

            // Пробуем запустить
            this._domVideo.play().catch((err) => {
                console.warn("Video autoplay failed:", err);
            });
        }
    }

    /**
     * Конструктор.
     * @param name Имя контрола (опционально)
     * @param url  URL видео (опционально)
     */
    constructor(public name?: string, url: string | null = null) {
        super(name);
        this.source = url;
    }

    private _onVideoLoaded(): void {
        this._imageWidth = this._domVideo.videoWidth;
        this._imageHeight = this._domVideo.videoHeight;
        this._loaded = true;

        if (this._autoScale) {
            this.synchronizeSizeWithContent();
        }

        this.onVideoLoadedObservable.notifyObservers(this);
        this._markAsDirty();
    }

    /**
     * Подгоняет размеры контрола под фактические размеры видео.
     */
    public synchronizeSizeWithContent(): void {
        if (!this._loaded) {
            return;
        }
        this.width = this._imageWidth + "px";
        this.height = this._imageHeight + "px";
    }

    protected _getTypeName(): string {
        return "VideoGui";
    }

    /**
     * Переопределяем метод отрисовки из Control.
     * Важно: сигнатура совпадает с родительской!
     */
    public _draw(
        context: ICanvasRenderingContext,
        invalidatedRectangle?: Nullable<Measure>
    ): void {
        // Приводим тип к CanvasRenderingContext2D:
        const ctx = context as CanvasRenderingContext2D;

        // Если видео не загружено, ничего не рисуем
        if (!this._loaded) {
            return;
        }

        ctx.save();
        this._applyStates(ctx);

        // Исходные размеры видео
        const iw = this._imageWidth;
        const ih = this._imageHeight;

        // Прямоугольник, куда рисуем
        const dw = this._currentMeasure.width;
        const dh = this._currentMeasure.height;
        const dx = this._currentMeasure.left;
        const dy = this._currentMeasure.top;

        switch (this._stretch) {
            case VideoGui.STRETCH_NONE:
            case VideoGui.STRETCH_FILL:
                // Заполнить всю область (STRETCH_NONE и STRETCH_FILL
                // в данном примере сводим к одному поведению)
                ctx.drawImage(this._domVideo, 0, 0, iw, ih, dx, dy, dw, dh);
                break;

            case VideoGui.STRETCH_UNIFORM: {
                // "Cover": сохраняем пропорции, максимально заполняя область
                const hRatio = dw / iw;
                const vRatio = dh / ih;
                const ratio = Math.max(hRatio, vRatio);
                const trueWidth = iw * ratio;
                const trueHeight = ih * ratio;
                const offsetX = dx + (dw - trueWidth) / 2;
                const offsetY = dy + (dh - trueHeight) / 2;

                ctx.drawImage(
                    this._domVideo,
                    0, 0, iw, ih,
                    offsetX, offsetY,
                    trueWidth, trueHeight
                );
                break;
            }

            case VideoGui.STRETCH_EXTEND:
                // Аналогично просто растянем на dw/dh
                ctx.drawImage(this._domVideo, 0, 0, iw, ih, dx, dy, dw, dh);
                break;
        }

        ctx.restore();
    }
}
