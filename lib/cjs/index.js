'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (asyncTask) {
  var source = this;
  return source.mergeMap(function (action) {
    return _rxjs.Observable.create(function (observer) {
      return callAsyncTask({ asyncTask: asyncTask, source: source.source, observer: observer, action: action });
    });
  });
};

var _rxjs = require('rxjs');

var callAsyncTask = function callAsyncTask(_ref) {
  var asyncTask = _ref.asyncTask,
      source = _ref.source,
      observer = _ref.observer,
      action = _ref.action;

  var put = function put(actionToEmit) {
    return observer.next(actionToEmit);
  };

  var take = function take(filterFn) {
    return new Promise(function (resolve) {
      return source.filter(filterFn).map(resolve).take(1).subscribe();
    });
  };

  var call = function call(childAsyncTask) {
    for (var _len = arguments.length, taskArgs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      taskArgs[_key - 1] = arguments[_key];
    }

    try {
      return childAsyncTask.apply(undefined, [{ put: put, call: call, take: take }].concat(taskArgs));
    } catch (error) {
      console.error('Issue with asyncTask', error);
      throw error;
    }
  };

  var finished = function finished() {
    try {
      observer.complete();
    } catch (error) {
      // Without this, errors in the subscriber's onComplete handler can be
      // swallowed silently, which makes for tricky debugging
      console.error('Error in subscriber onComplete handler', error);
      throw error;
    }
  };

  asyncTask({ put: put, call: call, take: take }, action).then(finished).catch(function (error) {
    console.error('asyncTask rejected due to following error: ' + error.message, error);
    observer.error(error);
  });
};