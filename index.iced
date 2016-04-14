crypto = require 'crypto'
stream = require 'stream'
RockSolidSocket = require 'rocksolidsocket'
MsgpackRPC = require 'msgpackrpc'
amqp = require 'amqplib/callback_api'

class Stampery
  constructor : (@clientSecret, @beta) ->
    @clientId = @_hash('md5', @clientSecret).substring 0, 15

    sock = new RockSolidSocket 'localhost:4000'
    @rpc = new MsgpackRPC 'stampery.3', sock
    @_auth()
    @_connectRabbit()

  _connectRabbit : () =>
    await amqp.connect 'amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', defer err, @rabbit
    return console.log console.log "[QUEUE] Error connecting #{err}" if err
    @rabbit.on 'error', @_connectRabbit

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
    return console.log "[RPC] Auth error: #{err}" if err

  stamp : (hash, cb) ->
    return setTimeout @stamp.bind(this, hash, cb), 500 if not @rabbit

    await @rpc.invoke 'stamp', [hash], defer err, res
    return console.log "[RPC] Error: #{err}" if err

    await @rabbit.createChannel defer err, channel
    console.log "[QUEUE] Bound to #{hash}-clnt"
    channel.consume "#{hash}-clnt", (msg) ->
      console.log "[QUEUE] Received -> %s", msg.content.toString()
      channel.ack msg
      cb msg

module.exports = Stampery
