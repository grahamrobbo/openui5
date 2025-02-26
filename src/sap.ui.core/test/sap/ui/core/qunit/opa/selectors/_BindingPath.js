/*global QUnit*/
sap.ui.define([
    "sap/ui/test/selectors/_ControlSelectorGenerator",
    "sap/ui/model/resource/ResourceModel",
    "sap/m/Text",
    "../fixture/bindingPath",
    "sap/ui/thirdparty/jquery"
], function (_ControlSelectorGenerator, ResourceModel, Text, fixture, $) {
    "use strict";

    QUnit.module("_BindingPath - properties", {
        beforeEach: function () {
            fixture.PropertyFixture.beforeEach.call(this);
        },
        afterEach: function () {
            fixture.PropertyFixture.afterEach.call(this);
        }
    });

    QUnit.test("Should generate selector for bound property", function (assert) {
        var fnDone = assert.async();
        var aData = [
            {type: "named", modelName: "myModel", prefix: "", control: this.oNamedModelPropertyText},
            {type: "nameless", prefix: "/", control: this.oPropertyText}
        ];
        Promise.all(aData.map(function (mData) {
            return _ControlSelectorGenerator._generate({control: mData.control})
                .then(function (mSelector) {
                    assert.strictEqual(mSelector.bindingPath.propertyPath, mData.prefix + "propertyText", "Should generate selector with correct binding path");
                    assert.strictEqual(mSelector.bindingPath.modelName, mData.modelName, "Should generate selector with model name");
                });
        })).finally(fnDone);
    });

    QUnit.test("Should generate selector for composite property", function (assert) {
        var fnDone = assert.async();
        var aData = [
            {type: "named", modelName: "myModel", prefix: "", control: this.oNamedCompositePropertyText},
            {type: "nameless", prefix: "/", control: this.oCompositePropertyText}
        ];
        Promise.all(aData.map(function (mData) {
            return _ControlSelectorGenerator._generate({control: mData.control, includeAll: true})
                .then(function (aSelectors) {
                    var aBingingPathSelectors = aSelectors[0];
                    assert.strictEqual(aSelectors.length, 2, "Should generate two selectors for " + mData.type + " model");
                    assert.strictEqual(aBingingPathSelectors[0].bindingPath.propertyPath, mData.prefix + "compositeProperty/partOne", "Should generate first selector with correct binding path");
                    assert.strictEqual(aBingingPathSelectors[1].bindingPath.propertyPath, mData.prefix + "compositeProperty/partTwo", "Should generate second selector with correct binding path");
                    assert.strictEqual(aBingingPathSelectors[0].bindingPath.modelName, mData.modelName, "Should generate first selector with model name");
                    assert.strictEqual(aBingingPathSelectors[1].bindingPath.modelName, mData.modelName, "Should generate second selector with model name");
                });
        })).finally(fnDone);
    });

    QUnit.test("Should not generate selector when there is no binding for the property", function (assert) {
        var fnDone = assert.async();
        this.oCompositePropertyText.unbindText();
        _ControlSelectorGenerator._generate({control: this.oCompositePropertyText, shallow: true})
            .catch(function (oError) {
                assert.ok(oError.message.match(/Could not generate a selector for control/), "Should not generate selector");
            }).finally(fnDone);
    });

    QUnit.module("_BindingPath - i18n", {
        beforeEach: function () {
            var oResourceModel = new ResourceModel({
                bundleUrl: "test-resources/sap/ui/core/qunit/opa/selectors/i18n.properties"
			});
			sap.ui.getCore().setModel(oResourceModel, "i18n");
            this.oPropertyText = new Text({text: "{i18n>propertyText}"});
            this.oPropertyText.placeAt("qunit-fixture");
            sap.ui.getCore().applyChanges();
        },
        afterEach: function () {
            sap.ui.getCore().setModel();
            this.oPropertyText.destroy();
        }
    });

    QUnit.test("Should generate selector for bound property", function (assert) {
        var fnDone = assert.async();
        _ControlSelectorGenerator._generate({control: this.oPropertyText})
            .then(function (mSelector) {
                assert.strictEqual(mSelector.i18NText.propertyName, "text", "Should generate selector with correct binding path");
                assert.strictEqual(mSelector.i18NText.key, "propertyText", "Should generate selector with correct binding path");
                assert.strictEqual(mSelector.i18NText.modelName, "i18n", "Should generate selector with correct binding path");
            }).finally(fnDone);
    });

    QUnit.module("_BindingPath - object binding", {
        beforeEach: function () {
            fixture.ObjectFixture.beforeEach.call(this);
        },
        afterEach: function () {
            fixture.ObjectFixture.afterEach.call(this);
        }
    });

    QUnit.test("Should generate selector for control with bound object", function (assert) {
        var fnDone = assert.async();
        _ControlSelectorGenerator._generate({control: this.oInput, includeAll: true})
            .then(function (aSelectors) {
                var aBindingPathSelectors = aSelectors[0];
                assert.strictEqual(aBindingPathSelectors[0].bindingPath.path, "/compositeProperty", "Should generate selector with correct binding path");
                assert.strictEqual(aBindingPathSelectors[0].bindingPath.propertyPath, "partOne", "Should generate selector with correct binding property path");
                assert.strictEqual(aBindingPathSelectors[1][0].bindingPath.path, "/compositeProperty", "Should generate selector with correct binding path");
                assert.strictEqual(aBindingPathSelectors[1][0].bindingPath.propertyPath, "partTwo", "Should generate selector with correct binding property path");
            }).finally(fnDone);
    });

    QUnit.test("Should generate selector for control with parent object binding", function (assert) {
        var fnDone = assert.async();
        _ControlSelectorGenerator._generate({control: this.oTexts[0], includeAll: true})
            .then(function (aSelectors) {
                assert.strictEqual(aSelectors[0][0].bindingPath.path, "/compositeProperty", "Should generate selector with correct binding path");
                assert.strictEqual(aSelectors[0][0].bindingPath.propertyPath, "partOne", "Should generate selector with correct binding property path");
                return _ControlSelectorGenerator._generate({control: this.oTexts[1], includeAll: true});
            }.bind(this)).then(function (aSelectors) {
                assert.strictEqual(aSelectors[0][0].bindingPath.path, "/compositeProperty", "Should generate selector with correct binding path");
                assert.strictEqual(aSelectors[0][0].bindingPath.propertyPath, "partTwo", "Should generate selector with correct binding property path");
            }).finally(fnDone);
    });

    QUnit.module("_BindingPath - aggregation", {
        beforeEach: function () {
            fixture.AggregationFixture.beforeEach.call(this);
        },
        afterEach: function () {
            fixture.AggregationFixture.afterEach.call(this);
        }
    });

    QUnit.test("Should generate selector for control with aggregation", function (assert) {
        var fnDone = assert.async();
        _ControlSelectorGenerator._generate({control: this.aLists[0]})
            .then(function (mSelector) {
                assert.strictEqual(mSelector.bindingPath.propertyPath, "/items", "Should generate selector with binding path");
                return _ControlSelectorGenerator._generate({control: this.aLists[1]});
            }.bind(this)).then(function (mSelector) {
                assert.strictEqual(mSelector.bindingPath.propertyPath, "/emptyItems", "Should generate selector with binding path");
                return _ControlSelectorGenerator._generate({control: this.aLists[2]});
            }.bind(this)).then(function (mSelector) {
                assert.strictEqual(mSelector.bindingPath.propertyPath, "/composite/items", "Should generate selector with binding path");
            }).finally(fnDone);
    });
});
