crypto = require 'crypto'
stream = require 'stream'
SHA3 = require 'sha3'
RockSolidSocket = require 'rocksolidsocket'
MsgpackRPC = require 'msgpackrpc'
amqp = require 'amqplib/callback_api'
msgpack = require 'msgpack'
domain = require 'domain'
util = require 'util'
EventEmitter = require('events').EventEmitter;

amqpDomain = domain.create()
amqpDomain.on 'error', (err) =>
  console.log('[QUEUE] Error with queue: ' + err)

class Stampery

  ethSiblings: {}
  authed: false

  convertSiblingArray: (siblings) ->
    if siblings == ''
      []
    else
      siblings.map (v, i) ->
        new Buffer(v).toString()

  constructor : (@clientSecret, @beta) ->
    @clientId = @_hash('md5', @clientSecret).substring 0, 15

    if @beta
      host = 'api-beta.stampery.com:4000'
    else
      host = 'api.stampery.com:4000'

    sock = new RockSolidSocket host
    @rpc = new MsgpackRPC 'stampery.3', sock
    @_connectRabbit()

  _connectRabbit : () =>
    if @beta
      await amqp.connect 'amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/beta', defer err, @rabbit
    else
      await amqp.connect 'amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', defer err, @rabbit
    return console.log "[QUEUE] Error connecting #{err}" if err
    console.log '[QUEUE] Connected to Rabbit!'
    @emit 'ready'
    amqpDomain.add @rabbit
    @rabbit.on 'error', (err) =>
      @emit 'error', err
      @_connectRabbit

  _hash : (algo, data) -> crypto.createHash(algo).update(data).digest 'hex'

  hash : (data, cb) ->
    if data instanceof stream
      @_hashFile data, cb
    else
      sha3 = new (SHA3.SHA3Hash)()
      sha3.update data
      cb sha3.digest('hex').toUpperCase()

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

  _auth : (cb) =>
    await @rpc.invoke 'auth', [@clientId, @clientSecret], defer err, res
    console.log "[RPC] Auth: ", err, res
    return @emit 'error', err if err
    cb true

  calculateProof: (hash, siblings, cb) ->
    lastComputedleaf = hash
    for idx of siblings
      sibling = siblings[idx]
      console.log "[SIBLINGS] Calculating sibling #{idx}", lastComputedleaf, sibling
      @_sumSiblings lastComputedleaf, sibling, (sum) ->
        console.log "[SIBLINGS] Calculated #{sum}"
        lastComputedleaf = sum

    cb lastComputedleaf

  _sumSiblings: (leaf1, leaf2, cb) ->
    if parseInt(leaf1, 16) > parseInt(leaf2, 16)
      console.log "[SIBLINGS] Leaf1 is bigger than Leaf2"
      await @_sha3Hash "#{leaf1}#{leaf2}", defer hash
      cb hash
    else
      console.log "[SIBLINGS] Leaf2 is bigger than Leaf1"
      await @_sha3Hash "#{leaf2}#{leaf1}", defer hash
      cb hash

  _handleQueueConsumingForHash: (queue) ->
    if @rabbit
      await @rabbit.createChannel defer err, @channel
      console.log "[QUEUE] Bound to #{queue}-clnt", err
      @channel.consume "#{queue}-clnt", (queueMsg) =>
        console.log "[QUEUE] Received data!"
        # Nucleus response spec
        # [v, [sib], root, [chain, txid]]
        unpackedMsg = msgpack.unpack queueMsg.content
        # The original hash is the routing_key
        hash = queueMsg.fields.routingKey
        if unpackedMsg[3][0] == 1 or unpackedMsg[3][0] == -1
          # Checking if the chain is Bitcoin
          console.log '[QUEUE] Received BTC proof for ' + hash
          unpackedMsg[1] = (@ethSiblings[hash] or []).concat(unpackedMsg[1] or [])
          # Checking if the chain is Bitcoin
        else if unpackedMsg[3][0] == 2 or unpackedMsg[3][0] == -2
          # Checking if the chain is Ethereum
          console.log '[QUEUE] Received ETH proof for ' + hash
          @ethSiblings[hash] = @convertSiblingArray(unpackedMsg[1])
          # Checking if the chain is Ethereum
        # ACKing the queue message
        @channel.ack queueMsg
        @emit 'proof', hash, unpackedMsg
    else
      @emit 'error', "Error binding to #{hash}-clnt"

  stamp : (hash) ->
    console.log "Stamping #{hash}"
    unless @authed
      await @_auth defer @authed
    hash = hash.toUpperCase()
    console.log "Let's stamp #{hash}"
    return setTimeout @stamp.bind(this, hash), 500 if not @rabbit
    await @rpc.invoke 'stamp', [hash], defer err, res
    console.log 'RES', err, res
    return @emit 'error', 'Not authenticated' if !@authed
    console.log "[API] Received response: ", res
    if err
      console.log "[RPC] Error: #{err}"
      @emit 'error', err

  receiveMissedProofs: () =>
    @_handleQueueConsumingForHash @clientId

util.inherits Stampery, EventEmitter


module.exports = Stampery
