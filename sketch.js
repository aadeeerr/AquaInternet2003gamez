// ============================================================
// AQUA INTERNET // SONGWORLD_03
// GROWTH / EVOLUTION BUILD
//
// STAGE I   0–100%   Bubbles
// STAGE II  100–200% Small Fish
// STAGE III 200–300% Data Fish
// FINAL     300%      Aqua Form / World Complete
//
// MUSIC:
// HIGH  -> Bubble Weather
// VOCAL -> Fish Life
// MID   -> Digital Growth / Data Fish
// BASS  -> Rare Aqua Pulse
//
// Evolution does NOT happen immediately at threshold.
// It waits for a relative MUSIC ENERGY SURGE.
// ============================================================


// ============================================================
// CONFIG
// ============================================================

const VIEW_W = 960;
const VIEW_H = 540;

const WORLD_W = 2400;
const WORLD_H = 900;

const BG_W = 480;
const BG_H = 270;

const FISH_COUNT = 28;


// ============================================================
// GLOBALS
// ============================================================

let bgImage;

let pixelBG;
let worldLayer;
let hudLayer;


// ============================================================
// AUDIO
// ============================================================

let audio = null;

let audioContext = null;
let analyser = null;
let sourceNode = null;
let frequencyData = null;

let fileInput;
let playButton;


// ============================================================
// AUDIO VALUES
// ============================================================

let bass = 0;
let mid = 0;
let vocal = 0;
let high = 0;

let sBass = 0;
let sMid = 0;
let sVocal = 0;
let sHigh = 0;

let previousBass = 0;

let bassPulse = 0;
let bassCooldown = 0;


// ============================================================
// MUSIC ENERGY
// ============================================================

let musicEnergy = 0;
let energyAverage = 0;
let energySurge = 0;

let energyInitialized = false;

let evolutionCooldown = 0;

// ============================================================
// SONG ANALYSIS / 03.1
// ============================================================

// Fixed testing threshold.
// Later this will become adaptive per song.
const EVOLUTION_SURGE_THRESHOLD = 0.055;

// Strongest positive surge observed during this session.
let peakSignal = 0;

// Evolution timestamps in seconds.
let evolutionHistory = {
  hatch: 0,
  hunter: null,
  dataForm: null,
  aquaForm: null
};

// Small visual flash when a music signal actually triggers evolution.
let signalDetectedTimer = 0;


// ============================================================
// GAME
// ============================================================

let player;

let cameraX = 0;
let cameraY = 0;

let dataScore = 0;

let fishes = [];
let bubbles = [];
let cells = [];
let sparkles = [];
let ripples = [];
let popEffects = [];

let dataFish = [];

let cdAngle = 0;


// ============================================================
// GROWTH
// ============================================================

let growth = 0;

// 1 = Hatchling
// 2 = Hunter
// 3 = Data Form
// 4 = Aqua Form / Complete

let evolutionStage = 1;

let evolutionReady = false;

let evolutionAnimation = 0;

let evolutionTitle = "";
let evolutionSubtitle = "";

let gameComplete = false;

let completionTimer = 0;


// ============================================================
// DISCOVERY
// ============================================================

let discovered = new Set();

let firstBubbleCollected = false;
let bassEventSeen = false;
let digitalGrowthSeen = false;
let fishSchoolSeen = false;

let signalScore = 0;

let discoveryMessage = "";
let discoverySub = "";
let discoveryTimer = 0;


// ============================================================
// ZONES
// ============================================================

const zones = [

  {
    id: "glass",
    name: "GLASS CITY",
    x: 0,
    w: 600
  },

  {
    id: "hub",
    name: "CD HUB",
    x: 600,
    w: 650
  },

  {
    id: "garden",
    name: "BUBBLE GARDEN",
    x: 1250,
    w: 600
  },

  {
    id: "ocean",
    name: "DIGITAL OCEAN",
    x: 1850,
    w: 550
  }
];


// ============================================================
// SETUP
// ============================================================

async function setup() {

  bgImage =
    await loadImage(
      "aqua_bg.png"
    );


  createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(1);


  pixelBG =
    createGraphics(
      BG_W,
      BG_H
    );

  pixelBG.pixelDensity(1);
  pixelBG.noSmooth();


  worldLayer =
    createGraphics(
      VIEW_W,
      VIEW_H
    );

  worldLayer.pixelDensity(1);
  worldLayer.smooth();


  hudLayer =
    createGraphics(
      VIEW_W,
      VIEW_H
    );

  hudLayer.pixelDensity(1);
  hudLayer.smooth();


  buildPixelBackground();


  // Player begins in CD Hub

  player =
    new PlayerFish(
      930,
      570
    );


  // Normal fish

  for (
    let i = 0;
    i < FISH_COUNT;
    i++
  ) {

    fishes.push(
      new Fish(i)
    );
  }


  // Data Fish exist from the beginning.
  // Player simply cannot consume them until Stage III.

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    dataFish.push(
      new DataFish(i)
    );
  }


  // Starter bubbles

  for (
    let i = 0;
    i < 24;
    i++
  ) {

    spawnBubble(true);
  }


  // Upload

  fileInput =
    createFileInput(
      handleAudio
    );

  fileInput.attribute(
    "accept",
    "audio/*"
  );

  fileInput.position(
    18,
    18
  );


  // Play button

  playButton =
    createButton(
      "▶ PLAY / PAUSE"
    );

  playButton.position(
    18,
    52
  );

  playButton.mousePressed(
    toggleAudio
  );


  styleControls();


  cameraX =
    constrain(
      player.x - VIEW_W / 2,
      0,
      WORLD_W - VIEW_W
    );


  cameraY =
    constrain(
      player.y - VIEW_H / 2,
      0,
      WORLD_H - VIEW_H
    );


  checkZones();
}


// ============================================================
// CONTROLS STYLE
// ============================================================

function styleControls() {

  playButton.style(
    "font-family",
    "Arial"
  );

  playButton.style(
    "font-size",
    "11px"
  );

  playButton.style(
    "padding",
    "8px 15px"
  );

  playButton.style(
    "border-radius",
    "18px"
  );

  playButton.style(
    "border",
    "1px solid rgba(120,160,175,.65)"
  );

  playButton.style(
    "background",
    "linear-gradient(#ffffff,#dcecef)"
  );

  playButton.style(
    "box-shadow",
    "0 2px 10px rgba(70,140,170,.18)"
  );

  playButton.style(
    "color",
    "#426f80"
  );
}


// ============================================================
// BACKGROUND
// ============================================================

function buildPixelBackground() {

  pixelBG.clear();


  let imageRatio =
    bgImage.width /
    bgImage.height;


  let targetRatio =
    BG_W /
    BG_H;


  let sx = 0;
  let sy = 0;

  let sw =
    bgImage.width;

  let sh =
    bgImage.height;


  if (
    imageRatio > targetRatio
  ) {

    sw =
      bgImage.height *
      targetRatio;

    sx =
      (
        bgImage.width -
        sw
      ) / 2;

  } else {

    sh =
      bgImage.width /
      targetRatio;

    sy =
      (
        bgImage.height -
        sh
      ) / 2;
  }


  pixelBG.image(
    bgImage,

    0,
    0,

    BG_W,
    BG_H,

    sx,
    sy,

    sw,
    sh
  );


  pixelBG.noStroke();

  pixelBG.fill(
    70,
    225,
    245,
    4
  );

  pixelBG.rect(
    0,
    0,
    BG_W,
    BG_H
  );
}


// ============================================================
// DRAW
// ============================================================

