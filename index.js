(function() {
  var EventEmitter, MsgpackRPC, RockSolidSocket, SHA3, Stampery, amqp, amqpDomain, crypto, domain, iced, msgpack, request, stream, util, __iced_k, __iced_k_noop,
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

  request = require('request');

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

    Stampery.prototype._convertSiblingArray = function(siblings) {
      if (siblings === '') {
        return [];
      } else {
        return siblings.map(function(v, i) {
          return v.toString();
        });
      }
    };

    Stampery.prototype._recursiveConvert = function(proof) {
      return proof.map((function(_this) {
        return function(e) {
          if (e instanceof Buffer) {
            e = e.toString('utf8');
          } else if (e instanceof Array) {
            e = _this._recursiveConvert(e);
          }
          return e;
        };
      })(this));
    };

    function Stampery(clientSecret, beta) {
      var host, sock;
      this.clientSecret = clientSecret;
      this.beta = beta;
      this.checkRootInChain = __bind(this.checkRootInChain, this);
      this.checkSiblings = __bind(this.checkSiblings, this);
      this.prove = __bind(this.prove, this);
      this._merkleMixer = __bind(this._merkleMixer, this);
      this.receiveMissedProofs = __bind(this.receiveMissedProofs, this);
      this._handleQueueConsumingForHash = __bind(this._handleQueueConsumingForHash, this);
      this._sumSiblings = __bind(this._sumSiblings, this);
      this._auth = __bind(this._auth, this);
      this._connectRabbit = __bind(this._connectRabbit, this);
      this._recursiveConvert = __bind(this._recursiveConvert, this);
      this._convertSiblingArray = __bind(this._convertSiblingArray, this);
      this.clientId = crypto.createHash('md5').update(this.clientSecret).digest('hex').substring(0, 15);
      if (this.beta) {
        host = 'api-beta.stampery.com:4000';
      } else {
        host = 'api.stampery.com:4000';
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
                lineno: 54
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
                lineno: 56
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
          _this.rpc.invoke('auth', [_this.clientId, _this.clientSecret], __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return res = arguments[1];
              };
            })(),
            lineno: 88
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          console.log("[RPC] Auth: ", err, res);
          if (err) {
            return _this.emit('error', err);
          }
          return cb(true);
        };
      })(this));
    };

    Stampery.prototype.calculateProof = function(hash, siblings, cb) {
      var idx, lastComputedleaf, sibling;
      lastComputedleaf = hash;
      for (idx in siblings) {
        sibling = siblings[idx];
        console.log("[SIBLINGS] Calculating sibling " + idx, lastComputedleaf, sibling);
        this._sumSiblings(lastComputedleaf, sibling, function(sum) {
          console.log("[SIBLINGS] Calculated " + sum);
          return lastComputedleaf = sum;
        });
      }
      return cb(lastComputedleaf);
    };

    Stampery.prototype._sumSiblings = function(leaf1, leaf2, cb) {
      var hash, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (parseInt(leaf1, 16) > parseInt(leaf2, 16)) {
        console.log("[SIBLINGS] Leaf1 is bigger than Leaf2");
        (function(_this) {
          return (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery._sumSiblings"
            });
            _this._sha3Hash("" + leaf1 + leaf2, __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  return hash = arguments[0];
                };
              })(),
              lineno: 107
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            return __iced_k(cb(hash));
          };
        })(this));
      } else {
        console.log("[SIBLINGS] Leaf2 is bigger than Leaf1");
        (function(_this) {
          return (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery._sumSiblings"
            });
            _this._sha3Hash("" + leaf2 + leaf1, __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  return hash = arguments[0];
                };
              })(),
              lineno: 111
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

    Stampery.prototype._handleQueueConsumingForHash = function(queue) {
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
              lineno: 116
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            console.log("[QUEUE] Bound to " + queue + "-clnt", err);
            return __iced_k(_this.channel.consume("" + queue + "-clnt", function(queueMsg) {
              var hash, niceProof, unpackedMsg;
              console.log("[QUEUE] Received data!");
              unpackedMsg = msgpack.unpack(queueMsg.content);
              hash = queueMsg.fields.routingKey;
              if (unpackedMsg[3][0] === 1 || unpackedMsg[3][0] === -1) {
                console.log('[QUEUE] Received BTC proof for ' + hash);
                unpackedMsg[1] = (_this.ethSiblings[hash] || []).concat(unpackedMsg[1] || []);
              } else if (unpackedMsg[3][0] === 2 || unpackedMsg[3][0] === -2) {
                console.log('[QUEUE] Received ETH proof for ' + hash);
                _this.ethSiblings[hash] = _this._convertSiblingArray(unpackedMsg[1]);
              }
              _this.channel.ack(queueMsg);
              niceProof = _this._recursiveConvert(unpackedMsg);
              return _this.emit('proof', hash, niceProof);
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
      console.log("Stamping " + hash);
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
                assign_fn: (function(__slot_1) {
                  return function() {
                    return __slot_1.authed = arguments[0];
                  };
                })(_this),
                lineno: 143
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
          console.log("Let's stamp " + hash);
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
              lineno: 147
            }));
            __iced_deferrals._fulfill();
          })(function() {
            if (!_this.authed) {
              return _this.emit('error', 'Not authenticated');
            }
            console.log("[API] Received response: ", res);
            if (err) {
              console.log("[RPC] Error: " + err);
              return _this.emit('error', err);
            }
          });
        };
      })(this));
    };

    Stampery.prototype.receiveMissedProofs = function() {
      return this._handleQueueConsumingForHash(this.clientId);
    };

    Stampery.prototype._merkleMixer = function(a, b, cb) {
      var data, _ref;
      if (b > a) {
        _ref = [b, a], a = _ref[0], b = _ref[1];
      }
      data = a + b;
      return this._sha3Hash(data, cb);
    };

    Stampery.prototype.prove = function(hash, proof, cb) {
      var rootIsInChain, siblingsAreOK, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery.prove"
          });
          _this.checkSiblings(hash, proof[1], proof[2], __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return siblingsAreOK = arguments[0];
              };
            })(),
            lineno: 164
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery.prove"
            });
            _this.checkRootInChain(proof[2], proof[3][0], proof[3][1], __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  return rootIsInChain = arguments[0];
                };
              })(),
              lineno: 165
            }));
            __iced_deferrals._fulfill();
          })(function() {
            return cb(siblingsAreOK && rootIsInChain);
          });
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
            lineno: 169
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
            lineno: 170
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
              lineno: 177
            }));
            __iced_deferrals._fulfill();
          });
        })(this)((function(_this) {
          return function() {
            return __iced_k(cb(_this.checkSiblings(hash, tail, root, cb)));
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
            lineno: 186
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          return cb(data.indexOf(root.toLowerCase()) >= 0);
        };
      })(this));
    };

    Stampery.prototype._getBTCtx = function(txid, cb) {
      return request("https://api.blockcypher.com/v1/btc/main/txs/" + txid, function(err, res, body) {
        var tx;
        if (err || !body || !JSON.parse(body).outputs) {
          throw new Error('BTC explorer error');
        }
        tx = JSON.parse(body).outputs.find(function(e) {
          return e.data_hex != null;
        });
        return cb(tx.data_hex);
      });
    };

    Stampery.prototype._getETHtx = function(txid, cb) {
      return request("https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=" + txid, function(err, res, body) {
        if (err || !body || !JSON.parse(body).result) {
          throw new Error('ETH explorer error');
        }
        return cb(JSON.parse(body).result.input);
      });
    };

    return Stampery;

  })();

  util.inherits(Stampery, EventEmitter);

  module.exports = Stampery;

}).call(this);
