var Entity = require('../../lib/entity'),
    events = require('events'),
    util = require('util');

function User () {
  this.apps = {};
  this.username = '';
  this.password = this.pass = '';

  Entity.apply(this, arguments);
}

util.inherits(User, Entity);

User.prototype.grant = function (param) {
  this.apps[param.appId] = param;
  this.digest('grant', param);
  this.emit('granted', param, this);
};

User.prototype.provision = function (param) {
  this.username = param.username;
  this.password = param.password || param.pass;
  this.digest('provision', param);
  this.emit('provisioned', this);
};

User.prototype.revoke = function (param) {
  delete this.apps[param.appId];
  this.digest('revoke', param);
  this.emit('revoked', param, this);
};

module.exports = User;
