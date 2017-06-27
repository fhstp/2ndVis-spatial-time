		//******************************//
		//*** TIMELINE ***//
		//******************************//
		function initTimelineBackgroundGraph() {				
			var colorrange = [colors.is, colors.geg, colors.civ, colors.unk];
			var width = document.body.clientWidth;
			var height = document.body.clientHeight*0.2;
			var height_2 = document.body.clientHeight*0.1-18; //-18 because of top sum bar chart title
			x_1 = d3.time.scale()
				.range([0, width]);
			x_2 = d3.time.scale()
				.range([0, width]);
			var y_1 = d3.scale.linear()
				.range([height, 0]);
			var y_2 = d3.scale.linear()
				.range([height_2, 0]);	
			xAxis_2 = d3.svg.axis()
				.scale(x_2)
				.orient("top")
				.ticks(d3.time.years);
			brush = d3.svg.brush()
				.x(x_2)
				.on("brush", brushed)
				.on("brushstart", brushstarted);		 
			var svg = d3.select(".d3_chart").append("svg")
				.attr("width", width)
				.attr("height", height+height_2+margin+1)
			focus = svg.append("g")
				.attr("class", "focus");
			context = svg.append("g")
				.attr("class", "context")
				.attr("transform", "translate(0," + (height+margin) + ")");
				
			d3.json("./api/timeline", function(error, data) {
				if(error) return console.log("error in d3.json:"+error);
				//console.log("DA: json for d3 graph contains "+data.length+" objects");
				data.forEach(function(d) {
				  d.date = format.parse(d.date);
				});
				
				var range = initRangeDateString.split("_");
				var extent0 = format.parse(range[0]);
				var extent1 = format.parse(range[1]);	
				lastExtent = [extent0, extent1];
						
				var stack = d3.layout.stack()
					.offset("silhouette")
					.values(function(d) { return d.values; })
					.x(function(d) { return d.date; })
					.y(function(d) { return d.value; });
				var nest = d3.nest()
					.key(function(d) { return d.key; });
				var layers = stack(nest.entries(data));
				//console.log(layers);
				
				x_1.domain(lastExtent);
				y_1.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);
				x_2.domain(d3.extent(data, function(d) { return d.date; }));
				y_2.domain(y_1.domain());
				
				var y0Final;
				var y1Final;
				
				area = d3.svg.area()
					.interpolate("cardinal")
					.x(function(d) { return x_1(d.date); })
					.y0(function(d) { return y_1(d.y0); })
					.y1(function(d) { return y_1(d.y0 + d.y); });
				var area_2 = d3.svg.area()
					.interpolate("cardinal")
					.x(function(d) { return x_2(d.date); })
					.y0(function(d) { return y_2(d.y0); })
					.y1(function(d) { return y_2(d.y0 + d.y); });
				
				focus.selectAll(".layer")
					.data(layers)
				  .enter().append("path")
					.attr("class", "layer")
					.attr("d", function(d) { return area(d.values); })
					.style("fill", function(d, i) { return colorrange[i]; })
					.on("brush", brushed);
					
				context.selectAll(".layer")
					.data(layers)
				  .enter().append("path")
					.attr("class", "layer")
					.attr("d", function(d) { return area_2(d.values); })
					.style("fill", function(d, i) { return colorrange[i]; });	
							
				context.append("g")
					  .attr("class", "x brush")
					  .call( brush.extent(lastExtent) )
					.selectAll("rect")
					  .attr("y", 0)
					  .attr("height", height_2);				    
				
				context.append("g")
					.attr("transform", "translate(0," + 5 + ")")
					.attr("class", "x_2 axis")
					.call(xAxis_2);
					
				focus.append("rect")
				  .attr("class", "focusRect")
				  .attr("x", "1")
				  .attr("y", "1")
				  .attr("height", height-1)
				  .attr("width", width-2);
				  
	//			focus.append("text")
	//				.attr("class", "focusText")
	//				.attr("id", "focusTextLeft")
	//				.attr("x", 10)
	//				.attr("y", 20)
	//				.attr("text-anchor", "start")
	//				.text(dateString(fromDateString, false));
	//				
	//			focus.append("text")
	//				.attr("class", "focusText")
	//				.attr("id", "focusTextRight")
	//				.attr("x", width-10)
	//				.attr("y", 20)
	//				.attr("text-anchor", "end")
	//				.text(dateString(toDateString, false));
	
				focus.append("text")
					.attr("class", "focusText")
					.attr("id", "focusTextLeft")
					.attr("x", 10)
					.attr("y", (height-10))
					.attr("text-anchor", "start")
					.text(dateString(fromDateString, true)+" - "+dateString(toDateString, true));
					
				//Legende (library d3.legend)			          
				var ordinal = d3.scale.ordinal()
				  .domain(["IS", "Gegner", "Zivilisten", "Unbekannt"])
				  .range(colorrange);
				focus.append("g")
				  .attr("class", "legendOrdinal")
				  //.attr("transform", "translate(20," + (height-25) + ")")
				  .attr("transform", "translate(20," + 10 + ")")
				  .style("font-size", "10px");
				var legendOrdinal = d3.legend.color()
				  .shape('rect')
				  .shapePadding(40)
				  .shapeWidth(7)
				  .shapeHeight(7)
				  .labelOffset(2)
				  .orient('horizontal')
				  .scale(ordinal);
				focus.select(".legendOrdinal")
				  .call(legendOrdinal);
			});
		}
		function brushstarted() {
			  //brush gets empty in brushed() -> save last extent
			  fromDate = brush.extent()[0];
			  toDate = brush.extent()[1];
		}
		function brushed() {
			
			  //prevent user to redraw brush
			  if(brush.empty()) { 
				  //set width of redrawed brush
	//			  var from = brush.extent()[0];
	//			  var to = brush.extent()[1];
	//			  if(from.getTime() === to.getTime()) {
	//				  console.log("fromDate == toDate");
	//				  from.setDate(from.getDate() - sollBrushAbstand/2);
	//				  to.setDate(to.getDate() + sollBrushAbstand/2);
	//				  context.select(".x.brush").call( brush.extent([from, to]) );
	//			  }
				  //do not set width of redrawed brush -> call last extent
				  context.select(".x.brush").call( brush.extent([fromDate, toDate]) );
				  return;
			  }
			  console.log(Math.round((brush.extent()[1]-brush.extent()[0])/(1000*60*60*24))+" (Soll:"+sollBrushAbstand+")");
			  if( Math.round((brush.extent()[1]-brush.extent()[0])/(1000*60*60*24)) != sollBrushAbstand ) {
				  context.select(".x.brush").call( brush.extent([fromDate, toDate]) );
				  return;
			  }
			  
			  //reload focus graph
			  if(lastInfoWindow) lastInfoWindow.close();
			  x_1.domain(brush.extent());
			  focus.selectAll(".layer").attr("d", function(d) { return area(d.values); });
			  //reload data for map
			  fromDateString = brush.extent()[0].toISOString().substring(0, 10);
			  toDateString = brush.extent()[1].toISOString().substring(0, 10);
			  initMapData(fromDateString+"_"+toDateString);
			  //update focus labels text
			  //focus.select("#focusTextLeft").text(dateString(fromDateString, false));
	//		  focus.select("#focusTextRight").text(dateString(toDateString, false));
			  focus.select("#focusTextLeft").text(dateString(fromDateString, true)+" - "+dateString(toDateString, true));
			  //update sum bar chart
			  drawSumBarChart();
		}
		
		
		//drawMarkers()
		for (var idx in eventsByLoc) {
			var div = document.createElement('DIV');
			var sum = parseInt(eventsByLoc[idx].best_est);
			var colorString = null;
			if(sum == parseInt(eventsByLoc[idx].deaths_is)) colorString = colors.is;
			else if(sum == parseInt(eventsByLoc[idx].deaths_geg)) colorString = colors.geg;
			else if(sum == parseInt(eventsByLoc[idx].deaths_civ)) colorString = colors.civ;
			else if(sum == parseInt(eventsByLoc[idx].deaths_unk)) colorString = colors.unk;
			if(colorString) div.innerHTML = '<div class="marker" style="background-color:'+colorString+'">'+parseInt(eventsByLoc[idx].best_est)+'</div>';
			else div.innerHTML = '<div class="marker">'+parseInt(eventsByLoc[idx].best_est)+'</div>';
	
			var position = new google.maps.LatLng(parseFloat(eventsByLoc[idx].latitude), parseFloat(eventsByLoc[idx].longitude));
			marker = new RichMarker({
			  position: position,
			  draggable: false,
			  flat: true,
			  anchor: RichMarkerPosition.MIDDLE,
			  content: div
			});
			addListener(idx, marker);
			markers.push(marker);	
		}
		
		//POP UP IN MAP (BAR CHART)
		function addListener(idx, object) {
			object.addListener('click', function() {
					if(lastInfoWindow) lastInfoWindow.close();
					var infoWindow = new google.maps.InfoWindow({
						content: "Lade Daten..."
					});
					infoWindow.setPosition(object.getPosition());
					infoWindow.open(map);
					lastInfoWindow = infoWindow;
					drawChart(idx, object);
			});	
		}
		function drawChart(idx, object) {
			var divTitle = document.createElement('div');
			divTitle.innerHTML = "<span style='font-size:12px'><strong>Tote in "+eventsByLoc[idx].where_coordinates+"<br/>"+dateString(fromDateString, false)+" - "+dateString(toDateString, false)+"</strong></span>";
			var dataTable = google.visualization.arrayToDataTable([
				 ['Type', 'Count', { role: 'style' }, { role: 'annotation' }],
				 ['IS', parseInt(eventsByLoc[idx].deaths_is), colors.is, parseInt(eventsByLoc[idx].deaths_is)],
				 ['Gegner', parseInt(eventsByLoc[idx].deaths_geg), colors.geg, parseInt(eventsByLoc[idx].deaths_geg)],                   
				 ['Zivilisten', parseInt(eventsByLoc[idx].deaths_civ), colors.civ, parseInt(eventsByLoc[idx].deaths_civ)],
				 ['Unbekannt', parseInt(eventsByLoc[idx].deaths_unk), colors.unk, parseInt(eventsByLoc[idx].deaths_unk)], 
			]);
			var options = {'title': "",
						   'width':250,
						   'height':130, 
						   'legend': { position: "none" }};
			var divChart = document.createElement('div');
			//If you want to have vertical bars, you need to change your chart type from BarChart to ColumnChart
			var chart = new google.visualization.ColumnChart(divChart);
			chart.draw(dataTable, options);
			
			var node = document.createElement('div');
			node.appendChild(divTitle);
			node.appendChild(divChart);
			
			var infoWindow = new google.maps.InfoWindow();
			infoWindow.setContent(node);
			infoWindow.setPosition(object.getPosition());
			if(lastInfoWindow) lastInfoWindow.close();
			lastInfoWindow = infoWindow;
			infoWindow.open(map);
		}
		
		//calculate number on cluster -> sum of deaths of all markers inside
		markerClusterer.setCalculator(function(markers, numStyles) {
		  var index = 0;
		  var count = markers.length;
		  var dv = count;
		  while (dv !== 0) {
			dv = parseInt(dv / 10, 10);
			index++;
		  }
		  var sum_best_est = 0;
		  for(idx in markers) {
			sum_best_est += parseInt(markers[idx].content.innerText);  
		  }
		  index = Math.min(index, numStyles);
		  return {
			text: sum_best_est,
			index: index
		  };
		});

	//d3 locale de never used
			//var localeFormatter = d3.locale({
