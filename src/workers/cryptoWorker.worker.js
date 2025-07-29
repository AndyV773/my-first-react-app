// cryptoWorker.worker.js
importScripts('../utils/cryptoUtils.js'); // or if using ES Modules, just import if supported

self.onmessage = function(e) {
  const { action, data } = e.data;

  let result;
  switch(action) {
    case 'shuffleFiles':
      result = shuffleFiles(data);
      break;
    case 'encryptData':
      result = encryptData(data);
      break;
    // add other functions here
  }

  self.postMessage(result);
};
