const fs = require('fs');
const http = require('http');
const path = require('path');

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function run() {
  console.log('============================================================');
  console.log('🧪 VERIFYING CULINARY AUDIO & FRONTEND PERFORMANCE');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details}`);
    }
  }

  const root = 'D:/FoodWala_Eclipse_Project';

  // 1. Audio Files on Disk
  const pizzaAudio = path.join(root, 'audio/pizza-sound.wav');
  const wokAudio = path.join(root, 'audio/wok-sound.wav');
  const burgerAudio = path.join(root, 'audio/burger-sound.wav');

  assert('Pizza audio exists on disk', fs.existsSync(pizzaAudio) && fs.statSync(pizzaAudio).size > 1000000);
  assert('Wok audio exists on disk', fs.existsSync(wokAudio) && fs.statSync(wokAudio).size > 1000000);
  assert('Burger audio exists on disk', fs.existsSync(burgerAudio) && fs.statSync(burgerAudio).size > 1000000);

  // 2. Audio durations match video lengths
  const pizzaSize = fs.statSync(pizzaAudio).size;
  const wokSize = fs.statSync(wokAudio).size;
  const burgerSize = fs.statSync(burgerAudio).size;
  // 44100 Hz * 2 channels * 2 bytes/sample = 176400 bytes/sec
  const pizzaDur = ((pizzaSize - 44) / 176400).toFixed(2);
  const wokDur = ((wokSize - 44) / 176400).toFixed(2);
  const burgerDur = ((burgerSize - 44) / 176400).toFixed(2);

  assert(`Pizza sound duration matches video (22.09s, actual: ${pizzaDur}s)`, pizzaDur === '22.09');
  assert(`Wok sound duration matches video (25.41s, actual: ${wokDur}s)`, wokDur === '25.41');
  assert(`Burger sound duration matches video (10.01s, actual: ${burgerDur}s)`, burgerDur === '10.01');

  // 3. Audio engine script
  const audioScript = fs.readFileSync(path.join(root, 'js/culinary-audio.js'), 'utf8');
  assert('CulinaryAudioEngine defined', audioScript.includes('class CulinaryAudioEngine'));
  assert('Audio mapping defined', audioScript.includes('AUDIO_MAP'));
  assert('Smooth volume fade implemented', audioScript.includes('fadeVolume'));
  assert('Video sync & drift compensation implemented', audioScript.includes('diff > 0.3'));
  assert('Page visibility auto-pause implemented', audioScript.includes('visibilitychange'));

  // 4. HTML Integration
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert('index.html loads culinary-audio.js', indexHtml.includes('src="./js/culinary-audio.js"'));
  assert('index.html has getOptimizedFoodImg helper', indexHtml.includes('getOptimizedFoodImg'));
  assert('index.html has decoding="async" on 3D SVGs', indexHtml.includes('3d-burger.svg" alt="3D Burger" width="125" height="125" decoding="async"'));
  assert('index.html delegates mute button to CulinaryAudio', indexHtml.includes('window.CulinaryAudio.toggleMute()'));
  assert('index.html updates scene on switcher click', indexHtml.includes('window.CulinaryAudio.updateSceneFromVideo()'));

  // 5. 3D Animations Optimization
  const animScript = fs.readFileSync(path.join(root, 'js/animations-3d.js'), 'utf8');
  assert('animations-3d.js has MutationObserver recursion filter', animScript.includes('fw-card-glare') && animScript.includes('_debounceTiltTimer'));
  assert('animations-3d.js has IntersectionObserver for hero', animScript.includes('isHeroVisible'));
  assert('animations-3d.js touch-screen optimization', animScript.includes('maxTouchPoints > 0'));

  // 6. CSS GPU Optimization
  const animCss = fs.readFileSync(path.join(root, 'css/animations-3d.css'), 'utf8');
  assert('CSS has GPU containment on 3D canvas', animCss.includes('contain: strict;'));
  assert('CSS has reduced blur to prevent GPU lag', animCss.includes('filter: blur(28px);'));
  assert('CSS has btn-sound-active pulse animation', animCss.includes('btn-sound-active') && animCss.includes('fwSoundPulse'));

  // 7. Live HTTP Server Checks
  const resPizza = await checkUrl('http://localhost:5000/audio/pizza-sound.wav');
  assert('HTTP 200 for pizza-sound.wav', resPizza.status === 200 && resPizza.headers['content-type'].includes('audio'));

  const resWok = await checkUrl('http://localhost:5000/audio/wok-sound.wav');
  assert('HTTP 200 for wok-sound.wav', resWok.status === 200 && resWok.headers['content-type'].includes('audio'));

  const resBurger = await checkUrl('http://localhost:5000/audio/burger-sound.wav');
  assert('HTTP 200 for burger-sound.wav', resBurger.status === 200 && resBurger.headers['content-type'].includes('audio'));

  const resJs = await checkUrl('http://localhost:5000/js/culinary-audio.js');
  assert('HTTP 200 for culinary-audio.js', resJs.status === 200 && resJs.headers['content-type'].includes('javascript'));

  const resIndex = await checkUrl('http://localhost:5000/index.html');
  assert('HTTP 200 for index.html', resIndex.status === 200);

  console.log('\n============================================================');
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('============================================================');

  if (passed !== total) process.exit(1);
}

run();
