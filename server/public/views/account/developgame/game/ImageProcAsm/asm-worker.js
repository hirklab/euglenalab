var Module = {};
importScripts('opencv_js.js', 'worker-new.js');
postMessage({msg: 'asm'});