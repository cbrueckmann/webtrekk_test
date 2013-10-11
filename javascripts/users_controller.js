'use strict';

var app = angular.module("TestApp", ['ui.bootstrap']);

// service for data management (localStorage in this case)
// TODO: check if localStorage && JSON is present here or provide a fallback
app.service('dataService', function () {
  
  this.get = function (data) {
    return {
      userData: $storage('userData').get(),
      navigationData: $storage('navigationData').get()
    }[data] || [];
  };

  this.set = function (key, data) {
    $storage(key).set(data);
  };
});

app.controller('UserController', function ($scope, dataService, $dialog) {
  $scope.header = "Customer Overview";
  
  // In a real application we would use a service for retrieving data
  // import data from localStorage
  $scope.userData = dataService.get('userData'); 
  $scope.navigationData = dataService.get('navigationData');

  // store back to database (localstorage)
  // In real world we would first send a request to the server
  // and update the $scope on success
  // also, we would just update a single user, not the entire set
  var saveData = function () {
    dataService.set('userData', $scope.userData)
  };
  
  // get the navigation data for given user - only once
  var getNaviOfCustomer = function (customer_id) {
    var userNavigationData = $.map($scope.navigationData, function (data) {
      if (data.customer_id === customer_id) {
        return data;
      }
    });
    return userNavigationData;
  };

  // not really sure if this step is necessairy or if a relation could be accomplished in a different way...
  // walk through each customer, get NavigationData from separate table and inject it to userData
  // testable when not in $scope?
  // consider factory
  var injectNavigationDataToCustomer = function () {
    $.each($scope.userData, function (i, customer) {
      var customer_id = customer.customer_id;
      var customerNavigation = getNaviOfCustomer(customer_id);

      customer = $.extend({}, customer, {navigation: customerNavigation});
      $scope.userData[i] = customer;
      saveData();
    });
  };

  // prepare data once. Testable? consider prototype
  // better: use factory!
  injectNavigationDataToCustomer();

  // Customer detail dialog
  $scope.showNaviForCustomer = function (customer) {
    var itemToShow = customer;

    $dialog.dialog({
      controller: 'ShowCtrl',
      template: $('#modal-template-show').html(),
      //templateUrl: 'modals/show_customer.html',
      resolve: {item: itemToShow}
    }).open();
  };

  // Customer create dialog
  $scope.showNewCustomerForm = function () {
    var itemToAdd = {customer_id: $scope.nextCustomerId};
    
    $dialog.dialog({
      controller: 'NewCtrl',
      template: $('#modal-template-new').html(),
      //templateUrl: 'modals/new_customer.html',
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
      saveData();
    }
  };

  //Customer edit dialog
  $scope.showEditCustomerForm = function (customer) {
    var itemToEdit = customer;
    
    $dialog.dialog({
        controller: 'EditCtrl',
        template: $('#modal-template-edit').html(),
        //templateUrl: 'modals/edit_customer.html',
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

  // remove user from scope
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
  
  // provide age calculation inside scope, but use globally available helper
  $scope.calculateAgeByBirthdate = function (birthD) {
    return calculateAgeByBirthdate(birthD);
  };

  // Translate short version of gender to human readable
  $scope.translateGender = function (gender) {
    return {w: 'Female', m: 'Male'}[gender] || gender;
  };

  // available id for new customers
  $scope.nextCustomerId = 0;

  // determine the next Id for a new user
  // needs to be called once only
  // after adding a user, $scope.nextCustomerId is just incremented
  // could also use underscore _.max(), but would be too much overhead
  // TODO: make sure it's testable (prototyped?)
  var setNextCustomerId = function () {
    var sortArray = angular.copy($scope.userData);
    if (sortArray.length > 0) {
      sortArray.sort(function (a, b) {
        return sortArrayObject('customer_id')(a,b);
      });
      var maxId = sortArray[sortArray.length - 1]['customer_id'];
  
      //finally set the next available ID for new customers
      $scope.nextCustomerId = (maxId + 1);
    }
    else {
      $scope.nextCustomerId = 1;
    }
  };
  
  setNextCustomerId();
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