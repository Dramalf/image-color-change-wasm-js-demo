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
use hsl::HSL;
use num_complex::Complex64;
use rand::Rng;
use rayon::prelude::*;
use wasm_bindgen::{prelude::*, Clamped};

#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

type RGBA = [u8; 4];

struct Generator {
    width: u32,
    height: u32,
    palette: Box<[RGBA]>,
}

impl Generator {
    fn new(width: u32, height: u32, max_iterations: u32) -> Self {
        let mut rng = rand::thread_rng();

        Self {
            width,
            height,
            palette: (0..max_iterations)
                .map(move |_| {
                    let (r, g, b) = HSL {
                        h: rng.gen_range(0.0..360.0),
                        s: 0.5,
                        l: 0.6,
                    }
                    .to_rgb();
                    [r, g, b, 255]
                })
                .collect(),
        }
    }

    #[allow(clippy::many_single_char_names)]
    fn get_color(&self, x: u32, y: u32) -> &RGBA {
        let c = Complex64::new(
            (f64::from(x) - f64::from(self.width) / 2.0) * 4.0 / f64::from(self.width),
            (f64::from(y) - f64::from(self.height) / 2.0) * 4.0 / f64::from(self.height),
        );
        let mut z = Complex64::new(0.0, 0.0);
        let mut i = 0;
        while z.norm_sqr() < 4.0 {
            if i == self.palette.len() {
                return &self.palette[0];
            }
            z = z.powi(2) + c;
            i += 1;
        }
        &self.palette[i]
    }

    fn iter_row_bytes(&self, y: u32) -> impl '_ + Iterator<Item = u8> {
        (0..self.width)
            .flat_map(move |x| self.get_color(x, y))
            .copied()
    }

    fn iter_bytes(&self) -> impl '_ + ParallelIterator<Item = u8> {
        (0..self.height)
            // Note: when built without atomics, into_par_iter() will
            // automatically fall back to single-threaded mode.
            .into_par_iter()
            .flat_map_iter(move |y| self.iter_row_bytes(y))
    }
}

#[wasm_bindgen]
pub fn generate(width: u32, height: u32, max_iterations: u32) -> Clamped<Vec<u8>> {
    Clamped(
        Generator::new(width, height, max_iterations)
            .iter_bytes()
            .collect(),
    )
}
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
    pub static ref GlobalBufferStorage: Mutex<BufferStorage> = {
        let buffer_storage = BufferStorage::new();
        Mutex::new(buffer_storage)
    };
}

// #[wasm_bindgen]
// pub fn set_wasm_panic_hook() {
//     // can be continued
//     set_panic_hook();
// }

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
    let global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get(&key) {
        return buffer.as_ptr();
    } else {
        return Vec::new().as_ptr();
    }
}

#[wasm_bindgen]
pub fn print_buffer(key: String) {
    let global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get(&key) {
        log!("[render-wasm]print buffer: {:?}", buffer);
    }
}

#[wasm_bindgen]
pub fn remove_buffer(key: String) {
    let mut global_buffer_storage = GlobalBufferStorage.lock().unwrap();
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
pub fn harmonize_rayon(key:String, ch: f32, cs: f32) {
    let mut global_buffer_storage = GlobalBufferStorage.lock().unwrap();
    if let Some(buffer) = global_buffer_storage.buffer_map.get_mut(&key) {
    buffer.par_chunks_mut(4).for_each(|chunk|{
        let (r, g, b) = (chunk[0] as f32 / 255.0, chunk[1] as f32 / 255.0, chunk[2] as f32 / 255.0);
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
        chunk[0] = new_r;
        chunk[1] = new_g;
        chunk[2] = new_b;
    })
    } else {
        return ();
    }
}
