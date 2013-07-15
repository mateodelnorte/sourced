var User = require('./user'),
    App = require('./app'),
    util = require('util');

var user = new User();

user.on('provisioned', function (user) { console.log(util.format('%s was provisioned with pw %s', user.username, user.password)); });
user.on('granted', function (app, user) { console.log(util.format('%s was granted access to app with id %s', user.username, app.appId)); });
user.on('revoked', function (app, user) { console.log(util.format('%s was revoked access to app with id %s', user.username, app.appId)); });

user.provision({ username: 'matt', pass: 'saltypass' });

var sales = App.create({ name: 'sales', appId: 1 });
var marketing = App.create({ name: 'marketing', appId: 2 });

user.grant(sales);
user.grant(marketing);

user.revoke(sales);

var snapshot = user.snapshot(), events = user.newEvents;

console.log(util.format('user %s has been modified with the following operations: %j', user.username, user.newEvents));
console.log(util.format('we could persist him with the following snapshot: %j', snapshot));

var matt = new User(snapshot);

console.log(util.format('and reinitialize him from that snapshot: %j', matt));

var matt2 = new User();

matt2.merge(snapshot);

console.log(util.format('or we could have done the same by merging the snapshot: %j', matt2));

var matt3 = new User();

matt3.replay(events);

console.log('had we not taken the snapshot, but instead persisted our events...')
console.log('we could reconstitute our entity just from the events: %j', matt3)