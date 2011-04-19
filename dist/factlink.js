/*!
 * Factlink client library v0.0.1
 * http://factlink.com/
 *
 * Copyright 2011, Factlink
 * 
 * Date: @DATE
 */
(function( window, undefined ) {

// Use the correct document accordingly with window argument (sandbox)
var document = window.document;
var Factlink = (function() {
// Empty Factlink object
var Factlink = function(){
    this.results = [];
    
    // Add the stylesheet to the DOM
    Factlink.util.addStyleSheet("http://factlink:8000/src/styles/factlink.css?" + (new Date()).getTime() );
};

// Function which will collect all the facts for the current page
// and select them.
Factlink.prototype.getTheFacts = function(){
    var loc = window.location,
        // The URL to the Factlink backend
        src = 'http://tom:1337/factlinks_for_url.json?url=' + 
              loc.protocol + 
              '//' + 
              loc.hostname + 
              loc.pathname,
        that = this;
    
    // Update the loader
    FL.Loader.updateStatus( "Retrieving the facts from the server" );
    
    // We use the jQuery AJAX plugin
    $.ajax({
            url: src,
            dataType: "jsonp",
            crossDomain: true,
            type: "GET",
            jsonp: "callback"
        })
        // Callback which is called when the response is loaded, will contain
        // the JSON data
        .success(function(data){
            // If there are multiple matches on the page, loop through them all
            for ( var i = 0; i < data.length; i++ ) {
                // Update the loader
                FL.Loader.updateStatus( "Finding matches for fact: \"" + data[i].displaystring + "\"" );
                
                // Select the ranges (results)
                that.selectRanges( that.search( data[i].displaystring ) );
            }
            
            // Done loading
            FL.Loader.finish();
        });
};


//                                                                          //
//                                                                          //
//                                  UTILS                                   //
//                                                                          //
//                                                                          //

Factlink.util = {};

// IE anyone?
Factlink.util.hasInnerText = (document.getElementsByTagName("body")[0].innerText
     != undefined) ? true : false;

// Util function to load a stylesheet
Factlink.util.addStyleSheet = function(url) {
    var style = document.createElement("link");
    style.type = "text/css";
    style.rel = "stylesheet";
    style.href = url;
    document.getElementsByTagName("head")[0].appendChild(style);
};

// Function which walks the DOM in HTML source order
// as long as func does not return false
// Inspiration: Douglas Crockford, JavaScript: the good parts
Factlink.util.walkTheDOM = function walk(node, func) {
    if ( func(node) !== false ) {
        node = node.firstChild;
        while (node) {
            if (walk(node, func) !== false) {
                node = node.nextSibling;
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
};

// Factlink debug
Factlink.util.debug = function() {
    if ( window.console && window.console.info ) {
        window.console.info.apply( console, arguments );
    }
}

// Dustin Diaz - $script.js
Factlink.util.domReady = function(fn) {
    /in/.test( document['readyState'] ) ? setTimeout( function() { domReady(fn); }, 50) : fn();
};

// Expose the Factlink object to the global object
return Factlink;

})();
// Make the user able to add a Factlink
Factlink.prototype.submitFact = function(){
    var that = this;
    
    if ( window.rangy === undefined ) {
        var selection = window.getSelection();
    } else { // IE
        var selection = window.rangy.getSelection();
    }
    
    try {
        // Get the selected text
        var range = selection.getRangeAt(0);
    } catch(e) {
        alert("bam");
        // Possibly the user didn't select anything
        return false;
    }
    
    if (range.toString().length < 1) {
        // Tell the loader we're done
        FL.Loader.finish();
        
        // Return to make the function stop
        return false;
    }
    
    $.ajax({
        url: 'http://tom:1337/factlink/new',
        dataType: 'jsonp',
        crossDomain: true,
        jsonp: "callback",
        type: 'post',
        data: {
            url: location.href,
            fact: range.toString()
        }
    }).success(function(data) {
        if (data.status == true) {
            // Select the selected text
            that.selectRanges([range]);
            
            // The loader can hide itself
            FL.Loader.finish();
        } else {
            console.info( data );
            alert("Something went wrong");
            
            // The Loader can hide itself
            FL.Loader.finish();
        }
    }).error(function(data) {
        //TODO: Better errorhandling
        FL.Loader.finish();
    });
};


// Store the Loader object in the prototype
var Loader = Factlink.prototype.Loader = {
    // jQuery object which holds the loader
    el : $( '<div class="loader">' +
                '<h1>Factlink</h1>' +
                '<p id="fl-status">Loading Factlink sources</p>' +
                '<ul class="fl-status-list"></ul>' +
            '</div>' )
};

Loader.init = function() {
    // Do some initilizing
    this.el
        .hide()
        .appendTo('body');
};

// Open the dialog
Loader.open = function() {
    // Show the loader
    this.el.show();
};

// Update the current status
Loader.updateStatus = function(status) {
        // The status list
    var $statuslist = this.el.find('.fl-status-list');
    
    // Add the status to the list
    $statuslist.append('<li class="hide">' + status + '</li>');
    
    $statuslist.find(':not(.hide)').fadeOut('fast', function(){
        $( this ).addClass('hide').next('li').fadeIn('fast', function(){
            $(this).removeClass('hide');
        });
    });
};

// Loading is finished, dialog is dissmissed
Loader.finish = function() {
    // Hide the loader
    this.el.fadeOut();
};


// Function which will make sure all the links on the current page will 
// be set so that Factlink will proxy them
Factlink.prototype.initProxy = function(){
    // We can only start manipulating when the DOM is fully loaded
    Factlink.utils.domReady(function(){
            // Get all the A tags on the current page
        var a = document.getElementsByTagName("a");

        for ( var i = 0, j = a.length; i < j; i++ ) {
                // Store the current tag
            var b = a[i];
            var href = b.href;
                // Is the href a valid one which needs to be proxied?
            var valid = false;
            
            // TODO: We need to make sure to capture links without href attributes
            //       (onclick=window.open('test.html'))
            
            // Check to make sure we have a valid href
            // TODO: This statement needs a lot of refactoring and overthinking,
            //       We should be able to detect location changes in javascript:
            //       links.
            if ( href.length > 0 ) {
                // Does the href start with http:// ?
                if ( href.search(/http:\/\//) !== 0 ) { 
                    if ( href.search(/mailto:/) !== 0 && 
                         href.search(/javascript:/) !== 0 ) {
                        console.info( "N: " + href );
                    }
                } else {
                    valid = true;
                }
            }
            
            // Only change the href when we have a valid link
            if ( valid ) {
                b.href = href.replace(/^http:\/\//, 'http://fct.li:8080/s/http://');
            }
        }
    });
};    

// Function to select the found ranges
Factlink.prototype.selectRanges = function(ranges){
    // Loop through ranges (backwards)
    for ( var i = ranges.length; i--; ){
        // Current range
        var range = ranges[i];
        
            // Start- and EndNodes
        var startNode = range.startContainer,
            endNode = range.endContainer;

            // Try to find out if there are other matches within this element
        var j = i,
            // Helper for posible extra matches within the current startNode
            extraMatches = [];
                
        while ( --j > 0 && ranges[j].startContainer === startNode ) {
            // Push the match to the extraMatches helper
            extraMatches.push({
                'startOffset' : ranges[j].startOffset,
                'endOffset' : ranges[j].endOffset
            });

            // decrease the increment so this element 
            // won't be matched in the next loop
            --i;
        }
                
        // Insert the actual span
        this.replaceFactNodes(range.startOffset, 
                         range.endOffset, 
                         startNode, 
                         endNode, 
                         range.commonAncestorContainer);

        // If there are other matches within the startNode, 
        // process them here
        if ( extraMatches.length > 0 ) {
            for ( var k = 0; k < extraMatches.length; k++ ) {
                var obj = extraMatches[k];

                // Insert the "fact"-span in the same element
                this.replaceFactNodes(obj.startOffset, 
                                      obj.endOffset, 
                                      startNode, 
                                      endNode, 
                                      range.commonAncestorContainer );
            }
        }
    }
    
    // This is where the actual parsing takes place
    // this.results holds all the textNodes containing the facts
    for (var i = 0; i < this.results.length; i++ ) {
        var res = this.results[i];
        
        // Insert the fact-span
        insertFactSpan(res.startOffset, res.endOffset, res.node);
    }
};

// This is where the actual magic will take place
// A Span will be inserted around the startOffset/endOffset 
// in the startNode/endNode
var insertFactSpan = function(startOffset, endOffset, node) {
        // Value of the startNode, represented in an array
    var startNodeValue = node.nodeValue.split(''),
        // The selected text
        selTextStart = startNodeValue
                                .splice(startOffset, startNodeValue.length);
    
    if ( endOffset < node.nodeValue.length && endOffset !== 0 ) {
        var after = selTextStart
                        .splice(endOffset - startOffset , selTextStart.length)
                        .join('');

        // Slice the array by changing it's length
        selTextStart.length = endOffset - startOffset;

        // Insert the textnode with the remaining text after the 
        // current textNode
        node.parentNode
            .insertBefore( document.createTextNode(after), node.nextSibling );
    }
        // Create a reference to the actual "fact"-span
    var span = createFactSpan( selTextStart.join('') );

    // Remove the last part of the nodeValue
    node.nodeValue = startNodeValue.join('');
    
    // Insert the span right after the startNode 
    // (there is no insertAfter available)
    node.parentNode.insertBefore( span, node.nextSibling );
},

// Create a "fact"-span with the right attributes
createFactSpan = function(text, id){
    var span = document.createElement('span');

    // Set the span attributes
    span.className = "factlink";
    span.setAttribute('data-factid',id);
    
    // IE Doesn't support the standard (textContent) and Firefox doesn't 
    // support innerText
    if ( !Factlink.util.hasInnerText ) {
        span.textContent = text;
    } else {
        span.innerText = text;
    }
    
    return span;
};

// Function that tracks the DOM for nodes containing the fact
Factlink.prototype.replaceFactNodes = function(startOffset,
                            endOffset,
                            startNode,
                            endNode,
                            commonAncestorContainer) {
        // Only parse the nodes if the startNode is already found, 
        // this boolean is used for tracking
    var foundStart = false,
        // Reference to this for use in the walkTheDOM function
        that = this;
    
    // Walk the DOM in the right order and call the function for every 
    // node it passes
    Factlink.util.walkTheDOM( commonAncestorContainer, function( node ) {
        // We're only interested in textNodes
        if ( node !== undefined && node.nodeType === 3 ){
            if (node === startNode) {
                foundStart = true;
                var rStartOffset = startOffset;
            } else if (foundStart) {
                    // If this is a node in between the start- and endNode
                    // The startOffset is being set to 0
                var rStartOffset = 0;
            }

            if (foundStart) {
                if (node === endNode) {
                    var rEndOffset = endOffset;
                } else {
                    var rEndOffset = node.nodeValue.length;
                }
                
                // Push the right info to the results array, the info 
                // is being parsed later (selectRanges -end)
                that.results.push({
                    startOffset: rStartOffset,
                    endOffset: rEndOffset,
                    node: node
                });
            }

            if (foundStart && node === endNode) {
                // If we encountered the last node we don't 
                // need to walk the DOM anymore
                return false;
            }
        }
    });
};

// Function to search the page
Factlink.prototype.search = function(searchString){
        // Array which will hold all the results
    var results = [];
    
    // Store scroll settings to reset to afterwards
    var scrollTop = document.body.scrollTop,
        scrollLeft = document.body.scrollLeft;
    
    if ( window.find ) { // Chrome, Firefox, Safari
        // Reset the selection
        // Maybe we later need to store the current selection before 
        // processing the document, so we can reset it afterwards
        window.getSelection().removeAllRanges();

        // Loop through all the results of the search string
        while ( window.find(searchString, false) ) {
            var selection = window.getSelection(),
                range = selection.getRangeAt(0);

            // Add the range to the results
            results.push(range);
        }

        // Reset the selection
        // Maybe we later need to store the current selection before 
        // processing the document, so we can reset it afterwards
        window.getSelection().removeAllRanges();
    } else if (document.body.createTextRange) { // IE & Opera
            // Create an empty range object
        var range = document.body.createTextRange();
        
        if ( range.findText ) { // IE
            // IE8 Doesn't support search over multiple elements...
            if (document.documentMode && document.documentMode === 8) { // IE8
                alert( "Your browser is currently running in IE8 Mode, this rendering " +
                       "mode of IE8 has a bug which may cause Factlink from not finding " + 
                       "all the available Factlinks on this page.");
            } 

            while ( range.findText(searchString) ) {
                // We need to encapsulate the following statements in a try-catch
                // because IE will throw an error (800a025e) when trying to select
                // a non-visible range
                // TODO: Find out if we can surpass this by using the internal rangy
                //       functions which will parse a normal range into a rangy-range
                try {
                    // Select the current range, necessary because of the ierange 
                    // we're using
                    range.select();
                    
                        // Because of IE's shitty implementation of the Range and 
                        // Selection objects, we have to refresh the range (this 
                        // time the rangy module is used)
                    var selection = rangy.getSelection();

                        // the rangy object
                    var ierange = selection.getRangeAt(0);

                    // Push the range to the results
                    results.push(ierange);

                    // Move on
                    range.collapse(false);
                    selection.removeAllRanges();
                } catch (e) {
                    // We need to collapse the range because otherwise IE will 
                    // keep matching this range
                    range.collapse(false);
                }
            }
        } else { // Opera
            alert( "Your browser does not support the proper find functionality" );
        }
    } else { // No window.find and createTextRange
        alert( "Unimplemented" );
    }
    
    // Scroll back to previous location
    scroll(scrollLeft,scrollTop);
        
    return results;
};
window.Factlink = Factlink;
})(window);
