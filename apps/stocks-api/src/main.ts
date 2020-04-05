/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 **/
import { Server } from 'hapi';
const wreck = require('@hapi/wreck');
const crypto = require('crypto');

const init = async () => {
  const server = new Server({
    port: 3333,
    host: 'localhost'
  });

  const getStockQuotes = async (request, h) => {
    console.log('request', request.url, request.symbol);
    const { url, symbol, period, token } = request;
    const { response, payload } = await wreck.get(`${url}/beta/stock/${symbol}/chart/${period}?token=${token}`);
    console.log('response', response, payload);
    // get sha1 hash of stringified response payload to use as Etag
    const hash = crypto.createHash('sha1');
    hash.update(JSON.stringify(payload));
    const etag = hash.digest('base64');
    // setting etag to response
    return h.response(payload).etag(etag);
  };

  server.route({
    method: 'GET',
    path: '/beta/stock/{symbol}/chart/{period}',
    handler: async (request, h) => {
      return await getStockQuotes(request, h);
    },
    options: {
      cache: {
        privacy: 'private',
        expiresIn: 10 * 100000
      }
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

init();
