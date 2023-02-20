module.exports = class BitfieldUtility {
    /**
     * Export a array of bitfield bits to a number
     * @param {[Array, BigInt]} bits The array of bits
     * @return {Number} The number
     */
    static exportBits(bits) {
        if (!['number', 'array', 'bigint'].includes(typeof bits)) throw new Error('Bits must be a number, array, or bigint');
        if (bits instanceof Number) return bits;
        if (bits instanceof BigInt) return Number(bits);
        if (bits instanceof Array) {
            let bitfield = 0n;
            for (const bit of bits) {
                if (bit instanceof Number) bitfield |= BigInt(bit);
                if (bit instanceof BigInt) bitfield |= bit;
            }
            return Number(bitfield);
        }
    }
};