//		  "decimal": ",",
//		  "thousands": ".",
//		  "grouping": [3],
//		  "currency": ["$", ""],
//		  "dateTime": "%a %e %b %X %Y",
//		  "date": "%m/%d/%Y",
//		  "time": "%H:%M:%S",
//		  "periods": ["", ""],
//		  "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
//		  "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
//		  "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
//		  "shortMonths": ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
//		});
//		var tickFormat = localeFormatter.timeFormat.multi([
//			["%H:%M", function(d) { return d.getMinutes(); }],
//			["%H:%M", function(d) { return d.getHours(); }],
//			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
//			["%b %d", function(d) { return d.getDate() != 1; }],
//			["%B", function(d) { return d.getMonth(); }],
//			["%Y", function() { return true; }]
//		]);
	
	//add top right control to google map
	function initTopRightControl() {
		var topRightControlDiv = document.createElement('div');
		var topRightControl = new TopRightControl(topRightControlDiv);
		topRightControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(topRightControlDiv);
	}
	function TopRightControl(controlDiv) {
			// Set CSS for the control border
			var infoScreenUI = document.createElement('div');
			infoScreenUI.id = 'infoScreenUI';
			controlDiv.appendChild(infoScreenUI);
			// Set CSS for the control interior
			var infoScreenUIText = document.createElement('div');
			infoScreenUIText.id = 'infoScreenUIText';
			
			drawChartInControl(infoScreenUIText);
			infoScreenUI.appendChild(infoScreenUIText);
	}
	function drawChartInControl(node) {
			var sumMilitary = 0;
			var sumCivilists = 0;
			var sumUnknown = 0;
			
			//OWN REST API FOR "2004-2011" events
			for (var idx in eventsData) {
				sumMilitary += parseInt((eventsData[idx].deaths_a) + parseInt(eventsData[idx].deaths_b));
				sumCivilists += parseInt(eventsData[idx].deaths_civilians);
				sumUnknown += parseInt(eventsData[idx].deaths_unknown);
			}
			
		  var dataTable = google.visualization.arrayToDataTable([
			   ['Type', 'Count', { role: 'style' }],
			   ['Militär', sumMilitary, colors.mil],         
			   ['Zivilisten', sumCivilists, colors.civ],
			   ['Unbekannt', sumUnknown, colors.unk],
		  ]);	
		  var options = {'title':'Gesamt',
						 'width':350,
						 'height':200,
						 'legend': { position: "none" }};
		
		  var chart = new google.visualization.BarChart(node);
		  chart.draw(dataTable, options);
	}

	//Add Circles to Map
	function drawCircles() {
		console.log("DA: drawCircles()");
		for (var i = 0; i < circles.length; i++) {
			circles[i].setMap(null);
		}
		circles = [];
		for (var idx in eventsByLoc) {
			var circle = new google.maps.Circle({
			  strokeColor: accentColor,
			  strokeOpacity: 0.35,
			  strokeWeight: 2,
			  fillColor: accentColor,
			  fillOpacity: 0.35,
			  map: map,
			  center: { lat: parseFloat(eventsByLoc[idx].latitude), lng: parseFloat(eventsByLoc[idx].longitude) },
			  radius: 10000//parseInt(eventsByLoc[idx].best_est)*50
			});
			addListener(idx, circle);
			circles.push(circle);
		}		
	}		

	//Add Circles animated to Map
	function drawCircles() {
		console.log("DA: drawCircles()");
		for (var i = 0; i < circles.length; i++) {
			circles[i].setMap(null);
		}
		circles = [];
		
		for (var idx in eventsByLoc) {
			addCircleWithTimeout(idx, idx * 50);
		}		
	}
	function addCircleWithTimeout(idx, timeout) {
		window.setTimeout(function() {
				var circle = new google.maps.Circle({
				  strokeColor: accentColor,
				  strokeOpacity: 0.35,
				  strokeWeight: 2,
				  fillColor: accentColor,
				  fillOpacity: 0.35,
				  map: map,
				  center: { lat: parseFloat(eventsByLoc[idx].latitude), lng: parseFloat(eventsByLoc[idx].longitude) },
				  radius: 20000//parseInt(eventsByLoc[idx].best_est)*50
				});
				addListener(idx, circle);
				circles.push(circle);
			}, timeout);
	}		
	
	//Swipe Focus Div
				/*var abstand = width/nextX2Idx;
			console.log(abstand);
				  
			var myElement = document.getElementsByClassName('d3_chart');
			var hammertime = new Hammer(myElement[0], {threshold: 1});
			hammertime.on('pan', function(ev) {
				
				//console.log(ev.type + "\n" 		//Name of the event. Like panstart.
//				+deltaX+ 						//Movement of the X axis.
//				+deltaY 						//Movement of the Y axis.
//				+deltaTime 					//Total time in ms since the first input.
//				+distance 					//Distance moved.
//				+angle 						//Angle moved.
//				+velocityX 					//Velocity on the X axis, in px/ms.
//				+velocityY 					//Velocity on the Y axis, in px/ms
//				+velocity 					//Highest velocityX/Y value.
//				+direction 					//Direction moved. Matches the DIRECTION constants.
//				+offsetDirection 			//Direction moved from it’s starting point. Matches the DIRECTION constants.
//				+scale 						//Scaling that has been done when multi-touch. 1 on a single touch.
//				+rotation 					//Rotation (in deg) that has been done when multi-touch. 0 on a single touch.
//				+center 						//Center position for multi-touch, or just the single pointer.
//				+srcEvent 					//Source event object, type TouchEvent, MouseEvent or PointerEvent.
//				+target 						//Target that received the event.
//				+pointerType 				//Primary pointer type, could be touch, mouse, pen or kinect.
//				+eventType 					//Event type, matches the INPUT constants.
//				+isFirst 					//true when the first input.
//				+isFinal 					//true when the final (last) input.
//				+pointers 					//Array with all pointers, including the ended pointers (touchend, mouseup).
//				+changedPointers 			//Array with all new/moved/lost pointers.
//				+preventDefault); 				//Reference to the srcEvent.preventDefault() method. Only for experts!
				
				console.log(ev);
				//console.log(x_1.domain());
				//console.log(data);
				indexSteps = Math.ceil(ev.distance/abstand);
				console.log("indexSteps: "+indexSteps);
				if(ev.additionalEvent == "panleft") {
					//var oldX1 = x_1.domain()[0];
//					var oldX2 = x_1.domain()[1];
//					var nextX1Idx;
//					var nextX2Idx;
//					data.forEach(function(d, i) {
//						  if(d.date.getTime() === oldX1.getTime()) {
//							  nextX1Idx = i;
//							  nextX1Idx+=1;
//							  console.log(nextX1Idx);
//						  }
//						  if(d.date.getTime() === oldX2.getTime()) {
//							  nextX2Idx = i;
//							  nextX2Idx+=1;
//								console.log(nextX2Idx);
//						  }
//					});	
					nextX1Idx += indexSteps;
					nextX2Idx += indexSteps;	
					x_1.domain([data[nextX1Idx].date, data[nextX2Idx].date]);
					focus.selectAll(".layer").transition().attr("d", function(d) { return area(d.values); });
					focus.select(".x.axis").transition().call(xAxis);
				}
				else if(ev.additionalEvent == "panright") {
					nextX1Idx -= indexSteps;
					nextX2Idx -= indexSteps;	
					x_1.domain([data[nextX1Idx].date, data[nextX2Idx].date]);
					focus.selectAll(".layer").transition().attr("d", function(d) { return area(d.values); });
					focus.select(".x.axis").transition().call(xAxis);
				}
			});*/
	
	//Add Arrow Lines to Google Map
	function drawPolylines() {
		console.log("DA: drawPolylines()");
		// Define a symbol using a predefined path (an arrow) supplied by the Google Maps JavaScript API
		var lineSymbol = { 
			path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
		 	strokeOpacity: 0.25 };
		// Create the polyline and add the symbol via the 'icons' property.
		var next = 0;
		for (var idx = 0; idx<eventsData.length; idx++) {
			if(idx == eventsData.length-1) return;
			next++;
			var line = new google.maps.Polyline({
			  path: [{ lat: parseFloat(eventsData[idx].latitude), lng: parseFloat(eventsData[idx].longitude) }, { lat: parseFloat(eventsData[next].latitude), lng: parseFloat(eventsData[next].longitude) }],
			  icons: [{
				icon: lineSymbol,
				offset: '100%',
				repeat: '500px'
			  }],
			  strokeOpacity: 0.25,
			  clickable: false,
			  map: map
			});
		}
	}

	//Add Markers animated to Google Map
	function drawMarkers() {
		console.log("DA: drawMarkers()");
		for (var i = 0; i < eventsData.length; i++) {
			addMarkerWithTimeout(i, "Tote gesamt: "+eventsData[i].best_est+" ("+eventsData[i].date_start+")", { lat: parseFloat(eventsData[i].latitude), lng: parseFloat(eventsData[i].longitude) }, i * 3000);
		}
	}
	function addMarkerWithTimeout(idx, contentString, position, timeout) {
		window.setTimeout(function() {
			  var marker = new google.maps.Marker({
					position: position,
					map: map,
					animation: google.maps.Animation.DROP,
					clickable: false
				});
			  var infoWindow = new google.maps.InfoWindow({
				  	content: contentString
				});
				if(lastInfoWindow) lastInfoWindow.close();
				lastInfoWindow = infoWindow;
				infoWindow.open(map, marker);
			  marker.addListener('click', function() {
				  	//if(lastInfoWindow) lastInfoWindow.close();
				  	//drawChart(idx, marker);
  				});
		}, timeout);
	}
	
	//Timeline background: Google AreaGraph
	function initTimeline() {
		console.log("DA: initTimeline()");
		$.ajax({
			  url: "./api/timeline",
			  dataType: "json",
			  success: function(response) {
				  console.log("DA: json for timeline contains "+response.length+" objects");
				  //for(var i in response) {
//						console.log("DA: object"+i+"="+response[i].date_start+"-"+response[i].date_end+"("+response[i].best_est+")");  
//				  }			  
				  initTimelineGraph(response);
			  }
		});
        
	}
	function initTimelineGraph(response) {
		var dataTable = google.visualization.arrayToDataTable(response);

        var options = {
          title: 'Tote in Irak und Syrien 2004-2014',
          hAxis: {},
          vAxis: {minValue: 0},
		  height:100,
		  legend: { position: "none" }
        };

        var chart = new google.visualization.AreaChart(document.getElementById('chart_div'));
        chart.draw(dataTable, options);
	}
	
	//2 d3-ThemeRiver-Charts with brush focus & context
	function initTimelineBackgroundGraph() {
		var colorrange = [colors.mil, colors.civ, colors.unk];
		var format = d3.time.format("%Y-%m-%d");
		var width = document.body.clientWidth;
		var height = document.body.clientHeight*0.25;
		var height_2 = document.body.clientHeight*0.05;
				
		x_1 = d3.time.scale()
    		.range([0, width]);
		x_2 = d3.time.scale()
    		.range([0, width]);
		var y_1 = d3.scale.linear()
    		.range([height, 0]);
		var y_2 = d3.scale.linear()
    		.range([height_2, 0]);	
			
		brush = d3.svg.brush()
    		.x(x_2)
    		.on("brush", brushed);
			
		var stack = d3.layout.stack()
			.offset("silhouette")
			.values(function(d) { return d.values; })
    		.x(function(d) { return d.date; })
    		.y(function(d) { return d.value; });
		var nest = d3.nest()
    		.key(function(d) { return d.key; });
			
		area = d3.svg.area()
			.interpolate("cardinal")
			.x(function(d) { return x_1(d.date); })
    		.y0(function(d) { return y_1(d.y0); })
    		.y1(function(d) { return y_1(d.y0 + d.y); });
		var area_2 = d3.svg.area()
			.interpolate("cardinal")
			.x(function(d) { return x_2(d.date); })
    		.y0(function(d) { return y_2(d.y0); })
    		.y1(function(d) { return y_2(d.y0 + d.y); });
	
		var svg = d3.select(".d3_chart").append("svg")
			.attr("width", width)
			.attr("height", height+height_2)
			
		focus = svg.append("g")
			.attr("class", "focus");

		var context = svg.append("g")
			.attr("class", "context")
			.attr("transform", "translate(0," + height + ")");
				
		var graph = d3.json("./api/timeline", function(error, data) {
			if(error) return console.log("error in d3.json:"+error);
			console.log("DA: json for d3 graph contains "+data.length+" objects");
			
			data.forEach(function(d) {
			  d.date = format.parse(d.date);
			});
		  
			var layers = stack(nest.entries(data));
		  
			x_1.domain(d3.extent(data, function(d) { return d.date; }));
			y_1.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);
			x_2.domain(x_1.domain());
  			y_2.domain(y_1.domain());
		  	
			focus.selectAll(".layer")
				.data(layers)
			  .enter().append("path")
				.attr("class", "layer")
				.attr("d", function(d) { return area(d.values); })
				.style("fill", function(d, i) { return colorrange[i]; });
				
			context.selectAll(".layer")
				.data(layers)
			  .enter().append("path")
				.attr("class", "layer")
				.attr("d", function(d) { return area_2(d.values); })
				.style("fill", function(d, i) { return colorrange[i]; });
				
			context.append("g")
				  .attr("class", "x brush")
				  .call(brush)
				.selectAll("rect")
				  .attr("y", 0)
				  .attr("height", height_2);
		});
	}
	
	function brushed() {
		x_1.domain(brush.empty() ? x_2.domain() : brush.extent());
		focus.selectAll(".layer").attr("d", function(d) { return area(d.values); });
	}
	