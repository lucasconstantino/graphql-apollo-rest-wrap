const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'index.js'
  },
  plugins: [new HtmlWebpackPlugin()]
}
