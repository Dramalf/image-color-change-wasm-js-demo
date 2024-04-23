# Demo of wasm&js image-filter
  以前的一个学习demo，感觉写的并不好，把imageData作为buffer传递给wasm，简单的像素点rgb遍历去进行色彩变化。测出来wasm性能还不如js，不过打包成node-wasm测试比nodejs实现快一点

## [demo page](https://image-filter-wasm-js-demo.vercel.app/)
[![vercel](https://s0.wp.com/mshots/v1/https://image-filter-wasm-js-demo.vercel.app/?w=600&h=400)](https://image-filter-wasm-js-demo.vercel.app/)
## 🛠️ Build with `wasm-pack build`

```
wasm-pack build
```
## 🚀 Run Locally
```
npm i

npm run start
```
