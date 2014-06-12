'use strict';

angular.module('NereidChatApp')
  .controller('MainCtrl', [
    '$scope', '$location', 'nereidAuth', 'nereidChat', '$window',
    function ($scope, $location, nereidAuth, nereidChat, $window) {
      $scope.basePath = 'http://localhost:5000';
      $scope.userInfoPath = '/me';
      $scope.login = function (){
        nereidAuth.setapiBasePath($scope.basePath);
        nereidAuth.setUserInfoEndpoint($scope.userInfoPath);
        nereidAuth.refreshUserInfo();
        nereidChat.setBasePath($scope.basePath);

        nereidAuth.login($scope.username, $scope.password)
        .then(
          function () {
            // on success
            $scope.loggedIn = true;
          },
          function () {
            //  Login Failed
            $scope.loggedIn = false;
            $window.alert('Login Failed');
          }
        );
      };
    }]
  );
