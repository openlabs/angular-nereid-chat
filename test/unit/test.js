'use strict';

/* global
      expect, it, describe, beforeEach, afterEach, inject, spyOn, chatFriends,
      EventSourceInstance, mockChatPresence, mockChatMessage, mockUserPresence
    :false
*/

describe('Nereid Chat', function() {

  beforeEach(function(){
    angular.mock.module('openlabs.angular-nereid-chat');
    module(function($provide) {
      $provide.provider('nereidAuth', function() {
        this.$get = function() {
          return {
            user: function () {
              return {user: {id: 1}};
            }
          };
        };
      });
    });
  });

  describe('Service: nereidChat', function () {

    // instantiate service
    var nereidChat,
      rootScope, $httpBackend;
    var eventCallbacks = {
      presenceHandler: function () {},
      messageHandler: function () {}
    };

    beforeEach(inject(function (_nereidChat_, _$rootScope_, _$httpBackend_) {
      rootScope = _$rootScope_.$new();
      $httpBackend = _$httpBackend_;
      nereidChat = _nereidChat_;
      localStorage.clear();
    }));

    it('should start Listening', function () {
      $httpBackend.expectPOST('/my_server/nereid-chat/token')
        .respond(200, {'token': 'uuid'});

      nereidChat.setBasePath('/my_server');
      nereidChat.startListening();
      $httpBackend.flush();
    });

    it('should start Listening and reload token on error', function () {
      $httpBackend.expectPOST('/my_server/nereid-chat/token')
        .respond(200, {'token': 'uuid'});

      nereidChat.setBasePath('/my_server');
      nereidChat.startListening();
      $httpBackend.flush();

      // Trigger error for SSE
      EventSourceInstance.trigger('error');
      $httpBackend.expectPOST('/my_server/nereid-chat/token')
        .respond(200, {'token': 'uuid'});
      $httpBackend.flush();
    });

    it('should broadcast presence', function () {
      $httpBackend.expectPOST('/my_server/nereid-chat/token')
        .respond(200, {'token': 'uuid'});

      nereidChat.setBasePath('/my_server');
      nereidChat.startListening();
      $httpBackend.flush();

      // Trigger message for SSE
      spyOn(eventCallbacks, 'presenceHandler');
      rootScope.$on('nereid-chat::presence', eventCallbacks.presenceHandler);
      EventSourceInstance.trigger('message', {
        data: mockChatPresence
      });

      expect(eventCallbacks.presenceHandler).toHaveBeenCalled();
    });

    it('should broadcast message', function () {
      $httpBackend.expectPOST('/my_server/nereid-chat/token')
        .respond(200, {'token': 'uuid'});

      nereidChat.setBasePath('/my_server');
      nereidChat.startListening();
      $httpBackend.flush();

      // Trigger message for SSE
      spyOn(eventCallbacks, 'messageHandler');
      rootScope.$on('nereid-chat::message', eventCallbacks.messageHandler);
      EventSourceInstance.trigger('message', {
        data: mockChatMessage
      });

      expect(eventCallbacks.messageHandler).toHaveBeenCalled();
    });

    it('should fetch friends', function () {
      $httpBackend.expectGET('/nereid-chat/get-friends')
        .respond(200, {'friends': []});

      nereidChat.getFriends();
      $httpBackend.flush();
    });

    it('should start new chat', function () {
      $httpBackend.expectPOST('/nereid-chat/start-session')
        .respond(200, {'token': 'uuid'});

      nereidChat.startNewChat(5);
      $httpBackend.flush();
    });

    it('should send Chat Message', function () {
      $httpBackend.expectPOST('/nereid-chat/send-message')
        .respond(200, {'token': 'uuid'});

      nereidChat.sendChatMessage('thread_id', 'message');
      nereidChat.stopListening();
      $httpBackend.flush();
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });
  });

  describe('Directive: nereidChat', function () {

    var $scope,
      $httpBackend, $templateCache;

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();

      $templateCache = $injector.get('$templateCache');
      $templateCache.put(
        'views/nereid-chat/main.html', '<div></div>'
      );
    }));

    beforeEach(inject(function () {
      // Set token
      localStorage.setItem('nereidChatToken', 'token_id');
      $httpBackend.expectGET('/nereid-chat/get-friends')
        .respond({'friends': chatFriends});
    }));

    it('should start new chat and create new thread', inject(function ($compile) {
      var element = angular.element('<nereid-chat></nereid-chat>');
      $compile(element)($scope);
      $scope.$apply();
      $scope.friends = angular.copy(chatFriends);
      $scope.startNewChat($scope.friends[1]);
      expect($scope.threads.length).toBe(0);

      $httpBackend.expectPOST('/nereid-chat/start-session')
        .respond({'token': 'uuid'});

      $httpBackend.flush();
      expect($scope.threads.length).toBe(1);

      $scope.startNewChat($scope.friends[1]);

      $httpBackend.expectPOST('/nereid-chat/start-session')
        .respond({'token': 'uuid'});

      $httpBackend.flush();

      // Same thread id will not create new thread
      expect($scope.threads.length).toBe(1);
      expect($scope.friends[0].available).toBe(true);  // user is online

      // Set user 2 to offline
      EventSourceInstance.trigger('message', {
        data: mockUserPresence
      });

      expect($scope.friends[0].available).toBe(false);
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });
  });

  describe('Filter: createTitle', function() {
    var createTitle;

    beforeEach(inject(function ($filter) {
      createTitle = $filter('createTitle');
    }));

    it('it should create title from members', function() {
      var mockMembers = [{
        id: 1,
        displayName: 'me user'
      }, {
        id: 2,
        displayName: 'test user'
      }];
      expect(createTitle(mockMembers)).toBe('test user');
    });
  });
});