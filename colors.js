const colors = {
    current: undefined,
    param: undefined,
    undefined: "#820",
    custom: () => "#777",
    single: () => "#B82",
    divisible(n) {
        return n % BigInt(colors.param) == 0 ? "#482" : "#04B";
    },
    divisibleExtra(n) {
        return n % BigInt(colors.param) == 0 ? n == 0 ? "#B82" : "#482" : "#04B";
    },
    modulo(n) {
        let param = BigInt(colors.param);
        return `hsl(${n % param * 360n / param}, 60%, 40%)`;
    }
}