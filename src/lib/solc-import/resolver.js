function isValidHash (hash) {
  return /^[0-9a-f]{64}$/.test(hash);
}
function getFile (gateway, url, cb) {
  url = gateway + '/' + url;
  return fetch(url, { method: 'GET' }).then(response => {
    var data = response.text();
    if (!response.ok || response.status !== 200) return cb(data);
    return cb(null, data, url);
  }).catch(err => cb(err || 'Unknown transport error'));
}
function putFile (gateway, content, cb) {
  var url = gateway + '/bzz-raw:/';
  return fetch(url, { method: 'POST', body: content }).then(response => {
    var data = response.text();
    if (!response.ok || response.status !== 200) return cb(data);
    if (!isValidHash(content)) return cb('Invalid hash');
    return cb(null, data, url);
  }).catch(err => cb(err || 'Unknown transport error'));
}
function swarmgwMaker (opts) {
  opts = opts || {};
  var gateway;
  if (opts.gateway) {
    gateway = opts.gateway;
  } else if (opts.mode === 'http') {
    gateway = 'http://swarm-gateways.net';
  } else {
    gateway = 'https://swarm-gateways.net';
  }
  return {
    get: function (url, cb) {
      return getFile(gateway, url, cb);
    },
    put: function (content, cb) {
      return putFile(gateway, content, cb);
    }
  };
}
var swarmgw = swarmgwMaker();

module.exports = class CompilerImports {
  constructor() {
    // cache import so we don't make the request at each compilation.
    this.previouslyHandled = {};
  }

  handleGithubCall(root, path, cb) {
    var url = 'https://api.github.com/repos/' + root + '/contents/' + path;
    
    return fetch(url, { method: 'GET' }).then(async response => {
      var data = await response.text();
      if (!response.ok || response.status !== 200) return cb(data);
      data = JSON.parse(data);
      if ('content' in data) return cb(null, window.atob(data.content), root + '/' + path);
      if ('message' in data) return cb(data.message);
      return cb('Content not received');
    }).catch(err => cb(err || 'Unknown transport error'));
  }

  handleSwarmImport(url, cleanUrl, cb) {
    swarmgw.get(url, function (err, content) {
      cb(err, content, cleanUrl);
    });
  }

  handleIPFS(url, cb) {
    // replace ipfs:// with /ipfs/
    url = url.replace(/^ipfs:\/\/?/, 'ipfs/');
    url = 'https://gateway.ipfs.io/' + url;

    return fetch(url, { method: 'GET' }).then(response => {
      var data = response.text();
      if (!response.ok || response.status !== 200) return cb(data);
      return cb(null, data, url);
    }).catch(err => cb(err || 'Unknown transport error'));
  }

  handleHttpCall(url, cleanUrl, cb) {
    var url = cleanUrl;
    return fetch(url, { method: 'GET' }).then(response => {
      var data = response.text();
      if (!response.ok || response.status !== 200) return cb(data);
      return cb(null, data, url);
    }).catch(err => cb(err || 'Unknown transport error'));
  }

  handlers() {
    return [
      {
        type: 'github', match: /^(https?:\/\/)?(www.)?github.com\/([^/]*\/[^/]*)\/(.*)/,
        handler: (match, cb) => {
          return this.handleGithubCall(match[3], match[4], cb);
        }
      },
      {
        type: 'http', match: /^(http?:\/\/?(.*))$/,
        handler: (match, cb) => { this.handleHttpCall(match[1], match[2], cb); }
      },
      {
        type: 'https', match: /^(https?:\/\/?(.*))$/,
        handler: (match, cb) => { this.handleHttpCall(match[1], match[2], cb); }
      },
      {
        type: 'swarm', match: /^(bzz[ri]?:\/\/?(.*))$/,
        handler: (match, cb) => { this.handleSwarmImport(match[1], match[2], cb); }
      },
      {
        type: 'ipfs', match: /^(ipfs:\/\/?.+)/,
        handler: (match, cb) => { this.handleIPFS(match[1], cb); }
      }
    ];
  }

  isRelativeImport(url) {
    return /^([^/]+)/.exec(url);
  }

  import(url, loadingCb, cb) {
    var self = this;
    var imported = this.previouslyHandled[url];
    if (imported) {
      return cb(null, imported.content, imported.cleanUrl, imported.type, url);
    }
    var handlers = this.handlers();

    var found = false;
    handlers.forEach(function (handler) {
      if (found) {
        return;
      }

      var match = handler.match.exec(url);
      if (match) {
        found = true;

        loadingCb('Loading ' + url + ' ...');
        handler.handler(match, function (err, content, cleanUrl) {
          if (err) {
            cb('Unable to import "' + cleanUrl + '": ' + err);
            return;
          }
          self.previouslyHandled[url] = {
            content: content,
            cleanUrl: cleanUrl,
            type: handler.type
          };
          cb(null, content, cleanUrl, handler.type, url);
        });
      }
    });

    if (found) {
      return;
    } else if (/^[^:]*:\/\//.exec(url)) {
      cb('Unable to import "' + url + '": Unsupported URL schema');
    } else {
      cb('Unable to import "' + url + '": File not found');
    }
  }
};
