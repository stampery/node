Stampery = require './index'

stampery = new Stampery '830fa1bf-bee7-4412-c1d3-31dddba2213d'

randomData = () ->
  Array(64+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, 64)

await stampery.stamp {example: randomData()}, defer err, hash
console.log 'Stamped', hash

await stampery.get hash, defer err, stamp
console.log 'Stamp', stamp
