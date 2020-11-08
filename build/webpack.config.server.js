const { merge } = require('webpack-merge')
const webpackBase = require('./webpack.base')
const path = require('path')
module.exports = merge(webpackBase,
  {
    target: 'node',
    entry: {
      app: path.join(__dirname, '../client/server-entry.js')
    },
    output: {
      filename: 'server-entry.js',
      libraryTarget: 'commonjs2'
    }
  })
