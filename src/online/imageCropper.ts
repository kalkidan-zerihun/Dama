/**
 * Client-side HTML5 Canvas Image Cropper & Compressor
 * Supports JPEG, PNG, WEBP up to 5MB
 * Resizes and compresses output to 256x256 JPEG data URL
 */

export interface ImageValidationResult {
  valid: boolean;
  message: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates selected image file size and type
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, message: 'No file selected.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      message: `Image size (${sizeMB} MB) exceeds the 5 MB maximum limit.` 
    };
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      message: 'Unsupported image format. Please upload JPG, PNG, or WEBP.' 
    };
  }

  return { valid: true, message: 'Image file is valid.' };
}

export class ImageCropper {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private img: HTMLImageElement | null = null;
  private zoom: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.initEvents();
  }

  private initEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => this.onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.onEnd());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => this.onEnd());
  }

  public loadImage(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.img = img;
        this.resetPosition();
        this.draw();
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = dataUrl;
    });
  }

  public setZoom(zoomValue: number) {
    this.zoom = zoomValue;
    this.constrainOffset();
    this.draw();
  }

  public resetPosition() {
    if (!this.img) return;
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  private onStart(x: number, y: number) {
    if (!this.img) return;
    this.isDragging = true;
    this.startX = x - this.offsetX;
    this.startY = y - this.offsetY;
  }

  private onMove(x: number, y: number) {
    if (!this.isDragging || !this.img) return;
    this.offsetX = x - this.startX;
    this.offsetY = y - this.startY;
    this.constrainOffset();
    this.draw();
  }

  private onEnd() {
    this.isDragging = false;
  }

  private constrainOffset() {
    if (!this.img) return;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    
    // Calculate base draw dimensions
    const scale = Math.max(cw / this.img.width, ch / this.img.height) * this.zoom;
    const dw = this.img.width * scale;
    const dh = this.img.height * scale;

    const maxOffsetX = (dw - cw) / 2;
    const maxOffsetY = (dh - ch) / 2;

    this.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.offsetX));
    this.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.offsetY));
  }

  public draw() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.ctx.clearRect(0, 0, cw, ch);

    if (!this.img) {
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(0, 0, cw, ch);
      return;
    }

    // Base fill image to canvas
    const baseScale = Math.max(cw / this.img.width, ch / this.img.height);
    const scale = baseScale * this.zoom;
    const dw = this.img.width * scale;
    const dh = this.img.height * scale;

    const x = (cw - dw) / 2 + this.offsetX;
    const y = (ch - dh) / 2 + this.offsetY;

    this.ctx.drawImage(this.img, x, y, dw, dh);

    // Draw circular or square crop overlay frame
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.fillRect(0, 0, cw, ch);

    // Clear square crop area in center
    const cropSize = Math.min(cw, ch) - 20;
    const cropX = (cw - cropSize) / 2;
    const cropY = (ch - cropSize) / 2;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(cropX, cropY, cropSize, cropSize);
    this.ctx.clip();

    // Redraw image inside unmasked crop box
    this.ctx.drawImage(this.img, x, y, dw, dh);
    this.ctx.restore();

    // Draw gold border around crop square
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(cropX, cropY, cropSize, cropSize);
  }

  /**
   * Crops the current square selection, resizes to target resolution (256x256),
   * and returns a compressed JPEG data URL.
   */
  public cropAndCompress(targetWidth = 256, targetHeight = 256): string {
    if (!this.img) throw new Error('No image loaded to crop');

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const cropSize = Math.min(cw, ch) - 20;
    const cropX = (cw - cropSize) / 2;
    const cropY = (ch - cropSize) / 2;

    const baseScale = Math.max(cw / this.img.width, ch / this.img.height);
    const scale = baseScale * this.zoom;
    const dw = this.img.width * scale;
    const dh = this.img.height * scale;

    const imgDrawX = (cw - dw) / 2 + this.offsetX;
    const imgDrawY = (ch - dh) / 2 + this.offsetY;

    // Calculate source image coordinates corresponding to cropX, cropY
    const srcX = (cropX - imgDrawX) / scale;
    const srcY = (cropY - imgDrawY) / scale;
    const srcSize = cropSize / scale;

    // Output canvas
    const outCanvas = document.createElement('canvas');
    outCanvas.width = targetWidth;
    outCanvas.height = targetHeight;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Failed to get output 2D context');

    outCtx.drawImage(
      this.img,
      Math.max(0, srcX),
      Math.max(0, srcY),
      Math.min(this.img.width, srcSize),
      Math.min(this.img.height, srcSize),
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Compress to JPEG with 85% quality (~20-40KB)
    return outCanvas.toDataURL('image/jpeg', 0.85);
  }
}
