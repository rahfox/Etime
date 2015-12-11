jQuery.sap.declare("com.broadspectrum.etime.mgr.Component");
jQuery.sap.require("com.broadspectrum.etime.mgr.MyRouter");

sap.ui.core.UIComponent.extend("com.broadspectrum.etime.mgr.Component", {
	metadata: {
		name: "TDG Demo App",
		version: "1.0",
		includes: [],
		dependencies: {
			libs: ["sap.m", "sap.ui.layout"],
			components: []
		},

		rootView: "com.broadspectrum.etime.mgr.view.App",

		config: {
			resourceBundle: "i18n/messageBundle.properties",
			serviceConfig: {
				name: "ZHTR_ETIME_MANAGER_SRV",
				serviceUrl: "/sap/opu/odata/sap/ZHTR_ETIME_MANAGER_SRV/"
			}
		},

		routing: {
			config: {
				routerClass: com.broadspectrum.etime.mgr.MyRouter,
				viewType: "XML",
				viewPath: "com.broadspectrum.etime.mgr.view",
				clearTarget: false,
				transition: "slide"
			},
			routes: [
				{
					pattern: "",
					name: "main",
					view: "Master",
					viewLevel: 1,
					targetAggregation: "masterPages",
					targetControl: "idAppControl",
					subroutes: [
						{
							pattern: "master2/{entity}",
							name: "master2",
							view: "Master2",
							viewLevel: 2,
							targetAggregation: "masterPages"
						}
		    		]
				},
				{
					pattern: "master02/{entity}",
					name: "master02",
					view: "Master2",
					viewLevel: 2,
					targetAggregation: "masterPages",
					subroutes: [
						{
							pattern: "master02/{entity}",
							name: "detail",
							view: "Detail",
							viewLevel: 3,
							targetAggregation: "detailPages"
						}
		    		]
				},
				// {
				//  	pattern: "Detail/{entity}",///{Epernr}/{Dateworked}/{Seqnr}",
				//  	name: "detail01",
				// 	view: "Detail",
				// 	viewLevel: 3
				// 	,
				// 	subroutes: [
				// 		{
				// 			pattern: "Detail2/{entity}",
				// 			name: "detail2",
				// 			view: "Detail2",
				// 			viewLevel: 3,
				// 			targetAggregation: "detailPages"
				// 		}
		  //  		]
				// }
				{
				    pattern: "DetailViewSet/{Epernr}/{Dateworked}/{Seqnr}",
				 	name: "detail2",
					view: "Detail2",
					viewLevel: 3    
				},
				{
				    pattern: "DetailViewSet/{Epernr}/{Dateworked}",
				 	name: "detail1",
					view: "Detail",
					viewLevel: 3    
				}				
		    ]
		}
// 		detailPageRoutes: {
// 			"detail2": {
// 				"pattern": "DetailViewSet/{Epernr}/{Dateworked}/{Seqnr}",
// 				"view": "Detail2",
// 				"viewLevel": 1
// 			}
// 		}
	},

	init: function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

		var mConfig = this.getMetadata().getConfig();

		// Always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var oRootPath = jQuery.sap.getModulePath("com.broadspectrum.etime.mgr");

		// Set i18n model
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [oRootPath, mConfig.resourceBundle].join("/")
		});
		this.setModel(i18nModel, "i18n");

		var sServiceUrl = mConfig.serviceConfig.serviceUrl;

		//This code is only needed for testing the application when there is no local proxy available
		var bIsMocked = jQuery.sap.getUriParameters().get("responderOn") === "true";
		// Start the mock server for the domain model
		if (bIsMocked) {
			this._startMockServer(sServiceUrl);
		}

		// Create and set domain model to the component
		var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {
			json: true,
			loadMetadataAsync: true
		});
		this.setModel(oModel);

		// Set device model
		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch: sap.ui.Device.support.touch,
			isNoTouch: !sap.ui.Device.support.touch,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
		});
		oDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(oDeviceModel, "device");

		this.getRouter().initialize();

	},

	_startMockServer: function(sServiceUrl) {
		jQuery.sap.require("sap.ui.core.util.MockServer");
		var oMockServer = new sap.ui.core.util.MockServer({
			rootUri: sServiceUrl
		});

		var iDelay = +(jQuery.sap.getUriParameters().get("responderDelay") || 0);
		sap.ui.core.util.MockServer.config({
			autoRespondAfter: iDelay
		});

		oMockServer.simulate("model/metadata.xml", "model/");
		oMockServer.start();

		sap.m.MessageToast.show("Running in demo mode with mock data.", {
			duration: 2000
		});
	}
});