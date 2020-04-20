class Party {
  static STATE_STOPPED = 'STATE_STOPPED';
  static STATE_RUNNING = 'STATE_RUNNING';
  static STATE_GAME_OVER = 'STATE_GAME_OVER';
  static MINUTES_PER_TICK = 10;

  constructor() {
    this.guests = Array.from(Array(15)).map((l, i) => new Guest(`Guest ${i}`));
    this.neighbour = new Neighbour();

    this.musicVolume = 0.3;

    this.maxFoodAmount = Math.ceil(this.guests.length / 2);
    this.maxDrinksAmount = Math.ceil(this.guests.length / 2);
    this.foodAmount = this.maxFoodAmount;
    this.drinksAmount = this.maxDrinksAmount;

    this.state = Party.STATE_STOPPED;

    this.currentTick = 0;
    this.neighbourWarnings = 0;

    this.originalGuestCount = this.guests.length;
    this.startTime = new Date(2020, 4, 1, 18, 0, 0);

    this.audioContext = new AudioContext();
    this.musicElem = document.querySelector('#music');
    this.musicSource = this.audioContext.createMediaElementSource(this.musicElem);
    this.gainNode = this.audioContext.createGain();

    this.musicSource.connect(this.gainNode).connect(this.audioContext.destination);
  }

  currentTime() {
    return new Date(2020, 4, 1, 18, this.currentTick * Party.MINUTES_PER_TICK);
  }

  start() {
    this.state = Party.STATE_RUNNING;
    this.musicElem.play();
  }

  changeVolume(amount) {
    this.musicVolume = Math.max(0, Math.min(1, this.musicVolume + amount));
    this.gainNode.gain.setValueAtTime(Math.pow(this.musicVolume, 2), this.audioContext.currentTime);

    if (this.musicVolume === 0) {
      STEREO_SPRITE.setFrameRange(4, 4);
      STEREO_SPRITE.reset();
    } else {
      STEREO_SPRITE.setFrameRange(0, 3);
      STEREO_SPRITE.start();
    }
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

  tooMuchNoise() {
    return this.noiseLevel() > this.neighbour.noiseTolerance(this.currentTick);
  }

  shouldEndGame() {
    return this.isGuestCountTooLow() || this.tooMuchNoise();
  }

  isGameOver() {
    return this.state === Party.STATE_GAME_OVER;
  }

  stopped() {
    return this.state === Party.STATE_STOPPED;
  }

  running() {
    return this.state === Party.STATE_RUNNING;
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

    if (this.shouldEndGame()) {
      this.state = Party.STATE_GAME_OVER;
      this.musicElem.pause();
    }
  }
}
