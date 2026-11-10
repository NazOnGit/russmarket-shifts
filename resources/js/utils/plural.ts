// Русское склонение слова после числа.
// plural(1, ['ячейка', 'ячейки', 'ячеек']) → "ячейка"
// plural(3, ...) → "ячейки";  plural(8, ...) → "ячеек";  plural(11, ...) → "ячеек";  plural(21, ...) → "ячейка"
export function plural(count: number, forms: [one: string, few: string, many: string]): string {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) {
        return forms[2];
    }
    if (last === 1) {
        return forms[0];
    }
    if (last >= 2 && last <= 4) {
        return forms[1];
    }
    return forms[2];
}
