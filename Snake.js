import { IMAGE_SOURCES } from "./SnakeController.js";

export default class Snake {
  constructor(ctx, tileSize, initialPosition) {
    this.ctx = ctx;
    this.tileSize = tileSize;
    this.body = [
      // Start the snake with two segments
      { x: initialPosition.x, y: initialPosition.y, image: null }, // Head
      { x: initialPosition.x - 1, y: initialPosition.y, image: null }, // Neck
    ];
    this.directionX = 1; // Start moving right
    this.directionY = 0;
    this.nextDirectionX = 1;
    this.nextDirectionY = 0;

    // This array stores the Image objects for the head and body segments
    this.segmentImages = [new Image(), new Image()];

    // --- MODIFIED: Use snake.png for initial head and body ---
    this.segmentImages[0].src = "images/snake.png";
    this.segmentImages[1].src = "images/snake.png";
  }

  // Called by the controller when food is eaten
  grow(collectedImage) {
    const tail = this.body[this.body.length - 1];

    // 1. Create a new segment at the tail's position (it will catch up in the next move)
    this.body.push({ x: tail.x, y: tail.y, image: collectedImage });

    // 2. Add the collected image to the array of images
    this.segmentImages.push(collectedImage);

    // 3. Update the Head image to be the new collected image
    // The intention is that the head keeps changing to reflect the newest collected Judge image
    this.updateHeadImage(collectedImage);
  }

  updateHeadImage(newImage) {
    // The head (index 0) takes the image of the newest collected Judge
    this.segmentImages[0] = newImage;
  }

  move() {
    // Prevent 180-degree turn (moving backward into the neck)
    if (
      this.directionX + this.nextDirectionX !== 0 ||
      this.directionY + this.nextDirectionY !== 0
    ) {
      this.directionX = this.nextDirectionX;
      this.directionY = this.nextDirectionY;
    }

    // 1. Calculate the new head position
    const newHead = {
      x: this.body[0].x + this.directionX,
      y: this.body[0].y + this.directionY,
      // The image of the new head segment is the same as the current head's image
      image: this.segmentImages[0],
    };

    // 2. Add the new head to the front
    this.body.unshift(newHead);

    // 3. Remove the tail (pop() is not called here, it's called implicitly by the standard snake array shift logic)
    this.body.pop();
  }

  changeDirection(x, y) {
    // Prevent snake from immediately reversing direction
    if (this.directionX === -x && this.directionY === -y) return;

    this.nextDirectionX = x;
    this.nextDirectionY = y;
  }

  draw(ctx, tileSize) {
    this.body.forEach((segment, index) => {
      let segmentImg = this.segmentImages[index];

      if (!segmentImg || !segmentImg.complete) {
        // Fallback: draw a basic block if image fails to load
        ctx.fillStyle = index === 0 ? "black" : "green"; // Changed head color to black for contrast
        ctx.fillRect(
          segment.x * tileSize,
          segment.y * tileSize,
          tileSize,
          tileSize
        );
      } else {
        // Draw the segment image
        ctx.drawImage(
          segmentImg,
          segment.x * tileSize,
          segment.y * tileSize,
          tileSize,
          tileSize
        );
      }
    });
  }
}
