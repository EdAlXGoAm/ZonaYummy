module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current',
                }
            }
        ],
        '@babel/preset-typescript',
    ],
    plugins: [
        [
            'module-resolver',
            {
                alias: {
                    '@routes': './src/routes',
                    '@controllers': './src/controllers',
                    '@config': './src/config'
                    // ...
                    // '@models': './src/models',
                    // '@config': './src/config',
                    // '@controllers': './src/controllers',
                    // '@services': './src/services',
                    // '@routes': './src/routes',
                    // '@utils': './src/utils',
                    // '@middlewares': './src/middlewares',
                }
            }
        ]
    ]
};