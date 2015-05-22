  // used to extract new directory based tests from old html structure

  var fs          = require('fs'),
      path        = require('path'),
      request     = require('request'),
      cheerio     = require('cheerio'),
      mkdirp      = require('mkdirp'),
      handlebars  = require('handlebars'),
      moment      = require('moment'),
      beautify    = require('js-beautify').js_beautify,
      Parser      = require('microformat-node').Parser,
      parser      = new Parser();

      v1urls = [
              'http://localhost:3009/adr.html',
              'http://localhost:3009/geo.html',
              'http://localhost:3009/hcalendar.html',
              'http://localhost:3009/hcard.html',
              'http://localhost:3009/hnews.html',
              'http://localhost:3009/hproduct.html',
              'http://localhost:3009/hentry.html',
              'http://localhost:3009/hresume.html',
              'http://localhost:3009/hreview-aggregate.html',
              'http://localhost:3009/hreview.html',
              'http://localhost:3009/hreview.html',
              'http://localhost:3009/includes.html'
              ];
              
        v2urls = ['http://localhost:3009/h-adr.html',
              'http://localhost:3009/h-card.html',
              'http://localhost:3009/h-event.html',
              'http://localhost:3009/h-entry.html',
              'http://localhost:3009/h-geo.html',
              'http://localhost:3009/h-news.html',
              'http://localhost:3009/h-org.html',
              'http://localhost:3009/h-product.html',
              'http://localhost:3009/h-recipe.html',
              'http://localhost:3009/h-resume.html',
              'http://localhost:3009/h-review-aggregate.html',
              'http://localhost:3009/h-review.html',
              'http://localhost:3009/rel.html',
              'http://localhost:3009/url.html'
              ];
              
              
        mixedurls = [
          'http://localhost:3009/mixed-versions.html',
          ]        


  function buildTests(){
    getChangeLogTemplate(function(err, html){
      buildVersionTests( v1urls, 'microformats-v1', html );
      buildVersionTests( v2urls, 'microformats-v2', html );
      buildVersionTests( mixedurls, 'microformats-mixed', html );
    });
  }
  
  
  function getChangeLogTemplate( callback ){
    var filePath = path.resolve(__dirname , '../templates/change-log.html');
    fs.readFile(filePath,{'encoding': 'utf-8'}, callback);
  }
  
  
  
 function buildVersionTests( pageURLs, versionName, template ){
    var i  = pageURLs.length,
        x   = 0;
        
    while (x < i) {
      var testUrl = pageURLs[x];
        writeTestSuite( testUrl, versionName, template );
        x++;
    }
   
  }
  
  
  
  // writes a test-suite from page url
  function writeTestSuite(testUrl, versionName, template) {
    var url = testUrl;
    getBodyText(url, function(err, html){
      if(html){
         var testFixturesJSON = parseTestFixtures(html, url),
             testSuiteJSON = parseTestSuite(html, url);
        
         writeChangeLogFile(testFixturesJSON, testSuiteJSON, versionName, template);      
         writeTestFixtures(testFixturesJSON, testSuiteJSON, versionName);
      }else{
          console.log(err)
      }
    });
  }


  // get body text from page
  function getBodyText(url, callback){
    request({uri: url}, function(requestErrors, response, body){
      if(!requestErrors && response.statusCode === 200){
          callback(null, body)
        }else{
          callback(requestErrors, null)
      }  
    });
  }

  
  // get mf fixture json from html
  function parseTestFixtures(html, url){
    var dom, rootNode, options;
    options = {
      filters: ['h-x-test-fixture'],
      includes: false
    }
    dom = cheerio.load(html);
    rootNode = dom.root();

    return parser.get(dom, rootNode, options).data;
  }


  // get mf suite json from html
  function parseTestSuite(html, url){
    var dom, rootNode, options;
    options = {
      filters: ['h-x-test-suite'],
      includes: false
    }
    dom = cheerio.load(html);
    rootNode = dom.root();

    return parser.get(dom, rootNode, options).data;
  }


 
  // loops test-fixture json
  function writeTestFixtures(testFixtures, testSuite, versionName, template){
      var i = testFixtures.items.length;
      var x = 0;
      while (x < i) {
         var testFixture = testFixtures.items[x]
         if(testFixture && testFixture.properties){
            if(testFixture.properties['x-output'] && testFixture.properties['x-microformat']){
              writeTestFixtureFiles(testFixture, versionName);
            }
          }else{
            console.log('is not a test-fixture or is empty')
          }
          x++;
      }
  }




  // write files for each test-fixture
  function writeTestFixtureFiles(testFixture, versionName){
    var p = testFixture.properties,
        name = p.name[0],
        formatName = p.format[0],
        testName = p.url[0].replace('http://localhost:3009/',''),
        json = p['x-output'][0].html,
        html = p['x-microformat'][0].html;
        
   var expected = JSON.parse( json.replace(/&lt;/g,"<").replace(/&gt;/g,">") );
   
   // add rels object if it not in expected output
   if(expected.rel === undefined){
     expected.rels = {};
   }     
    
    var dirPath = path.resolve(__dirname , '../tests/'+ versionName + '/' + formatName + '/'),
        fileHTMLName = testName + '.html',
        fileJSONName = testName + '.json';
   
    mkdirp(dirPath, function (err) {
      if (err) {
        console.error(err)
      }else {
        writeFile(dirPath + '/' +  fileHTMLName, html, function(err){
           if (err) { console.error(err)}
        });
        writeFile(dirPath + '/' + fileJSONName, beautify(JSON.stringify(expected)), function(err){
           if (err) { console.error(err)}
        });
      }
    });
    
  }
  
  
   // write change log file
  function writeChangeLogFile(testFixture, testSuite, versionName, template){
    var format = testFixture.items[0].properties.format[0],
        p = testSuite.items[0].properties,
        name = p.name[0],
        description = p.description,
        author = p.author,
        history = p['x-history'],
        contributors = (testSuite.children)? testSuite.children : [];
        
    var out = {
      name: name,
      description: description,
      format: format,
      author: author,
      history: history,
    }
    
    var newHistoryItem = {
      "value": "Broke old HTML format into small files to aid simpler testing: 21 May 2014 by Glenn Jones",
      "type": [
        "h-entry"
      ],
      "properties": {
        "name": [
          "Broke old HTML format into small files to aid simpler testing"
        ],
        "published": [
          "2014-05-21"
        ],
        "author": [
          "Glenn Jones"
        ]
      }
    }
    out.history.unshift( newHistoryItem );
    
    if(Array.isArray(contributors) && Array.isArray(author)){
      out.author = author.concat(contributors);
    }
    
    out.description = description.map(function(item) {
      return item
              .replace('This page was design to test', 'The files in this directory where designed to test')
              .replace('These tests are part of the micorformats 2 test suite.', '');
    });
    
    history.forEach(function(item) {
      item.publishedDateString = moment(item.properties.published[0]).format('D MMMM YYYY')
    });
    
    var compileTemplate = handlebars.compile(template);
    var html = compileTemplate(out);
    
   
    var dirPath = path.resolve(__dirname , '../tests/'+ versionName + '/' + format + '/');
    mkdirp(dirPath, function (err) {
      if (err) {
        console.error(err)
      }else {
        writeFile(dirPath + '/change-log.html', html, function(err){
           if (err) { console.error(err)}
        });
      }
    });
    
  }
  
  
  // ---------------------
 

 // writes a file to file-system
 function writeFile(path, content){
    fs.writeFile(path, content, 'utf8', function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log('The file: ' + path + ' was saved');
      }
    }); 
  }

  // replaces quotes and return chars to escape string for javascript
  function escapeText(str){
      var out = JSON.stringify(str);
      return out.substr(1,out.length-2);
  }


  function isString(obj) {
      return typeof (obj) == 'string';
  };

  exports.buildTests = buildTests;
