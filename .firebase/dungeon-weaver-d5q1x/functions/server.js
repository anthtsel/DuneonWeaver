const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrdungeonweaverd5q1x = onRequest({"region":"us-central1","name":"dungeonweaver"}, (req, res) => server.then(it => it.handle(req, res)));
  