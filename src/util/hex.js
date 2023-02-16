module.exports = class ColorProvidor {
    /**
     * Converts an integer to a hex string
     * @param {number} int Integer to convert to hex
     * @return {string} Hex string
     * @example
     * hexFromInt(255) // 'ff'
     */
    static hexFromInt(int) {
        return int.toString(16);
    }

    /**
     * Pads a hex string and adds a # to the start
     * @param {string} hex Hex string to pad
     * @return {string} Padded hex string
     * @example
     * Hexify('ff') // '#ff0000'
     */
    static hexify(hex) {
        return '#' + hex.padStart(6, '0');
    }

    /**
     * Converts a hex string to an integer
     * @param {string} hex Hex string to convert to integer
     * @return {number} Integer
     * @example
     * intFromHex('ff') // 255
     */
    static intFromHex(hex) {
        return parseInt(hex, 16);
    }

    /**
     * Converts RGB values to a hex string
     * @param {Number} r Red value
     * @param {Number} g Green value
     * @param {Number} b Blue value
     * @return {string} Hex string
     * @example
     * hexFromRGB(255, 255, 255) // 'ffffff'
     */
    static hexFromRGB(r, g, b) {
        return hexFromInt(r) + hexFromInt(g) + hexFromInt(b);
    }

    /**
     * Converts a hex string to RGB values
     * @param {string} hex Hex string to convert to RGB
     * @return {Array} RGB array
     * @example
     * rgbFromHex('ffffff') // [255, 255, 255]
     */
    static rgbFromHex(hex) {
        return [intFromHex(hex.slice(0, 2)), intFromHex(hex.slice(2, 4)), intFromHex(hex.slice(4, 6))];
    }
};
