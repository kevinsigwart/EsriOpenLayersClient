var map,siteSelWMS, layerURL = "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer";
var wfstLayer;
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
		return "/sharing/proxy.ashx?" + url;
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
			
function saveFinished(evt){

    //Updating the WMS
    siteSelWMS.redraw(true);
	alert("Save Successful");
}

/**
*Adds the Attribute information to the feature being edited.
*/
function addAttributeInformation(tempFeature)
{
    tempFeature.attributes.currentlocation = 'pen';
	wfstLayer.redraw(true);
}


function initMap(layerInfo) {
	
	//Adding an OSM Layer as the initial basemap
	var OSMlayer = new OpenLayers.Layer.OSM( "Simple OSM Map");
	
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
	 * Make sure our baselayer and our map are synced up.
	 */
	map = new OpenLayers.Map('map', {
		maxExtent : baseLayer.maxExtent,
		units : baseLayer.units,
		resolutions : baseLayer.resolutions,
		numZoomLevels : baseLayer.numZoomLevels,
		tileSize : baseLayer.tileSize,
		projection: new OpenLayers.Projection("EPSG:3857"),
        displayProjection: new OpenLayers.Projection("EPSG:3857"),
        units: "m"
	});
	
	/*
	 * A WMTS Map from an ArcGIS Server 10.1
	 */
    var wmts = new OpenLayers.Layer.WMTS({
        name: "WMTS",
        url: "http://dtc-sci02.esri.com/arcgis/rest/services/201311_OGCDemos/NofolkMultispectral/ImageServer/WMTS/",
        layer: "0",
        matrixSet: "EPSG:3857",
        format: "image/png",
        style: "_null",
        opacity: 1,
        isBaseLayer: true
        
    }); 
    wmts.setVisibility(false);
    
    //Adding all the basemaps to the map.
    map.addLayers([OSMlayer,baseLayer,wmts]);
    
    //An Esri Polygon Map Service from a 10.1 ArcGIS Server
	var osmPoly = new OpenLayers.Layer.ArcGIS93Rest("OSM Polys-Esri MapService", "http://dtc-sci02.esri.com/arcgis/rest/services/201311_OGCDemos/OSMPolys/MapServer/export", {
	    layers: "show:1,2,3,4,5",
		transparent:true,		
		isBaseLayer:false
	});	
	
	osmPoly.setVisibility(false);
	
	map.addLayers([osmPoly]);

	//A WMS Polyline dataset coming from a 10.1 ArcGIS Server
	var osmLine = new OpenLayers.Layer.WMS("OSM Roads-Esri WMS", "http://dtc-sci02.esri.com/arcgis/services/201311_OGCDemos/NofolkOSMLines/MapServer/WMSServer", {
		layers : "2,7,8",
		format : "image/gif",
		transparent : "true"
	}, {
		opacity : 0.5,
		isBaseLayer : false,
		wrapDateLine : false
	});
	
	osmLine.setVisibility(false);
	
	map.addLayers([osmLine]);

	//Time enabled WMS of Projected Inundation coming from an Esri ArcGIS Server 10.1
	innundationWMS = new OpenLayers.Layer.WMS("Inundation Esri WMS-wTime", "http://dtc-sci02.esri.com/arcgis/services/201311_OGCDemos/NorfolkInundationNetCDF/MapServer/WMSServer", {
		layers : "0",
		format : "image/gif",
		transparent : "true",
		time : "2000-01-01"
	}, {
		opacity : 0.5,
		isBaseLayer : false,
		wrapDateLine : false
	});
	
	innundationWMS.setVisibility(false);
	
	map.addLayers([innundationWMS]);
	
	//Adding a WMS of the site selection.
	siteSelWMS = new OpenLayers.Layer.WMS("Site Selection Esri WMS", "http://dtc-sci02.esri.com/arcgis/services/SiteSelection/MapServer/WMSServer", {
		layers : "0",
		format : "image/gif",
		transparent : "true"
	}, {
		opacity : 0.5,
		isBaseLayer : false,
		wrapDateLine : false
	});
	siteSelWMS.setVisibility(false);
	map.addLayers([siteSelWMS]);
	
	var saveStrategy = new OpenLayers.Strategy.Save();
	saveStrategy.events.register('success',null,saveFinished);
	
	var styleMap = new OpenLayers.StyleMap({
		"default": new OpenLayers.Style({
			fillColor: "#336699",
			fillOpacity: 0.4, 
			hoverFillColor: "white",
			hoverFillOpacity: 0.8,
			strokeColor: "#003366",
			strokeOpacity: 0.8,
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeDashstyle: "solid",
			hoverStrokeColor: "red",
			hoverStrokeOpacity: 1,
			hoverStrokeWidth: 0.2,
			pointRadius: 6,
			hoverPointRadius: 1,
			hoverPointUnit: "%",
			pointerEvents: "visiblePainted",
			cursor: "inherit"
		}),
            "select": new OpenLayers.Style({
			fillColor: "#ffcc00",
			fillOpacity: 0.4, 
			hoverFillColor: "white",
			hoverFillOpacity: 0.6,
			strokeColor: "#ff9900",
			strokeOpacity: 0.6,
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeDashstyle: "solid",
			hoverStrokeColor: "red",
			hoverStrokeOpacity: 1,
			hoverStrokeWidth: 0.2,
			pointRadius: 6,
			hoverPointRadius: 1,
			hoverPointUnit: "%",
			pointerEvents: "visiblePainted",
			cursor: "pointer"
        }),
		"temporary": new OpenLayers.Style({        
			fillColor: "#587058",
			fillOpacity: 0.4, 
			hoverFillColor: "white",
			hoverFillOpacity: 0.8,
			strokeColor: "#587498",
			strokeOpacity: 0.8,
			strokeLinecap: "round",
			strokeWidth: 2,
			strokeDashstyle: "solid",
			hoverStrokeColor: "red",
			hoverStrokeOpacity: 1,
			hoverStrokeWidth: 0.2,
			pointRadius: 6,
			hoverPointRadius: 1,
			hoverPointUnit: "%",
			pointerEvents: "visiblePainted",
			cursor: "inherit"
		})
	});
	
	//Add WFS-T to the map.
	wfstLayer = new OpenLayers.Layer.Vector("Esri WFST Without Lock", {
		strategies : [new OpenLayers.Strategy.BBOX(), saveStrategy],
		projection : new OpenLayers.Projection("EPSG:3857"),
		styleMap: styleMap,
		protocol : new OpenLayers.Protocol.WFS({
			version : "1.1.0",
			srsName : "EPSG:3857",
			url : "http://dtc-sci02.esri.com/arcgis/services/SiteSelection/MapServer/WFSServer?",
			//featureNS : "http://www.esri.com",
			// the featurePrefix doesn't apply when encoding features using GML3 format
			//   OpenLayers.Format.WFSTWithLock fixes this by overriding the GML3 feature encoder
			featurePrefix : "esri",
			featureType : "SiteLocations",
			geometryName : "SHAPE",
			schema : "http://dtc-sci02.esri.com/arcgis/services/SiteSelection/MapServer/WFSServer?request=describefeaturetype&typename=SiteSelection:SiteLocations"
			        })
    });
	
	wfstLayer.setVisibility(true);
	
	map.addLayers([wfstLayer]);
	

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
    	wfstLayer, OpenLayers.Handler.Polygon,
        {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePolygon",
            multi: true,
			featureAdded:addAttributeInformation
        }
    );
    	
    
    var edit = new OpenLayers.Control.ModifyFeature(wfstLayer, {
        title: "Modify Feature",
        displayClass: "olControlModifyFeature"
    });

	//When a WFS-T is modified we clear out the attributes.
	wfstLayer.events.on({
     'afterfeaturemodified': function(evt) {
		//We don't want to update the attributes, only the geometry, so we clear them out.
		//This is because you cannot edit the OBJECTID.  Another option is to just blow out the
		//ObjectID too.
		evt.feature.attributes = {};
     }
    });
	
    var del = new DeleteFeature(wfstLayer, {title: "Delete Feature"});
   
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
