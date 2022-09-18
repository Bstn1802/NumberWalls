const ui = {
    viewport: document.getElementById("viewport"),
    footer: {
        times: {
            element: document.getElementById("times"),
            hide: true,
            update() {
                ui.footer.times.element.innerHTML = ui.footer.times.hide ? "" :
                    `wall: ${algorithm.recalcTime.toFixed(3)}ms, render: ${canvas.renderTime.toFixed(3)}ms`;
            }
        },
        selected: {
            element: document.getElementById("selected"),
            update() {
                if (canvas.selected) {
                    let { x, y } = canvas.selected;
                    ui.footer.selected.element.innerHTML = `x: ${x}, y: ${y}, rule: ${algorithm.rule(x, y)}`
                } else {
                    ui.footer.selected.element.innerHTML = "";
                }
            }
        }
    },
    sections: {
        sequence: {
            select: document.getElementById("sequence-select"),
            param: document.getElementById("sequence-param"),
            code: {
                element: document.getElementById("sequence-code"),
                error: document.getElementById("sequence-code-error"),
                apply: {
                    element: document.getElementById("sequence-code-apply"),
                    action() {
                        try {
                            const custom = eval(`(n => {\n${ui.sections.sequence.code.element.value}\n})`);
                            const check = n => {
                                const result = custom(n);
                                if (result === undefined) throw new Error("Must return a number for n=" + n);
                                if (result != Math.round(result)) throw new Error("Must return an integer for n=" + n);
                            }
                            // few simple checks, 0, postive, negative each small and large
                            [0, 1, -1, 100, -100].forEach(check);
                            ui.sections.sequence.code.error.innerHTML = "";
                            sequences.custom = custom;
                            algorithm.data.invalid = true;
                            algorithm.data.clear();
                            canvas.repaint();
                        } catch (err) {
                            ui.sections.sequence.code.error.innerHTML = err;
                        }
                    }
                }
            }
        },
        colors: {
            select: document.getElementById("color-scheme-select"),
            param: document.getElementById("color-scheme-param"),
            code: {
                element: document.getElementById("color-scheme-code"),
                error: document.getElementById("color-scheme-code-error"),
                apply: {
                    element: document.getElementById("color-scheme-code-apply"),
                    action() {
                        try {
                            const custom = eval(`(n => {\n${ui.sections.colors.code.element.value}\n})`);
                            const check = n => {
                                const result = custom(n);
                                if (result === undefined) throw new Error("Must return a value for n=" + n);
                                if (!CSS.supports("color", result)) throw new Error("Must return a valid CSS color for n=" + n);
                            }
                            // few simple checks, 0, postive, negative each small and large
                            [0, 1, -1, 100, -100].forEach(check);
                            ui.sections.colors.code.error.innerHTML = "";
                            colors.custom = custom;
                            algorithm.recalculateColors();
                            canvas.repaint();
                        } catch (err) {
                            ui.sections.colors.code.error.innerHTML = err;
                        }
                    }
                }
            }
        }
    }
}