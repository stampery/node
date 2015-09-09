Stampery
=======

[![NPM Package](https://img.shields.io/npm/v/stampery.svg?style=flat-square)](https://www.npmjs.org/package/stampery)

Notarize all your data using the blockchain. Generate immutable and valid globally proofs of existence, integrity and ownership of any piece of data.

## Get Started

```
npm install stampery
```

Using it in Node:

```javascript
var Stampery = require('stampery')

var stampery = new Stampery('55b6a36e87d90b030074d308', 'beta')

stampery.stamp('example0.txt', new Buffer('hey there'), function(err, fileHash) { })
stampery.get(hash, function(err, stamp) { })
stampery.proof(hash, function(err, proof) { })
```

## Examples


## License

Code released under [the MIT license](https://github.com/stampery/js/blob/master/LICENSE).

Copyright 2015 Stampery
