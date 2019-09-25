const path = require('path');
const { StatsWriterPlugin } = require('webpack-stats-plugin');

module.exports = {
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'nuka-carousel.min.js',
    library: 'Nuka',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },

  entry: path.join(__dirname, 'src/index.js'),

  resolve: {
    extensions: ['.js'],
    modules: [path.join(__dirname, 'node_modules')]
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: 'babel-loader'
      }
    ]
  },

  plugins: [
    new StatsWriterPlugin({
      fields: ['assets', 'modules']
    })
  ],

  externals: [
    {
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react'
      },
      'react-dom': {
        root: 'ReactDom',
        commonjs2: 'react-dom',
        commonjs: 'react-dom',
        amd: 'react-dom'
      }
    }
  ]
};
