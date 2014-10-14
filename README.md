#FlumeConfig#
##A Visual Flume Editor##

Version: 0.1.0
Flume config is written entirely in Javascript and is self contained.  It allows you to visually layout a Flume topology, enter properties for the sources, channels, and sinks, and creates the flume config file for you.
It can handle multiple agents.  At this time not all sources, sinks, channels are available, but that is coming VERY soon.

**Prerequisites**
If you want to use the embedded server you will need to have node.js installed.  Otherwise you can drop this into the appserver of your choice.

**To Run:**
```bash
grunt build
cd  app
node server.js
```

You can also run it in developer mode via:
```bash
grunt serve
```

**To Use**
<img src="app/images/flumeconfig.png"/>

1. Select a Node Type (Source, Sink, Channle, etc) from the left hand side
2. Double Click on the agent to add the node ot the agent
3. Select the node and eneter the properties in the propoerties tab at bottom
4. Add another node and drag and drop a connection form one node to another
5. Enter properties for that node
6. Select the &quot;Config File&quot; tab to view the resulting flume cocnfig file
7. Copy the text and use as you would normally for Flume

**To-Do:**
- [ ]Finish creating json files for all sources, channels, sinks, etc.
- [ ]Implement Tooltips
- [ ]Implement config property field validaiton
- [ ]Implement drag select on the canvas
- [ ]Implement 'right click' functionality
- [ ]Implement Saving and Loading of Configs -- Either locally or implement persistence
- [ ]Better mechanism for deletion of node connections
- [ ]Integrate into Ambari
- [ ]Better Node Graphics on Left Accordians
- [ ]Testing, testing, testing
- [ ]Documentation
- [X]Change Connection Delete code to handle keyup -- Requires selection of svg element
- [X]Fix node and agent Positioning on window or canvas resize
- [ ]add notes property to agent, nodes, and all configProperties
- [ ]Make a dummy config that will load on pageLoad
- [ ]Config Properties Validations
- [ ]Connector Rules for Interceptors, and Selectors
- [ ]Create Grey Style for Other Category