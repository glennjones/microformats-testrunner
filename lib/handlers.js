'use strict';
var path        		= require('path'),
	Microformats		= require('microformat-node'),
	Boom				= require('boom'),
	beautify        	= require('js-beautify').js_beautify,
	moment      		= require('moment'),
	pack		  		= require('../package.json'),
	config		  		= require('../config.json'),
	runCollection		= require('./run.js'),
	testCollection		= require('./test.js'),
	testPath			= require('./testPath.js'),
	testBuilder			= require('./testBuilder.js'),
	testRunner			= require('./testRunner.js');


function index(request, reply) {
	
	testCollection.getTestsGroupedByVersion( testPath.getLocalPath({},config), config.versions, function(err, tests){
		reply.view('index.html', {
			testSuiteVersion: pack.version,
			runList: runCollection.getList( config.parsers, config.versions ),
			config: config,
			tests: tests
		});	
    });
	
		
}

function test(request, reply) {
	var reqinfo = {}
	
	if(request.params.version){
		reqinfo.version = request.params.version;
	}
	if(request.params.format){
		reqinfo.format = request.params.format;
	}
	if(request.params.name){
		reqinfo.name = request.params.name;
	}
	
	var filePath = testPath.getLocalPath( {
			version: reqinfo.version,
			format: reqinfo.format,
			name: reqinfo.name,
		}, config );
		
	var changeLogFilePath = testPath.getLocalPath( {
			version: reqinfo.version,
			format: reqinfo.format,
			changeLog: true,
		}, config );
	
	
	testCollection.getTest( filePath, function(err, test){
		test.jsonstring = beautify( JSON.stringify(test.json) );
		
		testCollection.getTestChangeLog( changeLogFilePath, function(err, changeLog){
			var metadata = {};
			metadata.descriptions = changeLog.items[0].properties.description;
			metadata.authors = changeLog.items[0].properties.author;
			metadata.history = changeLog.items[0].children;
			
			metadata.history.forEach(function(item) {
		      item.publishedDateString = moment(item.properties.published[0]).format('D MMMM YYYY')
		    });
			
			reply.view('test.html', {
				testSuiteVersion: pack.version,
				request: reqinfo,
				config: config,
				test: test,
				metadata: metadata
			});	
		});	
	})
}

function runtest(request, reply) {
	var reqinfo = {
		type: 'html',
		mode: 'strict'
	}
	
	if(request.params.parser){
		reqinfo.parser = request.params.parser;
	}
	if(request.params.version){
		reqinfo.version = request.params.version;
	}
	if(request.params.format){
		reqinfo.format = request.params.format;
	}
	if(request.params.name){
		reqinfo.name = request.params.name;
	}
	
	testRunner.runTest(reqinfo.parser, reqinfo.version, reqinfo.format, reqinfo.name, function( err, result ){
		
		result.jsonString = beautify(JSON.stringify(result.json));
		result.resultString = beautify(JSON.stringify(result.result));
		if(result.differences){
			result.differencesString = beautify(JSON.stringify(result.differences));
		}
		
		reply.view('testrunner-test.html', {
			testSuiteVersion: pack.version,
			request: reqinfo,
			config: config,
			result: result,
		});
	});
}



function runtests(request, reply) {
	var reqinfo = {
		type: 'html',
		mode: 'strict'
	};
	
	if(request.params.parser){
		reqinfo.parser = request.params.parser;
	}
	if(request.params.version){
		reqinfo.version = request.params.version;
	}
	if(request.params.format){
		reqinfo.format = request.params.format;
	}
	if(request.params.name){
		reqinfo.name = request.params.name;
	}
	
	
	//additional flags
	if(request.query.type){
		reqinfo.type = request.query.type;  // html or json
	}
	
	if(request.query.mode){
		reqinfo.mode = request.query.mode;  // strict or tolerant
	}
	
	// add selected status to config
	addSelectedFlag( reqinfo, config )
	
	testRunner.runTests(reqinfo.parser, reqinfo.version, function(err,results){
		reply.view('testrunner.html', {
			testSuiteVersion: pack.version,
			request: reqinfo,
			config: config,
			counts: getPassRateCounts(results),
			results: results,
		});
	});

}


// creates counts for results
function getPassRateCounts(results){
	var out = {
			passed: 0,
			passedPercentage: 0,
			count: results.length
		};
		
	results.forEach(function(item){
		if(item.passed === true){
			out.passed ++;
		}
	});
	
	out.passedPercentage = (out.passed / (out.count/100)).toFixed(1);
	return out;
}


// uses request information to flag selected item
function addSelectedFlag( reqinfo, config ){
	config.parsers.forEach(function(item){
		delete item.selected;
		if(reqinfo.parser === item.name){
			item.selected = true;
		}
	});
	config.versions.forEach(function(item){
		delete item.selected;
		if(reqinfo.version === item.name){
			item.selected = true;
		}
	});
}


function microformatsParseUrl(request, reply) {
	var options = {};
	Microformats.parseUrl(request.query.url, options, function(err, data){
		if(!err && data){
			reply(data).type('application/json; charset=utf-8');
		}else{
			if(err && err[0].error.indexOf('Invalid URI') > -1){
				reply( Boom.badRequest('Passed URL is incorrected', request.query.url) )
			}else if(err && err[0].error.indexOf('ENOTFOUND') > -1){
				reply( Boom.badRequest('Passed URL cound not be found', request.query.url) )
			}else{
				reply( Boom.badImplementation() );	
			}
		}
	});
}


function testbuilder(request, reply) {
	testBuilder.buildTests();
}



exports.index = index;
exports.test = test;
exports.runtest = runtest;
exports.runtests = runtests;
exports.microformatsParseUrl = microformatsParseUrl;
exports.testbuilder = testbuilder;





