# Stampery

[![NPM Package](https://img.shields.io/npm/v/stampery.svg?style=flat-square)](https://www.npmjs.org/package/stampery)

NodeJS client library for [Stampery API](https://stampery.com/api), the blockchain-powered, industrial-scale certification platform.

Seamlessly integrate industrial-scale data certification into your own NodeJS apps. The Stampery API adds a layer of transparency, attribution, accountability and auditability to your applications by connecting them to Stampery's infinitely scalable [Blockchain Timestamping Architecture](https://stampery.com/tech).

## Installation

  1. Install `stampery` into your project and add it as a dependency in your `package.json`:

        npm install --save stampery

  2. Go to the [API dashboard](https://api-dashboard.stampery.com), sign up and create a token for your application. It will resemble this:

        2f6215c7-ad87-4d6e-bf9e-e9f07aa35f1a

## Usage

```javascript
Stampery = require('stampery');

stampery = new Stampery('yourSecretToken')

stampery.on('proof', function(hash, proof) {
  console.log("Received proof for " + hash, proof);
  stampery.prove(hash, proof, function (valid) {
    console.log('Proof validity:', valid);
  });
});

stampery.on('ready', function() {
  stampery.receiveMissedProofs();
  stampery.hash('The piano has been drinking', function(hash) {
    stampery.stamp(hash);
  });
});
```

Here is the same example, just using our beloved IcedCoffeeScript:

```coffeescript
Stampery = require 'stampery'

stampery = new Stampery 'yourSecretToken'

stampery.on 'proof', (hash, proof) ->
  console.log "Received proof for #{hash}", proof
  await stampery.prove hash, proof, defer valid
  console.log 'Proof validity:', valid

stampery.on 'ready', ->
  stampery.receiveMissedProofs()
  await stampery.hash 'The piano has been drinking', defer hash
  stampery.stamp hash
```

## Client libraries for other platforms
- [NodeJS](https://github.com/stampery/node)
- [PHP](https://github.com/stampery/php)
- [Ruby](https://github.com/stampery/ruby)
- [Python](https://github.com/stampery/python)
- [Java](https://github.com/stampery/java)
- [Go](https://github.com/stampery/go)

## Feedback

Ping us at [support@stampery.com](mailto:support@stampery.com) and we will more than happy to help you! 😃


## License

Code released under
[the MIT license](https://github.com/stampery/node/blob/master/LICENSE).

Copyright 2015-2016 Stampery, Inc.
