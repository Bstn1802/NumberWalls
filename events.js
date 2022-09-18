const events = {
    mouseWheelSensitivity: 0.99,
    hasStartedInCanvas: undefined,
    hasMouseMoved: undefined,
    touchInfo: undefined,
    onWindowLoad() {
        ui.sections.sequence.select.selectedIndex = 2;
        events.onSequenceSelectionChange();
        ui.sections.colors.select.selectedIndex = 1;
        events.onColorsSelectionChange();
        document.body.style = ""; // show body, hidden in html
        canvas.resize(viewport.offsetWidth, viewport.offsetHeight);
        algorithm.data.invalid = true;
        canvas.setCursor();
        canvas.repaint();
    },
    onWindowResize() {
        canvas.resize(ui.viewport.offsetWidth, ui.viewport.offsetHeight);
        algorithm.data.invalid = true;
        canvas.repaint();
    },
    onCanvasMouseDown() {
        events.hasStartedInCanvas = true;
        events.hasMouseMoved = false;
    },
    onCanvasMouseMove(evt) {
        if (algorithm.data.frozen) {
            canvas.setCursor({ x: evt.offsetX, y: evt.offsetY });
        }
        if (!events.hasStartedInCanvas) return;
        canvas.element.style.cursor = "move";
        if (evt.buttons == 1) {
            canvas.translate(evt.movementX, evt.movementY);
            if (algorithm.data.frozen) {
                canvas.setCursor({ x: evt.offsetX, y: evt.offsetY });
            }
            algorithm.data.invalid = true;
            canvas.repaint();
        }
        events.hasMouseMoved = true;
    },
    onCanvasClick(evt) {
        if (!events.hasMouseMoved && canvas.scale > canvas.numbers.minScale) {
            canvas.select(canvas.elementToGrid(evt.offsetX, evt.offsetY));
            canvas.repaint();
            ui.footer.selected.update();
        }
        canvas.setCursor({ x: evt.offsetX, y: evt.offsetY });
        events.hasStartedInCanvas = undefined;
    },
    onCanvasWheel(evt) {
        if (!evt.cancelable) return;
        evt.preventDefault();

        if (evt.ctrlKey) {
            canvas.zoom(Math.pow(events.mouseWheelSensitivity, evt.deltaY), evt.offsetX, evt.offsetY);
        } else {
            canvas.translate(-evt.deltaX, -evt.deltaY);
            if (algorithm.data.frozen) {
                canvas.setCursor({ x: evt.offsetX, y: evt.offsetY });
            }
        }
        algorithm.data.invalid = true;
        canvas.repaint();
    },
    getTouchInfo(touches) {
        if (touches.length == 1) {
            return {
                center: canvas.clientToElement(touches[0].clientX, touches[0].clientY),
            }
        } else if (touches.length == 2) {
            let first = canvas.clientToElement(touches[0].clientX, touches[0].clientY);
            let second = canvas.clientToElement(touches[1].clientX, touches[1].clientY);
            return {
                center: { x: 0.5 * (first.x + second.x), y: 0.5 * (first.y + second.y) },
                distance: Math.hypot(first.x - second.x, first.y - second.y)
            }
        }
    },
    onCanvasTouchStart(evt) {
        events.touchInfo = events.getTouchInfo(evt.touches);
    },
    onCanvasTouchEnd(evt) {
        events.touchInfo = events.getTouchInfo(evt.touches);
    },
    onCanvasTouchMove(evt) {
        if (!evt.cancelable) return;
        evt.preventDefault();

        let touchInfo = events.getTouchInfo(evt.touches);
        if (touchInfo === undefined) {
            return;
        }
        canvas.translate(touchInfo.center.x - events.touchInfo.center.x, touchInfo.center.y - events.touchInfo.center.y);
        if (touchInfo.distance) {
            canvas.zoom(touchInfo.distance / events.touchInfo.distance, touchInfo.center.x, touchInfo.center.y);
        } else if (algorithm.data.frozen) {
            canvas.setCursor({ x: evt.offsetX, y: evt.offsetY });
        }
        algorithm.data.invalid = true;
        canvas.repaint();
        events.touchInfo = touchInfo;
    },
    onSequenceSelectionChange() {
        const element = ui.sections.sequence.select;
        const option = element[element.selectedIndex];
        sequences.current = option.value;
        if (option.dataset.param) {
            element.dataset.requiresParam = "";
            sequences.param = option.dataset.param;
            ui.sections.sequence.param.value = option.dataset.param;
            ui.sections.sequence.param.min = option.dataset.paramMin;
            ui.sections.sequence.param.max = option.dataset.paramMax;
            ui.sections.sequence.param.step = option.dataset.paramStep;
        } else {
            delete element.dataset.requiresParam;
        }
        element.dataset.option = sequences.current;
        algorithm.data.invalid = true;
        algorithm.data.clear();
        canvas.repaint();
    },
    onSequenceCodeKeyDown(evt) {
        if (evt.altKey && evt.keyCode == 13) {
            ui.sections.sequence.code.apply.action();
        }
    },
    onSequenceParamChange() {
        let element = ui.sections.sequence.param;
        events.snapNumberInput(element);
        if (element.value == sequences.param) return;
        sequences.param = element.value;
        algorithm.data.invalid = true;
        algorithm.data.clear();
        canvas.repaint();
    },
    onColorsSelectionChange() {
        const element = ui.sections.colors.select;
        const option = element[element.selectedIndex];
        colors.current = option.value;
        if (option.dataset.param) {
            element.dataset.requiresParam = "";
            colors.param = option.dataset.param;
            ui.sections.colors.param.value = option.dataset.param;
            ui.sections.colors.param.min = option.dataset.paramMin;
            ui.sections.colors.param.max = option.dataset.paramMax;
            ui.sections.colors.param.step = option.dataset.paramStep;
        } else {
            delete element.dataset.requiresParam;
        }
        element.dataset.option = colors.current;
        algorithm.recalculateColors();
        canvas.repaint();
    },
    onColorsCodeKeyDown(evt) {
        if (evt.altKey && evt.keyCode == 13) {
            ui.sections.colors.code.apply.action();
        }
    },
    onColorsParamChange() {
        let element = ui.sections.colors.param;
        events.snapNumberInput(element);
        if (element.value == colors.param) return;
        colors.param = element.value;
        algorithm.recalculateColors();
        canvas.repaint();
    },
    snapNumberInput(element) {
        if (Number.isFinite(Number(element.step))) {
            element.value = Math.round(element.value / element.step) * element.step;
        }
        if (Number.isFinite(Number(element.min))) {
            element.value = Math.max(element.min, element.value);
        }
        if (Number.isFinite(Number(element.max))) {
            element.value = Math.min(element.max, element.value);
        }
    },
    onMenuFieldsetLegendClick(evt) {
        const fieldset = evt.target.parentElement;
        fieldset.classList.toggle("collapsed");
    },
    onCheckBoxShowNumbersChange(evt) {
        canvas.numbers.enabled = evt.target.checked;
        canvas.repaint();
    },
    onDebugTextChange(evt) {
        canvas.numbers.debug = evt.target.checked;
        canvas.repaint();
    },
    onCheckBoxFreezeGrid(evt) {
        algorithm.data.frozen = evt.target.checked;
    },
    onResetCanvasClick() {
        canvas.offset.x = 0;
        canvas.offset.y = 0;
        canvas.scale = 1;
        algorithm.data.invalid = true;
        canvas.repaint();
    },
    onCheckBoxShowTimesChange(evt) {
        ui.footer.times.hide = !evt.target.checked;
        ui.footer.times.update();
    }
}

