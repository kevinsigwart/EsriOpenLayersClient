var map, layer;

function init(){

    //WPS requires a Proxy to do the POST
    OpenLayers.ProxyHost= function(url) {
		          return "/sharing/proxy.ashx?" + url;
            };
    
    //Using OSM Layer as the basemap
    var OSMlayer = new OpenLayers.Layer.OSM( "Simple OSM Map");

    //Creating a Map
    map = new OpenLayers.Map('map', {
        maxExtent : OSMlayer.maxExtent,
        units : OSMlayer.units,
        numZoomLevels : OSMlayer.numZoomLevels,
        projection: new OpenLayers.Projection("EPSG:3857"),
        displayProjection: new OpenLayers.Projection("EPSG:3857"),
    });

    map.addLayers([OSMlayer]);

    //Soil Moisture WMS, cooresponds to the result from the WPS
    layer = new OpenLayers.Layer.WMS("Soil Moisture", "http://dtc-sci02.esri.com/arcgis/services/201307_GLDAS_Multidimensional/SoilMoisture/MapServer/WMSServer", {
            layers : "0",
            format : "image/png32",
            transparent : "true"		
        }, {
            isBaseLayer : false,
            wrapDateLine : false,
             opacity : 0.6
        });

    map.addLayers([layer]);

    //Graphics Layer for the Point Drawn
    var pointLayer = new OpenLayers.Layer.Vector("Point Layer");
    map.addLayers([pointLayer]);

    var drawPoint = new OpenLayers.Control.DrawFeature(pointLayer,OpenLayers.Handler.Point);

    //Event fires off when the Point is created
    drawPoint.events.on({
     'featureadded': function(evt) {
         
        //Currently only supports running once
        drawPoint.deactivate();
        
        //We need to convert the map point to WGS84 for this particular WPS 
        var point = evt.feature.geometry
        point.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
         
        var x = evt.feature.geometry.x;
        var y = evt.feature.geometry.y;
        
        //Use the point to build our WPS Execute POST Request
        buildExecuteRequest(x,y);
     }
    });

    //Adding Draw Point Control
    map.addControl(drawPoint);
    drawPoint.activate();

    map.zoomToExtent(new OpenLayers.Bounds(-14343255.483653005,2876478.2484269678,-6780270.157006536,6975948.949416451));
    
}

/**
 *Proof of concept... Building out the WPS execute request currently, and just putting the coordinates down.
 */
function buildExecuteRequest(x,y){
    var execute = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>";   
        execute += "<wps:Execute service=\"WPS\" version=\"1.0.0\" xmlns:wps=\"http://www.opengis.net/wps/1.0.0\" xmlns:ows=\"http://www.opengis.net/ows/1.1\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd\"><ows:Identifier>MakeNetCDFTable</ows:Identifier>";
        execute += "<wps:DataInputs>";
        execute += "<wps:Input>";
        execute += "<ows:Identifier>in_pnt</ows:Identifier>";
        execute += "<ows:Title>in_pnt</ows:Title>";
        execute += "<wps:Data>";
        execute += "<wps:ComplexData mimeType=\"text/xml\" encoding=\"UTF-8\" schema=\"http://schemas.opengis.net/gml/3.1.1/base/gml.xsd\">";
        execute += "<wfs:FeatureCollection xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:esri=\"http://www.esri.com\">";
        execute += "<gml:featureMember>";
        execute += "<esri:blockgroups gml:id=\"F3__1\">";
        execute += "<esri:Shape>";
        execute += "<gml:MultiPoint srsName=\"EPSG:4326\">";
        execute += "<gml:pointMember>";
        execute += "<gml:Point srsName=\"EPSG:4326\">";
        //Putting in the point values here
        execute +=    "<gml:coordinates>" + x + "," + y + "</gml:coordinates>";
        //execute +=    "<gml:coordinates>-103,31</gml:coordinates>"; 
        execute += "</gml:Point>";
        execute += "</gml:pointMember>";
        execute += "</gml:MultiPoint>";
        execute += "</esri:Shape>";
        execute += "</esri:blockgroups>";
        execute += "</gml:featureMember>";
        execute += "</wfs:FeatureCollection>";
        execute += "</wps:ComplexData>";
        execute += "</wps:Data>";
        execute += "</wps:Input>";
        execute += "<wps:Input>";
        execute += "<ows:Identifier>output_spatial_reference</ows:Identifier>";
        execute += "<ows:Title>output_spatial_reference</ows:Title>";
        execute += "<wps:Data>";
        execute += "<wps:LiteralData>ESPG:3857</wps:LiteralData>";
        execute += "</wps:Data>";
        execute += "</wps:Input>";
        execute += "</wps:DataInputs>";
        execute += "<wps:ResponseForm>";
        execute += "<wps:ResponseDocument storeExecuteResponse=\"false\" lineage=\"false\" status=\"false\">";
        execute += "<wps:Output schema=\"http://schemas.opengis.net/gml/3.1.1/base/gml.xsd\" mimeType=\"text/xml\" encoding=\"UTF-8\" asReference=\"false\">";
        execute += "<ows:Identifier xmlns:ows=\"http://www.opengis.net/ows/1.1\">out_table</ows:Identifier>";
        execute += "</wps:Output>";
        execute += "</wps:ResponseDocument>";
        execute += "</wps:ResponseForm>";
        execute += "</wps:Execute>";
    
    //Make the post request
    var request = OpenLayers.Request.POST({
        url: "http://dtc-sci02.esri.com/arcgis/services/OGC_DevSummit2014/MakeNetCDFTable/GPServer/WPSServer",
        data: execute,
        callback: handleResult
    })
}

