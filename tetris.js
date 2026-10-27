/**
 * Neon Cyberpunk Tetris Engine
 * Features: SRS Rotation, 7-bag Randomizer, Ghost Piece, Hold System,
 * Next Queue, Particle Explosions, Screen Shake, DAS/ARR Keyboard & Touch Handling.
 */

// Configuration Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // base pixel size for visible 300x600 board

// Tetromino Definitions & Colors
const PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.7)'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0088ff',
    glow: 'rgba(0, 136, 255, 0.7)'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff8800',
    glow: 'rgba(255, 136, 0, 0.7)'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.7)'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.7)'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#b026ff',
    glow: 'rgba(176, 38, 255, 0.7)'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff3366',
    glow: 'rgba(255, 51, 102, 0.7)'
  }
};

// SRS Wall-Kick offsets (Standard J, L, S, T, Z)
const WALL_KICKS_NORMAL = {
  '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
};

// SRS Wall-Kick offsets (I Piece)
const WALL_KICKS_I = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
};

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.8) * 8;
    this.gravity = 0.25;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += this.gravity;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class TetrisGame {
  constructor() {
    // DOM Elements
    this.canvas = document.getElementById('tetris-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas.getContext('2d');
    this.nextCanvases = [
      document.getElementById('next-canvas-1'),
      document.getElementById('next-canvas-2'),
      document.getElementById('next-canvas-3')
    ].map(c => ({ canvas: c, ctx: c.getContext('2d') }));

    this.scoreValEl = document.getElementById('score-value');
    this.highScoreValEl = document.getElementById('high-score-value');
    this.linesValEl = document.getElementById('lines-value');
    this.levelValEl = document.getElementById('level-value');
    this.overlayEl = document.getElementById('board-overlay');
    this.overlayTitleEl = document.getElementById('overlay-title');
    this.overlaySubEl = document.getElementById('overlay-sub');
    this.overlayScoreBox = document.getElementById('overlay-score-box');
    this.overlayScoreVal = document.getElementById('overlay-score-value');
    this.overlayBtn = document.getElementById('overlay-btn');
    this.canvasWrapper = document.getElementById('canvas-wrapper');

    // High Score
    this.highScore = parseInt(localStorage.getItem('tetris_highscore') || '0', 10);
    this.highScoreValEl.textContent = this.highScore.toLocaleString();

    // Scale canvas for retina display
    this.setupHiDpi();

    // Game State
    this.grid = this.createGrid();
    this.bag = [];
    this.nextQueue = [];
    this.currentPiece = null;
    this.currentX = 0;
    this.currentY = 0;
    this.currentRotation = 0;
    this.holdPieceType = null;
    this.canHold = true;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;

    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;

    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;

    this.particles = [];
    this.shakeDuration = 0;

    // Delayed Auto Shift (DAS) & Auto Repeat Rate (ARR)
    this.keys = {};
    this.keyTimers = {};

    this.initControls();
    this.initTouchControls();
    this.initSwipeControls();

    // Render initial grid
    this.draw();
  }

  setupHiDpi() {
    const dpr = window.devicePixelRatio || 1;
    const width = COLS * BLOCK_SIZE;
    const height = ROWS * BLOCK_SIZE;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    // Sub-canvases
    [this.holdCanvas, ...this.nextCanvases.map(n => n.canvas)].forEach(c => {
      const w = c.clientWidth || 100;
      const h = c.clientHeight || 75;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.getContext('2d').scale(dpr, dpr);
    });
  }

  createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  // --- 7-Bag Randomizer ---
  fillBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag.push(...pieces);
  }

  getNextPieceType() {
    while (this.bag.length < 7) {
      this.fillBag();
    }
    return this.bag.shift();
  }

  start() {
    this.grid = this.createGrid();
    this.bag = [];
    this.nextQueue = [];
    for (let i = 0; i < 4; i++) {
      this.nextQueue.push(this.getNextPieceType());
    }

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.holdPieceType = null;
    this.canHold = true;
    this.dropInterval = 1000;
    this.particles = [];
    this.isGameOver = false;
    this.isPaused = false;
    this.isPlaying = true;

    this.updateStatsUI();
    this.drawHoldPiece();
    this.spawnPiece();

    this.overlayEl.classList.remove('active');
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  spawnPiece() {
    const type = this.nextQueue.shift();
    this.nextQueue.push(this.getNextPieceType());

    this.currentPiece = {
      type: type,
      shape: JSON.parse(JSON.stringify(PIECES[type].shape)),
      color: PIECES[type].color,
      glow: PIECES[type].glow
    };

    this.currentRotation = 0;
    this.currentX = Math.floor((COLS - this.currentPiece.shape[0].length) / 2);
    this.currentY = 0;
    this.canHold = true;

    this.drawNextPieces();

    // Check collision on spawn -> Game Over
    if (this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY)) {
      this.triggerGameOver();
    }
  }

  hold() {
    if (!this.isPlaying || this.isPaused || !this.canHold) return;

    window.soundEngine.playHold();
    const currentType = this.currentPiece.type;

    if (this.holdPieceType === null) {
      this.holdPieceType = currentType;
      this.spawnPiece();
    } else {
      const temp = this.holdPieceType;
      this.holdPieceType = currentType;
      this.currentPiece = {
        type: temp,
        shape: JSON.parse(JSON.stringify(PIECES[temp].shape)),
        color: PIECES[temp].color,
        glow: PIECES[temp].glow
      };
      this.currentRotation = 0;
      this.currentX = Math.floor((COLS - this.currentPiece.shape[0].length) / 2);
      this.currentY = 0;
    }

    this.canHold = false;
    this.drawHoldPiece();
  }

  // --- Collision Detection ---
  checkCollision(shape, offsetX, offsetY) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = offsetX + c;
          const newY = offsetY + r;

          // Wall & Floor collision
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          // Grid block collision
          if (newY >= 0 && this.grid[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // --- Rotations & SRS Wall Kicks ---
  rotateMatrix(matrix, clockwise = true) {
    const n = matrix.length;
    const result = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (clockwise) {
          result[c][n - 1 - r] = matrix[r][c];
        } else {
          result[n - 1 - c][r] = matrix[r][c];
        }
      }
    }
    return result;
  }

  rotate(clockwise = true) {
    if (!this.isPlaying || this.isPaused || !this.currentPiece) return;
    if (this.currentPiece.type === 'O') return; // O-piece does not need rotation

    const oldShape = this.currentPiece.shape;
    const newShape = this.rotateMatrix(oldShape, clockwise);
    const oldRot = this.currentRotation;
    const newRot = clockwise ? (oldRot + 1) % 4 : (oldRot + 3) % 4;
    const kickKey = `${oldRot}->${newRot}`;

    const kickTable = this.currentPiece.type === 'I' ? WALL_KICKS_I : WALL_KICKS_NORMAL;
    const kicks = kickTable[kickKey] || [[0, 0]];

    for (const [kx, ky] of kicks) {
      // In Tetris SRS, +ky is upwards, so on canvas y is subtracted
      const testX = this.currentX + kx;
      const testY = this.currentY - ky;

      if (!this.checkCollision(newShape, testX, testY)) {
        this.currentPiece.shape = newShape;
        this.currentX = testX;
        this.currentY = testY;
        this.currentRotation = newRot;
        window.soundEngine.playRotate();
        return;
      }
    }
  }

  moveLeft() {
    if (!this.isPlaying || this.isPaused) return;
    if (!this.checkCollision(this.currentPiece.shape, this.currentX - 1, this.currentY)) {
      this.currentX--;
      window.soundEngine.playMove();
    }
  }

  moveRight() {
    if (!this.isPlaying || this.isPaused) return;
    if (!this.checkCollision(this.currentPiece.shape, this.currentX + 1, this.currentY)) {
      this.currentX++;
      window.soundEngine.playMove();
    }
  }

  softDrop() {
    if (!this.isPlaying || this.isPaused) return;
    if (!this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1)) {
      this.currentY++;
      this.score += 1;
      this.scoreValEl.textContent = this.score.toLocaleString();
      window.soundEngine.playDrop();
      this.dropCounter = 0;
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    if (!this.isPlaying || this.isPaused) return;
    let dropCells = 0;
    while (!this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1)) {
      this.currentY++;
      dropCells++;
    }
    this.score += dropCells * 2;
    this.scoreValEl.textContent = this.score.toLocaleString();

    // Screen shake & heavy sound
    this.triggerScreenShake(8);
    window.soundEngine.playHardDrop();

    // Create landing spark dust
    this.createImpactParticles();

    this.lockPiece();
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let ghostY = this.currentY;
    while (!this.checkCollision(this.currentPiece.shape, this.currentX, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  // 1. Фиксация фигуры на поле после падения и приземления
  lockPiece() {
    const shape = this.currentPiece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const gy = this.currentY + r;
          const gx = this.currentX + c;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            this.grid[gy][gx] = {
              color: this.currentPiece.color,
              glow: this.currentPiece.glow
            };
          }
        }
      }
    }

    // Проверяем и очищаем заполненные линии, затем создаем следующую фигуру
    this.clearLines();
    this.spawnPiece();
  }

  // 2. Проверка заполненности рядов и удаление линий со сдвигом вниз
  clearLines() {
    let clearedCount = 0;
    const clearedRows = [];

    // Сканируем игровое поле снизу вверх (от нижней строки ROWS - 1 до 0)
    for (let r = ROWS - 1; r >= 0; r--) {
      // Проверка заполненности: если в строке нет ни одной пустой клетки (cell !== 0)
      const isRowFull = this.grid[r].every(cell => cell !== 0);

      if (isRowFull) {
        clearedCount++;
        clearedRows.push(r);

        // Создаем неоновые частицы взрыва для каждого блока удаляемой строки
        for (let c = 0; c < COLS; c++) {
          const block = this.grid[r][c];
          const px = c * BLOCK_SIZE + BLOCK_SIZE / 2;
          const py = r * BLOCK_SIZE + BLOCK_SIZE / 2;
          for (let p = 0; p < 6; p++) {
            this.particles.push(new Particle(px, py, block.color));
          }
        }

        // Удаление линии и сдвиг вниз:
        // 1) Вырезаем заполненный ряд из сетки игрового поля
        this.grid.splice(r, 1);
        // 2) Вставляем новую пустую строку в самый верх сетки (unshift)
        this.grid.unshift(Array(COLS).fill(0));

        // Компенсируем индекс: так как массив сдвинулся вниз, следующая строка
        // переместилась на текущий индекс r, поэтому проверяем его повторно
        r++;
      }
    }

    if (clearedCount > 0) {
      this.combo++;
      this.lines += clearedCount;

      // Classic scoring table
      const basePoints = [0, 100, 300, 500, 800];
      const points = (basePoints[clearedCount] || 800) * this.level;
      const comboBonus = this.combo > 0 ? this.combo * 50 * this.level : 0;
      const totalGained = points + comboBonus;
      this.score += totalGained;

      // Sound
      window.soundEngine.playLineClear(clearedCount);

      // Float score popup
      const firstRow = clearedRows[0] || 10;
      const label = clearedCount === 4 ? `TETRIS! +${totalGained}` : `+${totalGained}`;
      this.showFloatingText(label, (COLS * BLOCK_SIZE) / 2, firstRow * BLOCK_SIZE, clearedCount === 4);

      if (clearedCount === 4) {
        this.triggerScreenShake(14);
      }

      // Level Progression (Every 10 lines)
      const prevLevel = this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      if (this.level > prevLevel) {
        window.soundEngine.playLevelUp();
        this.showFloatingText(`LEVEL UP! LVL ${this.level}`, (COLS * BLOCK_SIZE) / 2, 200, true);
        // Speed formula: accelerates smoothly
        this.dropInterval = Math.max(100, 1000 * Math.pow(0.85, this.level - 1));
      }

      this.updateStatsUI();
    } else {
      this.combo = -1;
    }
  }

  showFloatingText(text, x, y, isSpecial = false) {
    const el = document.createElement('div');
    el.className = 'float-score';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = isSpecial ? '#00f0ff' : '#ffd700';
    el.style.fontSize = isSpecial ? '1.4rem' : '1.1rem';
    el.style.textShadow = isSpecial ? '0 0 16px rgba(0, 240, 255, 0.9)' : '0 0 10px rgba(255, 215, 0, 0.7)';

    this.canvasWrapper.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  triggerScreenShake(intensity = 6) {
    this.shakeDuration = intensity;
  }

  createImpactParticles() {
    const ghostY = this.getGhostY();
    const color = this.currentPiece.color;
    for (let c = 0; c < this.currentPiece.shape[0].length; c++) {
      const px = (this.currentX + c) * BLOCK_SIZE + BLOCK_SIZE / 2;
      const py = (ghostY + this.currentPiece.shape.length) * BLOCK_SIZE;
      for (let i = 0; i < 3; i++) {
        this.particles.push(new Particle(px, py, color));
      }
    }
  }

  updateStatsUI() {
    this.scoreValEl.textContent = this.score.toLocaleString();
    this.linesValEl.textContent = this.lines.toString();
    this.levelValEl.textContent = this.level.toString();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreValEl.textContent = this.highScore.toLocaleString();
      localStorage.setItem('tetris_highscore', this.highScore.toString());
    }
  }

  triggerGameOver() {
    this.isPlaying = false;
    this.isGameOver = true;
    window.soundEngine.playGameOver();

    this.overlayTitleEl.textContent = 'GAME OVER';
    this.overlayTitleEl.style.color = 'var(--accent-red)';
    this.overlayTitleEl.style.textShadow = '0 0 20px rgba(255, 51, 102, 0.8)';
    this.overlaySubEl.textContent = 'SYSTEM OVERLOAD';
    this.overlayScoreBox.style.display = 'flex';
    this.overlayScoreVal.textContent = this.score.toLocaleString();
    this.overlayBtn.innerHTML = 'RETRY';
    this.overlayEl.classList.add('active');
  }

  togglePause() {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.overlayTitleEl.textContent = 'PAUSED';
      this.overlayTitleEl.style.color = 'var(--accent-cyan)';
      this.overlayTitleEl.style.textShadow = '0 0 20px rgba(0, 240, 255, 0.8)';
      this.overlaySubEl.textContent = 'Press P or Esc to resume';
      this.overlayScoreBox.style.display = 'none';
      this.overlayBtn.innerHTML = 'RESUME';
      this.overlayEl.classList.add('active');
    } else {
      this.overlayEl.classList.remove('active');
      this.lastTime = performance.now();
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  // --- Rendering ---
  draw() {
    this.ctx.clearRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    // Apply Screen Shake
    if (this.shakeDuration > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeDuration;
      const offsetY = (Math.random() - 0.5) * this.shakeDuration;
      this.canvasWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      this.shakeDuration *= 0.85;
      if (this.shakeDuration < 0.5) {
        this.shakeDuration = 0;
        this.canvasWrapper.style.transform = 'translate(0, 0)';
      }
    }

    this.drawGridLines();
    this.drawBoardBlocks();

    if (this.currentPiece && this.isPlaying && !this.isGameOver) {
      this.drawGhostPiece();
      this.drawCurrentPiece();
    }

    // Draw Line Clear Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(this.ctx);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawGridLines() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    for (let r = 0; r <= ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * BLOCK_SIZE);
      this.ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
      this.ctx.stroke();
    }

    for (let c = 0; c <= COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * BLOCK_SIZE, 0);
      this.ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      this.ctx.stroke();
    }
  }

  drawBlock(ctx, x, y, color, glow, isGhost = false) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    const size = BLOCK_SIZE;
    const padding = 2;
    const innerSize = size - padding * 2;
    const radius = 4;

    ctx.save();

    if (isGhost) {
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(px + padding, py + padding, innerSize, innerSize, radius);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Outer Neon Glow
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;

    // Block Gradient
    const grad = ctx.createLinearGradient(px, py, px + size, py + size);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#080a14');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(px + padding, py + padding, innerSize, innerSize, radius);
    ctx.fill();

    // Top Gloss Highlight
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px + padding + 3, py + padding + 2);
    ctx.lineTo(px + size - padding - 3, py + padding + 2);
    ctx.stroke();

    ctx.restore();
  }

  drawBoardBlocks() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r][c];
        if (cell !== 0) {
          this.drawBlock(this.ctx, c, r, cell.color, cell.glow);
        }
      }
    }
  }

  drawGhostPiece() {
    const ghostY = this.getGhostY();
    const shape = this.currentPiece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          this.drawBlock(this.ctx, this.currentX + c, ghostY + r, this.currentPiece.color, this.currentPiece.glow, true);
        }
      }
    }
  }

  drawCurrentPiece() {
    const shape = this.currentPiece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          this.drawBlock(this.ctx, this.currentX + c, this.currentY + r, this.currentPiece.color, this.currentPiece.glow);
        }
      }
    }
  }

  // --- Draw Previews (Hold & Next) ---
  drawMiniPiece(ctx, canvas, pieceType) {
    const w = canvas.clientWidth || 100;
    const h = canvas.clientHeight || 75;
    ctx.clearRect(0, 0, w, h);

    if (!pieceType) return;

    const piece = PIECES[pieceType];
    const shape = piece.shape;
    const miniSize = 18;
    const shapeWidth = shape[0].length * miniSize;
    const shapeHeight = shape.length * miniSize;
    const startX = (w - shapeWidth) / 2;
    const startY = (h - shapeHeight) / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const px = startX + c * miniSize;
          const py = startY + r * miniSize;

          ctx.save();
          ctx.shadowColor = piece.glow;
          ctx.shadowBlur = 8;
          ctx.fillStyle = piece.color;
          ctx.beginPath();
          ctx.roundRect(px + 1, py + 1, miniSize - 2, miniSize - 2, 3);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  drawHoldPiece() {
    this.drawMiniPiece(this.holdCtx, this.holdCanvas, this.holdPieceType);
  }

  drawNextPieces() {
    for (let i = 0; i < 3; i++) {
      const type = this.nextQueue[i];
      const target = this.nextCanvases[i];
      this.drawMiniPiece(target.ctx, target.canvas, type);
    }
  }

  // --- Game Loop ---
  gameLoop(time = 0) {
    if (!this.isPlaying || this.isPaused) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.dropCounter += deltaTime;
    if (this.dropCounter > this.dropInterval) {
      this.softDrop();
      this.dropCounter = 0;
    }

    this.draw();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // --- Keyboard Handling (with DAS / ARR) ---
  initControls() {
    window.addEventListener('keydown', e => {
      // Prevent browser default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.repeat) return; // Managed manually for smooth DAS

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.togglePause();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        this.start();
        return;
      }

      if (!this.isPlaying || this.isPaused) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.moveLeft();
        this.startAutoRepeat(() => this.moveLeft(), 'left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.moveRight();
        this.startAutoRepeat(() => this.moveRight(), 'right');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.softDrop();
        this.startAutoRepeat(() => this.softDrop(), 'down', 140, 50);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.rotate(true);
      } else if (e.key === 'z' || e.key === 'Z') {
        this.rotate(false);
      } else if (e.key === ' ') {
        this.hardDrop();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') {
        this.hold();
      }
    });

    window.addEventListener('keyup', e => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) this.stopAutoRepeat('left');
      if (['ArrowRight', 'd', 'D'].includes(e.key)) this.stopAutoRepeat('right');
      if (['ArrowDown', 's', 'S'].includes(e.key)) this.stopAutoRepeat('down');
    });

    this.overlayBtn.addEventListener('click', () => {
      if (this.isPaused) {
        this.togglePause();
      } else {
        this.start();
      }
    });
  }

  startAutoRepeat(action, keyId, delay = 160, repeat = 45) {
    this.stopAutoRepeat(keyId);
    this.keyTimers[keyId] = setTimeout(() => {
      this.keyTimers[keyId] = setInterval(action, repeat);
    }, delay);
  }

  stopAutoRepeat(keyId) {
    if (this.keyTimers[keyId]) {
      clearTimeout(this.keyTimers[keyId]);
      clearInterval(this.keyTimers[keyId]);
      delete this.keyTimers[keyId];
    }
  }

  // --- Mobile Touch Pad Buttons ---
  initTouchControls() {
    const bindBtn = (id, onStart, onEnd = null) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        onStart();
      });
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        onStart();
      });
      if (onEnd) {
        btn.addEventListener('touchend', e => {
          e.preventDefault();
          onEnd();
        });
        btn.addEventListener('mouseup', e => {
          e.preventDefault();
          onEnd();
        });
      }
    };

    bindBtn('touch-left', () => {
      this.moveLeft();
      this.startAutoRepeat(() => this.moveLeft(), 'touch-left');
    }, () => this.stopAutoRepeat('touch-left'));

    bindBtn('touch-right', () => {
      this.moveRight();
      this.startAutoRepeat(() => this.moveRight(), 'touch-right');
    }, () => this.stopAutoRepeat('touch-right'));

    bindBtn('touch-down', () => {
      this.softDrop();
      this.startAutoRepeat(() => this.softDrop(), 'touch-down', 130, 45);
    }, () => this.stopAutoRepeat('touch-down'));

    bindBtn('touch-rotate-cw', () => this.rotate(true));
    bindBtn('touch-rotate-ccw', () => this.rotate(false));
    bindBtn('touch-hard-drop', () => this.hardDrop());
    bindBtn('touch-hold', () => this.hold());
  }

  // --- Touch Gesture Swipes on Canvas ---
  initSwipeControls() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', e => {
      if (!this.isPlaying || this.isPaused) return;

      const deltaX = e.changedTouches[0].clientX - startX;
      const deltaY = e.changedTouches[0].clientY - startY;
      const duration = Date.now() - startTime;
      const dist = Math.hypot(deltaX, deltaY);

      if (dist < 15 && duration < 250) {
        // Tap -> Rotate
        this.rotate(true);
      } else if (dist > 30) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal Swipe
          if (deltaX > 0) this.moveRight();
          else this.moveLeft();
        } else {
          // Vertical Swipe
          if (deltaY > 0) {
            this.softDrop();
          } else {
            this.hardDrop();
          }
        }
      }
    }, { passive: true });
  }
}

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  const game = new TetrisGame();

  // Header Buttons
  const sfxBtn = document.getElementById('btn-toggle-sfx');
  const musicBtn = document.getElementById('btn-toggle-music');
  const pauseBtn = document.getElementById('btn-toggle-pause');
  const helpBtn = document.getElementById('btn-help');
  const helpModal = document.getElementById('help-modal');
  const closeHelpBtn = document.getElementById('close-help-btn');

  // Sync SFX state
  if (!window.soundEngine.sfxEnabled) {
    sfxBtn.classList.remove('active');
  }

  sfxBtn.addEventListener('click', () => {
    const enabled = window.soundEngine.toggleSfx();
    sfxBtn.classList.toggle('active', enabled);
  });

  musicBtn.addEventListener('click', () => {
    const enabled = window.soundEngine.toggleMusic();
    musicBtn.classList.toggle('active', enabled);
  });

  pauseBtn.addEventListener('click', () => {
    game.togglePause();
  });

  helpBtn.addEventListener('click', () => {
    helpModal.classList.add('active');
  });

  closeHelpBtn.addEventListener('click', () => {
    helpModal.classList.remove('active');
  });

  helpModal.addEventListener('click', e => {
    if (e.target === helpModal) {
      helpModal.classList.remove('active');
    }
  });

  // Start initial game
  game.start();
});
