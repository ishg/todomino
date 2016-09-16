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

.factory('Auth', function($firebaseAuth){
  return $firebaseAuth();
})

.factory('Lists', function($firebaseArray, $firebaseObject){
  var lists = []
  var Lists = {
    newListRef: function(name){
      var ref = firebase.database().ref('/' + name);
      lists.push({
        name: name,
        ref: ref
      });
      return $firebaseArray(ref);
    },
    getAll: function(){
      return lists;
    },
    getList: function(name){
      return lists.find(function(item){
        return item.name == name;
      });
    }
  }
  return Lists;
})

.factory('Users', function($firebaseObject){

  var Users = {
    newUserRef: function(user){
      var ref = firebase.database().ref('/users/' + user.uid);
      return $firebaseObject(ref);
    },
    getProfile: function(uid){
      var ref = firebase.database().ref('/users/' + uid);
      return $firebaseObject(ref);
    }
  };

  return Users;
})

.controller('mainController', 
  function($rootScope, $state, $scope, Auth, Users, Lists){

  $scope.formData = {};
  $scope.shopformData = {};

  //TODOS

  $rootScope.stateIsLoading = true;

  $scope.todos = Lists.newListRef('todos');

  $scope.todos.$loaded().then(function(){ $rootScope.stateIsLoading = false;})
 
  $scope.createTodo = function() {
    $scope.todos.$add(
      {
        "text": $scope.formData.text, 
        "done": false,
        "createdBy": $scope.firebaseUser.$id,
        "completedBy": ""
      }).then(function(ref){
        $scope.formData = {};
      }).catch(function(error){
        console.log("ERROR: " + error);
      });
  };

  $scope.checkTodo = function(todo){
    var index = $scope.todos.$indexFor(todo.$id);
    $scope.todos[index].done = !todo.done;
    if($scope.todos[index].done){
      var user = Users.getProfile($scope.firebaseUser.$id);
      user.$loaded().then(function(){
        $scope.todos[index].completedBy = user.firstName;
        $scope.todos.$save(index);
      })
    }else{
      $scope.todos[index].completedBy = ""
      $scope.todos.$save(index);
    }
    
  }

  $scope.deleteTodo = function(id) {
    $scope.todos.$remove(id);  
  };

  // ITEMS

  $rootScope.stateIsLoading = true;

  $scope.items = Lists.newListRef('items');

  $scope.items.$loaded().then(function(){ $rootScope.stateIsLoading = false;})
 
  $scope.createItem = function() {
    $scope.items.$add(
      {
        "text": $scope.shopformData.text, 
        "done": false,
        "createdBy": $scope.firebaseUser.$id,
        "completedBy": ""
      }).then(function(ref){
        $scope.shopformData = {}
      }).catch(function(error){
        console.log("ERROR: " + error);
      });
  };

  $scope.checkItem = function(item){
    var index = $scope.items.$indexFor(item.$id);
    $scope.items[index].done = !item.done;
    if($scope.items[index].done){
      var user = Users.getProfile($scope.firebaseUser.$id);
      user.$loaded().then(function(){
        $scope.items[index].completedBy = user.firstName;
        $scope.items.$save(index);
      })
    }else{
      $scope.items[index].completedBy = ""
      $scope.items.$save(index);
    }
  }

  $scope.deleteItem = function(id) {
    $scope.items.$remove(id);
  }

  //AUTHENTICATION

  var loggedInUser = Auth.$getAuth();

  $scope.firebaseUser = Users.getProfile(loggedInUser.uid);

  $scope.signOut = function(){
    $scope.todos.$destroy();
    $scope.items.$destroy();
    $scope.firebaseUser.$destroy();
    Auth.$signOut().then(function(){
      $state.go('auth');
    })
  }

})

.controller('AuthCtrl', function($rootScope, $scope, $state, $location, Auth, Users){
  $('ul.tabs').tabs();
  
  var authCtrl = this;

  authCtrl.user = {
    email: '',
    password: '',
    firstName : '',
    lastName: ''
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
        saveUser(firebaseUser);
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
        authCtrl.error = error;
      });
  }

  function saveUser(userData){
    var user = Users.newUserRef(userData);
    user.firstName = authCtrl.user.firstName;
    user.lastName = authCtrl.user.lastName;
    user.email = userData.email;

    user.$save().then(function(){
      authCtrl.user.firstName = null;
      authCtrl.user.lastName = null;
      authCtrl.user.password = null;
      authCtrl.user.email = null;
      user.$destroy();
    }, function(error){
      console.log(error);
    });
  }

});

