const DEBUG = false;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PLAY_AREA = {
  x: 285,
  y: 170,
  width: 380,
  height: 410,
};

const FOOD_STATION = {
  pos: new Vector(280, 280),
  width: 40,
  height: 200,
};

const DRINK_STATION = {
  pos: new Vector(640, 200),
  width: 40,
  height: 200,
};

const DOOR = {
  pos: new Vector(420, 540),
  width: 115,
  height: 35,
};

const STATIONS = [
  FOOD_STATION,
  DRINK_STATION,
  DOOR,
];

const DPR = Math.max(1, Math.min(2, Math.ceil(window.devicePixelRatio || 1)));
const IMG_SUFFIX = DPR === 1 ? '' : `@${DPR}x`;

const BACKGROUND_IMG = new Image();
BACKGROUND_IMG.src = `img/background${IMG_SUFFIX}.png`;

const VINGETTE_IMG = new Image();
VINGETTE_IMG.src = `img/vingette${IMG_SUFFIX}.png`;

const GUEST_IMG = new Image();
GUEST_IMG.src = `img/guest${IMG_SUFFIX}.png`;

const STEREO_SPRITE = new AnimatedSprite(
  `img/stereo${IMG_SUFFIX}.png`,
  6,
  231,
  0,
  3,
  DPR
);
