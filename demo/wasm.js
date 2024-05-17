import { threads } from 'wasm-feature-detect';
let new_buffer, harmonize_rayon, memory;
let module;
let img = new Image();
let tDom = document.getElementById("wasm-t")
let ptr = null;
let wasmData = null;
export async function initWasmTask(url, ch, cs) {
  let SUPPORT_THREADS = await threads();
  if (SUPPORT_THREADS) {
    module = await import('./pkg-parallel/wasm_bindgen_rayon_demo.js');
    let { memory: mem } = await module.default();
    console.log(navigator.hardwareConcurrency, 'navigator.hardwareConcurrency')
    await module.initThreadPool(navigator.hardwareConcurrency);
    new_buffer = module.new_buffer;
    harmonize_rayon = module.harmonize_rayon
    memory = mem;
  } else {
    module = await import('./pkg/wasm_bindgen_rayon_demo.js');
    let { memory: mem } = await module.default();
    new_buffer = module.new_buffer;
    harmonize_rayon = module.harmonize_rayon;
    memory = mem;
  }
  let tip = document.getElementById('wasm-title');
  tip.innerText = SUPPORT_THREADS ? 'wasm multi-thread' : 'wasm single-thread';
  img.onload = () => {
    const { width, height } = img
    ptr = new_buffer('wasm', width * height * 4);
    wasmData = new Uint8ClampedArray(memory.buffer, ptr, width * height * 4);
    wasmDraw(ch, cs);
  };
  img.src = url;
}

export function wasmDraw(ch, cs) {
  const canvas = document.getElementById("c1");
  const w = img.width;
  const h = img.height;
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  let st = performance.now();
  const imageData = ctx.getImageData(0, 0, w, h);
  wasmData.set(imageData.data)
  harmonize_rayon('wasm', ch, cs);
  ctx.putImageData(new ImageData(wasmData.slice(), w, h), 0, 0)
  let et = performance.now();
  console.log('wasm', Math.floor(et - st) + 'ms')
  tDom.innerHTML = Math.floor(et - st) + 'ms'
}