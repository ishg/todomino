angular.module('toDomino', ['ui.router', 'firebase'])

.factory('Todos', function($firebaseArray){
  return $firebaseArray(firebase.database().ref().child('todos'));
})

.factory('Items', function($firebaseArray){
  return $firebaseArray(firebase.database().ref().child('items'));
})

.factory('Notes', function($firebaseArray){
  return $firebaseArray(firebase.database().ref().child('notes'));
})

.controller('mainController', function($http, $scope, $firebaseArray, Todos, Notes, Items){
    
  $scope.formData = {};
  $scope.shopformData = {};

  Todos.$loaded()
    .then(function(){
      console.log("Todos Loaded");
      $scope.todos = Todos;
    }).catch(function(error){
      console.log("ERROR: " + error);
    });
 
  $scope.createTodo = function() {
    $scope.todos.$add({"text": $scope.formData.text, "done": false}).then(function(ref){
      var id = ref.key;
      console.log("Added record with id " + id);
      $scope.formData = {};
    }).catch(function(error){
      console.log("ERROR: " + error);
    });
  };

  $scope.checkTodo = function(todo){
    var index = Todos.$indexFor(todo.$id);
    Todos[index].done = !todo.done;
    Todos.$save(index);
  }

  // delete a todo after checking it
  $scope.deleteTodo = function(id) {
    setTimeout(function(){
      $scope.todos.$remove(id);  
    }, 500);
  };

  Items.$loaded()
    .then(function(){
      console.log("Items Loaded");
      $scope.items = Items;
    }).catch(function(error){
      console.log("ERROR: " + error);
    });
 
  $scope.createItem = function() {
    $scope.items.$add({"text": $scope.shopformData.text, "done": false}).then(function(ref){
      var id = ref.key;
      console.log("Added record with id " + id);
      $scope.shopformData = {}
    }).catch(function(error){
      console.log("ERROR: " + error);
    });
  };

  // delete a todo after checking it
  $scope.deleteItem = function(id) {
    setTimeout(function(){
      $scope.items.$remove(id);  
    }, 500);
  };
})

.controller('AuthCtrl', function($scope, $firebaseAuth){

});

