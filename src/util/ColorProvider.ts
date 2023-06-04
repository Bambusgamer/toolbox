export default class ColorProvider {
    /**
     * @description Converts an integer to a hex string
     * @example
     * hexFromInt(255) // 'ff'
     */
    static hexFromInt(int: number) {
        return int.toString(16);
    }

    /**
     * @description Pads a hex string and adds a # to the start
     * @example
     * Hexify('ff') // '#ff0000'
     */
    static hexify(hex: string) {
        return '#' + hex.padStart(6, '0');
    }

    /**
     * @description Converts a hex string to an integer
     * @example
     * intFromHex('ff') // 255
     */
    static intFromHex(hex: string) {
        if (hex.startsWith('#')) hex = hex.slice(1);
        return parseInt(hex, 16);
    }

    /**
     * @description Converts RGB values to a hex string
     * @example
     * hexFromRGB(255, 255, 255) // 'ffffff'
     */
    static hexFromRGB(red: number, green: number, blue: number) {
        if (red > 255 || green > 255 || blue > 255) throw new Error('Invalid RGB values');
        if (red < 0 || green < 0 || blue < 0) throw new Error('Invalid RGB values');
        return ColorProvider.hexify(
            ColorProvider.hexFromInt(red) + ColorProvider.hexFromInt(green) + ColorProvider.hexFromInt(blue),
        );
    }

    /**
     * @description Converts a hex string to RGB values
     * @example
     * rgbFromHex('ffffff') // [255, 255, 255]
     */
    static rgbFromHex(hex: string) {
        if (hex.startsWith('#')) hex = hex.slice(1);
        return [
            ColorProvider.intFromHex(hex.slice(0, 2)),
            ColorProvider.intFromHex(hex.slice(2, 4)),
            ColorProvider.intFromHex(hex.slice(4, 6)),
        ];
    }
}
