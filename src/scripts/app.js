var app = angular.module('app', []);

app.controller('ctrl', function ($scope) {
    $scope.clickButton = function () {
        $scope.content = $scope.content ? '' : 'button clicked';
    };

    console.log('changed');

}); 