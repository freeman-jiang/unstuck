import { useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface CursorOptions {
  color?: string;
  size?: number;
  glowColor?: string;
  glowSize?: number;
  moveDuration?: number;
  easing?: (t: number) => number;
  debug?: boolean;
}

export class GhostCursor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number | null = null;
  private currentPosition: Position = { x: 0, y: 0 };
  private isAnimating = false;
  private options: Required<CursorOptions>;
  private debug: boolean;
  private isPulsing = false;

  constructor(options: CursorOptions = {}) {
    this.debug = options.debug || false;
    this.options = {
      color: options.color || 'rgba(75, 75, 255, 0.8)',
      size: options.size || 20,
      glowColor: options.glowColor || 'rgba(75, 75, 255, 0.4)',
      glowSize: options.glowSize || 10,
      moveDuration: options.moveDuration || 500,
      easing: options.easing || ((t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
      debug: this.debug
    };

    this.initializeCanvas();
  }

  private initializeCanvas() {
    // Create and configure the canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '10000';
    document.body.appendChild(this.canvas);

    // Get the canvas context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;

    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.drawCursor(this.currentPosition);
    });

    if (this.debug) {
      console.log('Canvas initialized:', {
        width: this.canvas.width,
        height: this.canvas.height,
        position: this.currentPosition
      });
    }
  }

  private drawCursor(position: Position, pulseScale: number = 1, outerPulseScale: number = 1, opacity: number = 1) {
    // Clear the previous frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw outer pulse ring with fading opacity
    if (outerPulseScale > 0) {
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, (this.options.size / 3) * outerPulseScale, 0, Math.PI * 2);
      this.ctx.strokeStyle = this.options.color.replace(/[\d.]+\)$/, `${0.3 * opacity})`);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw inner pulse ring with fading opacity
    if (pulseScale > 0) {
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, (this.options.size / 4) * pulseScale, 0, Math.PI * 2);
      this.ctx.strokeStyle = this.options.color.replace(/[\d.]+\)$/, `${0.5 * opacity})`);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw glow effect
    const gradient = this.ctx.createRadialGradient(
      position.x,
      position.y,
      0,
      position.x,
      position.y,
      this.options.glowSize
    );
    gradient.addColorStop(0, this.options.glowColor);
    gradient.addColorStop(1, 'rgba(75, 75, 255, 0)');

    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, this.options.glowSize, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw cursor center
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, this.options.size / 4, 0, Math.PI * 2);
    this.ctx.fillStyle = this.options.color;
    this.ctx.fill();

    if (this.debug) {
      console.log('Drew cursor at:', position, 'with scales:', { pulseScale, outerPulseScale });
    }
  }

  private async animate(
    start: Position,
    end: Position,
    duration: number,
  ): Promise<void> {
    if (this.isAnimating) {
      if (this.debug) console.warn('Animation already in progress');
      return;
    }
    
    if (this.debug) {
      console.log('Starting animation:', { start, end, duration });
    }

    this.isAnimating = true;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const tick = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.options.easing(progress);

        const currentX = start.x + (end.x - start.x) * easeProgress;
        const currentY = start.y + (end.y - start.y) * easeProgress;

        this.currentPosition = { x: currentX, y: currentY };
        this.drawCursor(this.currentPosition);

        if (this.debug) {
          console.log('Animation frame:', {
            progress,
            position: this.currentPosition
          });
        }

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(tick);
        } else {
          this.isAnimating = false;
          if (this.debug) console.log('Animation complete');
          resolve();
        }
      };

      this.animationFrame = requestAnimationFrame(tick);
    });
  }

  private startPulseAnimation() {
    if (this.isPulsing) return;
    this.isPulsing = true;

    const duration = 1400; // 1.4s like in the example
    const startTime = performance.now();

    // Track multiple pulse rings
    const rings = [
      { startTime: startTime, scale: 0 },
      { startTime: startTime + duration / 2, scale: 0 } // Start second ring halfway through
    ];

    const animate = (currentTime: number) => {
      if (!this.isPulsing) return;

      // Clear canvas for new frame
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Update and draw each ring
      rings.forEach((ring, index) => {
        const elapsed = currentTime - ring.startTime;
        const progress = (elapsed % duration) / duration;

        // Calculate scale and opacity
        const scale = progress * 1.5; // Reduced max scale from 2 to 1.5
        const opacity = Math.max(0, 1 - progress); // Fade from 1 to 0

        // Draw the ring
        if (opacity > 0) {
          this.drawCursor(this.currentPosition, index === 0 ? scale : 0, index === 1 ? scale : 0, opacity);
        }

        // Reset ring if cycle complete
        if (progress >= 1) {
          ring.startTime = currentTime;
        }
      });

      // Draw the base cursor on top
      this.drawCursor(this.currentPosition);

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private stopPulseAnimation() {
    this.isPulsing = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.drawCursor(this.currentPosition, 1, 1);
  }

  public async moveTo(targetX: number, targetY: number): Promise<void> {
    this.stopPulseAnimation();

    if (this.debug) {
      console.log('Moving cursor:', {
        from: this.currentPosition,
        to: { x: targetX, y: targetY }
      });
    }

    await this.animate(
      this.currentPosition,
      { x: targetX, y: targetY },
      this.options.moveDuration
    );

    // Start pulsing after reaching the target
    this.startPulseAnimation();
  }

  public setPosition(x: number, y: number): void {
    this.currentPosition = { x, y };
    this.drawCursor(this.currentPosition);
    
    if (this.debug) {
      console.log('Set cursor position:', { x, y });
    }
  }

  public hide(): void {
    this.stopPulseAnimation();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public show(): void {
    this.drawCursor(this.currentPosition);
  }

  public destroy(): void {
    this.stopPulseAnimation();
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.canvas.remove();

    if (this.debug) {
      console.log('Cursor destroyed');
    }
  }
}