function draw() {

  updateAudio();

  updateMusicEnergy();


  if (
    !gameComplete &&
    evolutionAnimation <= 0
  ) {

    player.update();

  } else {

    player.vx *= 0.90;
    player.vy *= 0.90;
  }


  updateCamera();

  checkZones();

  updateWorld();

  updateEvolution();

  renderWorld();

  renderHUD();

  displayScene();


  bassPulse *= 0.89;


  if (
    bassCooldown > 0
  ) {

    bassCooldown--;
  }


  if (
    evolutionCooldown > 0
  ) {

    evolutionCooldown--;
  }


  if (
    discoveryTimer > 0
  ) {

    discoveryTimer--;
  }


  if (
    completionTimer > 0
  ) {

    completionTimer++;
  }
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {

  let targetX =
    player.x -
    VIEW_W / 2;


  let targetY =
    player.y -
    VIEW_H / 2;


  cameraX =
    lerp(
      cameraX,
      targetX,
      gameComplete ? 0.025 : 0.065
    );


  cameraY =
    lerp(
      cameraY,
      targetY,
      gameComplete ? 0.025 : 0.05
    );


  cameraX =
    constrain(
      cameraX,
      0,
      WORLD_W - VIEW_W
    );


  cameraY =
    constrain(
      cameraY,
      0,
      WORLD_H - VIEW_H
    );
}


// ============================================================
// PLAYER
// ============================================================

class PlayerFish {

  constructor(x, y) {

    this.x = x;
    this.y = y;

    this.vx = 0;
    this.vy = 0;

    this.angle = 0;

    this.size = 18;

    this.targetSize = 18;

    this.maxSpeed = 4.5;

    this.tailPhase = 0;
  }


  update() {

    let ax = 0;
    let ay = 0;


    if (
      keyIsDown(65) ||
      keyIsDown(LEFT_ARROW)
    ) {

      ax -= 1;
    }


    if (
      keyIsDown(68) ||
      keyIsDown(RIGHT_ARROW)
    ) {

      ax += 1;
    }


    if (
      keyIsDown(87) ||
      keyIsDown(UP_ARROW)
    ) {

      ay -= 1;
    }


    if (
      keyIsDown(83) ||
      keyIsDown(DOWN_ARROW)
    ) {

      ay += 1;
    }


    if (
      ax !== 0 ||
      ay !== 0
    ) {

      let len =
        sqrt(
          ax * ax +
          ay * ay
        );


      ax /= len;
      ay /= len;


      this.vx +=
        ax * 0.34;

      this.vy +=
        ay * 0.34;
    }


    let speed =
      sqrt(
        this.vx * this.vx +
        this.vy * this.vy
      );


    if (
      speed > this.maxSpeed
    ) {

      this.vx =
        this.vx /
        speed *
        this.maxSpeed;

      this.vy =
        this.vy /
        speed *
        this.maxSpeed;
    }


    this.x +=
      this.vx;

    this.y +=
      this.vy;


    this.vx *=
      0.94;

    this.vy *=
      0.94;


    this.x =
      constrain(
        this.x,
        35,
        WORLD_W - 35
      );


    this.y =
      constrain(
        this.y,
        100,
        WORLD_H - 35
      );


    if (
      speed > 0.15
    ) {

      this.angle =
        atan2(
          this.vy,
          this.vx
        );
    }


    this.tailPhase +=
      0.12 +
      speed * 0.08;


    // Smooth physical growth

    this.size =
      lerp(
        this.size,
        this.targetSize,
        0.055
      );
  }


  draw(g) {

    let sx =
      this.x -
      cameraX;

    let sy =
      this.y -
      cameraY;


    let s =
      this.size;


    g.push();

    g.translate(
      sx,
      sy
    );

    g.rotate(
      this.angle
    );


    // ========================================================
    // STAGE AURA
    // ========================================================

    g.noStroke();


    if (
      evolutionStage === 1
    ) {

      g.fill(
        100,
        240,
        255,
        25
      );

    } else if (
      evolutionStage === 2
    ) {

      g.fill(
        100,
        245,
        215,
        32
      );

    } else if (
      evolutionStage === 3
    ) {

      g.fill(
        120,
        255,
        175,
        42
      );

    } else {

      g.fill(
        180,
        235,
        255,
        55
      );
    }


    g.circle(
      0,
      0,
      s * 5
    );


    // Extra aura rings for evolved forms

    if (
      evolutionStage >= 2
    ) {

      g.noFill();

      g.stroke(
        255,
        255,
        255,
        80
      );

      g.strokeWeight(1);

      g.circle(
        0,
        0,
        s * 4.1
      );
    }


    if (
      evolutionStage >= 3
    ) {

      g.stroke(
        100,
        245,
        205,
        75
      );

      g.circle(
        0,
        0,
        s * 4.7
      );
    }


    let tailSwing =
      sin(
        this.tailPhase
      ) *
      s * 0.25;


    // ========================================================
    // TAIL
    // ========================================================

    if (
      evolutionStage === 1
    ) {

      g.fill(
        120,
        230,
        245,
        220
      );

    } else if (
      evolutionStage === 2
    ) {

      g.fill(
        110,
        240,
        210,
        225
      );

    } else {

      g.fill(
        100,
        245,
        180,
        225
      );
    }


    g.stroke(
      255,
      255,
      255,
      200
    );

    g.strokeWeight(
      1.3
    );


    let tailLength =
      evolutionStage >= 3
        ? 2.5
        : 2.15;


    g.triangle(

      -s * 1.15,
      0,

      -s * tailLength,
      -s * 0.8 +
      tailSwing,

      -s * tailLength,
      s * 0.8 +
      tailSwing
    );


    // ========================================================
    // BODY
    // ========================================================

    if (
      evolutionStage === 1
    ) {

      g.fill(
        225,
        240,
        242,
        250
      );

    } else if (
      evolutionStage === 2
    ) {

      g.fill(
        220,
        245,
        238,
        250
      );

    } else if (
      evolutionStage === 3
    ) {

      g.fill(
        210,
        248,
        230,
        250
      );

    } else {

      g.fill(
        230,
        248,
        250,
        250
      );
    }


    g.stroke(
      255,
      255,
      255,
      245
    );

    g.strokeWeight(
      1.8
    );


    g.ellipse(
      0,
      0,
      s * 3.3,
      s * 1.75
    );


    // ========================================================
    // BODY REFLECTION
    // ========================================================

    g.noStroke();


    if (
      evolutionStage < 3
    ) {

      g.fill(
        75,
        215,
        235,
        110
      );

    } else {

      g.fill(
        75,
        230,
        180,
        120
      );
    }


    g.arc(
      0,
      0,
      s * 3,
      s * 1.45,
      0,
      PI
    );


    // ========================================================
    // IDENTITY STRIPE
    // ========================================================

    if (
      evolutionStage === 1
    ) {

      g.fill(
        250,
        135,
        35,
        235
      );

    } else if (
      evolutionStage === 2
    ) {

      g.fill(
        250,
        175,
        65,
        235
      );

    } else {

      g.fill(
        110,
        245,
        175,
        230
      );
    }


    g.rect(
      s * 0.15,
      -s * 0.68,
      s * 0.25,
      s * 1.36,
      s * 0.1
    );


    // ========================================================
    // EVOLVED FIN
    // ========================================================

    if (
      evolutionStage >= 2
    ) {

      g.fill(
        255,
        255,
        255,
        145
      );


      g.triangle(

        -s * 0.35,
        -s * 0.55,

        s * 0.2,
        -s * 1.15,

        s * 0.55,
        -s * 0.52
      );
    }


    // Digital marking

    if (
      evolutionStage >= 3
    ) {

      g.noFill();

      g.stroke(
        90,
        245,
        180,
        180
      );

      g.strokeWeight(
        1.2
      );


      for (
        let i = -1;
        i <= 1;
        i++
      ) {

        g.rect(
          -s * 0.5 +
          i * s * 0.34,
          -s * 0.18,
          s * 0.18,
          s * 0.18,
          2
        );
      }
    }


    // highlight

    g.noStroke();

    g.fill(
      255,
      255,
      255,
      160
    );

    g.ellipse(
      s * 0.75,
      -s * 0.25,
      s * 0.8,
      s * 0.32
    );


    // eye

    g.fill(
      30,
      75,
      90
    );

    g.circle(
      s * 1.05,
      -s * 0.18,
      max(
        4,
        s * 0.18
      )
    );


    g.fill(255);

    g.circle(
      s * 1.09,
      -s * 0.22,
      max(
        1.3,
        s * 0.055
      )
    );


    // Player ring

    g.noFill();

    g.stroke(
      255,
      255,
      255,
      180
    );

    g.strokeWeight(1);

    g.arc(
      0,
      0,
      s * 4.3,
      s * 4.3,
      -2.5,
      -0.65
    );


    g.pop();
  }
}


// ============================================================
// NORMAL NPC FISH
// ============================================================

class Fish {

  constructor(index) {

    this.index =
      index;

    this.respawn();
  }


  respawn() {

    this.x =
      random(WORLD_W);

    this.y =
      random(
        180,
        WORLD_H - 100
      );


    this.vx =
      random() < 0.5
        ? random(-0.9, -0.45)
        : random(0.45, 0.9);


    this.vy =
      random(
        -0.12,
        0.12
      );


    this.size =
      random(
        8,
        14
      );


    this.phase =
      random(TWO_PI);

    this.wander =
      random(TWO_PI);


    this.alive = true;

    this.respawnTimer = 0;
  }


  eat() {

    this.alive = false;

    this.respawnTimer =
      floor(
        random(
          150,
          280
        )
      );
  }


  update() {

    if (
      !this.alive
    ) {

      this.respawnTimer--;


      if (
        this.respawnTimer <= 0
      ) {

        this.respawn();
      }


      return;
    }


    this.phase +=
      0.03 +
      sVocal * 0.07;


    this.wander +=
      0.008;


    let direction =
      this.vx >= 0
        ? 1
        : -1;


    this.vx +=
      direction *
      sVocal *
      0.008;


    this.vy +=
      sin(
        this.wander
      ) *
      0.006;


    // loose separation

    for (
      let other of fishes
    ) {

      if (
        other === this ||
        !other.alive
      ) continue;


      let dx =
        this.x -
        other.x;

      let dy =
        this.y -
        other.y;


      let d =
        sqrt(
          dx * dx +
          dy * dy
        );


      if (
        d > 0 &&
        d < 38
      ) {

        this.vx +=
          dx / d *
          0.012;

        this.vy +=
          dy / d *
          0.014;
      }
    }


    if (
      bassPulse > 0.55
    ) {

      this.vx +=
        random(
          -0.035,
          0.035
        );

      this.vy +=
        random(
          -0.035,
          0.035
        );
    }


    let speed =
      sqrt(
        this.vx * this.vx +
        this.vy * this.vy
      );


    let maxSpeed =
      1.05 +
      sVocal * 1.2;


    if (
      speed > maxSpeed
    ) {

      this.vx =
        this.vx /
        speed *
        maxSpeed;

      this.vy =
        this.vy /
        speed *
        maxSpeed;
    }


    this.x +=
      this.vx;

    this.y +=
      this.vy;


    this.vx *=
      0.998;

    this.vy *=
      0.985;


    if (
      this.x < -40
    ) {

      this.x =
        WORLD_W + 40;
    }


    if (
      this.x > WORLD_W + 40
    ) {

      this.x =
        -40;
    }


    if (
      this.y < 130
    ) {

      this.y = 130;

      this.vy =
        abs(this.vy);
    }


    if (
      this.y >
      WORLD_H - 60
    ) {

      this.y =
        WORLD_H - 60;

      this.vy =
        -abs(this.vy);
    }
  }


  draw(g) {

    if (
      !this.alive
    ) return;


    let sx =
      this.x -
      cameraX;

    let sy =
      this.y -
      cameraY;


    if (
      sx < -80 ||
      sx > VIEW_W + 80 ||
      sy < -80 ||
      sy > VIEW_H + 80
    ) {

      return;
    }


    let s =
      this.size;


    let dir =
      this.vx >= 0
        ? 1
        : -1;


    g.push();

    g.translate(
      sx,
      sy
    );


    if (
      dir < 0
    ) {

      g.scale(
        -1,
        1
      );
    }


    g.noStroke();

    g.fill(
      245,
      120,
      25,
      230
    );


    g.triangle(

      -s * 1.3,
      0,

      -s * 2.1,
      -s * 0.7,

      -s * 2.1,
      s * 0.7
    );


    g.fill(
      248,
      132,
      31,
      245
    );


    g.ellipse(
      0,
      0,
      s * 3.2,
      s * 1.7
    );


    g.fill(
      250,
      250,
      245
    );


    g.rect(
      -s * 0.55,
      -s * 0.62,
      s * 0.36,
      s * 1.24,
      2
    );


    g.rect(
      s * 0.45,
      -s * 0.5,
      s * 0.25,
      s,
      2
    );


    g.fill(25);

    g.circle(
      s * 1.02,
      -s * 0.16,
      2.5
    );


    g.pop();
  }
}


// ============================================================
// DATA FISH
// ============================================================

class DataFish {

  constructor(index) {

    this.index =
      index;

    this.respawn();
  }


  respawn() {

    // Mostly Digital Ocean,
    // but some can roam elsewhere.

    if (
      random() < 0.72
    ) {

      this.x =
        random(
          1850,
          WORLD_W - 60
        );

    } else {

      this.x =
        random(
          600,
          WORLD_W
        );
    }


    this.y =
      random(
        220,
        WORLD_H - 100
      );


    this.vx =
      random() < 0.5
        ? random(-0.7, -0.35)
        : random(0.35, 0.7);


    this.vy =
      random(
        -0.1,
        0.1
      );


    this.size =
      random(
        20,
        27
      );


    this.phase =
      random(TWO_PI);


    this.alive = true;

    this.respawnTimer = 0;
  }


  eat() {

    this.alive = false;

    this.respawnTimer =
      floor(
        random(
          180,
          320
        )
      );
  }


  update() {

    if (
      !this.alive
    ) {

      this.respawnTimer--;


      if (
        this.respawnTimer <= 0
      ) {

        this.respawn();
      }


      return;
    }


    this.phase +=
      0.025 +
      sMid * 0.05;


    this.x +=
      this.vx *
      (
        1 +
        sMid * 0.9
      );


    this.y +=
      this.vy +
      sin(
        this.phase
      ) *
      0.14;


    if (
      this.x < -60
    ) {

      this.x =
        WORLD_W + 60;
    }


    if (
      this.x > WORLD_W + 60
    ) {

      this.x =
        -60;
    }


    this.y =
      constrain(
        this.y,
        150,
        WORLD_H - 70
      );
  }


  draw(g) {

    if (
      !this.alive
    ) return;


    let sx =
      this.x -
      cameraX;

    let sy =
      this.y -
      cameraY;


    if (
      sx < -100 ||
      sx > VIEW_W + 100 ||
      sy < -100 ||
      sy > VIEW_H + 100
    ) {

      return;
    }


    let s =
      this.size;


    let dir =
      this.vx >= 0
        ? 1
        : -1;


    g.push();

    g.translate(
      sx,
      sy
    );


    if (
      dir < 0
    ) {

      g.scale(
        -1,
        1
      );
    }


    // glow

    g.noStroke();

    g.fill(
      100,
      255,
      190,
      18 +
      sMid * 25
    );

    g.circle(
      0,
      0,
      s * 4.5
    );


    // transparent body

    g.fill(
      190,
      255,
      225,
      70
    );

    g.stroke(
      110,
      245,
      185,
      200
    );

    g.strokeWeight(
      1.4
    );


    g.ellipse(
      0,
      0,
      s * 2.8,
      s * 1.45
    );


    // tail

    g.fill(
      100,
      240,
      200,
      80
    );


    g.triangle(

      -s * 1.2,
      0,

      -s * 2,
      -s * 0.62,

      -s * 2,
      s * 0.62
    );


    // internal data blocks

    g.noStroke();


    for (
      let i = -1;
      i <= 1;
      i++
    ) {

      let pulse =
        sin(
          this.phase +
          i
        );


      g.fill(
        100,
        245,
        170,
        130 +
        pulse * 45
      );


      g.rect(
        -s * 0.42 +
        i * s * 0.42,
        -s * 0.14,
        s * 0.22,
        s * 0.22,
        2
      );
    }


    // eye

    g.fill(
      30,
      110,
      100,
      220
    );

    g.circle(
      s * 0.88,
      -s * 0.13,
      3
    );


    // pixel trail

    for (
      let i = 1;
      i <= 4;
      i++
    ) {

      g.fill(
        90,
        245,
        180,
        60 / i
      );


      g.rect(
        -s * 1.7 -
        i * 9,
        sin(
          this.phase +
          i
        ) * 4,
        4,
        4,
        1
      );
    }


    g.pop();
  }
}


// ============================================================
// WORLD UPDATE
// ============================================================

function updateWorld() {

  updateCells();

  updateRipples();

  updateBubbles();

  updateSparkles();

  updatePopEffects();


  for (
    let fish of fishes
  ) {

    fish.update();
  }


  for (
    let df of dataFish
  ) {

    df.update();
  }


  if (
    !gameComplete &&
    evolutionAnimation <= 0
  ) {

    checkBubbleCollection();

    checkFishPredation();

    checkDataFishPredation();

    checkWorldEvents();
  }
}


// ============================================================
// MUSIC ENERGY
// ============================================================

function updateMusicEnergy() {

  musicEnergy =
    sBass * 0.30 +
    sMid * 0.25 +
    sVocal * 0.30 +
    sHigh * 0.15;


  if (!energyInitialized) {

    energyAverage =
      musicEnergy;

    energyInitialized =
      true;
  }


  // Slow-moving baseline.
  // This represents the song's recent normal energy level.

  energyAverage =
    lerp(
      energyAverage,
      musicEnergy,
      0.015
    );


  // Positive = song is currently above its recent baseline.

  energySurge =
    musicEnergy -
    energyAverage;


  // Record strongest positive signal.

  if (
    audio &&
    !audio.paused &&
    energySurge > peakSignal
  ) {

    peakSignal =
      energySurge;
  }


  // Evolution:
  // Growth decides eligibility.
  // Music decides timing.

  if (
    evolutionReady &&
    evolutionAnimation <= 0 &&
    evolutionCooldown <= 0 &&
    energySurge >
      EVOLUTION_SURGE_THRESHOLD
  ) {

    signalDetectedTimer = 75;

    beginEvolution();
  }


  if (
    signalDetectedTimer > 0
  ) {

    signalDetectedTimer--;
  }
}


// ============================================================
// GROWTH
// ============================================================

function addGrowth(amount) {

  if (
    gameComplete
  ) return;


  growth =
    constrain(
      growth + amount,
      0,
      300
    );


  // Threshold 1

  if (
    evolutionStage === 1 &&
    growth >= 100 &&
    !evolutionReady
  ) {

    growth = 100;

    evolutionReady = true;


    showDiscovery(
      "EVOLUTION READY",
      "WAITING FOR MUSIC SIGNAL"
    );
  }


  // Threshold 2

  if (
    evolutionStage === 2 &&
    growth >= 200 &&
    !evolutionReady
  ) {

    growth = 200;

    evolutionReady = true;


    showDiscovery(
      "EVOLUTION READY",
      "WAITING FOR MUSIC SIGNAL"
    );
  }


  // Threshold 3

  if (
    evolutionStage === 3 &&
    growth >= 300 &&
    !evolutionReady
  ) {

    growth = 300;

    evolutionReady = true;


    showDiscovery(
      "FINAL EVOLUTION READY",
      "WAITING FOR MUSIC SIGNAL"
    );
  }
}


// ============================================================
// EVOLUTION START
// ============================================================

function beginEvolution() {

  recordEvolutionTime();

  evolutionReady = false;

  evolutionAnimation = 90;

  evolutionCooldown = 180;

  player.vx = 0;
  player.vy = 0;

  evolutionAnimation = 90;

  evolutionCooldown = 180;


  player.vx = 0;
  player.vy = 0;


  if (
    evolutionStage === 1
  ) {

    evolutionTitle =
      "LIFEFORM EVOLVING";

    evolutionSubtitle =
      "STAGE II // HUNTER";

  } else if (
    evolutionStage === 2
  ) {

    evolutionTitle =
      "LIFEFORM EVOLVING";

    evolutionSubtitle =
      "STAGE III // DATA FORM";

  } else {

    evolutionTitle =
      "FINAL SIGNAL";

    evolutionSubtitle =
      "AQUA FORM";
  }


  createEvolutionBurst();
}

// ============================================================
// EVOLUTION TIMESTAMP
// ============================================================

function recordEvolutionTime() {

  if (!audio) return;


  let t =
    audio.currentTime || 0;


  if (
    evolutionStage === 1 &&
    evolutionHistory.hunter === null
  ) {

    evolutionHistory.hunter = t;
  }


  else if (
    evolutionStage === 2 &&
    evolutionHistory.dataForm === null
  ) {

    evolutionHistory.dataForm = t;
  }


  else if (
    evolutionStage === 3 &&
    evolutionHistory.aquaForm === null
  ) {

    evolutionHistory.aquaForm = t;
  }
}
// ============================================================
// EVOLUTION UPDATE
// ============================================================

function updateEvolution() {

  if (
    evolutionAnimation <= 0
  ) {

    return;
  }


  evolutionAnimation--;


  // Midpoint = physical transformation

  if (
    evolutionAnimation === 45
  ) {

    if (
      evolutionStage === 1
    ) {

      evolutionStage = 2;

      player.targetSize = 27;

      player.maxSpeed = 4.75;


    } else if (
      evolutionStage === 2
    ) {

      evolutionStage = 3;

      player.targetSize = 40;

      player.maxSpeed = 5.0;


    } else if (
      evolutionStage === 3
    ) {

      evolutionStage = 4;

      player.targetSize = 56;

      player.maxSpeed = 4.7;
    }


    createEvolutionBurst();
  }


  // Finish animation

  if (
    evolutionAnimation === 0
  ) {

    if (
      evolutionStage === 4
    ) {

      completeWorld();

    } else {

      showDiscovery(
        "EVOLUTION COMPLETE",
        stageName()
      );
    }
  }
}


// ============================================================
// EVOLUTION PARTICLES
// ============================================================

function createEvolutionBurst() {

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    popEffects.push({

      x: player.x,
      y: player.y,

      radius:
        15 +
        i * 12,

      life:
        35 +
        i * 4,

      particles:
        Array.from(
          { length: 12 },

          () => {

            let a =
              random(TWO_PI);


            let speed =
              random(
                1,
                3.2
              );


            return {

              x:
                player.x,

              y:
                player.y,

              vx:
                cos(a) *
                speed,

              vy:
                sin(a) *
                speed
            };
          }
        )
    });
  }
}


