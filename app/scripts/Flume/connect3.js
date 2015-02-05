/**
TODO: See README.md
**/
var FLUME = FLUME || {};

FLUME.connect = (function($, _, jsPlumb) {
    var DEBUG = true;
    if (DEBUG) {
        var q = 0;
    }
    /***************************
     *  PROPERTIES
     ***************************/
    var selectedConnection;

    var connectorPaintStyle = {
        lineWidth: 2,
        strokeStyle: "#428bca",
        joinstyle: "round",
        outlineColor: "#357ebd",
        outlineWidth: 1
    };

    var connectorHoverStyle = {
        lineWidth: 2,
        strokeStyle: "#428bca",
        outlineWidth: 2,
        outlineColor: "#357ebd"
    };

    var endpointHoverStyle = {
        fillStyle: "#5C96BC"
    };

    var endpointPaintStyle = {
            strokeStyle: "#3D85C6",
            fillStyle: "#9CC2E2",
            radius: 3,
            lineWidth: 1
        }

    var myEndpoint = {
        endpoint: "Dot",
        paintStyle: endpointPaintStyle,
        isSource: true,
        isTarget: true,
        connector: ["Flowchart", {
            stub: [10, 10],
            gap: 5,
            cornerRadius: 5,
            alwaysRespectStubs: true
        }],
        connectorOverlays: [
            ["Arrow", {
                width: 10,
                length: 10,
                location: 1,
                id: "arrow"
            }]
        ],
        connectorStyle: connectorPaintStyle,
        hoverPaintStyle: endpointHoverStyle,
        connectorHoverStyle: connectorHoverStyle
    };

    /***************************
     *  EVENT HANDLERS
     ***************************/

    /**
     *  Connection Click Handler -- Deletes Connection
     *  Modify this to just set as selected and set keyup handler
     *
     **/
    jsPlumb.bind("click", function(conn, event) {
        /**
         * _.findWhere($._data($("#canvas").get(0), "events").keyup, {namespace: "removeConnection"})
         * This returns the removeConnection event handler for the canvas
         * or undefined if it has not been set yet
         *
         * if(_.findWhere($._data($("#canvas").get(0), "events").keyup, {namespace: "removeConnection"}) === undefined)
         *      $("#canvas").on("keyup.removeConnection", conn, removeConnection);
         * else
         *      _.findWhere($._data($("#canvas").get(0), "events").keyup, {namespace: "removeConnection"}).data = conn
         **/
        $(".selectedNode").toggleClass("selectedNode").removeClass("active");
        jsPlumb.select().removeClass("selectedConnector");
        conn.addClass("selectedConnector");
        conn.canvas.id = conn.id;
        if (_.findWhere($._data($("#canvas").get(0), "events").keyup, {
                namespace: "removeConnection"
            }) === undefined) {
            $("#canvas").on("keyup.removeConnection", conn, removeConnection);
        } else {
            _.findWhere($._data($("#canvas").get(0), "events").keyup, {
                namespace: "removeConnection"
            }).data = conn;
        }
        //$("#canvas").on("keyup.removeConnection", conn, removeConnection);
        //document.documentElement.addEventListener("keyup", removeConnection, false);
    });

    /**     
     *  Make Connection
     *
     **/
    jsPlumb.bind("connection", function(info, originalEvent) {
        console.log(info);
        var sourceNode = $("#" + info.sourceId).data("nodeData");
        var targetNode = $("#" + info.targetId).data("nodeData");
        var parentAgent = $("#" + info.sourceId).parent().data("agent");
        console.log(parentAgent);
        try {
            parentAgent.addConnection(sourceNode, targetNode);
            writeConfig(parentAgent);
        } catch (err) {
            
            showError(err);
            jsPlumb.detach(info.connection);
        }
    });

    jsPlumb.bind("connectionMoved", function(info, event) {
        console.log("Connection Moved");
        var parentAgent = $("#" + info.originalSourceId).parent().data("agent");
        parentAgent.removeConnection(info.originalSourceId, info.originalTargetId);
    });

    var setAgentHandlers = function(agent) {
        $("#" + agent.id).on("resize", function(e, ui) {
            var left = 71,
                top = 49,
                outerWidth = 79,
                outerHeight = 57;
            $(this).children(".node").each(function(index) {
                if ($(this).position().left > left)
                    left = $(this).position().left;
                if ($(this).position().top > top)
                    top = $(this).position().top;
            });
            var minWidth = left + (outerWidth * 1.2);
            var minHeight = top + (outerHeight * 1.2);
            $(this).resizable("option", "minWidth", minWidth);
            $(this).resizable("option", "minHeight", minHeight);
        });

        /**
         *  Event Handler for Agent
         *  Use single_double_click JQuery extension since we need to bind for both
         *  click and double click on the same element
         *
         **/
        $("#" + agent.id).single_double_click(function(event) {
                setSelectedAgent(agent);
            },
            function(event) {
                createNode(event, agent);
            });
    };

    var setNodeHandlers = function(daNode) {
        /**
         *  Node Click Handler
         *
         **/
        $("#" + daNode.id).click(function(event) {
            var currentNode = $("#" + daNode.id).data("nodeData");
            $("#nodePropertyPanel").html(layoutProperties(currentNode));

            $(".nodeProperty").change(function() {
                //Update Node Object
                currentNode.configProperties[$(this).attr("name")].value = $(this).val();
                writeConfig($("#" + daNode.id).parent().data("agent"));
            });

            $(".nodeName").change(function() {
                currentNode.name = $(this).val();
                $("#" + currentNode.id).text($(this).val());
                writeConfig($("#" + daNode.id).parent().data("agent"));
            });
            setSelectedNode(currentNode);
            jsPlumb.repaintEverything();
            event.stopPropagation();
            event.preventDefault();

        }); // End Node click()

        /**
         *  Node Double Click Handler
         *
         **/
        $("#" + daNode.id).dblclick(function() {
            //Do nothing and stop event propagation
            event.stopPropagation();
        }); //End Node dblClick()

        /**
         *  Node Keyup Handler
         *
         **/
        $("#" + daNode.id).on("keyup.nodeDelete", function(e) {
            if ((e.keyCode == 8 || e.keyCode == 46) && $(this).hasClass("selectedNode")) {
                var parentAgent = $("#" + daNode.id).parent().data("agent"); //Get the parent agent of this node
                FLUME.removeNodeFromAgent(parentAgent, daNode); //remove node and any connections from Agent
                jsPlumb.remove($("#" + daNode.id)); //Remove agent form jsPlumb UI
                writeConfig(parentAgent);
                event.stopPropagation();
            }
        }); // End Node Keyup()
    }

    $("#canvas").on("keyup.agentDelete", ".agent", function(e) {
        //console.log(this);
        if ((e.keyCode == 46 || e.keyCode == 8) && $(this).hasClass("selectedNode")) {
            FLUME.removeAgentFromConfig(this.id); //remove node and any connections from Agent
            jsPlumb.remove($(this));
        }
    });

    /**************************************
     *  FUNCTIONS
     **************************************/

    /**
     *  Create a New Agent
     *
     **/
    var agentOffset = 12;
    var createAgent = function(agent) {
        if (agent === undefined) {
            console.log("Creating New Agent");
            agent = FLUME.getAgentInstance();
            //var agentId = Math.guid();
            //Generate Random id and Name
            if (DEBUG) {
                agent.id = "agent" + q;
                q++;
            } else {
                agent.id = Math.guid();
            }
        }
        else{
            console.log("Duping Existing Agent")
            agent = FLUME.getAgentInstance(agent);
        }

        var box = $('<div tabindex="-1">').attr('id', agent.id).addClass('agent').html('<small><span>Agent</span><br/><span>' + agent.name + '</span></small></div>');
        $("#canvas").append(box);
        $("#" + agent.id).data("agent", agent);
        FLUME.addAgentToConfig(agent);
        jsPlumb.draggable(box, {
            containment: 'parent'
        });

        var x = agentOffset; //Left
        var y = agentOffset; //top
        agentOffset += 12;
        box.css({
            'top': y,
            'left': x
        });
        $(".agent").resizable({
            minWidth: 150,
            minHeight: 100,
            containment: "parent",
            handles: "all"
        });

        setAgentHandlers(agent);
        $("#nodePropertyPanel").html(layoutProperties(agent));
    }; //End createAgent()


    /**
     *  Create a New Node
     *
     **/
    var createNode = function(e, agent) {
        var category = $(".selected").attr("category");
        var type = $(".selected").attr("type");
        //console.log("New Node: " + type + " " + category);

        if (category === undefined || type === undefined) {
            alert("You have to choose a Source, Sink or Channel before it can be added");
        } else {
            var daNode = FLUME.getNodeInstance(category, type); // Get New Node Instance

            //Generate Random id and Name
            if (DEBUG) {
                daNode.id = "node" + q;
                daNode.name = daNode.id;
                q++;
            } else {
                daNode.id = Math.guid();
                daNode.name = "" + new Date().getTime();
                daNode.name = daNode.name.substring(6, 13);
            }

            var box = $('<div tabindex=24>').attr('id', daNode.id).addClass('node window ' + daNode.category).html("<small>" + daNode.printName + "<br/>" + daNode.name + "</small></div>");
            $("#" + agent.id).append(box);
            $("#" + daNode.id).data("nodeData", daNode);
            setSelectedNode(daNode);

            FLUME.addNodeToAgent(agent, daNode); //Add this node to the containing agent
            
            jsPlumb.draggable(box, {
                containment: 'parent'    
            });

            var offset = $("#" + agent.id).offset();
            var x = (e.pageX - offset.left); //Left
            var y = (e.pageY - offset.top); //top

            box.css({
                'top': y,
                'left': x
            });
            
            var endpoints = ["TopLeft", "TopCenter", "TopRight", "Left", "Right", "BottomLeft", "BottomCenter", "BottomRight"];
            for (var p in endpoints) {
                myEndpoint.anchor = endpoints[p];
                jsPlumb.addEndpoints(box, [myEndpoint]);
            }

            //Clear the selection that is occuring
            if (window.getSelection)
                window.getSelection().removeAllRanges();
            else if (document.selection)
                document.selection.empty();

            var currentNode = $("#" + daNode.id).data("nodeData");
            $("#nodePropertyPanel").html(layoutProperties(currentNode));
            setNodeHandlers(daNode);

            //resize parent div
            var nodeBottom = $("#" + daNode.id).offset().top + $("#" + daNode.id).outerHeight(true);
            var nodeRight = $("#" + daNode.id).offset().left + $("#" + daNode.id).outerWidth(true);
            var agentBottom = $("#" + agent.id).offset().top + $("#" + agent.id).outerHeight(true);
            var agentRight = $("#" + agent.id).offset().left + $("#" + agent.id).outerWidth(true);

            /**
                TODO:
                    If resize takes agent beyond the bounds of the canvas
                    make the canvas scrollable and resize
                    see http://jsfiddle.net/Ka7P2/571/
            **/
            if (nodeBottom > agentBottom) {
                $("#" + agent.id).height($("#" + agent.id).height() + ((nodeBottom - agentBottom) * 1.15));
            }
            if (nodeRight > agentRight) {
                $("#" + agent.id).width($("#" + agent.id).width() + ((nodeRight - agentRight) * 1.15));
            }
            writeConfig(agent);
        }
    }; // End createNode()

    /**
     *  Show Agent Properties
     *
     **/
    var setSelectedAgent = function(agent) {
        jsPlumb.select().removeClass("selectedConnector");
        document.documentElement.removeEventListener("keyup", removeConnection);
        $(".selectedNode").toggleClass("selectedNode").removeClass("active");
        $("#" + agent.id).addClass("selectedNode");
        $("#nodePropertyPanel").html(layoutProperties(agent));
        $(".selectedNode").focus();
        $(".nodeName").change(function() {
            //if name was changed
            agent.name = $(this).val();
            $("#" + agent.id + " span:eq(1)").text($(this).val());
            writeConfig(agent);
        });

        jsPlumb.repaintEverything();
    }; //End showAgentProperties()

    /**
     *  Set Selected Node
     *
     **/
    var setSelectedNode = function(node) {
        jsPlumb.select().removeClass("selectedConnector");
        document.documentElement.removeEventListener("keyup", removeConnection);
        $(".selectedNode").toggleClass("selectedNode").removeClass("active");
        $("#" + node.id).addClass("selectedNode").addClass("active");
        //Bind a delete keypress event to it to delete it
        $(".selectedNode").focus();

    }; // End setSelectedNode()

    /**
     *  Layout Properties
     *  TODO: Modify to use a templating mechanism
     **/
    var layoutProperties = function(node) {
        var html = "<table id='nodeConfigPropertiesTable'>";
        html += "<tr><td colspan=3><strong>Config Properties for " + node.printName + "</strong><br/></td></tr>"
        html += "<tr><td style='padding-left: 10px;'><strong>Name: </strong></td><td>&nbsp;</td>";
        html += "<td><input class='nodeName form-control' type='text' length='20' name='name' value='" + node.name + "' tabindex='1'></td></tr>";

        var configProps = node.configProperties;
        var i = 2;
        for (property in configProps) {
            if (configProps[property].valueType != "Array") {
                html += "<tr><td style='padding-left: 10px;'><strong>" + configProps[property].printName + "</strong></td><td>&nbsp;</td>";
                //console.log(configProps[property].printName + " " + configProps[property].valueType);
                if (configProps[property].valueType == "String" || configProps[property].valueType == "Number") {
                    html += "<td><input class='nodeProperty form-control' type='text' length='20' name='" + configProps[property].name + "'' value='" + configProps[property].value + "' tabindex='" + i + "'></td>";
                } else if (configProps[property].valueType == "Boolean") {
                    html += "<td><input class='nodeProperty' type='checkbox' length='20' value='" + configProps[property].value + "' tabindex='" + i + "'></td>";
                }

                html += "</tr>";
                i++;
            }
        }
        html += "</table>";

        return html;
    }; // End layoutProperties()


    /**
     *  Write Config
     *
     **/
    var writeConfig = function() {
        var agents = FLUME.getAgents();
        //console.log(agents);
        var node;
        var category;
        var configProps;
        var property;
        var html = "";

        for (agentId in agents) { //for each agent in agents
            agent = agents[agentId];
            //Properties
            var agentHTML = "";
            var propsHTML = "";
            var bindHTML = "\n\n#Bindings";
            agentHTML += "\n\n#Agent " + agent.name

            for (nodeType in agent.nodes) { //For each nodeType (Category) in agent.nodes
                category = agent.nodes[nodeType];
                if (category.length > 0) {
                    agentHTML += "\n" + agent.name + "." + nodeType + " =";

                    for (var i = 0; i < category.length; i++) { // For each node in nodeType (Category)
                        node = category[i];
                        propsHTML += "\n\n#" + node.name + " properties";
                        agentHTML += " " + node.name;
                        configProps = node.configProperties; //Get all Config Properties of the Node
                        for (propertyName in configProps) {
                            property = configProps[propertyName];
                            if (property.value != "") {
                                //<agentName>.<nodeType>.<nodeName>.<propertyName> = <propertyValue>
                                propsHTML += "\n" + agent.name + "." + nodeType + "." + node.name + "." + property.name + " = " + property.value;
                            }
                        }
                        //console.log(node.name + " links to : " + agent.connections[node.id]);
                        if (agent.connections[node.id]) { //Bindings
                            //console.log(agent.connections[node.id]);
                            /*
                                <agentName>.sources.<nodeName>.channels = <channelName>
                                <agentName>.sinks.<nodeName>.channel = <channelName>
                            */
                            var tNode = FLUME.getNodeById(agent.connections[node.id][i]);
                            //console.log(tNode);
                            if (tNode.category === "channels".toLowerCase()) { //ERROR
                                for (var n = 0; n < agent.connections[node.id].length; n++) {
                                    //console.log(node.name + ": " + tNode.category);
                                    //console.log(agent.name + "." + node.category + "." + node.name + "." + tNode.category + " = " + tNode.name);
                                    bindHTML += "\n" + agent.name + ".sources." + node.name + ".channels = " + tNode.name;
                                }
                            } else if (tNode.category === "sinks".toLowerCase()) {
                                //console.log(node.name + ": " + tNode.category);
                                bindHTML += "\n" + agent.name + ".sinks." + node.name + ".channel = " + tNode.name;
                            }
                        }
                    }
                }
            }
            html += agentHTML + propsHTML + bindHTML;
        }
        $("#flumeConfigOutputPanel").html("<pre>" + html + "</pre>");

    }; //End writeConfig()

    /**
     *  Save Config
     *
     **/
    var saveConfig = function() {
        /**
         * Check for Local Storage
         **/
        if (typeof(Storage) !== "undefined") {
            // Yes! localStorage and sessionStorage support!
            var FLUME_CONFIG = {};
            FLUME_CONFIG.agents = FLUME.getAgents();
            $("#canvas .agent").each(function(idx, agent) {
                var $agent = $(agent);
                var currentAgent = FLUME_CONFIG.agents[$agent.attr('id')]
                currentAgent.ui = {};
                currentAgent.ui.left = parseInt($agent.css("left"), 10);
                currentAgent.ui.top = parseInt($agent.css("top"), 10);
                currentAgent.ui.width = $agent.css("width");
                currentAgent.ui.height = $agent.css("height");
                $("#canvas .node").each(function(idx, node) {
                    //console.log(idx);
                    //console.log(node);
                    var $node = $(node);

                    var category = currentAgent.nodes[$node.data("nodeData").category];
                    _.each(category, function(confNode){
                        confNode.ui = {};
                        confNode.ui.left = parseInt($node.css("left"), 10);
                        confNode.ui.top = parseInt($node.css("top"), 10);
                    }, $node);
                });
            });

            FLUME_CONFIG.connections = [];

            $.each(jsPlumb.getConnections(), function(idx, connection) {
                FLUME_CONFIG.connections.push({
                    connectionId: connection.id,
                    pageSourceId: connection.sourceId,
                    pageTargetId: connection.targetId
                });
            });
            localStorage.setItem('flumeConfig', JSON.stringify(FLUME_CONFIG));
        } else {
            // Sorry! No web storage support..
        }
    }; // End saveConfig()


    /**
     *  Load Config
     *
     **/
    var loadConfig = function() {
        
        var FLUME_CONFIG = JSON.parse(localStorage.getItem('flumeConfig'));
        console.log(FLUME_CONFIG);
        var agentIdx = 0;
        if (FLUME_CONFIG) {
            if (confirm("You are about to load a saved config.  This will overwrite your existing config. Are you sure?")) {
                //Clear the canvas First
                if (jsPlumb.getAllConnections())
                    jsPlumb.deleteEveryEndpoint();
                
                FLUME.nullAgents();
                $("#canvas").empty();

                //Load Agents to FLUME object
                //FLUME.setAgents(FLUME_CONFIG.agents);
                var agents = FLUME_CONFIG.agents;
                
                //load UI
                for (agentId in agents) { //for each agent in agents
                    var agent = agents[agentId];
                    createAgent(agent);
                    resizeElement(agentId, agent.ui.width, agent.ui.height);
                    repositionElement(agentId, agent.ui.left, agent.ui.top);
                    
                    for (nodeType in agent.nodes) { //For each nodeType (Category) in agent.nodes
                        category = agent.nodes[nodeType];
                        for (var nodeIdx = 0; nodeIdx < category.length; nodeIdx++) {//For each node in Category
                            var node = category[nodeIdx]; //Get the node
                            var box = $('<div tabindex=24>').attr('id', node.id).addClass('node window ' + node.category).html("<small>" + node.printName + "<br/>" + node.name + "</small></div>");
                            $("#" + agentId).append(box);
                            $("#" + node.id).data("nodeData", node);

                            jsPlumb.draggable(box, {
                                containment: 'parent'
                            });

                            var endpoints = ["TopLeft", "TopCenter", "TopRight", "Left", "Right", "BottomLeft", "BottomCenter", "BottomRight"];
                            repositionElement(node.id, node.ui.left, node.ui.top);

                            for (var p in endpoints) {
                                myEndpoint.anchor = endpoints[p];
                                jsPlumb.addEndpoints(box, [myEndpoint]);
                            }
                            setNodeHandlers(node);
                            delete node.ui;
                        }
                    }
                    delete agent.ui;
                    agentIdx++;
                }
                jsPlumb.setSuspendEvents(true);
                var connections = FLUME_CONFIG.connections;
                $.each(connections, function(index, elem) {
                    console.log(myEndpoint);
                    var conn = jsPlumb.connect({
                        source: elem.pageSourceId,
                        target: elem.pageTargetId,
                        paintStyle: connectorPaintStyle,
                        hoverPaintStyle:connectorHoverStyle,
                        endpointStyle:endpointPaintStyle,
                        endpointHoverStyle:endpointHoverStyle,
                        endpoint:"Dot",
                        anchors: ["BottomCenter", "Left"],
                        overlays: [
                            ["Arrow", {
                                width: 10,
                                length: 10,
                                location: 1,
                                id: "arrow"
                            }]
                        ],
                        connector: ["Flowchart", {
                            stub: [10, 10],
                            gap: 5,
                            cornerRadius: 5,
                            alwaysRespectStubs: true
                        }],
                    });
                });
                jsPlumb.setSuspendEvents(false);
                writeConfig();
            }

        } else {
            showError("Sorry no config exists in local storage for me to load?");
        }
    }; // End loadConfig()

    /**
     *  Load Config
     *
     **/
    var removeConnection = function(e) {
        e.stopPropagation();
        console.log(e);
        var conn = e.data;
        var isSelected = /selectedConnector/i.test($("#" + conn.id).attr("class"));
        if ((e.which == 8 || e.which == 46) && isSelected) {
            var parentAgent = $("#" + conn.sourceId).parent().data("agent");
            parentAgent.removeConnection(conn.sourceId, conn.targetId);
            jsPlumb.detach(conn); //Remove connection from jsPlumb UI
            writeConfig(parentAgent);
            //$("#canvas").off("keyup.removeConnection");
        }
        return false;
    }; //End removeConnection();


    /***************************
     *  UTILITY FUNCTIONS
     ***************************/
    /**
     *  Reposition Element
     *
     **/
    var repositionElement = function(id, posX, posY) {
        //debugger;
        $('#' + id).css('left', posX);
        $('#' + id).css('top', posY);

        jsPlumb.repaint(id);
    }; //End respositionElement()

    var resizeElement = function(id, width, height){
        $('#' + id).css('width', width);
        $('#' + id).css('height', height);
    }

    /**
     *  Show Error
     *
     **/
    var showError = function(err) {
        $("#errorPanel").html('<div id="errorPanel" class="alert alert-dismissable alert-danger"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h4>Alert!</h4>' + err + '</div>');
    }; //End showError()

    /***************************
     *  SETUP AND INIT
     ***************************/
    jsPlumb.importDefaults({
        Container: $("#canvas")
    });
    createAgent();

    /**
    var svgFilter = '<defs id="defs4009"><filter color-interpolation-filters="sRGB" id="filter4017"> \
      <feFlood result="flood" flood-color="rgb(241,194,50)" flood-opacity="0.8" id="feFlood4019" /> \
      <feComposite in2="SourceGraphic" operator="in" in="flood" result="composite1" id="feComposite4021" /> \
      <feGaussianBlur result="blur" stdDeviation="19" id="feGaussianBlur4023" /> \
      <feOffset result="offset" dy="0" dx="0" id="feOffset4025" /> \
      <feComposite in2="offset" operator="over" in="SourceGraphic" result="composite2" id="feComposite4027" /> \
    </filter></defs>';
    **/

    return {
        createAgent: createAgent,
        saveConfig: saveConfig,
        loadConfig: loadConfig,
    };

})($, _, jsPlumb);
