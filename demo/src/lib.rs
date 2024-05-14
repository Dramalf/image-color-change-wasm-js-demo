/*
 * Copyright 2022 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use std::collections::HashMap;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;
use rayon::prelude::*;
#[macro_use]
extern crate lazy_static;

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
    pub static ref GLOBAL_BUFFER_STORAGE: Mutex<BufferStorage> = {
        let buffer_storage = BufferStorage::new();
        Mutex::new(buffer_storage)
    };
}
#[wasm_bindgen]
pub fn new_buffer(key: String, len: usize) -> *const u8 {
    log!("new_buffer, key: {:?}, len: {:?}", key, len);
    let mut global_buffer_storage = GLOBAL_BUFFER_STORAGE.lock().unwrap();
    let buffer = vec![0; len];
    let ptr = buffer.as_ptr();
    global_buffer_storage.buffer_map.insert(key, buffer);
    ptr
}

#[wasm_bindgen]
pub fn get_buffer(key: String) -> *const u8 {
    let global_buffer_storage = GLOBAL_BUFFER_STORAGE.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get(&key) {
        return buffer.as_ptr();
    } else {
        return Vec::new().as_ptr();
    }
}

#[wasm_bindgen]
pub fn print_buffer(key: String) {
    let global_buffer_storage = GLOBAL_BUFFER_STORAGE.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get(&key) {
        log!("[render-wasm]print buffer: {:?}", buffer);
    }
}

#[wasm_bindgen]
pub fn remove_buffer(key: String) {
    let mut global_buffer_storage = GLOBAL_BUFFER_STORAGE.lock().unwrap();
    if let Some(_) = global_buffer_storage.buffer_map.remove(&key) {
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
    let (r, g, b): (f32, f32, f32);

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
pub fn harmonize_rayon(key: String, ch: f32, cs: f32) {
    let mut global_buffer_storage = GLOBAL_BUFFER_STORAGE.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get_mut(&key) {
        buffer.par_chunks_mut(4).for_each(|chunk| {
            let (r, g, b) = (
                chunk[0] as f32 / 255.0,
                chunk[1] as f32 / 255.0,
                chunk[2] as f32 / 255.0,
            );
            let max = r.max(g).max(b);
            let min = r.min(g).min(b);
            let l = (max + min) / 2.0;
            let s: f32 = if cs > 0.1 {
                cs
            } else if max == min {
                0.0
            } else if l > 0.5 {
                (max - min) / (2.0 - max - min)
            } else {
                (max - min) / (max + min)
            };
            // // 将HSL值转换回RGB
            let (new_r, new_g, new_b) = hsl_to_rgb(ch, s, l);

            // 更新图像数据
            chunk[0] = new_r;
            chunk[1] = new_g;
            chunk[2] = new_b;
        })
    } else {
        return ();
    }
}
