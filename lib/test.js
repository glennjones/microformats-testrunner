 
  var fs              = require('fs'),
      path            = require('path'),
      dir             = require('node-dir'),
      microformats    = require('microformat-node'),
      testPath			  = require('./testPath.js');

 
 
  // get an array of test objects
  function getTests( pathList, options, callback ){
    var out = [],
        count = 0;
        
    pathList.forEach(function(path){
        getTest( path, options, function(err,data){
          if(!err){
            out.push(data);
          }
          count++;
          //console.log(count, pathList.length)
          if(count === pathList.length){
            out = sortTestByFormatName(out);
            callback(null, out);
          }
        });
    });   
  }
 
 
  // get a test object
  function getTest( filePath, options, callback ){
    
    var out = {},
    pathItems = filePath.split('/');
    out.version = pathItems[pathItems.length-3],
    out.format = pathItems[pathItems.length-2];
    out.name = pathItems[pathItems.length-1].replace('.json','');  
        
    fs.readFile(filePath, {'encoding': 'utf-8'}, function(err, json){
       if(err){
         callback(err, null);
       }else{
          try {
             out.json = JSON.parse(json);
              //console.log(json)
             fs.readFile(filePath.replace('.json','.html'), {'encoding': 'utf-8'}, function(err, html){
                 if(err){
                   callback(err, null);
                 }else{
                   //console.log(html)
                   out.html = html;
                   callback(null, out);
                 }
             }); 
          }
          catch (e) {
            console.log('********************************');
            console.log(e, filePath);
            console.log('********************************');
            callback(e, null);
          }
       }
    });    
  }
  
  
  // get a test object
  function getTestChangeLog( filePath, callback ){
    fs.readFile(filePath, {'encoding': 'utf-8'}, function(err, html){
       if(err){
         callback(err, null);
       }else{
          microformats.parseHtml(html, {}, function(err, data){
              callback(err, data);
          });
       }
    });    
  }
  
  
  // gets an array of all the json test files
  function getTestList(	dirPath, versionName, callback){
    if(versionName && versionName !== 'all'){
         dirPath += versionName + '/';
    }
    dir.files(path.resolve(__dirname , dirPath), function(err, pathList) {
        if (!err && pathList){
          pathList = pathList.filter(function(item){
             if(item.indexOf('.html') === -1){
               return true;
             }else{
               return false;
             }
          });
          callback(null, pathList);
        }else{
          callback(err, null);
        }
    });
  }
  
  
  function getTestsGroupedByVersion( 	dirPath, versions, options, callback ){
      var count = 0,
          out = [];
      
      versions.forEach(function(version){
          getTestList(dirPath, version.name, function(err, fileList){
            getTests( fileList, options, function(err, data){
              // no need for all grouping
              if(version.name !== 'all'){
                out.push({
                  name: version.name,
                  items: data
                });
              }

              count ++;
              if(count === versions.length){
                // order as in versions object
                callback(err, orderGroupedByVersion(versions,out));
              }
            });
          });
       }); 
      
  }
  
  function orderGroupedByVersion(versions, data){
     var out = [];
     versions.forEach(function(version){
       data.forEach(function(testGroup){
         if(version.name == testGroup.name){
           out.push(testGroup);
         }
       });
     })
     return out;
  }
  
  
  // Sorts a array of tests by format and name
  function sortTestByFormatName(testData, reverse) {
      return testData.sort(sortTests(reverse));
  };
  
  
  // Sort for test objects
  function sortTests(reverse) {
      reverse = (reverse) ? -1 : 1;
      return function (a, b) {
          a = a.format + a.name;
          b = b.format + b.name;
          if (a < b) return reverse * -1;
          if (a > b) return reverse * 1;
          return 0;
      };
  };
  
  
  
  
  exports.getTest = getTest;
  exports.getTests = getTests;
  exports.getTestList = getTestList;
  exports.getTestsGroupedByVersion = getTestsGroupedByVersion;
  exports.getTestChangeLog = getTestChangeLog;
  exports.sortTestByFormatName = sortTestByFormatName;