// ============================================================
// WORLD COMPLETE
// ============================================================

function completeWorld() {

  gameComplete = true;

  completionTimer = 1;

  signalScore = 100;


  player.vx = 0;
  player.vy = 0;
}


// ============================================================
// STAGE NAME
// ============================================================

function stageName() {

  if (
    evolutionStage === 1
  ) {

    return "STAGE I // HATCHLING";
  }


  if (
    evolutionStage === 2
  ) {

    return "STAGE II // HUNTER";
  }


  if (
    evolutionStage === 3
  ) {

    return "STAGE III // DATA FORM";
  }


  return "FINAL // AQUA FORM";
}


// ============================================================
// ZONES
// ============================================================

function checkZones() {

  for (
    let zone of zones
  ) {

    if (
      player.x >= zone.x &&
      player.x <
        zone.x + zone.w
    ) {

      if (
        !discovered.has(
          zone.id
        )
      ) {

        discovered.add(
          zone.id
        );


        addSignal(
          15
        );


        showDiscovery(
          "DISCOVERED",
          zone.name
        );
      }
    }
  }
}


// ============================================================
// WORLD EVENTS
// ============================================================

function checkWorldEvents() {

  if (
    !digitalGrowthSeen &&
    sMid > 0.22 &&
    cells.length >= 5
  ) {

    digitalGrowthSeen = true;

    addSignal(10);


    showDiscovery(
      "WORLD EVENT",
      "DIGITAL GROWTH"
    );
  }


  if (
    !fishSchoolSeen &&
    sVocal > 0.25
  ) {

    let visibleFish = 0;


    for (
      let fish of fishes
    ) {

      if (
        !fish.alive
      ) continue;


      if (
        abs(
          fish.x -
          player.x
        ) < 400 &&
        abs(
          fish.y -
          player.y
        ) < 260
      ) {

        visibleFish++;
      }
    }


    if (
      visibleFish >= 5
    ) {

      fishSchoolSeen = true;

      addSignal(10);


      showDiscovery(
        "WORLD EVENT",
        "ACTIVE FISH SCHOOL"
      );
    }
  }
}


