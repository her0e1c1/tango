const path = require('path');
const webpack = require('webpack');

// it seems like -p doesn't set NODE_ENV
// https://github.com/webpack/webpack/issues/7074
console.log('NODE_ENV: ', process.env.NODE_ENV);

module.exports = {
  entry: {
    index: './src/web/index.tsx',
    view: './src/web/index.view.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].js'
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
    disableHostCheck: true,
    historyApiFallback: true,
    host: 'localhost',
    port: '8090',
    open: true,
    hot: false,
  },
  module: {
    rules: [{
        test: /\.tsx?$/,
        use: [{
          loader: 'awesome-typescript-loader',
          options: {
            silent: true,
            transpileOnly: true
          }
        }],
      },
      {
        test: /\.css$/,
        include: [
          /node_modules/,
          path.resolve(__dirname, '/src')
        ],
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(ttf|woff2?)$/,
        use: [
          'file-loader'
        ]
      },
      {
        // can not write in .babelrc because of expo
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ["import", { "libraryName": "antd", "libraryDirectory": "lib"}, "ant"],
            ]
          }
        }
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      src: path.resolve('./src'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),
  ],
};
