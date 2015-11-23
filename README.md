Stampery
=======

[![NPM Package](https://img.shields.io/npm/v/stampery.svg?style=flat-square)](https://www.npmjs.org/package/stampery)

Notarize all your data using the blockchain. Generate immutable and valid globally proofs of existence, integrity and ownership of any piece of data.

## Get Started

```
npm install stampery
```

### Arbitrary object stamping

```javascript
var Stampery = require('stampery'),
    stampery = new Stampery('830fa1bf-bee7-4412-c1d3-31dddba2213d')

var data = { str: 'Create a proof of this using the blockchain' }

stampery.stamp(data, function(err, hash) { })
stampery.get(hash, function(err, stamp) { })
```
### Buffer/string stamping
```javascript
var Stampery = require('stampery'),
    stampery = new Stampery('830fa1bf-bee7-4412-c1d3-31dddba2213d')

var data = {}
var file = new Buffer('Create a proof of this using the blockchain')

stampery.stamp(data, file, 'Name or ID of the buffer', function(err, hash) { })
stampery.get(hash, function(err, stamp) { })
```
### File/stream stamping
```javascript
var Stampery = require('stampery'),
    stampery = new Stampery('830fa1bf-bee7-4412-c1d3-31dddba2213d')

var data = {}
var file = fs.createReadStream('document.txt')

stampery.stamp(data, file, function(err, hash) { })
stampery.get(hash, function(err, stamp) { })
```

You can get your API key [signing up](https://stampery.com/signup) and going to [your account](https://stampery.com/account) -> Apps.

## License

Code released under [the MIT license](https://github.com/stampery/js/blob/master/LICENSE).

Copyright 2015 Stampery
