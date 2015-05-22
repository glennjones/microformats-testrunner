

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
      
	  
	function runTest( parserName, version, format, name, callback ){
     var filePath = testPath.getLocalPath( {
    			version: version,
    			format: format,
          name: name,
    			fileFormat: 'json',
    		}, config );
     
     testCollection.getTest( filePath, function(err, data){
        //console.log(JSON.stringify(data));
        runAgainstParser( parserName, [data], function(err, results){
          //console.log(JSON.stringify(results));
          if(Array.isArray(results)){
            results = results[0];
          }
          callback(err, results);
        });
     });
  }
  
  
  function runTests( parserName, version, callback ){
    
    
    testCollection.getTestList(testPath.getLocalPath({},config), version, function(err, fileList){
       testCollection.getTests( fileList, function(err, data){
        //console.log(JSON.stringify(data));
        runAgainstParser( parserName, data, function(err, results){
          //console.log(JSON.stringify(results));
          callback(err, results);
        });
      });
    });
  }
  
  
   // data from two files needed for runnning a test
  function runAgainstParser( parserName, testData, callback ){
    var out = {};
    
    var parserConfig = getParserConfig(parserName);
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
      var req = request.post(url, {strictSSL: false}, function (err, response, body) {
        if (!err && response.statusCode == 200) {
          out.result = JSON.parse(body);
          callback(null, out);
        }else{
          callback(err, out);
        }
      })
      // add form fileds
      var form = req.form();
      form.append(parserConfig.htmlPropertyName, test.html);
      if(parserConfig.baseURLPropertyName){
        form.append(parserConfig.baseURLPropertyName, 'http://example.com');
      }
    }
    

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
  

 exports.runTest = runTest; 
 exports.runTests = runTests;