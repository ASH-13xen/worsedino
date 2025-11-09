import Player from "./Player.js";
import Ground from "./Ground.js";
import CactiController from "./CactiController.js";
import Score from "./Score.js";
import SnakeController from "./SnakeController.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- AUDIO ELEMENT ---
const sirenAudio = document.getElementById("siren-sound");

const GAME_SPEED_START = 1;
const GAME_SPEED_INCREMENT = 0.00001;

// --- DINO GAME CONSTANTS ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;

// --- MODE CONSTANTS (UPDATED RANGES) ---
// Y-Flip Mode: 50-150 (Quick Flip)
const FLIP_Y_START_SCORE = 50;
const FLIP_Y_END_SCORE = 150;

// X-Flip Mode: 200-300 (Quick Flip)
const FLIP_X_START_SCORE = 200;
const FLIP_X_END_SCORE = 300;

// Siren/Vertical Launch Mode: 350-450
const SIREN_MODE_START_SCORE = 350;
const SIREN_MODE_END_SCORE = 450;
const MIGRAINE_MODE_START_SCORE = 350;
const MIGRAINE_MODE_END_SCORE = 450;

// Rotate (XY Alternating Flip) Mode: 500-600 (Rapid Flip)
const ROTATE_START_SCORE = 500;
const ROTATE_END_SCORE = 600;

// Final Stop Score for Snake Battle
const STOP_SCORE = 650;
// --- END MODE CONSTANTS ---

const PLAYER_WIDTH = 88 / 1.5; //58
const PLAYER_HEIGHT = 94 / 1.5; //62
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 24;
const GROUND_AND_CACTUS_SPEED = 0.5;

const CACTI_CONFIG = [
  { width: 48 / 1.5, height: 100 / 1.5, image: "images/cactus_1.png" },
  { width: 98 / 1.5, height: 100 / 1.5, image: "images/cactus_2.png" },
  { width: 68 / 1.5, height: 70 / 1.5, image: "images/cactus_3.png" },
];

// --- SNAKE GAME CONSTANTS (New Phase) ---
const SNAKE_GRID_SIZE = 20; // 20x20 tiles
const SNAKE_CANVAS_SIZE = 400; // Will be scaled by scaleRatio
const SNAKE_INITIAL_INTERVAL = 150; // Slower start speed (ms)

//Game Objects
let player = null;
let ground = null;
let cactiController = null;
let score = null;
let snakeController = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameOver = false;
let hasAddedEventListenersForRestart = false;
let waitingToStart = true;

// Global timer variables for chaos modes
let chaosYTimer = null;
let chaosXTimer = null;
let rotateTimer = null;
let migraineTimer = null;

// Global state variables
let isBrainrotActive = false;
let gameFrozen = false;
let lastFlipWasY = false;
let isSnakeMode = false;

function createSprites() {
  const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
  const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
  const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
  const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;
  const groundWidthInGame = GROUND_WIDTH * scaleRatio;
  const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

  player = new Player(
    ctx,
    playerWidthInGame,
    playerHeightInGame,
    minJumpHeightInGame,
    maxJumpHeightInGame,
    scaleRatio
  );

  ground = new Ground(
    ctx,
    groundWidthInGame,
    groundHeightInGame,
    GROUND_AND_CACTUS_SPEED,
    scaleRatio
  );

  const cactiImages = CACTI_CONFIG.map((cactus) => {
    const image = new Image();
    image.src = cactus.image;
    return {
      image: image,
      width: cactus.width * scaleRatio,
      height: cactus.height * scaleRatio,
    };
  });

  cactiController = new CactiController(
    ctx,
    cactiImages,
    scaleRatio,
    GROUND_AND_CACTUS_SPEED
  );

  score = new Score(ctx, scaleRatio);
}

function setScreen() {
  scaleRatio = getScaleRatio();
  // Set canvas size for Dino Game (Phase 1)
  canvas.width = GAME_WIDTH * scaleRatio;
  canvas.height = GAME_HEIGHT * scaleRatio;
  createSprites();
}

setScreen();
window.addEventListener("resize", () => setTimeout(setScreen, 500));
if (screen.orientation) {
  screen.orientation.addEventListener("change", setScreen);
}

function getScaleRatio() {
  const screenHeight = Math.min(
    window.innerHeight,
    document.documentElement.clientHeight
  );
  const screenWidth = Math.min(
    window.innerWidth,
    document.documentElement.clientWidth
  );

  if (screenWidth / screenHeight < GAME_WIDTH / GAME_HEIGHT) {
    return screenWidth / GAME_WIDTH;
  } else {
    return screenHeight / GAME_HEIGHT;
  }
}

