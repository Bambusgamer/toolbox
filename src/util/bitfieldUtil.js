module.exports = class BitfieldUtility {
    /**
     * Export a array of bitfield bits to a number
     * @param {[[BigInt], [Number], BigInt, Number]} bits The array of bits
     * @return {Number} The number
     */
    static export(bits) {
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
    }
};
