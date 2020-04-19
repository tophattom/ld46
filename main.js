function rand(min, max) {
  return min + Math.random() * (max - min);
}


class Vector {
  constructor(i, j) {
    this.i = i;
    this.j = j;
  }

  static distance(v1, v2) {
    return v2.clone().sub(v1).length();
  }

  static randInCircle(x, y, r) {
    const randAngle = rand(0, Math.PI * 2);
    const randRadius = rand(0, r);

    return new Vector(x + Math.cos(randAngle) * randRadius, y - Math.sin(randAngle) * randRadius);
  }

  add(v) {
    this.i += v.i;
    this.j += v.j;

    return this;
  }

  sub(v) {
    this.i -= v.i;
    this.j -= v.j;

    return this;
  }

  mul(x) {
    this.i *= x;
    this.j *= x;

    return this;
  }

  div(x) {
    return this.mul(1 / x);
  }

  invert() {
    return this.mul(-1);
  }

  length() {
    return Math.sqrt(this.i * this.i + this.j * this.j);
  }

  normalize() {
    const l = this.length();
    this.i /= l;
    this.j /= l;

    return this;
  }

  clone() {
    return new Vector(this.i, this.j);
  }
}


class Guest {
  static STATE_HANGING = 'STATE_HANGING';
  static STATE_WANDERING = 'STATE_WANDERING';
  static STATE_GETTING_FOOD = 'STATE_GETTING_FOOD';
  static STATE_GETTING_DRINK = 'STATE_GETTING_DRINK';
  static STATE_PASSED_OUT = 'STATE_PASSED_OUT';
  static STATE_LEAVING = 'STATE_LEAVING';
  static STATE_LEFT = 'STATE_LEFT';

  constructor(name) {
    this.name = name;

    this.musicMoodMultiplier = rand(-0.5, 1);
    // this.bacLoudnessEffect = 0.0;

    this.hunger = rand(0, 0.1);
    this.thirst = rand(0, 0.1);
    this.bac = rand(0, 0.5);

    this.baseLoudness = 0.1;
    // this.mood = 0.0;

    this.state = Guest.STATE_WANDERING;

    this.pos = new Vector(rand(0, CANVAS_WIDTH), rand(0, CANVAS_HEIGHT));
    this.vel = new Vector(rand(-1, 1), rand(-1, 1));
    this.targetPos = null;
  }

  hungerMoodEffect() {
    return Math.pow(this.hunger, 2);
  }

  thirstMoodEffect() {
    return Math.pow(this.thirst, 2);
  }

  musicMoodEffect(party) {
    return Math.max(-0.8, Math.log(party.musicVolume) + 1);
  }

  mood(party) {
    const needsEffect = this.hungerMoodEffect() + this.thirstMoodEffect();
    return Math.max(0, Math.min(1, 1 - needsEffect + this.musicMoodEffect(party)));
  }

  hungerLoudness(party) {
    return Math.pow(Math.max(0, this.hunger - party.foodAmount), 5) / 5;
  }

  thirstLoudness(party) {
    return Math.pow(Math.max(0, this.thirst - party.drinksAmount), 5) / 4;
  }

  loudness(party) {
    const needsEffect = this.hungerLoudness(party) + this.thirstLoudness(party);
    return (this.baseLoudness + needsEffect) * (1 + this.bac);
  }

  wantsToLeave(party) {
    const currentMood = this.mood(party);
    if (currentMood >= 0.75) {
      return false;
    } else if (currentMood <= 0.1) {
      return true;
    }

    return Math.random() > Math.min(1, currentMood * 1.5);
  }

  hasLeft() {
    return this.state === Guest.STATE_LEFT;
  }

  isLeaving() {
    return this.state === Guest.STATE_LEAVING;
  }

  isInIdleState() {
    return this.state === Guest.STATE_WANDERING || this.state === Guest.STATE_HANGING;
  }

  tick(party) {
    if (this.isLeaving() || this.hasLeft()) {
      return;
    }

    this.hunger += (0.02 + rand(0.01, 0.03));
    this.thirst += (0.02 + rand(0.02, 0.04));
    this.bac = Math.max(0, this.bac - 0.01);
    this.musicMoodMultiplier = Math.min(1, Math.max(0, rand(-0.1, 0.1)));

    if (this.wantsToLeave(party) && this.isInIdleState()) {
      this.state = Guest.STATE_LEAVING;
    }

    if (Math.random() < this.hunger && this.isInIdleState()) {
      this.state = Guest.STATE_GETTING_FOOD;
      this.logAction('Ate');
      this.hunger -= party.eat(this.hunger);
    }

    if (Math.random() < this.thirst && this.isInIdleState()) {
      this.state = Guest.STATE_GETTING_DRINK;
      this.logAction('Drank');
      this.thirst -= party.drink(this.thirst);
      // TODO: Increase BAC here
    }

    // this.logStatus(party);
  }

