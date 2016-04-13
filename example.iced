Stampery = require './index.iced'
fs = require 'fs'

#e8b000333a4bd74

stampery = new Stampery '830fa1bf-bee7-4412-c1d3-31dddba2213d'

console.log 'Stamping a file...'

stampery.stamp fs.createReadStream('README.md'), (err, hash) ->
  console.log 'Stamped', hash
