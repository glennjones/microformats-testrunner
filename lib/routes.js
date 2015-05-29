'use strict';
var Hapi				= require('hapi'),
	Joi					= require('joi'),
	handlers			= require('./handlers.js');

module.exports = [{
	method: 'GET',
	path: '/',
	config: {
		description: 'Display menus for testrunner',
		handler: handlers.index
	}
},{
	method: ['GET'],
	path: '/run/{parser}/{version}/',
	config: {
		description: 'Runs microformats tests against a parser',
		handler: handlers.runtests
	}
},{
	method: ['GET'],
	path: '/run/{parser}/{version}/{format}/{name}/',
	config: {
		description: 'Runs a single microformats test against a parser',
		handler: handlers.runtest
	}
},{
	method: ['GET'],
	path: '/test/{version}/{format}/{name}/',
	config: {
		description: 'Display a single microformats test',
		handler: handlers.test
	}
},{
	method: ['GET'],
	path: '/test/{version}/{format}/{name}/html/',
	config: {
		description: 'Display the HTML for a single microformats test',
		handler: handlers.testHTML
	}
},{
	method: ['GET'],
	path: '/test/{version}/{format}/{name}/json/',
	config: {
		description: 'Display the JSON for a single microformats test',
		handler: handlers.testJSON
	}
},{
	method: ['GET'],
	path: '/textcontent/',
	config: {
		description: 'Uses browser to test textContent',
		handler: handlers.textcontent
	}
},{
	method: 'GET',
	path: '/build/',
	config: {
		handler: handlers.testbuilder
	}
},{
	method: 'GET',
	path: '/api/microformats/parse/',
	config: {
		handler: handlers.microformatsParseUrl,
		description: 'Parse microformats from a URL',
		notes: [
			'Parses microformats found in the HTML of URL',
			'Error status codes',
			'400, bad request',
			'404, not found',
			'500, internal server error'
		],
		tags: ['api'],
		validate: { 
			query: {
				url: Joi.string().uri({scheme: ['http','https']})
				.required()
				.description('the url to parse')
			}
		}
	}
},{
	method: 'GET',
	path: '/{path*}',
	handler: {
		directory: {
			path: './oldhtml',
			listing: true,
			index: true
		}
	}
},{
	method: 'GET',
	path: '/css/{path*}',
	handler: {
		directory: {
			path: './css',
			listing: true,
			index: true
		}
	}
},{
	method: 'GET',
	path: '/javascript/{path*}',
	handler: {
		directory: {
			path: './javascript',
			listing: true,
			index: true
		}
	}
}];