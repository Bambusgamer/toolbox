module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es2021': true,
    },
    'extends': 'Google',
    'overrides': [
    ],
    'parserOptions': {
        'ecmaVersion': 'latest',
    },
    'rules': {
        'linebreak-style': ['error', 'windows'],
        'max-len': ['error', {
            'code': 120,
            'ignoreComments': true,
            'ignoreStrings': true,
            'ignoreTemplateLiterals': true,
        }],
        'indent': ['error', 4, {
            'SwitchCase': 1,
        }],
        'object-curly-spacing': ['error', 'always'],
        'guard-for-in': 'off',
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'never',
            'asyncArrow': 'always',
        }],
    },
};
