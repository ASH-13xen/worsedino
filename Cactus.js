export default class Cactus {
  constructor(ctx, x, y, width, height, image) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;

    this.isRising = false;
    this.verticalSpeed = 0;
    this.isEvenCactus = false;
  }

  update(speed, gameSpeed, frameTimeDelta, scaleRatio) {
    // Horizontal movement (STILL tied to gameSpeed)
    this.x -= speed * gameSpeed * frameTimeDelta * scaleRatio;

    // --- MODIFIED: Vertical movement logic ---
    if (this.isRising) {
      // Removed 'gameSpeed' to make the rise constant and slow
      this.y -= this.verticalSpeed * frameTimeDelta * scaleRatio;
    }
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  swapImage(newImage, newWidth, newHeight) {
    // ... (This function is unchanged)
    this.image = newImage;
    this.width = newWidth;
    this.height = newHeight;
    this.y = this.ctx.canvas.height - this.height;
  }

  collideWith(sprite) {
    // ... (This function is unchanged)
    const adjustBy = 1.4;
    if (
      sprite.x < this.x + this.width / adjustBy &&
      sprite.x + sprite.width / adjustBy > this.x &&
      sprite.y < this.y + this.height / adjustBy &&
      sprite.height + sprite.y / adjustBy > this.y
    ) {
      return true;
    } else {
      return false;
    }
  }
}
