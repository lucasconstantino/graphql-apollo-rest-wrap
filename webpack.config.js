const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: ['whatwg-fetch', path.resolve('./src/index.js')],
  output: {
    path: path.resolve('./dist'),
    filename: 'index.js'
  },
  plugins: [new HtmlWebpackPlugin()]
}
