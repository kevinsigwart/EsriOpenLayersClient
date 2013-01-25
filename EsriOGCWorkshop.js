var map,siteSelWMS, layerURL = "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer";
var innundationWMS;
var button2025,button2075,button2000,button2050,button3000;

var DeleteFeature = OpenLayers.Class(OpenLayers.Control, {
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.handler = new OpenLayers.Handler.Feature(
            this, layer, {click: this.clickFeature}
        );
    },
    clickFeature: function(feature) {
        // if feature doesn't have a fid, destroy it
        if(feature.fid == undefined) {
            this.layer.destroyFeatures([feature]);
        } else {
            feature.state = OpenLayers.State.DELETE;
            this.layer.events.triggerEvent("afterfeaturemodified", 
                                           {feature: feature});
            feature.renderIntent = "select";
            this.layer.drawFeature(feature);
        }
    },
    setMap: function(map) {
        this.handler.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
    CLASS_NAME: "OpenLayers.Control.DeleteFeature"
});


function init() {
	var jsonp = new OpenLayers.Protocol.Script();
	
	OpenLayers.ProxyHost= function(url) {
		return "/dev.summit.2012/ApacheProxyServlet?url=" + url;
    };
	
	jsonp.createRequest(layerURL, {
		f : 'json',
		pretty : 'true'
	}, initMap);
}

function updateTime(evt)
{
	if(this.title == '2000')
	{
		innundationWMS.params.TIME = "2000-01-01";
		button2025.deactivate();
		button2050.deactivate();
		button2075.deactivate();
		button3000.deactivate();
	}
	else if(this.title == '2025')
	{
		innundationWMS.params.TIME = "2025-01-01";
		button2000.deactivate();
		button2050.deactivate();
		button2075.deactivate();
		button3000.deactivate();
	}
	else if(this.title == '2050')
	{
		innundationWMS.params.TIME = "2050-01-01";
		button2000.deactivate();
		button2025.deactivate();
		button2075.deactivate();
		button3000.deactivate();
	}
	else if(this.title == '2075')
	{
		innundationWMS.params.TIME = "2075-01-01";
		button2000.deactivate();
		button2050.deactivate();
		button2025.deactivate();
		button3000.deactivate();
	}
	else if(this.title == '3000')
	{
		innundationWMS.params.TIME = "2099-01-01";
		button2000.deactivate();
		button2050.deactivate();
		button2025.deactivate();
		button2075.deactivate();
	}
	this.activate();
	
	innundationWMS.redraw(true);
}
			
function saveStarted (evt) {
    //Setting the current location attribute to pending.
    if(evt != null && evt.features != {})
    	evt.features[0].attributes.currentlocation = 'pen';
}  

function saveFinished(evt){
	
	var layer = evt.object.layer;
	layer.removeAllFeatures();
	layer.refresh();
	siteSelWMS.redraw(true);
	alert("Save Complete");
}

