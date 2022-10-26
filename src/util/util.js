/**
 * Normalizes a path with \ to /
 * @param {string} path Path to normalize
 * @return {string} Normalized path
 */
function normalizePath(path) {
    return path.replace(/\\/g, '/');
};

module.exports = {
    normalizePath,
};
