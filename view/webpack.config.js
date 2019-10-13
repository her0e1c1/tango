const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: `${__dirname}/dist`,
  },
  devServer: {
    contentBase: `${__dirname}/public`,
    disableHostCheck: true,
    historyApiFallback: true,
    host: 'localhost',
    port: '8081',
    open: true,
    hot: true,
  },
  module: {
    rules: [{
        test: /\.tsx?$/,
        use: "ts-loader"
      }, {
        test: /\.css$/,
        use: [
          {loader: "style-loader", options:{ insert: "head" }},
          "css-loader"
        ],
      }, {
        test: /\.(ttf|woff2?)$/,
        use: "ignore-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"]
  },
  plugins: [
  new HtmlWebpackPlugin({
    inject: "body",
    template: "./public/index.html",
    inlineSource: '.js$'
  }),
  new HtmlWebpackInlineSourcePlugin()
  ],
};
