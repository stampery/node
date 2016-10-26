crypto = require 'crypto'
stream = require 'stream'
SHA3 = require 'sha3'
RockSolidSocket = require 'rocksolidsocket'
MsgpackRPC = require 'msgpackrpc'
amqp = require 'amqplib/callback_api'
msgpack = require 'msgpack'
domain = require 'domain'
util = require 'util'
request = require 'request'
EventEmitter = require('events').EventEmitter

amqpDomain = domain.create()
amqpDomain.on 'error', (err) =>
  console.log('[QUEUE] Error with queue: ' + err)

class Stampery

  ethSiblings: {}
  authed: false

  constructor : (@clientSecret, @beta) ->
    @clientId = crypto
      .createHash('md5')
      .update(@clientSecret)
      .digest('hex')
      .substring(0, 15)

    if @beta
      host = 'api-beta.stampery.com:4000'
    else
      host = 'api.stampery.com:4000'

    sock = new RockSolidSocket host
    @rpc = new MsgpackRPC 'stampery.3', sock
    @_connectRabbit()

  _convertSiblingArray : (siblings) =>
    if siblings is ''
      []
    else
      siblings.map (v, i) ->
        v.toString()

  _recursiveConvert : (proof) =>
    proof.map (e) =>
      if e instanceof Buffer
        e = e.toString 'utf8'
      else if e instanceof Array
        e = @_recursiveConvert e
      e

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

  _sha3Hash: (stringToHash, cb) ->
    hash = new (SHA3.SHA3Hash)()
    console.log 'Hashing', stringToHash
    hash.update stringToHash
    cb hash.digest('hex').toUpperCase()

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

  _handleQueueConsumingForHash: (queue) =>
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
        if unpackedMsg[3][0] is 1 or unpackedMsg[3][0] is -1
          # Checking if the chain is Bitcoin
          console.log '[QUEUE] Received BTC proof for ' + hash
          unpackedMsg[1] = (@ethSiblings[hash] or []).concat(unpackedMsg[1] or [])
        else if unpackedMsg[3][0] is 2 or unpackedMsg[3][0] is -2
          # Checking if the chain is Ethereum
          console.log '[QUEUE] Received ETH proof for ' + hash
          @ethSiblings[hash] = @_convertSiblingArray(unpackedMsg[1])
        # ACKing the queue message
        @channel.ack queueMsg
        niceProof = @_recursiveConvert unpackedMsg
        @emit 'proof', hash, niceProof
    else
      @emit 'error', "Error binding to #{hash}-clnt"

  _merkleMixer : (a, b, cb) =>
    if b > a
      [a, b] = [b, a]
    data = a + b
    @_sha3Hash data, cb

  _getBTCtx : (txid, cb) =>
    request "https://api.blockcypher.com/v1/btc/main/txs/#{txid}", (err, res, body) =>
      if err or !body or !JSON.parse(body).outputs
        @emit 'error', 'BTC explorer error'
      tx = JSON.parse(body).outputs.find (e) ->
        e.data_hex?
      cb tx.data_hex

  _getETHtx : (txid, cb) =>
    request "https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=#{txid}", (err, res, body) =>
      if err or !body or !JSON.parse(body).result
        @emit 'error', 'ETH explorer error'
      cb JSON.parse(body).result.input

  prove : (hash, proof, cb) =>
    await @checkSiblings hash, proof[1], proof[2], defer siblingsAreOK
    await @checkRootInChain proof[2], proof[3][0], proof[3][1], defer rootIsInChain
    cb siblingsAreOK and rootIsInChain

  checkDataIntegrity : (data, proof, cb) ->
    await @hash data, defer hash
    @prove hash, proof, defer valid
    cb valid

  checkSiblings : (hash, siblings, root, cb) =>
    if siblings.length > 0
      head = siblings[0]
      tail = siblings.slice 1
      await @_merkleMixer hash, head, defer hash
      console.log 'Resulting in', hash
      await @checkSiblings hash, tail, root, (res) ->
        cb res
    else
      console.log 'A_Root', hash
      console.log 'B_Root', root
      cb hash is root

  checkRootInChain : (root, chain, txid, cb) =>
    f = @_getBTCtx
    if chain is 2
      f = @_getETHtx
    await f txid, defer data
    cb data.indexOf(root.toLowerCase()) >= 0

  receiveMissedProofs: () =>
    @_handleQueueConsumingForHash @clientId


  stamp : (hash) ->
    console.log "Stamping #{hash}"
    unless @authed
      await @_auth defer @authed
    hash = hash.toUpperCase()
    console.log "Let's stamp #{hash}"
    return setTimeout @stamp.bind(this, hash), 500 if not @rabbit
    await @rpc.invoke 'stamp', [hash], defer err, res
    return @emit 'error', 'Not authenticated' if !@authed
    console.log "[API] Received response: ", res
    if err
      console.log "[RPC] Error: #{err}"
      @emit 'error', err

  hash : (data, cb) ->
    if data instanceof stream
      @_hashFile data, cb
    else
      sha3 = new (SHA3.SHA3Hash)()
      sha3.update data
      cb sha3.digest('hex').toUpperCase()

util.inherits Stampery, EventEmitter

module.exports = Stampery

