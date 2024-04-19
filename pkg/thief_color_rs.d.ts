/* tslint:disable */
/* eslint-disable */
/**
*/
export function set_wasm_panic_hook(): void;
/**
* @param {string} key
* @param {number} len
* @returns {number}
*/
export function new_buffer(key: string, len: number): number;
/**
* @param {string} key
* @returns {number}
*/
export function get_buffer(key: string): number;
/**
* @param {string} key
*/
export function print_buffer(key: string): void;
/**
* @param {string} key
*/
export function remove_buffer(key: string): void;
/**
* @param {string} key
* @param {number} ch
* @param {number} cs
*/
export function harmonize(key: string, ch: number, cs: number): void;
