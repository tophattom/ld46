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

    // Draw background
    drawImg(ctx, BACKGROUND_IMG, 0, 0);

    // Draw stereo
    STEREO_SPRITE.draw(ctx, 383, 69);

    // Draw stations
    ctx.strokeStyle = 'white';
    STATIONS.forEach(station => {
      if (station.radius) {
        drawCircle(ctx, station.pos.i, station.pos.j, station.radius);
      } else {
        ctx.strokeRect(station.pos.i, station.pos.j, station.width, station.height);
      }
    });

    // Update and draw guests
    // party.guests.forEach(guest => {
    //   guest.update(dt);
    //   guest.render(ctx);
    // });

    // Draw vingette
    drawImg(ctx, VINGETTE_IMG, 160, 0);

    drawGUI(ctx, party);

    window.requestAnimationFrame(render(ctx, party));
  }
}

function drawGUI(ctx, party) {
  drawMeters(ctx, 12, 130, party);

  ctx.fillStyle = 'white';
  ctx.font = '40px VT323, monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  const currentTime = party.currentTime();
  ctx.fillText(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 80, 20)

  ctx.font = '24px VT323, monospace';
  ctx.fillText(`${party.guests.length}/${party.originalGuestCount} guests`, 80, 60);
}

function drawMeters(ctx, x, y, party) {
  drawMeter(ctx, x, y, 136, 9, party.totalMood(), 'gold', 'MOOD:');
  // FIXME: Cap noise level meter to 1
  drawMeter(ctx, x, y + 35, 136, 9, party.relativeNoiseLevel(), 'darkred', 'NOISE LEVEL:');
  drawMeter(ctx, x, y + 70, 136, 9, party.relativeFoodAmount(), 'darkgreen', 'FOOD:');
  drawMeter(ctx, x, y + 105, 136, 9, party.relativeDrinksAmount(), 'darkblue', 'DRINKS:');
}

function drawMeter(ctx, x, y, width, height, p, color, label) {
  ctx.fillStyle = 'white';
  ctx.font = '20px VT323, monospace';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.fillText(label, x - 2, y);

  ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

  ctx.fillStyle = 'black';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = color;
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

function drawImg(ctx, img, x, y) {
  ctx.drawImage(img, x, y, img.width / DPR, img.height / DPR);
}
