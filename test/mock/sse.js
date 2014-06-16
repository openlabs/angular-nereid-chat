'use strict';

/*jshint unused:false*/
/*global EventSource:true */

var EventSourceInstance = null;

EventSource = function () {

  this.trigger = function (type, payload) {
    angular.forEach(this.eventListener[type], function (listener) {
      listener(payload);
    });
  };

  this.eventListener = {
    'open': [],
    'message': [],
    'error': [],
  };

  this.addEventListener = function (type, listener) {
    this.eventListener[type].push(listener);
  };

  this.close = function () {
    this.eventListener = {
      'open': [],
      'message': [],
      'error': []
    };
  };

  EventSourceInstance = this;
};

var mockChatPresence = angular.toJson({
    'timestamp': '2014-06-14T10:53:37.307189',
    'type': 'presence',
    'presence': {
      'entity': {
        'url': 'my_profile_link',
        'objectType': 'nereid.user',
        'id': 1,
        'displayName': 'Tarun Bhardwaj',
      },
      'show': 'chat',
      'status': 'My 1st status',
      'available': true,
    },
  });

var mockChatMessage = angular.toJson({
    'timestamp': '2014-06-14T10:53:37.307189',
    'type': 'message',
    'message': {
      'subject': null,
      'text': 'test message',
      'type': 'plain',
      'language': 'en_US',
      'attachments': [],
      'id': 'dummy uuid',
      'thread': 'thread_id',
      'sender': {
        'url': 'my_profile_link',
        'objectType': 'nereid.user',
        'id': 1,
        'displayName': 'Tarun Bhardwaj',
      },
      'members': [{
        'url': 'my_profile_link',
        'objectType': 'nereid.user',
        'id': 1,
        'displayName': 'Tarun Bhardwaj',
      }, {
        'url': 'her_profile_link',
        'objectType': 'nereid.user',
        'id': 2,
        'displayName': 'Lisa Doe',
      }]
    }
  });

var chatFriends = [{
  'entity': {
    'url': 'profile_link1',
    'objectType': 'nereid.user',
    'id': 2,
    'displayName': 'Tarun Bhardwaj',
  },
  'show': 'chat',
  'status': 'My 1st status',
  'available': true,
}, {
  'entity': {
    'url': 'profile_link2',
    'objectType': 'nereid.user',
    'id': 3,
    'displayName': 'Tarun Bhardwaj',
  },
  'show': 'chat',
  'status': 'My 1st status',
  'available': true,
}, {
  'entity': {
    'url': 'profile_link3',
    'objectType': 'nereid.user',
    'id': 4,
    'displayName': 'Tarun Bhardwaj',
  },
  'show': 'chat',
  'status': 'My 1st status',
  'available': true,
}, {
  'entity': {
    'url': 'profile_link4',
    'objectType': 'nereid.user',
    'id': 5,
    'displayName': 'Tarun Bhardwaj',
  },
  'show': 'chat',
  'status': 'My 1st status',
  'available': true,
}];

var mockUserPresence = angular.toJson({
    'timestamp': '2014-06-14T10:53:37.307189',
    'type': 'presence',
    'presence': {
      'entity': {
        'url': 'profile_link1',
        'objectType': 'nereid.user',
        'id': 2,
        'displayName': 'Tarun Bhardwaj',
      },
      'show': 'chat',
      'status': 'My 1st status',
      'available': false,
    },
  });