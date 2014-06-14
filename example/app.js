'use strict';

angular.module('NereidChatApp', [
    'ngRoute',
    'openlabs.angular-nereid-auth',
    'openlabs.angular-nereid-chat'
  ])
  .config(['$httpProvider', function ($httpProvider) {
    /*
    X-Requested-With is removed by default.

    https://github.com/angular/angular.js/commit/3a75b1124d062f64093a90b26630938558909e8d
    */
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
  }])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
