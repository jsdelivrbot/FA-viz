var config  = {},
		width   = 0,
		height  = 0,
		margins = {};

config.div_id = "soda_franchise_map",
config.states = ["Arizona", "Idaho", "Nevada", "Utah"],
config.title = "Soda fountain shops open in ";

d3.queue()
	.defer(d3.json, "https://gist.githubusercontent.com/michellechandra/0b2ce4923dc9b5809922/raw/a476b9098ba0244718b496697c5b350460d32f99/us-states.json")
	.defer(d3.csv, "https://cdn.jsdelivr.net/gh/becausealice2/FA-viz/soda/soda_data.csv")
	.awaitAll(render_map);


// Load world map topojson
function render_map(error, result_data){
	if (error) { console.error(error) };

	var topology  = result_data[0],
			locations = result_data[1];

	// Get target element's width and use aspect ratio to set height
	width  = document.getElementById(config.div_id).clientWidth,
	height = width * 0.55,
	// Set margins around rendered map
	margins.top    = 0,
	margins.bottom = 0,
	margins.left   = 0,
	margins.right  = 0;

	var projection = d3.geoAlbersUsa();
	// Geo-paths take a GeoJSON geometry/feature object and generate an SVG path data string or render the path to a Canvas
	var path = d3.geoPath().projection(projection);

	// Filter through all states to isolate selected states
	topology["features"] = topology["features"].filter(function select_states(state_obj){
																									return config.states.filter(function(state_name){
																										return state_name == state_obj["properties"]["name"];
																									}).length !== 0;
																								});

	var min_year = d3.min(locations, function(d) { return d["Opening year"]; }),
			max_year = d3.max(locations, function(d) { return d["Opening year"]; });
	
	// Select target element
  var svg = d3.select("#"+config.div_id)

  var title = svg.insert("h2", ":first-child").text(config.title +"2010");

  // Slider
	svg.append("input")
				.attr("type", "range")
				.attr("min", min_year)
				.attr("max", max_year)
				.attr("step", "1")
				.attr("id", "year")
				.on("input", function input() {
					update();
				});

  // Select target element and attach <svg> and <g> elements
	var svg = d3.select("#"+config.div_id)
		.append("svg")
			// Set SVG element's top left corner and width/height attributes
			.attr("viewBox",margins.top+" "+margins.left+" "+(width-margins.right)+" "+(height-margins.bottom))
			// Supposed to make map responsive. Works sometimes.
			.attr("preserveAspectRatio", "xMidYMid meet")
			// Group together map paths and location markers	
		.append('g')
			.attr('class', config.div_id+"_group");
	
	// Group together country shape paths and enter data
	svg.append("g")
			 .attr("class", config.div_id+"_states")
			 .selectAll("path")
			 .data(topology.features)
			 .enter()
			 // Render and style map
			 .append("path")
				 .attr("d", path)
				 .style("fill", "#FFF")
				 .style("stroke", "#333")
				 .style("stroke-width", "1px");

	// Group together location markers
	var loc = svg.append("g").attr("class", config.div_id+"_locations");

	// Variables for reuse
	var lon = "Longitude",
			lat = "Latitude";

	function update(){

		var slider_year = document.getElementById("year").value;

		var new_loc = locations.filter(function filter_by_year(d){ if (d["Opening year"] <= slider_year) { return true; } });

		// Render and style circle location marker for each observation in reviews dataset
		var markers = loc.selectAll("circle");
		var data = markers.data(new_loc);
		var enter = data.enter(),
				exit = data.exit();
			 

			enter.append("circle")
			 			 .attr("class", config.div_id+"_location_markers")
						 .attr("cx", function(d) { return projection([d[lon], d[lat]])[0]; })
						 .attr("cy", function(d) { return projection([d[lon], d[lat]])[1]; })
						 .attr("r", 3.5)
						 .attr("opacity", (1/3))
						 .style("fill", "steelblue");

		exit.remove();

		title.text(config.title + slider_year)
	}

	update();

}; // Close d3.json("https://d3js.org/us-10m.v1.json", function render_map(topology){