'use strict';
/* global methods! */

/**
*  sortArrayObject
*  sort callback function for Arrays containing Objects
*  allows to sort an Array by key in object
*
*  Params: String key 
*  sortArray.sort(function(a, b){
*    return sortArrayObject(objKey)(a,b);
*  });
*/

var sortArrayObject = function (key) {
  return function (a, b) {
    try {
      var aValue = a[key];
      var bValue = b[key]; 
      return ((aValue < bValue) ? -1 : ((aValue > bValue) ? 1 : 0));
    } catch (e) {
      console.warn("Error: sortBy" + key + " failed: ", e);
    }
  };
};

/**
* calculate age in years for a given birthdate
* params: String birthD
* Date().getTime() is very tolerant regarding the format and 
* just returns NaN if not valid
*/
var currentTimeStamp = new Date().getTime();
var calculateAgeByBirthdate = function (birthD) {
  var bDate = new Date(birthD);
  bDate = bDate.getTime();
  if (isNaN(bDate)) {
    console.warn("Error: calculateAgeByBirthdate failed (invalid arameter passed)");
    return false;
  }
  var diff = currentTimeStamp - bDate;

  var age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  return age;
};
/* end global methods */