// ============================================================
// SIGNAL
// ============================================================

function addSignal(amount) {

  signalScore =
    constrain(
      signalScore + amount,
      0,
      100
    );
}


// ============================================================
// DISCOVERY MESSAGE
// ============================================================

function showDiscovery(
  title,
  subtitle
) {

  discoveryMessage =
    title;

  discoverySub =
    subtitle;

  discoveryTimer =
    180;
}


// ============================================================
// BUBBLE
// ============================================================

function spawnBubble(
  initial = false
) {

  let zoneBoost =
    getBubbleGardenBoost();


  bubbles.push({

    x:
      initial
        ? random(WORLD_W)
        : constrain(
            player.x +
            random(
              -500,
              500
            ),
            40,
            WORLD_W - 40
          ),

    y:
      initial
        ? random(
            150,
            WORLD_H - 60
          )
        : constrain(
            player.y +
            random(
              180,
              400
            ),
            180,
            WORLD_H - 30
          ),

    size:
      random(
        18,
        46
      ) *
      zoneBoost,

    speed:
      random(
        0.12,
        0.38
      ),

    phase:
      random(TWO_PI),

    life:
      initial
        ? 9999
        : random(
            900,
            1500
          )
  });
}


// ============================================================
// BUBBLE GARDEN BOOST
// ============================================================

function getBubbleGardenBoost() {

  if (
    player.x >= 1250 &&
    player.x < 1850
  ) {

    return 1.15;
  }


  return 1;
}


// ============================================================
// BUBBLE UPDATE
// ============================================================

function updateBubbles() {

  // IMPORTANT:
  // There is always a baseline ecosystem.
  // High frequencies only increase abundance.

  let gardenMultiplier =
    (
      player.x >= 1250 &&
      player.x < 1850
    )
      ? 1.8
      : 1;


  let baselineChance =
    0.0025;


  let audioChance =
    sHigh *
    0.10 *
    gardenMultiplier;


  if (
    random() <
    baselineChance +
    audioChance
  ) {

    spawnBubble(false);
  }


  if (
    bubbles.length > 65
  ) {

    bubbles.splice(
      0,
      bubbles.length - 65
    );
  }


  for (
    let i =
      bubbles.length - 1;

    i >= 0;

    i--
  ) {

    let b =
      bubbles[i];


    b.phase +=
      0.015;


    b.y -=
      b.speed +
      sHigh * 0.16;


    b.x +=
      sin(
        b.phase
      ) *
      0.18;


    b.life--;


    if (
      b.y < 90 ||
      b.life <= 0
    ) {

      bubbles.splice(
        i,
        1
      );
    }
  }
}


// ============================================================
// BUBBLE COLLECTION
// ============================================================

function checkBubbleCollection() {

  for (
    let i =
      bubbles.length - 1;

    i >= 0;

    i--
  ) {

    let b =
      bubbles[i];


    let dx =
      player.x -
      b.x;

    let dy =
      player.y -
      b.y;


    let d =
      sqrt(
        dx * dx +
        dy * dy
      );


    if (
      d <
      player.size * 1.3 +
      b.size * 0.5
    ) {

      dataScore++;


      createPopEffect(
        b.x,
        b.y,
        b.size
      );


      bubbles.splice(
        i,
        1
      );


      // Stage-dependent nutrition

      if (
        evolutionStage === 1
      ) {

        addGrowth(4);

      } else if (
        evolutionStage === 2
      ) {

        addGrowth(1);

      } else if (
        evolutionStage === 3
      ) {

        addGrowth(0.5);
      }


      if (
        !firstBubbleCollected
      ) {

        firstBubbleCollected =
          true;

        addSignal(10);


        showDiscovery(
          "SIGNAL FOUND",
          "BUBBLE DATA"
        );
      }
    }
  }
}


// ============================================================
// NORMAL FISH PREDATION
// ============================================================

function checkFishPredation() {

  for (
    let fish of fishes
  ) {

    if (
      !fish.alive
    ) continue;


    let dx =
      player.x -
      fish.x;

    let dy =
      player.y -
      fish.y;


    let d =
      sqrt(
        dx * dx +
        dy * dy
      );


    let collision =
      player.size * 1.15 +
      fish.size;


    if (
      d < collision
    ) {

      // Stage I cannot eat fish

      if (
        evolutionStage === 1
      ) {

        continue;
      }


      // Stage II / III can eat

      fish.eat();


      createPopEffect(
        fish.x,
        fish.y,
        fish.size * 2
      );


      dataScore += 5;


      if (
        evolutionStage === 2
      ) {

        addGrowth(8);

      } else if (
        evolutionStage === 3
      ) {

        addGrowth(2);
      }
    }
  }
}


// ============================================================
// DATA FISH PREDATION
// ============================================================

function checkDataFishPredation() {

  for (
    let df of dataFish
  ) {

    if (
      !df.alive
    ) continue;


    let dx =
      player.x -
      df.x;

    let dy =
      player.y -
      df.y;


    let d =
      sqrt(
        dx * dx +
        dy * dy
      );


    let collision =
      player.size * 1.05 +
      df.size * 0.85;


    if (
      d < collision
    ) {

      // Before Stage III:
      // Data Fish reject the player.

      if (
        evolutionStage < 3
      ) {

        let len =
          max(
            0.001,
            d
          );


        player.vx +=
          dx /
          len *
          1.6;


        player.vy +=
          dy /
          len *
          1.6;


        df.vx -=
          dx /
          len *
          0.25;


        df.vy -=
          dy /
          len *
          0.25;


        continue;
      }


      // Stage III eats Data Fish

      df.eat();


      createPopEffect(
        df.x,
        df.y,
        df.size * 2.2
      );


      dataScore += 10;


      addGrowth(10);
    }
  }
}


// ============================================================
// POP
// ============================================================

function createPopEffect(
  x,
  y,
  size
) {

  popEffects.push({

    x,
    y,

    radius:
      size * 0.4,

    life:
      24,

    particles:
      Array.from(
        { length: 8 },

        () => {

          let a =
            random(TWO_PI);


          let speed =
            random(
              0.7,
              2
            );


          return {

            x,
            y,

            vx:
              cos(a) *
              speed,

            vy:
              sin(a) *
              speed
          };
        }
      )
  });
}


// ============================================================
// POP UPDATE
// ============================================================

function updatePopEffects() {

  for (
    let i =
      popEffects.length - 1;

    i >= 0;

    i--
  ) {

    let p =
      popEffects[i];


    p.radius +=
      1.6;

    p.life--;


    for (
      let dot of p.particles
    ) {

      dot.x +=
        dot.vx;

      dot.y +=
        dot.vy;
    }


    if (
      p.life <= 0
    ) {

      popEffects.splice(
        i,
        1
      );
    }
  }
}


// ============================================================
// DIGITAL CELLS
// ============================================================

class Cell {

  constructor() {

    let cityChance =
      random() < 0.55;


    if (
      cityChance
    ) {

      this.x =
        random(
          0,
          650
        );

    } else {

      this.x =
        constrain(
          player.x +
          random(
            -500,
            500
          ),
          0,
          WORLD_W
        );
    }


    this.y =
      random(
        WORLD_H * 0.58,
        WORLD_H * 0.9
      );


    this.size =
      random([
        5,
        7,
        9,
        12
      ]);


    this.speed =
      random(
        0.08,
        0.22
      );


    this.life =
      random(
        130,
        260
      );


    this.phase =
      random(TWO_PI);
  }


  update() {

    this.phase +=
      0.018;


    this.y -=
      this.speed +
      sMid * 0.25;


    this.x +=
      sin(
        this.phase
      ) *
      0.12;


    this.life--;
  }


  dead() {

    return (
      this.life <= 0 ||
      this.y < 120
    );
  }
}


// ============================================================
// CELLS UPDATE
// ============================================================

