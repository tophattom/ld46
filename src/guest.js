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

    this.pos = Vector.randInRect(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
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
        this.targetPos = Vector.randInRect(FOOD_STATION.pos.i, FOOD_STATION.pos.j, FOOD_STATION.width, FOOD_STATION.height);
      }
    } else if (this.state === Guest.STATE_GETTING_DRINK) {
      if (this.targetPos === null) {
        this.targetPos = Vector.randInRect(DRINK_STATION.pos.i, DRINK_STATION.pos.j, DRINK_STATION.width, DRINK_STATION.height);
      }
    } else if (this.state === Guest.STATE_LEAVING) {
      if (this.targetPos === null) {
        this.targetPos = Vector.randInRect(DOOR.pos.i, DOOR.pos.j, DOOR.width, DOOR.height);
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

    ctx.drawImage(GUEST_IMG, this.pos.i - 16, this.pos.j - 130, 32, 130);
    // drawCircle(ctx, this.pos.i, this.pos.j, 10, true);
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

    if (this.pos.i < PLAY_AREA.x || this.pos.i > (PLAY_AREA.x + PLAY_AREA.width)) {
      this.vel.i *= -1;
    }

    if (this.pos.j < PLAY_AREA.y || this.pos.j > (PLAY_AREA.y + PLAY_AREA.height)) {
      this.vel.j *= -1;
    }
  }

  logAction(action) {
    if (!DEBUG) {
      return;
    }

    console.log(`${this.name}: ${action}`)
  }

  logStatus(party) {
    this.logAction(`Hunger: ${this.hunger}, Thirst: ${this.thirst}, BAC: ${this.bac}, Mood: ${this.mood(party)}`);
  }
}
