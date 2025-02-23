interface Position {
  x: number;
  y: number;
  opacity?: number;
  timestamp?: number;
}

interface CursorOptions {
  color?: string;
  size?: number;
  glowColor?: string;
  glowSize?: number;
  moveDuration?: number;
  easing?: (t: number) => number;
  debug?: boolean;
  trailLength?: number;
  trailFadeSpeed?: number;
}

export class GhostCursor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number | null = null;
  private currentPosition: Position = { x: 0, y: 0 };
  private trailPositions: Position[] = [];
  private isAnimating = false;
  private options: Required<CursorOptions>;
  private debug: boolean;
  private isPulsing = false;
  private isClicking = false;
  private supportsCoalescedEvents: boolean;

  constructor(options: CursorOptions = {}) {
    this.debug = options.debug || false;
    this.options = {
      color: options.color || "rgba(75, 75, 255, 0.8)",
      size: options.size || 20,
      glowColor: options.glowColor || "rgba(75, 75, 255, 0.4)",
      glowSize: options.glowSize || 10,
      moveDuration: options.moveDuration || 500,
      easing:
        options.easing ||
        ((t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)),
      debug: this.debug,
      trailLength: options.trailLength || 20,
      trailFadeSpeed: options.trailFadeSpeed || 50,
    };

    // Check if browser supports coalesced events
    this.supportsCoalescedEvents =
      typeof window !== "undefined" &&
      typeof window.PointerEvent !== "undefined" &&
      "getCoalescedEvents" in window.PointerEvent.prototype;

    this.initializeCanvas();
  }

  private initializeCanvas() {
    // Create and configure the canvas element
    this.canvas = document.createElement("canvas");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "10000";
    document.body.appendChild(this.canvas);

    // Get the canvas context
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    this.ctx = ctx;

    // Handle window resize
    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.drawCursor(this.currentPosition);
    });

    if (this.debug) {
      console.log("Canvas initialized:", {
        width: this.canvas.width,
        height: this.canvas.height,
        position: this.currentPosition,
      });
    }
  }

  private drawCursor(
    position: Position,
    pulseScale: number = 1,
    outerPulseScale: number = 1,
    opacity: number = 1,
    clickScale: number = 1
  ) {
    // Clear the previous frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw trail first
    this.drawTrail();

    // Draw outer pulse ring with fading opacity
    if (outerPulseScale > 0) {
      this.ctx.beginPath();
      this.ctx.arc(
        position.x,
        position.y,
        (this.options.size / 3) * outerPulseScale * clickScale,
        0,
        Math.PI * 2
      );
      this.ctx.strokeStyle = this.options.color.replace(
        /[\d.]+\)$/,
        `${0.3 * opacity})`
      );
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw inner pulse ring with fading opacity
    if (pulseScale > 0) {
      this.ctx.beginPath();
      this.ctx.arc(
        position.x,
        position.y,
        (this.options.size / 4) * pulseScale * clickScale,
        0,
        Math.PI * 2
      );
      this.ctx.strokeStyle = this.options.color.replace(
        /[\d.]+\)$/,
        `${0.5 * opacity})`
      );
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw glow effect with scale
    const gradient = this.ctx.createRadialGradient(
      position.x,
      position.y,
      0,
      position.x,
      position.y,
      this.options.glowSize * clickScale
    );
    gradient.addColorStop(0, this.options.glowColor);
    gradient.addColorStop(1, "rgba(75, 75, 255, 0)");

    this.ctx.beginPath();
    this.ctx.arc(
      position.x,
      position.y,
      this.options.glowSize * clickScale,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw cursor center with combined click and bounce scale
    this.ctx.beginPath();
    this.ctx.arc(
      position.x,
      position.y,
      (this.options.size / 4) * clickScale,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = this.options.color;
    this.ctx.fill();

    if (this.debug) {
      console.log("Drew cursor at:", position, "with scales:", {
        pulseScale,
        outerPulseScale,
        clickScale,
      });
    }
  }

  private drawTrail() {
    const now = Date.now();

    // Update trail positions and remove old ones
    this.trailPositions = this.trailPositions.filter((pos) => {
      if (!pos.timestamp) return false;
      const age = now - pos.timestamp;
      pos.opacity = Math.max(0, 1 - age / this.options.trailFadeSpeed);
      return pos.opacity > 0;
    });

    // Draw trail positions
    this.trailPositions.forEach((pos) => {
      if (!pos.opacity) return;

      const color = this.options.color.replace(
        /[\d.]+\)$/,
        `${pos.opacity * 0.3})`
      );
      const size = this.options.size * 0.5 * pos.opacity;

      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    });
  }

  private async animate(
    start: Position,
    end: Position,
    duration: number
  ): Promise<void> {
    if (this.isAnimating) {
      if (this.debug) console.warn("Animation already in progress");
      return;
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

        // Add position to trail
        this.addToTrail({ x: currentX, y: currentY });

        this.currentPosition = { x: currentX, y: currentY };
        this.drawCursor(this.currentPosition);

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(tick);
        } else {
          this.isAnimating = false;
          resolve();
        }
      };

      this.animationFrame = requestAnimationFrame(tick);
    });
  }

  private addToTrail(position: Position) {
    const now = Date.now();
    this.trailPositions.push({
      ...position,
      timestamp: now,
      opacity: 1,
    });

    // Keep trail length within limit
    if (this.trailPositions.length > this.options.trailLength) {
      this.trailPositions.shift();
    }
  }

  private startPulseAnimation() {
    if (this.isPulsing) return;
    this.isPulsing = true;

    const duration = 1500; // Shorter duration for more dynamic feel
    const startTime = performance.now();
    const bounceHeight = 10; // pixels to bounce up/down
    let currentBounceY = 0;

    // Track multiple pulse rings and bounce state
    const rings = [
      { startTime: startTime, scale: 0 },
      { startTime: startTime + duration / 2, scale: 0 },
    ];

    const animate = (currentTime: number) => {
      if (!this.isPulsing) return;

      // Clear canvas for new frame
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Calculate bounce offset
      const bounceProgress = ((currentTime - startTime) % duration) / duration;
      const bounceOffset =
        Math.sin(bounceProgress * Math.PI) * bounceHeight * 0.7;

      // Update current bounce position
      currentBounceY = this.currentPosition.y + bounceOffset - 5;

      // Draw trail if exists
      this.drawTrail();

      // Update and draw each ring
      rings.forEach((ring, index) => {
        const elapsed = currentTime - ring.startTime;
        const progress = (elapsed % duration) / duration;

        // Calculate scale and opacity with bounce effect
        const scale = progress * 1.5; // Reduced max scale from 2 to 1.5
        const opacity = Math.max(0, 1 - progress); // Fade from 1 to 0

        // Draw the ring with bounce offset
        if (opacity > 0) {
          const bouncedPosition = {
            ...this.currentPosition,
            y: currentBounceY,
          };
          this.drawCursor(
            bouncedPosition,
            index === 0 ? scale : 0,
            index === 1 ? scale : 0,
            opacity
          );
        }

        // Reset ring if cycle complete
        if (progress >= 1) {
          ring.startTime = currentTime;
        }
      });

      // Draw the base cursor on top with bounce
      const finalPosition = {
        ...this.currentPosition,
        y: currentBounceY,
      };

      // Add a slight scale bounce effect
      const scaleBounceFactor =
        1 + Math.abs(Math.sin(bounceProgress * Math.PI * 2)) * 0.2;
      this.drawCursor(finalPosition, 1, 1, 1, scaleBounceFactor);

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

    // If browser supports coalesced events, we'll handle the trail differently
    if (this.supportsCoalescedEvents) {
      // Clear existing trail
      this.trailPositions = [];

      // Add current position to trail before starting new movement
      this.addToTrail(this.currentPosition);
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
    const newPosition = { x, y };
    this.currentPosition = newPosition;

    // Add to trail if not the initial position
    if (this.trailPositions.length > 0) {
      this.addToTrail(newPosition);
    }

    this.drawCursor(this.currentPosition);
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
      console.log("Cursor destroyed");
    }
  }

  public async click(): Promise<void> {
    if (this.isClicking) return;
    this.isClicking = true;

    const startTime = performance.now();
    const clickDuration = 300; // 300ms for click animation

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / clickDuration, 1);

        // Create a "squish" effect
        const clickScale =
          progress < 0.5
            ? 1 - progress * 0.3 // Squish down to 70% size
            : 0.7 + (progress - 0.5) * 0.6; // Return to normal size

        this.drawCursor(this.currentPosition, 1, 1, 1, clickScale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isClicking = false;
          this.drawCursor(this.currentPosition);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }
}
