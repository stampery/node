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
var Stampery = require('stampery'),
    stampery = new Stampery('830fa1bf-bee7-4412-c1d3-31dddba2213d')

var data = { str: 'Create a proof of this using the blockchain' }

stampery.stamp(data, function(err, hash) { })
stampery.get(hash, function(err, stamp) { })
```

You can get your API key [signing up](https://stampery.co/signup) and going to [your account](https://stampery.co/account) -> Apps.

## License

Code released under [the MIT license](https://github.com/stampery/js/blob/master/LICENSE).

Copyright 2015 Stampery
