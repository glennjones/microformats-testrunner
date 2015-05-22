var Hapi            = require('hapi'),
    Blipp           = require('blipp'),
    Pack            = require('./package'),
    Routes          = require('./lib/routes.js');


// Create a server with a host and port
var server = new Hapi.Server();

server.connection({ 
    host: (process.env.PORT)? '0.0.0.0' : 'localhost', 
    port: parseInt(process.env.PORT, 10) || 3009
});


// hapi server settings
server.route(Routes);
server.views({
        path: 'templates',
        engines: { html: require('handlebars') },
        partialsPath: './templates/withPartials',
        helpersPath: './templates/helpers',
        isCached: false
    })



var goodOptions = {
    opsInterval: 1000,
    reporters: [{
        reporter: require('good-console'),
        events: { log: '*', response: '*' }
    }]
};



// Register plug-in and start
server.register([{
    register: require('good'), 
    options: goodOptions
  },{
    register: require('blipp'), 
  }], function (err) {
      if (err) {
          console.error(err);
      }else {
          server.start(function () {
              console.info('Server started at ' + server.info.uri);
          });
      }
  });

/*

#!/usr/bin/env node

var app         = require('http').createServer(handler),
    fs          = require('fs'),
    path        = require('path'),    
    parser      = require('microformat-node'),
    testBuilder  = require('../lib/testBuilder.js'),
    testWriter  = require('../lib/testWriter.js');

 
function handler(req, res) {

  // get the query object
  var query = require('url').parse(req.url, true).query;


  if (req.url.indexOf('/update/') > -1 && !query.url) {
    testWriter.updateTests();
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end('<h1>Updated tests ...</h1>');
    
  }else if (req.url.indexOf('/build/') > -1 && !query.url) {
    testBuilder.buildTests();
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end('<h1>Built tests ...</h1>');

  }else if (req.url.indexOf('.html') > -1 && !query.url) {
    var parts = req.url.split('/');
    writeHTML('../' + parts[1]);

  }else if (req.url.indexOf('/javascript/') > -1 && !query.url) {
    writeJS(req.url);

  }else if (req.url.indexOf('/css/') > -1 && !query.url) {
    writeCSS(req.url);

  }else if (req.url.indexOf('/images/') > -1 && !query.url) {
    writeImages(req.url);
  }else{
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end('<h1>404 error - Not Found</h1>');
  }


  function writeHTML(filePath){
    res.writeHead(200, {'Content-Type': 'text/html'});
    filePath = path.resolve(__dirname, filePath);
    fs.readFile(filePath, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        res.end(page);
      }
    });
    return;
  };


  function writeJS(filePath){
    var parts = filePath.split('/javascript/');
    filePath = '../javascript/' + parts[1];
    filePath = path.resolve(__dirname, filePath);
    res.writeHead(200, {'Content-Type': 'text/javascript'});
    fs.readFile(filePath, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        res.end(page);
      }
    });
    return;
  };


  function writeCSS(filePath){
    var parts = filePath.split('/css/');
    filePath = '../css/' + parts[1];
    filePath = path.resolve(__dirname, filePath);
    res.writeHead(200, {'Content-Type': 'text/css'});
    fs.readFile(filePath, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        res.end(page);
      }
    });
    return;
  };


  function writeImages(filePath){
    var parts = filePath.split('/images/');
    filePath = '../images/' + parts[1];
    filePath = path.resolve(__dirname, filePath);
    res.writeHead(200, {'Content-Type': 'image/gif'});
    fs.readFile(filePath, function (err, img) {
      if(err) {
        console.log(err)
      }else{
        res.writeHead(200, {'Content-Type': 'image/gif' });
        res.end(img, 'binary');
      }
    });
    return;
  };




}

app.listen(8889, 'localhost');
console.log('App @ http://localhost:8889');


*/