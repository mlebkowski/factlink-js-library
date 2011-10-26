(function(Factlink, $, _, easyXDM, undefined) {
  // The iFrame which holds the intermediate
  var iFrame = $("<div />").attr({
    "id": "factlink-modal-frame"
  }).appendTo('body');

  Factlink.showInfo = function(factId, showEvidence) {
    Factlink.remote.showFactlink(factId, showEvidence, function ready() {
      Factlink.modal.show.method();
    });
  };

  var clickHandler = function() {
    Factlink.modal.hide.method();
  };
  
  var bindClick = function() {
    $(document).bind('click', clickHandler);
  };
  
  var unbindClick = function() {
    $(document).unbind('click', clickHandler);
  };


  // Object which holds the methods that can be called from the intermediate iframe
  // These methods are also used by the internal scripts and can be called through
  // Factlink.modal.FUNCTION.method() because easyXDM changes the object structure
  Factlink.modal = {	
    hide: function() {
      unbindClick();
      iFrame.hide();
    },
    show: function() {
      bindClick();
      iFrame.show();
    },
    highlightNewFactlink: function(fact, id, opinions) {
      //@TODO: Authority & opinions need to be added back in
      return Factlink.selectRanges(Factlink.search(fact), id, opinions);
    },
    stopHighlightingFactlink: function(id) {
      $('span.factlink[data-factid=' + id + ']').each(function(i, val) {
        if ($(val).is('.fl-first')) {
          $(val).remove();
        } else {
          $(val).before($(val).text()).remove();
        }
      });
    }
  };
})(window.Factlink, Factlink.$, Factlink._, Factlink.easyXDM);