function updateCells() {

  let cityBoost =
    (
      player.x < 650
    )
      ? 1.7
      : 1;


  // baseline + MID bonus

  let chance =
    0.001 +
    sMid *
    0.13 *
    cityBoost;


  if (
    random() < chance
  ) {

    cells.push(
      new Cell()
    );
  }


  if (
    cells.length > 90
  ) {

    cells.splice(
      0,
      cells.length - 90
    );
  }


  for (
    let i =
      cells.length - 1;

    i >= 0;

    i--
  ) {

    cells[i].update();


    if (
      cells[i].dead()
    ) {

      cells.splice(
        i,
        1
      );
    }
  }
}


// ============================================================
// SPARKLES
// ============================================================

function updateSparkles() {

  if (
    sHigh > 0.09 &&
    random() <
      sHigh * 0.18
  ) {

    sparkles.push({

      x:
        constrain(
          player.x +
          random(
            -500,
            500
          ),
          0,
          WORLD_W
        ),

      y:
        constrain(
          player.y +
          random(
            -300,
            300
          ),
          100,
          WORLD_H - 50
        ),

      size:
        random(
          3,
          8
        ),

      life:
        random(
          15,
          32
        )
    });
  }


  for (
    let i =
      sparkles.length - 1;

    i >= 0;

    i--
  ) {

    sparkles[i].life--;


    if (
      sparkles[i].life <= 0
    ) {

      sparkles.splice(
        i,
        1
      );
    }
  }
}


// ============================================================
// BASS RIPPLE
// ============================================================

function createRipple() {

  ripples.push({

    x:
      constrain(
        player.x +
        random(
          -350,
          350
        ),
        100,
        WORLD_W - 100
      ),

    y:
      constrain(
        player.y +
        random(
          80,
          180
        ),
        200,
        WORLD_H - 80
      ),

    radius: 10,

    life: 40
  });


  if (
    !bassEventSeen
  ) {

    bassEventSeen =
      true;

    addSignal(10);


    showDiscovery(
      "WORLD EVENT",
      "AQUA PULSE"
    );
  }
}


// ============================================================
// RIPPLE UPDATE
// ============================================================

function updateRipples() {

  for (
    let i =
      ripples.length - 1;

    i >= 0;

    i--
  ) {

    let r =
      ripples[i];


    r.radius +=
      2.1;

    r.life--;


    if (
      r.life <= 0
    ) {

      ripples.splice(
        i,
        1
      );
    }
  }
}


// ============================================================
// RENDER WORLD
// ============================================================

function renderWorld() {

  worldLayer.clear();


  drawExtendedBackground(
    worldLayer
  );


  drawZoneAtmosphere(
    worldLayer
  );


  drawCells(
    worldLayer
  );


  drawRipples(
    worldLayer
  );


  drawCD(
    worldLayer
  );


  // normal fish

  for (
    let fish of fishes
  ) {

    fish.draw(
      worldLayer
    );
  }


  // data organisms

  for (
    let df of dataFish
  ) {

    df.draw(
      worldLayer
    );
  }


  // bubbles

  for (
    let bubble of bubbles
  ) {

    drawBubble(
      worldLayer,
      bubble
    );
  }


  drawSparkles(
    worldLayer
  );


  player.draw(
    worldLayer
  );


  drawPopEffects(
    worldLayer
  );


  if (
    evolutionAnimation > 0
  ) {

    drawEvolutionWorldEffect(
      worldLayer
    );
  }


  if (
    gameComplete
  ) {

    drawCompletionGlow(
      worldLayer
    );
  }
}


// ============================================================
// BACKGROUND / PARALLAX
// ============================================================

function drawExtendedBackground(g) {

  let parallaxX =
    cameraX * 0.18;


  let parallaxY =
    cameraY * 0.10;


  g.image(
    pixelBG,
    -parallaxX % VIEW_W,
    -parallaxY,
    VIEW_W,
    VIEW_H
  );


  g.image(
    pixelBG,

    (
      -parallaxX %
      VIEW_W
    ) + VIEW_W,

    -parallaxY,

    VIEW_W,
    VIEW_H
  );


  g.image(
    pixelBG,

    (
      -parallaxX %
      VIEW_W
    ) - VIEW_W,

    -parallaxY,

    VIEW_W,
    VIEW_H
  );
}


// ============================================================
// ZONE ATMOSPHERE
// ============================================================

function drawZoneAtmosphere(g) {

  let zone =
    currentZone();


  if (!zone) return;


  // Glass City

  if (
    zone.id === "glass"
  ) {

    g.noStroke();

    g.fill(
      200,
      255,
      240,
      8
    );

    g.rect(
      0,
      0,
      VIEW_W,
      VIEW_H
    );


    for (
      let wx = 120;
      wx < 600;
      wx += 105
    ) {

      let sx =
        wx -
        cameraX;


      if (
        sx < -100 ||
        sx > VIEW_W + 100
      ) continue;


      g.noFill();

      g.stroke(
        255,
        255,
        255,
        50
      );

      g.strokeWeight(2);


      g.rect(
        sx,
        170 - cameraY,
        55,
        330,
        18
      );


      g.stroke(
        110,
        245,
        205,
        38
      );


      g.line(
        sx + 10,
        190 - cameraY,
        sx + 10,
        470 - cameraY
      );
    }
  }


  // CD Hub

  if (
    zone.id === "hub"
  ) {

    let hubX =
      930 -
      cameraX;


    let hubY =
      420 -
      cameraY;


    g.noFill();

    g.stroke(
      255,
      255,
      255,
      28
    );

    g.strokeWeight(1);


    g.circle(
      hubX,
      hubY,
      300
    );


    g.circle(
      hubX,
      hubY,
      390
    );
  }


  // Bubble Garden

  if (
    zone.id === "garden"
  ) {

    g.noStroke();

    g.fill(
      255,
      225,
      250,
      7
    );

    g.rect(
      0,
      0,
      VIEW_W,
      VIEW_H
    );
  }


  // Digital Ocean

  if (
    zone.id === "ocean"
  ) {

    g.noStroke();

    g.fill(
      40,
      185,
      220,
      10
    );

    g.rect(
      0,
      VIEW_H * 0.45,
      VIEW_W,
      VIEW_H
    );


    g.stroke(
      120,
      245,
      220,
      25
    );

    g.strokeWeight(1);


    for (
      let i = 0;
      i < 8;
      i++
    ) {

      let yy =
        VIEW_H * 0.55 +
        i * 34;


      g.line(
        0,
        yy,
        VIEW_W,
        yy
      );
    }
  }
}


// ============================================================
// CURRENT ZONE
// ============================================================

function currentZone() {

  for (
    let zone of zones
  ) {

    if (
      player.x >= zone.x &&
      player.x <
        zone.x + zone.w
    ) {

      return zone;
    }
  }


  return null;
}


// ============================================================
// CELLS DRAW
// ============================================================

function drawCells(g) {

  for (
    let c of cells
  ) {

    let sx =
      c.x -
      cameraX;


    let sy =
      c.y -
      cameraY;


    if (
      sx < -30 ||
      sx > VIEW_W + 30 ||
      sy < -30 ||
      sy > VIEW_H + 30
    ) continue;


    g.noFill();


    if (
      sin(
        c.phase
      ) > 0
    ) {

      g.stroke(
        110,
        245,
        75,
        40 +
        sMid * 120
      );

    } else {

      g.stroke(
        65,
        225,
        205,
        40 +
        sMid * 120
      );
    }


    g.strokeWeight(
      1.3
    );


    g.rect(
      sx,
      sy,
      c.size,
      c.size,
      3
    );
  }
}


// ============================================================
// BUBBLE DRAW
// ============================================================

function drawBubble(
  g,
  b
) {

  let x =
    b.x -
    cameraX;


  let y =
    b.y -
    cameraY;


  if (
    x < -60 ||
    x > VIEW_W + 60 ||
    y < -60 ||
    y > VIEW_H + 60
  ) {

    return;
  }


  g.noStroke();

  g.fill(
    90,
    235,
    250,
    10
  );

  g.circle(
    x,
    y,
    b.size * 1.25
  );


  g.fill(
    160,
    235,
    250,
    14
  );

  g.circle(
    x,
    y,
    b.size
  );


  g.noFill();

  g.stroke(
    255,
    255,
    255,
    205
  );

  g.strokeWeight(
    1.5
  );

  g.circle(
    x,
    y,
    b.size
  );


  g.stroke(
    90,
    225,
    250,
    120
  );

  g.arc(
    x,
    y,
    b.size * 0.92,
    b.size * 0.92,
    0.25,
    1.8
  );


  g.stroke(
    250,
    175,
    230,
    100
  );

  g.arc(
    x,
    y,
    b.size * 0.88,
    b.size * 0.88,
    PI,
    PI * 1.65
  );


  g.stroke(
    255,
    255,
    255,
    245
  );

  g.strokeWeight(
    2.3
  );


  g.arc(
    x - b.size * 0.07,
    y - b.size * 0.07,
    b.size * 0.45,
    b.size * 0.45,
    PI,
    PI * 1.5
  );


  g.noStroke();

  g.fill(
    115,
    245,
    190,
    180
  );


  g.circle(
    x,
    y,
    max(
      2.5,
      b.size * 0.08
    )
  );
}


// ============================================================
// SPARKLE DRAW
// ============================================================

function drawSparkles(g) {

  for (
    let s of sparkles
  ) {

    let x =
      s.x -
      cameraX;


    let y =
      s.y -
      cameraY;


    if (
      x < 0 ||
      x > VIEW_W ||
      y < 0 ||
      y > VIEW_H
    ) continue;


    let alpha =
      constrain(
        s.life * 7,
        0,
        220
      );


    g.stroke(
      255,
      255,
      255,
      alpha
    );

    g.strokeWeight(
      1.2
    );


    g.line(
      x - s.size,
      y,
      x + s.size,
      y
    );


    g.line(
      x,
      y - s.size,
      x,
      y + s.size
    );
  }
}


// ============================================================
// RIPPLE DRAW
// ============================================================

