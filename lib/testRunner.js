

  var fs              = require('fs'),
      path            = require('path'),
      dir             = require('node-dir'),
      request         = require('request'),
      moment          = require('moment'),
      diff            = require('deep-diff').diff,
      beautify        = require('js-beautify').js_beautify,
      testPath			  = require('./testPath.js'),
      testCollection	= require('./test.js'),
      config		      = require('../config.json');
  
  
  // sorts out nodes issues with certs    
  // https://github.com/coolaj86/node-ssl-root-cas    
  require('ssl-root-cas/latest').inject();    
      
	  
	function runTest( options, callback ){
    var fileOption = clone(options);
    
    fileOption.fileFormat = 'json';
    var filePath = testPath.getLocalPath( fileOption, config );
     
     testCollection.getTest( filePath, options, function(err, data){
        //console.log(JSON.stringify(data));
        runAgainstParser( options, [data], function(err, results){
          //console.log(JSON.stringify(results));
          if(Array.isArray(results)){
            results = results[0];
          }
          callback(err, results);
        });
     });
  }
  
  
  function runTests( options, callback ){
    
    testCollection.getTestList(testPath.getLocalPath({},config), options.version, function(err, fileList){
       testCollection.getTests( fileList, options, function(err, data){
        //console.log(JSON.stringify(data));
        runAgainstParser( options, data, function(err, results){
          //console.log(JSON.stringify(results));
          callback(err, results);
        });
      });
    });
  }
  
  
   // data from two files needed for runnning a test
  function runAgainstParser( options, testData, callback ){
    var out = {};
    
    var parserConfig = getParserConfig(options.parser);
    //console.log(parserConfig);
    
    // loop with count when complete fire callback
    
    var out = [],
        count = 0;
        
    testData.forEach(function(testItem){
      getTestResults(parserConfig, testItem, function(err, test){
         if(err !== null){
           test = (test)? test: {};
           test.err = err;
         }else{
           var differences = diff(test.json, test.result);
           if(differences === undefined){
             test.passed = true;
           }else{
             test.passed = false;
             test.differences = differences;
           }
         }
         if(options && options.mode === 'tolerant'){
           filterTolerant( test );
         }
         out.push(test);
         
        count++;
        //console.log(count, fileList.length)
        if(count === testData.length){
          out =  testCollection.sortTestByFormatName(out);
          callback(null, out);
        }  
      });
    });
  }
  

  
  // gets tests results from web based API
  function getTestResults(parserConfig, test, callback){
    var out = test;
    
    // if API is GET based
    if(parserConfig.method === 'get'){
      var url = parserConfig.url + '?' + parserConfig.htmlPropertyName +'=' + encodeURIComponent(test.html);
      if(parserConfig.baseURLPropertyName){
        url += '&' + parserConfig.baseURLPropertyName + '=' + encodeURIComponent('http://example.com');
      }
      request(url, {strictSSL: false}, function (err, response, body) {
        if (!err && response.statusCode == 200) {
          out.result = JSON.parse(body);
          callback(null, out);
        }else{
          callback(err, out);
        }
      })
    }

    // if API is POST based
    if(parserConfig.method === 'post'){
      var url = parserConfig.url;

      var form = {}
      form[parserConfig.htmlPropertyName] = test.html;
      if(parserConfig.baseURLPropertyName){
        form[parserConfig.baseURLPropertyName] = 'http://example.com';
      }
      if(parserConfig.strictProperty){
        form[parserConfig.strictProperty] = parserConfig.strictPropertyValue;
      }

      var req = request.post(url, {form: form, strictSSL: false}, function (err, response, body) {
        if (!err && response.statusCode == 200) {
          out.result = JSON.parse(body);
          callback(null, out);
        }else{
          callback(err, out);
        }
      });
    }
    
  }
  
  
  
  function filterTolerant( test ){
    return filterTopLevelAdditions( test );
  }
  
  
  function filterTopLevelAdditions(test){
    /*{
    "kind": "N",
    "path": ["rel-urls"],
    "rhs": "(see object with key rel-urls)"
    }*/
    if(test.differences){
      test.differences == test.differences.filter(function(item){
        if(item.kind === 'N' && item.path.length === 1){
          return false;
        }
        return true;
      });
      if(test.differences.length === 0){
        delete test.differences;
        test.passed = true;
      }
    }
    return test;
  }
  
  
  
  
  // get parser config based on name
  function getParserConfig(parserName){
    var out = null;
    config.parsers.forEach(function(item){
      if(item.name === parserName){
        out = item;
      }
    })
    return out;
  }
  
  function clone( obj ){
    return JSON.parse( JSON.stringify(obj) )
  }
  

 exports.runTest = runTest; 
 exports.runTests = runTests;