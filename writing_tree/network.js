//some config vars
var resourcePath = '/sites/all/modules/writing_tree/';	//path to the module
var visWidth = 1000;	//width and height of the tree canvas, in px
var visHeight = 700;		
var fitToDiv = true;		//if true it will try to make the svg area the same width as the #chart div
var useColorLinks = true;	//use color coded edges?

var trans=[visWidth /3.2,visHeight/3];
var scale=0.3;
var dataObj;
var tagCount = {};
var tags = {};
var nodeList = {};
var zoom = null;				//the d3.js zoom object
var oldzoom = 0;
var zoomWidgetObj = null;			//the zoom widget draghandeler object
var zoomWidgetObjDoZoom = true;
var vis = null;
var connectionIndex = {};
var tagIndex = {};
var inSituFilter = [];
var inSituFilterTag  = [];
var dynamicFilter = [];
var usingMenuFilter = false;
var renderLive = false;
var nameToId = {}
var inSituTimeOut = null;
var inSituTimeOutIsOn = false;
var tickCount = 0;

//adjust quality
var highQuality = {
	
	opacity : 0.5,
	filterOpacity : 0.1,
	edgeWidth : 5,
	showNameTags : true,
 	tickUpdate : 2, //how many X ticks do we render the newtwork
	
	
}


var lowQuality = {
	
	opacity : 1,
	filterOpacity : 0,
	edgeWidth : 3,
	showNameTags : true,
 	tickUpdate : 2, //how many X ticks do we render the newtwork
	
	
}



var quality = lowQuality;

 
 
 /* define the ORIGINAL (rainbow) colors here
var relation_color = 
			{
				"mentored" 			: "#6a93d4",
				"studied_at" 		: "#8fb52d", 			 				
				"worked_alongside" 	: "#e165b9",
				"worked_at" 		: "#ffcc73",
				"other" 			: "grey"
			};
*/
 
//define the NEW (more tree-like) colors here
var relation_color = 
			{
				"mentored" 		: "#0c3b4b",
				"studied_at" 		: "#4f962c", 			 				
				"worked_alongside" 	: "#b1d02c",
				"worked_at" 		: "#775e53",
				"other" 		: "#cae1a9"
			};
 
//verbiage
var  relation_text =
	{
		"mentored" 			: "Mentored",
		"studied_at" 		: "Studied at", 			 				
		"worked_alongside" 	: "Worked Alongside",
		"worked_at" 		: "Worked at",
		"other" 			: "Other"
	}
 
 
 
//drupal loads jquery, so use it.
jQuery(document).ready(function($) {
  
	
	//jQuery(".title").text("Loading Network...");
 
	//make sure there is a div to do this 
	if(jQuery("#chart").length==0){alert('Error: The #chart div is not set!'); return false;}  
	//if they don't have SVG, tell them there is a problem	
	if(!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect){
		jQuery("#chart").html(
			'Sorry, this visualization uses the <a href="http://en.wikipedia.org/wiki/Scalable_Vector_Graphics">SVG standard</a>, most modern browsers support SVG.<br>If you would like to see this visualization please view this page in another browser such as <a href="https://www.google.com/chrome">Chrome</a>, <a href="http://www.mozilla.org/en-US/firefox/new/">Firefox</a>, <a href="http://www.apple.com/safari/download/">Safari</a>, or <a href="http://windows.microsoft.com/en-US/internet-explorer/downloads/ie">Internet Explorer 9+</a>'		
		);	 
	 	return false;
	}


 
	
	visWidth = jQuery("#chart").width();
			
	//okay build it
	buildNetwork();
	
	
	
	
  
});

