// set up

var express = require('express');
var app = express();
var firebase = require('firebase');
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

// firebase
var config = {
    apiKey: "AIzaSyC6-XFAoswCxwKHckrxVngFRGp6PMh65I8",
    authDomain: "todomino-9b402.firebaseapp.com",
    databaseURL: "https://todomino-9b402.firebaseio.com",
    storageBucket: "todomino-9b402.appspot.com",
  };
firebase.initializeApp(config);
var db = firebase.database();

// routes
  
  //api
  
  //get all todos
  app.get('/api/todos', function(req,res){
    console.log('Getting Todos');
    
    db.ref('/todos/').once('value').then(function(snapshot){
      res.send(snapshot.val());
    });
  });
  
  // create new todo
  app.post('/api/todos', function(req,res){
    db.ref('/todos/').push(req.body.text);
    db.ref('/todos/').once('value').then(function(snapshot){
      res.send(snapshot.val());
    });
    
  });

  // delete a todo
  app.delete('/api/todos/:todo_id', function(req,res){
    console.log('Deleting Todo');
    db.ref('/todos/' + req.params.todo_id).remove();
    db.ref('/todos/').once('value').then(function(snapshot){
      res.send(snapshot.val());
    });
  });

  // application
  
  app.get('*', function(req,res){
    res.sendFile('./public/index.html');
  });
  







// list (start app with node.js)
app.listen(8080);
console.log("ToDomino listening on port 8080");