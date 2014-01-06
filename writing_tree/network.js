
//some config vars
var resourcePath = '/sites/all/modules/writing_tree/';	//path to the module 
var visWidth = 1000;	//width and height of the tree canvas, in px
var visHeight = 800;		
var fitToDiv = true;		//if true it will try to make the svg area the same width as the #chart div
var useColorLinks = true;	//use color coded edges?


//define the colors here
var relation_color = 
			{
				"mentored" 			: "#6a93d4",
				"studied_at" 		: "#8fb52d", 			 				
				"worked_alongside" 	: "#e165b9",
				"worked_at" 		: "#ffcc73",
				"other" 			: "grey"
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
  
	
	jQuery(".title").text("Loading Network...");
 
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
	buildNetwork();
	
  
});


function buildNetwork(){
	
	
	if (fitToDiv){visWidth = jQuery("#chart").width()-10;}
	
 
 
 	var zoomFactor = 0.7; //The inital zoom level 
	var dataObj;


	var force = d3.layout.force()
		.gravity(.05)
		.distance(90)
		.charge(-100)
		.size([visWidth, visHeight]);		

	var nodes = force.nodes(),
		links = force.links();
		
	
	var vis = d3.select("#chart").append("svg:svg")
		.attr("width", visWidth)
		.attr("height", visHeight);
		

	vis.append("rect") 
		.attr("width", "100%") 
		.attr("height", "100%") 
		.attr("fill", "white") 
		.call(d3.behavior.zoom() 
		  .on("zoom", function() { 
			vis.attr("transform", "translate(" +  (d3.event.translate[0] + ((visWidth - (visWidth * zoomFactor))/2)) + ',' + (d3.event.translate[1] + ((visHeight - (visHeight * zoomFactor))/2)) + 
			  ")scale(" + d3.event.scale*zoomFactor + ")"); 
		  })); 
		  
	vis = vis.append("g"); 

	//set the inital zoom level and offset 
	vis.attr('transform','translate(' + ((visWidth - (visWidth * zoomFactor))/2) + ',' + ((visHeight - (visHeight * zoomFactor))/2) + ')scale('+zoomFactor+')');
	 

	//what to do on each tick, the e.alpha limitiation could be enabled to prevent the crazyness that is a force graph initating by hiding it until it calms down
	force.on("tick", function(e) {
		//if (e.alpha<=.05){
			vis.selectAll("g.node").attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";}); 
			
			vis.selectAll("line.link")
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		//}
	});	
	

	function restart() {
	  var link = vis.selectAll("line.link")
		  .data(links, function(d) { return d.source.id + "-" + d.target.id; });
	 
	  link.enter().insert("svg:line", "g.node")
		  .attr("class", "link")
		  .attr("stroke", function(d){ 		  
		
  			if (useColorLinks){				
				return (typeof relation_color[d.type]!='undefined') ? relation_color[d.type] : "grey";
			}else{
				return "grey";
			}
  
		
		  
		  })
		  .append('title').text(function(d){return (typeof relation_text[d.type]!='undefined') ? relation_text[d.type] : d.type});;
	
	  link.exit().remove();
	
	  var node = vis.selectAll("g.node")
		  .data(nodes, function(d) { return d.id;});
	   
	  var nodeEnter = node.enter().append("svg:g")
		  .attr("class", "node")
		  .call(force.drag);
	
	  nodeEnter.append("svg:image")
		  .attr("class", "circle")
		  .attr("xlink:href", function(d){ return (d.type=="person") ? resourcePath + "person.png" : resourcePath + "institution.png";})
		  .attr("x", function(d) { return returnNodeSize(d)/2*-1})
		  .attr("y", function(d) { return returnNodeSize(d)/2*-1})
		  .attr("width", function(d) { return returnNodeSize(d)})
		  .attr("height", function(d) { return returnNodeSize(d)})
 		  .append("title").text(function(d){return d.title});
 
	  node.exit().remove();
	
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
			if (size > 30){size = 30}
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
		
 			nodes.push({id: dataObj.nodes[aNode].nid, title: dataObj.nodes[aNode].title, type:dataObj.nodes[aNode].type, size:1})
		
		}
		
		//now the edges
		for (aEdge in dataObj.edges){			
		
			
			
			//find our source and target nodes, size++ the target
			var target, source;
			
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
			
			links.push({source: nodes[source], target: nodes[target], type: dataObj.edges[aEdge].type});					

			
			
			
			
		
		}

		
		restart();

		
	}	


	//request the json
	d3.json("/network/json/", function(json) {
		
		
			jQuery(".title").text("");
			jQuery("#info").text("Data Generated: " + json.date);
			
			
			
			
			dataObj=json;
			filter();
		
	});


	
}















