module.exports = {
    entry: './src/index.js',
    output: {
        filename: './lib/index.js',
    },
    module: {
        rules: [
            { test: /\.js$/, use: 'babel-loader' },
        ],
    },
  };