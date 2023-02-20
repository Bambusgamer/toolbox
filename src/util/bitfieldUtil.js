module.exports = class BitfieldUtility {
    /**
     * Export a array of bitfield bits to a number
     * @param {Array} bits The array of bits
     * @return {Number} The number
     */
    static exportBits(bits) {
        return bits.reduce((a, b) => a + b, 0);
    }
};