  update(dt) {
    if (this.state === Guest.STATE_WANDERING) {
      this.targetPos = null;
      this.setWanderingVelocity();
    } else if (this.state === Guest.STATE_GETTING_FOOD) {
      if (this.targetPos === null) {
        this.targetPos = Vector.randInCircle(FOOD_STATION.pos.i, FOOD_STATION.pos.j, FOOD_STATION.radius);
      }
    } else if (this.state === Guest.STATE_GETTING_DRINK) {
      if (this.targetPos === null) {
        this.targetPos = Vector.randInCircle(DRINK_STATION.pos.i, DRINK_STATION.pos.j, DRINK_STATION.radius);
      }
    } else if (this.state === Guest.STATE_LEAVING) {
      if (this.targetPos === null) {
        this.targetPos = Vector.randInCircle(DOOR.pos.i, DOOR.pos.j, DOOR.radius);
      }
    }

    if (this.targetPos !== null) {
      this.setVelocityToTarget();
    }

    this.pos.add(this.vel);
    this.checkCollisions();

    if (this.targetPos !== null && this.isAtTarget()) {
      this.targetPos = null;

      if (this.isLeaving()) {
        this.state = Guest.STATE_LEFT;
      } else {
        this.state = Guest.STATE_WANDERING;
      }
    }
  }

  render(ctx) {
    if (this.state === Guest.STATE_GETTING_FOOD) {
      ctx.fillStyle = 'green';
    } else if (this.state === Guest.STATE_GETTING_DRINK) {
      ctx.fillStyle = 'blue';
    } else if (this.state === Guest.STATE_LEAVING) {
      ctx.fillStyle = 'red';
    } else if (this.state === Guest.STATE_LEFT) {
      ctx.fillStyle = 'darkred';
    } else {
      ctx.fillStyle = 'white';
    }

    drawCircle(ctx, this.pos.i, this.pos.j, 10, true);
  }

  setWanderingVelocity() {
    const velDelta = new Vector(rand(-this.bac, this.bac), rand(-this.bac, this.bac));
    this.vel.add(velDelta).normalize().div(2);
  }

  setVelocityToTarget() {
    this.vel = this.targetPos.clone().sub(this.pos).normalize();
  }

  isAtTarget() {
    return Vector.distance(this.pos, this.targetPos) < 2;
  }

  checkCollisions() {
    if (this.hasLeft()) {
      return;
    }

    if (this.pos.i < 0 || this.pos.i > CANVAS_WIDTH) {
      this.vel.i *= -1;
    }

    if (this.pos.j < 0 || this.pos.j > CANVAS_HEIGHT) {
      this.vel.j *= -1;
    }
  }

  logAction(action) {
    console.log(`${this.name}: ${action}`)
  }

  logStatus(party) {
    this.logAction(`Hunger: ${this.hunger}, Thirst: ${this.thirst}, BAC: ${this.bac}, Mood: ${this.mood(party)}`);
  }
}


class Neighbour {
  constructor() {
    this.baseNoiseTolerance = 4.0;
  }

  noiseTolerance(time) {
    // TODO: Maybe something else than a linear decrease
    return this.baseNoiseTolerance - (this.baseNoiseTolerance / 2) * (time / 36);
  }
}


class Party {
  static STATE_RUNNING = 'STATE_RUNNING';
  static STATE_GAME_OVER = 'STATE_GAME_OVER';
  static MINUTES_PER_TICK = 10;

  constructor() {
    // this.guests = [new Guest('guest 1'), new Guest('guest 2'), new Guest('guest 3')];
    this.guests = Array.from(Array(10)).map((l, i) => new Guest(`Guest ${i}`));
    this.neighbour = new Neighbour();

    this.musicVolume = 0.3;

    this.maxFoodAmount = this.guests.length / 2;
    this.maxDrinksAmount = this.guests.length / 2;
    this.foodAmount = this.maxFoodAmount;
    this.drinksAmount = this.maxDrinksAmount;

    this.state = Party.STATE_RUNNING;

    this.currentTick = 0;
    this.neighbourWarnings = 0;

    this.originalGuestCount = this.guests.length;
    this.startTime = new Date(2020, 4, 1, 18, 0, 0);
  }

  currentTime() {
    return new Date(2020, 4, 1, 18, this.currentTick * Party.MINUTES_PER_TICK);
  }

  changeVolume(amount) {
    this.musicVolume = Math.max(0, Math.min(1, this.musicVolume + amount));
  }

  noiseLevel() {
    const guestsLoudness = this.guests.reduce((sum, guest) => sum + guest.loudness(this), 0.0);
    return this.musicVolume + guestsLoudness;
  }

  relativeNoiseLevel() {
    return this.noiseLevel() / this.neighbour.noiseTolerance(this.currentTick);
  }

  relativeFoodAmount() {
    return this.foodAmount / this.maxFoodAmount;
  }

  relativeDrinksAmount() {
    return this.drinksAmount / this.maxDrinksAmount;
  }

