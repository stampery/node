crypto = require 'crypto'
stream = require 'stream'
RockSolidSocket = require 'rocksolidsocket'
MsgpackRPC = require 'msgpackrpc'
amqp = require 'amqplib/callback_api'

class Stampery

  hashCache: []

  constructor : (@clientSecret, @beta) ->
    @clientId = @_hash('md5', @clientSecret).substring 0, 15

    sock = new RockSolidSocket 'localhost:4000'
    @rpc = new MsgpackRPC 'stampery.3', sock
    @_auth()
    @_connectRabbit()

  _connectRabbit : () =>
    await amqp.connect 'amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', defer err, @rabbit
    return console.log "[QUEUE] Error connecting #{err}" if err
    @rabbit.on 'error', @_connectRabbit

    await @rabbit.createChannel defer err, @channel

    if @rabbit and @hashCache.length isnt 0
      for idx of @hashCache
        await @channel.assertQueue "#{@hashCache[idx]}-clnt", {durable: true}, defer err, ok if @channel

  _hash : (algo, data) -> crypto.createHash(algo).update(data).digest 'hex'

  hash : (data, cb) ->
    if data instanceof stream
      @_hashFile data, cb
    else
      @_hash 'sha256', data

  _hashFile : (fd, cb) ->
    hash = crypto.createHash 'sha256'
    hash.setEncoding 'hex'

    fd.on 'end', () ->
      hash.end()
      cb hash.read()

    fd.pipe hash

  _auth : () ->
    await @rpc.invoke 'auth', [@clientId, @clientSecret], defer err, res
    console.log err, res
    return console.log "[RPC] Auth error: #{err}" if err

  stamp : (hash, cb) ->
    @hashCache.push hash
    return setTimeout @stamp.bind(this, hash, cb), 500 if not @rabbit
    await @rpc.invoke 'stamp', [hash], defer err, res
    if err
      console.log "[RPC] Error: #{err}"
      return cb err, null

    console.log cb
    if ok
      console.log "[QUEUE] Bound to #{hash}-clnt"
      await @channel.assertQueue "#{hash}-clnt", {durable: true}, defer err, ok if @channel
      channel.consume "#{hash}-clnt", (msg) ->
        delete @hashCache[@hashCache.indexOf(hash)]
        console.log "[QUEUE] Received -> %s", msg.content.toString()
        channel.ack msg
        cb null, msg
    else
      cb "Error binding to #{hash}-clnt", null

module.exports = Stampery