window.addEventListener("load", events.onWindowLoad);
window.addEventListener("resize", events.onWindowResize);
window.addEventListener("orientationchange", events.onWindowOrientationChange);
canvas.element.addEventListener("mousedown", events.onCanvasMouseDown);
canvas.element.addEventListener("mousemove", events.onCanvasMouseMove);
canvas.element.addEventListener("click", events.onCanvasClick);
canvas.element.addEventListener("wheel", events.onCanvasWheel);
canvas.element.addEventListener("touchstart", events.onCanvasTouchStart);
canvas.element.addEventListener("touchend", events.onCanvasTouchEnd);
canvas.element.addEventListener("touchmove", events.onCanvasTouchMove);

ui.sections.sequence.select.addEventListener("change", events.onSequenceSelectionChange);
ui.sections.sequence.code.element.addEventListener("keydown", events.onSequenceCodeKeyDown);
ui.sections.sequence.code.apply.element.addEventListener("click", ui.sections.sequence.code.apply.action);
ui.sections.sequence.param.addEventListener("change", events.onSequenceParamChange);

ui.sections.colors.select.addEventListener("change", events.onColorsSelectionChange);
ui.sections.colors.code.element.addEventListener("keydown", events.onColorsCodeKeyDown);
ui.sections.colors.code.apply.element.addEventListener("click", ui.sections.colors.code.apply.action);
ui.sections.colors.param.addEventListener("change", events.onColorsParamChange);

document.querySelectorAll("#menu fieldset legend")
    .forEach(element => element.addEventListener("click", events.onMenuFieldsetLegendClick));
document.getElementById("checkBoxShowNumbers").addEventListener("change", events.onCheckBoxShowNumbersChange);
document.getElementById("checkBoxShowTimes").addEventListener("change", events.onCheckBoxShowTimesChange);
document.getElementById("checkBoxDebugText").addEventListener("change", events.onDebugTextChange);
document.getElementById("checkBoxFreezeGrid").addEventListener("change", events.onCheckBoxFreezeGrid);
document.getElementById("resetCanvas").addEventListener("click", events.onResetCanvasClick);