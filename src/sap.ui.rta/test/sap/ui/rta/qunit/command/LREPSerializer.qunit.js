/* global QUnit */

sap.ui.define([
	"sap/ui/rta/command/CommandFactory",
	"sap/ui/dt/DesignTimeMetadata",
	"sap/ui/rta/command/LREPSerializer",
	"sap/ui/rta/command/Stack",
	"sap/ui/fl/registry/ChangeRegistry",
	"qunit/RtaQunitUtils",
	"sap/ui/fl/Utils",
	"sap/ui/fl/variants/VariantModel",
	"sap/ui/fl/variants/VariantManagement",
	"sap/m/Input",
	"sap/m/Panel",
	"sap/ui/fl/write/api/PersistenceWriteAPI",
	"sap/ui/thirdparty/sinon-4"
], function(
	CommandFactory,
	DesignTimeMetadata,
	CommandSerializer,
	CommandStack,
	ChangeRegistry,
	RtaQunitUtils,
	flUtils,
	VariantModel,
	VariantManagement,
	Input,
	Panel,
	PersistenceWriteAPI,
	sinon
) {
	"use strict";

	var sandbox = sinon.sandbox.create();
	var COMPONENT_NAME = "someName";
	var oMockedAppComponent = {
		getLocalId: function () {
			return undefined;
		},
		addPropagationListener: function () {

		},
		getPropagationListeners: function () {
			return [];
		},
		getManifestEntry: function () {
			return {};
		},
		getMetadata: function () {
			return {
				getName: function () {
					return COMPONENT_NAME;
				}
			};
		},
		getManifest: function () {
			return {
				"sap.app" : {
					applicationVersion : {
						version : "1.2.3"
					},
					id: COMPONENT_NAME
				}
			};
		},
		getModel: function () {return oModel;} // eslint-disable-line no-use-before-define
	};
	var oGetAppComponentForControlStub = sinon.stub(flUtils, "getAppComponentForControl").returns(oMockedAppComponent);

	var oData = {
		variantMgmtId1: {
			defaultVariant: "variant0",
			variants: [
				{
					author: "SAP",
					key: "variantMgmtId1",
					layer: "VENDOR",
					visible: true,
					title: "Standard"
				}, {
					author: "Me",
					key: "variant0",
					layer: "CUSTOMER",
					visible: true,
					title: "variant A"
				}
			]
		}
	};

	var oVariant = {
		content: {
			fileName:"variant0",
			fileType:"ctrl_variant",
			variantManagementReference:"variantMgmtId1",
			variantReference:"variantMgmtId1",
			content:{
				title:"variant A"
			},
			selector:{},
			layer:"CUSTOMER",
			namespace:"Dummy.Component"
		},
		controlChanges: [],
		variantChanges: {}
	};

	var oModel = new VariantModel(oData, undefined, oMockedAppComponent);

	QUnit.module("Given a command serializer loaded with an RTA command stack", {
		beforeEach : function() {
			var oChangeRegistry = ChangeRegistry.getInstance();
			return RtaQunitUtils.clear(oMockedAppComponent)
			.then(function () {
				oChangeRegistry.registerControlsForChanges({
					"sap.m.Input" : {
						hideControl : {
							completeChangeContent : function () {
							},
							applyChange : function () {
								return Promise.resolve();
							},
							revertChange : function () {
							}
						}
					}
				});
			})
			.then(function() {
				this.oCommandStack = new CommandStack();
				this.oInput1 = new Input("input1");
				this.oInput2 = new Input("input2");
				this.oPanel = new Panel({
					id : "panel",
					content : [this.oInput1, this.oInput2]});

				this.oInputDesignTimeMetadata = new DesignTimeMetadata({
					data : {
						actions : {
							remove : {
								changeType : "hideControl"
							}
						}
					}
				});

				this.oSerializer = new CommandSerializer({
					commandStack: this.oCommandStack,
					rootControl: this.oPanel
				});
			}.bind(this));
		},
		afterEach : function() {
			return this.oSerializer.saveCommands().then(function() {
				this.oCommandStack.destroy();
				this.oSerializer.destroy();
				this.oPanel.destroy();
				this.oInput1.destroy();
				this.oInput2.destroy();
				this.oInputDesignTimeMetadata.destroy();
				sandbox.restore();
				return RtaQunitUtils.clear(oMockedAppComponent);
			}.bind(this));
		}
	}, function() {
		QUnit.test("when two commands get undone, redone and saved while the element of one command is not available", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);
			var oInput3 = new Input("input3");
			var oDeleteChangeSpy = sandbox.spy(PersistenceWriteAPI, "remove");
			var oAddChangeSpy = sandbox.spy(PersistenceWriteAPI, "add");
			var oSettingsCommand2;

			return CommandFactory.getCommandFor(this.oInput1, "Settings", {
				changeType: "hideControl"
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, oInput3, "Settings", {
				changeType: "hideControl"
			}, this.oInputDesignTimeMetadata))

			.then(function(oSettingsCommand) {
				oSettingsCommand2 = oSettingsCommand;
				assert.equal(oAddChangeSpy.callCount, 1, "1. change got added");
				return this.oCommandStack.pushAndExecute(oSettingsCommand2);
			}.bind(this))

			.then(function() {
				// simulate command having no app component
				sandbox.stub(oSettingsCommand2, "getAppComponent");
				assert.equal(oAddChangeSpy.callCount, 2, "until now 2 changes got added");
				assert.equal(oDeleteChangeSpy.callCount, 0, "until now no changes got deleted");
				return this.oCommandStack.undo();
			}.bind(this))

			.then(function() {
				assert.equal(oDeleteChangeSpy.callCount, 0, "no change without app component got deleted");
				return this.oCommandStack.undo();
			}.bind(this))

			.then(function() {
				assert.equal(oDeleteChangeSpy.callCount, 1, "2. change got deleted");
				return this.oCommandStack.redo();
			}.bind(this))

			.then(this.oCommandStack.redo.bind(this.oCommandStack))

			.then(function() {
				assert.equal(oAddChangeSpy.callCount, 3, "only one more change got added");
				assert.equal(oDeleteChangeSpy.callCount, 1, "only one change got deleted");

				return this.oSerializer.saveCommands();
			}.bind(this))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(2);
			}.bind(this))

			.catch(function(oError) {
				return Promise.reject(oError);
			});
		});

		QUnit.test("when a command with an already persisted change gets executed and saved", function(assert) {
			var oInput = new Input("input");
			var oAddChangeSpy = sandbox.spy(PersistenceWriteAPI, "add");

			return CommandFactory.getCommandFor(oInput, "Settings", {
				changeType: "hideControl"
			}, this.oInputDesignTimeMetadata)

			.then(function(oSettingsCommand) {
				this.oCommandStack.push(oSettingsCommand);
				this.oCommandStack._aPersistedChanges = [oSettingsCommand.getPreparedChange().getId()];
				return this.oCommandStack.execute(oSettingsCommand);
			}.bind(this))

			.then(function() {
				assert.equal(oAddChangeSpy.callCount, 0, "no change got added");
			})

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
			}.bind(this));
		});

		QUnit.test("when the LREPSerializer.saveCommands gets called with 2 remove commands created via CommandFactory", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);

			var oAddChangeSpy = sandbox.spy(PersistenceWriteAPI, "add");

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(function() {
				assert.equal(oAddChangeSpy.callCount, 1, "now 1. change got added directly after execute");
			})

			.then(CommandFactory.getCommandFor.bind(null, this.oInput2, "Remove", {
				removedElement : this.oInput2
			}, this.oInputDesignTimeMetadata))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(function() {
				assert.equal(oAddChangeSpy.callCount, 2, "now 2. change got added directly after execute");
			})

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(2);
			}.bind(this));
		});

		QUnit.test("when the LREPSerializer.saveCommands gets called with 2 remove commands created via CommandFactory, but one is relevant for runtime only", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput2, "Remove", {
				removedElement : this.oInput2,
				runtimeOnly : true
			}, this.oInputDesignTimeMetadata))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1);
			}.bind(this));
		});

		QUnit.test("when the LREPSerializer.saveCommands gets called with a command stack with 1 'remove' command for a destroyed control", function(assert) {
			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(function() {
				this.oInput1.destroy();

				var aCommands = this.oCommandStack.getAllExecutedCommands();
				assert.strictEqual(aCommands[0].getElement(), undefined, "then oInput1 cannot be found");
				assert.strictEqual(aCommands[0].getSelector().id, "input1", "then oRemoveCommand1 selector was set");

				return this.oSerializer.saveCommands();
			}.bind(this))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
			}.bind(this));
		});

		QUnit.test("when the LREPSerializer.saveCommands gets called with a command stack with 1 'remove' command and 2 App Descriptor 'add library' commands", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"}))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"}))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1, 0); // first call with 1 object
				fnAssertWrite(2, 1); // second call with 2 objects
			}.bind(this));
		});

		QUnit.test("Execute and undo a composite command with 1 'remove' command and 1 App Descriptor 'add library' command and execute another remove command", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);
			var oRemoveCommand;
			var oAddLibraryCommand;
			var oCompositeCommand;

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(function(oCommand) {
				oRemoveCommand = oCommand;
				return CommandFactory.getCommandFor(this.oInput2, "Remove", {
					removedElement : this.oInput2
				}, this.oInputDesignTimeMetadata);
			}.bind(this))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"}))

			.then(function(oCommand) {
				oAddLibraryCommand = oCommand;
				return CommandFactory.getCommandFor(this.oInput1, "composite");
			}.bind(this))

			.then(function(oCommand) {
				oCompositeCommand = oCommand;
				oCompositeCommand.addCommand(oRemoveCommand);
				oCompositeCommand.addCommand(oAddLibraryCommand);
			})

			.then(function() {
				return this.oCommandStack.pushAndExecute(oCompositeCommand);
			}.bind(this))

			.then(this.oCommandStack.undo.bind(this.oCommandStack))

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))
			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1);
			}.bind(this));
		});

		QUnit.test("Execute 1 'remove' command and 1 App Descriptor 'add library' command, undo the 'add library' command and call saveCommands", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"}))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oCommandStack.undo.bind(this.oCommandStack))

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1);
			}.bind(this));
		});

		QUnit.test("Execute undo and redo on 1 App Descriptor 'add library' command and call saveCommands", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);
			var oDeleteChangeSpy = sandbox.spy(PersistenceWriteAPI, "remove");
			var oCreateAndStoreChangeSpy;

			return CommandFactory.getCommandFor(this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"})

			.then(function(oAddLibraryCommand) {
				oCreateAndStoreChangeSpy = sandbox.spy(oAddLibraryCommand, "createAndStoreChange");
				return this.oCommandStack.pushAndExecute(oAddLibraryCommand);
			}.bind(this))

			.then(function() {
				assert.equal(oCreateAndStoreChangeSpy.callCount, 1, "now app descriptor change got created directly after execute");
				return this.oCommandStack.undo();
			}.bind(this))

			.then(function() {
				assert.equal(oDeleteChangeSpy.callCount, 1, "now app descriptor change got removed directly after undo");
				return this.oCommandStack.redo();
			}.bind(this))

			.then(function() {
				assert.equal(oCreateAndStoreChangeSpy.callCount, 2, "now app descriptor change got created directly after redo");
				return this.oSerializer.saveCommands();
			}.bind(this))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1);
			}.bind(this));
		});

		QUnit.test("Execute 1 'remove' command and 1 App Descriptor 'add library' command, undo the 'add library' command and call saveCommands which rejects", function(assert) {
			var oSaveChangesStub = sandbox.stub(PersistenceWriteAPI, "save").rejects();

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"}))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oCommandStack.undo.bind(this.oCommandStack))

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.notOk(true, "then return promise shouldn't be resolved");
			})

			.catch(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets rejected");
				assert.equal(this.oCommandStack.getCommands().length, 2, "and the command stack has not been cleared");
			}.bind(this))

			.then(function() {
				// clean up dirty canges
				oSaveChangesStub.restore();
				this.oSerializer.saveCommands();
			}.bind(this));
		});

		QUnit.test("when needs restart is asked for normal commands", function(assert) {
			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oSerializer.needsReload.bind(this.oSerializer))

			.then(function(bNeedsRestart) {
				assert.notOk(bNeedsRestart, "then restart is not necessary");
			});
		});

		QUnit.test("when needs restart is asked for app descriptor commands and a normal commands", function(assert) {
			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"}))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oSerializer.needsReload.bind(this.oSerializer))

			.then(function(bNeedsRestart) {
				assert.ok(bNeedsRestart, "then restart is necessary");
			});
		});

		QUnit.test("when needs restart is asked for undone app descriptor commands and a normal commands", function(assert) {
			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "addLibrary", {
				reference : COMPONENT_NAME,
				parameters: {
					libraries : {
						"sap.ui.rta" : {
							lazy:false,
							minVersion:"1.48"
						}
					}
				},
				appComponent : oMockedAppComponent
			}, {}, {layer : "CUSTOMER"}))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oCommandStack.undo.bind(this.oCommandStack))

			.then(this.oSerializer.needsReload.bind(this.oSerializer))

			.then(function(bNeedsRestart) {
				assert.notOk(bNeedsRestart, "then restart is not necessary");
			});
		});

		QUnit.test("Execute 1 'Remove' command and 1 'ControlVariantSwitch' command and save commands", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);

			return CommandFactory.getCommandFor(this.oInput1, "switch", {
				targetVariantReference : "variantReference",
				sourceVariantReference : "variantReference"
			})

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1);
			}.bind(this));
		});

		QUnit.test("Execute 1 'Remove' command, 1 'ControlVariantSwitch' command, undo and call saveCommands", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput1, "switch", {
				targetVariantReference : "variantReference",
				sourceVariantReference : "variantReference"
			}))

			.then(this.oCommandStack.pushAndExecute.bind(this.oCommandStack))

			.then(this.oCommandStack.undo.bind(this.oCommandStack))

			.then(this.oSerializer.saveCommands.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1);
			}.bind(this));
		});

		QUnit.test("when changes belonging to a variant management are executed/partially undone and later saved ", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);
			var oRemoveCommand1;
			var oRemoveCommand2;
			var oAddChangeSpy;
			var oRemoveChangeSpy;

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(function(oCommand) {
				oRemoveCommand1 = oCommand;
				return CommandFactory.getCommandFor(this.oInput2, "Remove", {
					removedElement : this.oInput2
				}, this.oInputDesignTimeMetadata);
			}.bind(this))

			.then(function(oCommand) {
				oRemoveCommand2 = oCommand;
				sandbox.stub(oRemoveCommand1.getPreparedChange(), "getVariantReference").returns("test-variant");
				sandbox.stub(oRemoveCommand2.getPreparedChange(), "getVariantReference").returns("test-variant");
				sandbox.stub(oMockedAppComponent, "getModel").returns({
					removeChange: function() {},
					addChange: function() {},
					getVariant: function() {
						return {
							content : {
								fileName: "idOfVariantManagementReference",
								title: "Standard",
								fileType: "variant",
								reference: "dummyReference",
								variantManagementReference: "idOfVariantManagementReference"
							}
						};
					}
				});
				oAddChangeSpy = sandbox.spy(oMockedAppComponent.getModel(), "addChange");
				oRemoveChangeSpy = sandbox.spy(oMockedAppComponent.getModel(), "removeChange");

				return this.oCommandStack.pushAndExecute(oRemoveCommand1);
			}.bind(this))

			.then(function() {
				assert.equal(oAddChangeSpy.callCount, 1, "then variant model's addChange is called for both changes as VariantManagement Change is detected");
				return this.oCommandStack.pushAndExecute(oRemoveCommand2);
			}.bind(this))

			.then(function() {
				assert.equal(oAddChangeSpy.callCount, 2, "then variant model's addChange is called for both changes as VariantManagement Change is detected");
				return this.oCommandStack.undo();
			}.bind(this))

			.then(function() {
				assert.equal(oRemoveChangeSpy.callCount, 1, "then variant model's removeChange is called as VariantManagement Change is detected");
				return this.oSerializer.saveCommands();
			}.bind(this))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.saveCommands() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(1);
			}.bind(this));
		});

		QUnit.test("when the LREPSerializer.clearCommandStack gets called with 2 remove commands created via CommandFactory and these are booked for a new app variant whose id is different from the id of the current running app", function(assert) {
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);
			var oRemoveCommand1;
			var oRemoveCommand2;

			return CommandFactory.getCommandFor(this.oInput1, "Remove", {
				removedElement : this.oInput1
			}, this.oInputDesignTimeMetadata)

			.then(function(oCommand) {
				oRemoveCommand1 = oCommand;
				return this.oCommandStack.pushAndExecute(oRemoveCommand1);
			}.bind(this))

			.then(CommandFactory.getCommandFor.bind(null, this.oInput2, "Remove", {
				removedElement : this.oInput2
			}, this.oInputDesignTimeMetadata))

			.then(function(oCommand) {
				oRemoveCommand2 = oCommand;
				return this.oCommandStack.pushAndExecute(oRemoveCommand2);
			}.bind(this))

			.then(function() {
				var aUIChanges = [oRemoveCommand1.getPreparedChange(), oRemoveCommand2.getPreparedChange()];
				aUIChanges.forEach(function(oChange) {
					oChange.setNamespace("APP_VARIANT_NAMESPACE");
					oChange.setComponent("APP_VARIANT_REFERENCE");
				});

				return PersistenceWriteAPI.save({selector: oMockedAppComponent, skipUpdateCache: true});
			})

			.then(this.oSerializer.clearCommandStack.bind(this.oSerializer))

			.then(function() {
				assert.ok(true, "then the promise for LREPSerializer.clearCommandStack() gets resolved");
				assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
				fnAssertWrite(2);
			}.bind(this));
		});
	});

	QUnit.module("Given a command serializer loaded with an RTA command stack and ctrl variant commands", {
		beforeEach : function() {
			this.oCommandStack = new CommandStack();

			this.oVariantManagement = new VariantManagement("variantMgmtId1");
			this.oVariantManagement.setModel(oModel, flUtils.VARIANT_MODEL_NAME);
			this.oDesignTimeMetadata = new DesignTimeMetadata({ data : {} });

			this.oSerializer = new CommandSerializer({
				commandStack: this.oCommandStack,
				rootControl: this.oVariantManagement
			});

			var oVariant = {
				content: {
					fileName:"variant0",
					content: {
						title:"variant A"
					},
					layer:"CUSTOMER",
					variantReference:"variant00",
					reference: "Dummy.Component"
				},
				controlChanges : []
			};
			sandbox.stub(oModel, "getVariant").returns(oVariant);
			sandbox.stub(oModel.oVariantController, "_setVariantData").returns(1);
			sandbox.stub(oModel.oVariantController, "_updateChangesForVariantManagementInMap");
			sandbox.stub(oModel.oVariantController, "addVariantToVariantManagement");
			sandbox.stub(oModel.oVariantController, "removeVariantFromVariantManagement");

			return RtaQunitUtils.clear(oMockedAppComponent);
		},
		afterEach : function() {
			this.oCommandStack.destroy();
			this.oSerializer.destroy();
			this.oVariantManagement.destroy();
			this.oDesignTimeMetadata.destroy();
			sandbox.restore();
			return RtaQunitUtils.clear(oMockedAppComponent);
		}
	}, function() {
		QUnit.test("when the LREPSerializer.clearCommandStack gets called with 4 different ctrl variant commands created containing one or more changes and this is booked for a new app variant with different id", function(assert) {
			sandbox.stub(oModel.oVariantController, "getVariant").returns(oVariant);
			var fnAssertWrite = RtaQunitUtils.spySessionStorageWrite(sandbox, assert);
			var oControlVariantConfigureCommand;
			var oControlVariantSwitchCommand;
			var oControlVariantDuplicateCommand;
			var oControlVariantSetTitleCommand;

			var oTitleChange = {
				appComponent : oMockedAppComponent,
				changeType : "setTitle",
				layer : "CUSTOMER",
				originalTitle : "variant A",
				title : "test",
				variantReference : "variant0"
			};
			var oFavoriteChange = {
				appComponent : oMockedAppComponent,
				changeType : "setFavorite",
				favorite : false,
				layer : "CUSTOMER",
				originalFavorite : true,
				variantReference : "variant0"
			};
			var oVisibleChange = {
				appComponent : oMockedAppComponent,
				changeType : "setVisible",
				layer : "CUSTOMER",
				variantReference : "variant0",
				visible : false
			};
			var aChanges = [oTitleChange, oFavoriteChange, oVisibleChange];

			return CommandFactory.getCommandFor(this.oVariantManagement, "configure", {
				control : this.oVariantManagement,
				changes : aChanges
			}, this.oDesignTimeMetadata, {layer: "CUSTOMER"})

			.then(function(oCommand) {
				oControlVariantConfigureCommand = oCommand;
				return CommandFactory.getCommandFor(this.oVariantManagement, "switch", {
					targetVariantReference : "newVariantReference",
					sourceVariantReference : "oldVariantReference"
				});
			}.bind(this))

			.then(function(oCommand) {
				oControlVariantSwitchCommand = oCommand;
				return CommandFactory.getCommandFor(this.oVariantManagement, "duplicate", {
					sourceVariantReference: "variant0",
					newVariantTitle: "newTitle"
				}, this.oDesignTimeMetadata, {layer: "CUSTOMER"});
			}.bind(this))

			.then(function(oCommand) {
				oControlVariantDuplicateCommand = oCommand;
				return CommandFactory.getCommandFor(this.oVariantManagement, "setTitle", {
					newText : "newText"
				}, this.oDesignTimeMetadata, {layer: "CUSTOMER"});
			}.bind(this))

			.then(function(oCommand) {
				oControlVariantSetTitleCommand = oCommand;
				this.oCommandStack.attachCommandExecuted(function(oEvent) {
					if (oEvent.getParameters().command === oControlVariantSetTitleCommand) {
						var aUIChanges = oControlVariantConfigureCommand.getPreparedChange()
							.concat(oControlVariantDuplicateCommand.getPreparedChange())
							.concat([oControlVariantSetTitleCommand.getPreparedChange()]);
						aUIChanges.forEach(function(oChange) {
							// Change the reference of UI changes
							oChange.setNamespace("APP_VARIANT_NAMESPACE");
							oChange.setComponent("APP_VARIANT_REFERENCE");
						});

						return PersistenceWriteAPI.save({selector: oMockedAppComponent, skipUpdateCache: true})
							.then(function() {
								return this.oSerializer.clearCommandStack()
								.then(function() {
									assert.ok(true, "then the promise for LREPSerializer.clearCommandStack() gets resolved");
									assert.equal(this.oCommandStack.getCommands().length, 0, "and the command stack has been cleared");
									fnAssertWrite(5);
								}.bind(this));
							}.bind(this));
					}
				}.bind(this));

				return this.oCommandStack.pushAndExecute(oControlVariantConfigureCommand);
			}.bind(this))

			.then(function() {
				return this.oCommandStack.pushAndExecute(oControlVariantSwitchCommand);
			}.bind(this))

			.then(function() {
				return this.oCommandStack.pushAndExecute(oControlVariantDuplicateCommand);
			}.bind(this))

			.then(function() {
				return this.oCommandStack.pushAndExecute(oControlVariantSetTitleCommand);
			}.bind(this));
		});
	});

	QUnit.done(function () {
		jQuery("#qunit-fixture").hide();
		oGetAppComponentForControlStub.restore();
	});
});