function buildInterface(){
	
	
	for (x in dataObj.nodes){
	
		thisNode = dataObj.nodes[x];
	
		for (y in thisNode.tags){
			thisTag = thisNode.tags[y];
			
			//see if we need to add this to lookup
			if (tagCount.hasOwnProperty(thisTag[1])){
				
				tagCount[thisTag[1]] = tagCount[thisTag[1]] +1;
				
			}else{
				
				tagCount[thisTag[1]] = 1;
				
				//add it to the master list, has this catagory?
				if (tags.hasOwnProperty(thisTag[0])){
					
					//does it have this tag in its index?
					if (tags[thisTag[0]].indexOf(thisTag[1]) == -1){
						tags[thisTag[0]].push(thisTag[1]);
					}
					
					
				}else{
				
					tags[thisTag[0]] = [thisTag[1]];
					
				}
				
			}
			
			
		}
		
		
		//add the node name
		if (nodeList.hasOwnProperty(thisNode.type)){
			
			nodeList[thisNode.type].push(thisNode.title);
			
			
			
		}else{
		
			nodeList[thisNode.type] = [thisNode.title];
			
		}
						
		
	
		
		
	}
	
	
	
	var legendBody = jQuery("<div>").attr("id","legendBody");
	
	for (i in relation_color){
		
		var legendBodyItem = 
		
			jQuery("<div>")
				.append(
					jQuery("<span>")
						.addClass("legendColor")
						.css("background-color", relation_color[i])
						
						 
			).append(
				jQuery("<span>")
						.text(i.replace(/_/gi,' ').capitalize())
			)
		legendBody.append(legendBodyItem);
	}
	
	
	
 	
	jQuery("#chart")
	.append(
		jQuery("<div>")
			.attr("id","legend")
			.append(
				jQuery("<div>")
					.attr("id","legendLabel")
					.text("Legend")
					.click(function(){
						
 						if (jQuery(this).parent().height() <= 30){
							
							jQuery("#legend").animate({ width: 300, height: 90},function() {
								
								jQuery("#legendBody").fadeIn();
								
							});
							
						}else{
							
							jQuery("#legend").animate({ width: 60, height: 20 },function() {
								
								jQuery("#legendBody").fadeOut();
								
							});
							
							
						}
						
						
					})					
 			).append(
				legendBody
			)
	
	
	
	).append(
		jQuery("<div>")
			.attr("id","networkControls")
			.append(
				jQuery("<img>")
					.attr("src", resourcePath  +"filter.png")
					.css("cursor","pointer")
					.click(function(){
						
 						if (jQuery(this).parent().height() < 100){
							
							jQuery("#networkControls").animate({ width: 300, height: jQuery("#chart").height() },function() {
								
								jQuery(".networkControlsChildHolder").fadeIn();
								
							});
							
						}else{
							
							jQuery("#networkControls").animate({ width: 60, height: 60 },function() {
								
								jQuery(".networkControlsChildHolder").fadeOut();
								
							});
							
							
						}
						
						
					})
					
			).append(
				jQuery("<span>")
					.text("Filter")
					.attr("id", "filterLabel")
			
			)
 	);
	
	
	//how many node type/tag catagories are there?
	var maxHeightEach = 0
	
	var firstFilter = "";
	for (x in nodeList){maxHeightEach = maxHeightEach + 1; if (firstFilter==""){firstFilter = x}}
	for (x in tags){maxHeightEach = maxHeightEach + 1;}
	
	
	
	//divide that height of the contatiner by the # of filter boxes we need
	maxHeightEach = (jQuery("#chart").height() - (maxHeightEach * 36)) / maxHeightEach;
 	//add in the lists of things
	
	
	//add in the node filter
	for (x in nodeList){

		
		jQuery("#networkControls").append(
			jQuery("<div>")
				.attr("id","nodeListHolder_" + x)
				.addClass("networkControlsChildHolder")
				.css("height",maxHeightEach + "px")
				.css("max-height",maxHeightEach + "px")
				.css("margin-top", function(){ return (x == firstFilter) ? "0px" : "20px"})
				
				
				.append(
					jQuery("<input>")
						.attr("type","text")
						.data("typeId",x)
						.attr("placeholder", "Filter " +  x.replace(/_/gi,' ').capitalize())
						.addClass("nodeListSearch")
						.keyup(function(){
							
							
							
							var val = jQuery(this).val().toLowerCase();
							
							jQuery(".nodeListItem_" + jQuery(this).data("typeId")).each(function(index, value) {
								
								if (jQuery(value).data('nodeTitle').toLowerCase().search(val) != -1){
									jQuery(value).css("display","block");
								}else{
									jQuery(value).css("display","none");
								}
								
								
								
							});
							
							
							
						})
						
					
				)
				.append(
					jQuery("<div>")
						.attr("id","nodeList_" + x)
						.addClass("networkControlsChild")
						.addClass("nodeList")
						.css("height",maxHeightEach - 10 + "px")
						.css("max-height",maxHeightEach - 10 + "px")						
						.append(
							jQuery("<table>")
								.attr("id","nodeListTable_" + x)
						
						)
				)
				
			
		
		);
		
		var nodeListSorted = [];
		
		for (y in nodeList[x]){
			
			var lastName = nodeList[x][y].trim().toLowerCase().split(" ")[nodeList[x][y].split(" ").length-1];
			if (x == 'school_or_institution'){
			var lastName = nodeList[x][y].trim().toLowerCase();
			}
			
			
			var obj = { fullName:  nodeList[x][y], lastName : lastName }
			
			nodeListSorted.push(obj);
			
		}

 		
		nodeListSorted.sort(function(a, b) { 
			 if (a.lastName < b.lastName)
				 return -1;
			 if (a.lastName > b.lastName)
				return 1;
			 return 0;	
		});
 		
		for (y in nodeListSorted){
			
  			
			jQuery("#nodeListTable_" + x).append(
				jQuery("<tr>")
					.data("nodeTitle",nodeListSorted[y].fullName)
					.addClass("nodeListItem_" + x)
					.append(
						jQuery("<td>")
							.text(nodeListSorted[y].fullName)
							.css("width","100%")
					).append(
						jQuery("<td>")
							.append(
								jQuery("<input>")
									.attr("type","checkbox")
									.data("nodeTitle",nodeListSorted[y].fullName)
									.data("nid", nameToId[nodeListSorted[y].fullName])
									
									.click(function(d){
										
 										
										if (jQuery(this).is(':checked'))
										{
											usingMenuFilter = true;
											inSituFilter.push(jQuery(this).data('nid'));
											filterInSitu();
										}else{
											
											inSituFilter.splice( inSituFilter.indexOf(jQuery(this).data('nid')),1);
											filterInSitu();
											
											if (inSituFilter.length == 0 && inSituFilterTag.length == 0){
												usingMenuFilter = false;
											}
										
											
										}
				
										
										
									})
									
								
								
							)
							
					
					)
					
			
			);
			
			
			
		}
		
		
		
	}
	
	
	
	
	//add in the tag filter
	
	for (x in tags){
		 
		 //html safe id name
		 var idName = x.replace(/\s/gi,'_').toLowerCase();
		 
		
		jQuery("#networkControls").append(
			jQuery("<div>")
				.attr("id","tagListHolder_" + idName)
				.addClass("networkControlsChildHolder")
				.css("height",maxHeightEach + "px")
				.css("max-height",maxHeightEach + "px")
				.css("margin-top", function(){ return (x == firstFilter) ? "0px" : "20px"})

				.append(
					jQuery("<input>")
						.attr("type","text")
						.data("typeId",idName)
						.attr("placeholder", "Filter " +  x.replace(/_/gi,' ').capitalize())
						.addClass("nodeListSearch")
						.keyup(function(){
							
							
							
							var val = jQuery(this).val().toLowerCase();
							
							jQuery(".tagListItem_" + jQuery(this).data("typeId")).each(function(index, value) {
								
								
								
								if (jQuery(value).data('tagTitle').toLowerCase().search(val) != -1){
									jQuery(value).css("display","block");
								}else{
									jQuery(value).css("display","none");
								}
								
								
								
							});
							
							
							
						})
						
					
				)
				.append(
					jQuery("<div>")
						.attr("id","tagList_" + idName)
						.addClass("networkControlsChild")
						.addClass("nodeList")
						.css("height",maxHeightEach - 10 + "px")
						.css("max-height",maxHeightEach - 10 + "px")						
						.append(
							jQuery("<table>")
								.attr("id","tagListTable_" + idName)
						
						)
				)
				
			
		
		);		
		
		
		
		var tagListSorted = [];
		
		for (y in tags[x]){
			
			var lastName = tags[x][y].trim().toLowerCase();
						
			
			var obj = { fullName:  tags[x][y], lastName : lastName }
			
			if (lastName.trim() != ''){
			
				tagListSorted.push(obj);
			}
			
		}

 		
		tagListSorted.sort(function(a, b) { 
			 if (a.lastName < b.lastName)
				 return -1;
			 if (a.lastName > b.lastName)
				return 1;
			 return 0;	
		});
 		
		for (y in tagListSorted){
			
   			
			jQuery("#tagListTable_" + idName).append(
				jQuery("<tr>")
					.data("tagTitle",tagListSorted[y].fullName)
					.addClass("tagListItem_" + idName)
					.append(
						jQuery("<td>")
							.text(tagListSorted[y].fullName)
							.css("width","100%")
					).append(
						jQuery("<td>")
							.append(
								jQuery("<input>")
									.attr("type","checkbox")
									.data("tagTitle",tagListSorted[y].fullName)
									//.data("nid", nameToId[tagListSorted[y].fullName])
									
									
									.click(function(d){
										
 										
										if (jQuery(this).is(':checked'))
										{
											usingMenuFilter = true;
											inSituFilterTag.push(jQuery(this).data('tagTitle'));
											filterInSitu();
										}else{
											
											inSituFilterTag.splice( inSituFilterTag.indexOf(jQuery(this).data('tagTitle')),1);
											filterInSitu();
											
											if (inSituFilter.length == 0 && inSituFilterTag.length == 0){
												usingMenuFilter = false;
											}
										
											
										}
				
										
										
									})
									
								
								
							)
							
					
					)
					
			
			);
			
			
			
		}
				
		
	}
	
	
	
	
	
	
	
	 
	
	
	//add the zoom widget
	jQuery("#chart").append(
		jQuery("<div>")
			.attr("id","zoomWidget")
			.addClass("dragdealer")
			.append(
				jQuery("<div>") 
					.addClass("handle")
					.append(
						jQuery("<div>") 
							.text("-")
					)
			)
			.append(
				jQuery("<div>")
					.addClass("zoomWidgetRail")
			)
			.append(
				jQuery("<div>") 
					.addClass("zoomWidgetEndcaps")
					.attr("id","woomWidgetZoomOut")
					.css("top","-17px")
					.css("line-height","30px")
					.append(
						jQuery("<div>") 
							.text("-")
					)
			)						
			.append(
				jQuery("<div>") 
					.addClass("zoomWidgetEndcaps")
					.attr("id","woomWidgetZoomIn")
					.css("top","145px")
					.append(
						jQuery("<div>") 
							.text("+")
					)
			)									
		
	); 	
	
	jQuery("#zoomWidget").mouseenter(function(){ zoomWidgetObjDoZoom=true;});

	
	zoomWidgetObj = new Dragdealer('zoomWidget',
	{
		horizontal: false,
		vertical: true,
		y: 0.25555,
 		animationCallback: function(x, y)
		{
			//if the value is the same as the intial value exit, to prevent a zoom even being called onload
			if (y==0.25555){return false;}
			//prevent too muuch zooooom
			if (y<0.01){return false;}			 // Changed by Ben from y<0.05, to allow us to zoom out and see singlets
			
			
			//are we  zooming based on a call from interaction with the slider, or is this callback being triggerd by the mouse event updating the slider position.
			if (zoomWidgetObjDoZoom == true){

				y =y *4;			
				
				//this is how it works now until i figure out how to handle this better.
				//translate to the middle of the vis and apply the zoom level
				vis.attr("transform", "translate(" + [(visWidth/2)-(visWidth*y/2),(visHeight/2)-(visHeight*y/2)] + ")"  + " scale(" + y+ ")");  	
				//store the new data into the zoom object so it is ready for mouse events
				zoom.translate([(visWidth/2)-(visWidth*y/2),(visHeight/2)-(visHeight*y/2)]).scale(y);
			}
			
		 
			 
		}
	});	 	
	
	
	
}