function initMap(layerInfo) {
	/*
	 * The initialize function in this layer has the ability to automatically configure
	 * itself if given the JSON capabilities object from the ArcGIS map server.
	 * This hugely simplifies setting up a new layer, and switching basemaps when using this technique.
	 *
	 * see the 'initialize' function in ArcGISCache.js, or
	 * see the other two ArcGISCache.js examples for direct manual configuration options
	 *
	 */
	var baseLayer = new OpenLayers.Layer.ArcGISCache("ArcGIS Cached Gray Map", layerURL, {
		layerInfo : layerInfo
	});

	/*
	 * Make sure our baselayer and our map are synced up
	 */
	map = new OpenLayers.Map('map', {
		maxExtent : baseLayer.maxExtent,
		units : baseLayer.units,
		resolutions : baseLayer.resolutions,
		numZoomLevels : baseLayer.numZoomLevels,
		tileSize : baseLayer.tileSize,
		displayProjection : baseLayer.displayProjection
	});
	map.addLayers([baseLayer]);
	
	var baseLayer2 = new OpenLayers.Layer.ArcGISCache("Street Map", "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer", {
		layerInfo : layerInfo
	});
	
    var wmts = new OpenLayers.Layer.WMTS({
        name: "WMTS",
        url: "http://ksigwart:6080/arcgis/rest/services/NorfolkImagery/MapServer/WMTS/",
        layer: "0",
        matrixSet: "EPSG:3857",
        format: "image/png",
        style: "_null",
        opacity: 1,
        isBaseLayer: false
        
    }); 
    wmts.setVisibility(false);
    
    map.addLayers([baseLayer2,wmts]);
    

	//Polygon WMS Dataset of buildings
	var polygons = new OpenLayers.Layer.WMS("Polygons", "http://wdcb4.esri.com/arcgis/services/201212_NetCDF_Viewer/NorfolkPolygons/MapServer/WMSServer", {
		layers : "2,3,4,5,6,7,8",
		format : "image/gif",
		transparent : "true"
	}, {
		opacity : 0.5,
		isBaseLayer : false,
		wrapDateLine : false
	});
	
	polygons.setVisibility(false);
	
	map.addLayers([polygons]);

	//Time enabled WMS of Projected Inundation
	innundationWMS = new OpenLayers.Layer.WMS("Inundation", "http://wdcb4.esri.com/arcgis/services/201212_NetCDF_Viewer/norfolk_SeaLevelRise/MapServer/WMSServer", {
		layers : "0",
		format : "image/gif",
		transparent : "true",
		time : "2000-01-01"
	}, {
		opacity : 0.5,
		isBaseLayer : false,
		wrapDateLine : false
	});
	
	innundationWMS.setVisibility(true);
	
	map.addLayers([innundationWMS]);
	
	//Adding a WMS of the site selection, because the WFS is not rendering within open layers
	siteSelWMS = new OpenLayers.Layer.WMS("Site Selection", "http://wdcb4.esri.com/arcgis/services/SiteSelection/MapServer/WMSServer", {
		layers : "0",
		format : "image/gif",
		transparent : "true"
	}, {
		opacity : 0.5,
		isBaseLayer : false,
		wrapDateLine : false
	});
	
	map.addLayers([siteSelWMS]);
	
	var saveStrategy = new OpenLayers.Strategy.Save();
	
	saveStrategy.events.register('start', null, saveStarted);
	saveStrategy.events.register('success',null,saveFinished);
	
    var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
    renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
	
	var wfstLyr = new OpenLayers.Layer.Vector("WFST Without Lock", {
		strategies : [new OpenLayers.Strategy.BBOX(), saveStrategy],
		projection : new OpenLayers.Projection("EPSG:3857"),
		protocol : new OpenLayers.Protocol.WFS({
			version : "1.1.0",
			srsName : "EPSG:3857",
			url : "http://wdcb4.esri.com/arcgis/services/SiteSelection/MapServer/WFSServer?",
			featureNS : "http://www.esri.com",
			// the featurePrefix doesn't apply when encoding features using GML3 format
			//   OpenLayers.Format.WFSTWithLock fixes this by overriding the GML3 feature encoder
			featurePrefix : "esri",
			featureType : "SiteLocations",
			geometryName : "shape",
			schema : "http://wdcb4.esri.com/arcgis/services/SiteSelection/MapServer/WFSServer?request=describefeaturetype&typename=SiteSelection:SiteLocations",
			formatOptions : {
				extractAttributes : true,
				xy:true
			}
		}),
		renderers: renderer
	});
	
	wfstLyr.setVisibility(true);
	
	map.addLayers([wfstLyr]);
	

	button2000 = new OpenLayers.Control.Button({
		'displayClass': "olControlButton2000",title:"2000", trigger: updateTime
	});
	button2025 = new OpenLayers.Control.Button({
		'displayClass': "olControlButton2025",title:"2025", trigger: updateTime
	});
	button2050 = new OpenLayers.Control.Button({
		'displayClass': "olControlButton2050",title:"2050", trigger: updateTime
	});
	button2075 = new OpenLayers.Control.Button(
			{
				'displayClass': 'olControlButton2075', 
				 title:"2075", 
				 trigger: updateTime
	});
	button3000 = new OpenLayers.Control.Button({
		'displayClass': "olControlButton3000",title:"3000", trigger: updateTime
	});
	
	
	var panel = new OpenLayers.Control.Panel({
        displayClass: 'customEditingToolbar',
        allowDepress: true
    });
    
	
    var draw = new OpenLayers.Control.DrawFeature(
    	wfstLyr, OpenLayers.Handler.Polygon,
        {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePolygon",
            multi: true
        }
    );
    	
    
    var edit = new OpenLayers.Control.ModifyFeature(wfstLyr, {
        title: "Modify Feature",
        displayClass: "olControlModifyFeature"
    });

    var del = new DeleteFeature(wfstLyr, {title: "Delete Feature"});
   
    var save = new OpenLayers.Control.Button({
        title: "Save Changes",
        trigger: function() {
            if(edit.feature) {
                edit.selectControl.unselectAll();
            }
            saveStrategy.save();
        },
        displayClass: "olControlSaveFeatures"
    });

    panel.addControls([save, del, edit, draw]);
    		
    //The time panel will have a button for years 2000 - 3000 in 25 year intervals
	var timePanel = new OpenLayers.Control.Panel({defaultControl: button2000});
	timePanel.addControls([button2000,button2025,button2050,button2075,button3000]);

	//Adding the Editing Toolbar
    map.addControl(panel);
	
	//Adding the Time Toolbar
    map.addControl(timePanel);
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.MousePosition());
	map.zoomToExtent(new OpenLayers.Bounds(-8502582, 4421100, -8478963, 4437515));
}
