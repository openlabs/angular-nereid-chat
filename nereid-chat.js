'use strict';

angular.module('openlabs.angular-nereid-chat', [
    'openlabs.angular-nereid-auth'
  ])
  .directive('nereidChat', function (nereidChat, $rootScope) {
    return {
      templateUrl: 'views/nereid-chat/main.html',
      restrict: 'E',
      controller: function ($scope) {
        $scope.threads = [];

        function init() {
          nereidChat.startListening();
          nereidChat.getFriends()
            .success(function (result) {
              $scope.friends = result.friends;
            });
        }

        function openThread(thread) {
          var threads = $scope.threads.filter(function (elm) {
            return elm.id === thread.id;
          });
          if(threads.length === 0) {
            $scope.threads.unshift(thread);
          }
          else {
            thread = threads[0];
          }
          thread.closed = false;
        }

        $scope.startNewChat = function (friend) {
          nereidChat.startNewChat(friend.entity.id)
            .success(function (result) {
              /*jshint camelcase: false */
              openThread({
                id: result.thread_id,
                members: result.members
              });
            });
        };

        $rootScope.$on('nereid-chat::message', function(e, timestamp, message){
          var messageStanza = angular.copy(message);

          openThread({
            id: messageStanza.thread,
            members: messageStanza.members
          });
          $scope.$apply();  // Update thread on view

          $scope.$broadcast('nereid-chat::message::' + messageStanza.thread, messageStanza);
        });

        $rootScope.$on('nereid-chat::presence', function(e, timestamp, presence){
          var friend = $scope.friends.filter(function (friend) {
            return friend.entity.id === presence.entity.id;
          });
          if (friend.length) {
            friend[0].available = presence.available;
          }
          $scope.$apply(); // Update presence on view
        });

        $rootScope.$on('nereid-auth:login', function () {
          init();
        });

        $rootScope.$on('nereid-auth:logout', function () {
          // Stop Listening to chat channel
          nereidChat.stopListening();
        });

        init();
      }
    };
  })
  .directive('chatWindow', function (nereidChat) {
    return {
      templateUrl: 'views/nereid-chat/chat-window.html',
      restrict: 'E',
      terminal: false,
      scope: {
        thread: '=thread'
      },
      controller: function($scope) {
        $scope.messages = [];
        $scope.title = '';
        $scope.members = $scope.thread.members;
        $scope.minimize = false;
        $scope.closed = false;

        $scope.$on('nereid-chat::message::' + $scope.thread.id, function(event, message) {
          $scope.messages.push(message);
          $scope.members = message.members;
          $scope.$apply();
        });

        $scope.toggleMinimize = function () {
          $scope.minimize = !$scope.minimize;
        };
        $scope.close = function () {
          $scope.thread.closed = true;
        };
        $scope.sendChatMessage = function () {
          if(!$scope.newMessage || !$scope.newMessage.trim()) {
            return;
          }
          nereidChat.sendChatMessage($scope.thread.id, $scope.newMessage)
            .success(function () {
              $scope.newMessage = '';
            });
        };
      }
    };
  })
  .directive('chatLogs', function () {
    return {
      restrict: 'A',
      link: function(scope, element) {
        scope.$on('scrollChatLog', function() {
          var chatHeight = element.outerHeight();
          element.scrollTop(chatHeight);
        });
      }
    };
  })
  .directive('chatLogItem', function () {
    return {
      templateUrl: 'views/nereid-chat/chat-log.html',
      restrict: 'A',
      link: function postLink(scope) {
        if (scope.$last) {
          scope.$emit('scrollChatLog');
        }
      }
    };
  })
  .filter('createTitle', ['nereidAuth', function (nereidAuth) {
    return function (members) {
      var currentUser = nereidAuth.user().user;
      var otherMembers = members.filter(function (member) {
        return currentUser.id !== member.id;
      });
      return otherMembers.map(function (member) {
        return member.displayName;
      }).join(', ');
    };
  }])
  .factory('nereidChatCore', function ($rootScope, $q, $http) {
    var chatSSE = null;
    var baseUrl = '';
    var maxRetry = 3;  // maximum retry to refresh token

    function parseDate(isoString) {
      // Parse isoDateTimeString to JavaScript date object
      isoString = isoString.split('.', 1);
      return new Date(isoString[0] + '+00:00');
    }

    function getToken() {
      var deferred = $q.defer();
      if (localStorage.getItem('nereidChatToken')) {
        // Resolve if token in localStorage
        deferred.resolve(localStorage.getItem('nereidChatToken'));
      }
      else {
        // Else fetch from server and then resolve
        $http.post(baseUrl + '/nereid-chat/token')
          .success(function (result) {
            localStorage.setItem('nereidChatToken', result.token);
            deferred.resolve(result.token);
          })
          .error(function (reason) {
            deferred.reject(reason);
          });
      }
      return deferred.promise;
    }

    function listen(token) {
      if (!window.EventSource) {
        // SSE must be supported to listen
        return;
      }
      if (chatSSE) {
        // Close previous connection if any
        chatSSE.close();
      }
      chatSSE = new EventSource(baseUrl + '/nereid-chat/stream/' + token);
      /*
       * Listen to SSE events and broadcast message and presence.
       * 
       * name    : nereid-chat::message
       * args[0] : Date Object
       * args[1] : nereid.chat message JSON Object
       ------------------------------------
       *
       * name    : nereid-chat::presence
       * args[0] : Date Object
       * args[1] : nereid.chat presence JSON Object
       *
      **/

      chatSSE.addEventListener('error', function() {
        localStorage.removeItem('nereidChatToken');
        if (--maxRetry>0) {
          startListening();
        }
      });

      chatSSE.addEventListener('open', function() {
        maxRetry = 3;  // restore retry
      });

      chatSSE.addEventListener('message', function(event) {
        var result = angular.fromJson(event.data);

        if(result.type === 'presence'){
          $rootScope.$broadcast(
            'nereid-chat::presence',
            parseDate(result.timestamp),
            result.presence
          );
        }
        else if(result.type === 'message'){
          $rootScope.$broadcast(
            'nereid-chat::message',
            parseDate(result.timestamp),
            result.message
          );
        }
      });

    }

    function startListening() {
      getToken()
        .then(function (token) {
          listen(token);
        });
    }

    function stopListening() {
      if (chatSSE) {
        // Close connection if any
        chatSSE.close();
      }
    }

    function setBasePath(url) {
      // Set base url for nereid chat
      baseUrl = url;
    }

    return {
      setBasePath: setBasePath,
      startListening: startListening,
      stopListening: stopListening
    };
  })

  .factory('nereidChat', function ($http, nereidChatCore) {
    var baseUrl = '';

    function setBasePath(url) {
      // Set base url for nereid chat
      baseUrl = url;

      // Set config nereidChatCore
      nereidChatCore.setBasePath(url);
    }

    function startNewChat(nereidUserId) {
      return $http.post(baseUrl + '/nereid-chat/start-session', $.param({
        user: nereidUserId
      }));
    }

    function sendChatMessage(threadId, message) {
      return $http.post(baseUrl + '/nereid-chat/send-message', $.param({
        'thread_id': threadId,
        'message': message
      }));
    }

    function getFriends() {
      return $http.get(baseUrl + '/nereid-chat/get-friends');
    }

    return {
      setBasePath: setBasePath,
      startListening: nereidChatCore.startListening,
      stopListening: nereidChatCore.stopListening,
      getFriends: getFriends,
      startNewChat: startNewChat,
      sendChatMessage: sendChatMessage
    };
  });