function drawRipples(g) {

  for (
    let r of ripples
  ) {

    let x =
      r.x -
      cameraX;


    let y =
      r.y -
      cameraY;


    let alpha =
      map(
        r.life,
        0,
        40,
        0,
        65
      );


    g.noFill();

    g.stroke(
      255,
      255,
      255,
      alpha
    );

    g.strokeWeight(
      1.2
    );


    g.ellipse(
      x,
      y,
      r.radius * 2,
      r.radius * 0.24
    );


    g.ellipse(
      x,
      y,
      r.radius * 1.4,
      r.radius * 0.16
    );
  }
}


// ============================================================
// POP DRAW
// ============================================================

function drawPopEffects(g) {

  for (
    let p of popEffects
  ) {

    let x =
      p.x -
      cameraX;


    let y =
      p.y -
      cameraY;


    let alpha =
      map(
        p.life,
        0,
        35,
        0,
        220
      );


    g.noFill();

    g.stroke(
      255,
      255,
      255,
      alpha
    );

    g.strokeWeight(
      1.5
    );


    g.circle(
      x,
      y,
      p.radius * 2
    );


    g.noStroke();


    for (
      let dot of p.particles
    ) {

      g.fill(
        100,
        240,
        215,
        alpha
      );


      g.circle(
        dot.x -
        cameraX,

        dot.y -
        cameraY,

        3
      );
    }
  }
}


// ============================================================
// EVOLUTION WORLD EFFECT
// ============================================================

function drawEvolutionWorldEffect(g) {

  let x =
    player.x -
    cameraX;


  let y =
    player.y -
    cameraY;


  let progress =
    1 -
    evolutionAnimation /
    90;


  g.noFill();


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    let r =
      50 +
      progress * 230 +
      i * 28;


    let alpha =
      110 *
      (
        1 -
        progress
      );


    g.stroke(
      255,
      255,
      255,
      alpha
    );

    g.strokeWeight(
      1.2
    );


    g.circle(
      x,
      y,
      r
    );
  }


  g.noStroke();

  g.fill(
    150,
    245,
    230,
    15 +
    sin(
      frameCount * 0.12
    ) * 8
  );


  g.circle(
    x,
    y,
    180
  );
}


// ============================================================
// COMPLETION WORLD GLOW
// ============================================================

function drawCompletionGlow(g) {

  let alpha =
    18 +
    sin(
      frameCount * 0.025
    ) * 6;


  g.noStroke();

  g.fill(
    220,
    255,
    250,
    alpha
  );


  g.rect(
    0,
    0,
    VIEW_W,
    VIEW_H
  );
}


// ============================================================
// CD HUB
// ============================================================

function drawCD(g) {

  const WORLD_CD_X =
    930;

  const WORLD_CD_Y =
    420;


  let x =
    WORLD_CD_X -
    cameraX;


  let y =
    WORLD_CD_Y -
    cameraY;


  if (
    x < -150 ||
    x > VIEW_W + 150 ||
    y < -150 ||
    y > VIEW_H + 150
  ) {

    return;
  }


  let radius =
    72;


  cdAngle +=
    0.0015 +
    sHigh * 0.003;


  g.push();

  g.translate(
    x,
    y
  );

  g.rotate(
    cdAngle
  );


  g.noStroke();

  g.fill(
    100,
    235,
    245,
    12 +
    sHigh * 18
  );


  g.circle(
    0,
    0,
    radius * 2.65
  );


  g.fill(
    50,
    100,
    130,
    22
  );


  g.circle(
    6,
    8,
    radius * 2.12
  );


  g.fill(
    225,
    235,
    238,
    220
  );


  g.stroke(
    255,
    255,
    255,
    230
  );

  g.strokeWeight(
    1.8
  );


  g.circle(
    0,
    0,
    radius * 2
  );


  let colors = [

    [245,155,220],
    [255,225,100],
    [110,235,165],
    [90,215,245],
    [180,160,245]

  ];


  g.noStroke();


  for (
    let i = 0;
    i < 30;
    i++
  ) {

    let c =
      colors[
        i %
        colors.length
      ];


    g.fill(
      c[0],
      c[1],
      c[2],
      16 +
      sHigh * 50
    );


    g.arc(
      0,
      0,
      radius * 1.9,
      radius * 1.9,
      i * TWO_PI / 30,
      (i + 1) * TWO_PI / 30,
      PIE
    );
  }


  g.fill(
    245,
    250,
    250,
    230
  );


  g.stroke(
    125,
    170,
    180,
    170
  );


  g.circle(
    0,
    0,
    radius * 0.42
  );


  g.noStroke();

  g.fill(
    70,
    120,
    140
  );


  g.circle(
    0,
    0,
    11
  );


  g.pop();
}


// ============================================================
// HUD
// ============================================================

function renderHUD() {

  hudLayer.clear();


  let g =
    hudLayer;


  // ========================================================
  // MAIN PANEL
  // ========================================================

  g.noStroke();

  g.fill(
    255,
    255,
    255,
    185
  );


  g.rect(
    28,
    28,
    290,
    137,
    20
  );


  g.noFill();

  g.stroke(
    145,
    195,
    210,
    160
  );

  g.strokeWeight(
    1.2
  );


  g.rect(
    28,
    28,
    290,
    137,
    20
  );


  g.noStroke();

  g.fill(
    60,
    105,
    120
  );


  g.textFont(
    "Arial"
  );


  g.textAlign(
    LEFT,
    CENTER
  );


  g.textSize(
    11
  );


  g.text(
    "AQUA INTERNET // SONGWORLD",
    47,
    48
  );


  // Stage

  g.fill(
    35,
    130,
    145
  );


  g.textSize(
    13
  );


  g.text(
    stageName(),
    47,
    70
  );


  // Data

  g.fill(
    40,
    120,
    140
  );


  g.textSize(
    18
  );


  g.text(
    "DATA " +
    nf(
      dataScore,
      3
    ),
    47,
    94
  );


  // ========================================================
  // GROWTH
  // ========================================================

  g.fill(
    80,
    120,
    130
  );


  g.textSize(
    9
  );


  g.text(
    "GROWTH",
    47,
    119
  );


  g.fill(
    210,
    230,
    232,
    190
  );


  g.rect(
    102,
    115,
    165,
    8,
    5
  );


  let stageProgress =
    getStageProgress();


  g.fill(
    100,
    225,
    185,
    230
  );


  g.rect(
    102,
    115,
    165 *
    stageProgress,
    8,
    5
  );


  g.fill(
    55,
    115,
    125
  );


  g.textAlign(
    RIGHT,
    CENTER
  );


  g.text(
    floor(growth) + "%",
    298,
    119
  );


  // ========================================================
  // WORLD SIGNAL
  // ========================================================

  g.textAlign(
    LEFT,
    CENTER
  );


  g.fill(
    80,
    120,
    130
  );


  g.text(
    "WORLD SIGNAL",
    47,
    143
  );


  g.fill(
    210,
    230,
    232,
    180
  );


  g.rect(
    137,
    139,
    130,
    7,
    5
  );


  g.fill(
    75,
    215,
    195,
    220
  );


  g.rect(
    137,
    139,
    130 *
    signalScore /
    100,
    7,
    5
  );


  g.fill(
    55,
    115,
    125
  );


  g.textAlign(
    RIGHT,
    CENTER
  );


  g.text(
    signalScore + "%",
    298,
    143
  );


  // ========================================================
  // CURRENT ZONE
  // ========================================================

  let zone =
    currentZone();


  if (zone) {

    g.noStroke();

    g.fill(
      255,
      255,
      255,
      155
    );


    g.rect(
      VIEW_W - 213,
      28,
      183,
      58,
      18
    );


    g.fill(
      75,
      115,
      125
    );


    g.textAlign(
      CENTER,
      CENTER
    );


    g.textSize(
      9
    );


    g.text(
      "CURRENT AREA",
      VIEW_W - 121,
      45
    );


    g.fill(
      35,
      120,
      140
    );


    g.textSize(
      13
    );


    g.text(
      zone.name,
      VIEW_W - 121,
      66
    );
  }


  // ========================================================
  // MUSIC ENERGY
  // ========================================================

  if (
    audio &&
    !gameComplete
  ) {

    g.noStroke();

    g.fill(
      255,
      255,
      255,
      120
    );


    g.rect(
      VIEW_W - 213,
      96,
      183,
      42,
      15
    );


    g.fill(
      70,
      110,
      120,
      180
    );


    g.textAlign(
      LEFT,
      CENTER
    );


    g.textSize(
      8
    );


    g.text(
      "MUSIC ENERGY",
      VIEW_W - 195,
      110
    );


    g.fill(
      215,
      230,
      232
    );


    g.rect(
      VIEW_W - 195,
      122,
      145,
      5,
      3
    );


    g.fill(
      115,
      220,
      205
    );


    g.rect(
      VIEW_W - 195,
      122,
      145 *
      constrain(
        musicEnergy * 2,
        0,
        1
      ),
      5,
      3
    );
  }

  // ========================================================
  // AUDIO DEBUG // 03.1
  // ========================================================

  if (audio) {

    drawAudioDebugHUD(g);
  }
  // ========================================================
  // EVOLUTION READY
  // ========================================================

  if (
    evolutionReady
  ) {

    g.noStroke();

    g.fill(
      240,
      255,
      250,
      215
    );


    g.rect(
      VIEW_W / 2 - 120,
      VIEW_H - 82,
      240,
      39,
      18
    );


    g.fill(
      45,
      145,
      135
    );


    g.textAlign(
      CENTER,
      CENTER
    );


    g.textSize(
      10
    );


    g.text(
      evolutionStage === 3
        ? "FINAL EVOLUTION READY · WAIT FOR SURGE"
        : "EVOLUTION READY · WAIT FOR SURGE",

      VIEW_W / 2,
      VIEW_H - 62
    );
  }


  // Discovery

  if (
    discoveryTimer > 0 &&
    evolutionAnimation <= 0 &&
    !gameComplete
  ) {

    drawDiscoveryMessage(
      g
    );
  }


  // ========================================================
// MUSIC SIGNAL DETECTED
// ========================================================

if (
  signalDetectedTimer > 0
) {

  drawSignalDetected(g);
}


// ========================================================
// EVOLUTION OVERLAY
// ========================================================

if (
  evolutionAnimation > 0
) {

  drawEvolutionHUD(
    g
  );
}


  // Completion screen

  if (
    gameComplete
  ) {

    drawCompletionHUD(
      g
    );
  }


  // Controls

  if (
    !gameComplete
  ) {

    g.noStroke();

    g.fill(
      255,
      255,
      255,
      125
    );


    g.rect(
      VIEW_W - 205,
      VIEW_H - 52,
      175,
      27,
      13
    );


    g.fill(
      65,
      105,
      120,
      190
    );


    g.textAlign(
      CENTER,
      CENTER
    );


    g.textSize(
      9
    );


    g.text(
      "WASD / ARROWS  ·  EXPLORE",
      VIEW_W - 117,
      VIEW_H - 38
    );
  }
}
// ============================================================
// AUDIO DEBUG HUD
// ============================================================

