const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js",
    publicPath: ""
  },
  mode: "development",
  plugins: [
    new CopyWebpackPlugin(['index.html'])
  ],
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: "url-loader",
            options: {
        // 默认情况下，文件加载器生成使用ES模块语法的JS模块
              esModule: false, // 这里设置为false
              outputPath: "images/", // 指定图片输入的文件夹
              publicPath: "/images", // 指定获取图片的路径
              // limit  (如果小于 8K ，则转为base64，否则返回一个url地址)
              limit: 8192,
              name: "[name].[hash:8].[ext]" // 输入的图片名
            }
          }
        ]
      }
    ]
  }
};
