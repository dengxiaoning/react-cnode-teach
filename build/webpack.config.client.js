const path = require('path')
const HTMLPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const webpackBase = require('./webpack.base')
const isDev = process.env.NODE_ENV === 'development'
const config = merge(webpackBase,
  {
    entry: {
      app: path.join(__dirname, '../client/app.js')
    },
    output: {
      filename: '[name].[hash].js'
    },
    plugins: [
      new HTMLPlugin({
        template: path.join(__dirname, '../client/template.html')
      })
    ]
  }
)

if (isDev) {
  config.entry = {
    app: [
      'react-hot-loader/patch',
      path.join(__dirname, '../client/app.js')
    ]
  }
  config.devServer = {
    host: '0.0.0.0',
    port: '8888',
    contentBase: path.join(__dirname, '../dist'),
    hot: true,
    overlay: {
      errors: true
    },
    publicPath: '/public/',
    historyApiFallback: {
      index: '/public/index.html'
    }
  }
  config.plugins.push(new webpack.HotModuleReplacementPlugin())
}

module.exports = config
