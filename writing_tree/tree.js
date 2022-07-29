//some config vars
var resourcePath = '/sites/all/modules/writing_tree/';	//path to the module 

var baseurl = '/live'; // workaround for htaccess rewrite weirdness

var treeMode = 'modal';	// default = modal. Other options include...?

var visWidth = 2500;	//width and height of the tree canvas, in px
var visHeight = 2500;		
var baseNodeSize = 50;	//this is the base size of all nodes, it will be scaled based on the returnNodeProperties function
var baseFontSize = 12;	//base font size
	
var shiftDown = shiftDown_start = 400;	//move the whole graph down y; default = 400
var shiftRight = shiftRight_start = 25;	//move the whole graph right x; default = 25
var zoomVal = zoomVal_start = 0.75;		//default = 0.85


var zoomLevel = 1 * zoomVal;
var transLevel = [0,0];
var updateZoom = false;

var peerNodeOffset = 80; // JB - distance between nodes that are stacked together

//define the colors here
var mentor_type_colors = 
			{
				"chair" 		: "#0d56a6",
				"committee" 		: "#00a876", 			 				
				"writing program" 	: "#ff9a00",
				"writing center" 	: "#ff5900",
				"other" 		: "grey",
				"other " 		: "grey"
			};
 
var worked_with_type_colors = 
			{
				"journal coeditors" 	: "#b365d4",
				"collection coeditors" 	: "#65257f",
				"article coauthors" 	: "#4e026e",
				"book coauthors" 	: "#a63cd4",
				"center coadmins" 	: "#ff4e40",
				"project coadmins" 	: "#bf3a30",
				"wac-wid coadmins" 	: "#d2006b",																								
				"collaborators (other)" : "grey"
			}; 
			
//verbiage
var  mentor_type_text =
	{
		"chair" 		: 		"Mentored as a Dissertation Chair",
		"committee" 		:		"Mentored as a member of the Dissertation Comittee",
		"other "		:		"Mentored (other)",	//extra space in the db name?
		"other"			:		"Mentored (other)",		
		"writing center"	:		"Mentored as a Writing Center Admin",
		"writing program"	:		"Mentored as a Writing Program Admin",
		"wac-wid"		:		"Mentored as a WAC/WID Program Admin",
		"writing project"	:		"Mentored as a Writing Project Admin",
		"professor"		:		"Mentored as a professor (graduate)",
		"undergrad professor"	:		"Mentored as a professor (undergraduate)"
	}
 
var  worked_with_type_text =
	{
		"article coauthors" 		: 		"Co-authored Article with",
		"book coauthors	" 		:		"Co-authored Book with",
		"collaborators (other)"		:		"Worked alongside (other)",
		"collection coeditors"		:		"Co-edited Collection with",
		"journal coeditors"		:		"Co-edited Journal with",	
		"project coadmins"		:		"Co-admined Writing Project Site with",
		"center coadmins"		:		"Co-admined Writing Center with",		
		"wac-wid coadmins"		:		"Co-admined WAC/WID Program with"
	} 
 
 
//drupal loads jquery, so use it.
jQuery(document).ready(function($) {
  
	/*
	jQuery(".title").text("Loading Tree...");
	
	//make sure we have the nid passed 
	if (typeof nid == 'undefined'){alert('Error: The nid is not defined!'); return false;}  
	//make sure there is a div to do this thang
	if(jQuery("#chart").length==0){alert('Error: The #chart div is not set!'); return false;}  
	//if they don't have SVG, tell them there is a problem	
	if(!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect){
		jQuery("#chart").html(
			'Sorry, this visualization uses the <a href="http://en.wikipedia.org/wiki/Scalable_Vector_Graphics">SVG standard</a>, most modern browsers support SVG.<br>If you would like to see this visualization please view this page in another browser such as <a href="https://www.google.com/chrome">Chrome</a>, <a href="http://www.mozilla.org/en-US/firefox/new/">Firefox</a>, <a href="http://www.apple.com/safari/download/">Safari</a>, or <a href="http://windows.microsoft.com/en-US/internet-explorer/downloads/ie">Internet Explorer 9+</a>'		
		);	 
	 	return false;
	}
	

 	//okay build it 
	reorderTree(nid);
	*/
	  
	//add the modal  
	if (treeMode == 'modal'){
		
		
		  $("#launchModal").click(function(event){
					  
			   var viewPortHeight = $(window).height();
				   
				   picoModal({
					  content: "",
					  closeButton: true,
					  viewHeight: viewPortHeight - 125,
					  overlayStyles: {
						  backgroundColor: "#333",
						  opacity: 0.75
					  }
					  
			  
					});
					 
					$(".pico-content").first().append(
					
						$("<div>")
							.attr("id","modalTreeHolder")
							.css("height", viewPortHeight - 125 + "px")
							.append(
								$("<div>")
									.attr("id","chart")
							)
					
					
					);	
					
					
					reorderTree(treeNodeId);
					
					event.preventDefault();
					return false;		  
			  
		  })
		
		 
	
		 
		
	}
	if (treeMode == 'embed'){
 		
		$("#" + embedId).append(
			$("<div>")
				.attr("id","chart")
				.addClass("embedTreeHolder")
				
			
		);
	
		reorderTree(treeNodeId);
	
	
	
	}
	
	
  
});


