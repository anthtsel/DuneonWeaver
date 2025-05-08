const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrdungeonweaver = onRequest({"region":"us-central1","name":"dungeonweaver"}, (req, res) => server.then(it => it.handle(req, res)));
  