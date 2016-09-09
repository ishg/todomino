// set up

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');

// configuration

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended': true}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}))
app.use(methodOverride());

// routes

  // application
  
  app.get('*', function(req,res){
    res.sendFile('./public/index.html');
  });

  // authentication


  
// list (start app with node.js)
app.listen(process.env.PORT || 5000);
console.log("ToDomino listening on port 5000");
