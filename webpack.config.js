const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const projectRoot = process.cwd();

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  context: projectRoot,
  plugins:
    process.env.NODE_ENV === 'production'
      ? []
      : [new webpack.HotModuleReplacementPlugin()],
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
                [
                  '@babel/preset-react',
                  {
                    useBuiltIns: true,
                    development: process.env.NODE_ENV !== 'production'
                  }
                ],
                [
                  '@babel/preset-env',
                  {
                    modules: false,
                    targets: {
                      browsers: ['> 2%', 'not dead']
                    }
                  }
                ],
                '@babel/preset-typescript'
              ],
              plugins: [
                ['@babel/plugin-proposal-class-properties', { loose: true }],
                'babel-plugin-styled-components'
              ]
            }
          }
        ]
      }
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            warnings: false,
            comparisons: false,
            inline: 2
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        },
        parallel: true,
        cache: true,
        sourceMap: true
      })
    ]
  }
};
