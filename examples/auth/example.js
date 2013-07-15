var User = require('./user'),
    App = require('./app'),
    util = require('util');

var user = new User();

user.on('provisioned', function (user) { console.log(util.format('%s was provisioned with pw %s', user.username, user.password)); });
user.on('granted', function (app, user) { console.log(util.format('%s was granted access to app with id %s', user.username, app.appId)); });
user.on('revoked', function (app, user) { console.log(util.format('%s was revoked access to app with id %s', user.username, app.appId)); });

user.provision({ username: 'matt', pass: 'saltypass' });

var sales = App.create({ appId: 1 });

user.grant(sales);

user.revoke(sales);

console.log(util.format('user %s has been modified with the following operations: %j', user.username, user.newEvents));
console.log(util.format('we could persist him with the following snapshot: %j', user.snapshot()));
