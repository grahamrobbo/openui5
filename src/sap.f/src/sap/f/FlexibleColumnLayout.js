/*!
 * ${copyright}
 */

// Provides control sap.f.FlexibleColumnLayout.
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./library",
	"sap/ui/Device",
	"sap/ui/core/ResizeHandler",
	"sap/ui/core/Control",
	"sap/m/library",
	"sap/m/Button",
	"sap/m/NavContainer",
	"sap/ui/core/Configuration",
	"sap/ui/core/theming/Parameters",
	'sap/ui/dom/units/Rem',
	"./FlexibleColumnLayoutRenderer",
	"sap/base/assert"
], function(
	jQuery,
	library,
	Device,
	ResizeHandler,
	Control,
	mobileLibrary,
	Button,
	NavContainer,
	Configuration,
	Parameters,
	DomUnitsRem,
	FlexibleColumnLayoutRenderer,
	assert
) {
	"use strict";


	// shortcut for sap.f.LayoutType
	var LT = library.LayoutType;


	/**
	 * Constructor for a new <code>sap.f.FlexibleColumnLayout</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Implements the master-detail-detail paradigm by displaying up to three pages in separate columns.
	 *
	 * <h3>Overview</h3>
	 *
	 * The control is logically similar to {@link sap.m.SplitContainer} with the difference that it capable of handling
	 * three columns (referred to as <code>Begin</code>, <code>Mid</code> and <code>End</code>) rather than two
	 * (<code>Master</code>, <code>Detail</code>). The width of the three columns is variable.
	 *
	 * There are several possible layouts that can be changed either with the control's API, or by the user with the help of layout arrows.
	 *
	 * Internally the control makes use of three instances of {@link sap.m.NavContainer}, thus forming the three columns.
	 *
	 * <h3>Usage</h3>
	 *
	 * Use this control for applications that need to display several logical levels of related information side by side (e.g. list of items, item, sub-item, etc.).
	 * The control is flexible in a sense that the application can focus the user's attention on one particular column by making it larger or even fullscreen.
	 *
	 * The columns are accessible with the <code>beginColumnPages</code>, <code>midColumnPages</code> and <code>endColumnPages</code> aggregations.
	 *
	 * The relative sizes and the visibility of the three columns are determined based on the value of the {@link sap.f.LayoutType layout} property.
	 *
	 * Changes to the layout due to user interaction are communicated to the app with the <code>stateChange</code> event.
	 *
	 * <ul><b>Notes:</b>
	 * <li>To easily implement the recommended UX design of a <code>sap.f.FlexibleColumnLayout</code>-based app,
	 * you can use the <code>sap.f.FlexibleColumnLayoutSemanticHelper</code> class.</li>
	 * <li>To facilitate the navigation and view loading, you can use the {@link sap.f.routing.Router} </li></ul>
	 *
	 * <h3>Responsive Behavior</h3>
	 *
	 * The control automatically displays the maximum possible number of columns based on the device size and current <code>layout</code>.
	 * The app does not need to take into consideration the current device/screen size, but only to add content to the
	 * columns and change the value of the <code>layout</code> property.
	 *
	 * For detailed information, see {@link sap.f.LayoutType LayoutType} enumeration.
	 *
	 * @extends sap.ui.core.Control
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @public
	 * @since 1.46
	 * @alias sap.f.FlexibleColumnLayout
	 * @see {@link topic:59a0e11712e84a648bb990a1dba76bc7 Flexible Column Layout}
	 * @see {@link fiori:https://experience.sap.com/fiori-design-web/flexible-column-layout/ Flexible Column Layout}
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FlexibleColumnLayout = Control.extend("sap.f.FlexibleColumnLayout", {
		metadata: {
			properties: {

				/**
				 * Determines the layout of the control - number of visible columns and their relative sizes.
				 *
				 * For more details, see {@link topic:3b9f760da5b64adf8db7f95247879086 Types of Layout} in the documentation.
				 */
				layout: {type: "sap.f.LayoutType", defaultValue: LT.OneColumn},

				/**
				 * Determines the type of the transition/animation to apply for the <code>Begin</code> column when <code>to()</code> is called without defining the
				 * transition to use. The default is <code>slide</code>, other options are <code>fade</code>, <code>flip</code>, <code>show</code>, and the names of any registered custom transitions.
				 */
				defaultTransitionNameBeginColumn : {type : "string", group : "Appearance", defaultValue : "slide"},

				/**
				 * Determines the type of the transition/animation to apply for the <code>Mid</code> column when <code>to()</code> is called without defining the
				 * transition to use. The default is <code>slide</code>, other options are <code>fade</code>, <code>flip</code>, <code>show</code>, and the names of any registered custom transitions.
				 */
				defaultTransitionNameMidColumn : {type : "string", group : "Appearance", defaultValue : "slide"},

				/**
				 * Determines the type of the transition/animation to apply for the <code>End</code> column when <code>to()</code> is called without defining the
				 * transition to use. The default is <code>slide</code>, other options are <code>fade</code>, <code>flip</code>, <code>show</code>, and the names of any registered custom transitions.
				 */
				defaultTransitionNameEndColumn : {type : "string", group : "Appearance", defaultValue : "slide"},

				/**
				 * Specifies the background color of the content. The visualization of the different options depends on the used theme.
				 * @since 1.54
				 */
				backgroundDesign: {type: "sap.m.BackgroundDesign",  group: "Appearance", defaultValue: mobileLibrary.BackgroundDesign.Transparent}
			},
			aggregations: {
				/**
				 * The content entities between which the <code>FlexibleColumnLayout</code> navigates in the <code>Begin</code> column.
				 *
				 * These should be any control with page semantics.
				 * These aggregated controls will receive navigation events like {@link sap.m.NavContainerChild#event:beforeShow beforeShow}, they are documented in the pseudo interface {@link sap.m.NavContainerChild sap.m.NavContainerChild}.
				 */
				beginColumnPages: {type: "sap.ui.core.Control", multiple: true, forwarding: {getter: "_getBeginColumn", aggregation: "pages"}},
				/**
				 * The content entities between which the <code>FlexibleColumnLayout</code> navigates in the <code>Mid</code> column.
				 *
				 * These should be any control with page semantics.
				 * These aggregated controls will receive navigation events like {@link sap.m.NavContainerChild#event:beforeShow beforeShow}, they are documented in the pseudo interface {@link sap.m.NavContainerChild sap.m.NavContainerChild}.
				 */
				midColumnPages: {type: "sap.ui.core.Control", multiple: true, forwarding: {getter: "_getMidColumn", aggregation: "pages"}},
				/**
				 * The content entities between which the <code>FlexibleColumnLayout</code> navigates in the <code>End</code> column.
				 *
				 * These should be any control with page semantics.
				 * These aggregated controls will receive navigation events like {@link sap.m.NavContainerChild#event:beforeShow beforeShow}, they are documented in the pseudo interface {@link sap.m.NavContainerChild sap.m.NavContainerChild}.
				 */
				endColumnPages: {type: "sap.ui.core.Control", multiple: true, forwarding: {getter: "_getEndColumn", aggregation: "pages"}},

				_beginColumnNav: {type : "sap.m.NavContainer", multiple : false, visibility : "hidden"},
				_midColumnNav: {type : "sap.m.NavContainer", multiple : false, visibility : "hidden"},
				_endColumnNav: {type : "sap.m.NavContainer", multiple : false, visibility : "hidden"},

				_beginColumnBackArrow: {type: "sap.m.Button", multiple: false, visibility: "hidden"},
				_midColumnForwardArrow: {type: "sap.m.Button", multiple: false, visibility: "hidden"},
				_midColumnBackArrow: {type: "sap.m.Button", multiple: false, visibility: "hidden"},
				_endColumnForwardArrow: {type: "sap.m.Button", multiple: false, visibility: "hidden"}
			},
			associations : {

				/**
				 * Sets the initial <code>Begin</code> column page, which is displayed on application launch.
				 */
				initialBeginColumnPage: {type : "sap.ui.core.Control", multiple : false},
				/**
				 * Sets the initial <code>Mid</code> column page, which is displayed on application launch.
				 */
				initialMidColumnPage: {type : "sap.ui.core.Control", multiple : false},
				/**
				 * Sets the initial <code>End</code> column page, which is displayed on application launch.
				 */
				initialEndColumnPage: {type : "sap.ui.core.Control", multiple : false}
			},
			events: {
				/**
				 * Fired when there is a change in the <code>layout</code> property or in the maximum number of columns that can be displayed at once.
				 * <br/></br>
				 * <ul>The interactions that may lead to a state change are:
				 *  <li>the property <code>layout</code> was changed indirectly by the user clicking a layout arrow</li>
				 *  <li>the user resized the browser beyond a breakpoint, thus changing the maximum number of columns that can be displayed at once.</li></ul>
				 * <br/><br/>
				 * <b>Note: </b>The event is suppressed while the control has zero width and will be fired the first time it gets a non-zero width
				 *
				 */
				stateChange: {
					parameters: {
						/**
						 * The value of the <code>layout</code> property
						 */
						layout: {
							type: "sap.f.LayoutType"
						},
						/**
						 * The maximum number of columns that can be displayed at once based on the available screen size and control settings.
						 *
						 * <ul>Possible values are:
						 * <li>3 for browser size of 1280px or more</li>
						 * <li>2 for browser size between 960px and 1280px</li>
						 * <li>1 for browser size less than 960px</li></ul>
						 */
						maxColumnsCount: {
							type: "int"
						},
						/**
						 * Indicates whether the layout changed as a result of the user clicking a layout arrow
						 */
						isNavigationArrow: {
							type: "boolean"
						},
						/**
						 * Indicates whether the maximum number of columns that can be displayed at once changed
						 */
						isResize: {
							type: "boolean"
						}

					}
				},

				/**
				 * Fires when navigation between two pages in the <code>Begin</code> column has been triggered. The transition (if any) to the new page has not started yet.
				 * This event can be aborted by the application with preventDefault(), which means that there will be no navigation.
				 */
				beginColumnNavigate : {
					allowPreventDefault : true,
					parameters : {

						/**
						 * The page, which was displayed before the current navigation.
						 */
						from : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which was displayed before the current navigation.
						 */
						fromId : {type : "string"},

						/**
						 * The page, which will be displayed after the current navigation.
						 */
						to : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which will be displayed after the current navigation.
						 */
						toId : {type : "string"},

						/**
						 * Determines whether the "to" page (more precisely: a control with the ID of the page,
						 * which is currently being navigated to) has not been displayed/navigated to before.
						 */
						firstTime : {type : "boolean"},

						/**
						 * Determines whether this is a forward navigation, triggered by to().
						 */
						isTo : {type : "boolean"},

						/**
						 * Determines whether this is a back navigation, triggered by back().
						 */
						isBack : {type : "boolean"},

						/**
						 * Determines whether this is a navigation to the root page, triggered by backToTop().
						 */
						isBackToTop : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to a specific page, triggered by backToPage().
						 */
						isBackToPage : {type : "boolean"},

						/**
						 * Determines how the navigation was triggered, possible values are "to", "back", "backToPage", and "backToTop".
						 */
						direction : {type : "string"}
					}
				},

				/**
				 * Fires when navigation between two pages in the <code>Begin</code> column has completed.
				 *
				 * NOTE: In case of animated transitions this event is fired with some delay after the navigate event.
				 */
				afterBeginColumnNavigate : {
					parameters : {

						/**
						 * The page, which had been displayed before navigation.
						 */
						from : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which had been displayed before navigation.
						 */
						fromId : {type : "string"},

						/**
						 * The page, which is now displayed after navigation.
						 */
						to : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which is now displayed after navigation.
						 */
						toId : {type : "string"},

						/**
						 * Whether the "to" page (more precisely: a control with the ID of the page, which has been navigated to)
						 * has not been displayed/navigated to before.
						 */
						firstTime : {type : "boolean"},

						/**
						 * Determines whether was a forward navigation, triggered by to().
						 */
						isTo : {type : "boolean"},

						/**
						 * Determines whether this was a back navigation, triggered by back().
						 */
						isBack : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to the root page, triggered by backToTop().
						 */
						isBackToTop : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to a specific page, triggered by backToPage().
						 */
						isBackToPage : {type : "boolean"},

						/**
						 * Determines how the navigation was triggered, possible values are "to", "back", "backToPage", and "backToTop".
						 */
						direction : {type : "string"}
					}
				},

				/**
				 * Fires when navigation between two pages in the <code>Mid</code> column has been triggered. The transition (if any) to the new page has not started yet.
				 * This event can be aborted by the application with preventDefault(), which means that there will be no navigation.
				 */
				midColumnNavigate : {
					allowPreventDefault : true,
					parameters : {

						/**
						 * The page, which was displayed before the current navigation.
						 */
						from : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which was displayed before the current navigation.
						 */
						fromId : {type : "string"},

						/**
						 * The page, which will be displayed after the current navigation.
						 */
						to : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which will be displayed after the current navigation.
						 */
						toId : {type : "string"},

						/**
						 * Determines whether the "to" page (more precisely: a control with the ID of the page,
						 * which is currently being navigated to) has not been displayed/navigated to before.
						 */
						firstTime : {type : "boolean"},

						/**
						 * Determines whether this is a forward navigation, triggered by to().
						 */
						isTo : {type : "boolean"},

						/**
						 * Determines whether this is a back navigation, triggered by back().
						 */
						isBack : {type : "boolean"},

						/**
						 * Determines whether this is a navigation to the root page, triggered by backToTop().
						 */
						isBackToTop : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to a specific page, triggered by backToPage().
						 */
						isBackToPage : {type : "boolean"},

						/**
						 * Determines how the navigation was triggered, possible values are "to", "back", "backToPage", and "backToTop".
						 */
						direction : {type : "string"}
					}
				},

				/**
				 * Fires when navigation between two pages in the <code>Mid</code> column has completed.
				 *
				 * NOTE: In case of animated transitions this event is fired with some delay after the navigate event.
				 */
				afterMidColumnNavigate : {
					parameters : {

						/**
						 * The page, which had been displayed before navigation.
						 */
						from : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which had been displayed before navigation.
						 */
						fromId : {type : "string"},

						/**
						 * The page, which is now displayed after navigation.
						 */
						to : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which is now displayed after navigation.
						 */
						toId : {type : "string"},

						/**
						 * Whether the "to" page (more precisely: a control with the ID of the page, which has been navigated to)
						 * has not been displayed/navigated to before.
						 */
						firstTime : {type : "boolean"},

						/**
						 * Determines whether was a forward navigation, triggered by to().
						 */
						isTo : {type : "boolean"},

						/**
						 * Determines whether this was a back navigation, triggered by back().
						 */
						isBack : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to the root page, triggered by backToTop().
						 */
						isBackToTop : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to a specific page, triggered by backToPage().
						 */
						isBackToPage : {type : "boolean"},

						/**
						 * Determines how the navigation was triggered, possible values are "to", "back", "backToPage", and "backToTop".
						 */
						direction : {type : "string"}
					}
				},

				/**
				 * Fires when navigation between two pages in the <code>End</code> column has been triggered. The transition (if any) to the new page has not started yet.
				 * This event can be aborted by the application with preventDefault(), which means that there will be no navigation.
				 */
				endColumnNavigate : {
					allowPreventDefault : true,
					parameters : {

						/**
						 * The page, which was displayed before the current navigation.
						 */
						from : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which was displayed before the current navigation.
						 */
						fromId : {type : "string"},

						/**
						 * The page, which will be displayed after the current navigation.
						 */
						to : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which will be displayed after the current navigation.
						 */
						toId : {type : "string"},

						/**
						 * Determines whether the "to" page (more precisely: a control with the ID of the page,
						 * which is currently being navigated to) has not been displayed/navigated to before.
						 */
						firstTime : {type : "boolean"},

						/**
						 * Determines whether this is a forward navigation, triggered by to().
						 */
						isTo : {type : "boolean"},

						/**
						 * Determines whether this is a back navigation, triggered by back().
						 */
						isBack : {type : "boolean"},

						/**
						 * Determines whether this is a navigation to the root page, triggered by backToTop().
						 */
						isBackToTop : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to a specific page, triggered by backToPage().
						 */
						isBackToPage : {type : "boolean"},

						/**
						 * Determines how the navigation was triggered, possible values are "to", "back", "backToPage", and "backToTop".
						 */
						direction : {type : "string"}
					}
				},

				/**
				 * Fires when navigation between two pages in the <code>End</code> column has completed.
				 *
				 * NOTE: In case of animated transitions this event is fired with some delay after the navigate event.
				 */
				afterEndColumnNavigate : {
					parameters : {

						/**
						 * The page, which had been displayed before navigation.
						 */
						from : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which had been displayed before navigation.
						 */
						fromId : {type : "string"},

						/**
						 * The page, which is now displayed after navigation.
						 */
						to : {type : "sap.ui.core.Control"},

						/**
						 * The ID of the page, which is now displayed after navigation.
						 */
						toId : {type : "string"},

						/**
						 * Whether the "to" page (more precisely: a control with the ID of the page, which has been navigated to)
						 * has not been displayed/navigated to before.
						 */
						firstTime : {type : "boolean"},

						/**
						 * Determines whether was a forward navigation, triggered by to().
						 */
						isTo : {type : "boolean"},

						/**
						 * Determines whether this was a back navigation, triggered by back().
						 */
						isBack : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to the root page, triggered by backToTop().
						 */
						isBackToTop : {type : "boolean"},

						/**
						 * Determines whether this was a navigation to a specific page, triggered by backToPage().
						 */
						isBackToPage : {type : "boolean"},

						/**
						 * Determines how the navigation was triggered, possible values are "to", "back", "backToPage", and "backToTop".
						 */
						direction : {type : "string"}
					}
				}
			}
		}
	});

	FlexibleColumnLayout.COLUMN_RESIZING_ANIMATION_DURATION = 560; // ms
	FlexibleColumnLayout.PINNED_COLUMN_CLASS_NAME = "sapFFCLPinnedColumn";
	FlexibleColumnLayout.prototype.init = function () {

		// Create the 3 nav containers
		this._initNavContainers();

		// Create the expand/collapse arrows
		this._initButtons();

		// Holds an object, responsible for saving and searching the layout history
		this._oLayoutHistory = new LayoutHistory();

		// Indicates if there are rendered pages inside columns
		this._oRenderedColumnPagesBoolMap = {};

		// We need to have column navigating buttons single width for animations of the layout
		this._iNavigationArrowWidth = DomUnitsRem.toPx(Parameters.get("_sap_f_FCL_navigation_arrow_width"));
	};

	/**
	 * Called on after rendering of the internal <code>NavContainer</code> instances to check their rendered pages
	 * @private
	 */
	FlexibleColumnLayout.prototype._onNavContainerRendered = function (oEvent) {

		var oColumnNavContainer = oEvent.srcControl,
			bHasPages = oColumnNavContainer.getPages().length > 0,
			bHadAnyColumnPagesRendered = this._hasAnyColumnPagesRendered();

		this._setColumnPagesRendered(oColumnNavContainer.getId(), bHasPages);

		if (this._hasAnyColumnPagesRendered() !== bHadAnyColumnPagesRendered) {
			this._hideShowArrows();
		}
	};

	/**
	 * Instantiates a nav container for the column and binds events
	 * @param {string} sColumn - the column for which a nav container must be created
	 * @returns {*}
	 * @private
	 */
	FlexibleColumnLayout.prototype._createNavContainer = function (sColumn) {
		var sColumnCap = sColumn.charAt(0).toUpperCase() + sColumn.slice(1);
		var oNavContainer = new NavContainer(this.getId() + "-" + sColumn + "ColumnNav", {
			navigate: function(oEvent){
				this._handleNavigationEvent(oEvent, false, sColumn);
			}.bind(this),
			afterNavigate: function(oEvent){
				this._handleNavigationEvent(oEvent, true, sColumn);
			}.bind(this),
			defaultTransitionName: this["getDefaultTransitionName" + sColumnCap + "Column"]()
		});

		oNavContainer.addDelegate({"onAfterRendering": this._onNavContainerRendered}, this);

		return oNavContainer;
	};

	/**
	 * Proxies the navigation events from the internal nav containers to the app.
	 * @param oEvent
	 * @param {boolean} bAfter
	 * @param {string} sColumn
	 * @private
	 */
	FlexibleColumnLayout.prototype._handleNavigationEvent = function(oEvent, bAfter, sColumn){
		var sEventName,
			bContinue;

		if (bAfter) {
			sEventName = "after" + (sColumn.charAt(0).toUpperCase() + sColumn.slice(1)) + "ColumnNavigate";
		} else {
			sEventName = sColumn + "ColumnNavigate";
		}

		bContinue = this.fireEvent(sEventName, oEvent.mParameters, true);
		if (!bContinue) {
			oEvent.preventDefault();
		}
	};

	/**
	 * Getter for the Begin column nav container
	 * @returns {*}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getBeginColumn = function () {
		return this.getAggregation("_beginColumnNav");
	};

	/**
	 * Getter for the Mid column nav container
	 * @returns {*}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getMidColumn = function () {
		return this.getAggregation("_midColumnNav");
	};

	/**
	 * Getter for the End column nav container
	 * @returns {*}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getEndColumn = function () {
		return this.getAggregation("_endColumnNav");
	};

	/**
	 * Updates the content of a column by flushing its container div only
	 * @param {string} sColumn
	 * @private
	 */
	FlexibleColumnLayout.prototype._flushColumnContent = function (sColumn) {
		var oControl = this.getAggregation("_" + sColumn + "ColumnNav"),
			oRm = sap.ui.getCore().createRenderManager();

		oRm.renderControl(oControl);
		oRm.flush(this._$columns[sColumn].find(".sapFFCLColumnContent")[0], undefined, true);
		oRm.destroy();
	};

	FlexibleColumnLayout.prototype.setLayout = function (sNewLayout) {
		sNewLayout = this.validateProperty("layout", sNewLayout);

		var sCurrentLayout = this.getLayout();

		if (sCurrentLayout === sNewLayout) {
			return this;
		}

		var vResult = this.setProperty("layout", sNewLayout, true);
		this._oLayoutHistory.addEntry(sNewLayout);
		this._hideShowArrows();
		this._resizeColumns();


		return vResult;
	};

	FlexibleColumnLayout.prototype.onBeforeRendering = function () {
		this._deregisterResizeHandler();
	};

	FlexibleColumnLayout.prototype.onAfterRendering = function () {
		this._registerResizeHandler();

		this._cacheDOMElements();

		this._hideShowArrows();
		this._resizeColumns();

		this._flushColumnContent("begin");
		this._flushColumnContent("mid");
		this._flushColumnContent("end");

		this._fireStateChange(false, false);
	};

	FlexibleColumnLayout.prototype._getControlWidth = function () {
		return this.$().width();
	};

	FlexibleColumnLayout.prototype.exit = function () {
		this._oRenderedColumnPagesBoolMap = null;
		this._deregisterResizeHandler();
		this._handleEvent(jQuery.Event("Destroy"));
	};

	FlexibleColumnLayout.prototype._registerResizeHandler = function () {
		assert(!this._iResizeHandlerId, "Resize handler already registered");
		this._iResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
	};

	FlexibleColumnLayout.prototype._deregisterResizeHandler = function () {
		if (this._iResizeHandlerId) {
			ResizeHandler.deregister(this._iResizeHandlerId);
			this._iResizeHandlerId = null;
		}
	};

	/**
	 * Creates the nav containers
	 * @private
	 */
	FlexibleColumnLayout.prototype._initNavContainers = function () {
		this.setAggregation("_beginColumnNav", this._createNavContainer("begin"), true);
		this.setAggregation("_midColumnNav", this._createNavContainer("mid"), true);
		this.setAggregation("_endColumnNav", this._createNavContainer("end"), true);
	};

	/**
	 * Creates the buttons for the layout arrows, which are initially hidden and will only be shown on demand without re-rendering.
	 * @private
	 */
	FlexibleColumnLayout.prototype._initButtons = function () {
		var oBeginColumnBackArrow = new Button(this.getId() + "-beginBack", {
			icon: "sap-icon://slim-arrow-left",
			tooltip: FlexibleColumnLayout._getResourceBundle().getText("FCL_BEGIN_COLUMN_BACK_ARROW"),
			type: "Transparent",
			press: this._onArrowClick.bind(this, "left")
		}).addStyleClass("sapFFCLNavigationButton").addStyleClass("sapFFCLNavigationButtonRight");
		this.setAggregation("_beginColumnBackArrow", oBeginColumnBackArrow, true);

		var oMidColumnForwardArrow = new Button(this.getId() + "-midForward", {
			icon: "sap-icon://slim-arrow-right",
			tooltip: FlexibleColumnLayout._getResourceBundle().getText("FCL_MID_COLUMN_FORWARD_ARROW"),
			type: "Transparent",
			press: this._onArrowClick.bind(this, "right")
		}).addStyleClass("sapFFCLNavigationButton").addStyleClass("sapFFCLNavigationButtonLeft");
		this.setAggregation("_midColumnForwardArrow", oMidColumnForwardArrow, true);

		var oMidColumnBackArrow = new Button(this.getId() + "-midBack", {
			icon: "sap-icon://slim-arrow-left",
			tooltip: FlexibleColumnLayout._getResourceBundle().getText("FCL_MID_COLUMN_BACK_ARROW"),
			type: "Transparent",
			press: this._onArrowClick.bind(this, "left")
		}).addStyleClass("sapFFCLNavigationButton").addStyleClass("sapFFCLNavigationButtonRight");
		this.setAggregation("_midColumnBackArrow", oMidColumnBackArrow, true);

		var oEndColumnForwardArrow = new Button(this.getId() + "-endForward", {
			icon: "sap-icon://slim-arrow-right",
			tooltip: FlexibleColumnLayout._getResourceBundle().getText("FCL_END_COLUMN_FORWARD_ARROW"),
			type: "Transparent",
			press: this._onArrowClick.bind(this, "right")
		}).addStyleClass("sapFFCLNavigationButton").addStyleClass("sapFFCLNavigationButtonLeft");
		this.setAggregation("_endColumnForwardArrow", oEndColumnForwardArrow, true);
	};

	/**
	 * Saves the DOM references of the columns and layout arrows.
	 * @private
	 */
	FlexibleColumnLayout.prototype._cacheDOMElements = function () {
		this._cacheColumns();

		if (!Device.system.phone) {
			this._cacheArrows();
		}
	};

	FlexibleColumnLayout.prototype._cacheColumns = function () {
		this._$columns = {
			begin: this.$("beginColumn"),
			mid: this.$("midColumn"),
			end: this.$("endColumn")
		};
	};

	FlexibleColumnLayout.prototype._cacheArrows = function () {
		this._$columnButtons = {
			beginBack: this.$("beginBack"),
			midForward: this.$("midForward"),
			midBack: this.$("midBack"),
			endForward: this.$("endForward")
		};
	};

	/**
	 * Returns the number of columns that have width > 0
	 * @returns {Array.<string>}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getVisibleColumnsCount = function () {
		return ["begin", "mid", "end"].filter(function (sColumn) {
			return this._getColumnSize(sColumn) > 0;
		}, this).length;
	};

	/**
	 * Returns the number of columns that have width > 0.
	 * @returns {number}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getVisibleArrowsCount = function () {
		if (!this._$columnButtons || !this._$columnButtons.length) {
			return 0;
		}

		return Object.keys(this._$columnButtons).filter(function (sArrow) {
			return this._$columnButtons[sArrow].data("visible");
		}, this).length;
	};

	/**
	 * Returns the total width available for the columns.
	 * @param {boolean} bHasInsetColumn
	 * @returns {number}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getTotalColumnsWidth = function (bHasInsetColumn) {
		var iSeparatorsCount = this._getVisibleArrowsCount();
		if (bHasInsetColumn) { // inset column has temporarily hidden nav arrow,
			// but empty space *in place of* the navigation arrows for visual consistency
			iSeparatorsCount++;
		}

		return this._getControlWidth() - iSeparatorsCount * this._iNavigationArrowWidth;
	};

	/**
	 * Changes the width
	 * @private
	 */
	FlexibleColumnLayout.prototype._resizeColumns = function () {
		var iPercentWidth,
			iAvailableWidth,
			aColumns = ["begin", "mid", "end"],
			bRtl = sap.ui.getCore().getConfiguration().getRTL(),
			bHasAnimations = sap.ui.getCore().getConfiguration().getAnimationMode() !== Configuration.AnimationMode.none,
			aActiveColumns,
			iVisibleColumnsCount,
			iDefaultVisibleColumnsCount,
			sLayout,
			sLastVisibleColumn,
			bInsetMidColumn;

		// Stop here if the control isn't rendered yet
		if (!this.isActive()) {
			return;
		}

		iVisibleColumnsCount = this._getVisibleColumnsCount();
		if (iVisibleColumnsCount === 0) {
			return;
		}

		sLayout = this.getLayout();
		// the default number of columns is the number at maximum control width
		iDefaultVisibleColumnsCount = this._getMaxColumnsCountForLayout(sLayout, FlexibleColumnLayout.DESKTOP_BREAKPOINT);

		sLastVisibleColumn = aColumns[iDefaultVisibleColumnsCount - 1];

		bInsetMidColumn = (iVisibleColumnsCount === 3) && (sLayout === LT.ThreeColumnsEndExpanded);
		// Calculate the width available for the columns
		iAvailableWidth = this._getTotalColumnsWidth(bInsetMidColumn);

		// Animations on - Before resizing pin the columns that should not be animated in order to create the reveal/conceal effect
		if (bHasAnimations) {

			aColumns.forEach(function (sColumn) {
				var bShouldConcealColumn = this._shouldConcealColumn(iDefaultVisibleColumnsCount, sColumn),
					bShouldRevealColumn = this._shouldRevealColumn(iDefaultVisibleColumnsCount, sColumn === sLastVisibleColumn),
					oColumn = this._$columns[sColumn];

				oColumn.toggleClass(FlexibleColumnLayout.PINNED_COLUMN_CLASS_NAME, bShouldConcealColumn || bShouldRevealColumn);

			}, this);
		}

		// Resize the columns according to the current layout
		aColumns.forEach(function (sColumn) {
			var oColumn = this._$columns[sColumn],
				iNewWidth,
				sNewWidth,
				bShouldConcealColumn;

			iPercentWidth = this._getColumnSize(sColumn);
			bShouldConcealColumn = bHasAnimations && this._shouldConcealColumn(iDefaultVisibleColumnsCount, sColumn);

			if (!bShouldConcealColumn) {
				// Add the active class to the column if it shows something
				oColumn.toggleClass("sapFFCLColumnActive", iPercentWidth > 0);
			}

			oColumn.toggleClass("sapFFCLColumnInset", bInsetMidColumn && (sColumn === "mid"));

			// Remove all the classes that are used for HCB theme borders, they will be set again later
			oColumn.removeClass("sapFFCLColumnHidden");
			oColumn.removeClass("sapFFCLColumnOnlyActive");
			oColumn.removeClass("sapFFCLColumnLastActive");
			oColumn.removeClass("sapFFCLColumnFirstActive");

			// Change the width of the column
			iNewWidth = Math.round(iAvailableWidth * (iPercentWidth / 100));
			if ([100, 0].indexOf(iPercentWidth) !== -1) {
				sNewWidth = iPercentWidth + "%";
			} else {
				sNewWidth = iNewWidth + "px";
			}


			// Animations on - suspend ResizeHandler while animation is running
			if (bHasAnimations) {

				var oColumnDomRef = oColumn.get(0);

				// Clear previous timeouts if present
				if (oColumn._iResumeResizeHandlerTimeout) {
					clearTimeout(oColumn._iResumeResizeHandlerTimeout);
				}

				// Suspending ResizeHandler temporarily
				ResizeHandler.suspend(oColumnDomRef);

				// Schedule resume of ResizeHandler
				oColumn._iResumeResizeHandlerTimeout = setTimeout(this._adjustColumnAfterAnimation.bind(this,
					bShouldConcealColumn, sNewWidth, iNewWidth, oColumn, oColumnDomRef),
					FlexibleColumnLayout.COLUMN_RESIZING_ANIMATION_DURATION);
			} else {
				this._adjustColumnDisplay(oColumn, iNewWidth);
			}

			//If the current column is concealed we don't want to apply the new width at this iteration.
			//The new width should be applied once the animations are over, so that the previous column conceals the current.
			if (!bShouldConcealColumn) {
				oColumn.width(sNewWidth);
			}

			// For tablet and desktop - notify child controls to render with reduced container size, if they need to
			if (!Device.system.phone) {
				this._updateColumnContextualSettings(sColumn, iNewWidth);
				this._updateColumnCSSClasses(sColumn, iNewWidth);
			}


		}, this);

		aActiveColumns = aColumns.filter(function (sColumn) {
			return this._getColumnSize(sColumn) > 0;
		}, this);

		if (bRtl) {
			aColumns.reverse();
		}

		if (aActiveColumns.length === 1) {
			this._$columns[aActiveColumns[0]].addClass("sapFFCLColumnOnlyActive");
		}

		if (aActiveColumns.length > 1) {
			this._$columns[aActiveColumns[0]].addClass("sapFFCLColumnFirstActive");
			this._$columns[aActiveColumns[aActiveColumns.length - 1]].addClass("sapFFCLColumnLastActive");
		}

		this._storePreviousResizingInfo(iDefaultVisibleColumnsCount, sLastVisibleColumn);
	};

	/**
	 * Adjusts styles of Columns after the animation
	 *
	 * 	@param bShouldConcealColumn
	 * 	@param sNewWidth
	 *	@param iNewWidth
	 *	@param oColumn
	 *	@param oColumnDomRef
	 *	@private
	*/
	FlexibleColumnLayout.prototype._adjustColumnAfterAnimation = function (bShouldConcealColumn, sNewWidth, iNewWidth, oColumn, oColumnDomRef) {
		// If the column is concealed we must apply the width after the animations are over.
		if (bShouldConcealColumn) {
			oColumn.width(sNewWidth);
			// The column does not show anything anymore, so we can remove the active class
			oColumn.toggleClass("sapFFCLColumnActive", false);
		}

		// Clear pinning after transitions are finished
		oColumn.toggleClass(FlexibleColumnLayout.PINNED_COLUMN_CLASS_NAME, false);
		this._adjustColumnDisplay(oColumn, iNewWidth);

		this._resumeResizeHandler(oColumn, oColumnDomRef);
	};


	/**
	 * Resumes the resize handler of a Column's DOM reference.
	 *
	 *	@param oColumn
	 *	@param oColumnDomRef
	 *	@private
	*/
	FlexibleColumnLayout.prototype._resumeResizeHandler = function (oColumn, oColumnDomRef) {
		ResizeHandler.resume(oColumnDomRef);
		oColumn._iResumeResizeHandlerTimeout = null;
	};

	/**
	 * Sets the value of the column's display property to none if the new width of the column is zero.
	 *
	 *	@param oColumn
	 *	@param iNewWidth
	 *	@private
	*/
	FlexibleColumnLayout.prototype._adjustColumnDisplay = function(oColumn, iNewWidth) {
		//BCP: 1980006195
		if (iNewWidth === 0) {
			oColumn.addClass("sapFFCLColumnHidden");
		} else {
			oColumn.removeClass("sapFFCLColumnHidden");
		}
	};

	/**
	 * Stores information from the last columns' resizing.
	 *
	 * @param iVisibleColumnsCount
	 * @param sLastVisibleColumn
	 * @private
	 */
	FlexibleColumnLayout.prototype._storePreviousResizingInfo = function (iVisibleColumnsCount, sLastVisibleColumn) {
		var oCurrentLayout = this.getLayout();

		this._iPreviousVisibleColumnsCount = iVisibleColumnsCount;
		this._bWasFullScreen = oCurrentLayout === LT.MidColumnFullScreen || oCurrentLayout === LT.EndColumnFullScreen;
		this._sPreviuosLastVisibleColumn = sLastVisibleColumn;
	};

	/**
	 *  Decides whether or not a given column should be revealed - another column slide out on top of it).
	 *
	 * @param iVisibleColumnsCount
	 * @param bIsLastColumn
	 * @returns {boolean|*}
	 * @private
	 */
	FlexibleColumnLayout.prototype._shouldRevealColumn = function (iVisibleColumnsCount, bIsLastColumn) {
		return (iVisibleColumnsCount > this._iPreviousVisibleColumnsCount) && !this._bWasFullScreen && bIsLastColumn;
	};

	/**
	 * Decides whether or not a given column should be concealed - another column should slide in on top of it.
	 *
	 * @param iVisibleColumnsCount
	 * @param sColumn
	 * @returns {boolean|*}
	 * @private
	 */
	FlexibleColumnLayout.prototype._shouldConcealColumn = function(iVisibleColumnsCount, sColumn) {
		return  (iVisibleColumnsCount < this._iPreviousVisibleColumnsCount && sColumn === this._sPreviuosLastVisibleColumn
					&& !this._bWasFullScreen && this._getColumnSize(sColumn) === 0);
	};

	/**
	 * Contextual settings should not be propagated to the nav containers. They only get contextual settings on resize.
	 *
	 * @private
	 */
	FlexibleColumnLayout.prototype._propagateContextualSettings = function () {};

	FlexibleColumnLayout.prototype._updateColumnContextualSettings = function (sColumn, iWidth) {
		var oColumn,
			oContextualSettings;

		oColumn = this.getAggregation("_" + sColumn + "ColumnNav");
		if (!oColumn) {
			return;
		}

		oContextualSettings = oColumn._getContextualSettings();
		if (!oContextualSettings || oContextualSettings.contextualWidth !== iWidth) {
			oColumn._applyContextualSettings({
				contextualWidth: iWidth
			});
		}
	};


	FlexibleColumnLayout.prototype._updateColumnCSSClasses = function (sColumn, iWidth) {
		var sNewClassName = "";

		this._$columns[sColumn].removeClass("sapUiContainer-Narrow sapUiContainer-Medium sapUiContainer-Wide sapUiContainer-ExtraWide");
		if (iWidth < Device.media._predefinedRangeSets[Device.media.RANGESETS.SAP_STANDARD_EXTENDED].points[0]) {
			sNewClassName = "Narrow";
		} else if (iWidth < Device.media._predefinedRangeSets[Device.media.RANGESETS.SAP_STANDARD_EXTENDED].points[1]) {
			sNewClassName = "Medium";
		} else if (iWidth < Device.media._predefinedRangeSets[Device.media.RANGESETS.SAP_STANDARD_EXTENDED].points[2]) {
			sNewClassName = "Wide";
		} else {
			sNewClassName = "ExtraWide";
		}

		this._$columns[sColumn].addClass("sapUiContainer-" + sNewClassName);
	};

	/**
	 * Gets the size (in %) of a column based on the current layout
	 * @param {string} sColumn - string: begin/mid/end
	 * @returns {*}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getColumnSize = function (sColumn) {
		var sLayout = this.getLayout(),
			sColumnWidthDistribution = this._getColumnWidthDistributionForLayout(sLayout),
			aSizes = sColumnWidthDistribution.split("/"),
			aMap = {
				begin: 0,
				mid: 1,
				end: 2
			},
			sSize = aSizes[aMap[sColumn]];

		return parseInt(sSize);
	};



	/**
	 * Returns the maximum number of columns that can be displayed at once based on the control width
	 * @returns {number} The maximum number of columns
	 * @public
	 */
	FlexibleColumnLayout.prototype.getMaxColumnsCount = function () {
		return this._getMaxColumnsCountForWidth(this._getControlWidth());
	};

	/**
	 * Returns the maximum number of columns that can be displayed at once for a certain control width
	 * @param {int} iWidth
	 * @returns {number}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getMaxColumnsCountForWidth = function (iWidth) {
		if (iWidth >= FlexibleColumnLayout.DESKTOP_BREAKPOINT) {
			return 3;
		}

		if (iWidth >= FlexibleColumnLayout.TABLET_BREAKPOINT && iWidth < FlexibleColumnLayout.DESKTOP_BREAKPOINT) {
			return 2;
		}

		if (iWidth > 0) {
			return 1;
		}

		return 0;
	};

	/**
	 * Returns the maximum number of columns that can be displayed for given layout and control width.
	 * @param {string} sLayout the layout
	 * @param {int} iWidth
	 * @returns {number}
	 * @private
	 */
	FlexibleColumnLayout.prototype._getMaxColumnsCountForLayout = function (sLayout, iWidth) {
		var iColumnCount = this._getMaxColumnsCountForWidth(iWidth),
			sColumnWidthDistribution = this._getColumnWidthDistributionForLayout(sLayout, false, iColumnCount),
			aSizes = sColumnWidthDistribution.split("/"),
			aMap = {
				begin: 0,
				mid: 1,
				end: 2
			},
			sSize,
			iSize,
			iCount = 0;

		Object.keys(aMap).forEach(function(sColumn) {
			sSize = aSizes[aMap[sColumn]];
			iSize = parseInt(sSize);
			if (iSize) {
				iCount++;
			}
		});

		return iCount;
	};

	FlexibleColumnLayout.prototype._onResize = function (oEvent) {
		var iOldWidth = oEvent.oldSize.width,
			iNewWidth = oEvent.size.width,
			iOldMaxColumnsCount,
			iMaxColumnsCount;

		// If the control is resized to 0, don't do anything
		if (iNewWidth === 0) {
			return;
		}

		iOldMaxColumnsCount = this._getMaxColumnsCountForWidth(iOldWidth);
		iMaxColumnsCount = this._getMaxColumnsCountForWidth(iNewWidth);

		// Always resize the columns when the browser is resized
		this._resizeColumns();

		// Only update the arrows and fire the event if the maximum number of columns that can be shown has changed
		if (iMaxColumnsCount !== iOldMaxColumnsCount) {
			this._hideShowArrows();
			this._fireStateChange(false, true);
		}
	};

	/**
	 * Sets a flag if the given <code>NavContainers</code> has pages rendered in DOM
	 * @param sId the container Id
	 * @param {boolean} bHasPages flag
	 * @private
	 */
	FlexibleColumnLayout.prototype._setColumnPagesRendered = function (sId, bHasPages) {
		this._oRenderedColumnPagesBoolMap[sId] = bHasPages;
	};

	/**
	 * Checks if any of the internal <code>NavContainer</code> instances has pages rendered in DOM
	 * @returns {boolean}
	 * @private
	 */
	FlexibleColumnLayout.prototype._hasAnyColumnPagesRendered = function () {
		return Object.keys(this._oRenderedColumnPagesBoolMap).some(function(sKey) {
			return this._oRenderedColumnPagesBoolMap[sKey];
		}, this);
	};

	/**
	 * Called when the layout arrows were clicked.
	 * @param {string} sShiftDirection - left/right (direction of the arrow)
	 * @private
	 */
	FlexibleColumnLayout.prototype._onArrowClick = function (sShiftDirection) {
		var sCurrentLayout = this.getLayout(),
			bIsLayoutValid = typeof FlexibleColumnLayout.SHIFT_TARGETS[sCurrentLayout] !== "undefined" && typeof FlexibleColumnLayout.SHIFT_TARGETS[sCurrentLayout][sShiftDirection] !== "undefined",
			sNewLayout;

		assert(bIsLayoutValid, "An invalid layout was used for determining arrow behavior");
		sNewLayout = bIsLayoutValid ? FlexibleColumnLayout.SHIFT_TARGETS[sCurrentLayout][sShiftDirection] : LT.OneColumn;

		this.setLayout(sNewLayout);

		// If the same arrow is hidden in the new layout, focus on the opposite one in it
		if (FlexibleColumnLayout.ARROWS_NAMES[sNewLayout][sShiftDirection] !== FlexibleColumnLayout.ARROWS_NAMES[sCurrentLayout][sShiftDirection] && bIsLayoutValid) {
			var sOppositeShiftDirection = sShiftDirection === 'right' ? 'left' : 'right';

			this._$columnButtons[FlexibleColumnLayout.ARROWS_NAMES[sNewLayout][sOppositeShiftDirection]].focus();
		}
		this._fireStateChange(true, false);
	};

	/**
	 * Updates the visibility of the layout arrows according to the current layout.
	 * @private
	 */
	FlexibleColumnLayout.prototype._hideShowArrows = function () {
		var sLayout = this.getLayout(),
			oMap = {},
			aNeededArrows = [],
			iMaxColumnsCount,
			bIsNavContainersContentRendered;

		// Stop here if the control isn't rendered yet or in phone mode, where arrows aren't necessary
		if (!this.isActive() || Device.system.phone) {
			return;
		}

		iMaxColumnsCount = this.getMaxColumnsCount();

		// Only show arrows if 2 or 3 columns can be displayed at a time
		if (iMaxColumnsCount > 1) {
			oMap[LT.TwoColumnsBeginExpanded] = ["beginBack"];
			oMap[LT.TwoColumnsMidExpanded] = ["midForward"];
			oMap[LT.ThreeColumnsMidExpanded] = ["midForward", "midBack"];
			oMap[LT.ThreeColumnsEndExpanded] = ["endForward"];
			oMap[LT.ThreeColumnsMidExpandedEndHidden] = ["midForward", "midBack"];
			oMap[LT.ThreeColumnsBeginExpandedEndHidden] = ["beginBack"];

			if (typeof oMap[sLayout] === "object") {
				aNeededArrows = oMap[sLayout];
			}
		}

		bIsNavContainersContentRendered = this._hasAnyColumnPagesRendered();

		Object.keys(this._$columnButtons).forEach(function (key) {
			this._toggleButton(key, aNeededArrows.indexOf(key) !== -1, bIsNavContainersContentRendered);
		}, this);
	};

	/**
	 * Changes the visibility of a navigation button.
	 * @param {string} sButton
	 * @param {boolean} bShow
	 * @private
	 */
	FlexibleColumnLayout.prototype._toggleButton = function (sButton, bShow, bReveal) {

		this._$columnButtons[sButton].toggle(bShow && bReveal);
		this._$columnButtons[sButton].data("visible", bShow);
	};


	FlexibleColumnLayout.prototype._fireStateChange = function (bIsNavigationArrow, bIsResize) {

		// The event should not be fired if the control has zero width as all relevant layout calculations are size-based
		if (this._getControlWidth() === 0) {
			return;
		}

		this.fireStateChange({
			isNavigationArrow: bIsNavigationArrow,
			isResize: bIsResize,
			layout: this.getLayout(),
			maxColumnsCount: this.getMaxColumnsCount()
		});
	};


	// Association proxies

	FlexibleColumnLayout.prototype.setInitialBeginColumnPage = function(sPage) {
		this._getBeginColumn().setInitialPage(sPage);
		this.setAssociation('initialBeginColumnPage', sPage, true);
		return this;
	};

	FlexibleColumnLayout.prototype.setInitialMidColumnPage = function(sPage) {
		this._getMidColumn().setInitialPage(sPage);
		this.setAssociation('initialMidColumnPage', sPage, true);
		return this;
	};

	FlexibleColumnLayout.prototype.setInitialEndColumnPage = function(sPage) {
		this._getEndColumn().setInitialPage(sPage);
		this.setAssociation('initialEndColumnPage', sPage, true);
		return this;
	};


	//**************************************************************
	//* START - Public methods
	//**************************************************************


	/**
	 * Navigates to the given page inside the FlexibleColumnLayout.
	 * Columns are scanned for the page in the following order: <code>Begin</code>, <code>Mid</code>, <code>End</code>.
	 *
	 * @param {string} sPageId
	 *         The screen to which we are navigating to. The ID or the control itself can be given.
	 * @param {string} sTransitionName
	 *         The type of the transition/animation to apply. This parameter can be omitted; then the default value is "slide" (horizontal movement from the right).
	 *         Other options are: "fade", "flip", and "show" and the names of any registered custom transitions.
	 *
	 *         None of the standard transitions is currently making use of any given transition parameters.
	 * @param {object} oData
	 *         This optional object can carry any payload data which should be made available to the target page. The beforeShow event on the target page will contain this data object as data property.
	 *
	 *         Use case: in scenarios where the entity triggering the navigation can or should not directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *
	 *         When the transitionParameters object is used, this "data" object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can contain additional information for the transition function, like the DOM element which triggered the transition or the desired transition duration.
	 *
	 *         For a proper parameter order, the "data" parameter must be given when the transitionParameters parameter is used (it can be given as "null").
	 *
	 *         NOTE: It depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 *         The "show", "slide" and "fade" transitions do not use any parameter.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.to = function(sPageId, sTransitionName, oData, oTransitionParameters) {
		if (this._getBeginColumn().getPage(sPageId)) {
			this._getBeginColumn().to(sPageId, sTransitionName, oData, oTransitionParameters);
		} else if (this._getMidColumn().getPage(sPageId)) {
			this._getMidColumn().to(sPageId, sTransitionName, oData, oTransitionParameters);
		} else {
			this._getEndColumn().to(sPageId, sTransitionName, oData, oTransitionParameters);
		}

		return this;
	};

	/**
	 * Navigates back to a page in the <code>FlexibleColumnLayout</code>.
	 * Columns are scanned for the page in the following order: <code>Begin</code>, <code>Mid</code>, <code>End</code>.
	 *
	 * Calling this navigation method, first triggers the (cancelable) navigate event on the SplitContainer,
	 * then the beforeHide pseudo event on the source page, beforeFirstShow (if applicable),
	 * and beforeShow on the target page. Later, after the transition has completed,
	 * the afterShow pseudo event is triggered on the target page and afterHide - on the page, which has been left.
	 * The given backData object is available in the beforeFirstShow, beforeShow, and afterShow event objects as data
	 * property. The original "data" object from the "to" navigation is also available in these event objects.
	 *
	 * @param {string} sPageId
	 *         The screen to which is being navigated to. The ID or the control itself can be given.
	 * @param {object} oBackData
	 *         This optional object can carry any payload data which should be made available to the target page of the back navigation.
	 *         The event on the target page will contain this data object as backData property. (the original data from the to() navigation will still be available as data property).
	 *
	 *         In scenarios, where the entity triggering the navigation can't or shouldn't directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *         For back navigation this can be used, for example, when returning from a detail page to transfer any settings done there.
	 *
	 *         When the transitionParameters object is used, this data object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can give additional information to the transition function, like the DOM element, which triggered the transition or the desired transition duration.
	 *         The animation type can NOT be selected here - it is always the inverse of the "to" navigation.
	 *
	 *         In order to use the transitionParameters property, the data property must be used (at least "null" must be given) for a proper parameter order.
	 *
	 *         NOTE: it depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.backToPage = function(sPageId, oBackData, oTransitionParameters) {
		if (this._getBeginColumn().getPage(sPageId)) {
			this._getBeginColumn().backToPage(sPageId, oBackData, oTransitionParameters);
		} else if (this._getMidColumn().getPage(sPageId)) {
			this._getMidColumn().backToPage(sPageId, oBackData, oTransitionParameters);
		} else {
			this._getEndColumn().backToPage(sPageId, oBackData, oTransitionParameters);
		}

		return this;
	};

	/**
	 * Proxy to the _safeBackToPage methods of the internal nav containers
	 * @param pageId
	 * @param transitionName
	 * @param backData
	 * @param oTransitionParameters
	 * @private
	 */
	FlexibleColumnLayout.prototype._safeBackToPage = function(pageId, transitionName, backData, oTransitionParameters) {
		if (this._getBeginColumn().getPage(pageId)) {
			this._getBeginColumn()._safeBackToPage(pageId, transitionName, backData, oTransitionParameters);
		} else if (this._getMidColumn().getPage(pageId)) {
			this._getMidColumn()._safeBackToPage(pageId, transitionName, backData, oTransitionParameters);
		} else {
			this._getEndColumn()._safeBackToPage(pageId, transitionName, backData, oTransitionParameters);
		}
	};

	/**
	 * Navigates to a given Begin column page.
	 *
	 * @param {string} sPageId
	 *         The screen to which drilldown should happen. The ID or the control itself can be given.
	 * @param {string} sTransitionName
	 *         The type of the transition/animation to apply. This parameter can be omitted; then the default value is "slide" (horizontal movement from the right).
	 *         Other options are: "fade", "flip", and "show" and the names of any registered custom transitions.
	 *
	 *         None of the standard transitions is currently making use of any given transition parameters.
	 * @param {object} oData
	 *         This optional object can carry any payload data which should be made available to the target page. The beforeShow event on the target page will contain this data object as data property.
	 *
	 *         Use case: in scenarios where the entity triggering the navigation can't or shouldn't directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *
	 *         When the transitionParameters object is used, this data object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can contain additional information for the transition function, like the DOM element, which triggered the transition or the desired transition duration.
	 *
	 *         For a proper parameter order, the data parameter must be given when the transitionParameters parameter is used (it can be given as "null").
	 *
	 *         NOTE: it depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 *         The "show", "slide" and "fade" transitions do not use any parameter.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.toBeginColumnPage = function(sPageId, sTransitionName, oData, oTransitionParameters) {
		this._getBeginColumn().to(sPageId, sTransitionName, oData, oTransitionParameters);
		return this;
	};

	/**
	 * Navigates to a given Mid column page.
	 *
	 * @param {string} sPageId
	 *         The screen to which drilldown should happen. The ID or the control itself can be given.
	 * @param {string} sTransitionName
	 *         The type of the transition/animation to apply. This parameter can be omitted; then the default value is "slide" (horizontal movement from the right).
	 *         Other options are: "fade", "flip", and "show" and the names of any registered custom transitions.
	 *
	 *         None of the standard transitions is currently making use of any given transition parameters.
	 * @param {object} oData
	 *         This optional object can carry any payload data which should be made available to the target page. The beforeShow event on the target page will contain this data object as data property.
	 *
	 *         Use case: in scenarios where the entity triggering the navigation can't or shouldn't directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *
	 *         When the transitionParameters object is used, this data object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can contain additional information for the transition function, like the DOM element, which triggered the transition or the desired transition duration.
	 *
	 *         For a proper parameter order, the data parameter must be given when the transitionParameters parameter is used (it can be given as "null").
	 *
	 *         NOTE: it depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 *         The "show", "slide" and "fade" transitions do not use any parameter.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.toMidColumnPage = function(sPageId, sTransitionName, oData, oTransitionParameters) {
		this._getMidColumn().to(sPageId, sTransitionName, oData, oTransitionParameters);
		return this;
	};

	/**
	 * Navigates to a given End column page.
	 *
	 * @param {string} sPageId
	 *         The screen to which drilldown should happen. The ID or the control itself can be given.
	 * @param {string} sTransitionName
	 *         The type of the transition/animation to apply. This parameter can be omitted; then the default value is "slide" (horizontal movement from the right).
	 *         Other options are: "fade", "flip", and "show" and the names of any registered custom transitions.
	 *
	 *         None of the standard transitions is currently making use of any given transition parameters.
	 * @param {object} oData
	 *         This optional object can carry any payload data which should be made available to the target page. The beforeShow event on the target page will contain this data object as data property.
	 *
	 *         Use case: in scenarios where the entity triggering the navigation can't or shouldn't directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *
	 *         When the transitionParameters object is used, this data object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can contain additional information for the transition function, like the DOM element, which triggered the transition or the desired transition duration.
	 *
	 *         For a proper parameter order, the data parameter must be given when the transitionParameters parameter is used (it can be given as "null").
	 *
	 *         NOTE: it depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 *         The "show", "slide" and "fade" transitions do not use any parameter.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.toEndColumnPage = function(sPageId, sTransitionName, oData, oTransitionParameters) {
		this._getEndColumn().to(sPageId, sTransitionName, oData, oTransitionParameters);
		return this;
	};

	FlexibleColumnLayout.prototype.backBeginColumn = function(backData, oTransitionParameters) {
		return this._getBeginColumn().back(backData, oTransitionParameters);
	};

	FlexibleColumnLayout.prototype.backMidColumn = function(backData, oTransitionParameters) {
		return this._getMidColumn().back(backData, oTransitionParameters);
	};

	FlexibleColumnLayout.prototype.backEndColumn = function(backData, oTransitionParameters) {
		return this._getEndColumn().back(backData, oTransitionParameters);
	};

	FlexibleColumnLayout.prototype.backBeginColumnToPage = function(pageId, backData, oTransitionParameters) {
		return this._getBeginColumn().backToPage(pageId, backData, oTransitionParameters);
	};

	FlexibleColumnLayout.prototype.backMidColumnToPage = function(pageId, backData, oTransitionParameters) {
		return this._getMidColumn().backToPage(pageId, backData, oTransitionParameters);
	};

	FlexibleColumnLayout.prototype.backEndColumnToPage = function(pageId, backData, oTransitionParameters) {
		return this._getEndColumn().backToPage(pageId, backData, oTransitionParameters);
	};

	/**
	 * Navigates back to the initial/top level of Begin column (this is the element aggregated as "initialPage", or the first added element).
	 * NOTE: If already on the initial page, nothing happens.
	 * The transition effect which had been used to get to the current page is inverted and used for this navigation.
	 *
	 * @param {object} oBackData
	 *         This optional object can carry any payload data which should be made available to the target page of the back navigation. The event on the target page will contain this data object as "backData" property. (The original data from the "to()" navigation will still be available as "data" property.)
	 *
	 *         In scenarios where the entity triggering the navigation can or should not directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *         For back navigation this can be used e.g. when returning from a detail page to transfer any settings done there.
	 *
	 *         When the "transitionParameters" object is used, this "data" object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can give additional information to the transition function, like the DOM element which triggered the transition or the desired transition duration.
	 *         The animation type can NOT be selected here - it is always the inverse of the "to" navigation.
	 *
	 *         In order to use the transitionParameters property, the data property must be used (at least "null" must be given) for a proper parameter order.
	 *
	 *         NOTE: it depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.backToTopBeginColumn = function(oBackData, oTransitionParameters) {
		this._getBeginColumn().backToTop(oBackData, oTransitionParameters);
		return this;
	};

	/**
	 * Navigates back to the initial/top level of Mid column (this is the element aggregated as "initialPage", or the first added element).
	 * NOTE: If already on the initial page, nothing happens.
	 * The transition effect which had been used to get to the current page is inverted and used for this navigation.
	 *
	 * @param {object} oBackData
	 *         This optional object can carry any payload data which should be made available to the target page of the back navigation. The event on the target page will contain this data object as "backData" property. (The original data from the "to()" navigation will still be available as "data" property.)
	 *
	 *         In scenarios where the entity triggering the navigation can or should not directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *         For back navigation this can be used e.g. when returning from a detail page to transfer any settings done there.
	 *
	 *         When the "transitionParameters" object is used, this "data" object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can give additional information to the transition function, like the DOM element which triggered the transition or the desired transition duration.
	 *         The animation type can NOT be selected here - it is always the inverse of the "to" navigation.
	 *
	 *         In order to use the transitionParameters property, the data property must be used (at least "null" must be given) for a proper parameter order.
	 *
	 *         NOTE: it depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.backToTopMidColumn = function(oBackData, oTransitionParameters) {
		this._getMidColumn().backToTop(oBackData, oTransitionParameters);
		return this;
	};


	/**
	 * Navigates back to the initial/top level of End column (this is the element aggregated as "initialPage", or the first added element).
	 * NOTE: If already on the initial page, nothing happens.
	 * The transition effect which had been used to get to the current page is inverted and used for this navigation.
	 *
	 * @param {object} oBackData
	 *         This optional object can carry any payload data which should be made available to the target page of the back navigation. The event on the target page will contain this data object as "backData" property. (The original data from the "to()" navigation will still be available as "data" property.)
	 *
	 *         In scenarios where the entity triggering the navigation can or should not directly initialize the target page, it can fill this object and the target page itself (or a listener on it) can take over the initialization, using the given data.
	 *         For back navigation this can be used e.g. when returning from a detail page to transfer any settings done there.
	 *
	 *         When the "transitionParameters" object is used, this "data" object must also be given (either as object or as null) in order to have a proper parameter order.
	 * @param {object} oTransitionParameters
	 *         This optional object can give additional information to the transition function, like the DOM element which triggered the transition or the desired transition duration.
	 *         The animation type can NOT be selected here - it is always the inverse of the "to" navigation.
	 *
	 *         In order to use the transitionParameters property, the data property must be used (at least "null" must be given) for a proper parameter order.
	 *
	 *         NOTE: it depends on the transition function how the object should be structured and which parameters are actually used to influence the transition.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.f.FlexibleColumnLayout} The <code>sap.f.FlexibleColumnLayout</code> instance
	 */
	FlexibleColumnLayout.prototype.backToTopEndColumn = function(oBackData, oTransitionParameters) {
		this._getEndColumn().backToTop(oBackData, oTransitionParameters);
		return this;
	};

	/**
	 * Returns the currently displayed Begin column page.
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.ui.core.Control} The UI5 control in the Begin column
	 */
	FlexibleColumnLayout.prototype.getCurrentBeginColumnPage = function() {
		return this._getBeginColumn().getCurrentPage();
	};

	/**
	 * Returns the currently displayed Mid column page.
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.ui.core.Control} The UI5 control in the Mid column
	 */
	FlexibleColumnLayout.prototype.getCurrentMidColumnPage = function() {
		return this._getMidColumn().getCurrentPage();
	};

	/**
	 * Returns the currently displayed End column page.
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 * @returns {sap.ui.core.Control} The UI5 control in the End column
	 */
	FlexibleColumnLayout.prototype.getCurrentEndColumnPage = function() {
		return this._getEndColumn().getCurrentPage();
	};

	FlexibleColumnLayout.prototype.setDefaultTransitionNameBeginColumn = function(sTransition) {
		this.setProperty("defaultTransitionNameBeginColumn", sTransition, true);
		this._getBeginColumn().setDefaultTransitionName(sTransition);
		return this;
	};

	FlexibleColumnLayout.prototype.setDefaultTransitionNameMidColumn = function(sTransition) {
		this.setProperty("defaultTransitionNameMidColumn", sTransition, true);
		this._getMidColumn().setDefaultTransitionName(sTransition);
		return this;
	};

	FlexibleColumnLayout.prototype.setDefaultTransitionNameEndColumn = function(sTransition) {
		this.setProperty("defaultTransitionNameEndColumn", sTransition, true);
		this._getEndColumn().setDefaultTransitionName(sTransition);
		return this;
	};

	//******************************************************** PROTECTED MEMBERS **************************************/

	/**
	 * Returns the layout history object
	 * @returns {LayoutHistory}
	 * @private
	 * @ui5-restricted sap.f.FlexibleColumnLayoutSemanticHelper
	 */
	FlexibleColumnLayout.prototype._getLayoutHistory = function () {
		return this._oLayoutHistory;
	};

	/**
	 * Returns a string, representing the relative percentage sizes of the columns for the given layout in the format "begin/mid/end" (f.e. "33/67/0")
	 * @param {string} sLayout - the layout
	 * @param {boolean} bAsArray - return an array in the format [33, 67, 0] instead of a string "33/67/0"
	 * @returns {string|array}
	 * @private
	 * @ui5-restricted sap.f.FlexibleColumnLayoutSemanticHelper
	 */
	FlexibleColumnLayout.prototype._getColumnWidthDistributionForLayout = function (sLayout, bAsArray, iMaxColumnsCount) {
		var oMap = {},
			vResult;

		iMaxColumnsCount || (iMaxColumnsCount = this.getMaxColumnsCount());

		if (iMaxColumnsCount === 0) {

			vResult = "0/0/0";

		} else {

			// Layouts with the same distribution for all cases
			oMap[LT.OneColumn] = "100/0/0";
			oMap[LT.MidColumnFullScreen] = "0/100/0";
			oMap[LT.EndColumnFullScreen] = "0/0/100";

			if (iMaxColumnsCount === 1) {

				// On 1 column, all have fullscreen mapping
				oMap[LT.TwoColumnsBeginExpanded] = "0/100/0";
				oMap[LT.TwoColumnsMidExpanded] = "0/100/0";
				oMap[LT.ThreeColumnsMidExpanded] = "0/0/100";
				oMap[LT.ThreeColumnsEndExpanded] = "0/0/100";
				oMap[LT.ThreeColumnsMidExpandedEndHidden] = "0/0/100";
				oMap[LT.ThreeColumnsBeginExpandedEndHidden] = "0/0/100";

			} else {

				// On 2 and 3 columns, the only difference is in the modes where all 3 columns are visible
				oMap[LT.TwoColumnsBeginExpanded] = "67/33/0";
				oMap[LT.TwoColumnsMidExpanded] = "33/67/0";
				oMap[LT.ThreeColumnsMidExpanded] = iMaxColumnsCount === 2 ? "0/67/33" : "25/50/25";
				oMap[LT.ThreeColumnsEndExpanded] = iMaxColumnsCount === 2 ? "0/33/67" : "25/25/50";
				oMap[LT.ThreeColumnsMidExpandedEndHidden] = "33/67/0";
				oMap[LT.ThreeColumnsBeginExpandedEndHidden] = "67/33/0";
			}

			vResult = oMap[sLayout];
		}

		if (bAsArray) {
			vResult = vResult.split("/").map(function (sColumnWidth) {
				return parseInt(sColumnWidth);
			});
		}

		return vResult;
	};


	//******************************************************** STATIC MEMBERS *****************************************/

	// The width above which (inclusive) we are in desktop mode
	FlexibleColumnLayout.DESKTOP_BREAKPOINT = 1280;

	// The width above which (inclusive) we are in tablet mode
	FlexibleColumnLayout.TABLET_BREAKPOINT = 960;

	// Arrows names for each shift position in a given layout
	FlexibleColumnLayout.ARROWS_NAMES = {
		TwoColumnsBeginExpanded: {
			"left": "beginBack"
		},
		TwoColumnsMidExpanded: {
			"right": "midForward"
		},
		ThreeColumnsMidExpanded: {
			"left": "midBack",
			"right": "midForward"
		},
		ThreeColumnsEndExpanded: {
			"right": "endForward"
		},
		ThreeColumnsMidExpandedEndHidden: {
			"left": "midBack",
			"right": "midForward"
		},
		ThreeColumnsBeginExpandedEndHidden: {
			"left": "beginBack"
		}
	};

	/**
	 * Retrieves the resource bundle for the <code>sap.f</code> library.
	 * @static
	 * @private
	 * @returns {Object} the resource bundle object
	 */
	FlexibleColumnLayout._getResourceBundle = function () {
		return sap.ui.getCore().getLibraryResourceBundle("sap.f");
	};

	// Resulting layouts, after shifting in a given direction from a specific layout
	FlexibleColumnLayout.SHIFT_TARGETS = {
		TwoColumnsBeginExpanded: {
			"left": LT.TwoColumnsMidExpanded
		},
		TwoColumnsMidExpanded: {
			"right": LT.TwoColumnsBeginExpanded
		},
		ThreeColumnsMidExpanded: {
			"left": LT.ThreeColumnsEndExpanded,
			"right": LT.ThreeColumnsMidExpandedEndHidden
		},
		ThreeColumnsEndExpanded: {
			"right": LT.ThreeColumnsMidExpanded
		},
		ThreeColumnsMidExpandedEndHidden: {
			"left": LT.ThreeColumnsMidExpanded,
			"right": LT.ThreeColumnsBeginExpandedEndHidden
		},
		ThreeColumnsBeginExpandedEndHidden: {
			"left": LT.ThreeColumnsMidExpandedEndHidden
		}
	};

	/**
	 * Layout history helper class
	 * @constructor
	 */
	function LayoutHistory () {
		this._aLayoutHistory = [];
	}

	/**
	 * Adds a new entry to the history
	 * @param {string} sLayout
	 */
	LayoutHistory.prototype.addEntry = function (sLayout) {
		if (typeof sLayout !== "undefined") {
			this._aLayoutHistory.push(sLayout);
		}
	};

	/**
	 * Searches the history for the most recent layout that matches any of the aLayouts entries
	 * @param aLayouts - a list of layouts
	 * @returns {*}
	 */
	LayoutHistory.prototype.getClosestEntryThatMatches = function (aLayouts) {
		var i;

		for (i = this._aLayoutHistory.length - 1; i >= 0; i--) {
			if (aLayouts.indexOf(this._aLayoutHistory[i]) !== -1) {
				return this._aLayoutHistory[i];
			}
		}
	};

	return FlexibleColumnLayout;

});