function buildNetwork(){
	
	
 
	var tooltip = d3.select("body")
			.append("div")
			.attr('class','d3ToolTip');
				 

	zoom = d3.behavior.zoom()
		.translate(trans)
		.scale(scale)
		.scaleExtent([0.25,6])
		.on("zoom", redraw);
		
			
	var force = d3.layout.force()
		.gravity(.05)
		.distance(90)
		.charge(-500)
		.size([visWidth, visHeight]);		

	var nodes = force.nodes(),
		links = force.links();
		
	
	vis = d3.select("#chart").append("svg:svg")
		.attr("id", "zoomCanvas")
		.attr("width", visWidth)
		.attr("height", visHeight)
		.style("fill", "none")
		.call(zoom)
		.style("cursor",  "url(" + resourcePath  +"openhand.png)")
 			.on("mousedown", function(){
			
				//the grabbing css rules do not work with web-kit, so specifiy the cursor hand and use the css for firefox.
				d3.select("#zoomCanvas").style("cursor",  "url(" + resourcePath  +"closedhand.png)");
				d3.select("#zoomCanvas").attr("class","grabbing");
				
			})
			.on("mouseup", function(){
			
				d3.select("#zoomCanvas").style("cursor",  "url(" + resourcePath  +"openhand.png)");
				d3.select("#zoomCanvas").attr("class","");
	});


	vis.append("rect") 
		.attr("width", "100%") 
		.attr("height", "100%") 
		.attr("fill", "white") 
		
		  
	vis = vis.append("g"); 

	//set the inital zoom level and offset 
	//vis.attr('transform','translate(' + (visWidth /3.2) + ',' + (visHeight/3) + ')scale('+zoomFactor+')');

  	vis.attr("transform",
      "translate(" + trans + ")"
      + " scale(" + scale + ")"); 	 

	//what to do on each tick, the e.alpha limitiation could be enabled to prevent the crazyness that is a force graph initating by hiding it until it calms down
	force.on("tick", function(e) {
		
		tickCount = tickCount + 1;
		
		
		
		//if the tickcount == tickupdate render or if its below the alpha value
		
		
		
		
		
		
		
		if (e.alpha<=.05 || quality.tickUpdate == tickCount){
			vis.selectAll("g.node")
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";})
				.attr("visibility",function(d) { if (d.vis){return 'visible'}else{ return 'hidden'}}); 
			
			
		
			vis.selectAll(".link")
			.attr("d", function(d) {
				var dx = d.target.x - d.source.x,
					dy = d.target.y - d.source.y,
					dr = Math.sqrt(dx * dx + dy * dy);
				return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
			});
		
		
			
			
			if (e.alpha<=.05){
				jQuery("#loadingInfo").css("display","none");
 				force.stop();
			}
			
			if (quality.tickUpdate == tickCount){
				tickCount = 0;
			}
						
		}
		
	});	
	
	
	
	
	

	function restart() {
		
		

	
	
	 vis.selectAll(".link")
		.data(links, function(d) { return d.source.id + "-" + d.target.id; })
		.enter().append('path')
 		  .attr("x1", function(d) { return d.source.x; })
		  .attr("y1", function(d) { return d.source.y; })
		  .attr("x2", function(d) { return d.target.x; })
		  .attr("y2", function(d) { return d.target.y; })
		  .attr("class", function(d){
				
				
				
				//we need to find the target and source nid
				var source = "aLink" + d.source.id;
				var target = "aLink" + d.target.id;
			
			  	
				return "link " + source + " " + target;
			  
		  })
		  .style("opacity", quality.opacity)
		  .style("stroke-width",quality.edgeWidth)
	  	  .attr("stroke", function(d){ 		  
		
  			if (useColorLinks){				
				return (typeof relation_color[d.type]!='undefined') ? relation_color[d.type] : "grey";
			}else{
				return "grey";
			}
  
		
		  
	 });
	
   		var node = vis.selectAll(".node")
          .data(nodes)
          .enter().append("g")
		  .style("cursor","pointer")
		  .attr("id",function(d){ return "aNode" + d.id })
			.on("mouseover", function(d){ 
			
				tooltip.style("visibility", "visible");   tooltip.html(d.title)
				
				
				inSituTimeOutIsOn = true;
				clearTimeout(inSituTimeOut);
				inSituTimeOut = setTimeout(function(){
					
					if (inSituTimeOutIsOn){
						
						//do not filter if we are useing the left interface
						if (inSituFilter.length == 0){
							
							//another check
							if (!usingMenuFilter){
								tooltip.style("visibility", "hidden");
								inSituFilter.push(d.id);
								filterInSitu();
								toggleLabels(true);
							}
						}
						
											
						
					}
				},2000);
				
				
			})
			.on("mousemove", function(d){
				
				return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");

			})
			.on("mouseout", function(d){
				
				
				clearTimeout(inSituTimeOut);
				inSituTimeOutIsOn = false;
				tooltip.style("visibility", "hidden");
				
				//if thie one is in the filter then clear the filter
				if (!usingMenuFilter){
					
					if (inSituFilter.indexOf(d.id) != -1){
						inSituFilter.splice(inSituFilter.indexOf(d.id),1);
					}
					
					if (inSituFilter.length == 0){
						filterInSitu();
						toggleLabels(false);
					}
				}
				
				
			})	
			.on("dblclick",function(d){ window.open("node/" + d.id)  })		// Ben removed the leading slash
          .attr("class", "node")		

		
		
		node.append("rect")
			.style("fill","#fff")
			.attr("x", function(d) { return returnNodeSize(d) / 2 * -1 })
			.attr("y", function(d) { return returnNodeSize(d) / 2 * -1 })
			.attr("width", function(d) { 
				
				
				if (d.type!='person'){
					return returnNodeSize(d);
				}
				
				return 0;
			
			})
			.attr("height", function(d) { 
				
				
				if (d.type!='person'){
					return returnNodeSize(d);
				}
				
				return 0;
			
			});  
		
		node
		.append("svg:path")
			.attr("id",  function(d) { return "aNodePath" + d.id})
			.attr("class",  function(d) { return "aNodePath_" + d.type})
			.attr("transform", function(d) {
					 
					 	 
						
						if (d.type=='person'){
							nodeSize = returnNodeSize(d) / 50; 
							return "translate(" + ((nodeSize * 25) *-1) + "," + ((nodeSize * 45) * -1) + ")scale(" + nodeSize + ")";
						}else{
							nodeSize = returnNodeSize(d) / 450; 
							return "translate(" + ((nodeSize * 170) *-1) + "," + ((nodeSize * 100) * -1) + ")scale(" + nodeSize + ")";				
						}
				})	
			.style("fill",function(d){
				
				if (d.type=='person'){
					return "#333";
				}else{
					return "#ccc";
				}
			})
			.style("stroke",function(d){
				
				if (d.type=='person'){
					return "none";
				}else{
					return "#000";
				}
			})
			.style("stroke-width",function(d){
				
				if (d.type=='person'){
					return "none";
				}else{
					return "10";
				}
			})			
			.attr("d",function(d){
				
 				if (d.type=='person'){
					return "M35.492,11.02c0,5.968-4.838,15.184-10.805,15.184c-5.967,0-10.805-9.216-10.805-15.184 c0-5.967,4.838-10.805,10.805-10.805C30.654,0.215,35.492,5.053,35.492,11.02z M41.988,25.065c0,0-4.775-1.118-10.559-1.73c-1.883,2.288-4.217,3.863-6.743,3.863 c-2.526,0-4.859-1.575-6.745-3.863c-5.781,0.612-10.557,1.73-10.557,1.73c-2.34,0-4.237,1.897-4.237,4.237v16.46 c0,2.34,1.897,4.237,4.237,4.237h34.603c2.338,0,4.237-1.896,4.237-4.237v-16.46C46.226,26.963,44.328,25.065,41.988,25.065z";
				}else{
					return "M487.16-91.94c-218.773,0-437.547,0-656.32,0 c-0.072-0.262-0.145-0.524-0.217-0.786c9.693-3.997,19.371-8.032,29.083-11.983c98.122-39.917,196.255-79.807,294.35-119.79 c3.481-1.419,6.36-1.461,9.911-0.011c105.886,43.227,211.821,86.331,317.747,129.458c1.897,0.772,3.773,1.597,5.66,2.397 C487.303-92.417,487.231-92.179,487.16-91.94z M482.015,408.45c0,13.799,0,27.519,0,41.565c-215.269,0-430.301,0-645.732,0 c0-13.688,0-27.422,0-41.565C51.385,408.45,266.537,408.45,482.015,408.45z M444.724,338.312c0,14.08,0,27.544,0,41.519c-190.414,0-380.69,0-571.595,0 c0-7.012,0-13.957,0-20.902c0-6.782,0-13.564,0-20.616C63.898,338.312,254.068,338.312,444.724,338.312z M-170.819-27.363c0-11.54,0-22.67,0-34.153c219.838,0,439.514,0,659.495,0 c0,11.329,0,22.574,0,34.153C268.979-27.363,49.298-27.363-170.819-27.363z M-11.377,300.978c-26.144,0-52.017,0-78.494,0c0-2.031,0-3.812,0-5.592 c0-92.126,0.04-184.252-0.109-276.379c-0.008-4.928,1.491-6.034,6.178-5.984c22.488,0.237,44.98,0.209,67.469,0.015 c4.187-0.036,5.293,1.212,5.288,5.336c-0.109,92.626-0.083,185.252-0.094,277.878C-11.139,297.715-11.282,299.179-11.377,300.978z M50.284,300.921c0-96.038,0-191.59,0-287.467c25.821,0,51.391,0,77.33,0 c0,95.685,0,191.365,0,287.467C102.002,300.921,76.32,300.921,50.284,300.921z M190.35,13.265c25.749,0,51.344,0,77.279,0c0,95.767,0,191.473,0,287.442 c-25.768,0-51.357,0-77.279,0C190.35,204.932,190.35,109.222,190.35,13.265z M329.979,13.456c1.584-0.124,2.872-0.312,4.16-0.313 c22.99-0.018,45.98,0.062,68.97-0.09c3.686-0.023,4.841,0.98,4.837,4.763c-0.097,93.126-0.075,186.253-0.083,279.379 c0,1.137-0.104,2.273-0.178,3.761c-25.996,0-51.694,0-77.706,0C329.979,205.08,329.979,109.399,329.979,13.456z";
				}
				
				});
	
		node.append("rect")
		  .attr("x", function(d) { return -1 * (d.title.length*3.35); })
		  .attr("y", function(d) { return 4; })
		  .attr("height", function(d) { return 12; })
		  .attr("width", function(d) { return (d.title.length*3.35)*2; })
		  .attr("class", "label")
		  .style("visibility", "hidden")
		  .style("fill","#fff")
		  .style("stroke","#C63F3F");
		  
		node.append("text")
			  .attr("x", function(d) { return 0; })
			  .attr("y", function(d) { return 15; })
			  .attr("class", "label")
			  .style("fill","#000")
			  .style("visibility", "hidden")
				
			  .attr("text-anchor", function(d) { return "middle";})
			
			  .text(function(d) { return d.title; });					  
		
		
		
		if (quality.showNameTags){
						

			node.append("svg:text")
				.style("fill","#fff")
				.text(function(d){ 
				
					if (d.type == "person"){
						return d.title.split(" ")[d.title.split(" ").length-1]
					}
					
				 })
				.attr("text-anchor", "middle")
				.attr("display", function(d) { 
					if (d.type == "person"){
						return "block";	
					}else{
						return "none";
					}
				})
				.attr("font-size", function(d) { 
				
						if (d.type == "person"){
					
							var len = d.title.split(" ")[d.title.split(" ").length-1].length
					
							if (len < 5){
								return returnNodeSize(d) / 5
							}else if (len < 8){
								return returnNodeSize(d) / 6
							}else if (len < 10){
								return returnNodeSize(d) / 7
							}else if (len < 12){
								return returnNodeSize(d) / 8
							}else{
								return 	returnNodeSize(d) / 10
							}
							
						}
						
				}); 
		}
		  
 	 
	
	
	  force.start();
	}	
	
	
	//figure out how large to make a node
	function returnNodeSize(d){
		
		var size = 0;
		
		//do things diffrently based on the node 
		if (d.type == 'person'){
			
			//factor for this type of node
			size = d.size * 8;		
			
			//max and min sizes so things don't get too crazy
			if (size > 60){size = 60}		// Ben raised this from 30 to match school sizes
			if (size < 15){size = 15}						
			
			
			
		}else{
			
			//factor for this type of node
			size = d.size * 4;		
			
			//max and min sizes so things don't get too crazy
			if (size > 60){size = 60}
			if (size < 15){size = 15}						
					
			
		}
		
		
		return size;
		
		
	}
	
	
	

	function filter(){
		
		
		nodes=[];
		links=[];
		force.nodes([]);
		force.links([]);
		restart();
		
		
		nodes = force.nodes();
		links = force.links();	
		
		
		//add the nodes
		for (aNode in dataObj.nodes){	
		
		
 			nodes.push({ id: dataObj.nodes[aNode].nid, title: dataObj.nodes[aNode].title, type:dataObj.nodes[aNode].type, size:1, vis : true})
			
			
			connectionIndex[dataObj.nodes[aNode].nid] = [];
			nameToId[dataObj.nodes[aNode].title] = dataObj.nodes[aNode].nid;
			
			//loop through the tags attached to this person and add it to the tag index to faclitate filtering
			for (x in dataObj.nodes[aNode].tags){
				
				var aTag = dataObj.nodes[aNode].tags[x][1];
				
				
				
				if (tagIndex.hasOwnProperty(aTag)){
					tagIndex[aTag].push(dataObj.nodes[aNode].nid);
				}else{
					tagIndex[aTag] = [dataObj.nodes[aNode].nid];
				}
					
				
			}
			
			 
			
		}

		//now the edges
		for (aEdge in dataObj.edges){			
		
			
			
			// The system just dumps the database into a json file which is processed by javascript, and the relationship module does not do any sort of house cleaning when a node is removed from the system. The result is orphaned relationships with no valid end point. To remove these problem edges, we'll do a test in the filter() function, and for now set both vars target and source to a placeholder non-value. We'll check at the end if we found both node ids. Here we go: Find our source and target nodes, size++ the target
			var target = -1, source = -1;
			
			//target
			for (aNode in nodes){
				if (nodes[aNode].id == parseInt(dataObj.edges[aEdge].target)){
					nodes[aNode].size = nodes[aNode].size + 1;
					target = aNode;			
				}
			}
			
			//source
			for (aNode in nodes){
				if (nodes[aNode].id == parseInt(dataObj.edges[aEdge].source)){
					source = aNode;			
				}
			}		
			
			if (target != -1 && source != -1){	
			
				links.push({source: nodes[source], target: nodes[target], type: dataObj.edges[aEdge].type, vis : true});					
				
				connectionIndex[nodes[source].id].push(nodes[target].id);
				connectionIndex[nodes[target].id].push(nodes[source].id);
			}
			
	
			
		
		}


		
		restart();

		
	}	


	//request the json
	d3.json("network/json", function(json) {		// Ben removed the leading slash
		
		
			
		
			jQuery("#loadingInfo h1").text("Rendering Network");
		
			jQuery(".title").text("");
			jQuery("#info").text("Data Generated: " + json.date);
			
			
			
			
			dataObj=json;
			
			
			filter();
			buildInterface();

		
	});


	
}

