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

  static randInRect(x, y, w, h) {
    return new Vector(rand(x, x + w), rand(y, y + h));
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
