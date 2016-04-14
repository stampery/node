crypto = require 'crypto'
net = require 'net'
MsgpackRPC = require 'msgpackrpc'
retry = require 'retry'
stream = require 'stream'
RockSolidSocket = require 'rocksolidsocket'
amqp = require 'amqplib/callback_api'

class Stampery
  constructor : (@apiSecret, @beta) ->
    md5 = crypto.createHash 'md5'
    md5.update @apiSecret
    md5 = md5.digest 'hex'
    @clientId = md5.substring 0, 15

    @sock = new RockSolidSocket 'localhost:4000'

    @rpc = new MsgpackRPC 'stampery.3', @sock
    @authed = false
    @connected = false

  connectToQueue : (cb) ->
    if @connected
      cb null, @conn
    else
      await amqp.connect 'amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', defer err, @conn

      if err
        console.log "[QUEUE] Error connecting #{err}"
        cb err, null
      else
        @connected = true
        cb null, @conn

      @conn.on 'error', (e) ->
        console.log "[QUEUE] Connection error: #{e}"
        cb e, null
    
  hash : (data) ->
    hash = crypto.createHash 'sha256'
    hash.update data
    hash.digest 'hex'

  hashFile : (fd, cb) ->
    hash = crypto.createHash 'sha256'
    hash.setEncoding 'hex'

    fd.on 'end', () ->
      hash.end()
      cb hash.read()

    fd.pipe hash

  stamp : (data, cb) =>
    dataHash = null
    if data instanceof stream
      await @hashFile data, defer hash
      dataHash = hash
    else
      dataHash = @hash data

    if !@authed
      console.log "[RPC] No auth"
      await @rpc.invoke 'auth', [@clientId, @apiSecret], defer err, res
      if err
        return cb err, null
      else
        console.log "[RPC] Authed: #{err}, #{res}"
    
    await @rpc.invoke 'stamp', [dataHash], defer err, res
    if err
      console.log "[RPC] Error: #{err}"
    @connectToQueue (err, conn) =>
      if err
        console.log "[QUEUE] Error connecting to RabbitMQ"
      else
        await @conn.createChannel defer err, channel
        await channel.assertQueue dataHash, {durable: true}, defer err, ok
        channel.consume dataHash, (msg) ->
          console.log "[QUEUE] Received -> %s", msg.content.toString()
          channel.ack msg

module.exports = Stampery
