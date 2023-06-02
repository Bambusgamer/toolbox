export default class BitfieldUtility {
    /**
     * @description Export a bitfield to a number
     */
    static export(bits: (bigint | number)[] | bigint | number): number {
        if (typeof bits === 'bigint') return Number(bits);
        if (typeof bits === 'number') return bits;
        if (bits instanceof Array) {
            if (bits.length === 0) return 0;
            let out = 0n;
            for (const bit of bits) {
                if (typeof bit === 'bigint') out |= bit;
                if (typeof bit === 'number') out |= BigInt(bit);
            }
            return Number(out);
        }
        return 0;
    }
}
