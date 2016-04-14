(function() {
  var MsgpackRPC, RockSolidSocket, Stampery, amqp, crypto, iced, net, retry, stream, __iced_k, __iced_k_noop,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  iced = require('iced-runtime');
  __iced_k = __iced_k_noop = function() {};

  crypto = require('crypto');

  net = require('net');

  MsgpackRPC = require('msgpackrpc');

  retry = require('retry');

  stream = require('stream');

  RockSolidSocket = require('rocksolidsocket');

  amqp = require('amqplib/callback_api');

  Stampery = (function() {
    function Stampery(apiSecret, beta) {
      var md5;
      this.apiSecret = apiSecret;
      this.beta = beta;
      this.stamp = __bind(this.stamp, this);
      md5 = crypto.createHash('md5');
      md5.update(this.apiSecret);
      md5 = md5.digest('hex');
      this.clientId = md5.substring(0, 15);
      this.sock = new RockSolidSocket('localhost:4000');
      this.rpc = new MsgpackRPC('stampery.3', this.sock);
      this.authed = false;
      this.connected = false;
    }

    Stampery.prototype.connectToQueue = function(cb) {
      var err, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (this.connected) {
        return __iced_k(cb(null, this.conn));
      } else {
        (function(_this) {
          return (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery.connectToQueue"
            });
            amqp.connect('amqp://ukgmnhoi:iP8PxJN_rPTT2lls6CEeKsC93aEnQKgx@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', __iced_deferrals.defer({
              assign_fn: (function(__slot_1) {
                return function() {
                  err = arguments[0];
                  return __slot_1.conn = arguments[1];
                };
              })(_this),
              lineno: 25
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            if (err) {
              console.log("[QUEUE] Error connecting " + err);
              cb(err, null);
            } else {
              _this.connected = true;
              cb(null, _this.conn);
            }
            return __iced_k(_this.conn.on('error', function(e) {
              console.log("[QUEUE] Connection error: " + e);
              return cb(e, null);
            }));
          };
        })(this));
      }
    };

    Stampery.prototype.hash = function(data) {
      var hash;
      hash = crypto.createHash('sha256');
      hash.update(data);
      return hash.digest('hex');
    };

    Stampery.prototype.hashFile = function(fd, cb) {
      var hash;
      hash = crypto.createHash('sha256');
      hash.setEncoding('hex');
      fd.on('end', function() {
        hash.end();
        return cb(hash.read());
      });
      return fd.pipe(hash);
    };

    Stampery.prototype.stamp = function(data, cb) {
      var dataHash, err, hash, res, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      dataHash = null;
      (function(_this) {
        return (function(__iced_k) {
          if (data instanceof stream) {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "./index.iced",
                funcname: "Stampery.stamp"
              });
              _this.hashFile(data, __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return hash = arguments[0];
                  };
                })(),
                lineno: 56
              }));
              __iced_deferrals._fulfill();
            })(function() {
              return __iced_k(dataHash = hash);
            });
          } else {
            return __iced_k(dataHash = _this.hash(data));
          }
        });
      })(this)((function(_this) {
        return function() {
          (function(__iced_k) {
            if (!_this.authed) {
              console.log("[RPC] No auth");
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "./index.iced",
                  funcname: "Stampery.stamp"
                });
                _this.rpc.invoke('auth', [_this.clientId, _this.apiSecret], __iced_deferrals.defer({
                  assign_fn: (function() {
                    return function() {
                      err = arguments[0];
                      return res = arguments[1];
                    };
                  })(),
                  lineno: 63
                }));
                __iced_deferrals._fulfill();
              })(function() {
                if (err) {
                  return cb(err, null);
                } else {
                  console.log("[RPC] Authed: " + err + ", " + res);
                }
                return __iced_k();
              });
            } else {
              return __iced_k();
            }
          })(function() {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "./index.iced",
                funcname: "Stampery.stamp"
              });
              _this.rpc.invoke('stamp', [dataHash], __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    err = arguments[0];
                    return res = arguments[1];
                  };
                })(),
                lineno: 69
              }));
              __iced_deferrals._fulfill();
            })(function() {
              if (err) {
                console.log("[RPC] Error: " + err);
              }
              return _this.connectToQueue(function(err, conn) {
                var channel, ok, ___iced_passed_deferral1, __iced_deferrals, __iced_k;
                __iced_k = __iced_k_noop;
                ___iced_passed_deferral1 = iced.findDeferral(arguments);
                if (err) {
                  return __iced_k(console.log("[QUEUE] Error connecting to RabbitMQ"));
                } else {
                  (function(__iced_k) {
                    __iced_deferrals = new iced.Deferrals(__iced_k, {
                      parent: ___iced_passed_deferral1,
                      filename: "./index.iced"
                    });
                    _this.conn.createChannel(__iced_deferrals.defer({
                      assign_fn: (function() {
                        return function() {
                          err = arguments[0];
                          return channel = arguments[1];
                        };
                      })(),
                      lineno: 76
                    }));
                    __iced_deferrals._fulfill();
                  })(function() {
                    (function(__iced_k) {
                      __iced_deferrals = new iced.Deferrals(__iced_k, {
                        parent: ___iced_passed_deferral1,
                        filename: "./index.iced"
                      });
                      channel.assertQueue(dataHash, {
                        durable: true
                      }, __iced_deferrals.defer({
                        assign_fn: (function() {
                          return function() {
                            err = arguments[0];
                            return ok = arguments[1];
                          };
                        })(),
                        lineno: 77
                      }));
                      __iced_deferrals._fulfill();
                    })(function() {
                      return __iced_k(channel.consume(dataHash, function(msg) {
                        console.log("[QUEUE] Received -> %s", msg.content.toString());
                        return channel.ack(msg);
                      }));
                    });
                  });
                }
              });
            });
          });
        };
      })(this));
    };

    return Stampery;

  })();

  module.exports = Stampery;

}).call(this);
