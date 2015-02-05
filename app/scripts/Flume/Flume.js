var FLUME = FLUME || {};

FLUME = (function($, _) {
    //Private Properties

    var agents = {}; // Holds the list of possible Agents

    var nodes = {
        sources: {},
        sinks: {},
        channels: {},
        interceptors: {},
        selectors: {},
        other: {}
    };

    /**
     * Flume Config will hold the contents of the current
     * configuration being layed out
     * each entry will be an agent that contains its held sources
     * sinks and channels
     **/
    var flumeConfig = {};


    //Private Methods
    var namespace = function(nsString) {
        var parts = nsString.split('.'),
            parent = FLUME,
            i;

        if (parts[0] === "FLUME") {
            parts = parts.slice(1);
        }

        for (i = 0; i < parts.length; i += 1) {
            if (typeof parent[parts[i]] === "undefined") {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }
        return parent;
        
    };

    var init = function() {
        console.log("Starting Init");
        $.ajax({
            dataType: "json",
            url: "scripts/Flume/Nodes/nodes.json",
            async: false,
            data: "",
            success: function(data) {
                for (nodeType in data.nodes) {
                    parseNodes(nodeType, data.nodes[nodeType]);
                }

            }
        });
        parseNodes("other", ["Agent.json"]);
    };

    var parseNodes = function(nodeType, nodeList) {
        for (var i = 0; i < nodeList.length; i++) {
            //console.log("Parsing: " + nodeType + "/" + nodeList[i]);
            $.ajax({
                dataType: "json",
                url: 'scripts/Flume/nodes/' + nodeType + "/" + nodeList[i],
                async: false,
                success: function(node) {
                    //console.log(FLUME[(nodeType)]);
                    switch (node.category.toLowerCase()) {
                        case "sources":
                            nodes.sources[node.type] = node;
                            break;
                        case "sinks":
                            nodes.sinks[node.type] = node;
                            break;
                        case "channels":
                            nodes.channels[node.type] = node;
                            break;
                        case "others":
                            nodes.other[node.type] = node;
                        case "selectors":
                            nodes.selectors[node.type] = node;
                            break;
                        case "interceptors":
                            nodes.interceptors[node.type] = node;
                            break;
                        case "agent":
                            agents = node;
                    }
                }
            });
        };

    };

    var getNodeInstance = function(nodeCategory, nodeType) {
        return $.extend(true, {}, FLUME.nodes[nodeCategory][nodeType]);
    };

    var getAgentInstance = function(agent) {
        if(agent === undefined){
            agent = $.extend(true, {}, agents);
        }

        agent.addConnection = function(sourceNode, targetNode) {
            /**
             *   DAG represenation, array holds outgoing links
             *   {
             *       "a": [ "b", "c", "d" ], <-- Node a connects to nodes b,c,d
             *       "b": [ "d" ], <-- node b connects to node d
             *       "c": [ "d" ], <-- Node c connects to node d
             *       "d": [ ] <-- Node d connects to nothing
             *   }
             **/

            if (isConnectionValid(sourceNode, targetNode)) {
                if (!this.connections[sourceNode.id]) {
                    this.connections[sourceNode.id] = new Array();
                }
                this.connections[sourceNode.id].push(targetNode.id);
            }
        };

        agent.removeConnection = function(sourceNodeId, targetNodeId) {
            this.connections[sourceNodeId] = _.without(this.connections[sourceNodeId], targetNodeId);
            if (this.connections[sourceNodeId].length == 0) {
                delete this.connections[sourceNodeId];
            }
        };

        return agent;
    };

    var getAgentById = function(agentId) {
        return flumeConfig[agentId];
    };

    var addAgentToConfig = function(agent) {
        flumeConfig[agent.id] = agent;
    };

    var addNodeToAgent = function(agent, node) {
        flumeConfig[agent.id].nodes[node.category].push(node);
    };

    var removeNodeFromAgent = function(agent, node) {
        var index = flumeConfig[agent.id].nodes[node.category].indexOf(node.id);
        flumeConfig[agent.id].nodes[node.category].splice(index, 1);
        //Should also remove any connections if any
        delete flumeConfig[agent.id].connections[node.id];
    };

    var removeAgentFromConfig = function(agentId) {
        delete flumeConfig[agentId];
    }

    var getNodeById = function(nodeId) {
        var node;
        var agent;
        var category;
        for (agentId in flumeConfig) { //For each Agent
            agent = flumeConfig[agentId];
            //console.log(agent);
            for (nodeType in agent.nodes) { //For each NodeType in agent.nodes

                category = agent.nodes[nodeType];
                for (var i = 0; i < category.length; i++) { // For each Node in NodeType
                    //console.log(category[i]);
                    if (category[i].id == nodeId) {
                        return category[i];
                    }
                }
            }
        }
    };

    var getAgentNodes = function(agentId){
        return flumeConfig[agentId].nodes;
    }

    var getAgentSources = function(agentId){
        return flumeConfig[agentId].nodes.sources;
    }

    var getAgentChannels = function(agentId){
        return flumeConfig[agentId].nodes.channels;
    }

    var getAgentSinks = function(agentId){
        return flumeConfig[agentId].nodes.sinks;
    }

    var getAgentInterceptors = function(agentId){
        return flumeConfig[agentId].nodes.interceptors;
    }

    var getAgents = function() {
        return flumeConfig;
    };

    var setAgents = function(agents){
        flumeConfig = agents;
    }

    var nullAgents = function(){
        flumeConfig = {};
    }

    var connectNodes = function(sourceNode, targetNode) {
        if (!isValidConnection(sourceNode, targetNode)) {
            throw new Error("Not Valid Connection");
        } else {
            if (!this.connections[sourceNode.id]) {
                this.connections[sourceNode.id] = new Array();
            }
            this.connections[sourceNode.id].push(targetNode.id);
        }
    };

    var doesConnectionExist = function(sourceNodeId, targetNodeId) {
        try {
            for (agentId in flumeConfig) { //For each Agent
                var agent = flumeConfig[agentId];
                if (agent.connections[sourceNodeId]) { //Does the sourceNode exist in agent.connections
                    var node = agent.connections[sourceNodeId]
                    if ($.inArray(targetNodeId, agent.connections[sourceNodeId]) > -1) { //Does the targetNode exist in the sourceNode connections
                        return true; //We have a connection
                    }
                }
                return false; //No connection
            }
        } catch (err) {
            console.log(err);
        }
    };

    var isConnectionValid = function(sourceNode, targetNode) {
        if (sourceNode.id === targetNode.id) { //Check for self connection first
            throw new Error("Invalid Connection: Cannot Connect to Self")
        }
        if (doesConnectionExist(sourceNode.id, targetNode.id)) { //Check for existing Connection
            throw new Error("This connection already exists");
        }

        /**
            From Source To:
                1+ Channel
                0+ Interceptors
                1 Channel Selector
            **/
        if (sourceNode.category === "sources".toLowerCase()) {
            if (targetNode.category === "channels".toLowerCase()) {
                return true;
            } else if (targetNode.category === "interceptors".toLowerCase()) {
                return true;
            } else if (targetNode.category === "selectors") {
                //ok if we do not already have a connection to a selector
                //How to enforce only 1 connection
                return true;
            } else {
                throw new Error("A Source can only connect to a Channel, Interceptor or Channel Selector");
            }
        }

        /**
            From Channel To:
                0+ Sinks
        **/
        else if (sourceNode.category === "channels".toLowerCase()) {
            if (targetNode.category === "sinks".toLowerCase()) {
                /**
                * I dont think a sink can connect to a source on the same agent
                * If target is a source add in a check to see if its on another agent
                **/
                return true;
            }
            else{
                throw new Error("A Channel can only connect to an Interceptor or Sink");
            }
        }

        /**
            From Sinks To:
                0+ Sources
        **/
        else if (sourceNode.category === "sinks".toLowerCase()) {
            if (targetNode.category === "sources".toLowerCase()) {
                return true;
            }
            else{
                throw new Error("A Sink can only connect to a Source");
            }
        }

        /**
            From Interceptors To:
                0+ Interceptors
                1 Channel
                1 Channel Selector
        **/
        else if (sourceNode.category === "interceptors".toLowerCase()) {
            if (targetNode.category === "interceptors".toLowerCase()) {

            } else if (targetNode.category === "channels".toLowerCase()) {
                //ok if we do not already have a connection to a channel
                //How to enforce only 1 connection
                return true;
            } else if (targetNode.category === "selectors") {
                //ok if we do not already have a connection to a selector
                //How to enforce only 1 connection
                return true;
            }
        }

        /**
            From Selectors To:
                1+ Channel
        **/
        else if (sourceNode.category === "selectors".toLowerCase()) {
            if (targetNode.category === "channels".toLowerCase()) {
                return true;
            }
        } else {
            return false;
        }
    };

    var toJSON = function() {
        return JSON.stringify(flumeConfig);
    }

    init();
    return {
        init: init,
        nodes: nodes,
        addAgentToConfig: addAgentToConfig,
        addNodeToAgent: addNodeToAgent,
        doesConnectionExist: doesConnectionExist,
        getAgentById: getAgentById,
        getAgentChannels: getAgentChannels,
        getAgentInstance: getAgentInstance,
        getAgentNodes: getAgentNodes,
        getAgents: getAgents,
        getAgentSinks: getAgentSinks,
        getAgentSources: getAgentSources,
        getNodeById: getNodeById,
        getNodeInstance: getNodeInstance,
        removeNodeFromAgent: removeNodeFromAgent,
        removeAgentFromConfig: removeAgentFromConfig,
        setAgents: setAgents,
        nullAgents: nullAgents,
        toJSON: toJSON
    }

})($, _);

Math.guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
};