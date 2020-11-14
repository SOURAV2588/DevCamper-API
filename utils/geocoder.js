const NodeGeocoder = require('node-geocoder');
const options = {
  provider : 'mapquest',
  httpAdapter : 'https',
  apiKey : 'uRFl8ajh8JGQ1k370HYoBRspAHAUzPwL',
  formatter : null,
}

const geocoder = NodeGeocoder(options);

module.exports = geocoder;