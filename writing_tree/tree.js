
//some config vars
var resourcePath = '/sites/all/modules/writing_tree/';	//path to the module 
var visWidth = 1000;	//width and height of the tree canvas, in px
var visHeight = 1000;		
var fitToDiv = true;	//if true it will try to make the svg area the same width as the #chart div
var baseNodeSize = 50;	//this is the base size of all nodes, it will be scaled based on the returnNodeProperties function
var baseFontSize = 12;	//base font size


//define the colors here
var mentor_type_colors = 
			{
				"chair" 			: "#0d56a6",
				"committee" 		: "#00a876", 			 				
				"writing program" 	: "#ff9a00",
				"writing center" 	: "#ff5900",
				"other" 			: "grey",
				"other " 			: "grey"
			};
 
var worked_with_type_colors = 
			{
				"journal coeditors" 	: "#b365d4",
				"collection coeditors" 	: "#65257f",
				"article coauthors" 	: "#4e026e",
				"book coauthors" 		: "#a63cd4",
				"center coadmins" 		: "#ff4e40",
				"project coadmins" 		: "#bf3a30",
				"wac-wid coadmins" 		: "#d2006b",																								
				"collaborators (other)" : "grey"
			}; 
			
//verbiage
var  mentor_type_text =
	{
		"chair" 			: 		"Was Department Chair",
		"committee" 		:		"Was on Comittee",
		"other "			:		"Other Relationship",	//extra space in the db name?
		"other"				:		"Other Relationship",		
		"writing center"	:		"Mentored at Writing Center",
		"writing program"	:		"Mentored in writing program"	
	}
 
var  worked_with_type_text =
	{
		"article coauthors" 			: 		"Co-authored Article With",
		"book coauthors	" 				:		"Co-authored Book With",
		"collaborators (other)"			:		"Other Collaboration",
		"collection coeditors"			:		"Co-edited Collection With",
		"journal coeditors"				:		"Co-edited Journal With",	
		"project coadmins"				:		"Co-admined Project With",
		"center coadmins"				:		"Co-admined Center With",		
		"wac-wid coadmins"				:		"Wac-Wid Co-admins"
	} 
 
 
//drupal loads jquery, so use it.
jQuery(document).ready(function($) {
  
	
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
	
	if (fitToDiv){visWidth = jQuery("#chart").width()+20;}

 	//okay build it 
	reorderTree(nid);
	
  
});


