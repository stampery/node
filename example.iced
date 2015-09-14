Stampery = require './index'

stampery = new Stampery '55b6a36e87d90b030074d308', 'beta'

randomData = () -> new Buffer Math.random() * 1000, 'binary'

await stampery.stamp 'example0.txt', randomData(), {key: 'value'}, defer err, fileHash
console.log 'Stamped and saved an encrypted back up', fileHash

hash = stampery.hash randomData() # Our *hash* method, just for convience
await stampery.stamp 'example1.txt', hash, {key: 'value'}, defer err, fileHash
console.log 'Stamped without even sending the file to the server', fileHash

await stampery.get hash, defer err, stamp
console.log 'Stamp info', stamp

await stampery.proof hash, defer err, proof
console.log 'Proof', proof
