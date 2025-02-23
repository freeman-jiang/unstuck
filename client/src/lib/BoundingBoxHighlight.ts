interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InstructionPosition {
  x: number;
  y: number;
}

interface HighlightOptions {
  color?: string;
  glowColor?: string;
  glowSize?: number;
  instructionStyle?: {
    fontSize?: string;
    fontFamily?: string;
    background?: string;
    padding?: number;
    borderRadius?: number;
  };
  pulseAnimation?: boolean;
  debug?: boolean;
}

export class BoundingBoxHighlight {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number | null = null;
  private currentBox: BoundingBox | null = null;
  private currentInstruction: string = '';
  private boxOpacity: number = 0;
  private labelOpacity: number = 0;
  private options: Required<HighlightOptions>;
  private debug: boolean;

  constructor(options: HighlightOptions = {}) {
    this.debug = options.debug || false;
    this.options = {
      color: options.color || 'rgba(75, 75, 255, 0.6)',
      glowColor: options.glowColor || 'rgba(75, 75, 255, 0.4)',
      glowSize: options.glowSize || 4,
      instructionStyle: {
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        borderRadius: 6,
        ...options.instructionStyle
      },
      pulseAnimation: options.pulseAnimation ?? true,
      debug: this.debug
    };

    this.initializeCanvas();
  }

  private initializeCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 9999;
    `;
    
    // Set canvas size to viewport size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.render();
    });

    document.body.appendChild(this.canvas);

    if (this.debug) {
      console.log('Canvas initialized:', {
        width: this.canvas.width,
        height: this.canvas.height
      });
    }
  }

  private validateBoundingBox(box: BoundingBox): boolean {
    const isValid = box.x >= 0 && box.y >= 0 && box.width > 0 && box.height > 0;
    if (this.debug && !isValid) {
      console.warn('Invalid bounding box:', box);
    }
    return isValid;
  }

  private drawHighlightBox(box: BoundingBox, opacity: number, progress?: number) {
    // Draw glow
    this.ctx.shadowColor = this.options.glowColor;
    this.ctx.shadowBlur = this.options.glowSize;
    this.ctx.strokeStyle = this.options.color.replace(/[\d.]+\)$/,  `${opacity})`);
    this.ctx.lineWidth = 2;

    // Calculate the padding around the box
    const x = box.x;
    const y = box.y;
    const width = box.width;
    const height = box.height;
    
    this.ctx.beginPath();
    if (typeof progress === 'number' && progress < 1) {
      // Draw partial rectangle during animation
      const totalLength = (width + height) * 2;
      const currentLength = totalLength * progress;
      
      // Start from top-left corner
      this.ctx.moveTo(x, y);
      
      // Draw top line
      if (currentLength < width) {
        this.ctx.lineTo(x + currentLength, y);
      } else {
        this.ctx.lineTo(x + width, y);
        
        // Draw right line
        if (currentLength < width + height) {
          this.ctx.lineTo(x + width, y + (currentLength - width));
        } else {
          this.ctx.lineTo(x + width, y + height);
          
          // Draw bottom line
          if (currentLength < width * 2 + height) {
            this.ctx.lineTo(x + width - (currentLength - (width + height)), y + height);
          } else {
            this.ctx.lineTo(x, y + height);
            
            // Draw left line
            if (currentLength < totalLength) {
              this.ctx.lineTo(x, y + height - (currentLength - (width * 2 + height)));
            } else {
              this.ctx.lineTo(x, y);
            }
          }
        }
      }
    } else {
      // Draw complete rectangle
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  private drawInstructionLabel(text: string, box: BoundingBox, opacity: number) {
    // Set text properties
    this.ctx.font = `${this.options.instructionStyle.fontSize} ${this.options.instructionStyle.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    // Measure text
    const metrics = this.ctx.measureText(text);
    const textHeight = parseInt(this.options.instructionStyle.fontSize) * 1.2;
    const padding = this.options.instructionStyle.padding;
    const width = metrics.width + padding * 2;
    const height = textHeight + padding * 2;
    
    // Position label directly under the box
    const x = box.x + box.width / 2;
    const y = box.y + box.height + 8; // 8px gap between box and label
    
    // Ensure label stays within viewport
    const adjustedX = Math.min(Math.max(x, width/2), this.canvas.width - width/2);
    const adjustedY = Math.min(y, this.canvas.height - height);
    
    // Draw background
    this.ctx.fillStyle = this.options.instructionStyle.background;
    this.ctx.beginPath();
    this.ctx.roundRect(adjustedX - width/2, adjustedY, width, height, this.options.instructionStyle.borderRadius);
    this.ctx.fill();
    
    // Draw text
    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    this.ctx.fillText(text, adjustedX, adjustedY + padding);
  }

  private startCircleAnimation() {
    if (this.animationFrame) return;

    let progress = 0;
    const duration = 1000; // 1 second for full circle
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      progress = Math.min(elapsed / duration, 1);

      this.render(progress);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
        this.startPulseAnimation();
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private render(progress?: number) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!this.currentBox || this.boxOpacity <= 0) return;
    
    // Draw highlight circle and instruction
    this.drawHighlightBox(this.currentBox, this.boxOpacity, progress);
    if (this.currentInstruction && (!progress || progress === 1)) {
      this.drawInstructionLabel(this.currentInstruction, this.currentBox, this.labelOpacity);
    }
  }

  private startPulseAnimation() {
    if (!this.options.pulseAnimation || this.animationFrame) return;

    let decreasing = true;
    const minOpacity = 0.6;
    const maxOpacity = 1;
    const step = 0.01;

    const animate = () => {
      this.boxOpacity = decreasing ? 
        Math.max(this.boxOpacity - step, minOpacity) : 
        Math.min(this.boxOpacity + step, maxOpacity);

      if (this.boxOpacity <= minOpacity) {
        decreasing = false;
      } else if (this.boxOpacity >= maxOpacity) {
        decreasing = true;
      }

      this.render();
      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private stopPulseAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public show(box: BoundingBox, instruction: string): void {
    if (!this.validateBoundingBox(box)) {
      console.error('Invalid bounding box provided');
      return;
    }

    this.currentBox = box;
    this.currentInstruction = instruction;
    this.boxOpacity = 1;
    this.labelOpacity = 1;

    // Start with circle animation instead of pulse
    this.startCircleAnimation();

    if (this.debug) {
      console.log('Showing highlight:', { box, instruction });
    }
  }

  public hide(): void {
    this.stopPulseAnimation();
    this.boxOpacity = 0;
    this.labelOpacity = 0;
    this.render();

    if (this.debug) {
      console.log('Hiding highlight');
    }
  }

  public destroy(): void {
    this.stopPulseAnimation();
    this.canvas.remove();

    if (this.debug) {
      console.log('BoundingBoxHighlight destroyed');
    }
  }
} 