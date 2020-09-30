const path = require('path')
const webpack = require('webpack')
// const HtmlWebpackPlugin = require("html-webpack-plugin") // html模版
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin') // 压缩 css 并合并成 文件
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin') // 压缩css & 去除注释  
const { CleanWebpackPlugin } = require('clean-webpack-plugin') // 删除 旧的文件 
const safeParser = require('postcss-safe-parser') // 添加前缀的规则
const ESLintPlugin = require('eslint-webpack-plugin')

const HashAssetsPlugin = require('hash-assets-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = (env, argv) => {
  const { 
    mode,  // 通过 mode 判断 开发 和 生产
  } = argv

  const isDEV = mode === 'development'
  const outputPath = path.resolve(__dirname, 'dist')
  const PUBLIC_PATH = path.resolve(__dirname, '')

  return {
    devServer: {
      publicPath: PUBLIC_PATH,
      contentBase: false,
      port: 8080,
      historyApiFallback: {
        disableDotRule: true
      },
      hot: true,
      open: true,
      overlay: true
    },
    entry: {
      'app': './client/app.js'
    },
    output: {
      path: outputPath,
      filename: isDEV ? '[name].js' : 'js/[name].[contenthash].js',
      chunkFilename: isDEV ? '[name].js' : 'js/[name].[contenthash].js',
      publicPath: PUBLIC_PATH,
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          common: {
            test: /[\\/]node_modules[\\/] || src\//,
            chunks: 'all',
            name: 'common',
            minSize: 0,
            minChunks: 2,
            enforce: true,
          },
        },
      },
      minimizer: isDEV ? [] : [
        new TerserPlugin(),
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.css$/g,
          cssProcessorOptions: {
            parser: safeParser,
            discardComments: {
              removeAll: true,
            },
          },
        }),
      ],
    },
    resolve: {
      extensions: ['.js', '.vue', '.json', 'css'],
      alias: {
        '@pages': path.resolve('client/pages'),
        '@mixins': path.resolve('client/mixins'),
        '@components': path.resolve('client/components'),
        '@images': path.resolve('client/images')
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            postcss: [require('autoprefixer')()],
            loaders: {
              js: [
                'babel-loader?cacheDirectory'
              ],
              css: [
                isDEV ? 'style-loader' : MiniCssExtractPlugin.loader,
                'css-loader'
              ]
            }
          }
        },
        {
          test: /\.js$/,
          exclude: /node_module/,
          use: ['babel-loader?cacheDirectory']
        },
        {
          test: /\.css$/,
          use: [
            isDEV ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader', 
            { 
              loader: 'postcss-loader'
            }
          ], // 注意排列顺序，执行顺序与排列顺序相反
        },
        {
          test: /\.less$/,
          use: [
            isDEV ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            { 
              loader: 'postcss-loader'
            },
            'less-loader',
          ]
        }, 
        {
          test: /\.(jpg|jpeg|png|gif|svg)$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 1024 * 8, // 8k以下的base64内联，不产生图片文件
              fallback: 'file-loader', // 8k以上，用file-loader抽离（非必须，默认就是file-loader）
              name: '[name].[ext]?[hash]', // 文件名规则，默认是[hash].[ext]
              outputPath: 'images/', // 输出路径
              publicPath: ''  // 可访问到图片的引用路径(相对/绝对)
            }
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf)$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 1000,
              name: '[name].[ext]?[hash]',
              outputPath: 'fonts/',
              publicPath: ''
            }
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        '__DEV__': true,
        '__URL_ROOT__': `"${URL_ROOT}"`,
        'process.env.NODE_ENV': isDEV ? '"development"' : '"production"',
      }),
      new HtmlWebpackPlugin({
         template: './template/index.html',
      }),
      new VueLoaderPlugin(),
      new ESLintPlugin({
        extensions: ['js', 'vue']
      }),
      ...(isDEV ? 
        [
          new webpack.HotModuleReplacementPlugin(),
        ]
        : [
          new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [outputPath]
          }),
          new MiniCssExtractPlugin({
            filename: isDEV ? '[name].css' : 'css/[name].[contenthash].css',
            chunkFilename: isDEV ? '[name].css' : 'css/[name].[contenthash].css',
          }),
        ]
      ),
      new HashAssetsPlugin({
        path: outputPath,
        filename: 'assets.json',
        keyTemplate (filename) {
          if (process.env.NODE_ENV === 'production') {
            var match = /(js|css)\/([\w-]+)\.\w{20}\.\1/.exec(filename)

            return [match[2] + '.' + match[1], filename]
          } else {
            return [filename, filename]
          }
        },
        prettyPrint: true
      }),
    ]
  }
}
