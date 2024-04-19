mod utils;

use std::collections::HashMap;
use std::sync::Mutex;
use utils::set_panic_hook;
use wasm_bindgen::prelude::*;
use rayon::prelude::*;

#[macro_use]
extern crate lazy_static;

#[macro_use]
extern crate serde_derive;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

pub struct BufferStorage {
    pub buffer_map: HashMap<String, Vec<u8>>,
}

impl BufferStorage {
    fn new() -> Self {
        BufferStorage {
            buffer_map: HashMap::new(),
        }
    }
}

macro_rules! log {
  ($($t:tt)*) => (crate::log(&("[C]".to_string() + &format_args!($($t)*).to_string())))
}

lazy_static! {
    pub static ref GlobalBufferStorage: Mutex<BufferStorage> = {
        let buffer_storage = BufferStorage::new();
        Mutex::new(buffer_storage)
    };
}

#[wasm_bindgen]
pub fn set_wasm_panic_hook() {
    // can be continued
    set_panic_hook();
}

#[wasm_bindgen]
pub fn new_buffer(key: String, len: usize) -> *const u8 {
    log!("new_buffer, key: {:?}, len: {:?}", key, len);
    let mut global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    let mut buffer = vec![15; len];
    let ptr = buffer.as_ptr();
    global_buffer_storage.buffer_map.insert(key, buffer);
    ptr
}

#[wasm_bindgen]
pub fn get_buffer(key: String) -> *const u8 {
    let mut global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get(&key) {
        return buffer.as_ptr();
    } else {
        return Vec::new().as_ptr();
    }
}

#[wasm_bindgen]
pub fn print_buffer(key: String) {
    let mut global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get(&key) {
        log!("[render-wasm]print buffer: {:?}", buffer);
    }
}

#[wasm_bindgen]
pub fn remove_buffer(key: String) {
    let mut global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.remove(&key) {
        log!("remove buffer success");
    } else {
        log!("remove buffer error");
    }
}

fn hue2rgb(p: f32, q: f32, t: f32) -> f32 {
    let mut t = t;
    if t < 0.0 {
        t += 1.0;
    }
    if t > 1.0 {
        t -= 1.0;
    }
    if t < 0.166 {
        return p + (q - p) * 6.0 * t;
    }
    if t < 0.5 {
        return q;
    }
    if t < 0.66 {
        return p + (q - p) * (4.0 - 6.0 * t);
    }
    p
}

fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (u8, u8, u8) {
    let (mut r, mut g, mut b): (f32, f32, f32);

    if s == 0.0 {
        r = l;
        g = l;
        b = l; // achromatic
    } else {
        let q = if l < 0.5 { l + l * s } else { l + s - l * s };
        let p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 0.33);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 0.33);
    }

    ((r * 255.0) as u8, (g * 255.0) as u8, (b * 255.0) as u8)
}

#[wasm_bindgen]
pub fn harmonize(key:String, ch: f32, cs: f32) {
    let mut global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get_mut(&key) {
    // Divide the buffer into four equal parts
    let chunk_size = (buffer.len() / 4) as usize;
    let chunks: Vec<&mut [u8]> = buffer.chunks_mut(chunk_size).collect();
    chunks.into_par_iter().for_each(|chunk| {
        for i in (0..chunk.len()).step_by(4) {
            let ( r, g, b)= ((chunk[i] as f32)/255.0, (chunk[i + 1] as f32)/255.0, (chunk[i + 2] as f32)/255.0);
                let max = r.max(g).max(b);
                let min = r.min(g).min(b);
                let l = (max + min) / 2.0;
                let s: f32 = if cs>0.1{
                    cs
                }
                else if max == min {
                    0.0
                } else if l > 0.5 {
                    (max - min) / (2.0 - max - min)
                } else {
                    (max - min) / (max + min)
                };
                // // 将HSL值转换回RGB
                let (new_r, new_g, new_b)= hsl_to_rgb(ch, s, l);
        
                // 更新图像数据
                chunk[i] = new_r;
                chunk[i + 1] = new_g;
                chunk[i + 2] = new_b;
        }
    });
    // for i in (0..buffer.len()).step_by(4) {
    //     // 将RGB值转换为HSL
    //     let ( r, g, b)= ((buffer[i] as f32)/255.0, (buffer[i + 1] as f32)/255.0, (buffer[i + 2] as f32)/255.0);
    //     let max = r.max(g).max(b);
    //     let min = r.min(g).min(b);
    //     let l = (max + min) / 2.0;
    //     let s: f32 = if cs>0.1{
    //         cs
    //     }
    //     else if max == min {
    //         0.0
    //     } else if l > 0.5 {
    //         (max - min) / (2.0 - max - min)
    //     } else {
    //         (max - min) / (max + min)
    //     };
    //     // // 将HSL值转换回RGB
    //     let (new_r, new_g, new_b)= hsl_to_rgb(ch, s, l);

    //     // 更新图像数据
    //     buffer[i] = new_r;
    //     buffer[i + 1] = new_g;
    //     buffer[i + 2] = new_b;
    // }
    } else {
        return ();
    }
}