function showGameOver() {
  const fontSize = 70 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  ctx.textAlign = "center";
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  ctx.fillText("GAME OVER", x, y);
}

function showBossFightIntro() {
  const fontSize = 40 * scaleRatio;
  ctx.font = `${fontSize}px Arial Black`;
  ctx.fillStyle = "red";
  ctx.textAlign = "center";
  const x = canvas.width / 2;
  const y1 = canvas.height / 2 - 25 * scaleRatio;
  const y2 = canvas.height / 2 + 25 * scaleRatio;

  ctx.fillText("PORTAL INITIATED!", x, y1);
  ctx.fillText("SNAKE TRANSFORMATION", x, y2);
}

// --- NEW SNAKE GAME START FUNCTION ---
function startSnakeGame() {
  isSnakeMode = true;
  gameOver = false;

  // 1. Resize Canvas to Snake Game Size
  const snakeCanvasSize = SNAKE_CANVAS_SIZE * scaleRatio;
  canvas.width = snakeCanvasSize;
  canvas.height = snakeCanvasSize;

  // 2. Initialize Snake Controller
  snakeController = new SnakeController(
    ctx,
    SNAKE_GRID_SIZE,
    snakeCanvasSize,
    SNAKE_INITIAL_INTERVAL
  );

  // 3. Attach keyboard/touch listeners for Snake movement
  snakeController.setupInput();

  console.log(
    "SNAKE MODE ACTIVE! Speed: " + snakeController.updateInterval + "ms"
  );
}

// --- NEW SNAKE GAME VICTORY SCREEN ---
function showSnakeVictory() {
  // Canvas is cleared to white by clearScreen() before this function runs

  ctx.textAlign = "center";

  // Get the dynamic tile size for proper scaling
  const tileSize = snakeController.tileSize;

  // Calculate font sizes relative to the tile size
  // REDUCED BASE SIZE FOR TITLE AND PUNCHLINE LINES
  const fontSizeTitle = tileSize * 1.0;
  const fontSizePunchline = tileSize * 0.5;
  const x = canvas.width / 2;

  // --- Line 1: Main Title ---
  ctx.fillStyle = "black";
  ctx.font = `${fontSizeTitle}px Impact, 'Arial Black'`;
  // Reduced vertical position
  ctx.fillText("VICTORY? CHAOS COMPLETE!", x, canvas.height / 2 - tileSize * 3);

  // --- Line 2: The Sarcastic Thesis (Black Text) ---
  ctx.fillStyle = "black";
  ctx.font = `${fontSizePunchline}px Impact, 'Verdana'`;

  // Adjusted Y-position to pull text up and prevent clipping
  ctx.fillText(
    "The Judges unanimously agree your performance in the Dino Game was questionable,",
    x,
    canvas.height / 2 - tileSize * 1.5
  );

  // --- Line 3: The Sarcastic Thesis (Cont.) (Black Text) ---
  ctx.fillText(
    "your Snake controls were sloppy, and your victory was dependent entirely on the Migraine Mode.",
    x,
    canvas.height / 2 - tileSize * 0.5
  );

  // --- Line 4: The Final Decree (Aggressive Font) ---
  ctx.font = `${fontSizeTitle}px Impact, 'Arial Black'`;
  ctx.fillText(
    "DISQUALIFIED. NOW CLEAN UP YOUR MESS.",
    x,
    canvas.height / 2 + tileSize * 2
  );
}

function setupGameReset() {
  if (!hasAddedEventListenersForRestart) {
    hasAddedEventListenersForRestart = true;
    setTimeout(() => {
      window.addEventListener("keyup", reset, { once: true });
      window.addEventListener("touchstart", reset, { once: true });
    }, 1000);
  }
}

