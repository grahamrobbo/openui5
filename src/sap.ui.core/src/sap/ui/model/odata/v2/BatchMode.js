/*!
 * ${copyright}
 */

// Provides enumeration sap.ui.model.odata.v2.BatchMode
sap.ui.define(function() {
	"use strict";


	/**
	* Different modes for retrieving the count of collections
	*
	* @enum {string}
	* @public
	* @alias sap.ui.model.odata.v2.BatchMode
	*/
	var BatchMode = {
			/**
			 * No batch requests
			 * @public
			 */
			None: "None",

			/**
			 * Batch grouping enabled
			 * @public
			 */
			Group: "Group"
	};

	return BatchMode;

}, /* bExport= */ true);
