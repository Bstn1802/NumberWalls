const canvas = {
    element: document.getElementById("canvas"),
    relativeTileSize: 0.05, // 20 tiles wide or high at 100% scale
    scale: 1,
    offset: {
        x: 0,
        y: 0
    },
    minScale: 0.04,
    maxScale: 2,
    numbers: {
        enabled: true,
        debug: false,
        minScale: 0.2,
        minFontSize: 8,
        maxFontSize: 42
    },
    selected: undefined,
    renderTime: undefined,
    elementToGrid(x, y) {
        let tileSize = canvas.relativeTileSize * Math.max(canvas.element.width, canvas.element.height) * canvas.scale;
        return { x: Math.floor((x - canvas.offset.x) / tileSize), y: Math.floor((y - canvas.offset.y) / tileSize) };
    },
    clientToElement(x, y) {
        let bound = canvas.element.getBoundingClientRect();
        return {
            x: x - bound.x,
            y: y - bound.y
        };
    },
    resize(width, height) {
        canvas.element.width = width;
        canvas.element.height = height;
    },
    translate(dx, dy) {
        canvas.offset.x += dx;
        canvas.offset.y += dy;
        if (canvas.offset.y > 0) {
            canvas.offset.y = 0;
        }
    },
    setCursor(coords) {
        const frozenAboveVoid = coords !== undefined && algorithm.data.frozen && !algorithm.data.contains(canvas.elementToGrid(coords.x, coords.y));
        canvas.element.style.cursor = canvas.scale < canvas.numbers.minScale || frozenAboveVoid ? "default" : "pointer";
    },
    zoom(factor, x, y) {
        let scale = Math.max(canvas.minScale, Math.min(canvas.scale * factor, canvas.maxScale));
        if (scale == canvas.scale) {
            return;
        }
        factor = scale / canvas.scale; // actual factor
        canvas.translate((x - canvas.offset.x) * (1 - factor), (y - canvas.offset.y) * (1 - factor));
        canvas.scale = scale;
        canvas.setCursor({ x, y });
        if (canvas.scale < canvas.numbers.minScale) {
            canvas.selected = undefined;
            ui.footer.selected.update();
        }
    },
    repaint: () => requestAnimationFrame(canvas.render),
    select(coords) {
        if (!algorithm.data.contains(coords)) return;
        if (canvas.selected && canvas.selected.x == coords.x && canvas.selected.y == coords.y) {
            canvas.selected = undefined;
        } else {
            canvas.selected = coords;
        }
    },
    render() {
        if (algorithm.data.invalid) {
            algorithm.recalculateWall();
        }
        const start = performance.now();
        const ctx = canvas.element.getContext("2d", { alpha: false });

        ctx.clearRect(0, 0, canvas.element.width, canvas.element.height);
        ctx.save();
        ctx.translate(canvas.offset.x, canvas.offset.y);

        const tileSize = Math.max(canvas.element.width, canvas.element.height) * canvas.relativeTileSize * canvas.scale;
        const textSize = 0.6 * tileSize;
        const topLeft = canvas.elementToGrid(0, 0);
        const bottomRight = canvas.elementToGrid(canvas.element.width - 1, canvas.element.height - 1);

        // if "1" is too small to be drawn even when scaled down, then nothing can be drawn
        let tooSmall = false
        ctx.font = Math.min(canvas.numbers.maxFontSize, textSize) + "px Arial, sans-serif";
        let m = ctx.measureText("1"); // probably the smallest thing that will be drawn
        let width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        let scaleDown = width / textSize;
        if (scaleDown > 1) {
            ctx.font = Math.min(42, textSize) / scaleDown + "px Arial, sans-serif";
            m = ctx.measureText("1");
        }
        if (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent < canvas.numbers.minFontSize) {
            tooSmall = true;
        }

        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        for (let y = topLeft.y; y <= bottomRight.y; y++) {
            const row = algorithm.data[y];
            if (row === undefined) {
                continue;
            }
            for (let x = topLeft.x; x <= bottomRight.x; x++) {
                if (!(x in row)) {
                    continue;
                }
                const tilePos = { x: x * tileSize, y: y * tileSize };
                const { value, color } = row[x];
                ctx.fillStyle = color;
                ctx.fillRect(tilePos.x, tilePos.y, tileSize + 1, tileSize + 1);
                if (canvas.numbers.enabled && !tooSmall && canvas.scale > canvas.numbers.minScale) {
                    ctx.fillStyle = "white";
                    ctx.font = Math.min(canvas.numbers.maxFontSize, textSize) + "px Arial, sans-serif";
                    m = ctx.measureText(value);
                    width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
                    scaleDown = width / textSize;
                    if (scaleDown > 1) {
                        ctx.font = Math.min(canvas.numbers.maxFontSize, textSize) / scaleDown + "px Arial, sans-serif";
                        m = ctx.measureText(value);
                        width = textSize;
                    }
                    const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
                    if (height > canvas.numbers.minFontSize || canvas.scale == canvas.maxScale) {
                        const offset = { x: (tileSize - (width - m.actualBoundingBoxLeft)) / 2, y: (tileSize - height) / 2 };
                        ctx.fillText(value, tilePos.x + offset.x, tilePos.y + offset.y + height, textSize);
                        if (canvas.numbers.debug) {
                            ctx.strokeRect(tilePos.x + offset.x, tilePos.y + offset.y + m.actualBoundingBoxAscent, width, -height);
                            ctx.strokeRect(tilePos.x + tileSize / 2, tilePos.y + tileSize / 2, 1, 1);
                        }
                    }
                }
            }
        }

        if (canvas.selected && canvas.scale > canvas.numbers.minScale) {
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.selected.x * tileSize, canvas.selected.y * tileSize, tileSize, tileSize);
        }

        ctx.restore();
        canvas.renderTime = performance.now() - start;
        ui.footer.times.update();
    }
}