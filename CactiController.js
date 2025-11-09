import Cactus from "./Cactus.js";

export default class CactiController {
  CACTUS_INTERVAL_MIN = 500;
  CACTUS_INTERVAL_MAX = 2000;

  nextCactusInterval = null;
  cacti = [];

  constructor(ctx, cactiImages, scaleRatio, speed) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.cactiImages = cactiImages;
    this.scaleRatio = scaleRatio;
    this.speed = speed;
    this.spawnCounter = 0;

    this.setNextCactusTime();
  }

  swapToDino() {
    // ... (This function is unchanged)
    const newDinoImage = new Image();
    newDinoImage.src = "images/standing_still.png";
    const newWidth = (88 / 1.5) * this.scaleRatio;
    const newHeight = (94 / 1.5) * this.scaleRatio;

    this.cactiImages.forEach((template) => {
      template.image = newDinoImage;
      template.width = newWidth;
      template.height = newHeight;
    });
    this.cacti.forEach((cactusInstance) => {
      cactusInstance.swapImage(newDinoImage, newWidth, newHeight);
    });
  }

  setNextCactusTime() {
    // ... (This function is unchanged)
    const num = this.getRandomNumber(
      this.CACTUS_INTERVAL_MIN,
      this.CACTUS_INTERVAL_MAX
    );
    this.nextCactusInterval = num;
  }

  getRandomNumber(min, max) {
    // ... (This function is unchanged)
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  createCactus() {
    // ... (This function is unchanged)
    this.spawnCounter++;

    const index = this.getRandomNumber(0, this.cactiImages.length - 1);
    const cactusImage = this.cactiImages[index];
    const x = this.canvas.width * 1.5;
    const y = this.canvas.height - cactusImage.height;
    const cactus = new Cactus(
      this.ctx,
      x,
      y,
      cactusImage.width,
      cactusImage.height,
      cactusImage.image
    );

    if (this.spawnCounter % 2 === 0) {
      cactus.isEvenCactus = true;
    }

    this.cacti.push(cactus);
  }

  // --- MODIFIED: Signature now accepts 'player' ---
  update(gameSpeed, frameTimeDelta, isSirenModeActive, player) {
    // This is the normal, random spawner
    if (this.nextCactusInterval <= 0) {
      this.createCactus();
      this.setNextCactusTime();
    }
    this.nextCactusInterval -= frameTimeDelta;

    // This updates ALL cacti
    this.cacti.forEach((cactus) => {
      // --- MODIFIED SIREN LOGIC (Proximity Check) ---
      // If we are in Siren Mode AND this is an "even" cactus AND it's not already rising
      if (isSirenModeActive && cactus.isEvenCactus && !cactus.isRising) {
        // Define how close the player needs to be to trigger the launch
        const proximityThreshold = 250 * this.scaleRatio; // 250 pixels (scaled)

        // Calculate distance from player's front to cactus's front
        const distance = cactus.x - player.x;

        // If the player gets too close, trigger the launch!
        if (distance < proximityThreshold) {
          cactus.isRising = true;
          cactus.verticalSpeed = 0.1; // Slow, visible rising speed
        }
      }
      // --- END MODIFIED LOGIC ---

      cactus.update(this.speed, gameSpeed, frameTimeDelta, this.scaleRatio);
    });

    // Filter cacti that are off-screen
    this.cacti = this.cacti.filter(
      (cactus) => cactus.x > -cactus.width && cactus.y + cactus.height > 0
    );
  }

  draw() {
    // ... (This function is unchanged)
    this.cacti.forEach((cactus) => cactus.draw());
  }

  collideWith(sprite) {
    // ... (This function is unchanged)
    return this.cacti.find((cactus) => cactus.collideWith(sprite));
  }

  removeCactus(cactusToRemove) {
    // ... (This function is unchanged)
    this.cacti = this.cacti.filter((cactus) => cactus !== cactusToRemove);
  }

  reset() {
    // ... (This function is unchanged)
    this.cacti = [];
    this.spawnCounter = 0;
  }
}
