var app = angular.module('wineFridge', ['ngFileUpload', 'ui.router', 'ngMessages']);


var rootConfig = {
    url: '/home',
    templateUrl: '/home.html',
    controller: 'MainCtlr',
    resolve: {
        wine: ['$stateParams',
            'wines',
            function ($stateParams, wines) {
                return $stateParams.id ? wines.findById($stateParams.id) : null;
            }
        ],
        winePromise: ['wines', function (wines) {
            if (wines.wines.length > 0)
                return wines.wines;
            else
                return wines.getAll(true);
        }]
    }
};

var comeBackConfig = jQuery.extend(true, {}, rootConfig);
comeBackConfig.url += "/{id}";

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.when('/home/{id}', ['wines', '$state', '$stateParams', function (wines, $state, $stateParams) {
            if ($stateParams.id && wines.wines.length > 0) {
                return false;
            }
            else     //inconsistent conditions detected - reset to home
                $state.go('home');

        }]);
        $stateProvider
            .state('home', rootConfig)
            .state('comeBack', comeBackConfig)
            .state('wineComments', {
                url: '/wine/{id}',
                templateUrl: '/wineComments.html',
                controller: 'WineCommentsCtlr',
                resolve: {
                    wine: ['$stateParams',
                        'wines',
                        function ($stateParams, wines) {
                            return wines.get($stateParams.id);
                        }]
                }
            })
            .state('login', {
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtlr',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        state.go('home');
                    }
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtlr',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        state.go('home');
                    }
                }]
            });
        $urlRouterProvider.otherwise('home');
    }
]);

app.controller('MainCtlr', [
    '$scope',
    'wine',
    'wines',
    'slots',
    'auth',
    function ($scope, wine, wines, slots, auth) {
        if (wine) {
            setScopeFromWine(wine);
        } else {
            $scope.isVacant = true;
        }
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.wines = wines.wines;
        $scope.slots = slots.slots;
        $scope.uploadPic = function (file) {
            $scope.errorMsg = wines.uploadPic(file, $scope.id, function (imgSrc) {
                var slot = slots.getSlot($scope.shelf, $scope.column);
                slot.imageSrc = imgSrc;
                slot.wine.image = null;
            });
        };
        $scope.updateWine = function () {
            if (!$scope.varietal || $scope.varietal === '') {
                return;
            }
            if (!$scope.winery || $scope.winery === '') {
                return;
            }
            if (!$scope.column || $scope.column === 0) {
                return;
            }
            if (!$scope.shelf || $scope.shelf === 0) {
                return;
            }
            var slot = slots.getSlot($scope.shelf, $scope.column);
            if (slot.wine) {
                wines.update({
                    name: $scope.name,
                    varietalString: $scope.varietal,
                    winery: $scope.winery,
                    year: $scope.year,
                    bestFrom: $scope.bestFrom,
                    bestTo: $scope.bestTo,
                    price: $scope.price,
                    shelf: $scope.shelf,
                    column: $scope.column,
                    _id: slot.wine._id
                });
            }
            else {
                wines.create({
                    name: $scope.name,
                    varietalString: $scope.varietal,
                    winery: $scope.winery,
                    year: $scope.year,
                    bestFrom: $scope.bestFrom,
                    bestTo: $scope.bestTo,
                    price: $scope.price,
                    shelf: $scope.shelf,
                    column: $scope.column
                });
                clearDetailsPanel();
            }
        };

        function clearDetailsPanel() {
            $scope.name = $scope.varietal = $scope.winery = "";
            $scope.year = $scope.bestFrom = $scope.bestTo = $scope.price = null;
            $scope.id = null;
        }

        function setScopeFromWine(wine) {
            $scope.name = wine.name;
            $scope.varietal = wine.varietal.join();
            $scope.winery = wine.winery;
            $scope.year = wine.year;
            $scope.bestFrom = wine.bestFrom;
            $scope.bestTo = wine.bestTo;
            $scope.price = wine.price;
            $scope.isVacant = false;
            $scope.id = wine._id;
        }

        $scope.selectSlot = function () {
            $scope.shelf = this.slots[this.$index].shelf;
            $scope.column = this.slots[this.$index].column;
            if (this.slots[this.$index].wine) {
                setScopeFromWine(this.slots[this.$index].wine);
            }
            else {
                clearDetailsPanel();
                $scope.isVacant = true;
            }
        };
        $scope.removeBottle = function () {
            if ($scope.id) {
                wines.removeWine($scope.id, $scope.shelf, $scope.column);
                clearDetailsPanel();
                $scope.isVacant = true;
            }
        };
    }
])
    .controller('WineCommentsCtlr', [
        '$scope',
        'auth',
        'wine',
        'wines',
        function ($scope, auth, wine, wines) {
            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.wine = wine;
            $scope.addComment = function () {
                if ($scope.body == '') {
                    return;
                }
                wines.addComment(wine._id, {
                    body: $scope.body,
                    score: $scope.score,
                    author: $scope.author
                }).success(function (comment) {
                    $scope.wine.comments.push(comment);
                });
                $scope.body = $scope.author = '';
                $scope.score = null;
            };
        }])
    .controller('AuthCtlr', ['$scope',
    '$state',
    'auth',
    function ($scope, $state, auth) {
        $scope.user = {};

        $scope.register = function () {
                auth.register($scope.user).error(function (error) {
                    $scope.error = error;
                }).then(function () {
                    $state.go('home');
                });

        };

        $scope.logIn = function () {
            auth.logIn($scope.user).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $state.go('home');
            });
        };
    }])
    .controller('NavCtlr', ['$scope', '$state', 'auth', function ($scope, $state, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = function(){
        auth.logOut();
        $state.go('home');
    }
}]);


