/*global QUnit, sinon */

sap.ui.define([
	"sap/ui/qunit/QUnitUtils",
	"sap/m/NotificationListBase",
	"sap/m/NotificationListGroup",
	"sap/m/NotificationListItem",
	"sap/m/Button",
	"sap/ui/core/Core",
	'sap/ui/Device',
	"sap/ui/core/library",
	"sap/m/library"
], function(
	qutils,
	NotificationListBase,
	NotificationListGroup,
	NotificationListItem,
	Button,
	Core,
	Device,
	coreLibrary,
	mLibrary
) {
	'use strict';

	var RENDER_LOCATION = 'qunit-fixture';
	var Priority = coreLibrary.Priority;

	// shortcut for sap.m.OverflowToolbarPriority
	var OverflowToolbarPriority = mLibrary.OverflowToolbarPriority;

	var  oResourceBundleM = sap.ui.getCore().getLibraryResourceBundle("sap.m");
	var  oResourceBundleCore = sap.ui.getCore().getLibraryResourceBundle("sap.ui.core");

	function createNotificationListGroup() {
		return new NotificationListGroup({
			unread : true,
			autoPriority: false,
			title: 'Notification List Group Title',
			showCloseButton : true,
			showButtons: true,

			buttons: [
				new Button({
					text: 'Accept'
				}),
				new Button({
					text: 'Cancel'
				})
			],

			items: [
				new NotificationListItem({
					title: 'Item 1',
					description: 'Item 1 Description'
				}),
				new NotificationListItem({
					title: 'Item 2',
					description: 'Item 2 Description'
				})
			]
		});
	}

	QUnit.module('Rendering', {
		beforeEach: function() {
			this.notificationListGroup = createNotificationListGroup();

			this.notificationListGroup.placeAt(RENDER_LOCATION);
			Core.applyChanges();
		},
		afterEach: function() {
			this.notificationListGroup.destroy();
		}
	});

	QUnit.test('initial rendering', function(assert) {

		var $item = this.notificationListGroup.$();

		assert.ok(this.notificationListGroup.getDomRef(), 'Group is rendered');

		assert.ok($item.hasClass('sapMNLGroupUnread'), 'unread class is set');
		assert.strictEqual($item.find('.sapMNLGroupTitle').text(), 'Notification List Group Title', 'title is rendered');
		assert.strictEqual($item.find('.sapMNLGroupCollapseButton button').attr('title'), oResourceBundleM.getText("NOTIFICATION_LIST_GROUP_COLLAPSE"), 'collapse button is rendered');
		assert.strictEqual($item.find('.sapMNLIItem.sapMNLICloseBtn button').attr('title'), 'Close all', 'close button is rendered');
		assert.ok(this.notificationListGroup.$('overflowToolbar'), 'overflow toolbar is rendered');

		assert.strictEqual($item.find('.sapMNLGroupChildren li').length, 2, 'group has 2 items');
	});

	QUnit.test('priority', function(assert) {
		this.notificationListGroup.setPriority(Priority.High);
		sap.ui.getCore().applyChanges();

		var $item = this.notificationListGroup.$();
		assert.strictEqual($item.find('.sapMNLIBPriorityHigh span').attr('title'), oResourceBundleCore.getText("Icon.error"), 'priority is rendered');
	});

	QUnit.test('priority', function(assert) {
		this.notificationListGroup.setAutoPriority(true);
		sap.ui.getCore().applyChanges();

		var $item = this.notificationListGroup.$();
		assert.strictEqual($item.find('.sapMNLIBPriority').length, 0, 'priority is not rendered');
	});

	QUnit.module('Interaction', {
		beforeEach: function() {
			this.notificationListGroup = createNotificationListGroup();

			this.notificationListGroup.placeAt(RENDER_LOCATION);
			Core.applyChanges();
		},
		afterEach: function() {
			this.notificationListGroup.destroy();
		}
	});

	QUnit.test('collapse/expand', function(assert) {

		var fnSpy = sinon.spy(this.notificationListGroup, 'fireOnCollapse'),
			$item = this.notificationListGroup.$(),
			collapseButton = $item.find('.sapMNLGroupCollapseButton button').control()[0];

		collapseButton.firePress();

		assert.strictEqual(fnSpy.callCount, 1, 'onCollapse should be called.');
		assert.strictEqual(collapseButton.getTooltip(), oResourceBundleM.getText("NOTIFICATION_LIST_GROUP_EXPAND"), 'collapse button tooltip is correct');

		$item = this.notificationListGroup.$();
		assert.ok($item.hasClass('sapMNLGroupCollapsed'), 'sapMNLGroupCollapsed class is set');

		collapseButton.firePress();

		assert.strictEqual(fnSpy.callCount, 2, 'onCollapse should be called.');
		assert.strictEqual(collapseButton.getTooltip(), oResourceBundleM.getText("NOTIFICATION_LIST_GROUP_COLLAPSE"), 'collapse button tooltip is correct');

		$item = this.notificationListGroup.$();
		assert.notOk($item.hasClass('sapMNLGroupCollapsed'), 'sapMNLGroupCollapsed class is not set');
	});

	QUnit.test('close button', function(assert) {

		var fnSpy = sinon.spy(this.notificationListGroup, 'fireClose'),
			$item = this.notificationListGroup.$(),
			closeButton = $item.find('.sapMNLIItem.sapMNLICloseBtn button').control()[0];

		closeButton.firePress();

		assert.strictEqual(fnSpy.callCount, 1, 'fireClose() should be called.');
	});

	QUnit.module('Accessibility', {
		beforeEach: function() {
			this.notificationListGroup = createNotificationListGroup();

			this.notificationListGroup.placeAt(RENDER_LOCATION);
			Core.applyChanges();
		},
		afterEach: function() {
			this.notificationListGroup.destroy();
		}
	});

	QUnit.test('ARIA - Accessibility Text', function (assert) {
		var ariallabledBy = this.notificationListGroup.$().attr('aria-labelledby');
		assert.ok(ariallabledBy.indexOf('-groupTitle') > 0, "title is labeled to notification group");
		assert.ok(ariallabledBy.indexOf('-invisibleGroupTitleText') > 0, "invisibleText is labeled to notification group");

	});

	QUnit.module('Action and close buttons - non mobile', {
		beforeEach: function() {

			this.isPhone = Device.system.phone;
			Device.system.phone = false;

			this.notificationListGroup = createNotificationListGroup();
			this.notificationListGroup.placeAt(RENDER_LOCATION);
			Core.applyChanges();
		},
		afterEach: function() {
			this.notificationListGroup.destroy();
			Device.system.phone = this.isPhone;
		}
	});

	QUnit.test('action buttons', function(assert) {
		var $notificationListGroup = this.notificationListGroup.$();
		var buttons = this.notificationListGroup.getButtons();

		assert.notEqual($notificationListGroup.find('.sapMNLIItem.sapMNLIActions')[0].style.display, 'none', "overflow toolbar is visible");
		assert.strictEqual(buttons[0].getLayoutData().getPriority(), OverflowToolbarPriority.AlwaysOverflow, 'button overflow priority is ok');
		assert.strictEqual(buttons[0].getLayoutData().getPriority(), OverflowToolbarPriority.AlwaysOverflow, 'button overflow priority is ok');

		this.notificationListGroup.setCollapsed(true);
		Core.applyChanges();

		assert.strictEqual($notificationListGroup.find('.sapMNLIItem.sapMNLIActions')[0].style.display, 'none', "overflow toolbar is hideen");
	});

	QUnit.module('Action and close buttons - mobile', {
		beforeEach: function() {

			this.isPhone = Device.system.phone;
			Device.system.phone = true;

			this.notificationListGroup = createNotificationListGroup();
			this.notificationListGroup.placeAt(RENDER_LOCATION);
			Core.applyChanges();
		},
		afterEach: function() {
			this.notificationListGroup.destroy();

			Device.system.phone = this.isPhone;
		}
	});

	QUnit.test('action and close buttons', function(assert) {
		var buttons = this.notificationListGroup.getButtons(),
			closeButton = this.notificationListGroup._getCloseButton(),
			toolbarSeparator = this.notificationListGroup._toolbarSeparator;

		assert.strictEqual(buttons[0].getLayoutData().getPriority(), OverflowToolbarPriority.AlwaysOverflow, 'button overflow priority is ok');
		assert.strictEqual(buttons[1].getLayoutData().getPriority(), OverflowToolbarPriority.AlwaysOverflow, 'button overflow priority is ok');

		assert.notOk(buttons[0].hasStyleClass('sapMNLIBHiddenButton'), 'button is visible');
		assert.notOk(buttons[1].hasStyleClass('sapMNLIBHiddenButton'), 'button is visible');

		assert.strictEqual(closeButton.getLayoutData().getPriority(), OverflowToolbarPriority.AlwaysOverflow, 'close button overflow priority is ok');
		assert.ok(toolbarSeparator.getVisible(), 'toolbar separator is visible');

		this.notificationListGroup.setCollapsed(true);
		Core.applyChanges();

		assert.strictEqual(buttons[0].getLayoutData().getPriority(), OverflowToolbarPriority.NeverOverflow, 'button overflow priority is ok');
		assert.strictEqual(buttons[1].getLayoutData().getPriority(), OverflowToolbarPriority.NeverOverflow, 'button overflow priority is ok');

		assert.ok(buttons[0].hasStyleClass('sapMNLIBHiddenButton'), 'button is hidden');
		assert.ok(buttons[1].hasStyleClass('sapMNLIBHiddenButton'), 'button is hidden');

		assert.strictEqual(closeButton.getLayoutData().getPriority(), OverflowToolbarPriority.NeverOverflow, 'close button overflow priority is ok');
		assert.notOk(toolbarSeparator.getVisible(), 'toolbar separator is not visible');
	});
});
