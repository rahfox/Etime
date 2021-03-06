jQuery.sap.require("com.broadspectrum.etime.mgr.util.Dialogs");
jQuery.sap.require("sap.m.MessageBox");

sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.mgr.view.Master2", {

	onInit: function() {
		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		this.oRoutingParams = {};
		var oEventBus = this.getEventBus();
		oEventBus.subscribe("DetailViewSet1", "Changed", this.onDetailChanged, this);
		this.dontRefreshMaster2 = false;
	},

	onRouteMatched: function(oEvent) {
		if (!this.dontRefreshMaster2) {
			var oParameters = oEvent.getParameters();
			if (oParameters.name === "timesheets") {
				if (oParameters.arguments.TeamViewEntity) {
					this.oRoutingParams.TeamViewEntity = oParameters.arguments.TeamViewEntity;
				} else {
					this.getRouter().navTo("notfound", {}, true); // don't create a history entry
					return;
				}
				this.bindView("/" + this.oRoutingParams.TeamViewEntity);
				this.checkSubmitButtonEnabled();
			}
		}
	},

	onDetailChanged: function(sChanel, sEvent, oData) {
		this.bindView(this.keyForView);
	},

	bindView: function(sEntityPath) {
		this.keyForView = sEntityPath;
		var oList = this.getView().byId("master2List");

		var template = this.getView().byId("master2List").mBindingInfos.items.template;

		oList.bindItems(this.keyForView + "/EmployeeViewSet", template, null, null);

		//Check if the data is already on the client
		if (!oList.getModel().getData(sEntityPath + "/EmployeeViewSet")) {

			// Check that the entity specified was found
			oList.attachEventOnce("dataReceived", jQuery.proxy(function() {
				var oData = oList.getModel().getData(sEntityPath + "/EmployeeViewSet");
				if (!oData) {
					this.showEmptyView();
					this.fireDetailNotFound();
				}
			}, this));
		}
	},

	showEmptyView: function() {
		this.getRouter().navTo("notfound", {}, true); // don't create a history entry
	},

	fireDetailNotFound: function() {
		this.getEventBus().publish("Master2", "NotFound");
	},

	checkSubmitButtonEnabled: function() {
		if (this.getModel().hasPendingChanges()) {
			this.byId("submitButton").setEnabled(true);
		} else {
			this.byId("submitButton").setEnabled(false);
		}
	},

	onNavBack: function() {
		var oModel = this.getModel();
		if (oModel.hasPendingChanges()) {
			sap.m.MessageBox.show("Exit without submitting approvals?", {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: "Unsubmitted Approvals",
				actions: [sap.m.MessageBox.Action.CANCEL, sap.m.MessageBox.Action.OK],
				onClose: $.proxy(function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						oModel.resetChanges();
						this.navHistoryBack();
					}
				}, this)
			});
		} else {
			this.navHistoryBack();
		}
	},

	navHistoryBack: function() {
		if (sap.ui.Device.system.phone) {
			// splitapp behaves like a single nav controller on phones, so navigating
			// to a new route makes the transition slide in the wrong direction, whereas
			// with a single nav controller we really just want to go back...
			window.history.go(-1);
		} else {
		    this.dontRefreshMaster2 = false;
			this.getRouter().navTo("home");
		}
	},

	onSearch: function() {
		// Add search filter
		var filters = [];
		var searchString = this.getView().byId("master2SearchField").getValue();
		if (searchString && searchString.length > 0) {
			filters = [new sap.ui.model.Filter("", sap.ui.model.FilterOperator.Contains, searchString)];
		}

		// Update list binding
		this.getView().byId("master2List").getBinding("items").filter(filters);
	},

	onMaster2ListItemTap: function(oEvent) {
		// Get the list item either from the listItem parameter or from the event's
		// source itself (will depend on the device-dependent mode)
		this.showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		this.dontRefreshMaster2 = true;
	},

	showDetail: function(oItem) {
		this.getRouter().navTo("detail", {
			TeamViewEntity: this.oRoutingParams.TeamViewEntity,
			EmployeeViewEntity: oItem.getBindingContext().getPath().substr(1) // no slash in router param
		});
	},

	onSubmitPressed: function(oEvent) {
		var oModel = this.getModel();
		// remove all current messages from message manager
		sap.ui.getCore().getMessageManager().removeAllMessages();

		// note that we have to specify this submission is only for deferred batch group "detailChanges"
		// otherwise all service calls get batched together and the success/error outcome is clouded
		oModel.submitChanges({
			success: $.proxy(function() {
				// check for messages.  Potential improement area post-upgrade with batching handling
				if (sap.ui.getCore().getMessageManager().getMessageModel().oData.length > 0) {
					// show odata errors in message popover
					this.showMessagePopover(this.byId("toolbar"));
				} else {
					// raise a toast to the user!
				// 	this.navHistoryBack();
				this.getRouter().navTo("home");
					sap.m.MessageToast.show("Approvals submitted");
				}
			}, this),
			error: $.proxy(function() {
				// show odata errors in message popover
				this.showMessagePopover(this.byId("toolbar"));
				var msg = 'Approvals submit encountered errors! Pleae review and retry.';
				sap.m.MessageToast.show(msg);
			}, this)
		});
	},

	showMessagePopover: function(oOpenBy) {
		com.broadspectrum.etime.mgr.util.Dialogs.getMessagePopover(this).openBy(oOpenBy || this.getView());
	},

	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	getModel: function() {
		return sap.ui.getCore().getModel();
	},

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	}
});