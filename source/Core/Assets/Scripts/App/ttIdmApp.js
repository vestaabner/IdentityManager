﻿/// <reference path="../Libs/angular.min.js" />
/// <reference path="../Libs/angular-route.min.js" />

(function (angular) {

    function Feedback() {
        var self = this;
        var _errors;
        var _message;

        self.clear = function () {
            _errors = null;
            _message = null;
        };

        Object.defineProperty(this, "message", {
            get: function () {
                return _message;
            },
            set: function (value) {
                self.clear();
                _message = value;
            }
        });
        Object.defineProperty(this, "errors", {
            get: function () {
                return _errors;
            },
            set: function (value) {
                self.clear();
                if (value instanceof Array) {
                    _errors = value;
                }
                else {
                    _errors = [value];
                }
            }
        });

        self.messageHandler = function (message) {
            self.message = message;
        };
        self.errorHandler = function (errors) {
            self.errors = errors;
        };
        self.createMessageHandler = function (msg) {
            return function () {
                self.message = msg;
            };
        };
        self.createErrorHandler = function (msg) {
            return function (errors) {
                self.errors = errors || msg;
            };
        };
    }

    var app = angular.module("ttIdmApp", ['ngRoute', 'ttIdm', 'ttIdmUI']);
    function config($routeProvider, PathBase) {
        $routeProvider
            .when("/", {
                controller: 'HomeCtrl',
                templateUrl: PathBase + '/assets/Templates.home.html'
            })
            .when("/users/list/:filter?/:page?", {
                controller: 'ListUsersCtrl',
                resolve: { api: "idmUsers" },
                templateUrl: PathBase + '/assets/Templates.users.list.html'
            })
            .when("/users/create", {
                controller: 'NewUserCtrl',
                resolve: { api: "idmUsers" },
                templateUrl: PathBase + '/assets/Templates.users.new.html'
            })
            .when("/users/edit/:subject", {
                controller: 'EditUserCtrl',
                resolve: { api: "idmUsers" },
                templateUrl: PathBase + '/assets/Templates.users.edit.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    }
    config.$inject = ["$routeProvider", "PathBase"];
    app.config(config);

    function LayoutCtrl($scope, idmApi) {
        $scope.model = {};

        idmApi.then(function () {
            $scope.model.username = idmApi.data.currentUser.username;
            $scope.model.links = idmApi.links;
        });
    }
    LayoutCtrl.$inject = ["$scope", "idmApi"];
    app.controller("LayoutCtrl", LayoutCtrl);

    function HomeCtrl($scope) {
        $scope.model = {};
    }
    HomeCtrl.$inject = ["$scope"];
    app.controller("HomeCtrl", HomeCtrl);

    function ListUsersCtrl($scope, idmUsers, idmPager, $routeParams, $location) {
        var model = {
            message : null,
            users : null,
            pager : null,
            waiting : true,
            filter : $routeParams.filter,
            page : $routeParams.page || 1
        };
        $scope.model = model;

        $scope.search = function (filter) {
            var url = "/list";
            if (filter) {
                url += "/" + filter;
            }
            $location.url(url);
        };

        var itemsPerPage = 10;
        var startItem = (model.page - 1) * itemsPerPage;

        idmUsers.getUsers(model.filter, startItem, itemsPerPage).then(function (result) {
            $scope.model.waiting = false;
            $scope.model.users = result.data.users;
            if (result.data.users && result.data.users.length) {
                $scope.model.pager = new idmPager(result.data, itemsPerPage);
            }
        }, function (error) {
            $scope.model.message = error;
            $scope.model.waiting = false;
        });
    }
    ListUsersCtrl.$inject = ["$scope", "idmUsers", "idmPager", "$routeParams", "$location"];
    app.controller("ListUsersCtrl", ListUsersCtrl);

    function NewUserCtrl($scope, idmUsers) {
        var feedback = new Feedback();
        $scope.feedback = feedback;

        $scope.model = {
        };

        $scope.create = function (username, password, confirm) {
            if (password !== confirm) {
                feedback.errors = "Password and Confirm do not match.";
                return;
            }

            idmUsers.createUser(username, password)
                .then(function (result) {
                    $scope.model.last = result;
                    feedback.message = "Create Success";
                }, feedback.errorHandler);
        };
    }
    NewUserCtrl.$inject = ["$scope", "idmUsers"];
    app.controller("NewUserCtrl", NewUserCtrl);

    function EditUserCtrl($scope, idmUsers, $routeParams) {
        var feedback = new Feedback();
        $scope.feedback = feedback;

        function loadUser() {
            return idmUsers.getUser($routeParams.subject)
                .then(function (result) {
                    $scope.user = result;
                }, feedback.errorHandler);
        };
        loadUser();

        $scope.setPassword = function (password, confirm) {
            if (password.data.value === confirm) {
                idmUsers.setPassword(password)
                    .then(function () {
                        feedback.message = "Password Changed";
                    }, feedback.errorHandler);
            }
            else {
                feedback.errors = "Password and Confirmation do not match";
            }
        };

        $scope.setUsername = function (username) {
            idmUsers.setUsername(username)
                .then(feedback.createMessageHandler("Username Changed"), feedback.errorHandler)
                .then(function () {
                    $scope.user.data.name = username.data.value;
                });
        };

        $scope.setEmail = function (email) {
            idmUsers.setEmail(email)
                .then(feedback.createMessageHandler("Email Changed"), feedback.errorHandler);
        };

        $scope.setPhone = function (phone) {
            idmUsers.setPhone(phone)
                .then(feedback.createMessageHandler("Phone Changed"), feedback.errorHandler);
        };

        $scope.addClaim = function (claims, claim) {
            idmUsers.addClaim(claims, claim)
                .then(function () {
                    feedback.message = "Claim Added";
                    loadUser();
                }, feedback.errorHandler);
        };

        $scope.removeClaim = function (claim) {
            idmUsers.removeClaim(claim)
                .then(function () {
                    feedback.message = "Claim Removed";
                    loadUser().then(function () {
                        $scope.claim = claim.data;
                    });
                }, feedback.errorHandler);
        };

        $scope.deleteUser = function (user) {
            idmUsers.deleteUser(user)
                .then(function () {
                    feedback.message = "User Deleted";
                    $scope.user = null;
                }, feedback.errorHandler);
        };
    }
    EditUserCtrl.$inject = ["$scope", "idmUsers", "$routeParams"];
    app.controller("EditUserCtrl", EditUserCtrl);

})(angular);