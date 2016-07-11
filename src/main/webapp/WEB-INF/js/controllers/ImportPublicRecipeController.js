iftttclone.controller('ImportPublicRecipeController', ['$scope', '$rootScope', '$http', '$location', '$routeParams', '$compile', 'fieldInputFactory', function ($scope, $rootScope, $http, $location, $routeParams, $compile, fieldInputFactory) {
    if ($rootScope.authenticated !== true) {
        $location.path('/login');
    }

    var self = this, fieldsErrorsNumber = 0;
    $scope.recipe = {};

    $http({
        method: 'GET',
        url: 'api/publicrecipes/' + $routeParams.publicRecipeId
    }).then(function successCallback(response) {
        var property;

        // response.data contains the public recipe
        $scope.recipe = response.data;

        delete ($scope.recipe.description); // it is not what i need in the private recipe

        // now i need to create the private recipeTriggerFields and recipeActionField
        $scope.recipe.recipeTriggerFields = {};
        $scope.recipe.recipeActionFields = {};
        // populating them
        for (property in $scope.recipe.trigger.triggerFields) {
            $scope.recipe.recipeTriggerFields[property] = {value: ''};
        }
        for (property in $scope.recipe.action.actionFields) {
            $scope.recipe.recipeActionFields[property] = {value: ''};
        }

        for (property in $scope.recipe.publicRecipeTriggerFields) {
            $scope.recipe.recipeTriggerFields[property].value = $scope.recipe.publicRecipeTriggerFields[property].value;
        }

        for (property in $scope.recipe.publicRecipeActionFields) {
            $scope.recipe.recipeActionFields[property].value = $scope.recipe.publicRecipeActionFields[property].value;
        }

        for (property in $scope.recipe.publicRecipeActionFields) {
            $scope.recipe.recipeActionFields[property].value = $scope.recipe.publicRecipeActionFields[property].value;
        }
        delete ($scope.recipe.publicRecipeActionFields);
        delete ($scope.recipe.publicRecipeTriggerFields);


        $scope.triggerChannelImage = 'img/' + $scope.recipe.trigger.channel + '.png';
        $scope.actionChannelImage = 'img/' + $scope.recipe.action.channel + '.png';

        // now i need to populate the divs
        for (property in $scope.recipe.recipeTriggerFields) {

            (function (property) {
                var inputGroup = $('<div>').attr({
                    class: 'input-group'
                });
                var span = ($('<span>').attr({class: 'input-group-addon'}).text($scope.recipe.trigger.triggerFields[property].name));
                var input = fieldInputFactory.createInput($scope.recipe.trigger.triggerFields[property].type, $scope.recipe.recipeTriggerFields[property], 'recipe.recipeTriggerFields.' + property + '.value');
                $(input).change(function () {
                    if ($(input).hasClass('ng-invalid')) {
                        if ($(input).hasClass('alert-danger') == false) {
                            $(input).addClass('alert-danger');
                            fieldsErrorsNumber++;
                        }
                    }
                    else {
                        if ($(input).hasClass('alert-danger')) {
                            $(input).removeClass('alert-danger');
                            fieldsErrorsNumber--;
                        }
                    }
                });
                inputGroup.append(span).append(input);
                $('#triggersDiv').append(inputGroup);
                $compile(input)($scope);
                if ($scope.recipe.trigger.triggerFields[property].type != 'NULLABLETEXT')){
                  $(input).addClass('alert-danger');
                  fieldsErrorsNumber++;
                }
            })(property);

        }


        for (property in $scope.recipe.recipeActionFields) {
            (function (property) {
                var inputGroup = $('<div>').attr({
                    class: 'input-group'
                });
                var span = ($('<span>').attr({class: 'input-group-addon'}).text($scope.recipe.action.actionFields[property].name));
                var input = fieldInputFactory.createInput($scope.recipe.action.actionFields[property].type, $scope.recipe.recipeActionFields[property], 'recipe.recipeActionFields.' + property + '.value');

                var button = ($('<div>').attr({
                    class: 'input-group-addon',
                    'data-toggle': 'modal',
                    'data-target': '#ingredientsModal'
                }));
                button.append($('<i>').attr({'class': 'fa fa-flask'}));
                button.on('click', function () {
                    $scope.inputSelected = input;
                    $scope.model = property;
                });

                $(input).change(function () {
                    if ($(input).hasClass('ng-invalid')) {
                        if ($(input).hasClass('alert-danger') == false) {
                            $(input).addClass('alert-danger');
                            fieldsErrorsNumber++;
                        }
                    }
                    else {
                        if ($(input).hasClass('alert-danger')) {
                            $(input).removeClass('alert-danger');
                            fieldsErrorsNumber--;
                        }
                    }
                });

                inputGroup.append(span).append(input);
                if ($scope.recipe.action.actionFields[property].type == 'TEXT' ||
                    $scope.recipe.action.actionFields[property].type == 'LONGTEXT' ||
                    $scope.recipe.action.actionFields[property].type == 'NULLABLETEXT') inputGroup.append(button);
                $('#actionFieldsDiv').append(inputGroup);

                $('#actionsDiv').append(inputGroup);
                $compile(input)($scope);
                if ($scope.recipe.trigger.triggerFields[property].type != 'NULLABLETEXT')){
                  $(input).addClass('alert-danger');
                  fieldsErrorsNumber++;
                }
            })(property);
        }


    }, function errorCallback(response) {
        console.log(response);
    });

    self.importRecipe = function () {
        if (fieldsErrorsNumber > 0) {
            console.error('there are still ' + fieldsErrorsNumber + ' errors');
            return;
        }
        $http({
            method: 'POST',
            url: 'api/myrecipes',
            data: JSON.stringify($scope.recipe),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function successCallback(result) {
            $location.path('myRecipes');

        }, function errorCallback(result) {
            $scope.error = true;
            $scope.errorMessage = result.data.message;
        });
    }

    self.insertIngredient = function () {
        // in $scope.inputSelected i have the input where i should place the new element
        // in $scope.selectedIngredient i have the ingredient that that user wants to insert
        // $scope.model contains the selected action field
        var $txt = $($scope.inputSelected);
        var caretPos = $txt[0].selectionStart;
        var textAreaTxt = $txt.val();
        console.log($scope.model);
        console.log($scope.recipe.recipeActionFields);
        var txtToAdd = "{{" + $scope.selectedIngredient + "}}";
        $scope.recipe.recipeActionFields[$scope.model].value = (textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos) );
    }

    self.favoriteRecipe = function () {
        var promise;
        if ($scope.recipe.favorite == true)
            promise = $http.post('api/publicrecipes/' + $scope.recipe.id + '/remove');
        else
            promise = $http.post('api/publicrecipes/' + $scope.recipe.id + '/add');

        promise.then(function successCallback() {
            $scope.recipe.favorite = !$scope.recipe.favorite;
        }, function errorCallback(response) {
            console.error(response);
        })
    }
}]);
