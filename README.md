
Stampery
=======

[![NPM Package](https://img.shields.io/npm/v/stampery.svg?style=flat-square)](https://www.npmjs.org/package/stampery)



# Use

```javascript
Stampery = require 'stampery'

stampery = new Stampery 'yourSecretToken'

stampery.on 'proof', (hash, proof) ->
  console.log 'Received proof for ' + hash

stampery.on 'ready', () ->
  stampery.receiveMissedProofs()
  await stampery.stamp 'yourHash'
```

# Intro

Stampery replaces **human trust** with **mathematical truth**. To do this, we create **immutable proofs of existence, integrity and attribution** of any data set, using the **Ethereum & Bitcoin blockchains**.
These proofs are:

- Automatically generated
- Impossible to modify, damage or destroy, because they’re embedded in the blockchain
- Valid globally, forever, even if we disappear

To see a quick example of how a proof looks like, here’s one:

[5,"0989551C2CCE109F40BE2C8AD711E23A539445C93547DFC13D25F9E8147886B8D0E71A16FF4DED1CB4BC6AC2E4BBB5722F0996B24F79FC849531FE70BB2DE800",[],[2,"0x5dfd1a08ed51f234be3f7ef13a238e166ec8330895fdc940226cc39866da1a28"]]

**A proof is all you need to verify that a data set has been stamped** at a given point in time.

# Hashing

We are privacy lovers and we don’t go into the content of what’s being stamped. So **our API only takes hashes**. That way, we get out of the data format: no matter if you use JSON, XML or MsgPack, hash it with SHA3–512 and you can use our API.

# Stamping process

Once your hash hits our API, we do our magic, embed your hash into a cryptographic tree, settle that tree with the Ethereum blockchain, then in the Bitcoin blockchain, and finally give you the proof back.
**The Bitcoin blockchain is the most secure one** in terms of reversibility, and that’s great for strong, trustless timestamping, but it takes around ~10mins for a set of transactions to settle.
So we also use the Ethereum blockchain, which is less secure in terms of reversibility (it has less computing power committed to it), but way faster (only 12 seconds to settle), so you can have a **first proof in just seconds**.
Wrapping up: you call our API with your hash, we do our magic and give you the proof back. The first proof is the Ethereum one, the second is Bitcoin’s. Ethereum’s proof is a subset of Bitcoin’s, so in the end, the final proof = 1st proof + 2nd proof.

# TCP + MsgPack + RPC

For the API calls, we use TCP as the transport layer, MsgPack for the encoding of the messages, and RPC as the communication protocol. There are multiple implementations for this, so probably you don’t have to do the work of implementing this yourself. [Check some of them](https://github.com/msgpack-rpc/msgpack-rpc#implementations).

# AMQP

**We use queues as a reliable way of giving your proofs back**. We give you a AMQP server to connect to.
After calling the API with your hash, You will have to **consume**** a queue which name is the hash** you sent: both the Ethereum and Bitcoin proofs will be sent there.

# Implementation details
1. Connect to the API endpoint over TCP and connect to our AMQP server
2. Call the “auth” RPC method, with your “clientId” and your “clientSecret” as the params
3. After you’re authed, just call “stamp” with your hash as a param
4. Then, subscribe to the queue “{yourhash}-clnt”
5. When the final proofs are delivered, that’s it!

# Official implementations
- [NodeJS](https://github.com/stampery/node)

# Verifying a proof
In order to verify a hash has been timestamped, you need both the hash and its proof.
The process is the following:

1. Get the hash, and sum it to the first sibling. While summing, sort them so the first is the lower value and the second the bigger. Hash that sum, and repeat the process with the next siblings. You should get the root
2. With the root, go to the corresponding Ethereum/Bitcoin transaction. The hash in their data field should contain the root you obtained
# Feedback

Ping us at support@stampery.com and we’ll help you! 😃
