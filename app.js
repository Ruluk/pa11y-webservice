'use strict';

var async = require('async');
var Hapi = require('hapi');
var MongoClient = require('mongodb').MongoClient;

module.exports = initApp;

// Initialise the application
function initApp (config, callback) {

	var app = module.exports = {
		server: new Hapi.Server(config.host, config.port, {}),
		database: null,
		model: {}
	};

	async.series([

		function (next) {
			MongoClient.connect(config.database, {server: {auto_reconnect: false}}, function (err, db) {
				app.db = db;
				next(err);
			});
		},

		function (next) {
			require('./model/result')(app, function (err, model) {
				app.model.result = model;
				next(err);
			});
		},

		function (next) {
			require('./model/task')(app, function (err, model) {
				app.model.task = model;
				next(err);
			});
		},

		function (next) {
			if (!config.dbOnly && process.env.NODE_ENV !== 'test') {
				require('./task/pa11y')(config, app);
			}
			next();
		},

		function (next) {
			if (!config.dbOnly) {
				app.server.addRoutes(require('./route/tasks')(app));
				app.server.addRoutes(require('./route/task')(app));
				app.server.start(next);
			} else {
				next();
			}
		}

	], function (err) {
		callback(err, app);
	});

}