/**
 * Once we have the response from the Post, we need to parse out the values.
 */
function handleResult(response){
    parseResult(response.responseXML)
}

/**
 * Parses the results then puts it in the proper format so D3 can chart it.
  */
function parseResult(response){
    
    xmlDoc = response;
    
    results = xmlDoc.getElementsByTagName("out_table")
    
    var chartPoints = [];
    
    if(results.length != 0)
    {
        for(var index=0; index < results.length; index++)
        {
            var plotPoint = [];
            var timeString = results[index].getElementsByTagName("time")[0].childNodes[0].nodeValue;
            var dateTimeNum = Date.parse(timeString);
		    var dateTime = new Date(dateTimeNum);
            plotPoint.time = dateTime;
            plotPoint.value = results[index].getElementsByTagName("SoilMoist1_GDS0_DBLY")[0].childNodes[0].nodeValue;
            chartPoints[index] = plotPoint;
        }
    }
    else
    {
        results = xmlDoc.getElementsByTagName("OGC_DevSummit2014_MakeNetCDFTable:out_table")
        for(var index=0; index < results.length; index++)
        {
            var plotPoint = [];
            var timeString  = results[index].getElementsByTagName("OGC_DevSummit2014_MakeNetCDFTable:time")[0].childNodes[0].nodeValue;
            var dateTimeNum = Date.parse(timeString);
		    var dateTime = new Date(dateTimeNum);
            plotPoint.time = dateTime;
            plotPoint.value = results[index].getElementsByTagName("OGC_DevSummit2014_MakeNetCDFTable:SoilMoist1_GDS0_DBLY")[0].childNodes[0].nodeValue;
            chartPoints[index] = plotPoint;
        }        
    }
    
    createChart(chartPoints);
}

/**
 * Uses D3 to chart the results
 */
function createChart(features){
    var timeField = 'time';
    var valueField = 'value';
    
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	var svg = d3.select("#chart").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    

    //Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(6);
	
	var line = d3.svg.line()
	.x(function(d) { return x(d[timeField]);	})
	.y(function(d) { return y(d[valueField]);});
	
		
	x.domain(d3.extent(features, function(d) {
		return d[timeField];
	}));
	
	y.domain(d3.extent(features, function(d) {
		return d[valueField];
	})); 

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

	svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "-40").style("text-anchor", "end").text(valueField);


	//Adding the line on the graph
	svg.append("path")
	.datum(features)
	.attr("class", "tsChartLine")
	.attr("d", line);

	//Adding the data points on the graph
	svg.selectAll(".tsChartDot")
	.data(features)
	.enter().append("circle")
	.attr("class", "tsChartDot")
	.attr("r", 3.5)
	.attr("cx", function(d) { return x(d[timeField]); })
	.attr("cy", function(d) { return y(d[valueField]); })
    .append("svg:title").text(function(d) { return valueField + ": " + d[valueField] + "\n" + timeField + ": " + (new Date(d[timeField])).toDateString(); }); 
}