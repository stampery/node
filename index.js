(function() {
  var EventEmitter, MsgpackRPC, RockSolidSocket, SHA3, Stampery, amqp, amqpDomain, crypto, domain, iced, msgpack, stream, util, __iced_k, __iced_k_noop,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  iced = require('iced-runtime');
  __iced_k = __iced_k_noop = function() {};

  crypto = require('crypto');

  stream = require('stream');

  SHA3 = require('sha3');

  RockSolidSocket = require('rocksolidsocket');

  MsgpackRPC = require('msgpackrpc');

  amqp = require('amqplib/callback_api');

  msgpack = require('msgpack');

  domain = require('domain');

  util = require('util');

  EventEmitter = require('events').EventEmitter;

  amqpDomain = domain.create();

  amqpDomain.on('error', (function(_this) {
    return function(err) {
      return console.log('[QUEUE] Error with queue: ' + err);
    };
  })(this));

  Stampery = (function() {
    Stampery.prototype.ethSiblings = {};

    Stampery.prototype.authed = false;

    Stampery.prototype.convertSiblingArray = function(siblings) {
      if (siblings === '') {
        return [];
      } else {
        return siblings.map(function(v, i) {
          return new Buffer(v).toString();
        });
      }
    };

    function Stampery(clientSecret, beta) {
      var host, sock;
      this.clientSecret = clientSecret;
      this.beta = beta;
      this._connectRabbit = __bind(this._connectRabbit, this);
      this.clientId = this._hash('md5', this.clientSecret).substring(0, 15);
      if (this.beta) {
        host = 'api-beta-0.us-east.aws.stampery.com:4000';
      } else {
        host = 'api-0.us-east.aws.stampery.com:4000';
      }
      sock = new RockSolidSocket(host);
      this.rpc = new MsgpackRPC('stampery.3', sock);
      this._connectRabbit();
    }

    Stampery.prototype._connectRabbit = function() {
      var err, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          if (_this.beta) {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "./index.iced",
                funcname: "Stampery._connectRabbit"
              });
              amqp.connect('amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/beta', __iced_deferrals.defer({
                assign_fn: (function(__slot_1) {
                  return function() {
                    err = arguments[0];
                    return __slot_1.rabbit = arguments[1];
                  };
                })(_this),
                lineno: 41
              }));
              __iced_deferrals._fulfill();
            })(__iced_k);
          } else {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "./index.iced",
                funcname: "Stampery._connectRabbit"
              });
              amqp.connect('amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', __iced_deferrals.defer({
                assign_fn: (function(__slot_1) {
                  return function() {
                    err = arguments[0];
                    return __slot_1.rabbit = arguments[1];
                  };
                })(_this),
                lineno: 43
              }));
              __iced_deferrals._fulfill();
            })(__iced_k);
          }
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            return console.log("[QUEUE] Error connecting " + err);
          }
          console.log('[QUEUE] Connected to Rabbit!');
          _this.emit('ready');
          amqpDomain.add(_this.rabbit);
          return _this.rabbit.on('error', function(err) {
            _this.emit('error', err);
            return _this._connectRabbit;
          });
        };
      })(this));
    };

    Stampery.prototype._hash = function(algo, data) {
      return crypto.createHash(algo).update(data).digest('hex');
    };

    Stampery.prototype.hash = function(data, cb) {
      var sha3;
      if (data instanceof stream) {
        return this._hashFile(data, cb);
      } else {
        sha3 = new SHA3.SHA3Hash();
        sha3.update(data);
        return cb(sha3.digest('hex').toUpperCase());
      }
    };

    Stampery.prototype._sha3Hash = function(stringToHash, cb) {
      var hash;
      hash = new SHA3.SHA3Hash();
      hash.update(stringToHash);
      return cb(hash.digest('hex'));
    };

    Stampery.prototype._hashFile = function(fd, cb) {
      var hash;
      hash = new SHA3.SHA3Hash();
      fd.on('end', function() {
        return cb(hash.digest('hex'));
      });
      return fd.on('data', function(data) {
        return hash.update(data);
      });
    };

    Stampery.prototype._auth = function() {
      var err, res, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery._auth"
          });
          _this.rpc.invoke('auth', [_this.clientId, _this.clientSecret], __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return res = arguments[1];
              };
            })(),
            lineno: 77
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          console.log("[RPC] Auth: ", err, res);
          if (err) {
            return _this.emit('error', err);
          }
          return _this.authed = true;
        };
      })(this));
    };

    Stampery.prototype.calculateProof = function(hash, siblings, cb) {
      var idx, lastComputedLeave, sibling;
      lastComputedLeave = hash;
      for (idx in siblings) {
        sibling = siblings[idx];
        console.log("[SIBLINGS] Calculating sibling " + idx, lastComputedLeave, sibling);
        this._sumSiblings(lastComputedLeave, sibling, function(sum) {
          console.log("[SIBLINGS] Calculated " + sum);
          return lastComputedLeave = sum;
        });
      }
      return cb(lastComputedLeave);
    };

    Stampery.prototype._sumSiblings = function(leave1, leave2, cb) {
      var hash, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (parseInt(leave1, 16) > parseInt(leave2, 16)) {
        console.log("[SIBLINGS] Leave1 is bigger than Leave2");
        (function(_this) {
          return (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery._sumSiblings"
            });
            _this._sha3Hash("" + leave1 + leave2, __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  return hash = arguments[0];
                };
              })(),
              lineno: 96
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            return __iced_k(cb(hash));
          };
        })(this));
      } else {
        console.log("[SIBLINGS] Leave2 is bigger than Leave1");
        (function(_this) {
          return (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery._sumSiblings"
            });
            _this._sha3Hash("" + leave2 + leave1, __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  return hash = arguments[0];
                };
              })(),
              lineno: 100
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            return __iced_k(cb(hash));
          };
        })(this));
      }
    };

    Stampery.prototype._handleQueueConsumingForHash = function(hash) {
      var err, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (this.rabbit) {
        (function(_this) {
          return (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery._handleQueueConsumingForHash"
            });
            _this.rabbit.createChannel(__iced_deferrals.defer({
              assign_fn: (function(__slot_1) {
                return function() {
                  err = arguments[0];
                  return __slot_1.channel = arguments[1];
                };
              })(_this),
              lineno: 105
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            console.log("[QUEUE] Bound to " + hash + "-clnt", err);
            return __iced_k(_this.channel.consume("" + hash + "-clnt", function(queueMsg) {
              var unpackedMsg;
              console.log("[QUEUE] Received data!");
              unpackedMsg = msgpack.unpack(queueMsg.content);
              if (unpackedMsg[3][0] === 1 || unpackedMsg[3][0] === -1) {
                console.log('[QUEUE] Received BTC proof for ' + hash);
                unpackedMsg[1] = (_this.ethSiblings[hash] || []).concat(unpackedMsg[1] || []);
              } else if (unpackedMsg[3][0] === 2 || unpackedMsg[3][0] === -2) {
                console.log('[QUEUE] Received ETH proof for ' + hash);
                _this.ethSiblings[hash] = _this.convertSiblingArray(unpackedMsg[1]);
              }
              _this.channel.ack(queueMsg);
              return _this.emit('proof', hash, unpackedMsg);
            }));
          };
        })(this));
      } else {
        return __iced_k(this.emit('error', "Error binding to " + hash + "-clnt"));
      }
    };

    Stampery.prototype.stamp = function(hash) {
      var err, res, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          if (!_this.authed) {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "./index.iced",
                funcname: "Stampery.stamp"
              });
              _this._auth(__iced_deferrals.defer({
                lineno: 129
              }));
              __iced_deferrals._fulfill();
            })(__iced_k);
          } else {
            return __iced_k();
          }
        });
      })(this)((function(_this) {
        return function() {
          hash = hash.toUpperCase();
          if (!_this.rabbit) {
            return setTimeout(_this.stamp.bind(_this, hash), 500);
          }
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery.stamp"
            });
            _this.rpc.invoke('stamp', [hash], __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  err = arguments[0];
                  return res = arguments[1];
                };
              })(),
              lineno: 132
            }));
            __iced_deferrals._fulfill();
          })(function() {
            if (!_this.authed) {
              return _this.emit('error', 'Not authenticated');
            }
            console.log("[API] Received response: ", res);
            if (err) {
              console.log("[RPC] Error: " + err);
              _this.emit('error', err);
            }
            return _this._handleQueueConsumingForHash(hash);
          });
        };
      })(this));
    };

    Stampery.prototype.receiveMissedProofs = function(hash) {
      return this._handleQueueConsumingForHash(hash.toUpperCase());
    };

    return Stampery;

  })();

  util.inherits(Stampery, EventEmitter);

  module.exports = Stampery;

}).call(this);
