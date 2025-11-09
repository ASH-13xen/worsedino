// --- FIXED: Removed local import, using default export for the class ---
// import Snake from "./Snake.js";

// --- FIXED: MUST export consts for Snake.js to access them ---
// Array to hold the image paths for the snake body segments and food
// You MUST have 22 unique images named img1.png through img22.png
export const IMAGE_SOURCES = Array.from(
  { length: 22 },
  (_, i) => `images/img${i + 1}.png`
);

// Static obstacle images (pulled from Dino Game assets)
export const OBSTACLE_SOURCES = [
  "images/cactus_1.png",
  "images/cactus_2.png",
  "images/cactus_3.png",
];

// Re-import Snake inside the file since module export rules are tricky
import Snake from "./Snake.js";

export default class SnakeController {
  constructor(ctx, gridSize, canvasSize, initialInterval) {
    this.ctx = ctx;
    this.gridSize = gridSize;
    this.canvasSize = canvasSize;
    this.tileSize = canvasSize / gridSize;

    // Game speed variables
    this.updateInterval = initialInterval; // Starts slow (150ms)
    this.speedIncreaseRate = 0.99; // Multiplier to make interval smaller (faster)
    this.minInterval = 50; // Fastest possible speed

    // Snake and Food state
    this.snake = new Snake(ctx, this.tileSize, this.getInitialPosition());
    this.judgeFood = null;
    this.saboteurFruit = null;
    this.obstacles = []; // New: Array to hold fixed cactus obstacles

    // Load the Saboteur Fruit image
    this.saboteurImage = new Image();
    this.saboteurImage.src = "images/fruit.png";

    // Load obstacle images
    this.obstacleImages = this.loadObstacleImages();

    // Tracking collected images
    this.collectedImageIndices = new Set();
    this.allImagesLoaded = false;

    // Pre-load all 22 judge images
    this.preloadedImages = this.loadAllImages();

    this.spawnJudgeFood();
    this.spawnSaboteurFruit();
    this.spawnObstacles(4); // Spawn a maximum of 4 fixed obstacles
  }

