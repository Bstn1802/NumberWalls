const sequences = {
    current: undefined,
    param: undefined,
    custom: () => 0,
    round(n) {
        return Math.round(sequences.param * n);
    },
    power(n) {
        return BigInt(n) ** BigInt(sequences.param);
    },
    pagodaRook(n) {
        if (n < 0) return 1 - sequences.pagodaRook(-n);
        while (n > 0 && n % 2 == 0) {
            n /= 2;
        }
        if (n == 0) return 0;
        return ((n - 1) / 2) % 2;
    },
    pagoda: n => sequences.pagodaRook(n + 1) - sequences.pagodaRook(n - 1),
    exponential: n => {
        let log = Math.log(n) / Math.log(sequences.param);
        return Number(Math.abs(log - Math.floor(log)) < 1e-9);
    },
    triangular(n) {
        if (n <= 0) {
            return 1;
        }
        //     x * (x + 1) / 2 = n
        // <=> x^2 + x - 2 * n = 0
        let solution = -0.5 + Math.sqrt(0.25 + 2 * n);
        return Number(solution == Math.floor(solution));
    },
    fibonacci(n) {
        // no floating point precision issues up to 60
        if (Math.abs(n) < 60) {
            return BigInt(Math.round((Math.pow(0.5 * (1 + Math.sqrt(5)), n) - Math.pow(0.5 * (1 - Math.sqrt(5)), n)) / Math.sqrt(5)));
        }
        // get access to already calculated numbers
        const previous = algorithm.data[2];
        // recursive definition backward and forward
        if (n - 2 in previous && n - 1 in previous) {
            return previous[n - 2].value + previous[n - 1].value;
        }
        if (n + 2 in previous && n + 1 in previous) {
            return previous[n + 2].value - previous[n + 1].value;
        }
        // start from last two reliably in constant time computable terms and use the recursive formula
        let a = sequences.fibonacci(58), b = sequences.fibonacci(59);
        for (let i = 59; i < Math.abs(n); i++) {
            [a, b] = [b, a + b];
        }
        // rule for negative numbers
        if (n < 0 && n % 2 == 0) {
            b = -b;
        }
        return b;
    },
    dakotaB(n) {
        if (n == 0) return 0;
        else while (n % 2 == 0) {
            n /= 2;
        }
        return Math.floor(n / 2) % 2;
    },
    dakotaC: n => n == 0 ? 1 : sequences.dakotaB(2 * n) - 2 * sequences.dakotaB(2 * n - 1) + 3,
    dakotaF: n => n == 1 ? [0, 1] : n == 2 ? [1, -1] : n == 3 ? [0, -1] : [1, 0],
    dakota: n => n < 0 ? 0 : sequences.dakotaF(sequences.dakotaC(Math.floor(n / 2)))[n % 2]
}