app.factory('wines', ['$http', 'auth', 'slots', 'Upload', '$timeout',
    function ($http, auth, slots, Upload, $timeout) {
        var o = {
            wines: []
        };

        o.getAll = function (excludeEmpty) {
            var uri = '/wines';
            if (!excludeEmpty) {
                uri += '?excludeEmpty=false';
            } else {
                uri += '?excludeEmpty=true';
            }
            return $http.get(uri).success(function (data) {
                angular.copy(data, o.wines);
                for (var i = 0; i < o.wines.length; i++) {
                    var w = o.wines[i];
                    var slot = slots.getSlot(w.shelf, w.column);
                    if (slot) {
                        slot.wine = w;
                    }
                    slot.imageSrc = w.category === "red" ? "/images/red-wine64.png" : "/images/white-wine64.png";
                }
            });
        };

        o.create = function (wine) {
            wine.isConsumed = false;
            buildVarietalArray(wine);
            return $http.post('/wines', wine, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).success(function (data) {
                o.wines.push(data);
                var slot = slots.getSlot(data.shelf, data.column);
                if (slot) {
                    slot.wine = data;
                    slot.imageSrc = (slot.wine.category === "red") ? "/images/red-wine64.png" : "/images/white-wine64.png";
                }
            });
        };

        o.update = function (wine) {
            if (wine._id) {
                buildVarietalArray(wine);
                return $http.put('/wines/' + wine._id, wine, {
                    headers: {Authorization: 'Bearer ' + auth.getToken()}
                }).success(function (data) {
                    var slot = slots.getSlot(data.shelf, data.column);
                    if (slot) {
                        slot.wine = data;
                        slot.imageSrc = slot.wine.category === "red" ? "/images/red-wine64.png" : "/images/white-wine64.png";
                    }
                });
            }
        };

        o.findById = function (id) {
            for (var i = 0; i < o.wines.length; i++) {
                var w = o.wines[i];
                if (w._id === id)
                    return w;
            }
            return null;
        };

        o.removeWine = function (id, shelf, column) {
            var wine = o.findById(id);
            if (wine) {
                wine.isConsumed = true;
                return $http.put('/wines/' + id, wine, {
                    headers: {Authorization: 'Bearer ' + auth.getToken()}
                }).success(function (data) {
                    slots.removeWine(shelf, column);
                });
            }
        };

        o.uploadPic = function (file, id, onSuccess) {
            file.upload = Upload.upload({
                url: '/wines/' + id + '/uploadPic',
                data: {id: id, file: file},
                method: "PUT",
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).then(function (response) {
                onSuccess(file.$ngfBlobUrl);
                $timeout(function () {
                    file.result = response.data;
                });
            }, function (response) {
                if (response.status > 0)
                    return response.status + ': ' + response.data;
            }, function (evt) {
                // Math.min is to fix IE which reports 200% sometimes
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
        };

        o.get = function (id) {
            return $http.get('/wines/' + id).then(function (res) {
                return res.data;
            });
        };

        o.addComment = function (id, comment) {
            return $http.post('/wines/' + id + '/comments', comment, {
                headers: {Authorization: 'Bearer ' + auth.getToken()}
            });
        };

        function buildVarietalArray(wine) {
            var re = /\s*,\s*/;
            var varietalArray = wine.varietalString.split(re);
            wine.varietal = varietalArray;
            delete wine.varietalString;
        }

        return o;
    }])
    .factory('slots', [function () {
        var o = {slots: []};
        for (var i = 0; i < 50; i++) {
            o.slots.push({
                shelf: Math.floor(i / 5) + 1,
                column: i % 5 + 1,
                wine: null,
                imageSrc: "/images/empty-wine64.png"
            });
        }
        o.getSlot = function (shelf, column) {
            if (shelf && column && shelf > 0 && shelf <= 10 && column > 0 && column <= 5)
                return o.slots[(shelf - 1) * 5 + column - 1];
            else
                return null;
        };
        o.removeWine = function (shelf, column) {
            if (shelf && column && shelf > 0 && shelf <= 10 && column > 0 && column <= 5) {
                var slot = o.slots[(shelf - 1) * 5 + column - 1];
                slot.imageSrc = "/images/empty-wine64.png";
                slot.wine = null;
            }
        };
        return o;
    }
    ]).factory('auth', ['$http', '$window', function ($http, $window) {
    var auth = {};
    auth.saveToken = function (token) {
        $window.localStorage['wine-fridge-token'] = token;
    };

    auth.getToken = function () {
        return $window.localStorage['wine-fridge-token'];
    };

    auth.isLoggedIn = function () {
        var token = auth.getToken();
        if (token) {
            payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        }
        else {
            return false;
        }
    };

    auth.currentUser = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.username;
        }
    };

    auth.register = function (user) {
        return $http.post('/auth/register', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function (user) {
        return $http.post('/auth/login', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function () {
        $window.localStorage.removeItem('wine-fridge-token');
    };

    return auth;
}]);

var compareTo = function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue === scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
};

app.directive("compareTo", compareTo);