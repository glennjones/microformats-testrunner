'use strict';
var path        		= require('path'),
	Microformats		= require('microformat-node'),
	mfTest				= require('microformat-tests'),
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


// common function for collect path data
function getPathObject(request){
	var reqinfo = {
		type: 'html',
		mode: 'strict' // strict or tolerant
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
	
	return reqinfo;
}



function index(request, reply) {
	var options = getPathObject(request);
	
	testCollection.getTestsGroupedByVersion( testPath.getLocalPath({},config), config.versions, options, function(err, tests){
		reply.view('index.html', {
			testSuiteVersion: mfTest.version,
			runList: runCollection.getList( config.parsers, config.versions ),
			config: config,
			tests: tests
		});	
    });
		
}


function test(request, reply) {
	var reqinfo = getPathObject(request);
	
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
				testSuiteVersion: mfTest.version,
				request: reqinfo,
				config: config,
				test: test,
				metadata: metadata
			});	
		});	
	})
}


// display the HTML for a single test
function testHTML(request, reply) {
	var reqinfo = getPathObject(request),
		filePath = testPath.getLocalPath( reqinfo, config );
		
	testCollection.getTest( filePath, function(err, test){
		reply(test.html).type('text/html');
	});
}

// display the HTML for a single test
function testJSON(request, reply) {
	var reqinfo = getPathObject(request),
		filePath = testPath.getLocalPath( reqinfo, config );
		
	testCollection.getTest( filePath, function(err, test){
		test.jsonstring = beautify( JSON.stringify(test.json) );
		reply(test.jsonstring).type('application/json');
	});
}



function runtest(request, reply) {
	var options = getPathObject(request);
	
	testRunner.runTest(options, function( err, result ){
		
		result.jsonString = beautify(JSON.stringify(result.json));
		result.resultString = beautify(JSON.stringify(result.result));
		if(result.differences){
			result.differencesString = beautify(JSON.stringify(result.differences));
		}
		
		reply.view('testrunner-test.html', {
			testSuiteVersion: mfTest.version,
			request: options,
			config: config,
			result: result,
		});
	});
}



function runtests(request, reply) {
	var options = getPathObject(request);
	
	//additional flags
	if(request.query.type){
		options.type = request.query.type;  // html or json
	}
	
	if(request.query.mode){
		options.mode = request.query.mode;  // strict or tolerant
	}
	
	// add selected status to config
	addSelectedFlag( options, config )
	
	testRunner.runTests(options, function(err,results){
		reply.view('testrunner.html', {
			testSuiteVersion: mfTest.version,
			request: options,
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
exports.testHTML = testHTML;
exports.testJSON = testJSON;
exports.runtest = runtest;
exports.runtests = runtests;
exports.microformatsParseUrl = microformatsParseUrl;
exports.testbuilder = testbuilder;