function buildTree(){
	
	
	
	
	
	var vis = d3.select("#chart").append("svg:svg")
		.attr("width", visWidth)
		.attr("height", visHeight)			
		.append("svg:g")		
		.attr("transform", "translate(" + visWidth/4 + ", " + visHeight/2 + ")");  //put the starting point in the center-ish
	
	
	//request the json
	d3.json("/tree/json/" + nid, function(json) {
		
		//store the url for this person		
		var personName = json.name.toLowerCase().replace(/\./g,'-').replace(/ /g,'-');
		//update the URL
		if(history.pushState && history.replaceState) {
			//push current id, title and url
			
			var current = location.href + "";
			current = current.substr(0, current.search("tree/")); 			
 			history.pushState({"id":nid}, document.title, current + 'tree/' + personName);
		
		}				
		
		
		//set the base name and nid because it is expected for every node, 
		json.descendants.name = json.name;
		json.ancestors.name = json.name;
		json.workedWith.name = json.name;
		json.descendants.nid = json.nid;
		json.ancestors.nid = json.nid;
		json.workedWith.nid = json.nid;		
		
		jQuery(".title").text("Tree for " + json.name);	
		
		
		// Create a tree "canvas"

		var tree = d3.layout.tree().size([visWidth/2 ,visHeight/3]);	

		//which way do we want the path to go, up or down, or sidewaysss
		var diagonalDescendant = d3.svg.diagonal().projection(function(d) { return [d.x, (d.y)]; });
				
	 
		var nodesDescendant = tree.nodes(json.descendants);
		var linksDescendant = tree.links(nodesDescendant);				
		
		
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
		.append('title').text(function(d){return (typeof mentor_type_text[d.target.type]!='undefined') ? mentor_type_text[d.target.type] : d.target.type});
				
		
		
		var nodeDescendant = vis.selectAll("g.descendant")
		.data(nodesDescendant)
		.enter().append("svg:g")
		.attr("transform", function(d) { return "translate(" + d.x + "," + (d.y) + ")"; })
		
 		nodeDescendant.append("svg:rect")
		.attr('fill','white')
		.attr('stroke','#ccc')
		.attr("height", function(d){return returnNodeProperties(d).height; })
		.attr("width", function(d){return returnNodeProperties(d).width; })
		.attr("x", function(d){return returnNodeProperties(d).width /2 *-1; })
		.attr("y", function(d){return returnNodeProperties(d).height /2 * -1; })
		.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";});
		

		nodeDescendant.append("svg:image")
			.attr("class", "circle")
			.attr("cursor","pointer")
			.attr("xlink:href", resourcePath + 'person.png')		  			  
			.attr("height", function(d){return returnNodeProperties(d).height - 5; })
			.attr("width", function(d){return returnNodeProperties(d).width - 5; })
			.attr("x", function(d){return returnNodeProperties(d).width /2.2 *-1; })
			.attr("y", function(d){return returnNodeProperties(d).height /2.3 * -1; })
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";})	//hide this one because we are re-adding the source person in the ancestors section
		  	.on("click",function(d){reorderTree(d.nid)})
			.append('title').text(function(d){return "Click to center on " + d.name;});
			
			
		//this rect block out the path lines for the name tag
 		nodeDescendant.append("svg:rect")
			.attr('fill','white')
			.attr('stroke','none')
			.attr("height", function(d){return returnNodeProperties(d).font*2 + 2})
			.attr("width", function(d){return returnNodeProperties(d).width})
			.attr("x", function(d){return returnNodeProperties(d).width/2 * -1})
			.attr("y", function(d){return returnNodeProperties(d).height/2})
			.attr("visibility", function(d){return (returnNodeProperties(d).textAnchor=='right') ? "hidden" : "visible";});		  
					
		//The first name
		nodeDescendant.append("svg:a")
		.attr("xlink:href",function(d){return "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("dx", function(d){ return returnNodeProperties(d).textX})
			.attr("dy", function(d){ return returnNodeProperties(d).textY})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return splitName(d.name)[0]; })
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";});	//hide this one because we are re-adding the source person in the ancestors section

		//The second name
		nodeDescendant.append("svg:a")
		.attr("xlink:href",function(d){return "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("dx", function(d){ return returnNodeProperties(d).textX})
			.attr("dy", function(d){ return returnNodeProperties(d).textY+returnNodeProperties(d).font})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return splitName(d.name)[1]})
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";});	//hide this one because we are re-adding the source person in the ancestors section
			
		
		
		
		
		/*	***************************
			build the worked with
			***************************
		*/	


		//this is the sideways tree, it needs to be a little longer to clear the vertical trees.
		var horzTreeX = 400;
		var horzTreeY = 450;
		tree = d3.layout.tree().size([horzTreeX,horzTreeY]);

		
		
		var nodesWorkedWith = tree.nodes(json.workedWith);
		var linksWorkedWith = tree.links(nodesWorkedWith);				
		
		//again use a diff for the offset, but we have to get crafty because now we are offsetting the X and Y, so use the tree size as well (below where you see horzTreeX/N)
	
		//no decendents, or ancestors?	 
		if (typeof linksDescendant != 'undefined' && linksDescendant.length != 0){
			var diff = linksDescendant[0].source.x;		
		}else if (typeof linksAncestor != 'undefined' &&  linksAncestor.length != 0){
			var diff = linksAncestor[0].source.x;		
		}else{
			var diff = horzTreeX/1.5;	
		}
		
		

		
		var diagonalWorkedWith = d3.svg.diagonal().projection(function(d) { return [(d.y*-1)+diff, d.x-horzTreeX/2]; });
		
		
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
		.append('title').text(function(d){return (typeof worked_with_type_text[d.target.type]!='undefined') ? worked_with_type_text[d.target.type] : d.target.type});
			
		
		
		var nodesWorkedWith = vis.selectAll("g.descendant")
		.data(nodesWorkedWith)
		.enter().append("svg:g")
		.attr("transform", function(d) { return "translate(" + (d.y*-1) + "," + d.x + ")"; })
		
 		nodesWorkedWith.append("svg:rect")
		.attr('fill','white')
		.attr('stroke','#ccc')
		.attr("height", function(d){return returnNodeProperties(d).height})
		.attr("width", function(d){return returnNodeProperties(d).width})
		.attr("x", function(d){return returnNodeProperties(d).width/2 * -1  +(horzTreeX/1.5) })
		.attr("y", function(d){return returnNodeProperties(d).height/2* -1 -(horzTreeY/2.25) })		
		.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";});
		

		nodesWorkedWith.append("svg:image")
			.attr("class", "circle")
			.attr("cursor","pointer")
			.attr("xlink:href", resourcePath + 'person.png')		  			  
			.attr("height", function(d){return returnNodeProperties(d).height-2})
			.attr("width", function(d){return returnNodeProperties(d).width-2})
			.attr("x", function(d){return returnNodeProperties(d).width/2 * -1  +(horzTreeX/1.5) })
			.attr("y", function(d){return returnNodeProperties(d).height/2* -1 -(horzTreeY/2.25) })	
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";})	//hide this one because we are re-adding the source person in the ancestors section
		  	.on("click",function(d){reorderTree(d.nid)})
			.append('title').text(function(d){return "Click to center on " + d.name;});


		nodesWorkedWith.append("svg:a")
		.attr("xlink:href",function(d){return "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("dx", function(d){ return (horzTreeX/1.5) - returnNodeProperties(d).width / 2 - 4;  })
			.attr("dy", function(d){ return (horzTreeY/2.25*-1) - returnNodeProperties(d).height / 2 + returnNodeProperties(d).font;  })
			.attr("text-anchor", function(d){return "end";  })
			.attr("font-size",function(d){return returnNodeProperties(d).font})	
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";})
			.text(function(d) { return splitName(d.name)[0]; });	
			
		nodesWorkedWith.append("svg:a")
		.attr("xlink:href",function(d){return "/node/" + d.nid})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr("dx", function(d){ return (horzTreeX/1.5) - returnNodeProperties(d).width / 2 - 4;  })
			.attr("dy", function(d){ return (horzTreeY/2.25*-1) - returnNodeProperties(d).height / 2 + returnNodeProperties(d).font *2;  })
			.attr("text-anchor", function(d){return "end";  })
			.attr("font-size",function(d){return returnNodeProperties(d).font})	
			.attr("visibility", function(d){return (d.depth==0) ? "hidden" : "visible";})
			.text(function(d) { return splitName(d.name)[1]; });				
	 
 
















		
		
		
		//now build it for the ancestors
		//reset the tree layout
		tree = d3.layout.tree().size([visWidth/2,visHeight/3]);	
		
		var nodesAncestor = tree.nodes(json.ancestors);
		var linksAncestor = tree.links(nodesAncestor);

		//so, depending on how many children, configuration, etc the two trees will never line up automatically unless they are identical
		//so subtact the diffrece from the two zero nodes and use that as an offset for the X for whatever we do, kind of a pian...
		var diff = 0;
		 
		if (typeof linksDescendant[0] != 'undefined' && linksDescendant.length != 0){
			 
			if (typeof linksAncestor[0] != 'undefined' && linksAncestor.length != 0){
			
				if (linksDescendant[0].source.x>linksAncestor[0].source.x){
					diff=linksDescendant[0].source.x-linksAncestor[0].source.x;
				}
				
				if (linksDescendant[0].source.x<linksAncestor[0].source.x){
					diff=linksAncestor[0].source.x-linksDescendant[0].source.x;			
				}		
				
			}

		} 

		//special situtaion when there are no decendents that balance out the X placement, but we have colaborators
		if (json.descendants.children.length==0 && json.workedWith.children.length != 0){
			diff = 20;			
			if (json.ancestors.children.length <= 3){
				diff = -30;
			}
			if (json.ancestors.children.length == 0){
				diff = 20;
			}			
			
		}
		
		



		var diagonalAncestor = d3.svg.diagonal().projection(function(d) { return [d.x-diff, d.y*-1]; });		
		
		 
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
		.append('title').text(function(d){return (typeof mentor_type_text[d.target.type]!='undefined') ? mentor_type_text[d.target.type] : d.target.type});
			
			 
		var nodeAncestor = vis.selectAll("g.descendant")
		.data(nodesAncestor)
		.enter().append("svg:g")
		.attr("transform", function(d) { return "translate(" + d.x + "," + (d.y*-1) + ")"; })
		
 		nodeAncestor.append("svg:rect")
		.attr('fill','white')
		.attr('stroke', function(d){if (d.depth==0){return "#000";} return '#ccc';})
		.attr('stroke-width', function(d){if (d.depth==0){return 2;} return 1;})		
		.attr("height", function(d){return returnNodeProperties(d).height; })
		.attr("width", function(d){return returnNodeProperties(d).width; })
		.attr("x", function(d){return returnNodeProperties(d).width /2 *-1 - diff; })
		.attr("y", function(d){return returnNodeProperties(d).height /2 * -1; });
		
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
			
		//this rect block out the path lines for the name tag
 		nodeAncestor.append("svg:rect")
			.attr('fill','white')
			.attr('stroke','none')
			.attr("height", function(d){return returnNodeProperties(d).font*2 + 2})
			.attr("width", function(d){return returnNodeProperties(d).width})
			.attr("x", function(d){return returnNodeProperties(d).width/2 * -1 - diff})
			.attr("y", function(d){return returnNodeProperties(d).height/2 * -1 - returnNodeProperties(d).font*2 - 2})
			.attr("visibility", function(d){return (returnNodeProperties(d).textAnchor=='right') ? "hidden" : "visible";});		  
					
		//The first name
		nodeAncestor.append("svg:a")
		.attr("xlink:href",function(d){if (d.depth==0){return "/node/" + nid;} return "/node/" + d.nid;})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr('font-weight', function(d){if (d.depth==0){return "bold";} return 'normal';})
			.attr("dx", function(d){ return returnNodeProperties(d).textX - diff})
			.attr("dy", function(d){ return (returnNodeProperties(d).textAnchor=='right') ? returnNodeProperties(d).textY: returnNodeProperties(d).textY *-1 - 2;})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return (d.depth==0) ? d.name :  splitName(d.name)[0]});

		//The second name
		nodeAncestor.append("svg:a")
		.attr("xlink:href",function(d){if (d.depth==0){return "/node/" + nid;} return "/node/" + d.nid;})
		.attr("xlink:title",function(d){return "View " + d.name + "'s profile";})			
		.append("svg:text")
			.attr('font-weight', function(d){if (d.depth==0){return "bold";} return 'normal';})		
			.attr("dx", function(d){ return returnNodeProperties(d).textX - diff})
			.attr("dy", function(d){ return (returnNodeProperties(d).textAnchor=='right') ? returnNodeProperties(d).textY + + returnNodeProperties(d).font: returnNodeProperties(d).textY *-1 - 2 + + returnNodeProperties(d).font;})
			.attr("text-anchor", function(d){ return returnNodeProperties(d).textAnchor})
			.attr("font-size", function(d){return returnNodeProperties(d).font; })
			.text(function(d) { return (d.depth==0) ? "" :  splitName(d.name)[1]});
			
		
			
		
		
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
			if (numOfSiblings<=comfortableSiblingCount){
			
				//if they they have or more siblings put their text under them
				if (numOfSiblings>3){ 
					textAnchor="middle";
					textX = 0;
					textY = baseNodeSize /2 + font;				
				}
			
				
				return {"height":baseNodeSize,"width":baseNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};
				
			}else{
			
				//otherwise we need to scale them down to make room
				
				useNodeSize = baseNodeSize - (numOfSiblings * 2);
				font = 10;
	
				//at this level really the max number of nodes you can have and still put the text to the side is 3-ish, 
				//if more than that put it under the node
				if (numOfSiblings>=3){ textX = useNodeSize / 2; textX = baseNodeSize / 2 + font; }
				
				
				return {"height": useNodeSize,"width":useNodeSize, "font": font, "textX" : textX, "textY" : textY}
				
			}
			
			
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
				
				useNodeSize = baseNodeSize - (numOfSiblings * 2.5); 
				font = 9;
				
				//text haas to go under/above them no matter what
				textAnchor="middle";
				textX = 0;
				textY = useNodeSize /2 + font;						
	
 			 
				return {"height":useNodeSize,"width":useNodeSize, "font": font, "textX" : textX, "textY" : textY, "textAnchor" : textAnchor};
			
			}
			
			
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
	 
	 //set the width of the chart div so its not jarring
	 jQuery('#chart').css('height',visHeight + "px");
	 jQuery('#chart').css('width',visWidth + "px");		 
	 
	 nid=newnid;
	 
	 //fade it out
	
	jQuery("#chart").animate({ opacity: 0 },function() {
		jQuery("#chart").empty();
		
		//scroll to the middle so it is in view
		var offset = jQuery('#chart').offset();
		jQuery('html, body').animate({scrollTop:offset.top+visHeight/4}, 'fast');
		
		buildTree();
		jQuery("#chart").animate({ opacity: 100 });
			 
		
		
	});		 
	
	
		if(history.pushState && history.replaceState) {
			window.onpopstate = function(e) {
				reorderTree(e.state.id);
			};	
		}
		 
	 
 }












