const path = require('path');
const webpack = require('webpack');

const projectRoot = process.cwd();

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  context: projectRoot,
  plugins: [new webpack.HotModuleReplacementPlugin()],
  entry: path.resolve(__dirname, './src/client/index.tsx'),
  output: {
    path: path.join(projectRoot, 'lib/server/public')
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        include: projectRoot,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                '@babel/preset-react',
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: ['> 5%']
                    }
                  }
                ],
                '@babel/preset-typescript'
              ],
              plugins: [
                ['@babel/plugin-proposal-class-properties', { loose: true }]
              ]
            }
          }
        ]
      }
    ]
  }
};