function drawAudioDebugHUD(g) {

  const x = 28;
  const y = 180;

  const w = 238;
  const h = 188;


  g.noStroke();

  g.fill(
    255,
    255,
    255,
    172
  );

  g.rect(
    x,
    y,
    w,
    h,
    18
  );


  g.noFill();

  g.stroke(
    145,
    195,
    210,
    120
  );

  g.strokeWeight(1);

  g.rect(
    x,
    y,
    w,
    h,
    18
  );


  // title

  g.noStroke();

  g.fill(
    55,
    105,
    120
  );

  g.textAlign(
    LEFT,
    CENTER
  );

  g.textSize(9);

  g.text(
    "AUDIO ANALYSIS // DEBUG",
    x + 17,
    y + 18
  );


  // spectral bands

  drawDebugValue(
    g,
    "BASS",
    sBass,
    x + 17,
    y + 42
  );

  drawDebugValue(
    g,
    "MID",
    sMid,
    x + 17,
    y + 60
  );

  drawDebugValue(
    g,
    "VOCAL",
    sVocal,
    x + 17,
    y + 78
  );

  drawDebugValue(
    g,
    "HIGH",
    sHigh,
    x + 17,
    y + 96
  );


  // divider

  g.stroke(
    130,
    180,
    190,
    70
  );

  g.line(
    x + 17,
    y + 111,
    x + w - 17,
    y + 111
  );


  // energy

  g.noStroke();

  g.fill(
    70,
    105,
    115
  );

  g.textSize(9);

  g.textAlign(
    LEFT,
    CENTER
  );


  g.text(
    "ENERGY",
    x + 17,
    y + 128
  );

  g.text(
    "BASELINE",
    x + 17,
    y + 145
  );

  g.text(
    "SIGNAL",
    x + 17,
    y + 162
  );


  g.textAlign(
    RIGHT,
    CENTER
  );


  g.fill(
    45,
    125,
    135
  );


  g.text(
    musicEnergy.toFixed(3),
    x + w - 17,
    y + 128
  );


  g.text(
    energyAverage.toFixed(3),
    x + w - 17,
    y + 145
  );


  // Signal gets visually stronger
  // as it approaches the threshold.

  if (
    energySurge >=
    EVOLUTION_SURGE_THRESHOLD
  ) {

    g.fill(
      30,
      175,
      130
    );

  } else if (
    energySurge > 0
  ) {

    g.fill(
      70,
      145,
      145
    );

  } else {

    g.fill(
      120,
      130,
      135
    );
  }


  let signalText =
    (
      energySurge >= 0
        ? "+"
        : ""
    ) +
    energySurge.toFixed(3);


  g.text(
    signalText,
    x + w - 17,
    y + 162
  );


  // threshold marker

  g.textAlign(
    LEFT,
    CENTER
  );

  g.fill(
    95,
    120,
    125
  );

  g.textSize(8);

  g.text(
    "EVOLVE AT",
    x + 17,
    y + 179
  );


  g.textAlign(
    RIGHT,
    CENTER
  );

  g.fill(
    45,
    155,
    135
  );

  g.text(
    "+" +
    EVOLUTION_SURGE_THRESHOLD.toFixed(3),

    x + w - 17,
    y + 179
  );
}

// ============================================================
// STAGE PROGRESS
// ============================================================

function getStageProgress() {

  if (
    evolutionStage === 1
  ) {

    return constrain(
      growth / 100,
      0,
      1
    );
  }


  if (
    evolutionStage === 2
  ) {

    return constrain(
      (
        growth - 100
      ) / 100,
      0,
      1
    );
  }


  if (
    evolutionStage === 3
  ) {

    return constrain(
      (
        growth - 200
      ) / 100,
      0,
      1
    );
  }


  return 1;
}


// ============================================================
// DISCOVERY CARD
// ============================================================

function drawDiscoveryMessage(g) {

  let fade = 1;


  if (
    discoveryTimer < 30
  ) {

    fade =
      discoveryTimer /
      30;
  }


  if (
    discoveryTimer > 150
  ) {

    fade =
      (
        180 -
        discoveryTimer
      ) /
      30;
  }


  fade =
    constrain(
      fade,
      0,
      1
    );


  let boxW =
    330;

  let boxH =
    92;


  let x =
    VIEW_W / 2 -
    boxW / 2;


  let y =
    115;


  g.noStroke();

  g.fill(
    255,
    255,
    255,
    205 * fade
  );


  g.rect(
    x,
    y,
    boxW,
    boxH,
    28
  );


  g.noFill();

  g.stroke(
    130,
    215,
    225,
    180 * fade
  );

  g.strokeWeight(
    1.2
  );


  g.rect(
    x,
    y,
    boxW,
    boxH,
    28
  );


  g.stroke(
    95,
    220,
    195,
    180 * fade
  );


  g.line(
    VIEW_W / 2 - 32,
    y + 21,
    VIEW_W / 2 + 32,
    y + 21
  );


  g.noStroke();

  g.fill(
    75,
    115,
    125,
    220 * fade
  );


  g.textAlign(
    CENTER,
    CENTER
  );


  g.textSize(
    10
  );


  g.text(
    discoveryMessage,
    VIEW_W / 2,
    y + 42
  );


  g.fill(
    35,
    145,
    160,
    245 * fade
  );


  g.textSize(
    20
  );


  g.text(
    discoverySub,
    VIEW_W / 2,
    y + 67
  );
}


// ============================================================
// EVOLUTION HUD
// ============================================================

function drawEvolutionHUD(g) {

  let progress =
    1 -
    evolutionAnimation /
    90;


  let pulse =
    0.5 +
    sin(
      frameCount * 0.14
    ) * 0.5;


  g.noStroke();

  g.fill(
    230,
    255,
    250,
    35 +
    pulse * 20
  );


  g.rect(
    0,
    0,
    VIEW_W,
    VIEW_H
  );


  let boxW =
    390;

  let boxH =
    118;


  let x =
    VIEW_W / 2 -
    boxW / 2;


  let y =
    VIEW_H / 2 -
    boxH / 2;


  g.fill(
    255,
    255,
    255,
    220
  );


  g.rect(
    x,
    y,
    boxW,
    boxH,
    32
  );


  g.noFill();

  g.stroke(
    110,
    230,
    205,
    190
  );

  g.strokeWeight(
    1.5
  );


  g.rect(
    x,
    y,
    boxW,
    boxH,
    32
  );


  g.noStroke();

  g.fill(
    60,
    120,
    125
  );


  g.textAlign(
    CENTER,
    CENTER
  );


  g.textSize(
    11
  );


  g.text(
    evolutionTitle,
    VIEW_W / 2,
    y + 36
  );


  g.fill(
    40,
    150,
    145
  );


  g.textSize(
    23
  );


  g.text(
    evolutionSubtitle,
    VIEW_W / 2,
    y + 67
  );


  // progress line

  g.fill(
    215,
    235,
    232
  );


  g.rect(
    x + 60,
    y + 91,
    boxW - 120,
    6,
    3
  );


  g.fill(
    90,
    225,
    195
  );


  g.rect(
    x + 60,
    y + 91,
    (
      boxW - 120
    ) *
    progress,
    6,
    3
  );
}


// ============================================================
// COMPLETION HUD
// ============================================================