function buildTree(){
	
	
	
	var zoom = d3.behavior.zoom()
			.translate([0,0])
			.scale(1)
			.scaleExtent([0.25,6])
			.on("zoom", redraw);
	

	
	// JB - this was included in Matt's version.  It overrides D3's handling of the scroll
	// wheel, but it doesn't frame the display properly or handle non-mouse input devices.
	// I improved it a bit, but the default D3 behavior seems to be better.
	/*jQuery('#chart').bind('mousewheel DOMMouseScroll', function(event) {
	  event.preventDefault();
	  var delta = event.wheelDelta || -event.detail;
	  
	  // JB - save the position (in tree space) so that we can center the zoom properly.
	  var x = (event.offsetX - transLevel[0]) / zoomLevel;
	  var y = (event.offsetY - transLevel[1]) / zoomLevel;
	  
	  // JB - change in zoom should be proportionate to the delta.
	  zoomLevel = zoomLevel - 0.008 * delta;
	  
	  // JB - this should be done after the change so that we don't overshoot.  We also
	  // shouldn't return false here because the zoom still might have changed somewhat.
	  if (zoomLevel > 2){zoomLevel = 2;}
	  if (zoomLevel < .31){zoomLevel = .31;}
	  
	  // JB - need to make sure the spot under the cursor remains in place.
	  event.translate = [event.offsetX - x * zoomLevel, event.offsetY - y * zoomLevel];
	  
	  redraw();
	 
	}); 
	*/
	
	function redraw(){
		
		
		if (d3.event){
		    // JB - Uncommented this to reinstate D3's default zoom behavior.  The old,
		    // commented-out version scaled the zoom by zoomVal, but that doesn't really
		    // make sense.
			zoomLevel = d3.event.scale;
			transLevel = d3.event.translate;		
		}
		
		vis.attr("transform", "translate(" + transLevel[0] + "," + transLevel[1]  +  ")scale(" + zoomLevel + ")"); 
		
		
	
	} 
	
	
	
	
	//add in the controls
	jQuery("#chart").append(
		jQuery("<div>")
			.text("+")
			.addClass("chartZoomIn")
			.click(function(){
  				zoomLevel = zoomLevel + 0.15;	// Ben changed this for slower zoom; was 0.3
 	  			redraw();
  			})

	).append(
	
		jQuery("<div>")
			.text("-")
			.addClass("chartZoomOut")
			.click(function(){
  				zoomLevel = zoomLevel - 0.15;	// Ben changed this for slower zoom; was 0.3
 	  			redraw();
  			})		
	);
	
	
	
	var tooltip = d3.select("body")
			.append("div")
			.attr('class','d3ToolTip');
	
	var vis = d3.select("#chart").append("svg:svg")
		.attr("width", visWidth)
		.attr("height", visHeight)			
		.append("svg:g")		
		.call(zoom); 		
		 
			
		vis.append("rect")
			.attr("width", visWidth)
			.attr("height", visHeight)
			.attr("id", "zoomCanvas")
			.style("fill","#fff")
			.style("cursor",  "url(" + resourcePath  +"/openhand.png)")
 			.on("mousedown", function(){
			
				//the grabbing css rules do not work with web-kit, so specifiy the cursor hand and use the css for firefox.
				d3.select("#zoomCanvas").style("cursor",  "url(" + resourcePath  +"closedhand.png)");
				d3.select("#zoomCanvas").attr("class","grabbing");
				
			})
			.on("mouseup", function(){
			
				d3.select("#zoomCanvas").style("cursor",  "url(" + resourcePath  +"openhand.png)");
				d3.select("#zoomCanvas").attr("class","");
					
				
				
			});
			  

		vis = vis.append("g"); 
	
	
	//request the json
	d3.json(baseurl + "/tree/json/" + nid, function(json) {	// Ben hard-coded url for local dev; original was "/tree/json/"
		 
		
		//store the url for this person		
		var personName = json.name.toLowerCase().replace(/\./g,'-').replace(/ /g,'-');
		//update the URL
		
		/*if(history.pushState && history.replaceState) {
			//push current id, title and url
			
			var current = location.href + "";
			current = current.substr(0, current.search("tree/")); 			
 			history.pushState({"id":nid}, document.title, current + 'tree/' + personName);
		
		}				
		*/
 		//set the base name and nid because it is expected for every node, 
		json.descendants.name = json.name;
		json.ancestors.name = json.name;
		json.workedWith.name = json.name;
		json.descendants.nid = json.nid;
		json.ancestors.nid = json.nid;
		json.workedWith.nid = json.nid;		
				
				
				
		// JB - group together children and grandchildren with the same relationships into "peer" groups.
        var grouped_children = [];
        var d = {};
        for (y in json.descendants.children) {
            var child = json.descendants.children[y];
            if (child.children.length) {
                // Don't group nodes that have children.
                grouped_children.push(child);
                continue;
            }
            if (child.type in d) {
                d[child.type].push(child);
            } else {
                d[child.type] = [child];
            }
        }
        for (type in d) {
            var first_node;
            for (i in d[type]) {
                if (i == 0) {
                    grouped_children.push(d[type][0]);
                    first_node = d[type][0];
                    first_node.peers = [];
                } else {
                    first_node.peers.push(d[type][i]);
                }
            }
            if (first_node.peers.length) {
                // This is a hack to make sure that D3 leaves enough space for the stack of nodes
                // beneath the first one.
                first_node.children = [first_node.peers[0]];
            }
        }
        json.descendants.children = grouped_children;
        for (x in json.descendants.children) {
            d = {};
            for (y in json.descendants.children[x].children) {
                var child = json.descendants.children[x].children[y];
                if (child.type in d) {
                    d[child.type].push(child);
                } else {
                    d[child.type] = [child];
                }
            }
            grouped_children = [];
            for (type in d) {
                var first_node;
                for (i in d[type]) {
                    if (i == 0) {
                        grouped_children.push(d[type][0]);
                        first_node = d[type][0];
                        first_node.peers = [];
                    } else {
                        first_node.peers.push(d[type][i]);
                    }
                }
                if (first_node.peers.length) {
                    first_node.children = [first_node.peers[0]];
                }
            }
            json.descendants.children[x].children = grouped_children;
        }
		
        var grouped_children = [];
        var d = {};
        for (y in json.workedWith.children) {
            var child = json.workedWith.children[y];
            if (child.children.length) {
                // Don't group nodes that have children.
                grouped_children.push(child);
                continue;
            }
            if (child.type in d) {
                d[child.type].push(child);
            } else {
                d[child.type] = [child];
            }
        }
        for (type in d) {
            var first_node;
            for (i in d[type]) {
                if (i == 0) {
                    grouped_children.push(d[type][0]);
                    first_node = d[type][0];
                    first_node.peers = [];
                } else {
                    first_node.peers.push(d[type][i]);
                }
            }
        }
        json.workedWith.children = grouped_children;
        
		
 
		/*	***************************
			build the descendants
			***************************
		*/			
				
		
		//count how many descendants children we have in here and how many ancestor children to use later
		var totalDesendentChildren = json.descendants.children.length;
		for (x in json.descendants.children){
			totalDesendentChildren = totalDesendentChildren + json.descendants.children[x].children.length;
		}
		
		//count how many ansestor children we have in here
		var totalAncestorChildren = json.ancestors.children.length;
		for (x in json.ancestors.children){
			totalAncestorChildren = totalAncestorChildren + json.ancestors.children[x].children.length;
		}
		
 		var totalWorkedWithChildren = json.workedWith.children.length;
		
			
		//we need to pick one to use as the center of the graph
		var useAncestor = true;	//default = true
		
		if (totalAncestorChildren != 0){useAncestor = true;}
		if (totalAncestorChildren == 0 && totalDesendentChildren != 0){useAncestor = false;}
 		
		
		//not too close please 
		if (totalAncestorChildren <= 5 && totalAncestorChildren != 0){totalAncestorChildren = 8;}		
		if (totalDesendentChildren <= 5 && totalDesendentChildren != 0){totalDesendentChildren = 8;}
		if (totalWorkedWithChildren <= 5 && totalWorkedWithChildren != 0){totalWorkedWithChildren = 8;}
		
		//store it for later calulation
		var desendentHeight =  (visHeight / 50) * totalDesendentChildren;		
		var ancestorHeight =  (visHeight / 50) * totalDesendentChildren;		
		
		
		
		
		//if there are a lot of worked alongside children and not a lot of desendent children fix it
		if (totalWorkedWithChildren>5 && totalDesendentChildren <= 5){totalDesendentChildren = 8;}
	
	
		
		
		//how wide do we need to be
		var ancestorWidth = (visWidth / 30) * totalAncestorChildren;
		var descendantWidth = (visWidth / 30) * totalDesendentChildren;
		if (ancestorWidth > descendantWidth){
			var widthOfTrees = ancestorWidth;
		}else{
			var widthOfTrees = descendantWidth;
		}
		
		if (totalAncestorChildren >= 28 || totalDesendentChildren >= 28){
			
 			shiftRight = -1000;
			
		}
		if (totalAncestorChildren >= 40 || totalDesendentChildren >= 40){
			
 			shiftRight = -1500;
			
		}	
	
	
	    // JB - have to create all 3 trees at the beginning so that we can calculate the positioning.
	
		//make the tree "longer" if there are more kids, the (visHeight / 50) is arbitrary, could be tweaked 
		var descendantTree = d3.layout.tree().size([widthOfTrees, (visHeight / 50) * totalDesendentChildren]);	
		var ancestorTree = d3.layout.tree().size([widthOfTrees, (visHeight / 50) * totalAncestorChildren]);	
		
		//this is the sideways tree, it needs to be a little longer to clear the vertical trees.
		var horzTreeX = (800 / 14) * totalWorkedWithChildren;
  		var horzTreeY = (900 / 20) * totalWorkedWithChildren;
 		if (horzTreeY <= widthOfTrees){horzTreeY = widthOfTrees / 2;}
		var workedWithTree = d3.layout.tree().size([horzTreeX,horzTreeY]);
		
		var descendantNodes = descendantTree.nodes(json.descendants);
		var ancestorNodes = ancestorTree.nodes(json.ancestors);
		var workedWithNodes = workedWithTree.nodes(json.workedWith);
		
		//the line diff is just the x location of the central node + 25, half of the central node width
		if (useAncestor){
			var lineDiff = ancestorNodes[0].x - 25;
		}else{
			var lineDiff = descendantNodes[0].x - 25;
		}
	
	
		// JB - this is needed to get the ancestor and descendant trees to line up correctly.
		var descendentRootOffset = descendantNodes[0].x;
		var ancestorRootOffset = ancestorNodes[0].x;
		var descendantOffset = ancestorRootOffset - descendentRootOffset;
		
		
	
		// JB - set up the zoom so that the display is properly framed.
		var xMin = ancestorNodes[0].x + shiftRight;
		var xMax = ancestorNodes[0].x + shiftRight;
		var yMin = -ancestorNodes[0].y + shiftDown;
		var yMax = -ancestorNodes[0].y + shiftDown;
		function updateMinMax(x, y) {
    		if (x < xMin) {
    		    xMin = x;
    		} else if (x > xMax) {
    		    xMax = x;
    		}
    		if (y < yMin) {
    		    yMin = y;
    		} else if (y > yMax) {
    		    yMax = y;
    		}
    	}
		for (var i = 0; i < descendantNodes.length; i++) {
		    var peerOffset;
		    if (descendantNodes[i].peers) {
		        peerOffset = descendantNodes[i].peers.length * peerNodeOffset;
		    } else {
		        peerOffset = 0;
		    }
		    updateMinMax(descendantNodes[i].x + shiftRight + descendantOffset,
		                 descendantNodes[i].y + peerOffset + shiftDown);
    	}
		for (var i = 0; i < ancestorNodes.length; i++) {
		    updateMinMax(ancestorNodes[i].x + shiftRight,
		                 -ancestorNodes[i].y + shiftDown);
    	}
		for (var i = 0; i < workedWithNodes.length; i++) {
		    var peerOffset;
		    if (workedWithNodes[i].peers) {
		        peerOffset = workedWithNodes[i].peers.length * peerNodeOffset;
		    } else {
		        peerOffset = 0;
		    }
		    updateMinMax(-workedWithNodes[i].y - peerOffset + lineDiff + shiftRight,
		                 workedWithNodes[i].x - horzTreeX/2 + shiftDown);
    	}
    	
    	// Total width of everything displayed, calculated to the centers of the icons (not
    	// including the labels), plus a 100-pixel border around the edge.
    	var totalWidth = xMax - xMin + 200.0;
    	var totalHeight = yMax - yMin + 200.0;
    	
    	var screenWidth = jQuery("#modalTreeHolder").width();
    	var screenHeight = jQuery("#modalTreeHolder").height();
    	
    	// These are the zoom levels needed to fit either vertically or horizontally.
    	var horizScaleFactor = screenWidth / totalWidth;
    	var vertScaleFactor = screenHeight / totalHeight;
    	
    	// Set up the framing.  This puts a 100-unit border around the edge, providing room for most
    	// labels attached to works-with people.  If you want to adjust this, you will also need
    	// to adjust the calculation of totalWidth and totalHeight.
    	if (horizScaleFactor < vertScaleFactor) {
        	zoomLevel = horizScaleFactor;
    	    shiftRight += 100 - xMin;
    	    shiftDown += (screenHeight / zoomLevel - (yMax + yMin)) * 0.5;
        } else {
        	zoomLevel = vertScaleFactor;
    	    shiftRight += (screenWidth / zoomLevel - (xMax + xMin)) * 0.5;
    	    shiftDown += 100 - yMin;
        }
		
		zoom.scale(zoomLevel);
		
		
		// JB - moved this here so that the zoom settings can depend on the JSON data.
        vis.attr("transform",
	        "translate(" + transLevel + ")"
	        + " scale(" + zoomLevel + ")");
 		
 		
 		var tree = descendantTree;

		//which way do we want the path to go, up or down, or sidewaysss
		var diagonalDescendant = d3.svg.diagonal().projection(function(d) {  return [d.x + shiftRight + descendantOffset, (d.y)+shiftDown]; });
		
				
	 
		var nodesDescendant = tree.nodes(json.descendants);
		var linksDescendant = tree.links(nodesDescendant);	
		
		
		// JB - Add in the "peer" nodes
		nNodesDescendant = nodesDescendant.length;
		for (var i = 0; i < nNodesDescendant; i++) {
		    var peers = nodesDescendant[i].peers;
		    if (peers) {
		        // See above - hack to make sure D3's algorithm gets the spacing right.
		        nodesDescendant[i].children = [];
		        var x = nodesDescendant[i].x, y = nodesDescendant[i].y;
		        for (var j = 0; j < peers.length; j++) {
        		    peers[j].x = x;
        		    y += peerNodeOffset;
        		    peers[j].y = y;
        		    peers[j].depth = -1;
        		    if (j > 0) {
            		    nodesDescendant.push(peers[j]);
            		}
        		}
    		}
		}
		// Remove the links connecting nodes to their first peers.
		linksDescendant = linksDescendant.filter(function (d) {
		    return !d.source.peers;
		});
		
		

		//add the image to the zero node
		nodesDescendant[0].image = json.image;
				
		var linkDescendant = vis.selectAll("pathlink")
		.data(linksDescendant)
		.enter().append("svg:path")
		.attr("class", "link")
		.attr("stroke", function(d){return (typeof mentor_type_colors[d.target.type]!='undefined') ? mentor_type_colors[d.target.type] : "grey"})		
		.attr("d", diagonalDescendant);
		
		//paint a wider transparent path over the same path so the hover title text works better
		var linkDescendantOverlay = vis.selectAll("pathlink")
		.data(linksDescendant)
		.enter().append("svg:path")
		.attr("class", "hoverLink")
		.attr("d", diagonalDescendant)
		.on("mouseover", function(d){ tooltip.style("visibility", "visible");   tooltip.html((typeof mentor_type_text[d.target.type]!='undefined') ? mentor_type_text[d.target.type] : d.target.type) })
		.on("mousemove", function(d){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", function(d){return tooltip.style("visibility", "hidden");})	;
		//.append('title').text(function(d){return (typeof mentor_type_text[d.target.type]!='undefined') ? mentor_type_text[d.target.type] : d.target.type});
				
		
		
		var nodeDescendant = vis.selectAll("g.descendant")
		.data(nodesDescendant)
		.enter().append("svg:g")
		.attr("transform", function(d) { return "translate(" + (d.x + shiftRight + descendantOffset) + "," + (d.y + shiftDown) + ")"; })
		.attr("class",function(d){if (d.depth==0){return "rootNode";} return "childNode";})
		.on("mouseover", function(d){ tooltip.style("visibility", "visible"); tooltip.html(d.name); })
		.on("mousemove", function(d){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", function(d){return tooltip.style("visibility", "hidden");})		
		.on("click",function(d){ tooltip.style("visibility", "hidden"); reorderTree(d.nid)});
		
 		nodeDescendant.append("svg:rect")
		.attr('fill','white')
		.attr('stroke', function(d){if (d.depth==0){return "#000";} return '#ccc';})
		.attr("height", function(d){return returnNodeProperties(d).height; })
		.attr("width", function(d){return returnNodeProperties(d).width; })
		.attr("x", function(d){return returnNodeProperties(d).width /2 *-1; })
		.attr("y", function(d){return returnNodeProperties(d).height /2 * -1; })
		.attr("visibility", function(d){return (d.depth==0 && useAncestor) ? "hidden" : "visible";});
		

		nodeDescendant.append("svg:image")
			.attr("class", "circle")
			.attr("cursor","pointer")
			.attr("xlink:href", function(d){return (d.image!="") ? d.image : "";})		  			  
			.attr("height", function(d){return returnNodeProperties(d).height - 5; })
			.attr("width", function(d){return returnNodeProperties(d).width - 5; })
			.attr("x", function(d){return returnNodeProperties(d).width /2.2 *-1; })
			.attr("y", function(d){return returnNodeProperties(d).height /2.3 * -1; })
			.attr("visibility", function(d){
					
					//hide this one because we are re-adding the source person in the ancestors section
					if (d.depth==0 && useAncestor){return "hidden"}
					
					//hide it if we have an image of the person
					return (d.image=="") ? "hidden" : "visible";		
				
			})	//hide this one because we are re-adding the source person in the ancestors section
  

		
		//add the svg path of a blank user silhouette 
		nodeDescendant.append("svg:g")
			.attr("visibility", function(d){
				
					
					//hide this one because we are re-adding the source person in the ancestors section
					if (d.depth==0 && useAncestor){return "hidden"}
					//hide it if we have an image of the person
					return (d.image !="") ? "hidden" : "visible";
			 })	
			.attr("transform", function(d) {return "translate(" + returnNodeProperties(d).width /2 *-1 + "," + returnNodeProperties(d).height /2 * -1 + ")scale(" + (returnNodeProperties(d).width) / 50 + ")"; })
			.append("svg:path")
				.attr("d","M35.492,11.02c0,5.968-4.838,15.184-10.805,15.184c-5.967,0-10.805-9.216-10.805-15.184 c0-5.967,4.838-10.805,10.805-10.805C30.654,0.215,35.492,5.053,35.492,11.02z M41.988,25.065c0,0-4.775-1.118-10.559-1.73c-1.883,2.288-4.217,3.863-6.743,3.863 c-2.526,0-4.859-1.575-6.745-3.863c-5.781,0.612-10.557,1.73-10.557,1.73c-2.34,0-4.237,1.897-4.237,4.237v16.46 c0,2.34,1.897,4.237,4.237,4.237h34.603c2.338,0,4.237-1.896,4.237-4.237v-16.46C46.226,26.963,44.328,25.065,41.988,25.065z");
		 
			
		//this rect block out the path lines for the name tag
 		nodeDescendant.append("svg:rect")
			.attr('fill','white')
			.attr('stroke','none')
			.attr("height", function(d){return returnNodeProperties(d).font*2 + 2})
			.attr("width", function(d){return returnNodeProperties(d).width})
			.attr("x", function(d){return returnNodeProperties(d).width/2 * -1})
			.attr("y", function(d){return returnNodeProperties(d).height/2})
			.attr("visibility", function(d){
					
						if (d.depth==0 && useAncestor){return "hidden";} 
						return (returnNodeProperties(d).textAnchor=='right') ? "hidden" : "visible";
					
					});		  
					
		//The first name
		nodeDescendant.append("svg:a")
		.attr("xlink:href",function(d){return baseurl + "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("dx", function(d){ return returnNodeProperties(d).textX})
			.attr("dy", function(d){ return returnNodeProperties(d).textY})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return splitName(d.name)[0]; })
			.attr("visibility", function(d){return (d.depth==0 && useAncestor) ? "hidden" : "visible";});	//hide this one because we are re-adding the source person in the ancestors section

		//The second name
		nodeDescendant.append("svg:a")
		.attr("xlink:href",function(d){return baseurl + "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("dx", function(d){ return returnNodeProperties(d).textX})
			.attr("dy", function(d){ return returnNodeProperties(d).textY+returnNodeProperties(d).font})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return splitName(d.name)[1]})
			.attr("visibility", function(d){return (d.depth==0 && useAncestor) ? "hidden" : "visible";});	//hide this one because we are re-adding the source person in the ancestors section
			
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
	




	
		/*	***************************
			build the ancestors
			***************************
		*/

 

		if (totalWorkedWithChildren>5 && totalAncestorChildren <= 5){totalAncestorChildren = 8;}
		

		//reset the tree layout
		tree = ancestorTree;	
  		
		
		var nodesAncestor = tree.nodes(json.ancestors);
		var linksAncestor = tree.links(nodesAncestor);

		//add the image to the zero node
		nodesAncestor[0].image = json.image;
		
		var diff = 0;
		 

		var diagonalAncestor = d3.svg.diagonal().projection(function(d) {  return [d.x + shiftRight, d.y*-1 + shiftDown]; });		
		
		 
		var linkAncestor = vis.selectAll("pathlink")
		.data(linksAncestor)
		.enter().append("svg:path")
		.attr("class", "link") 
		.attr("stroke", function(d){return (typeof mentor_type_colors[d.target.type]!='undefined') ? mentor_type_colors[d.target.type] : "grey"})		
		.attr("d", diagonalAncestor)
		.append('title').text(function(d){return d.target.type;});

		//paint a wider transparent path over the same path so the hover title text works better
		var linkAncestorOverlay = vis.selectAll("pathlink")
		.data(linksAncestor)
		.enter().append("svg:path")
		.attr("class", "hoverLink")
  		.attr("d", diagonalAncestor)
		.on("mouseover", function(d){ tooltip.style("visibility", "visible");   tooltip.html((typeof mentor_type_text[d.target.type]!='undefined') ? mentor_type_text[d.target.type] : d.target.type) })
		.on("mousemove", function(d){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", function(d){return tooltip.style("visibility", "hidden");})	;
		//.append('title').text(function(d){return (typeof mentor_type_text[d.target.type]!='undefined') ? mentor_type_text[d.target.type] : d.target.type});
			
			 
		var nodeAncestor = vis.selectAll("g.descendant")
		.data(nodesAncestor)
		.enter().append("svg:g")
		.attr("transform", function(d) { return "translate(" + (d.x + shiftRight) + "," + (d.y*-1 + shiftDown) + ")"; })
		.attr("class",function(d){if (d.depth==0){return "rootNode";} return "childNode";})
		.on("mouseover", function(d){ tooltip.style("visibility", "visible"); tooltip.html(d.name); })
		.on("mousemove", function(d){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", function(d){return tooltip.style("visibility", "hidden");})			
		.on("click",function(d){tooltip.style("visibility", "hidden");  reorderTree(d.nid)})
		
 		nodeAncestor.append("svg:rect")
		.attr('fill','white')
		.attr('stroke', function(d){if (d.depth==0){return "#000";} return '#ccc';})
		.attr('stroke-width', function(d){if (d.depth==0){return 2;} return 1;})		
		.attr("height", function(d){return returnNodeProperties(d).height; })
		.attr("width", function(d){return returnNodeProperties(d).width; })
		.attr("x", function(d){return returnNodeProperties(d).width /2 *-1 - diff; })
		.attr("y", function(d){return (returnNodeProperties(d).height /2 * -1); })
		.attr("visibility", function(d){return (d.depth==0 && !useAncestor) ? "hidden" : "visible";});
		
		/*
		nodeAncestor.append("svg:image")
			.attr("class", "circle")
			.attr("cursor","pointer")
			.attr("xlink:href", resourcePath + 'person.png')		  			  
			.attr("height", function(d){return returnNodeProperties(d).height - 5; })
			.attr("width", function(d){return returnNodeProperties(d).width - 5; })
			.attr("x", function(d){return returnNodeProperties(d).width /2.2 *-1 - diff; })
			.attr("y", function(d){return returnNodeProperties(d).height /2.3 * -1; })
		  	.on("click",function(d){reorderTree(d.nid)})
			.append('title').text(function(d){return "Click to center on " + d.name;});
		*/
			

		nodeAncestor.append("svg:image")
			.attr("class", "circle")
			.attr("cursor","pointer")
			.attr("xlink:href", function(d){return (d.image!="") ? d.image : "";})		  			  
			.attr("height", function(d){return returnNodeProperties(d).height - 5; })
			.attr("width", function(d){return returnNodeProperties(d).width - 5; })
			.attr("x", function(d){return returnNodeProperties(d).width /2.2 *-1; })
			.attr("y", function(d){return returnNodeProperties(d).height /2.3 * -1; })
			.attr("visibility", function(d){
					
					
					if (d.depth==0 && !useAncestor){return "hidden"}
					
					//hide it if we have an image of the person
					return (d.image=="") ? "hidden" : "visible";		
				
			})	//hide this one because we are re-adding the source person in the ancestors section
  

		
		//add the svg path of a blank user silhouette 
		nodeAncestor.append("svg:g")
			.attr("visibility", function(d){

					if (d.depth==0 && !useAncestor){return "hidden"}

					//hide it if we have an image of the person
					return (d.image!="") ? "hidden" : "visible";
			 })	
			.attr("transform", function(d) {return "translate(" + returnNodeProperties(d).width /2 *-1 + "," + returnNodeProperties(d).height /2 * -1 + ")scale(" + (returnNodeProperties(d).width) / 50 + ")"; })
			.append("svg:path")
				.attr("d","M35.492,11.02c0,5.968-4.838,15.184-10.805,15.184c-5.967,0-10.805-9.216-10.805-15.184 c0-5.967,4.838-10.805,10.805-10.805C30.654,0.215,35.492,5.053,35.492,11.02z M41.988,25.065c0,0-4.775-1.118-10.559-1.73c-1.883,2.288-4.217,3.863-6.743,3.863 c-2.526,0-4.859-1.575-6.745-3.863c-5.781,0.612-10.557,1.73-10.557,1.73c-2.34,0-4.237,1.897-4.237,4.237v16.46 c0,2.34,1.897,4.237,4.237,4.237h34.603c2.338,0,4.237-1.896,4.237-4.237v-16.46C46.226,26.963,44.328,25.065,41.988,25.065z");
		 
				
			
		//this rect block out the path lines for the name tag
 		nodeAncestor.append("svg:rect")
			.attr('fill','white')
			.attr('stroke','none')
			.attr("height", function(d){return returnNodeProperties(d).font*2 + 2})
			.attr("width", function(d){return returnNodeProperties(d).width})
			.attr("x", function(d){return returnNodeProperties(d).width/2 * -1 - diff})
			.attr("y", function(d){return returnNodeProperties(d).height/2 * -1 - returnNodeProperties(d).font*2 - 2})
			.attr("visibility", function(d){
			
					if (d.depth==0 && !useAncestor){return "hidden";} 
					return (returnNodeProperties(d).textAnchor=='right') ? "hidden" : "visible";
					
			});		  
					
		//The first name
		nodeAncestor.append("svg:a")
		.attr("xlink:href",function(d){if (d.depth==0){return baseurl + "/node/" + nid;} return baseurl + "/node/" + d.nid;})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr('font-weight', function(d){if (d.depth==0){return "bold";} return 'normal';})
			.attr("dx", function(d){ return returnNodeProperties(d).textX - diff})
			.attr("dy", function(d){ return (returnNodeProperties(d).textAnchor=='right') ? returnNodeProperties(d).textY: returnNodeProperties(d).textY *-1 - 2;})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return (d.depth==0) ? d.name :  splitName(d.name)[0]})
			.attr("visibility", function(d){return (d.depth==0 && !useAncestor) ? "hidden" : "visible";});

		//The second name
		nodeAncestor.append("svg:a")
		.attr("xlink:href",function(d){if (d.depth==0){return baseurl + "/node/" + nid;} return baseurl + "/node/" + d.nid;})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr('font-weight', function(d){if (d.depth==0){return "bold";} return 'normal';})		
			.attr("dx", function(d){ return returnNodeProperties(d).textX - diff})
			.attr("dy", function(d){ return (returnNodeProperties(d).textAnchor=='right') ? returnNodeProperties(d).textY + + returnNodeProperties(d).font: returnNodeProperties(d).textY *-1 - 2 + + returnNodeProperties(d).font;})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return (d.depth==0) ? "" :  splitName(d.name)[1]})
			.attr("visibility", function(d){return (d.depth==0 && !useAncestor) ? "hidden" : "visible";});
			
		
		
		
		
		
		
		
	

		/*	***************************
			build the worked with
			***************************
		 */	



		tree = workedWithTree;

		
		
		var nodesWorkedWith = tree.nodes(json.workedWith);
		var linksWorkedWith = tree.links(nodesWorkedWith);		
		
		
		// JB - Add in the "peer" nodes
		nNodesWorkedWith = nodesWorkedWith.length;
		for (var i = 0; i < nNodesWorkedWith; i++) {
		    var peers = nodesWorkedWith[i].peers;
		    if (peers) {
		        var x = nodesWorkedWith[i].x, y = nodesWorkedWith[i].y;
		        for (var j = 0; j < peers.length; j++) {
        		    peers[j].x = x;
        		    y += peerNodeOffset;
        		    peers[j].y = y;
        		    peers[j].depth = -2;
        		    nodesWorkedWith.push(peers[j]);
        		}
    		}
		}
				
		
		
		var diagonalWorkedWith = d3.svg.diagonal().projection(function(d) { return [(d.y*-1 + lineDiff + shiftRight), d.x-horzTreeX/2 + shiftDown]; });
		
		
		var linkWorkedWith = vis.selectAll("pathlink")
		.data(linksWorkedWith)
		.enter().append("svg:path")
		.attr("class", "link")
		.attr("stroke", function(d){return (typeof worked_with_type_colors[d.target.type]!='undefined') ? worked_with_type_colors[d.target.type] : "grey"})		
		.attr("d", diagonalWorkedWith);
		
		
		//paint a wider transparent path over the same path so the hover title text works better
		var linkWorkedWithOverlay = vis.selectAll("pathlink")
		.data(linksWorkedWith)
		.enter().append("svg:path")
		.attr("class", "hoverLink")
  		.attr("d", diagonalWorkedWith)
		.on("mouseover", function(d){ tooltip.style("visibility", "visible");   tooltip.html((typeof mentor_type_text[d.target.type]!='undefined') ? mentor_type_text[d.target.type] : d.target.type) })
		.on("mousemove", function(d){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", function(d){return tooltip.style("visibility", "hidden");})	;		
		//.append('title').text(function(d){return (typeof worked_with_type_text[d.target.type]!='undefined') ? worked_with_type_text[d.target.type] : d.target.type});
			
		
		
		var nodesWorkedWith = vis.selectAll("g.descendant")
		.data(nodesWorkedWith)
		.enter().append("svg:g")
		.attr("transform", function(d) { return "translate(" + (d.y*-1 + lineDiff + shiftRight) + "," + (d.x-horzTreeX/2 + shiftDown)  + ")"; })
		.attr("class",function(d){if (d.depth==0){return "rootNode";} return "childNode";})
		.on("mouseover", function(d){ tooltip.style("visibility", "visible"); tooltip.html(d.name); })
		.on("mousemove", function(d){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
		.on("mouseout", function(d){return tooltip.style("visibility", "hidden");})			
		.on("click",function(d){tooltip.style("visibility", "hidden");  reorderTree(d.nid)});
		
		
 		nodesWorkedWith.append("svg:rect")
		.attr('stroke','#ccc')
		.style('fill','#fff')
		.attr("height", function(d){return returnNodeProperties(d).height})
		.attr("width", function(d){return returnNodeProperties(d).width})
		.attr("x", function(d){return returnNodeProperties(d).width/2 * -1 })
		.attr("y", function(d){return returnNodeProperties(d).height/2* -1 })		
		.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";});
		
		
		
		
		nodesWorkedWith.append("svg:image")
			.attr("class", "circle")
			.attr("cursor","pointer")
			.attr("xlink:href", function(d){return (d.image!="") ? d.image : "";})		  			  
			.attr("height", function(d){return returnNodeProperties(d).height - 5; })
			.attr("width", function(d){return returnNodeProperties(d).width - 5; })
			.attr("x", function(d){return returnNodeProperties(d).width /2.2 *-1; })
			.attr("y", function(d){return returnNodeProperties(d).height /2.3 * -1; })
			.attr("visibility", function(d){
					//hide it if we have an image of the person
					return (d.image=="") ? "hidden" : "visible";		
			})	
  

		
		//add the svg path of a blank user silhouette 
		nodesWorkedWith.append("svg:g")
			.attr("visibility", function(d){
						//hide it if we have an image of the person
					return (d.image!="") ? "hidden" : "visible";
			 })	
			.attr("transform", function(d) {return "translate(" + returnNodeProperties(d).width /2 *-1 + "," + returnNodeProperties(d).height /2 * -1 + ")scale(" + (returnNodeProperties(d).width) / 50 + ")"; })
			.append("svg:path")
				.attr("d","M35.492,11.02c0,5.968-4.838,15.184-10.805,15.184c-5.967,0-10.805-9.216-10.805-15.184 c0-5.967,4.838-10.805,10.805-10.805C30.654,0.215,35.492,5.053,35.492,11.02z M41.988,25.065c0,0-4.775-1.118-10.559-1.73c-1.883,2.288-4.217,3.863-6.743,3.863 c-2.526,0-4.859-1.575-6.745-3.863c-5.781,0.612-10.557,1.73-10.557,1.73c-2.34,0-4.237,1.897-4.237,4.237v16.46 c0,2.34,1.897,4.237,4.237,4.237h34.603c2.338,0,4.237-1.896,4.237-4.237v-16.46C46.226,26.963,44.328,25.065,41.988,25.065z");


		nodesWorkedWith.append("svg:a")
		.attr("xlink:href",function(d){return baseurl + "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("x", function(d){ return (d.depth==-2 || (d.peers && d.peers.length)) ? 0.0 : returnNodeProperties(d).width / 1.9 * -1;  })
			.attr("y", function(d){ return (d.depth==-2 || (d.peers && d.peers.length)) ? baseNodeSize /2 + returnNodeProperties(d).font : 0.0;  })
			//.attr("dy", function(d){ return (horzTreeY/2.25*-1) - returnNodeProperties(d).height / 2 + returnNodeProperties(d).font;  })
			.attr("text-anchor", function(d){return (d.depth==-2 || (d.peers && d.peers.length)) ? "middle" : "end";  })
			.attr("font-size",function(d){return returnNodeProperties(d).font})	
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";})
			.text(function(d) { return splitName(d.name)[0]; });	
			
		nodesWorkedWith.append("svg:a")
		.attr("xlink:href",function(d){return baseurl + "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("x", function(d){ return (d.depth==-2 || (d.peers && d.peers.length)) ? 0.0 : returnNodeProperties(d).width / 1.9 * -1;  })
			.attr("y", function(d){ return ((d.depth==-2 || (d.peers && d.peers.length)) ? baseNodeSize /2 + returnNodeProperties(d).font : 0.0) + returnNodeProperties(d).font ;  })
			.attr("text-anchor", function(d){return (d.depth==-2 || (d.peers && d.peers.length)) ? "middle" : "end";  })
			.attr("font-size",function(d){return returnNodeProperties(d).font})	
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";})
			.text(function(d) { return splitName(d.name)[1]; });				
	 
 
		
		
	
		
				




 
		
		
	});
	
	
	
	//figure out how large to make the node depending on mutliple factors, also suggest a font size and placement
	function returnNodeProperties(d){
		



		var comfortableSiblingCount = 6;	//how many siblings can you have before it gets over-lapyish
		var numOfSiblings =	0;		
		var textX = baseNodeSize/2 + (baseNodeSize/10);		//to the right, plus padding
		var textY = baseNodeSize/5 * -1;					//just offset it from the top a little
		var textAnchor = "right";
		var font = baseFontSize;		
				
		
		//is this the zero node? if so just reutn the base size
		if (d.depth==0){return {"height":baseNodeSize,"width":baseNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};}
		
		//children
		if (d.depth==1){
			
			numOfSiblings = d.parent.children.length;
			
			//if they are under the comfort level, return base size, they all fit
			//if (numOfSiblings<=comfortableSiblingCount){
			
				//if they they have or more siblings put their text under them
				if (numOfSiblings>3){ 
					textAnchor="middle";
					textX = 0;
					textY = baseNodeSize /2 + font;				
				}
				
				
				//its the big one!
				if (numOfSiblings>10){ 
					textAnchor="middle";
					
 					font = 11;
					useNodeSize = baseNodeSize - (numOfSiblings * 0.8);	
					textY = useNodeSize / 2 + font;	
					textX = useNodeSize /2 * -1;
					
					return {"height": useNodeSize,"width":useNodeSize, "font": font, "textX" : textX, "textY" : textY}		
				}		
			
				
				if (numOfSiblings>6){ 
					textAnchor="right";
					textX = 0;
 					
					useNodeSize = baseNodeSize - (numOfSiblings * 1.5);	
					textY = useNodeSize /2 + font;	
					return {"height": useNodeSize,"width":useNodeSize, "font": font, "textX" : textX, "textY" : textY}		
				}		
			
				
				return {"height":baseNodeSize,"width":baseNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};
				
			//}else{
			
				//otherwise we need to scale them down to make room
				
			//	useNodeSize = baseNodeSize - (numOfSiblings * 2);
				
				
			//	font = 10;
	
				//at this level really the max number of nodes you can have and still put the text to the side is 3-ish, 
				//if more than that put it under the node
			//	if (numOfSiblings>=3){ textX = useNodeSize / 2; textX = baseNodeSize / 2 + font; }
				
				
			//	return {"height": useNodeSize,"width":useNodeSize, "font": font, "textX" : textX, "textY" : textY}
				
			//}
			
			
		}

		//next level things get a little tighter
		comfortableSiblingCount = 3;
		if (d.depth==2){
			 
			//numOfSiblings = d.parent.children.length;			 
			numOfSiblings = 0;
			
			//at this level, a sibling is not just your parent's child, your grand parent's children's children (cousins) are also sharing your space, so have to account for evurr burdy
			
			for (cousinParent in d.parent.parent.children){ 
				numOfSiblings = numOfSiblings + d.parent.parent.children[cousinParent].children.length;				
			} 
			
			
			//if they are under the comfort level, return base size, they all fit
			if (numOfSiblings<=comfortableSiblingCount){

				//if they have 2 or more siblings put their text under them
				if (numOfSiblings>3){ 
					textAnchor="middle";
					textX = 0;
					textY = baseNodeSize /2 + font;				
				}
			
				
				return {"height":baseNodeSize,"width":baseNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};
				
			}else{


				//otherwise we need to scale them down to make room
				
				useNodeSize = baseNodeSize - (numOfSiblings * 0.8); 
				font = 12;
				
				//text haas to go under/above them no matter what
				textAnchor="middle";
				textX = 0;
				textY = useNodeSize /2 + font;						
	
 			 
				return {"height":useNodeSize,"width":useNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};
			
			}
			
			
		}		
		
		 
		// This is used for the "peer" nodes in the descendants tree.
		if (d.depth==-1){
		    return {"height":baseNodeSize,"width":baseNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};
		}
		 
		// This is used for the "peer" nodes in the worked with tree.
		if (d.depth==-2){
		    return {"height":baseNodeSize,"width":baseNodeSize, "font": font, "textX" : textX, "textY" : baseNodeSize /2 + font, "textAnchor" : textAnchor};
		}
		
		
		
		//did not catch? return base size
		return {"height":baseNodeSize,"width":baseNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};
		
		
		
	}
	
	
	//break a name into two parts even if there are multiple spaces
	function splitName(name){ 
	
		name = name.split(" ");		
		returnVal=[];		
		returnVal[0] = name[0];
		returnVal[1] = '';
		
		for (x=1;x<=name.length-1;x++){
			returnVal[1] = returnVal[1] + name[x] + ' ';
		}
		
		return returnVal;			
	}
	
	
	

	 
	
	
}



//when the person icon is clicked
function reorderTree(newnid){ 
	 
	 nid=newnid;
	 
	 //fade it out
	
	jQuery("#chart").animate({ opacity: 0 },function() {
		
		jQuery("#chart").empty();
		
		//scroll to the middle so it is in view
		//var offset = jQuery('#chart').offset();
		//jQuery('html, body').animate({scrollTop:offset.top+visHeight/4}, 'fast');
		
		zoomLevel = 1 * zoomVal;
		transLevel = [0,0];	
		shiftDown = shiftDown_start;	//move the whole graph down y
		shiftRight = shiftRight_start;	//move the whole graph right x
		zoomVal = zoomVal_start;		
		
		buildTree();
		jQuery("#chart").animate({ opacity: 100 });
			 
		
		
	});		 
	
}
		//if(history.pushState && history.replaceState) {
		//	window.onpops
