crypto = require 'crypto'
stream = require 'stream'
SHA3 = require 'sha3'
RockSolidSocket = require 'rocksolidsocket'
MsgpackRPC = require 'msgpackrpc'
amqp = require 'amqplib/callback_api'
msgpack = require 'msgpack'

class Stampery

  constructor : (@clientSecret, @beta) ->
    @clientId = @_hash('md5', @clientSecret).substring 0, 15

    if @beta
      host = 'api-beta-0.us-east.aws.stampery.com:4000'
    else
      host = 'api-0.us-east.aws.stampery.com:4000'

    sock = new RockSolidSocket host
    @rpc = new MsgpackRPC 'stampery.3', sock
    @_auth()
    @_connectRabbit()

  _connectRabbit : () =>
    await amqp.connect 'amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', defer err, @rabbit
    return console.log "[QUEUE] Error connecting #{err}" if err
    @rabbit.on 'error', @_connectRabbit

  _hash : (algo, data) -> crypto.createHash(algo).update(data).digest 'hex'

  hash : (data, cb) ->
    if data instanceof stream
      @_hashFile data, cb
    else
      sha3 = new (SHA3.SHA3Hash)()
      sha3.update data
      cb sha3.digest 'hex'

  _sha3Hash: (stringToHash, cb) ->
    hash = new (SHA3.SHA3Hash)()
    hash.update stringToHash
    cb hash.digest 'hex'

  _hashFile : (fd, cb) ->
    hash = new (SHA3.SHA3Hash)()

    fd.on 'end', () ->
      cb hash.digest 'hex'

    fd.on 'data', (data) ->
      hash.update data

  _auth : () ->
    await @rpc.invoke 'auth', [@clientId, @clientSecret], defer err, res
    console.log "[RPC] Auth: ", err, res
    return console.log "[RPC] Auth error: #{err}" if err

  retrieveProofForHash : (hash, cb) ->
    await @rabbit.createChannel defer err, @channel
    console.log "[QUEUE] Bound to #{hash}-clnt", err
    await @channel.assertQueue "#{hash}-clnt", {durable: true}, defer err, ok if @channel
    @channel.consume "#{hash}-clnt", (msg) ->
      delete @hashCache[@hashCache.indexOf(hash)]
      console.log "[QUEUE] Received -> %s", msg.content.toString()
      @channel.ack msg
      return cb null, msg

  calculateProof: (hash, siblings, cb) ->
    lastComputedLeave = hash
    for idx of siblings
      sibling = siblings[idx]
      console.log "[SIBLINGS] Calculating sibling #{idx}", lastComputedLeave, sibling
      @_sumSiblings lastComputedLeave, sibling, (sum) ->
        console.log "[SIBLINGS] Calculated #{sum}"
        lastComputedLeave = sum
    
    cb lastComputedLeave

  _sumSiblings: (leave1, leave2, cb) ->
    if parseInt(leave1, 16) > parseInt(leave2, 16)
      console.log "[SIBLINGS] Leave1 is bigger than Leave2"
      await @_sha3Hash "#{leave1}#{leave2}", defer hash
      cb hash
    else
      console.log "[SIBLINGS] Leave2 is bigger than Leave1"
      await @_sha3Hash "#{leave2}#{leave1}", defer hash
      cb hash

  stamp : (hash, cb) ->
    hash = hash.toUpperCase()
    return setTimeout @stamp.bind(this, hash, cb), 500 if not @rabbit
    await @rpc.invoke 'stamp', [hash], defer err, res
    if err
      console.log "[RPC] Error: #{err}"
      return cb err, null

    if @rabbit
      await @rabbit.createChannel defer err, @channel
      console.log "[QUEUE] Bound to #{hash}-clnt", err
      @channel.consume "#{hash}-clnt", (queueMsg) =>
        @channel.ack queueMsg
        unpackedMsg = msgpack.unpack queueMsg.content
        console.log ((unpackedMsg[3][0] is 1) or (unpackedMsg[3][0] is -1)), ((unpackedMsg[3][0] is 2) or (unpackedMsg[3][0] is -2))
        if (unpackedMsg[3][0] is 1) or (unpackedMsg[3][0] is -1)
          console.log '[QUEUE-BTC] Detected data: ', queueMsg.content.toString()
          console.log "[QUEUE-BTC] Received -> %s", unpackedMsg[1]
          cb null, unpackedMsg
        else if (unpackedMsg[3][0] is 2) or (unpackedMsg[3][0] is -2)
          console.log "[QUEUE-ETH] Received ETH -> %s", unpackedMsg[1]
          console.log "[QUEUE-BTC] Bound to #{unpackedMsg[1]}-clnt"
          if "#{unpackedMsg[1]}-clnt" isnt "#{hash}-clnt"
            @channel.consume "#{unpackedMsg[1]}-clnt", (btcMsg) -> 
              console.log '[QUEUE-BTC] Detected data: ', btcMsg.content.toString()
              unpackedBtcMsg = msgpack.unpack btcMsg.content
              console.log "[QUEUE-BTC] Received -> %s", unpackedBtcMsg
              cb null, unpackedBtcMsg
          cb null, unpackedMsg
        else
          console.log 'wtf nigga', unpackedMsg
    else
      cb "Error binding to #{hash}-clnt", null

module.exports = Stampery
