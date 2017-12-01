module.exports = {
    entry: './src/index.js',
    output: {
        filename: './lib/index.js',
        library: 'tiny_graphql_client',
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            { test: /\.js$/, use: 'babel-loader' },
        ],
    },
};