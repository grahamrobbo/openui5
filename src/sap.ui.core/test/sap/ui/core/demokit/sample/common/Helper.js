/*!
 * ${copyright}
 */

sap.ui.define("sap/ui/core/sample/common/Helper", [
	"sap/base/Log",
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/Interactable"
], function (Log, Opa5, EnterText, Press, Interactable) {
	"use strict";
	var Helper;

	// Helper functions used within sap.ui.core.sample.common namespace
	Helper = {

		/**
		 * Change the value of a sap.m.Input field
		 *
		 * @param {sap.ui.test.Opa5} oOpa5
		 *  An instance of Opa5 to access the current page object
		 * @param {string} sViewName
		 *  The name of the view which contains the searched control
		 * @param {string} sId
		 *  The ID of a "sap.m.Input" control inside the view sViewName
		 * @param {string} sValue
		 *  The external value of the control as a string
		 * @returns {jQuery.promise}
		 *  A promise resolved by {@link sap.ui.test.Opa5#waitFor}
		 */
		changeInputValue : function (oOpa5, sViewName, sId, sValue) {
			return oOpa5.waitFor({
				actions : new EnterText({clearTextFirst : true, text : sValue}),
				controlType : "sap.m.Input",
				id : sId,
				success : function (oInput) {
					Opa5.assert.strictEqual(oInput.getValue(), sValue, sId + ": Input value set to "
						+ sValue);
				},
				viewName : sViewName
			});
		},

		/**
		 * Checks if a sap.m.Button is disabled.
		 *
		 * @param {sap.ui.test.Opa5} oOpa5
		 *  An instance of Opa5 to access the current page object
		 * @param {string} sViewName
		 *  The name of the view which contains the searched control
		 * @param {string} sButtonId
		 *  The ID of a "sap.m.Button" control inside the view sViewName
		 * @returns {jQuery.promise}
		 *  A promise resolved by {@link sap.ui.test.Opa5#waitFor}
		 */
		checkButtonDisabled : function (oOpa5, sViewName, sButtonId) {
			return oOpa5.waitFor({
				autoWait : false,
				controlType : "sap.m.Button",
				id : sButtonId,
				success : function (oButton) {
					Opa5.assert.ok(oButton.getEnabled() === false,
						"Button is disabled: " + sButtonId);
				},
				viewName : sViewName
			});
		},

		/**
		 * Checks if a sap.m.Button is enabled.
		 *
		 * @param {sap.ui.test.Opa5} oOpa5
		 *  An instance of Opa5 to access the current page object
		 * @param {string} sViewName
		 *  The name of the view which contains the searched control
		 * @param {string} sButtonId
		 *  The ID of a "sap.m.Button" control inside the view sViewName
		 * @returns {jQuery.promise}
		 *  A promise resolved by {@link sap.ui.test.Opa5#waitFor}
		 */
		checkButtonEnabled : function (oOpa5, sViewName, sButtonId) {
			return oOpa5.waitFor({
				controlType : "sap.m.Button",
				id : sButtonId,
				matchers : new Interactable(),
				success : function (oButton) {
					Opa5.assert.ok(oButton.getEnabled(), "Button is enabled: " + sButtonId);
				},
				viewName : sViewName
			});
		},

		/**
		 * Checks if a sap.m.Input is dirty or not.
		 *
		 * @param {sap.ui.test.Opa5} oOpa5
		 *  An instance of Opa5 to access the current page object
		 * @param {string} sViewName
		 *  The name of the view which contains the searched control
		 * @param {string} sId
		 *  The ID of a "sap.m.Input" control inside the view sViewName
		 * @param {string} bIsDirty
		 *  Whether the control is expected dirty or not
		 * @returns {jQuery.promise}
		 *  A promise resolved by {@link sap.ui.test.Opa5#waitFor}
		 */
		checkInputIsDirty : function (oOpa5, sViewName, sId, bIsDirty) {
			return oOpa5.waitFor({
				controlType : "sap.m.Input",
				id : sId,
				success : function (oControl) {
					Opa5.assert.strictEqual(
						oControl.getBinding("value").getDataState().isControlDirty(),
						bIsDirty, "Control: " + sId + " is " + (bIsDirty ? "dirty" : "clean"));
				},
				viewName : sViewName
			});
		},

		/**
		 * Checks whether a sap.m.Input control has an expected value.
		 *
		 * @param {sap.ui.test.Opa5} oOpa5
		 *  An instance of Opa5 to access the current page object
		 * @param {string} sViewName
		 *  The name of the view which contains the searched control
		 * @param {string} sId
		 *  The ID of a "sap.m.Input" control inside the view sViewName
		 * @param {string} vValue
		 *  The expected value of the control
		 * @returns {jQuery.promise}
		 *  A promise resolved by {@link sap.ui.test.Opa5#waitFor}
		 */
		checkInputValue : function (oOpa5, sViewName, sId, vValue) {
			return oOpa5.waitFor({
				controlType : "sap.m.Input",
				id : sId,
				success : function (oControl) {
					Opa5.assert.strictEqual(
						oControl.getValue(), vValue, "Control: " + sId + " Value is: " + vValue);
				},
				viewName : sViewName
			});
		},

		/**
		 * Checks whether a sap.m.Input control has an expected value state and value state message.
		 *
		 * @param {sap.ui.test.Opa5} oOpa5
		 *  An instance of Opa5 to access the current page object
		 * @param {string} sViewName
		 *  The name of the view which contains the searched control
		 * @param {string} sId
		 *  The ID of a "sap.m.Input" control inside the view sViewName
		 * @param {sap.ui.core.ValueState} sValueState
		 *  The expected value state of the control
		 * @param {string} sMessage
		 *  The expected value state message of the control
		 * @returns {jQuery.promise}
		 *  A promise resolved by {@link sap.ui.test.Opa5#waitFor}
		 */
		checkInputValueState : function (oOpa5, sViewName, sId, sValueState, sMessage) {
			return oOpa5.waitFor({
				controlType : "sap.m.Input",
				id : sId,
				success : function (oInput) {
					Opa5.assert.strictEqual(oInput.getValueState(), sValueState,
						"checkInputValueState('" + sId + "', '" + sValueState + "')");
					if (sMessage) {
						Opa5.assert.strictEqual(oInput.getValueStateText(), sMessage,
							"ValueStateText: " + sMessage);
					}
				},
				viewName : sViewName
			});
		},

		/**
		 * Decides whether given log is related to OData V4 topic and has a log level which is at
		 * least WARNING
		 *
		 * @param {object} oLog
		 *  A single log entry returned by {@link sap.ui.base.Log.getLogEntries}
		 * @returns {boolean}
		 *  Whether the log matches to the criterias above or not
		 */
		isRelevantLog : function (oLog) {
			var sComponent = oLog.component || "";

			return oLog.level <= Log.Level.WARNING
				&& (sComponent.indexOf("sap.ui.base.BindingParser") === 0
					|| sComponent.indexOf("sap.ui.base.ExpressionParser") === 0
					|| sComponent.indexOf("sap.ui.core.sample.") === 0
					|| sComponent.indexOf("sap.ui.core.util.XMLPreprocessor") === 0
					|| sComponent.indexOf("sap.ui.model.odata.AnnotationHelper") === 0
					|| sComponent.indexOf("sap.ui.model.odata.ODataMetaModel") === 0
					|| sComponent.indexOf("sap.ui.model.odata.type.") === 0
					|| sComponent.indexOf("sap.ui.model.odata.v4.") === 0
					|| sComponent.indexOf("sap.ui.test.TestUtils") === 0);
		},

		/**
		 * Executes the Press() action on a "sap.m.Button" and adds a useful success message
		 *
		 * @param {sap.ui.test.Opa5} oOpa5
		 *  An instance of Opa5 to access the current page object
		 * @param {string} sViewName
		 *  The name of the view which contains the searched control
		 * @param {string} sId
		 *  The ID of a "sap.m.Button" control inside the view sViewName
		 * @returns {jQuery.promise}
		 *  A promise resolved by {@link sap.ui.test.Opa5#waitFor}
		 */
		pressButton : function (oOpa5, sViewName, sId) {
			return oOpa5.waitFor({
				actions : new Press(),
				controlType : "sap.m.Button",
				id : sId,
				success : function (oButton) {
					var sText = oButton.getTooltip() || oButton.getText() || sId;

					Opa5.assert.ok(true, "Button pressed: " + sText);
				},
				viewName : sViewName
			});
		}
	};

	return Helper;
}, /* bExport= */ true);
