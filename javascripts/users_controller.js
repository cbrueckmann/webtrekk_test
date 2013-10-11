'use strict';

var app = angular.module("TestApp", ['ui.bootstrap']);

// service to inject navigation data into customer
// TODO: generalize to inject any kind of table into another
app.service('navigationInjector', function () {
  var navigationData;
  navigationData = $storage('navigationData').get();

  // get the navigation data for given user
  var getNaviOfCustomer = function (customer_id) {
    var userNavigationData = $.map(navigationData, function (data) {
      if (data.customer_id === customer_id) {
        return data;
      }
      else {
        return [];
      }
    });
    return userNavigationData;
  };
  
  // not really sure if this step is necessairy or if a relation could be accomplished in a different way...
  // walk through each customer, get NavigationData from separate table and inject it to userData
  var injectNavigationDataToCustomer = function (userData) {
    $.each(userData, function (i, customer) {
      var customer_id = customer.customer_id;
      var customerNavigation = getNaviOfCustomer(customer_id);

      customer = $.extend({}, customer, {navigation: customerNavigation});
      userData[i] = customer;
      //saveData();
    });
    return userData;
  };

  return {
    inject: injectNavigationDataToCustomer,
    getNavi: getNaviOfCustomer
  };
});

// service for data management (localStorage in this case)
// TODO: check if localStorage && JSON is present here or provide a fallback
app.service('dataService', ['navigationInjector', function (navigationInjector) {
  var userData;

  // init Data
  userData = $storage('userData').get(); 
  userData = navigationInjector.inject(userData);

  this.get = function () {
    return userData;
  };

  this.set = function (key, data) {
    $storage(key).set(data);
  };
}]);

// Translate short version of gender to human readable
app.service('genderMap', function () {
  //return {w: 'Female', m: 'Male'}[gender] || gender;
  this.map = function (gender) {
    return {w: 'Female', m: 'Male'}[gender] || gender;
  };
});

// determine the next Id for a given key in an array of objects 
// value of obj.key must be integer
// note: after adding a user, $scope.nextCustomerId is just incremented
// could also use underscore _.max(), but would be too much overhead
app.service('getNextId', function () {
  this.get = function (data, key) {
    var sortArray = angular.copy(data);
    var nextId, maxId;

    if (sortArray.length > 0) {
      sortArray.sort(function (a, b) {
        return sortArrayObject(key)(a, b);
      });
      maxId = sortArray[sortArray.length - 1]['customer_id'];
  
      nextId = (maxId + 1);
    }
    else {
      nextId = 1;
    }

    return nextId;
  }
});

app.controller('UserController', function ($scope, dataService, genderMap, getNextId, $dialog) {
  $scope.header = "Customer Overview";
  
  // import data from dataService
  $scope.userData = dataService.get(); 

  // store back to database (localstorage)
  // In real world we would first send a request to the server
  // and update the $scope on success
  // also, we would just update a single user, not the entire set
  var saveData = function () {
    dataService.set('userData', $scope.userData)
  };
  
  // Customer detail dialog
  $scope.showNaviForCustomer = function (customer) {
    var itemToShow = customer;

    $dialog.dialog({
      controller: 'ShowCtrl',
      templateUrl: 'modals/show_customer.html',
      resolve: {item: angular.copy(itemToShow)}
    }).open();
  };

  // Customer create dialog
  $scope.showNewCustomerForm = function () {
    var itemToAdd = {customer_id: $scope.nextCustomerId};
    
    $dialog.dialog({
      controller: 'NewCtrl',
      templateUrl: 'modals/new_customer.html',
      resolve: {item: itemToAdd}
    })
    .open()
    .then(function (result) {
      if (result) {
        $scope.addCustomer(result);
      }
      itemToAdd = undefined;
    });
  };

  $scope.addCustomer = function (customer) {
    if (customer) {
      $scope.userData.push(customer);
      $scope.nextCustomerId += 1;
      saveData();
    }
  };

  //Customer edit dialog
  $scope.showEditCustomerForm = function (customer) {
    var itemToEdit = customer;
    
    $dialog.dialog({
        controller: 'EditCtrl',
        templateUrl: 'modals/edit_customer.html',
        resolve: {item: angular.copy(itemToEdit)}
      })
      .open()
      .then(function (result) {
        if (result) {
          angular.copy(result, itemToEdit);
          saveData();             
        }
        itemToEdit = undefined;
    });
  };

  $scope.removeUser = function (user) {
    // HA! Nearly fell for that one :)
    // when the list in the view is ordered by orderBy filter, the index won't match anymore
    // allways use the real index of the object
    $scope.userData.splice( $scope.userData.indexOf(user), 1 );
    //$scope.userData.splice(index, 1);

    // we could update the nextCustomerId here, but
    // there is actually no reason to reuse dropped user_ids
    saveData();
  };
  
  // provide age calculation service to scope
  $scope.calculateAgeByBirthdate = calculateAgeByBirthdate;

  // provide genderMap service to $scope
  $scope.translateGender = genderMap.map;

  // set initial available id for new customers by using getNextId service
  $scope.nextCustomerId = getNextId.get($scope.userData, 'customer_id');

});

// CRU(D) Controllers for modal dialogs
// better with modal directive?
app.controller('NewCtrl', function ($scope, item, dialog) { 
  
  $scope.item = item;
  
  $scope.addCustomer = function () {
    dialog.close($scope.item);
  };
  
  $scope.close = function () {
    dialog.close(undefined);
  };
});

app.controller('EditCtrl', function ($scope, item, dialog) { 
  $scope.item = item;
  
  $scope.saveCustomer = function () {
    dialog.close($scope.item);
  };
  
  $scope.close = function () {
    dialog.close(undefined);
  };
});

app.controller('ShowCtrl', function ($scope, item, dialog) { 
  
  $scope.item = item;

  $scope.close = function () {
    dialog.close(undefined);
  };
});
