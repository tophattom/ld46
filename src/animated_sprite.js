class AnimatedSprite {
    constructor(sheet, frames, frameTime, startFrame = 0, endFrame = null, scale = 1) {
        this.frames = frames;

        if (typeof sheet !== 'string') {
            this.sheet = sheet;
            this.frameW = this.sheet.width / this.frames;
        } else {
            this.sheet = new Image();
            this.sheet.src = sheet;
            this.sheet.addEventListener('load', () => {
                this.frameW = this.sheet.width / this.frames;
            }, false);
        }

        this.scale = scale;

        this.startFrame = startFrame;
        this.endFrame = endFrame || this.frames - 1;
        this.currentFrame = this.startFrame || 0;

        this.frameTime = frameTime;
        this.interval = null;
    }

    setFrameRange(start, end) {
        this.startFrame = start;
        this.endFrame = end;
    }

    start() {
        this.interval = window.setInterval(() => {
            this.currentFrame++;
            if (this.currentFrame > this.endFrame) {
                this.currentFrame = this.startFrame;
            }
        }, this.frameTime);
    }

    stop() {
        window.clearInterval(this.interval);
    }

    draw(ctx, x, y) {
        var srcX = this.frameW * this.currentFrame;
        ctx.drawImage(this.sheet,
            srcX,
            0,
            this.frameW,
            this.sheet.height,
            x,
            y,
            this.frameW / this.scale,
            this.sheet.height / this.scale
        );
    }
}
