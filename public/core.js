angular.module('toDomino', ['ui.router', 'firebase'])

.run(["$rootScope", "$state", function($rootScope, $state) {
  $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
    // We can catch the error thrown when the $requireSignIn promise is rejected
    // and redirect the user back to the home 
    if (error === "AUTH_REQUIRED") {
      $state.go("auth");
    }
  });

  $rootScope.$on('$stateChangeSuccess', 
  function(event, toState, toParams, fromState, fromParams){
    $rootScope.stateIsLoading = false;
  })

}])

.config(function($stateProvider, $urlRouterProvider){
  $urlRouterProvider.otherwise('/auth');
  $stateProvider
    .state('auth', {
      url: '/auth',
      templateUrl: 'components/auth/authView.html',
      controller: 'AuthCtrl as auth',
      resolve: {
        // controller will not be loaded until $waitForSignIn resolves
        // Auth refers to our $firebaseAuth wrapper in the factory below
        "currentAuth": ["Auth", function(Auth) {
          // $waitForSignIn returns a promise so the resolve waits for it to complete
          return Auth.$waitForSignIn();
        }]
      }
    })
    .state('home', {
      url: '/home', 
      templateUrl: '/components/dashboard/homeView.html',
      controller: 'mainController as main',
      resolve: {
        // controller will not be loaded until $requireSignIn resolves
        // Auth refers to our $firebaseAuth wrapper in the factory below
        "currentAuth": ["Auth", function(Auth) {
          // $requireSignIn returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireSignIn();
        }]
      }
    });
})

.factory('Todos', function($firebaseArray){
  function getTodos(){
    return $firebaseArray(firebase.database().ref().child('todos'));
  }
  return{
    getTodos: getTodos
  }
})

.factory('Items', function($firebaseArray){
  function getItems(){
    return $firebaseArray(firebase.database().ref().child('items'));  
  }
  return{
    getItems: getItems
  }
})

.factory('Auth', function($firebaseAuth){
  return $firebaseAuth();
})

.controller('mainController', 
  function($rootScope, $state, $http, $scope, Todos, Items, Auth){

  $scope.formData = {};
  $scope.shopformData = {};

  //TODOS

  $rootScope.stateIsLoading = true;

  $scope.todos = Todos.getTodos();

  $scope.todos.$loaded().then(function(){ $rootScope.stateIsLoading = false;})
 
  $scope.createTodo = function() {
    $scope.todos.$add(
      {
        "text": $scope.formData.text, 
        "done": false
      }).then(function(ref){
        $scope.formData = {};
      }).catch(function(error){
        console.log("ERROR: " + error);
      });
  };

  $scope.checkTodo = function(todo){
    var index = $scope.todos.$indexFor(todo.$id);
    $scope.todos[index].done = !todo.done;
    $scope.todos.$save(index);
  }

  $scope.deleteTodo = function(id) {
    $scope.todos.$remove(id);  
  };

  // ITEMS

  $rootScope.stateIsLoading = true;

  $scope.items = Items.getItems();

  $scope.items.$loaded().then(function(){ $rootScope.stateIsLoading = false;})
 
  $scope.createItem = function() {
    $scope.items.$add(
      {
        "text": $scope.shopformData.text, 
        "done": false
      }).then(function(ref){
        $scope.shopformData = {}
      }).catch(function(error){
        console.log("ERROR: " + error);
      });
  };

  $scope.checkItem = function(item){
    var index = $scope.items.$indexFor(item.$id);
    $scope.items[index].done = !item.done;
    $scope.items.$save(index);
  }

  $scope.deleteItem = function(id) {
    $scope.items.$remove(id);
  }

  //AUTHENTICATION

  $scope.firebaseUser = Auth.$getAuth();

  $scope.signOut = function(){
    $scope.todos.$destroy();
    $scope.items.$destroy();
    Auth.$signOut().then(function(){
      $state.go('auth');
    })
  }

})

.controller('AuthCtrl', function($rootScope, $scope, $state, $location, Auth){
  $('ul.tabs').tabs();
  
  var authCtrl = this;

  authCtrl.user = {
    email: '',
    password: ''
  };

  authCtrl.createUser = createUser;
  authCtrl.login = login;

  function createUser(){
    var firebaseUser = Auth.$getAuth();

    if(firebaseUser){
      Auth.$signOut();
    }

    Auth.$createUserWithEmailAndPassword(authCtrl.user.email, authCtrl.user.password)
      .then(function(firebaseUser) {
        console.log("User " + firebaseUser.uid + " created successfully!");
        login();
      }).catch(function(error) {
        authCtrl.error = error;
      });
  }

  function login(){
    $rootScope.stateIsLoading = true;
    Auth.$signInWithEmailAndPassword(authCtrl.user.email, authCtrl.user.password)
      .then(function(firebaseUser) {
        $state.go('home');
      }).catch(function(error) {
        console.log(error);
        authCtrl.error = error;
      });
  }
});

