var app = angular.module('app', []);

app.controller('ctrl', function ($scope, $rootScope) {
    $scope.clickButton = function () {
        $scope.content = $scope.content ? '' : 'button clicked';
    };
}); 