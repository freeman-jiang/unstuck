interface Position {
  x: number;
  y: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CursorTarget {
  elementId: string;
  instruction: string;
  boundingBox: BoundingBox;
}

interface CursorOptions {
  color?: string;
  size?: number;
  glowColor?: string;
  glowSize?: number;
  clickDuration?: number;
  moveDuration?: number;
  easing?: (t: number) => number;
  labelStyle?: Partial<CSSStyleDeclaration>;
}

export class GhostCursor {
  private cursor: HTMLElement;
  private label: HTMLElement;
  private highlightBox: HTMLElement;
  private animationFrame: number | null = null;
  private options: Required<CursorOptions>;

  constructor(options: CursorOptions = {}) {
    this.options = {
      color: options.color || 'rgba(75, 75, 255, 0.6)',
      size: options.size || 20,
      glowColor: options.glowColor || 'rgba(75, 75, 255, 0.4)',
      glowSize: options.glowSize || 10,
      clickDuration: options.clickDuration || 150,
      moveDuration: options.moveDuration || 500,
      easing: options.easing || ((t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
      labelStyle: {
        background: '#333',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        maxWidth: '250px',
        ...options.labelStyle
      }
    };

    // Create cursor element
    this.cursor = document.createElement('div');
    this.cursor.style.cssText = `
      position: fixed;
      width: ${this.options.size}px;
      height: ${this.options.size}px;
      background: ${this.options.color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease;
      box-shadow: 0 0 ${this.options.glowSize}px ${this.options.glowColor};
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create instruction label
    this.label = document.createElement('div');
    this.label.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10001;
      opacity: 0;
      transform: translate(-50%, -100%) translateY(-20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      ${Object.entries(this.options.labelStyle)
        .map(([key, value]) => `${key}: ${value}`)
        .join(';')}
    `;

    // Create highlight box
    this.highlightBox = document.createElement('div');
    this.highlightBox.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      border: 2px solid ${this.options.color};
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.3s ease;
      box-shadow: 0 0 0 4px ${this.options.glowColor};
    `;

    document.body.appendChild(this.cursor);
    document.body.appendChild(this.label);
    document.body.appendChild(this.highlightBox);

    requestAnimationFrame(() => {
      this.cursor.style.opacity = '1';
    });
  }

  private async animate(
    start: Position,
    end: Position,
    duration: number,
    onFrame: (x: number, y: number) => void
  ): Promise<void> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const tick = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.options.easing(progress);

        const currentX = start.x + (end.x - start.x) * easeProgress;
        const currentY = start.y + (end.y - start.y) * easeProgress;

        onFrame(currentX, currentY);

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      this.animationFrame = requestAnimationFrame(tick);
    });
  }

  private updateLabelPosition(x: number, y: number) {
    this.label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) translateY(-20px)`;
  }

  private showInstruction(instruction: string, x: number, y: number) {
    this.label.textContent = instruction;
    this.updateLabelPosition(x, y);
    this.label.style.opacity = '1';
  }

  private hideInstruction() {
    this.label.style.opacity = '0';
  }

  private showHighlightBox(box: BoundingBox) {
    this.highlightBox.style.left = `${box.x}px`;
    this.highlightBox.style.top = `${box.y}px`;
    this.highlightBox.style.width = `${box.width}px`;
    this.highlightBox.style.height = `${box.height}px`;
    this.highlightBox.style.opacity = '1';
  }

  private hideHighlightBox() {
    this.highlightBox.style.opacity = '0';
  }

  public async moveToTarget(target: CursorTarget): Promise<void> {
    const centerX = target.boundingBox.x + target.boundingBox.width / 2;
    const centerY = target.boundingBox.y + target.boundingBox.height / 2;

    // Show instruction before moving
    this.showInstruction(target.instruction, centerX, centerY);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Move cursor
    const rect = this.cursor.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Show highlight box
    this.showHighlightBox(target.boundingBox);

    // Animate cursor movement
    await this.animate(
      { x: startX, y: startY },
      { x: centerX, y: centerY },
      this.options.moveDuration,
      (x, y) => {
        this.cursor.style.transform = `translate(${x}px, ${y}px)`;
        this.updateLabelPosition(x, y);
      }
    );
  }

  public async click(): Promise<void> {
    const clickDuration = this.options.clickDuration;
    const originalTransform = this.cursor.style.transform;
    
    // Scale down with glow effect
    this.cursor.style.transform = `${originalTransform} scale(0.8)`;
    this.cursor.style.boxShadow = `0 0 ${this.options.glowSize * 2}px ${this.options.color}`;
    await new Promise(resolve => setTimeout(resolve, clickDuration / 2));
    
    // Scale back up
    this.cursor.style.transform = originalTransform;
    this.cursor.style.boxShadow = `0 0 ${this.options.glowSize}px ${this.options.glowColor}`;
    await new Promise(resolve => setTimeout(resolve, clickDuration / 2));
  }

  public async executeAction(target: CursorTarget): Promise<void> {
    await this.moveToTarget(target);
    await this.click();

    // Trigger click on actual element
    const element = document.getElementById(target.elementId);
    if (element) {
      element.click();
    }

    // Hide instruction and highlight after action
    await new Promise(resolve => setTimeout(resolve, 500));
    this.hideInstruction();
    this.hideHighlightBox();
  }

  public destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.cursor.remove();
    this.label.remove();
    this.highlightBox.remove();
  }
} 