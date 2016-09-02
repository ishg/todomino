var toDomino = angular.module('toDomino', []);

function mainController($scope, $http){
  $scope.formData = {};
  $scope.shopformData = {};
  
  $http.get('/api/todos')
    .success(function(data){
      $scope.todos = [];
      
      for (var i in data) {
        $scope.todos.push({
          "id": i,
          "text": data[i]
        })
      }  
    })
    .error(function(data){
      console.log('Error: ' + data);  
    })
  
  // when submitting the add form, send the text to the node API
  $scope.createTodo = function() {
      $http.post('/api/todos', $scope.formData)
          .success(function(data) {
              $scope.formData = {}; // clear the form so our user is ready to enter another
              $scope.todos = [];
      
              for (var i in data) {
                $scope.todos.push({
                  "id": i,
                  "text": data[i]
                })
              }
              console.log(data);
          })
          .error(function(data) {
              console.log('Error: ' + data);
          });
  };

  // delete a todo after checking it
  $scope.deleteTodo = function(id) {
      console.log(id);
      setTimeout(function(){
        $http.delete('/api/todos/' + id)
          .success(function(data) {
              $scope.todos = [];
      
              for (var i in data) {
                $scope.todos.push({
                  "id": i,
                  "text": data[i]
                })
              }
              console.log(data);
          })
          .error(function(data) {
              console.log('Error: ' + data);
          });
      }, 500);
      
  };
  
  $http.get('/api/items')
    .success(function(data){
      $scope.items = [];
      
      for (var i in data) {
        $scope.items.push({
          "id": i,
          "text": data[i]
        })
      }  
    })
    .error(function(data){
      console.log('Error: ' + data);  
    })
  
  // when submitting the add form, send the text to the node API
  $scope.createItem = function() {
      $http.post('/api/items', $scope.shopformData)
          .success(function(data) {
              $scope.shopformData = {}; // clear the form so our user is ready to enter another
              $scope.items = [];
      
              for (var i in data) {
                $scope.items.push({
                  "id": i,
                  "text": data[i]
                })
              }
              console.log(data);
          })
          .error(function(data) {
              console.log('Error: ' + data);
          });
  };

  // delete a todo after checking it
  $scope.deleteItem = function(id) {
      console.log(id);
      setTimeout(function(){
        $http.delete('/api/items/' + id)
          .success(function(data) {
              $scope.items = [];
      
              for (var i in data) {
                $scope.items.push({
                  "id": i,
                  "text": data[i]
                })
              }
              console.log(data);
          })
          .error(function(data) {
              console.log('Error: ' + data);
          });
      }, 500);
      
  };
  
  
  
}