var map,layerURL = "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer";
var wfstLayer;
var wmsEcoRegions;
var format = new OpenLayers.Format.SLD();

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
	 
	 /***********************************************************************************
	  *ArcGIS Online Basemap (Light Gray)
	  ***********************************************************************************/
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
	
	/***********************************************************************************************
	 * ArcGIS Online Basemaps are now being served out as WMTS
	 ***********************************************************************************************/
    var wmts = new OpenLayers.Layer.WMTS({
        name: "WMTS Ocean Basemap",
        url: "http://services.arcgisonline.com/arcgis/rest/services/Ocean_Basemap/MapServer/WMTS/",
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
    
	/*********************************************************************************************
	 * WMS Service hosted in ArcGIS Server
	 *  styling through SLD
	 *********************************************************************************************/
	//A WMS Polygon coming from a 10.2.1 ArcGIS Server
	wmsEcoRegions = new OpenLayers.Layer.WMS("EcoRegions-Esri WMS", "http://dtc-sci02.esri.com/arcgis/services/OGC_DevSummit2014/MarineEcoRegions/MapServer/WMSServer", {
		layers : "0",
		format : "image/png32",
		transparent : "true",
		styles: "polygonSymbolizer", 
        SLD: "http://dtc-sci01.esri.com/OGCApps/OpenLayersApp/styles/EcoRegionStyle.xml"		
	}, {
		//opacity : 1,
		isBaseLayer : false,
		wrapDateLine : false
	});
	
	wmsEcoRegions.setVisibility(false);
	
	map.addLayers([wmsEcoRegions]);
	
	/********************************************************************************************
	 * WFS Hosted in ArcGIS Server
	 ********************************************************************************************/
	//Setting up the symbology for WFS
	var styleMap = new OpenLayers.StyleMap({
		"default": new OpenLayers.Style({
			fillColor: "#336699",
			fillOpacity: 0.4, 
			hoverFillColor: "white",
			hoverFillOpacity: 0.8,
			strokeColor: "#003366",
			strokeOpacity: 0.8,
			strokeWidth: 1.5,
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
		})
	});
	
		//Add a WFS to the map.
	//There are a bunch of features.  It's best to zoom in before turning on
	var wfsLMEBoundary = new OpenLayers.Layer.Vector("LME - Esri WFS", {
        protocol: new OpenLayers.Protocol.WFS({
			version : "1.1.0",
			srsName : "EPSG:3857",
            url: "http://dtc-sci02.esri.com//arcgis/services/OGC_DevSummit2014/LargeMarineEcoSystems/MapServer/WFSServer?",
			featurePrefix : "esri",
			featureType : "LIM_Generalized",
			geometryName : "SHAPE",
			schema : "http://dtc-sci02.esri.com/arcgis/services/OGC_DevSummit2014/LargeMarineEcoSystems/MapServer/WFSServer?request=describefeaturetype&typename=OGC_DevSummit2014_LargeMarineEcoSystems:LIM_Generalized"
            //featureNS: "http://www.openplans.org/topp"
        }),
        strategies: [new OpenLayers.Strategy.BBOX()],
		styleMap: styleMap,
    });
	
	wfsLMEBoundary.setVisibility(false);
	
    map.addLayer(wfsLMEBoundary);  
	
	/*********************************************************************************
	 * WFS-T Example
	 *********************************************************************************/
	
	//Need Save Strategy for doing edits 
	var saveStrategy = new OpenLayers.Strategy.Save();
	saveStrategy.events.register('success',null,function saveFinished(evt){
		alert("Save Successful");
	});
	
	//Creating WFS-T layer from an ArcGIS Server 10.1.1 Version
	wfstLayer = new OpenLayers.Layer.Vector("Observations - Esri WFS-T", {
		strategies : [new OpenLayers.Strategy.BBOX(), saveStrategy],
		projection : new OpenLayers.Projection("EPSG:3857"),
		//styleMap: styleMap,
		protocol : new OpenLayers.Protocol.WFS({
			version : "1.1.0",
			srsName : "EPSG:3857",
			url : "http://dtc-sci02.esri.com/arcgis/services/SiteSelection/MapServer/WFSServer?",
			featurePrefix : "esri",
			featureType : "SiteLocations",
			geometryName : "SHAPE",
			schema : "http://dtc-sci02.esri.com/arcgis/services/SiteSelection/MapServer/WFSServer?request=describefeaturetype&typename=SiteSelection:SiteLocations"
			        })
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
	
	wfstLayer.setVisibility(true);
	//Add to Map
	map.addLayers([wfstLayer]);
	
	
	/*******************************************************************************************
	 * Esri Dynamic Map Service
	 *******************************************************************************************/
	//An Esri Map Service using Esri Geoservices Rest Specification from a 10.2.1 ArcGIS Server
	var esriMapService = new OpenLayers.Layer.ArcGIS93Rest("pH Change ArcGIS MapService", "http://dtc-sci02.esri.com/arcgis/rest/services/OGC_DevSummit2014/pH_Change_Map_NoCache/MapServer/export", {
	    layers: "show:0",
		transparent:true,		
		isBaseLayer:false
	},{
		opacity : 0.6,
	}
	);	
	
	esriMapService.setVisibility(false);
	map.addLayers([esriMapService]);
	
	
	/**********************************************************************************
	 * Editing Tools
	 **********************************************************************************/
	var panel = new OpenLayers.Control.Panel({
        displayClass: 'customEditingToolbar',
        allowDepress: true
    });
    
    var draw = new OpenLayers.Control.DrawFeature(
    	wfstLayer, OpenLayers.Handler.Polygon,
        {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePolygon",
            multi: true
        }
    );
    	
    
    var edit = new OpenLayers.Control.ModifyFeature(wfstLayer, {
        title: "Modify Feature",
        displayClass: "olControlModifyFeature"
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
    		
	//Adding the Editing Toolbar
    map.addControl(panel);
	
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.MousePosition());
	map.zoomToExtent(new OpenLayers.Bounds(-10238892.81285323,2744395.0635501994,-5028944.9649370015,5870363.772299937));
}
