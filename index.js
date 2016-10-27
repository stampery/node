(function() {
  var EventEmitter, MsgpackRPC, RockSolidSocket, SHA3, Stampery, amqp, amqpDomain, crypto, domain, iced, msgpack, pjson, request, stream, util, __iced_k, __iced_k_noop,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  iced = require('iced-runtime');
  __iced_k = __iced_k_noop = function() {};

  crypto = require('crypto');

  stream = require('stream');

  SHA3 = require('js-sha3');

  RockSolidSocket = require('rocksolidsocket');

  MsgpackRPC = require('msgpackrpc');

  amqp = require('amqplib/callback_api');

  msgpack = require('msgpack');

  domain = require('domain');

  util = require('util');

  request = require('request');

  EventEmitter = require('events').EventEmitter;

  pjson = require('./package.json');

  amqpDomain = domain.create();

  amqpDomain.on('error', (function(_this) {
    return function(err) {
      return console.log('[QUEUE] Error with queue: ' + err);
    };
  })(this));

  Stampery = (function() {
    Stampery.prototype.ethSiblings = {};

    Stampery.prototype.authed = false;

    function Stampery(clientSecret, beta) {
      var host, sock, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      this.clientSecret = clientSecret;
      this.beta = beta;
      this.checkRootInChain = __bind(this.checkRootInChain, this);
      this.checkSiblings = __bind(this.checkSiblings, this);
      this.prove = __bind(this.prove, this);
      this._merkleMixer = __bind(this._merkleMixer, this);
      this._convertSiblingArray = __bind(this._convertSiblingArray, this);
      this._processProof = __bind(this._processProof, this);
      this._handleQueueConsumingForHash = __bind(this._handleQueueConsumingForHash, this);
      this._auth = __bind(this._auth, this);
      this._connectRabbit = __bind(this._connectRabbit, this);
      this.clientId = crypto.createHash('md5').update(this.clientSecret).digest('hex').substring(0, 15);
      if (this.beta) {
        host = 'api-beta.stampery.com:4000';
      } else {
        host = 'api.stampery.com:4000';
      }
      sock = new RockSolidSocket(host);
      this.rpc = new MsgpackRPC('stampery.3', sock);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery"
          });
          _this._auth(__iced_deferrals.defer({
            assign_fn: (function(__slot_1) {
              return function() {
                return __slot_1.authed = arguments[0];
              };
            })(_this),
            lineno: 37
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (_this.authed) {
            return _this._connectRabbit();
          }
        };
      })(this));
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
                lineno: 43
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
                lineno: 45
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
          if (_this.rabbit) {
            console.log('[QUEUE] Connected to Rabbit!');
            _this.emit('ready');
            amqpDomain.add(_this.rabbit);
            _this._handleQueueConsumingForHash(_this.clientId);
            return _this.rabbit.on('error', function(err) {
              _this.emit('error', err);
              return _this._connectRabbit;
            });
          }
        };
      })(this));
    };

    Stampery.prototype._sha3Hash = function(stringToHash, cb) {
      return cb(SHA3.sha3_512(stringToHash));
    };

    Stampery.prototype._hashFile = function(fd, cb) {
      var hash;
      hash = new SHA3.sha3_512.create();
      fd.on('end', function() {
        return cb(hash.hex());
      });
      return fd.on('data', function(data) {
        return hash.update(data);
      });
    };

    Stampery.prototype._auth = function(cb) {
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
          _this.rpc.invoke('auth', [_this.clientId, _this.clientSecret, "nodejs-" + pjson.version], __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return res = arguments[1];
              };
            })(),
            lineno: 69
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            _this.auth = false;
            _this.emit('error', "Couldn't authenticate");
            process.exit();
          }
          return cb(true);
        };
      })(this));
    };

    Stampery.prototype._handleQueueConsumingForHash = function(queue) {
      var err, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
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
            lineno: 77
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (!err) {
            return _this.channel.consume("" + queue + "-clnt", function(queueMsg) {
              var hash, niceProof, unpackedMsg;
              unpackedMsg = msgpack.unpack(queueMsg.content);
              hash = queueMsg.fields.routingKey;
              _this.channel.ack(queueMsg);
              niceProof = _this._processProof(unpackedMsg);
              return _this.emit('proof', hash, niceProof);
            });
          } else {
            return _this.emit('error', "Error " + err);
          }
        };
      })(this));
    };

    Stampery.prototype._processProof = function(raw_proof) {
      return {
        'version': raw_proof[0],
        'siblings': this._convertSiblingArray(raw_proof[1]),
        'root': raw_proof[2].toString('utf8'),
        'anchor': {
          'chain': raw_proof[3][0],
          'tx': raw_proof[3][1].toString('utf8')
        }
      };
    };

    Stampery.prototype._convertSiblingArray = function(siblings) {
      if (siblings === '') {
        return [];
      } else {
        return siblings.map(function(v, i) {
          return v.toString();
        });
      }
    };

    Stampery.prototype._merkleMixer = function(a, b, cb) {
      var data, _ref;
      if (a > b) {
        _ref = [b, a], a = _ref[0], b = _ref[1];
      }
      data = a + b;
      return this._sha3Hash(data, cb);
    };

    Stampery.prototype.prove = function(hash, proof, cb) {
      var siblingsAreOK, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery.prove"
          });
          _this.checkSiblings(hash, proof.siblings, proof.root, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return siblingsAreOK = arguments[0];
              };
            })(),
            lineno: 117
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          return cb(siblingsAreOK);
        };
      })(this));
    };

    Stampery.prototype.checkDataIntegrity = function(data, proof, cb) {
      var hash, valid, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery.checkDataIntegrity"
          });
          _this.hash(data, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return hash = arguments[0];
              };
            })(),
            lineno: 121
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          _this.prove(hash, proof, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return valid = arguments[0];
              };
            })(),
            lineno: 122
          }));
          return cb(valid);
        };
      })(this));
    };

    Stampery.prototype.checkSiblings = function(hash, siblings, root, cb) {
      var head, tail, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (siblings.length > 0) {
        head = siblings[0];
        tail = siblings.slice(1);
        (function(_this) {
          return (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery.checkSiblings"
            });
            _this._merkleMixer(hash, head, __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  return hash = arguments[0];
                };
              })(),
              lineno: 129
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "./index.iced",
                funcname: "Stampery.checkSiblings"
              });
              _this.checkSiblings(hash, tail, root, function(res) {
                return cb(res);
              });
              __iced_deferrals._fulfill();
            })(__iced_k);
          };
        })(this));
      } else {
        return __iced_k(cb(hash === root));
      }
    };

    Stampery.prototype.checkRootInChain = function(root, chain, txid, cb) {
      var data, f, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      f = this._getBTCtx;
      if (chain === 2) {
        f = this._getETHtx;
      }
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery.checkRootInChain"
          });
          f(txid, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return data = arguments[0];
              };
            })(),
            lineno: 139
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          return cb(data.indexOf(root.toLowerCase()) >= 0);
        };
      })(this));
    };

    Stampery.prototype.stamp = function(hash) {
      console.log("\nStamping \n" + hash);
      hash = hash.toUpperCase();
      return this.rpc.invoke('stamp', [hash], (function(_this) {
        return function(err, res) {
          if (err) {
            console.log("[RPC] Error: " + err);
            return _this.emit('error', err);
          }
        };
      })(this));
    };

    Stampery.prototype.hash = function(data, cb) {
      if (data instanceof stream) {
        return this._hashFile(data, cb);
      } else {
        return this._sha3Hash(data, function(hash) {
          return cb(hash.toUpperCase());
        });
      }
    };

    return Stampery;

  })();

  util.inherits(Stampery, EventEmitter);

  module.exports = Stampery;

}).call(this);
