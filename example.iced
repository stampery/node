Stampery = require './index'
fs = require 'fs'

stampery = new Stampery '830fa1bf-bee7-4412-c1d3-31dddba2213d'

randomData = () ->
  Array(64+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, 64)

console.log 'Stamping JSON data...'

await stampery.stamp {example: randomData()}, defer err, hash
console.log 'Stamped', hash

await stampery.get hash, defer err, stamp
console.log 'Stamp', stamp

console.log 'Stamping a buffer...'

await stampery.stamp {name: 'Name to give to the buffer'}, new Buffer(randomData()), defer err, hash
console.log 'Stamped', hash

await stampery.get hash, defer err, stamp
console.log 'Stamp', stamp

console.log 'Stamping a file...'

await stampery.stamp {key: 'value'}, fs.createReadStream('README.md'), defer err, hash
console.log 'Stamped', hash

await stampery.get hash, defer err, stamp
console.log 'Stamp', stamp
