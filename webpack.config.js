/* eslint-disable no-undef */
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { HotModuleReplacementPlugin } = require('webpack')


module.exports = (env) => ({
  entry: path.resolve(__dirname, './script.js'),

  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'main.js',
    publicPath: '/'
  },

  devServer: {
    static: path.resolve(__dirname, './build'),
    compress: true,
    port: 3001,
    open: true,
    historyApiFallback: true,
    hot: true

  },

  plugins: [
    new HtmlWebpackPlugin({
      title: 'Minesweeper',
      filename: 'index.html',
      template: path.resolve(__dirname, './index.html'),
      clear: true
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),

    new HotModuleReplacementPlugin(),

  ],

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|webp|mp3)$/i,
        type: 'asset/resource',
      },

      {
        test: /\.css$/i,
        use: [
          env.prod ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
    ]
  },

  optimization: {
    minimizer: [
      '...',
      new CssMinimizerPlugin(),
    ],
  },

})
