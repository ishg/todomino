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
  var Lists = {
    getAll: function(){
      var lists = [];
      var ref = $firebaseArray(firebase.database().ref('/lists/'));
      ref.$loaded().then(function(){
        ref.forEach(function(el, index, arr){
          lists.push({
            name: el.name,
            formControl: "",
            items: $firebaseArray(firebase.database().ref('/lists/' + el.$id + '/items/'))
          })
        })
      })
      return lists;
    },
    getList: function(id){
      var ref = firebase.database().ref('/lists/' + id);
      return $firebaseArray(ref);
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
  function($rootScope, $state, $scope, Auth, Users, Lists, $firebaseArray){
  $('.modal-trigger').leanModal();

  // ITEMS
  $scope.lists = Lists.getAll();
 
  $scope.createItem = function(list) {
    list.items.$add(
      {
        "text": list.formControl, 
        "done": false,
        "createdBy": $scope.firebaseUser.$id,
        "completedBy": ""
      }).then(function(ref){
        list.formControl = ""
      }).catch(function(error){
        console.log("ERROR: " + error);
      });
  };

  $scope.checkItem = function(list, item){
    var index = list.items.$indexFor(item.$id);
    list.items[index].done = !item.done;
    if(list.items[index].done){
      var user = Users.getProfile($scope.firebaseUser.$id);
      user.$loaded().then(function(){
        list.items[index].completedBy = user.firstName;
        list.items.$save(index);
      })
    }else{
      list.items[index].completedBy = ""
      list.items.$save(index);
    }
  }

  $scope.deleteItem = function(list, item) {
    list.items.$remove(item);
  }

  $scope.createList = function(){
    var list = $firebaseArray(firebase.database().ref('/lists/'));
    list.$add({ name: $scope.createListForm, items: {} }).then(function(ref) {
      var id = ref.key;
      $scope.lists.push({
        name: $scope.createListForm,
        formControl: '',
        items: $firebaseArray(firebase.database().ref('/lists/' + id + '/items/'))
      })
      $scope.createListForm = "";
    });
    
  }

  //AUTHENTICATION

  var loggedInUser = Auth.$getAuth();

  $scope.firebaseUser = Users.getProfile(loggedInUser.uid);

  $scope.signOut = function(){
    $scope.lists.forEach(function(el, index, arr){
      el.items.$destroy();
    })
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

