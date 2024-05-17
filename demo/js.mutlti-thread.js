const workerCount = navigator.hardwareConcurrency; // 你想要启动的 Workers 数量
/**@type {Worker[]} */
const workers = [];
let tDom = document.getElementById("js-m-t")

for (let i = 0; i < workerCount; i++) {
  const worker = new Worker('./jsWorker.js');
  workers.push(worker);
}

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("c3");
const img=new Image();
export  function  initJSMultiThread(url,ch,cs){
    img.onload=()=>{
        const w = img.width;
        const h = img.height;
        canvas.width = w
        canvas.height = h
        jsMultiThreadDraw(ch,cs);
    }
    img.src=url;
}

export function jsMultiThreadDraw(ch,cs){
    const ctx = canvas.getContext('2d');
    const w=canvas.width;
    const h=canvas.height;
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data; // ImageData 对象中的像素数组
    let st = performance.now();
    const segmentHeight = Math.ceil(canvas.height / workerCount);

    for (let i = 0; i < workers.length; i++) {
      const offset = i * segmentHeight * canvas.width * 4;
      const length = Math.min(segmentHeight * canvas.width * 4, pixels.length - offset);
      const segment = pixels.slice(offset, offset + length);

      workers[i].postMessage({
        imageData: segment,
        ch,cs,
        offset: offset
      }, [segment.buffer]);
    }
    let completed = 0;
    for (let i = 0; i < workers.length; i++) {
      workers[i].onmessage = function (event) {
        const { imageData, offset } = event.data;
        pixels.set(new Uint8ClampedArray(imageData), offset);
        completed++;
        // 所有 Workers 都完成后，更新 Canvas
        if (completed === workers.length) {
          ctx.putImageData(new ImageData(pixels, w, h), 0, 0);
          let et = performance.now();
          console.log('JS multi worker', Math.floor(et - st) + 'ms')
          tDom.innerHTML = Math.floor(et - st) + 'ms'
        }
      };
    }
}