  totalMood() {
    const avgGuestMood = this.guests
      .filter(guest => !guest.isLeaving())
      .reduce((sum, guest) => sum + guest.mood(this), 0) / this.guests.length;
    // TODO: Maybe take guest count into account somehow?
    return avgGuestMood;
  }

  addFood(amount) {
    this.foodAmount = Math.min(this.maxFoodAmount, this.foodAmount + amount);
  }

  addDrinks(amount) {
    this.drinksAmount = Math.min(this.maxDrinksAmount, this.drinksAmount + amount);
  }

  eat(amount) {
    let eaten;

    if (this.foodAmount < amount) {
      eaten = this.foodAmount;
    } else {
      eaten = amount;
    }

    this.foodAmount = Math.max(0, this.foodAmount - amount);
    return eaten;
  }

  drink(amount) {
    let drank;

    if (this.drinksAmount < amount) {
      drank = this.drinksAmount;
    } else {
      drank = amount;
    }

    this.drinksAmount = Math.max(0, this.drinksAmount - amount);
    return drank;
  }

  isGuestCountTooLow() {
    return this.guests.length < Math.floor(this.originalGuestCount / 3);
  }

  isGameOver() {
    return this.isGuestCountTooLow();
  }

  tick() {
    if (this.state != Party.STATE_RUNNING) {
      return;
    }

    this.currentTick++;

    this.guests.forEach(guest => guest.tick(this));
    this.guests = this.guests.filter(guest => {
      const left = guest.hasLeft();
      if (left) {
        guest.logAction('Left the party');
      }

      return !left;
    });

    if (this.isGameOver()) {
      this.state = Party.STATE_GAME_OVER;
      console.log('GAME OVER!');
    }
  }
}


const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

const FOOD_STATION = {
  pos: new Vector(50, 200),
  radius: 30,
};

const DRINK_STATION = {
  pos: new Vector(500, 200),
  radius: 30,
};

const DOOR = {
  pos: new Vector(320, 440),
  radius: 40,
};

const STATIONS = [
  FOOD_STATION,
  DRINK_STATION,
  DOOR,
];


document.addEventListener('DOMContentLoaded', () => {
  const party = new Party();

  const gameCanvas = document.querySelector('#game-canvas');
  const ctx = setupCanvas(gameCanvas, CANVAS_WIDTH, CANVAS_HEIGHT);

  const tickButton = document.querySelector('#tick-button');
  const volumeUpButton = document.querySelector('#volume-up');
  const volumeDownButton = document.querySelector('#volume-down');
  const addFoodButton = document.querySelector('#add-food');
  const addDrinksButton = document.querySelector('#add-drinks');

  tickButton.addEventListener('click', () => {
    party.tick();

    console.log(`Noise level: ${party.noiseLevel()}`);
    console.log(`Overall mood: ${party.totalMood()}`);
  });

  volumeUpButton.addEventListener('click', () => {
    party.changeVolume(0.1);
  });

  volumeDownButton.addEventListener('click', () => {
    party.changeVolume(-0.1);
  });

  addFoodButton.addEventListener('click', () => {
    party.addFood(1);
  });

  addDrinksButton.addEventListener('click', () => {
    party.addDrinks(1);
  });

  console.log(party);

  window.requestAnimationFrame(render(ctx, party));
  // window.setInterval(() => { party.tick() }, 1000);
});


// Adapted from: https://www.html5rocks.com/en/tutorials/canvas/hidpi/
function setupCanvas(canvas, width, height) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1;
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  var ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(dpr, dpr);
  return ctx;
}


function render(ctx, party) {
  return (dt) => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stations
    ctx.strokeStyle = 'white';
    STATIONS.forEach(station => {
      drawCircle(ctx, station.pos.i, station.pos.j, station.radius);
    });

    // Update and draw guests
    party.guests.forEach(guest => {
      guest.update(dt);
      guest.render(ctx);
    });

    drawGUI(ctx, party);

    window.requestAnimationFrame(render(ctx, party));
  }
}

function drawGUI(ctx, party) {
  drawMeter(ctx, 10, 10, 150, 10, party.totalMood(), 'yellow');
  // FIXME: Cap noise level meter to 1
  drawMeter(ctx, 10, 25, 150, 10, party.relativeNoiseLevel(), 'red');
  drawMeter(ctx, 10, 40, 150, 10, party.relativeFoodAmount(), 'green');
  drawMeter(ctx, 10, 55, 150, 10, party.relativeDrinksAmount(), 'blue');


  ctx.fillStyle = 'white';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'top';
  const currentTime = party.currentTime();
  ctx.fillText(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 10, 70)
  ctx.fillText(`${party.guests.length}/${party.originalGuestCount} guests`, 10, 85);
}


function drawMeter(ctx, x, y, width, height, p, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  ctx.strokeRect(x, y, width, height);
  ctx.fillRect(x, y, width * p, height);
}

function drawCircle(ctx, x, y, r, fill = false) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);

  if (fill) {
    ctx.fill()
  } else {
    ctx.stroke();
  }
}