function reset() {
  hasAddedEventListenersForRestart = false;
  gameOver = false;
  gameFrozen = false;
  isSnakeMode = false;
  snakeController = null;

  if (waitingToStart) {
    sirenAudio.play().catch(() => {});
    sirenAudio.pause();
  }
  waitingToStart = false;
  score.reset();
  gameSpeed = GAME_SPEED_START;
  isBrainrotActive = false;
  lastFlipWasY = false;

  setScreen();

  // --- CRITICAL CLEANUP (ALL TIMERS) ---
  if (chaosYTimer !== null) {
    clearInterval(chaosYTimer);
    chaosYTimer = null;
  }
  if (chaosXTimer !== null) {
    clearInterval(chaosXTimer);
    chaosXTimer = null;
  }
  if (rotateTimer !== null) {
    clearInterval(rotateTimer);
    rotateTimer = null;
  }
  if (migraineTimer !== null) {
    clearInterval(migraineTimer);
    migraineTimer = null;
  }

  sirenAudio.pause();
  sirenAudio.currentTime = 0;

  // Reset all visual classes
  canvas.classList.remove("flipped-y", "flipped-x");
  document.body.classList.remove("dark-mode");
}

function showStartGameText() {
  const fontSize = 40 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  ctx.textAlign = "center";
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  ctx.fillText("Tap Screen or Press Space To Start", x, y);
}

function updateGameSpeed(frameTimeDelta) {
  gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
}