  loadAllImages() {
    const images = [];
    let loadedCount = 0;

    // Use the imported IMAGE_SOURCES
    const imageObjects = IMAGE_SOURCES.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === IMAGE_SOURCES.length) {
          this.allImagesLoaded = true;
          console.log("Snake Mode judge images loaded.");
        }
      };
      return img;
    });

    return imageObjects;
  }

  loadObstacleImages() {
    // Use the imported OBSTACLE_SOURCES
    return OBSTACLE_SOURCES.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  getInitialPosition() {
    const centerX = Math.floor(this.gridSize / 4);
    const centerY = Math.floor(this.gridSize / 2);
    return { x: centerX, y: centerY };
  }

  setupInput() {
    // Snake input setup remains the same
    window.addEventListener("keydown", this.handleSnakeKeydown);
    window.addEventListener("touchstart", this.handleSnakeTouchStart);
  }

  handleSnakeKeydown = (event) => {
    let direction = null;
    if (event.code === "ArrowUp" || event.code === "KeyW") {
      direction = { x: 0, y: -1 };
    } else if (event.code === "ArrowDown" || event.code === "KeyS") {
      direction = { x: 0, y: 1 };
    } else if (event.code === "ArrowLeft" || event.code === "KeyA") {
      direction = { x: -1, y: 0 };
    } else if (event.code === "ArrowRight" || event.code === "KeyD") {
      direction = { x: 1, y: 0 };
    }

    if (direction) {
      this.snake.changeDirection(direction.x, direction.y);
    }
  };

  handleSnakeTouchStart = (event) => {
    if (event.touches.length === 0) return;

    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const headX = this.snake.body[0].x * this.tileSize + this.tileSize / 2;
    const headY = this.snake.body[0].y * this.tileSize + this.tileSize / 2;

    const deltaX = touchX - headX;
    const deltaY = touchY - headY;

    let direction = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      direction = deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }

    if (direction) {
      this.snake.changeDirection(direction.x, direction.y);
    }
  };

  getUncollectedImageIndex() {
    if (this.collectedImageIndices.size === IMAGE_SOURCES.length) {
      return null;
    }

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * IMAGE_SOURCES.length);
    } while (this.collectedImageIndices.has(randomIndex));

    return randomIndex;
  }

  findEmptyTile() {
    let tileX, tileY;
    let isSafe;
    do {
      tileX = Math.floor(Math.random() * this.gridSize);
      tileY = Math.floor(Math.random() * this.gridSize);

      // Check collision against snake body
      isSafe = !this.snake.body.some(
        (segment) => segment.x === tileX && segment.y === tileY
      );
      // Check collision against Judge Food
      if (this.judgeFood) {
        isSafe =
          isSafe && !(this.judgeFood.x === tileX && this.judgeFood.y === tileY);
      }
      // Check collision against Saboteur Fruit
      if (this.saboteurFruit) {
        isSafe =
          isSafe &&
          !(this.saboteurFruit.x === tileX && this.saboteurFruit.y === tileY);
      }
      // Check collision against Obstacles
      if (this.obstacles.length > 0) {
        isSafe =
          isSafe &&
          !this.obstacles.some((obs) => obs.x === tileX && obs.y === tileY);
      }
    } while (!isSafe);
    return { x: tileX, y: tileY };
  }

  spawnJudgeFood() {
    const availableIndex = this.getUncollectedImageIndex();

    if (availableIndex === null) {
      this.judgeFood = null;
      return;
    }

    const position = this.findEmptyTile();

    // judgeFood holds the judge image and its index
    this.judgeFood = {
      x: position.x,
      y: position.y,
      imageIndex: availableIndex,
      image: this.preloadedImages[availableIndex],
    };
  }

  spawnSaboteurFruit() {
    if (this.checkVictory()) return;

    const position = this.findEmptyTile();

    this.saboteurFruit = {
      x: position.x,
      y: position.y,
    };
  }

  spawnObstacles(count) {
    for (let i = 0; i < count; i++) {
      const position = this.findEmptyTile();
      const imageIndex = Math.floor(Math.random() * this.obstacleImages.length);

      this.obstacles.push({
        x: position.x,
        y: position.y,
        image: this.obstacleImages[imageIndex],
      });
    }
  }

  // New: Function to increase speed after successful collection
  increaseSpeed() {
    this.updateInterval *= this.speedIncreaseRate;
    if (this.updateInterval < this.minInterval) {
      this.updateInterval = this.minInterval;
    }
    return this.updateInterval; // Return the new interval for the loop
  }

  update() {
    // 1. Check for victory before moving
    if (this.checkVictory()) return;

    // 2. Move the snake
    this.snake.move();

    const head = this.snake.body[0];

    // 3. Check for Judge (Growth) collision
    if (
      this.judgeFood &&
      head.x === this.judgeFood.x &&
      head.y === this.judgeFood.y
    ) {
      this.collectedImageIndices.add(this.judgeFood.imageIndex);
      this.snake.grow(this.judgeFood.image);

      this.spawnJudgeFood();
      this.spawnSaboteurFruit(); // Move the saboteur fruit after judge is eaten
      this.increaseSpeed(); // Speed up the game after collection
    }

    // 4. Check for Saboteur Fruit (Game Over) collision (Handled in checkGameOver)
    if (
      this.saboteurFruit &&
      head.x === this.saboteurFruit.x &&
      head.y === this.saboteurFruit.y
    ) {
      this.gameOver = true; // Set local flag for immediate loss
    }
  }

  draw() {
    this.drawBoundary();

    // Draw the fixed obstacles
    this.drawObstacles();

    // Draw the snake
    this.snake.draw(this.ctx, this.tileSize);

    // Draw the Judge Food
    if (this.judgeFood && this.judgeFood.image.complete) {
      const img = this.judgeFood.image;
      this.ctx.drawImage(
        img,
        this.judgeFood.x * this.tileSize,
        this.judgeFood.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    } else if (this.judgeFood) {
      // Fallback
      this.ctx.fillStyle = "red";
      this.ctx.fillRect(
        this.judgeFood.x * this.tileSize,
        this.judgeFood.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    }

    // Draw the Saboteur Fruit
    if (this.saboteurFruit && this.saboteurImage.complete) {
      this.ctx.drawImage(
        this.saboteurImage,
        this.saboteurFruit.x * this.tileSize,
        this.saboteurFruit.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    } else if (this.saboteurFruit) {
      // Fallback
      this.ctx.fillStyle = "yellow";
      this.ctx.fillRect(
        this.saboteurFruit.x * this.tileSize,
        this.saboteurFruit.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    }

    this.drawScoreText();
  }

  drawObstacles() {
    this.obstacles.forEach((obs) => {
      if (obs.image.complete) {
        this.ctx.drawImage(
          obs.image,
          obs.x * this.tileSize,
          obs.y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      } else {
        // Fallback for obstacles
        this.ctx.fillStyle = "brown";
        this.ctx.fillRect(
          obs.x * this.tileSize,
          obs.y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    });
  }

  drawBoundary() {
    this.ctx.strokeStyle = "black"; // Changed boundary color to black for contrast on white canvas
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(0, 0, this.canvasSize, this.canvasSize);
  }

  drawScoreText() {
    this.ctx.fillStyle = "black"; // Changed text color to black for contrast on white canvas
    // Display current game interval speed as a chaos indicator
    const speedDisplay = Math.round(150 / this.updateInterval);

    this.ctx.font = `${this.tileSize * 0.4}px Arial Black`;
    this.ctx.textAlign = "left";

    this.ctx.fillText(
      `Judges Collected: ${this.collectedImageIndices.size} / 22`,
      5,
      this.canvasSize - 25
    );
    this.ctx.fillText(`Chaos Speed: ${speedDisplay}x`, 5, this.canvasSize - 5);
  }

  checkGameOver() {
    const head = this.snake.body[0];

    // 1. Boundary Collision
    if (
      head.x < 0 ||
      head.x >= this.gridSize ||
      head.y < 0 ||
      head.y >= this.gridSize
    ) {
      return true;
    }

    // 2. Self Collision (Starts check from the 4th segment for standard Snake)
    for (let i = 4; i < this.snake.body.length; i++) {
      if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
        return true;
      }
    }

    // 3. Saboteur Fruit Collision
    if (this.gameOver) {
      return true;
    }

    // 4. Obstacle Collision (New check)
    for (const obs of this.obstacles) {
      if (head.x === obs.x && head.y === obs.y) {
        return true;
      }
    }

    return false;
  }

  checkVictory() {
    return this.collectedImageIndices.size === IMAGE_SOURCES.length;
  }
}
