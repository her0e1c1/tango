const path = require('path');

const paths = {
  assets: path.resolve(__dirname, 'assets'),
  src: path.resolve(__dirname, 'src'),
};

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ["./src/"],
          alias: {src: "./src"}
        },
      ],
    ],
  };
};
