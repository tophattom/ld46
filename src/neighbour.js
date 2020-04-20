class Neighbour {
  constructor() {
    this.baseNoiseTolerance = 4.0;
  }

  noiseTolerance(time) {
    // TODO: Maybe something else than a linear decrease
    return this.baseNoiseTolerance - (this.baseNoiseTolerance / 2) * (time / 36);
  }
}
