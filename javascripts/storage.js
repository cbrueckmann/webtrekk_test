'use strict';
/**
* wrapper function for browser's loaclStorage
* takes care about JSON de/encoding
* use: 
*
* $storage('key').get();
* $storage('key').set(value);
*/

if (window.Storage && window.JSON) {
  window.$storage = function (key) {
    return {
      set: function (value) {
        return localStorage.setItem(key, JSON.stringify(value));
      },
      get: function () {
        var item;
        item = localStorage.getItem(key);
        if (item) {
          return JSON.parse(item);
        }
      },
      reset: function () {
        return this.set('');
      }
    };
  };
}