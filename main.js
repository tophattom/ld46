document.addEventListener('DOMContentLoaded', () => {
  const party = new Party();

  const gameCanvas = document.querySelector('#game-canvas');
  const ctx = setupCanvas(gameCanvas, CANVAS_WIDTH, CANVAS_HEIGHT);

  const volumeUpButton = document.querySelector('#volume-up');
  const volumeDownButton = document.querySelector('#volume-down');
  const addFoodButton = document.querySelector('#add-food');
  const addDrinksButton = document.querySelector('#add-drinks');

  let foodReserve = 3;
  let drinksReserve = 5;

  volumeUpButton.addEventListener('click', () => {
    party.changeVolume(0.1);
    if (party.stopped()) {
      party.start();
    }
  });

  volumeDownButton.addEventListener('click', () => {
    if (party.running()) {
      party.changeVolume(-0.1);
    }
  });

  addFoodButton.addEventListener('click', () => {
    if (party.running()) {
      party.addFood(4);

      foodReserve--;
      if (foodReserve === 0) {
        addFoodButton.disabled = 'disabled';
      }
    }
  });

  addDrinksButton.addEventListener('click', () => {
    if (party.running()) {
      party.addDrinks(4);

      drinksReserve--;
      if (drinksReserve === 0) {
        addDrinksButton.disabled = 'disabled';
      }
    }
  });

  if (DEBUG) {
    console.log(party);
  }

  window.requestAnimationFrame(render(ctx, party));
  window.setInterval(() => { party.tick() }, 3000);
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
    if (DEBUG) {
      ctx.strokeStyle = 'white';
      STATIONS.forEach(station => {
        if (station.radius) {
          drawCircle(ctx, station.pos.i, station.pos.j, station.radius);
        } else {
          ctx.strokeRect(station.pos.i, station.pos.j, station.width, station.height);
        }
      });
    }

    // Update and draw guests
    if (party.running()) {
      party.guests
        .sort((a, b) => a.pos.j - b.pos.j)
        .forEach(guest => {
          guest.update(dt);
          guest.render(ctx);
        });
    }



    // Draw vingette
    drawImg(ctx, VINGETTE_IMG, 160, 0);

    drawGUI(ctx, party);

    if (party.stopped()) {
      drawStartInstructions(ctx);
      window.requestAnimationFrame(render(ctx, party));
      return;
    } else if (party.isGameOver()) {
      drawGameOver(ctx);
    } else {
      window.requestAnimationFrame(render(ctx, party));
    }
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
  drawMeter(ctx, x, y + 35, 136, 9, Math.min(1, party.relativeNoiseLevel()), 'darkred', 'NOISE LEVEL:');
  drawMeter(ctx, x, y + 70, 136, 9, party.relativeFoodAmount(), 'darkgreen', 'FOOD:');
  drawMeter(ctx, x, y + 105, 136, 9, party.relativeDrinksAmount(), 'blue', 'DRINKS:');
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


function drawGameOver(ctx, reason) {
  ctx.fillStyle = 'white';
  ctx.font = '72px VT323, monospace';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER!', PLAY_AREA.x + PLAY_AREA.width / 2, PLAY_AREA.y + PLAY_AREA.height / 2);
}

function drawStartInstructions(ctx) {
  ctx.fillStyle = 'white';
  ctx.font = '32px VT323, monospace';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'center';
  ctx.fillText('Turn up the volume to start the party!', PLAY_AREA.x + PLAY_AREA.width / 2, PLAY_AREA.y + PLAY_AREA.height / 2)
}
