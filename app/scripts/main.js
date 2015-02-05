/**
TODO
  1. Tooltips
  2. Config Saving and Loading
  3. Better Node Graphics on Left Accordians
**/
$("#my-fluid-container").hide();
$('#pageLoadingModal').modal('show'); //Show the loading modal

$(document).ready(function() {
    /**************************************
     *  Setup and Initialize
     **************************************/
    var selectedNode;

    /**
     * Load up the Side Nav with the Sources and Sinks
     **/

    var btn, panel;
    for (nodeType in FLUME.nodes) {
        //console.log(nodeType);
        for (nodeName in FLUME.nodes[nodeType]) {
            var node = FLUME.nodes[nodeType][nodeName];
            btn = "<button class='nodeButton " + node.category + "' category= '" + node.category + "' type='" + node.type + "' alt='" + node.printName + "'>" + node.printName + "</button>";
            //btn = "<div class='nodeButton " + node.category + "' category='" + node.category + "' type='" + node.type +"'><span style='vertical-align: middle;'>" + node.printName + "</span></div>";
            switch (node.category) {
                case "sources":
                    panel = "#sourcesNavPanelBody";
                    break;
                case "sinks":
                    panel = "#sinksNavPanelBody";
                    break;
                case "channels":
                    panel = "#channelsNavPanelBody";
                    break;
                case "selectors":
                    panel = "#selectorsNavPanelBody";
                    break;
                case "interceptors":
                    panel = "#interceptorsNavPanelBody";
                    break;
                default:
                    panel = "#othersNavPanelBody";
            }
            $(panel).append(btn);
        }
    }


    /**
     * Make Canvas Resizable
     **/
    $("#canvas").resizable({
        minWidth: $("#canvas").width()
    });


    /**************************************
     *  BINDINGS
     **************************************/

    /**
     * Node Button Click
     **/
    $(".nodeButton").click(function() {
        var category = $(this).attr('category');
        var node = FLUME.getNodeInstance(category, $(this).attr('type'))
        $("#selectedNode").data("selectedNode", node.type);
        //console.log("Selected Node: " + $("#selectedNode").data("selectedNode") + " " + category);
        //Set Button Class
        //$(".nodeButton").addClass('btn-default');
        //$(".nodeButton").removeClass("btn-primary").removeClass("selected");

        $(".nodeButton").removeClass("active").removeClass("selected");
        $(this).addClass("selected").addClass("active");


        //$(this).addClass("btn-primary").addClass("selected");
    });

    /**
     * Clear Canvas Button Click
     **/
    $("#clearCanvasMenuButton").click(function() {
        if (jsPlumb.getAllConnections())
            jsPlumb.deleteEveryEndpoint();

        FLUME.nullAgents();

        $("#canvas").empty();
    });

    $("#saveMenuButton").click(function() {
        FLUME.connect.saveConfig();
    });

    $("#loadMenuButton").click(function() {
        FLUME.connect.loadConfig();
    });

    $(".nodeButton:first").click(); //Select the first button as default
    $("#my-fluid-container").show();
    $('#pageLoadingModal').modal('hide'); //We are done so hide the loading Modal

    /**
     *  Agent Button Click Handler
     *
     **/
    $("#newAgentButton").click(function() {
        FLUME.connect.createAgent();
    });

    /**
    * Override default event for backspace key
    *
    **/
    var rx = /INPUT|SELECT|TEXTAREA/i;
    $(document).bind("keydown keypress", function(e) {
        if (e.which == 8) { // 8 == backspace
            if (!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly) {
                e.preventDefault();
            }
        }
    });
});


/**************************************
 *  FUNCTIONS
 **************************************/

// Author:  Jacek Becela
// Source:  http://gist.github.com/399624
// License: MIT
jQuery.fn.single_double_click = function(single_click_callback, double_click_callback, timeout) {
    return this.each(function() {
        var clicks = 0,
            self = this;
        jQuery(this).click(function(event) {
            clicks++;
            if (clicks == 1) {
                setTimeout(function() {
                    if (clicks == 1) {
                        single_click_callback.call(self, event);
                    } else {
                        double_click_callback.call(self, event);
                    }
                    clicks = 0;
                }, timeout || 200);
            }
        });
    });
};

/**

$("#canvas").mousemove(function(e){
  var canvasPosition = $("#canvas").position();
  var html = "CanvasX: " + canvasPosition.left ;
  html += "<br/>CanvasY: " + canvasPosition.top ;
  html += "<br/>pageX: " + e.pageX;
  html += "<br/>pageY: " + e.pageY;
  html += "<br/>Left: " + (e.pageX - canvasPosition.left);
  html += "<br/>Top: " + (e.pageY - canvasPosition.top);

  $("#nodePropertyPanel").html(html);
});

**/
