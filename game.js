/**
 * CYBER SNAKE // 極光霓幻貪食蛇 2077
 * 核心遊戲引擎與音效合成系統
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. 音效合成系統 (Web Audio API Synthesizer)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.soundEnabled = true;
      this.bgmEnabled = true;
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.bgmNotes = [110, 130.81, 146.83, 164.81, 196.00, 220.00]; // Cyber Minor Pentatonic
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15, pitchDrop = false) {
      if (!this.soundEnabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (pitchDrop) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.2), now + duration);
        }

        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        console.warn('Audio error:', e);
      }
    }

    playEat(combo = 1) {
      if (!this.soundEnabled || !this.ctx) return;
      this.init();
      const baseFreq = 440 + Math.min(combo * 40, 500);
      this.playTone(baseFreq, 'triangle', 0.08, 0.2);
      setTimeout(() => {
        this.playTone(baseFreq * 1.25, 'sine', 0.1, 0.15);
      }, 40);
    }

    playGolden() {
      if (!this.soundEnabled || !this.ctx) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.12, 0.2);
        }, idx * 45);
      });
    }

    playSpecial() {
      if (!this.soundEnabled || !this.ctx) return;
      this.init();
      this.playTone(320, 'square', 0.15, 0.15);
      setTimeout(() => this.playTone(640, 'triangle', 0.2, 0.2), 60);
    }

    playCrash() {
      if (!this.soundEnabled || !this.ctx) return;
      this.init();
      this.playTone(180, 'sawtooth', 0.35, 0.3, true);
    }

    playGameOver() {
      if (!this.soundEnabled || !this.ctx) return;
      this.init();
      const chord = [330, 293.66, 261.63, 196];
      chord.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sawtooth', 0.3, 0.2, true);
        }, idx * 120);
      });
    }

    playClick() {
      if (!this.soundEnabled || !this.ctx) return;
      this.init();
      this.playTone(800, 'sine', 0.04, 0.08);
    }

    startBgm() {
      if (!this.bgmEnabled || this.bgmTimer) return;
      this.init();
      this.bgmTimer = setInterval(() => {
        if (!this.bgmEnabled || !this.ctx) return;
        try {
          const note = this.bgmNotes[this.bgmStep % this.bgmNotes.length];
          this.bgmStep++;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();
          const now = this.ctx.currentTime;

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(note, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, now);

          gain.gain.setValueAtTime(0.02, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.25);
        } catch (e) {}
      }, 240);
    }

    stopBgm() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  /* ==========================================================================
     2. 粒子系統與浮動文字 (Juicy Visual FX)
     ========================================================================== */
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.floatingTexts = [];
    }

    explode(x, y, color, count = 20) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          radius: Math.random() * 3 + 2,
          life: 1.0,
          decay: Math.random() * 0.03 + 0.02
        });
      }
    }

    addText(text, x, y, color = '#fee440') {
      this.floatingTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        life: 1.0,
        decay: 0.025,
        vy: -1.2
      });
    }

    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= p.decay;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= ft.decay;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    draw(ctx) {
      // 繪製粒子
      ctx.save();
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 繪製浮動跳字
      ctx.save();
      for (const ft of this.floatingTexts) {
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.font = 'bold 15px Orbitron, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.restore();
    }

    reset() {
      this.particles = [];
      this.floatingTexts = [];
    }
  }

  /* ==========================================================================
     3. 貪食蛇核心遊戲引擎
     ========================================================================== */
  class CyberSnakeGame {
    constructor() {
      // 畫布與尺寸設定
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.gridSize = 24; // 24 x 24 網格
      this.cellSize = 25; // 每格像素 (600 / 24)

      // 狀態系統
      this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('cyber_snake_highscore') || '0', 10);
      this.applesEaten = 0;
      this.maxCombo = 1;
      this.combo = 1;
      this.comboTimer = 0;
      this.maxComboDuration = 3500; // 3.5秒內連擊
      this.lastComboTime = 0;

      // 蛇身資訊
      this.snake = [];
      this.direction = { x: 1, y: 0 };
      this.nextDirectionQueue = [];

      // 食物資訊
      this.food = null; // { x, y, type: 'normal'|'gold'|'freeze'|'hyper', expireTime: 0 }
      this.specialFoodTimer = 0;

      // 遊戲循環與定時
      this.lastTickTime = 0;
      this.baseSpeedMap = {
        chill: 110,
        normal: 80,
        rush: 52,
        adaptive: 90
      };
      this.difficulty = localStorage.getItem('cyber_snake_diff') || 'normal';
      this.boundaryMode = localStorage.getItem('cyber_snake_boundary') || 'wrap'; // 'wrap' | 'boxed'
      this.theme = localStorage.getItem('cyber_snake_theme') || 'cyber';

      // 增強狀態
      this.freezeUntil = 0;
      this.hyperUntil = 0;

      // 輔助系統
      this.sound = new SoundEngine();
      this.particles = new ParticleSystem();

      // DOM 元素快取
      this.dom = {
        wrapper: document.getElementById('gameWrapper'),
        container: document.getElementById('canvasContainer'),
        screenFx: document.getElementById('screenFxOverlay'),
        currentScore: document.getElementById('currentScore'),
        highScore: document.getElementById('highScore'),
        snakeLength: document.getElementById('snakeLength'),
        speedDisplay: document.getElementById('speedDisplay'),
        speedGauge: document.getElementById('speedGauge'),
        comboBadge: document.getElementById('comboBadge'),
        comboProgressBar: document.getElementById('comboProgressBar'),
        // 選單與彈窗
        startOverlay: document.getElementById('startOverlay'),
        pauseOverlay: document.getElementById('pauseOverlay'),
        gameOverOverlay: document.getElementById('gameOverOverlay'),
        settingsModal: document.getElementById('settingsModal'),
        // 按鈕
        btnStartGame: document.getElementById('btnStartGame'),
        btnPause: document.getElementById('btnPause'),
        pauseIcon: document.getElementById('pauseIcon'),
        playIcon: document.getElementById('playIcon'),
        btnResumeGame: document.getElementById('btnResumeGame'),
        btnRestartFromPause: document.getElementById('btnRestartFromPause'),
        btnPlayAgain: document.getElementById('btnPlayAgain'),
        btnOpenMenu: document.getElementById('btnOpenMenu'),
        btnSound: document.getElementById('btnSound'),
        soundIconOn: document.getElementById('soundIconOn'),
        soundIconOff: document.getElementById('soundIconOff'),
        btnSettings: document.getElementById('btnSettings'),
        btnCloseSettings: document.getElementById('btnCloseSettings'),
        btnSaveSettings: document.getElementById('btnSaveSettings'),
        btnResetHighScore: document.getElementById('btnResetHighScore'),
        // 結算統計
        finalScore: document.getElementById('finalScore'),
        finalMaxCombo: document.getElementById('finalMaxCombo'),
        finalApples: document.getElementById('finalApples'),
        deathReason: document.getElementById('deathReason'),
        newRecordBanner: document.getElementById('newRecordBanner'),
        // 控制面板
        themeSelect: document.getElementById('themeSelect'),
        settingDifficulty: document.getElementById('settingDifficulty'),
        settingBoundary: document.getElementById('settingBoundary'),
        checkSoundEnabled: document.getElementById('checkSoundEnabled'),
        checkBgmEnabled: document.getElementById('checkBgmEnabled')
      };

      this.init();
    }

    init() {
      this.setupDPI();
      this.applyTheme(this.theme);
      this.dom.highScore.textContent = this.highScore;
      this.bindEvents();
      this.loadSettings();

      // 啟動繪圖渲染主循環
      requestAnimationFrame(this.renderLoop.bind(this));
    }

    setupDPI() {
      // 確保在高解析度螢幕/Retina 畫面無模糊鋸齒
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      const size = Math.min(600, rect.width || 600);

      this.canvas.width = size * dpr;
      this.canvas.height = size * dpr;
      this.ctx.scale(dpr, dpr);
      this.cellSize = size / this.gridSize;
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.setupDPI();
      });

      // 鍵盤操作監聽
      window.addEventListener('keydown', (e) => {
        this.handleKeyDown(e);
      });

      // 觸控手勢滑動 (Touch Swipe) 支援
      let touchStartX = 0;
      let touchStartY = 0;
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', (e) => {
        if (this.state !== 'PLAYING') return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const minSwipe = 24;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
          if (dx > 0) this.setDirection(1, 0);
          else this.setDirection(-1, 0);
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
          if (dy > 0) this.setDirection(0, 1);
          else this.setDirection(0, -1);
        }
      }, { passive: true });

      // 行動虛擬 D-PAD 按鈕
      const bindBtn = (id, x, y) => {
        const el = document.getElementById(id);
        if (el) {
          const trigger = (ev) => {
            ev.preventDefault();
            this.sound.init();
            if (this.state === 'PLAYING') {
              this.setDirection(x, y);
            }
          };
          el.addEventListener('touchstart', trigger);
          el.addEventListener('mousedown', trigger);
        }
      };
      bindBtn('btnUp', 0, -1);
      bindBtn('btnDown', 0, 1);
      bindBtn('btnLeft', -1, 0);
      bindBtn('btnRight', 1, 0);

      // 選單按鈕互動
      this.dom.btnStartGame.addEventListener('click', () => this.startGame());
      this.dom.btnPause.addEventListener('click', () => this.togglePause());
      this.dom.btnResumeGame.addEventListener('click', () => this.resumeGame());
      this.dom.btnRestartFromPause.addEventListener('click', () => this.startGame());
      this.dom.btnPlayAgain.addEventListener('click', () => this.startGame());
      this.dom.btnOpenMenu.addEventListener('click', () => this.openMenu());

      // 音效切換
      this.dom.btnSound.addEventListener('click', () => {
        this.toggleSound();
      });

      // 設定面板
      this.dom.btnSettings.addEventListener('click', () => {
        this.sound.playClick();
        this.dom.settingsModal.showModal();
      });

      this.dom.btnCloseSettings.addEventListener('click', () => {
        this.sound.playClick();
        this.dom.settingsModal.close();
      });

      this.dom.btnSaveSettings.addEventListener('click', () => {
        this.saveSettings();
        this.dom.settingsModal.close();
      });

      this.dom.btnResetHighScore.addEventListener('click', () => {
        if (confirm('確定要將歷史最高紀錄歸零嗎？')) {
          this.highScore = 0;
          localStorage.setItem('cyber_snake_highscore', '0');
          this.dom.highScore.textContent = '0';
          this.sound.playClick();
        }
      });

      // 快速難度與邊界切換鈕 (首頁 Segmented Buttons)
      const setupSegment = (containerId, callback) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.addEventListener('click', (e) => {
          const btn = e.target.closest('.segment-btn');
          if (!btn) return;
          container.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          callback(btn);
          this.sound.playClick();
        });
      };

      setupSegment('startDifficultySelect', (btn) => {
        this.difficulty = btn.dataset.diff;
        localStorage.setItem('cyber_snake_diff', this.difficulty);
        this.dom.settingDifficulty.value = this.difficulty;
      });

      setupSegment('startBoundarySelect', (btn) => {
        this.boundaryMode = btn.dataset.wall;
        localStorage.setItem('cyber_snake_boundary', this.boundaryMode);
        this.dom.settingBoundary.value = this.boundaryMode;
      });
    }

    loadSettings() {
      this.dom.themeSelect.value = this.theme;
      this.dom.settingDifficulty.value = this.difficulty;
      this.dom.settingBoundary.value = this.boundaryMode;
      this.dom.checkSoundEnabled.checked = this.sound.soundEnabled;
      this.dom.checkBgmEnabled.checked = this.sound.bgmEnabled;

      // 更新首頁 segment 狀態
      const diffBtn = document.querySelector(`#startDifficultySelect [data-diff="${this.difficulty}"]`);
      if (diffBtn) {
        document.querySelectorAll('#startDifficultySelect .segment-btn').forEach(b => b.classList.remove('active'));
        diffBtn.classList.add('active');
      }

      const wallBtn = document.querySelector(`#startBoundarySelect [data-wall="${this.boundaryMode}"]`);
      if (wallBtn) {
        document.querySelectorAll('#startBoundarySelect .segment-btn').forEach(b => b.classList.remove('active'));
        wallBtn.classList.add('active');
      }
    }

    saveSettings() {
      this.theme = this.dom.themeSelect.value;
      this.difficulty = this.dom.settingDifficulty.value;
      this.boundaryMode = this.dom.settingBoundary.value;
      this.sound.soundEnabled = this.dom.checkSoundEnabled.checked;
      this.sound.bgmEnabled = this.dom.checkBgmEnabled.checked;

      this.applyTheme(this.theme);
      localStorage.setItem('cyber_snake_theme', this.theme);
      localStorage.setItem('cyber_snake_diff', this.difficulty);
      localStorage.setItem('cyber_snake_boundary', this.boundaryMode);

      if (this.sound.bgmEnabled && this.state === 'PLAYING') {
        this.sound.startBgm();
      } else {
        this.sound.stopBgm();
      }
      this.updateSoundIcons();
      this.loadSettings();
      this.sound.playClick();
    }

    applyTheme(themeKey) {
      document.body.setAttribute('data-theme', themeKey);
    }

    toggleSound() {
      this.sound.soundEnabled = !this.sound.soundEnabled;
      this.sound.bgmEnabled = this.sound.soundEnabled;
      this.dom.checkSoundEnabled.checked = this.sound.soundEnabled;
      this.dom.checkBgmEnabled.checked = this.sound.bgmEnabled;

      if (!this.sound.soundEnabled) {
        this.sound.stopBgm();
      } else if (this.state === 'PLAYING') {
        this.sound.startBgm();
      }
      this.updateSoundIcons();
    }

    updateSoundIcons() {
      if (this.sound.soundEnabled) {
        this.dom.soundIconOn.classList.remove('hidden');
        this.dom.soundIconOff.classList.add('hidden');
      } else {
        this.dom.soundIconOn.classList.add('hidden');
        this.dom.soundIconOff.classList.remove('hidden');
      }
    }

    handleKeyDown(e) {
      const code = e.code;
      // 避免方向鍵與空白鍵滾動網頁
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      this.sound.init();

      if (code === 'Space') {
        if (this.state === 'MENU' || this.state === 'GAMEOVER') {
          this.startGame();
        } else if (this.state === 'PLAYING' || this.state === 'PAUSED') {
          this.togglePause();
        }
        return;
      }

      if (code === 'KeyR' && (this.state === 'PLAYING' || this.state === 'GAMEOVER')) {
        this.startGame();
        return;
      }

      if (this.state !== 'PLAYING') return;

      switch (code) {
        case 'ArrowUp':
        case 'KeyW':
          this.setDirection(0, -1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.setDirection(0, 1);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.setDirection(-1, 0);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.setDirection(1, 0);
          break;
      }
    }

    setDirection(x, y) {
      // 避免反向直接自撞（例如正在向右走時不能直接向左轉）
      const lastPlanned = this.nextDirectionQueue.length > 0
        ? this.nextDirectionQueue[this.nextDirectionQueue.length - 1]
        : this.direction;

      if (lastPlanned.x + x === 0 && lastPlanned.y + y === 0) return;
      if (lastPlanned.x === x && lastPlanned.y === y) return;

      // 佇列限制最大 2 步，避免急促按鍵操作遺失又保證操控反應精準
      if (this.nextDirectionQueue.length < 2) {
        this.nextDirectionQueue.push({ x, y });
      }
    }

    startGame() {
      this.sound.init();
      this.sound.playClick();
      this.state = 'PLAYING';

      // 重置遊戲數據
      this.score = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.comboTimer = 0;
      this.applesEaten = 0;
      this.freezeUntil = 0;
      this.hyperUntil = 0;
      this.particles.reset();
      this.nextDirectionQueue = [];

      // 初始化蛇 (置中偏左，向右出發)
      const midY = Math.floor(this.gridSize / 2);
      this.snake = [
        { x: 6, y: midY },
        { x: 5, y: midY },
        { x: 4, y: midY }
      ];
      this.direction = { x: 1, y: 0 };

      // 生成首顆食物
      this.spawnFood('normal');

      // 更新 HUD
      this.updateHUD();
      this.hideAllOverlays();
      this.dom.pauseIcon.classList.remove('hidden');
      this.dom.playIcon.classList.add('hidden');

      if (this.sound.bgmEnabled) {
        this.sound.startBgm();
      }
    }

    togglePause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.sound.stopBgm();
        this.sound.playClick();
        this.dom.pauseOverlay.classList.remove('hidden');
        this.dom.pauseOverlay.classList.add('active');
        this.dom.pauseIcon.classList.add('hidden');
        this.dom.playIcon.classList.remove('hidden');
      } else if (this.state === 'PAUSED') {
        this.resumeGame();
      }
    }

    resumeGame() {
      this.state = 'PLAYING';
      this.sound.playClick();
      this.dom.pauseOverlay.classList.remove('active');
      this.dom.pauseOverlay.classList.add('hidden');
      this.dom.pauseIcon.classList.remove('hidden');
      this.dom.playIcon.classList.add('hidden');
      if (this.sound.bgmEnabled) {
        this.sound.startBgm();
      }
    }

    openMenu() {
      this.state = 'MENU';
      this.sound.stopBgm();
      this.sound.playClick();
      this.hideAllOverlays();
      this.dom.startOverlay.classList.add('active');
      this.dom.startOverlay.classList.remove('hidden');
    }

    hideAllOverlays() {
      this.dom.startOverlay.classList.remove('active');
      this.dom.startOverlay.classList.add('hidden');
      this.dom.pauseOverlay.classList.remove('active');
      this.dom.pauseOverlay.classList.add('hidden');
      this.dom.gameOverOverlay.classList.remove('active');
      this.dom.gameOverOverlay.classList.add('hidden');
    }

    triggerScreenShake(duration = 300) {
      this.dom.container.classList.remove('screen-shake');
      void this.dom.container.offsetWidth; // 強制重繪 trigger reflow
      this.dom.container.classList.add('screen-shake');
      setTimeout(() => {
        this.dom.container.classList.remove('screen-shake');
      }, duration);
    }

    flashScreen(type = 'red') {
      const cls = `flash-${type}`;
      this.dom.screenFx.classList.add(cls);
      setTimeout(() => {
        this.dom.screenFx.classList.remove(cls);
      }, 180);
    }

    /* ==========================================================================
       4. 食物生成與管理
       ========================================================================== */
    spawnFood(preferredType = null) {
      const emptyCells = [];
      const occupied = new Set();

      for (const segment of this.snake) {
        occupied.add(`${segment.x},${segment.y}`);
      }

      for (let x = 0; x < this.gridSize; x++) {
        for (let y = 0; y < this.gridSize; y++) {
          if (!occupied.has(`${x},${y}`)) {
            emptyCells.push({ x, y });
          }
        }
      }

      if (emptyCells.length === 0) {
        // 玩家填滿整個畫面通關！
        this.gameOver('卓越非凡！你已完全征服了數據矩陣！');
        return;
      }

      const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      let type = preferredType || 'normal';

      if (!preferredType) {
        const rand = Math.random();
        // 12% 機率產生黃金核心，7% 機率極凍，6% 機率超頻
        if (rand < 0.12) {
          type = 'gold';
        } else if (rand < 0.19) {
          type = 'freeze';
        } else if (rand < 0.25) {
          type = 'hyper';
        } else {
          type = 'normal';
        }
      }

      this.food = {
        x: spot.x,
        y: spot.y,
        type: type,
        spawnTime: performance.now(),
        duration: type === 'normal' ? 0 : 7000 // 特殊道具 7 秒倒數計時消失
      };
    }

    /* ==========================================================================
       5. 遊戲刻更新邏輯 (Tick / Physics Step)
       ========================================================================== */
    getCurrentSpeed() {
      let speed = this.baseSpeedMap[this.difficulty] || 80;

      if (this.difficulty === 'adaptive') {
        // 隨著長度增加逐漸超頻
        const reduction = Math.min(48, Math.floor(this.snake.length * 1.2));
        speed = Math.max(38, 90 - reduction);
      }

      // 極凍減速效果
      if (performance.now() < this.freezeUntil) {
        speed = Math.floor(speed * 1.55);
      }

      return speed;
    }

    updateTick() {
      if (this.nextDirectionQueue.length > 0) {
        this.direction = this.nextDirectionQueue.shift();
      }

      const head = this.snake[0];
      let newX = head.x + this.direction.x;
      let newY = head.y + this.direction.y;

      // 邊界檢查
      if (this.boundaryMode === 'wrap') {
        // 穿牆模式：穿透至另一側
        if (newX < 0) newX = this.gridSize - 1;
        else if (newX >= this.gridSize) newX = 0;
        if (newY < 0) newY = this.gridSize - 1;
        else if (newY >= this.gridSize) newY = 0;
      } else {
        // 封閉邊界模式：撞牆即死
        if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
          this.gameOver('高速撞擊了外層能量防護壁！');
          return;
        }
      }

      // 檢查自身碰撞 (Tail self-collision)
      // 注意：若是下一幀蛇尾剛好移走，則撞到最後一節不判死，但如果吃到了食物身體伸長則仍會相撞
      const willEat = (this.food && newX === this.food.x && newY === this.food.y);
      const checkSegments = willEat ? this.snake : this.snake.slice(0, -1);

      for (let i = 0; i < checkSegments.length; i++) {
        if (checkSegments[i].x === newX && checkSegments[i].y === newY) {
          this.gameOver('奈米蛇身盤繞自撞，系統解體！');
          return;
        }
      }

      const newHead = { x: newX, y: newY };
      this.snake.unshift(newHead);

      // 處理食物判定
      if (willEat) {
        this.consumeFood();
      } else {
        this.snake.pop(); // 未進食則移除尾部保持長度
      }

      // 特殊食物過期轉為普通食物
      if (this.food && this.food.type !== 'normal') {
        const elapsed = performance.now() - this.food.spawnTime;
        if (elapsed > this.food.duration) {
          this.spawnFood('normal');
        }
      }

      this.updateHUD();
    }

    consumeFood() {
      const now = performance.now();
      const cellPx = this.cellSize;
      const posX = (this.food.x + 0.5) * cellPx;
      const posY = (this.food.y + 0.5) * cellPx;

      this.applesEaten++;

      // 連擊機制判定
      if (now - this.lastComboTime <= this.maxComboDuration) {
        this.combo = Math.min(5, this.combo + 0.5);
      } else {
        this.combo = 1;
      }
      this.lastComboTime = now;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // 超頻雙倍狀態判定
      const isHyper = now < this.hyperUntil;
      const hyperMultiplier = isHyper ? 2 : 1;

      let baseScore = 10;
      let particleColor = 'var(--food-normal)';

      switch (this.food.type) {
        case 'normal':
          baseScore = 10;
          particleColor = '#f72585';
          this.sound.playEat(this.combo);
          this.particles.explode(posX, posY, '#f72585', 18);
          break;

        case 'gold':
          baseScore = 50;
          particleColor = '#fee440';
          this.sound.playGolden();
          this.particles.explode(posX, posY, '#fee440', 36);
          this.flashScreen('gold');
          this.triggerScreenShake(200);
          break;

        case 'freeze':
          baseScore = 20;
          particleColor = '#00bbf9';
          this.freezeUntil = now + 6500; // 冰晶減速 6.5 秒
          this.sound.playSpecial();
          this.particles.explode(posX, posY, '#00bbf9', 24);
          this.flashScreen('blue');
          break;

        case 'hyper':
          baseScore = 30;
          particleColor = '#39ff14';
          this.hyperUntil = now + 6000; // 雙倍超頻 6 秒
          this.sound.playSpecial();
          this.particles.explode(posX, posY, '#39ff14', 30);
          this.triggerScreenShake(180);
          break;
      }

      // 最終得分計算
      const earned = Math.round(baseScore * this.combo * hyperMultiplier);
      this.score += earned;

      let scoreTag = `+${earned}`;
      if (this.combo > 1) scoreTag += ` COMBO x${this.combo}`;
      if (isHyper) scoreTag += ` ⚡2X`;
      this.particles.addText(scoreTag, posX, posY - 10, particleColor);

      // 產生新食物
      this.spawnFood();
    }

    gameOver(reason) {
      this.state = 'GAMEOVER';
      this.sound.stopBgm();
      this.sound.playCrash();
      setTimeout(() => this.sound.playGameOver(), 150);

      this.triggerScreenShake(400);
      this.flashScreen('red');

      // 更新歷史最高分紀錄
      let isNewRecord = false;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('cyber_snake_highscore', this.highScore.toString());
        isNewRecord = true;
      }

      // 更新結算畫面
      this.dom.deathReason.textContent = reason;
      this.dom.finalScore.textContent = this.score;
      this.dom.finalMaxCombo.textContent = `x${this.maxCombo}`;
      this.dom.finalApples.textContent = this.applesEaten;
      this.dom.highScore.textContent = this.highScore;

      if (isNewRecord && this.score > 0) {
        this.dom.newRecordBanner.classList.remove('hidden');
      } else {
        this.dom.newRecordBanner.classList.add('hidden');
      }

      this.dom.gameOverOverlay.classList.remove('hidden');
      this.dom.gameOverOverlay.classList.add('active');
    }

    updateHUD() {
      this.dom.currentScore.textContent = this.score;
      this.dom.snakeLength.textContent = this.snake.length;

      // 連擊標籤
      if (this.combo > 1) {
        this.dom.comboBadge.textContent = `x${this.combo} COMBO`;
        this.dom.comboBadge.classList.remove('hidden');
      } else {
        this.dom.comboBadge.classList.add('hidden');
      }

      // 速度檔位條
      const speed = this.getCurrentSpeed();
      let level = 1;
      if (speed <= 48) level = 4;
      else if (speed <= 65) level = 3;
      else if (speed <= 85) level = 2;

      this.dom.speedDisplay.textContent = `LV.${level}`;
      const bars = this.dom.speedGauge.querySelectorAll('.bar');
      bars.forEach((b, idx) => {
        if (idx < level) b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    /* ==========================================================================
     6. 渲染畫布 (Canvas Render Loop)
     ========================================================================== */
    renderLoop(timestamp) {
      // 處理遊戲時間刻度更新
      if (this.state === 'PLAYING') {
        const interval = this.getCurrentSpeed();
        if (timestamp - this.lastTickTime >= interval) {
          this.lastTickTime = timestamp;
          this.updateTick();
        }

        // 連擊進度條遞減動畫
        const elapsedSinceCombo = timestamp - this.lastComboTime;
        if (elapsedSinceCombo < this.maxComboDuration && this.combo > 1) {
          const pct = Math.max(0, 100 - (elapsedSinceCombo / this.maxComboDuration) * 100);
          this.dom.comboProgressBar.style.width = `${pct}%`;
        } else {
          this.dom.comboProgressBar.style.width = '0%';
          if (elapsedSinceCombo >= this.maxComboDuration) {
            this.combo = 1;
          }
        }
      }

      this.particles.update();

      // 清空與重繪畫布
      const width = this.canvas.width / (window.devicePixelRatio || 1);
      const height = this.canvas.height / (window.devicePixelRatio || 1);
      this.ctx.clearRect(0, 0, width, height);

      this.drawGrid(width, height);
      this.drawFood();
      this.drawSnake();
      this.particles.draw(this.ctx);

      requestAnimationFrame(this.renderLoop.bind(this));
    }

    drawGrid(width, height) {
      const cell = this.cellSize;
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(0, 245, 212, 0.05)';
      this.ctx.lineWidth = 1;

      // 繪製細微網格線
      for (let x = 0; x <= width; x += cell) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }
      for (let y = 0; y <= height; y += cell) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
      }

      // 若為封閉模式，繪製邊界警戒光邊
      if (this.boundaryMode === 'boxed') {
        this.ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#ff0055';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(1, 1, width - 2, height - 2);
      }
      this.ctx.restore();
    }

    drawFood() {
      if (!this.food) return;

      const cell = this.cellSize;
      const cx = (this.food.x + 0.5) * cell;
      const cy = (this.food.y + 0.5) * cell;
      const baseRadius = cell * 0.38;

      // 脈動呼吸效果
      const pulse = Math.sin(performance.now() * 0.008) * (cell * 0.06);
      const radius = baseRadius + pulse;

      this.ctx.save();

      let mainColor = '#f72585';
      let glowColor = 'rgba(247, 37, 133, 0.7)';
      let label = '';

      if (this.food.type === 'gold') {
        mainColor = '#fee440';
        glowColor = 'rgba(254, 228, 64, 0.8)';
        label = '★';
      } else if (this.food.type === 'freeze') {
        mainColor = '#00bbf9';
        glowColor = 'rgba(0, 187, 249, 0.8)';
        label = '❄';
      } else if (this.food.type === 'hyper') {
        mainColor = '#39ff14';
        glowColor = 'rgba(57, 255, 20, 0.8)';
        label = '⚡';
      }

      // 外層脈動擴散光環
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius * 1.45, 0, Math.PI * 2);
      this.ctx.fillStyle = glowColor.replace('0.7', '0.15').replace('0.8', '0.2');
      this.ctx.fill();

      // 核心實體
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 14;
      this.ctx.fillStyle = mainColor;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // 特殊道具倒數環狀進度指示
      if (this.food.type !== 'normal' && this.food.duration > 0) {
        const elapsed = performance.now() - this.food.spawnTime;
        const remainPct = Math.max(0, 1 - elapsed / this.food.duration);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius * 1.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remainPct);
        this.ctx.strokeStyle = mainColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // 圖標符號
      if (label) {
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.fillStyle = '#070913';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, cx, cy);
      }

      this.ctx.restore();
    }

    drawSnake() {
      if (this.snake.length === 0) return;

      const cell = this.cellSize;
      const styles = getComputedStyle(document.body);
      const headColor = styles.getPropertyValue('--snake-head-color').trim() || '#00f5d4';
      const tailColor = styles.getPropertyValue('--snake-tail-color').trim() || '#7209b7';
      const glowColor = styles.getPropertyValue('--snake-glow-color').trim() || 'rgba(0, 245, 212, 0.6)';

      this.ctx.save();
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 12;

      // 繪製蛇身 (由尾至頭繪製，實現色彩漸層與流線圓角)
      for (let i = this.snake.length - 1; i >= 0; i--) {
        const seg = this.snake[i];
        const isHead = i === 0;
        const progress = i / Math.max(1, this.snake.length - 1);

        const x = seg.x * cell;
        const y = seg.y * cell;
        const pad = isHead ? 2 : 3;
        const r = isHead ? 8 : 6;

        // 計算節點漸層色
        this.ctx.fillStyle = isHead ? headColor : this.interpolateColor(headColor, tailColor, progress);

        this.roundRect(
          this.ctx,
          x + pad,
          y + pad,
          cell - pad * 2,
          cell - pad * 2,
          r
        );
        this.ctx.fill();

        // 蛇頭繪製眼睛與方向特徵
        if (isHead) {
          this.drawSnakeEyes(x, y, cell);
        }
      }

      this.ctx.restore();
    }

    drawSnakeEyes(x, y, cell) {
      const eyeOffset = cell * 0.28;
      const eyeRadius = cell * 0.12;
      const pupilRadius = cell * 0.06;
      const cx = x + cell / 2;
      const cy = y + cell / 2;

      let e1x, e1y, e2x, e2y;

      // 根據行進方向決定雙眼位置
      if (this.direction.x === 1) { // 右
        e1x = e2x = cx + eyeOffset * 0.7;
        e1y = cy - eyeOffset;
        e2y = cy + eyeOffset;
      } else if (this.direction.x === -1) { // 左
        e1x = e2x = cx - eyeOffset * 0.7;
        e1y = cy - eyeOffset;
        e2y = cy + eyeOffset;
      } else if (this.direction.y === 1) { // 下
        e1y = e2y = cy + eyeOffset * 0.7;
        e1x = cx - eyeOffset;
        e2x = cx + eyeOffset;
      } else { // 上
        e1y = e2y = cy - eyeOffset * 0.7;
        e1x = cx - eyeOffset;
        e2x = cx + eyeOffset;
      }

      // 眼白
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(e1x, e1y, eyeRadius, 0, Math.PI * 2);
      this.ctx.arc(e2x, e2y, eyeRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // 瞳孔 (深黑微偏移動態)
      this.ctx.fillStyle = '#070913';
      this.ctx.beginPath();
      this.ctx.arc(e1x + this.direction.x, e1y + this.direction.y, pupilRadius, 0, Math.PI * 2);
      this.ctx.arc(e2x + this.direction.x, e2y + this.direction.y, pupilRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    interpolateColor(hex1, hex2, factor) {
      const c1 = this.hexToRgb(hex1) || { r: 0, g: 245, b: 212 };
      const c2 = this.hexToRgb(hex2) || { r: 114, g: 9, b: 183 };
      const r = Math.round(c1.r + factor * (c2.r - c1.r));
      const g = Math.round(c1.g + factor * (c2.g - c1.g));
      const b = Math.round(c1.b + factor * (c2.b - c1.b));
      return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const num = parseInt(hex, 16);
      if (isNaN(num)) return null;
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
      };
    }

    roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  }

  // 視窗載入完成後啟動遊戲實例
  window.addEventListener('DOMContentLoaded', () => {
    window.cyberSnake = new CyberSnakeGame();
  });
})();
