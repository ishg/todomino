angular.module('toDomino', ['ui.router', 'firebase'])

.run(["$rootScope", "$state", function($rootScope, $state) {
  $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
    // We can catch the error thrown when the $requireSignIn promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $state.go("auth");
    }
  });
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
  return $firebaseArray(firebase.database().ref().child('todos'));
})

.factory('Items', function($firebaseArray){
  return $firebaseArray(firebase.database().ref().child('items'));
})

.factory('Notes', function($firebaseArray){
  return $firebaseArray(firebase.database().ref().child('notes'));
})

.factory('Auth', function($firebaseAuth){
  return $firebaseAuth();
})

.controller('mainController', 
  function($state, $http, $scope, $firebaseArray, Todos, Notes, Items, Auth){
  
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
    var index = Todos.$indexFor(todo.$id);
    Todos[index].done = !todo.done;
    Todos.$save(index);
  }

  // delete a todo after checking it
  $scope.deleteTodo = function(id) {
    $scope.todos.$remove(id);  
  };

  Items.$loaded()
    .then(function(){
      console.log("Items Loaded");
      $scope.items = Items;
    }).catch(function(error){
      console.log("ERROR: " + error);
    });
 
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
    var index = Items.$indexFor(item.$id);
    Items[index].done = !item.done;
    Items.$save(index);
  }

  // delete a todo after checking it
  $scope.deleteItem = function(id) {
    $scope.items.$remove(id);
  }

  $scope.signOut = function(){
    Auth.$signOut().then(function(){
      console.log("signed out user");
    })
  }
  
  Auth.$onAuthStateChanged(function(firebaseUser){
    if(firebaseUser){
      $scope.firebaseUser = firebaseUser;
    }else{
      $state.go('auth');
    }
  });

  var firebaseUser = Auth.$getAuth();

  if (firebaseUser) {
    console.log("Signed in as:", firebaseUser.uid);
  } else {
    console.log("Signed out");
  }

})

.controller('AuthCtrl', function($scope, $state, $location, Auth){
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
    Auth.$signInWithEmailAndPassword(authCtrl.user.email, authCtrl.user.password)
      .then(function(firebaseUser) {
        $state.go('home');
      }).catch(function(error) {
        authCtrl.error = error;
      });
  }
});

