(()=>{"use strict";var e={176:(e,n,t)=>{let r,o;const i=new Array(128).fill(void 0);function s(e){return i[e]}i.push(void 0,null,!0,!1);let a=i.length;function c(e){const n=s(e);return function(e){e<132||(i[e]=a,a=e)}(e),n}function u(e){a===i.length&&i.push(i.length+1);const n=a;return a=i[n],i[n]=e,n}const _="undefined"!=typeof TextDecoder?new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0}):{decode:()=>{throw Error("TextDecoder not available")}};"undefined"!=typeof TextDecoder&&_.decode();let b=null;function f(e,n){return e>>>=0,_.decode((null!==b&&b.buffer===o.memory.buffer||(b=new Uint8Array(o.memory.buffer)),b).slice(e,e+n))}function w(e,n){try{return e.apply(this,n)}catch(e){o.__wbindgen_exn_store(u(e))}}"undefined"!=typeof TextEncoder&&new TextEncoder("utf-8");const l="undefined"==typeof FinalizationRegistry?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry((e=>o.__wbg_wbg_rayon_poolbuilder_free(e>>>0)));class g{static __wrap(e){e>>>=0;const n=Object.create(g.prototype);return n.__wbg_ptr=e,l.register(n,n.__wbg_ptr,n),n}__destroy_into_raw(){const e=this.__wbg_ptr;return this.__wbg_ptr=0,l.unregister(this),e}free(){const e=this.__destroy_into_raw();o.__wbg_wbg_rayon_poolbuilder_free(e)}numThreads(){return o.wbg_rayon_poolbuilder_numThreads(this.__wbg_ptr)>>>0}receiver(){return o.wbg_rayon_poolbuilder_receiver(this.__wbg_ptr)>>>0}build(){o.wbg_rayon_poolbuilder_build(this.__wbg_ptr)}}async function d(e,n){if(void 0!==o)return o;void 0===e&&(e=new URL(t(122),t.b));const i=function(){const e={wbg:{}};return e.wbg.__wbindgen_object_drop_ref=function(e){c(e)},e.wbg.__wbg_log_6252bdb27cc05d14=function(e,n){console.log(f(e,n))},e.wbg.__wbg_instanceof_Window_9029196b662bc42a=function(e){let n;try{n=s(e)instanceof Window}catch(e){n=!1}return n},e.wbg.__wbg_newnoargs_e258087cd0daa0ea=function(e,n){return u(new Function(f(e,n)))},e.wbg.__wbg_call_27c0f87801dedf93=function(){return w((function(e,n){return u(s(e).call(s(n)))}),arguments)},e.wbg.__wbindgen_object_clone_ref=function(e){return u(s(e))},e.wbg.__wbg_self_ce0dbfc45cf2f5be=function(){return w((function(){return u(self.self)}),arguments)},e.wbg.__wbg_window_c6fb939a7f436783=function(){return w((function(){return u(window.window)}),arguments)},e.wbg.__wbg_globalThis_d1e6af4856ba331b=function(){return w((function(){return u(globalThis.globalThis)}),arguments)},e.wbg.__wbg_global_207b558942527489=function(){return w((function(){return u(t.g.global)}),arguments)},e.wbg.__wbindgen_is_undefined=function(e){return void 0===s(e)},e.wbg.__wbindgen_throw=function(e,n){throw new Error(f(e,n))},e.wbg.__wbindgen_module=function(){return u(d.__wbindgen_wasm_module)},e.wbg.__wbindgen_memory=function(){return u(o.memory)},e.wbg.__wbg_startWorkers_ef62f5fe9bf52484=function(e,n,o){return u(async function(e,n,o){if(0===o.numThreads())throw new Error("num_threads must be > 0.");const i={module:e,memory:n,receiver:o.receiver()};r=await Promise.all(Array.from({length:o.numThreads()},(async()=>{const e=new Worker(new URL(t.p+t.u(176),t.b),{type:void 0});return e.postMessage(i),await new Promise((n=>e.addEventListener("message",n,{once:!0}))),e}))),o.build()}(c(e),c(n),g.__wrap(o)))},e}();("string"==typeof e||"function"==typeof Request&&e instanceof Request||"function"==typeof URL&&e instanceof URL)&&(e=fetch(e)),function(e,n){e.wbg.memory=n||new WebAssembly.Memory({initial:18,maximum:16384,shared:!0})}(i,n);const{instance:a,module:_}=await async function(e,n){if("function"==typeof Response&&e instanceof Response){if("function"==typeof WebAssembly.instantiateStreaming)try{return await WebAssembly.instantiateStreaming(e,n)}catch(n){if("application/wasm"==e.headers.get("Content-Type"))throw n;console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",n)}const t=await e.arrayBuffer();return await WebAssembly.instantiate(t,n)}{const t=await WebAssembly.instantiate(e,n);return t instanceof WebAssembly.Instance?{instance:t,module:e}:t}}(await e,i);return function(e,n){return o=e.exports,d.__wbindgen_wasm_module=n,b=null,o.__wbindgen_start(),o}(a,_)}const p=d;onmessage=async({data:{module:e,memory:n,receiver:t}})=>{await p(e,n),postMessage(!0),function(e){o.wbg_rayon_start_worker(e)}(t)}},122:(e,n,t)=>{e.exports=t.p+"d2f5fa76bfbd2e576653.wasm"}},n={};function t(r){var o=n[r];if(void 0!==o)return o.exports;var i=n[r]={exports:{}};return e[r](i,i.exports,t),i.exports}t.m=e,t.u=e=>e+".index.js",t.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),t.o=(e,n)=>Object.prototype.hasOwnProperty.call(e,n),(()=>{var e;t.g.importScripts&&(e=t.g.location+"");var n=t.g.document;if(!e&&n&&(n.currentScript&&(e=n.currentScript.src),!e)){var r=n.getElementsByTagName("script");if(r.length)for(var o=r.length-1;o>-1&&(!e||!/^http(s?):/.test(e));)e=r[o--].src}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),t.p=e})(),t.b=self.location+"",t(176)})();