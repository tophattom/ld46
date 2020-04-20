class Neighbour {
  constructor() {
    this.baseNoiseTolerance = 5.0;
  }

  noiseTolerance(time) {
    // TODO: Maybe something else than a linear decrease
    return this.baseNoiseTolerance - (this.baseNoiseTolerance / 2) * (time / 36);
  }
}
