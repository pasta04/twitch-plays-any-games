const path = require('path');
const nodeExternals = require('webpack-node-externals');

const main = {
  mode: 'development',
  target: 'electron-main',
  entry: path.join(__dirname, 'src/main', 'main'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /.ts?$/,
        include: [path.resolve(__dirname, 'src')],
        exclude: [path.resolve(__dirname, 'node_modules')],
        loader: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  devtool: 'source-map',
  externals: [nodeExternals()],
};

const renderer = {
  mode: 'development',
  target: 'electron-renderer',
  entry: {
    index: './src/renderer/renderer/index',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist', 'scripts'),
  },
  resolve: {
    extensions: ['.ejs', '.json', '.js', '.jsx', '.css', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts)$/,
        use: ['ts-loader'],
        include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
      },
    ],
  },
  devtool: 'source-map',
};

module.exports = [main, renderer];