function filterInSitu(){
	
	
	if(inSituFilter.length == 0 && inSituFilterTag.length == 0){
		d3.selectAll(".link").style("opacity", quality.opacity);	
		d3.selectAll(".node").style("opacity", 1);	

		d3.selectAll(".aNodePath_person").style("stroke","none").style("stroke-width","0");	
		d3.selectAll(".aNodePath_school_or_institution").style("stroke","#000").style("stroke-width","10");		
		
		usingMenuFilter = false;	
		return false;	
	}
	
	
	d3.selectAll(".link").style("opacity", quality.filterOpacity);			
	d3.selectAll(".node").style("opacity", quality.filterOpacity);	
	
	d3.selectAll(".aNodePath_person").style("stroke","none").style("stroke-width","0");	
	d3.selectAll(".aNodePath_school_or_institution").style("stroke","#000").style("stroke-width","10");	
 	
	for (x in inSituFilter){
 		d3.selectAll("#aNode" + inSituFilter[x]).style("opacity", 1);	
		d3.selectAll(".aLink" + inSituFilter[x]).style("opacity", 1);	
 
  		d3.selectAll("#aNodePath" + inSituFilter[x]).style("stroke","red").style("stroke-width","8");	

 

		for (y in connectionIndex[inSituFilter[x]]){
		
 			d3.selectAll("#aNode" + connectionIndex[inSituFilter[x]][y]).style("opacity", 1);	
			d3.selectAll(".aLink" + connectionIndex[inSituFilter[x]][y]).style("opacity", 1);	
			
			//and their connected nodes
			for (z in connectionIndex[connectionIndex[inSituFilter[x]][y]]){
				
 				d3.selectAll("#aNode" + connectionIndex[connectionIndex[inSituFilter[x]][y]][z]).style("opacity", 1);	
					
				
			}
 		}


	}
	
	//show the filtered people
	for (x in inSituFilterTag){
		
		//loop through the tag index and turn on thoes nodes
		for (y in tagIndex[inSituFilterTag[x]]){
			
			var nid = tagIndex[inSituFilterTag[x]][y];
			
 			d3.selectAll("#aNode" + nid).style("opacity", 1);	
  			d3.selectAll("#aNodePath" + nid).style("stroke","red").style("stroke-width","8");	
			
		}
	
	
	}
 	
}

function toggleLabels(show){
	if (show){
		d3.selectAll(".label").style("visibility","visible");
	}else{
		d3.selectAll(".label").style("visibility","hidden");
	}
}




function redraw(useScale) {

	//store the last event data
	trans=d3.event.translate;
	scale=d3.event.scale;  


	//transform the vis
   vis.attr("transform",
      "translate(" + trans + ")"
      + " scale(" + scale + ")");   
	
	//we need to update the zoom slider, set the boolean to false so the slider change does not trigger a zoom change in the vis (from the slider callback function)  
	zoomWidgetObjDoZoom = false;	
	zoomWidgetObj.setValue(0,(scale/4)); 
	 
}





String.prototype.capitalize = function(){
       return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
      };