function clearScreen() {
  // Phase 2: Snake Game uses white background
  if (isSnakeMode) {
    ctx.fillStyle = "white";
  }
  // Phase 1: Dino Game handles dark/light flashing
  else if (document.body.classList.contains("dark-mode")) {
    ctx.fillStyle = "black";
  } else {
    ctx.fillStyle = "white";
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- FLIP/ROTATION HANDLERS ---
function flipY() {
  canvas.classList.toggle("flipped-y");
}
function flipX() {
  canvas.classList.toggle("flipped-x");
}

function alternateFlip() {
  if (lastFlipWasY) {
    canvas.classList.add("flipped-x");
    canvas.classList.remove("flipped-y");
    lastFlipWasY = false;
  } else {
    canvas.classList.add("flipped-y");
    canvas.classList.remove("flipped-x");
    lastFlipWasY = true;
  }
}

function flashScreen() {
  document.body.classList.toggle("dark-mode");
}

// Manages ALL timer-based chaos effects
function handleGameModes() {
  const currentScore = Math.floor(score.score);

  const inFlipYRange =
    currentScore >= FLIP_Y_START_SCORE && currentScore < FLIP_Y_END_SCORE;
  const inFlipXRange =
    currentScore >= FLIP_X_START_SCORE && currentScore < FLIP_X_END_SCORE;
  const inSirenMigraineRange =
    currentScore >= SIREN_MODE_START_SCORE &&
    currentScore < SIREN_MODE_END_SCORE;
  const inRotateRange =
    currentScore >= ROTATE_START_SCORE && currentScore < ROTATE_END_SCORE;
  const reachedStopScore = currentScore >= STOP_SCORE;

  // --- Stop All Modes if Final Score Reached ---
  if (reachedStopScore) {
    if (!sirenAudio.paused) {
      sirenAudio.pause();
    }

    if (chaosYTimer !== null) {
      clearInterval(chaosYTimer);
      chaosYTimer = null;
      canvas.classList.remove("flipped-y");
    }
    if (chaosXTimer !== null) {
      clearInterval(chaosXTimer);
      chaosXTimer = null;
      canvas.classList.remove("flipped-x");
    }
    if (rotateTimer !== null) {
      clearInterval(rotateTimer);
      rotateTimer = null;
      canvas.classList.remove("flipped-y", "flipped-x");
    }
    if (migraineTimer !== null) {
      clearInterval(migraineTimer);
      migraineTimer = null;
      document.body.classList.remove("dark-mode");
    }

    return;
  }

  // Ensure rotate timer is OFF if we leave that range
  if (!inRotateRange && rotateTimer !== null) {
    clearInterval(rotateTimer);
    rotateTimer = null;
    canvas.classList.remove("flipped-y", "flipped-x");
  }

  // 1. FLIP Y (Horizontal Flip, 50-150) - QUICK FLIP
  if (inFlipYRange) {
    if (chaosYTimer === null) {
      chaosYTimer = setInterval(flipY, 1000);
    }
  } else {
    if (chaosYTimer !== null) {
      clearInterval(chaosYTimer);
      chaosYTimer = null;
      canvas.classList.remove("flipped-y");
    }
  }

  // 2. FLIP X (Vertical Flip, 200-300) - QUICK FLIP
  if (inFlipXRange) {
    if (chaosXTimer === null) {
      chaosXTimer = setInterval(flipX, 1000);
    }
  } else {
    if (chaosXTimer !== null) {
      clearInterval(chaosXTimer);
      chaosXTimer = null;
      canvas.classList.remove("flipped-x");
    }
  }

  // 3. ROTATE XY ALTERNATING (500-600) - RAPID FLIP
  if (inRotateRange) {
    if (chaosYTimer !== null) {
      clearInterval(chaosYTimer);
      chaosYTimer = null;
      canvas.classList.remove("flipped-y");
    }
    if (chaosXTimer !== null) {
      clearInterval(chaosXTimer);
      chaosXTimer = null;
      canvas.classList.remove("flipped-x");
    }

    if (rotateTimer === null) {
      rotateTimer = setInterval(alternateFlip, 500); // 500ms alternating flip
    }
  }

  // 4. SIREN AUDIO + MIGRAINE (350-450)
  if (inSirenMigraineRange) {
    if (migraineTimer === null) {
      migraineTimer = setInterval(flashScreen, 100);
    }
    if (sirenAudio.paused) {
      sirenAudio.play();
    }
  } else {
    if (migraineTimer !== null) {
      clearInterval(migraineTimer);
      migraineTimer = null;
      document.body.classList.remove("dark-mode");
    }
    if (!sirenAudio.paused) {
      sirenAudio.pause();
    }
  }
}

// --- NEW SNAKE GAME LOOP ---
let snakeAccumulatedTime = 0;

function snakeLoop(frameTimeDelta) {
  clearScreen();

  // Update snake movement based on current interval
  snakeAccumulatedTime += frameTimeDelta;
  if (snakeAccumulatedTime >= snakeController.updateInterval) {
    snakeController.update();
    // Reset only the time used for the update
    snakeAccumulatedTime = 0;
  }

  // Draw everything
  snakeController.draw();

  // Check conditions
  if (snakeController.checkGameOver()) {
    gameOver = true;
    showGameOver();
    setupGameReset(); // Trigger reset sequence
  } else if (snakeController.checkVictory()) {
    showSnakeVictory();
  }
}

// --- MAIN GAME LOOP ---
function gameLoop(currentTime) {
  if (previousTime === null) {
    previousTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }
  const frameTimeDelta = currentTime - previousTime;
  previousTime = currentTime;

  // --- PHASE 2: SNAKE GAME MODE ---
  if (isSnakeMode) {
    snakeLoop(frameTimeDelta);
    requestAnimationFrame(gameLoop);
    return;
  }

  // --- PHASE 1: DINO GAME MODE ---
  clearScreen();

  const currentScore = Math.floor(score.score);

  // 1. JUDGE FIGHT FREEZE/TRANSITION LOGIC (650+)
  if (currentScore >= STOP_SCORE) {
    if (!gameFrozen) {
      gameFrozen = true;
      handleGameModes();
      console.log("DINO GAME ENDED. TRANSITIONING TO SNAKE MODE.");
      setTimeout(startSnakeGame, 1500); // 1.5s delay for effect
    }

    // Draw the freeze frame (Dino Game)
    ground.draw();
    cactiController.draw();
    player.draw();
    score.draw();

    // Draw the Portal message over the frozen game
    showBossFightIntro();

    requestAnimationFrame(gameLoop);
    return;
  }
  // --- END FREEZE-LOGIC ---

  if (!waitingToStart && !gameFrozen) {
    handleGameModes();
  }

  const isSirenModeActive =
    currentScore >= SIREN_MODE_START_SCORE &&
    currentScore < SIREN_MODE_END_SCORE;

  if (!gameOver && !waitingToStart && !gameFrozen) {
    ground.update(gameSpeed, frameTimeDelta);
    player.update(gameSpeed, frameTimeDelta);
    cactiController.update(
      gameSpeed,
      frameTimeDelta,
      isSirenModeActive,
      player
    );
    score.update(frameTimeDelta);
    updateGameSpeed(frameTimeDelta);
  }

  // --- BRAINROT LOGIC ---
  const collidingCactus = cactiController.collideWith(player);
  if (!gameOver && collidingCactus) {
    if (!isBrainrotActive) {
      isBrainrotActive = true;
      player.swapToCactus();
      cactiController.swapToDino();
      cactiController.removeCactus(collidingCactus);
    } else {
      gameOver = true;
      setupGameReset();
      score.setHighScore();
      handleGameModes();
    }
  }
  // --- END OF LOGIC ---

  ground.draw();
  cactiController.draw();
  player.draw();
  score.draw();

  if (gameOver) {
    showGameOver();
  }

  if (waitingToStart) {
    showStartGameText();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

window.addEventListener("keyup", reset, { once: true });
window.addEventListener("touchstart", reset, { once: true });