function drawCompletionHUD(g) {

  g.noStroke();

  g.fill(
    235,
    255,
    252,
    105
  );

  g.rect(
    0,
    0,
    VIEW_W,
    VIEW_H
  );


  let boxW = 510;
  let boxH = 430;

  let x =
    VIEW_W / 2 -
    boxW / 2;

  let y =
    VIEW_H / 2 -
    boxH / 2;


  g.fill(
    255,
    255,
    255,
    232
  );

  g.rect(
    x,
    y,
    boxW,
    boxH,
    36
  );


  g.noFill();

  g.stroke(
    110,
    220,
    205,
    190
  );

  g.strokeWeight(1.4);

  g.rect(
    x,
    y,
    boxW,
    boxH,
    36
  );


  // ornament

  g.stroke(
    100,
    225,
    200,
    180
  );

  g.line(
    VIEW_W / 2 - 65,
    y + 31,
    VIEW_W / 2 + 65,
    y + 31
  );


  g.noStroke();

  g.fill(
    55,
    110,
    120
  );

  g.textAlign(
    CENTER,
    CENTER
  );

  g.textSize(11);

  g.text(
    "AQUA INTERNET // SONGWORLD",
    VIEW_W / 2,
    y + 51
  );


  g.fill(
    35,
    145,
    145
  );

  g.textSize(28);

  g.text(
    "WORLD COMPLETE",
    VIEW_W / 2,
    y + 84
  );


  g.fill(
    70,
    120,
    125
  );

  g.textSize(11);

  g.text(
    "LIFEFORM STABILIZED // AQUA FORM",
    VIEW_W / 2,
    y + 112
  );


  // ========================================================
  // WORLD STATS
  // ========================================================

  let statX =
    x + 92;

  let valueX =
    x + 418;

  let statY =
    y + 148;


  g.textAlign(
    LEFT,
    CENTER
  );

  g.fill(
    65,
    105,
    115
  );

  g.textSize(10);


  g.text(
    "FINAL GROWTH",
    statX,
    statY
  );

  g.text(
    "DATA COLLECTED",
    statX,
    statY + 22
  );

  g.text(
    "AREAS DISCOVERED",
    statX,
    statY + 44
  );

  g.text(
    "WORLD SIGNAL",
    statX,
    statY + 66
  );


  g.textAlign(
    RIGHT,
    CENTER
  );

  g.fill(
    35,
    145,
    145
  );


  g.text(
    "300%",
    valueX,
    statY
  );

  g.text(
    dataScore,
    valueX,
    statY + 22
  );

  g.text(
    discovered.size +
      " / " +
      zones.length,
    valueX,
    statY + 44
  );

  g.text(
    signalScore + "%",
    valueX,
    statY + 66
  );


  // divider

  g.stroke(
    120,
    190,
    190,
    80
  );

  g.line(
    x + 75,
    y + 230,
    x + boxW - 75,
    y + 230
  );


  // ========================================================
  // LIFEFORM HISTORY
  // ========================================================

  g.noStroke();

  g.textAlign(
    CENTER,
    CENTER
  );

  g.fill(
    45,
    135,
    140
  );

  g.textSize(10);

  g.text(
    "LIFEFORM HISTORY",
    VIEW_W / 2,
    y + 250
  );


  let hx =
    x + 105;

  let hv =
    x + 405;


  g.textAlign(
    LEFT,
    CENTER
  );

  g.fill(
    75,
    110,
    120
  );

  g.textSize(9);


  g.text(
    "HATCHED",
    hx,
    y + 277
  );

  g.text(
    "HUNTER FORM",
    hx,
    y + 299
  );

  g.text(
    "DATA FORM",
    hx,
    y + 321
  );

  g.text(
    "AQUA FORM",
    hx,
    y + 343
  );


  g.textAlign(
    RIGHT,
    CENTER
  );

  g.fill(
    35,
    145,
    145
  );


  g.text(
    "00:00",
    hv,
    y + 277
  );

  g.text(
    formatSongTime(
      evolutionHistory.hunter
    ),
    hv,
    y + 299
  );

  g.text(
    formatSongTime(
      evolutionHistory.dataForm
    ),
    hv,
    y + 321
  );

  g.text(
    formatSongTime(
      evolutionHistory.aquaForm
    ),
    hv,
    y + 343
  );


  // Peak signal

  g.textAlign(
    CENTER,
    CENTER
  );

  g.fill(
    35,
    155,
    140
  );

  g.textSize(11);

  g.text(
    "PEAK MUSIC SIGNAL   +" +
      peakSignal.toFixed(3),

    VIEW_W / 2,
    y + 375
  );


  g.fill(
    90,
    125,
    130
  );

  g.textSize(8);

  g.text(
    "THE SONG CREATED THE WORLD. YOU GREW INSIDE IT.",
    VIEW_W / 2,
    y + 405
  );
}


// ============================================================
// AUDIO FILE
// ============================================================

function handleAudio(file) {

  if (
    !file ||
    file.type !== "audio"
  ) {

    return;
  }


  if (audio) {

    audio.pause();

    audio.src = "";
  }


  audio =
    new Audio(
      file.data
    );


  audio.preload =
    "auto";


  // Reset relative energy baseline
  // for the newly uploaded song.

  energyInitialized = false;

energyAverage = 0;
energySurge = 0;

peakSignal = 0;

signalDetectedTimer = 0;

evolutionHistory = {
  hatch: 0,
  hunter: null,
  dataForm: null,
  aquaForm: null
};


  setupAnalyser();


  // If song ends while evolution is waiting,
  // force the evolution so a quiet outro cannot soft-lock.

  audio.addEventListener(
    "ended",
    () => {

      if (
        evolutionReady &&
        !gameComplete
      ) {

        beginEvolution();
      }
    }
  );
}


// ============================================================
// ANALYSER
// ============================================================

function setupAnalyser() {

  if (!audio) return;


  if (!audioContext) {

    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
  }


  if (sourceNode) {

    try {

      sourceNode.disconnect();

    } catch (e) {}
  }


  sourceNode =
    audioContext
      .createMediaElementSource(
        audio
      );


  analyser =
    audioContext
      .createAnalyser();


  analyser.fftSize =
    2048;


  analyser.smoothingTimeConstant =
    0.75;


  frequencyData =
    new Uint8Array(
      analyser.frequencyBinCount
    );


  sourceNode.connect(
    analyser
  );


  analyser.connect(
    audioContext.destination
  );
}


// ============================================================
// PLAY
// ============================================================

function toggleAudio() {

  if (!audio) return;


  if (
    audioContext &&
    audioContext.state ===
      "suspended"
  ) {

    audioContext.resume();
  }


  if (
    audio.paused
  ) {

    audio.play();

  } else {

    audio.pause();
  }
}


// ============================================================
// AUDIO UPDATE
// ============================================================

function updateAudio() {

  if (
    !analyser ||
    !frequencyData
  ) {

    return;
  }


  analyser.getByteFrequencyData(
    frequencyData
  );


  bass =
    getBand(
      25,
      180
    );


  mid =
    getBand(
      180,
      1000
    );


  vocal =
    getBand(
      900,
      3500
    );


  high =
    getBand(
      3500,
      11000
    );


  sBass =
    lerp(
      sBass,
      bass,
      0.16
    );


  sMid =
    lerp(
      sMid,
      mid,
      0.12
    );


  sVocal =
    lerp(
      sVocal,
      vocal,
      0.15
    );


  sHigh =
    lerp(
      sHigh,
      high,
      0.18
    );


  // Rare Bass Aqua Pulse

  let jump =
    bass -
    previousBass;


  if (
    bass > 0.38 &&
    jump > 0.075 &&
    bassCooldown <= 0
  ) {

    bassPulse =
      constrain(
        0.45 +
        jump * 4,
        0.45,
        0.85
      );


    createRipple();


    bassCooldown =
      120;
  }


  previousBass =
    lerp(
      previousBass,
      bass,
      0.38
    );
}


// ============================================================
// BAND ANALYSIS
// ============================================================

function getBand(
  lowHz,
  highHz
) {

  if (
    !audioContext ||
    !frequencyData
  ) {

    return 0;
  }


  let nyquist =
    audioContext.sampleRate /
    2;


  let low =
    floor(
      lowHz /
      nyquist *
      frequencyData.length
    );


  let highBin =
    ceil(
      highHz /
      nyquist *
      frequencyData.length
    );


  low =
    constrain(
      low,
      0,
      frequencyData.length - 1
    );


  highBin =
    constrain(
      highBin,
      low + 1,
      frequencyData.length
    );


  let sum = 0;


  for (
    let i = low;
    i < highBin;
    i++
  ) {

    sum +=
      frequencyData[i];
  }


  return (
    sum /
    (
      highBin -
      low
    )
  ) / 255;
}


// ============================================================
// DISPLAY
// ============================================================

function displayScene() {

  background(
    215,
    242,
    246
  );


  let sf =
    max(
      width /
      VIEW_W,

      height /
      VIEW_H
    );


  let displayW =
    VIEW_W *
    sf;


  let displayH =
    VIEW_H *
    sf;


  let x =
    (
      width -
      displayW
    ) / 2;


  let y =
    (
      height -
      displayH
    ) / 2;


  // world texture

  drawingContext.imageSmoothingEnabled =
    false;


  image(
    worldLayer,
    x,
    y,
    displayW,
    displayH
  );


  // HUD smooth

  drawingContext.imageSmoothingEnabled =
    true;


  image(
    hudLayer,
    x,
    y,
    displayW,
    displayH
  );
}


// ============================================================
// RESIZE
// ============================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}
// ============================================================
// 03.1 HELPERS
// ============================================================

function formatSongTime(seconds) {

  if (
    seconds === null ||
    seconds === undefined
  ) {
    return "--:--";
  }

  let total = floor(seconds);
  let minutes = floor(total / 60);
  let secs = total % 60;

  return (
    nf(minutes, 2) +
    ":" +
    nf(secs, 2)
  );
}


// ============================================================
// DEBUG VALUE ROW
// ============================================================

function drawDebugValue(
  g,
  label,
  value,
  x,
  y
) {

  g.noStroke();

  g.fill(
    80,
    110,
    120
  );

  g.textAlign(
    LEFT,
    CENTER
  );

  g.textSize(8);

  g.text(
    label,
    x,
    y
  );


  g.fill(
    215,
    230,
    232,
    180
  );

  g.rect(
    x + 52,
    y - 3,
    105,
    6,
    3
  );


  g.fill(
    100,
    215,
    195,
    210
  );

  g.rect(
    x + 52,
    y - 3,
    105 *
      constrain(
        value,
        0,
        1
      ),
    6,
    3
  );


  g.fill(
    55,
    120,
    130
  );

  g.textAlign(
    RIGHT,
    CENTER
  );

  g.text(
    value.toFixed(3),
    x + 204,
    y
  );
}


// ============================================================
// MUSIC SIGNAL DETECTED
// ============================================================

function drawSignalDetected(g) {

  let alpha =
    constrain(
      signalDetectedTimer / 20,
      0,
      1
    );


  let w = 270;
  let h = 56;

  let x =
    VIEW_W / 2 -
    w / 2;

  let y = 42;


  g.noStroke();

  g.fill(
    225,
    255,
    245,
    225 * alpha
  );

  g.rect(
    x,
    y,
    w,
    h,
    22
  );


  g.noFill();

  g.stroke(
    75,
    225,
    175,
    200 * alpha
  );

  g.strokeWeight(1.3);

  g.rect(
    x,
    y,
    w,
    h,
    22
  );


  g.noStroke();

  g.fill(
    40,
    135,
    125,
    230 * alpha
  );

  g.textAlign(
    CENTER,
    CENTER
  );

  g.textSize(9);

  g.text(
    "MUSIC SIGNAL DETECTED",
    VIEW_W / 2,
    y + 18
  );


  g.fill(
    30,
    170,
    130,
    245 * alpha
  );

  g.textSize(16);

  g.text(
    "+" +
      max(
        energySurge,
        0
      ).toFixed(3),

    VIEW_W / 2,
    y + 38
  );
}