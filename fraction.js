class Fraction {
    constructor(numerator, denominator) {
        this.numerator = BigInt(numerator);
        this.denominator = BigInt(denominator);
    }

    times(fraction) {
        return new Fraction(this.numerator * fraction.numerator, this.denominator * fraction.denominator);
    }

    divide(fraction) {
        return new Fraction(this.numerator * fraction.denominator, this.denominator * fraction.numerator);
    }

    add(fraction) {
        return new Fraction(this.numerator * fraction.denominator + fraction.numerator * this.denominator, this.denominator * fraction.denominator);
    }

    subtract(fraction) {
        return this.add(fraction.negate());
    }

    negate() {
        return new Fraction(-this.numerator, this.denominator);
    }

    eval(fallback) {
        if (this.denominator == 0) {
            return fallback;
        }
        return this.numerator / this.denominator;
    }
}