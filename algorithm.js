const algorithm = {
    data: {
        left: undefined,
        right: undefined,
        top: undefined,
        frozen: false,
        invalid: false,
        clear() {
            for (let key in algorithm.data) {
                let index = Number(key);
                if (!Number.isNaN(index)) {
                    delete algorithm.data[index];
                }
            }
        },
        contains(coords) {
            return coords && coords.y in algorithm.data && coords.x in algorithm.data[coords.y];
        }
    },
    recalcTime: undefined,
    value(x, y) {
        return algorithm.data[y][x]?.value;
    },
    recalculateColors() {
        const colorScheme = colors[colors.current];
        for (const key in algorithm.data) {
            if (Number.isNaN(Number(key))) continue;
            for (const x in algorithm.data[key]) {
                const cell = algorithm.data[key][x];
                cell.color = colorScheme(cell.value);
            }
        }
    },
    // cross rules
    cross: {
        small: (top, left, middle, right) => {
            // middle * middle = left * right + top * bottom
            return (middle * middle - left * right) / top;
        },
        large: (topIn, topOut, leftIn, leftOut, rightIn, rightOut, bottomIn) => {
            // bottomOut * topIn * topIn + topOut * bottomIn * bottomIn = leftOut * rightIn * rightIn + rightOut * leftIn * leftIn
            return (leftOut * rightIn * rightIn + rightOut * leftIn * leftIn - topOut * bottomIn * bottomIn) / (topIn * topIn);
        },
        broken: (sign, top, left, right, bottom, topIn, topOut, leftIn, leftOut, rightIn, rightOut, bottomIn) => {
            // left * topOut / topIn + sign * top * leftOut / leftIn = right * bottomOut / bottomIn + sign * bottom * rightOut / rightIn
            const a = new Fraction(topOut, topIn).times(left);
            const b = new Fraction(leftOut, leftIn).times(top);
            const c = new Fraction(rightOut, rightIn).times(bottom);
            const d = sign ? a.subtract(b).add(c) : a.add(b).subtract(c);
            return new Fraction(bottomIn, 1).times(d).divide(right).eval();
        }
    },
    // zero window related functions
    zeroWindow: {
        offset: {
            left(x, y) {
                let offset = 0;
                while (algorithm.value(x - offset - 1, y) == 0) {
                    offset++;
                }
                return offset;
            },
            right(x, y) {
                let offset = 0;
                while (algorithm.value(x + offset + 1, y) == 0) {
                    offset++;
                }
                return offset;
            }
        },
        width(x, y) {
            return algorithm.zeroWindow.offset.left(x, y) + algorithm.zeroWindow.offset.right(x, y) + 1;
        },
        height(x, y) {
            let height = 0;
            while (algorithm.value(x, y - height - 1) == 0) {
                height++;
            }
            return height;
        }
    },
    // enum like structure for rules
    rules: Object.freeze({
        fixed: "fixed",
        sequence: "sequence",
        rectangularWindows: "rectangularWindows",
        squareWindows: "squareWindows",
        smallCross: "smallCross",
        largeCross: "largeCross",
        horseshoe: "horseshoe",
        quickHorseshoe: "quickHorseshoe",
        reversedHorseshoe: "reversedHorseshoe",
        quickReversedHorseshoe: "quickReversedHorseshoe",
        brokenCross: "brokenCross"
    }),
    rule(x, y) {
        // same logic as in calculateNumber
        if (y <= 1) {
            return algorithm.rules.fixed;
        }
        if (y == 2) {
            return algorithm.rules.sequence;
        }
        if (algorithm.value(x - 1, y) == 0 && algorithm.value(x, y - 1) == 0 && algorithm.value(x - 1, y - 1) == 0) {
            return algorithm.rules.rectangularWindows;
        }
        if (algorithm.value(x, y - 2) != 0) {
            return algorithm.rules.smallCross;
        }
        if (algorithm.value(x, y - 3) != 0) {
            return algorithm.rules.largeCross;
        }
        if (algorithm.value(x, y - 1) == 0) {
            const height = algorithm.zeroWindow.height(x, y);
            const width = algorithm.zeroWindow.width(x, y - height);
            if (width > height) {
                return algorithm.rules.squareWindows;
            }
            const offset = algorithm.zeroWindow.offset.left(x, y - height);
            if (algorithm.value(x - offset - 1, y) === undefined) {
                if (algorithm.value(x, y - 1) == 0) {
                    if (offset < width - 1) {
                        return algorithm.rules.quickReversedHorseshoe;
                    }
                    return algorithm.rules.reversedHorseshoe;
                }
                return algorithm.rules.brokenCross;
            }
            if (offset > 0) {
                return algorithm.rules.quickHorseshoe;
            }
            return algorithm.rules.horseshoe;
        }
        return algorithm.rules.brokenCross;
    },
    calculateNumber(x, y) {
        // calculate number based on the rules, only horseshoe might not be possible, see reverseHorseshoe
        if (algorithm.value(x - 1, y) == 0 && algorithm.value(x, y - 1) == 0 && algorithm.value(x - 1, y - 1) == 0) {
            // square windows => rectangle windows
            return 0n;
        }
        if (algorithm.value(x, y - 2) != 0) {
            // small cross
            return algorithm.cross.small(algorithm.value(x, y - 2), algorithm.value(x - 1, y - 1), algorithm.value(x, y - 1), algorithm.value(x + 1, y - 1));
        }
        if (algorithm.value(x, y - 3) != 0) {
            // large cross
            return algorithm.cross.large(algorithm.value(x, y - 3), algorithm.value(x, y - 4), algorithm.value(x - 1, y - 2), algorithm.value(x - 2, y - 2), algorithm.value(x + 1, y - 2), algorithm.value(x + 2, y - 2), algorithm.value(x, y - 1));
        }
        if (algorithm.value(x, y - 1) == 0) {
            // below a window...
            const height = algorithm.zeroWindow.height(x, y);
            const width = algorithm.zeroWindow.width(x, y - height); // "-height" to make sure all zeros exist in case we're at an edge
            if (width > height) {
                // square not complete yet, start another row of zeros
                return 0n;
            }
            // square complete already => horseshoe
            const offset = algorithm.zeroWindow.offset.left(x, y - height);
            if (algorithm.value(x - 1, y) === undefined) {
                // missing values, need to go back from right to left
                return;
            }
            if (offset > 0) {
                // already applied horseshoe rule before, can recalculate factor from that
                return algorithm.value(x - 1, y) * algorithm.value(x - 1, y) / algorithm.value(x - 2, y);
            }
            // horseshoe
            const sign = height % 2 == 1;
            const top = new Fraction(algorithm.value(x, y - height - 1), algorithm.value(x - 1, y - height - 1));
            const left = new Fraction(algorithm.value(x - offset - 1, y - height), algorithm.value(x - offset - 1, y - height - 1));
            const right = new Fraction(algorithm.value(x + height - offset, y - height - 1), algorithm.value(x + height - offset, y - height));
            const bottom = left.times(right).divide(top);
            return new Fraction(algorithm.value(x - 1, y), 1).divide(sign ? bottom.negate() : bottom).eval();
        }
        // broken cross rules, determine offset and window size, then apply
        const height = algorithm.zeroWindow.height(x, y - 1);
        const offset = algorithm.zeroWindow.offset.left(x, y - height - 1);
        const top = new Fraction(algorithm.value(x, y - height - 2), algorithm.value(x - 1, y - height - 2));
        const left = new Fraction(algorithm.value(x - offset - 1, y - height - 1), algorithm.value(x - offset - 1, y - height - 2));
        const right = new Fraction(algorithm.value(x + height - offset, y - height - 2), algorithm.value(x + height - offset, y - height - 1));
        const bottom = new Fraction(algorithm.value(x - 1, y - 1), algorithm.value(x, y - 1));
        return algorithm.cross.broken(
            offset % 2 + height % 2 == 1,
            top, left, right, bottom,
            algorithm.value(x + height - 1 - offset - offset, y - height - 2), // topIn
            algorithm.value(x + height - 1 - offset - offset, y - height - 3), // topOut
            algorithm.value(x - offset - 1, y - 2 - offset), // leftIn
            algorithm.value(x - offset - 2, y - 2 - offset), // leftOut
            algorithm.value(x + height - offset, y - height - 1 + offset), // rightIn
            algorithm.value(x + height - offset + 1, y - height - 1 + offset), // rightOut
            algorithm.value(x, y - 1) // bottomIn
        );
    },
    reversedHorseshoe(x, y) {
        // calculate horseshoe mirrored, from right to left, when we're on the left edge and the bottom left corner of the window isn't calculated
        // mostly copied from calculateNumber and switched operators
        const height = algorithm.zeroWindow.height(x, y);
        const width = algorithm.zeroWindow.width(x, y - height); // "-height" to make sure all zeros exist in case we're at an edge
        const offset = algorithm.zeroWindow.offset.left(x, y - height);
        if (algorithm.value(x + 1, y) === undefined) {
            // should only happen when relative tile size is 1, but that should never happen normally
            return;
        }
        if (offset < width - 1) {
            // already applied horseshoe rule before, can recalculate factor from that
            return algorithm.value(x + 1, y) * algorithm.value(x + 1, y) / algorithm.value(x + 2, y);
        }
        const sign = height % 2 == 1;
        const top = new Fraction(algorithm.value(x, y - height - 1), algorithm.value(x - 1, y - height - 1));
        const left = new Fraction(algorithm.value(x - offset - 1, y - height), algorithm.value(x - offset - 1, y - height - 1));
        const right = new Fraction(algorithm.value(x + height - offset, y - height - 1), algorithm.value(x + height - offset, y - height));
        const bottom = left.times(right).divide(top);
        return new Fraction(algorithm.value(x + 1, y), 1).times(sign ? bottom.negate() : bottom).eval();
    },
    calculateWall() {
        // grow and shrink data structure, calculate numbers and their colors
        const start = performance.now();
        // ensure existance of first three rows
        for (let i = 0; i <= 2; i++) {
            if (!algorithm.data[i]) {
                algorithm.data[i] = {};
            }
        }
        // top most left and right most coordinate
        let left = algorithm.data.left - algorithm.data.height + 2;
        let right = algorithm.data.right + algorithm.data.height - 2;
        // shrink first three rows
        for (let key in algorithm.data[0]) {
            let col = Number(key);
            if (!Number.isNaN(col) && (col < left || col > right)) {
                delete algorithm.data[0][key];
                delete algorithm.data[1][key];
                delete algorithm.data[2][key];
            }
        }
        const colorScheme = colors[colors.current];
        const color = n => ({ value: n, color: n === undefined ? undefined : colorScheme(n) });
        // set first three rows
        for (let x = left; x <= right; x++) {
            algorithm.data[0][x] = color(0n);
            algorithm.data[1][x] = color(1n);
            algorithm.data[2][x] = color(BigInt(sequences.getFromCurrent(x)));
        }
        // shrink height
        for (let key in algorithm.data) {
            let row = Number(key);
            if (!Number.isNaN(row) && row > algorithm.data.height) {
                delete algorithm.data[row];
            }
        }
        for (let y = 3; y <= algorithm.data.height; y++) {
            // grow height
            if (algorithm.data[y] === undefined) {
                algorithm.data[y] = {};
            }
            // get bounds for row
            left = algorithm.data.left - algorithm.data.height + y;
            right = algorithm.data.right + algorithm.data.height - y;
            // shrink row
            for (let key in algorithm.data[y]) {
                let col = Number(key);
                if (!Number.isNaN(col) && (col < left || col > right)) {
                    delete algorithm.data[y][col];
                }
            }
            let goBack = false;
            // grow row and calculate numbers
            for (let x = left; x <= right; x++) {
                if (algorithm.data[y][x] === undefined) {
                    let number = algorithm.calculateNumber(x, y);
                    algorithm.data[y][x] = color(number);
                    goBack |= number === undefined; // horseshoe rule possibly can not be applied, need to go back from right to left afterwards
                }
            }
            // go back from right to left when horseshoe couldn't be applied
            if (goBack) {
                for (let x = right; x >= left; x--) {
                    if (algorithm.value(x, y) === undefined) {
                        algorithm.data[y][x] = color(algorithm.reversedHorseshoe(x, y));
                    }
                }
            }
        }
        algorithm.recalcTime = performance.now() - start;
    },
    recalculateWall() {
        // manage bound of data structure and calculate all numbers and their colors
        if (algorithm.data.frozen) {
            return;
        }
        const topLeft = canvas.elementToGrid(0, 0);
        const bottomRight = canvas.elementToGrid(canvas.element.width - 1, canvas.element.height - 1);
        const left = topLeft.x;
        const right = bottomRight.x;
        const height = bottomRight.y;
        if (algorithm.data[0] === undefined || algorithm.data.left != left || algorithm.data.right != right || algorithm.data.height != height) {
            algorithm.data.left = left;
            algorithm.data.right = right;
            algorithm.data.height = height;
            algorithm.calculateWall();
        }
        algorithm.data.invalid = false;
    }
}