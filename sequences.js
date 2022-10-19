const sequences = {
    current: undefined,
    param: undefined,
    // must be an object to allow negative indeces
    data: {},
    getFromCurrent(n) {
        if (n in sequences.data) {
            return sequences.data[n];
        }
        const currentFunction = sequences[sequences.current];
        sequences.data[n] = currentFunction(n);
        return sequences.data[n];
    },
    resetData() {
        sequences.data = {};
    },
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
        if (n < 0) {
            n = Math.abs(n);
        }
        if ((n == 1) || (n==2)) {
            return 1;
        }
        if (n == 0) {
            return 0;
        }
        return sequences.getFromCurrent(n-1) + sequences.getFromCurrent(n-2);
    },
    hofstadterQ(n) {
        // undefined for n < 1
        if (n < 0) {
            // mirror
            return n = Math.abs(n);
        }
        if ((n == 1) || (n==2) || (n==0)) {
            return 1;
        }
        const firstTermIndex = n - sequences.getFromCurrent(n-1);
        const secondTermIndex = n - sequences.getFromCurrent(n-2);
        const firstTerm = sequences.getFromCurrent(firstTermIndex);
        const secondTerm = sequences.getFromCurrent(secondTermIndex);
        return firstTerm + secondTerm;
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
    dakota: n => n < 0 ? 0 : sequences.dakotaF(sequences.dakotaC(Math.floor(n / 2)))[n % 2],
}