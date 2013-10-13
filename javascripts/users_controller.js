'use strict';

var app = angular.module("TestApp", ['ui.bootstrap']);

// service for data management (localStorage in this case)
// TODO: check if localStorage && JSON is present here or provide a fallback
//app.service('dataService', ['dataInjector', function (dataInjector) {

app.service('dataService', function () {
  
  /** 
  * getRelation()
  *  
  *  itemId: The id of the parent data
  *  relationTable: the name of the relation table
  *  relationKey: the name of the relation_key representing the parent id
  */
  this.getRelation = function (itemId, relationTable, relationKey) {
    var childData = null;
    var relationData = $storage(relationTable).get();

    childData = $.map(relationData, function (data) {
      if (data[relationKey] === itemId) {
        return data;
      }
    });
    return childData
  };

  this.get = function (table) {
    return $storage(table).get();
  };

  this.set = function (table, data) {
    $storage(table).set(data);
  };
});

// Translate short version of gender to human readable
app.service('genderMap', function () {
  //return {w: 'Female', m: 'Male'}[gender] || gender;
  this.map = function (gender) {
    return {w: 'Female', m: 'Male'}[gender] || gender;
  };
});

/** determine the next Id for a given key in an array of objects 
* value of obj.key must be integer
* could also use underscore _.max(), but would be too much overhead
* dataArray: the array of objects
* the obj[key] to sort
*/
app.service('getNextId', function () {
  this.get = function (dataArray, key) {
    // make a copy so the original Array is not affected
    var sortArray = angular.copy(dataArray);
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
  };
});

app.controller('UserController', function ($scope, dataService, genderMap, getNextId, $dialog) {
  $scope.header = "Customer Overview";
  
  // import data from dataService
  $scope.userData = dataService.get('userData'); 

  // store back to database (localstorage)
  // In real world we would first send a request to the server
  // and update the $scope on success
  // also, we would just update a single user, not the entire set
  var saveData = function () {
    dataService.set('userData', $scope.userData);
  };
  
  // Customer detail dialog
  $scope.showNaviForCustomer = function (customer) {
    var itemToShow = angular.copy(customer);
    // gather all entries of navigationData for given customer_id
    itemToShow.navigationData = dataService.getRelation(customer.customer_id, 'navigationData', 'customer_id');

    $dialog.dialog({
      controller: 'ModalCtrl',
      templateUrl: 'modals/show_customer.html',
      resolve: {item: itemToShow}
    }).open();
  };

  // Customer create dialog
  $scope.showNewCustomerForm = function () {
    var itemToAdd = {customer_id: $scope.nextCustomerId};
    
    $dialog.dialog({
      controller: 'ModalCtrl',
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
        controller: 'ModalCtrl',
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


app.controller('ModalCtrl', function ($scope, item, dialog) { 
  
  $scope.item = item;
  
  $scope.save = function () {
    dialog.close($scope.item);
  };
  
  $scope.close = function () {
    dialog.close(undefined);
  };
});