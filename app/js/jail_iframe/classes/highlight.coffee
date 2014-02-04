highlight_time_on_in_view = 1500

class Highlighter
  constructor: (@$elements, @className) ->
    throw 'Higlighter requires class' unless @className

  highlight:   -> @$elements.addClass(@className)
  dehighlight: -> @$elements.removeClass(@className)

class HighlightScrollPromotion
  # states: invisible, just_visible, visible

  constructor: (@fact) ->
    @highlighter = new Highlighter $(fact.elements), 'fl-scroll-highlight'
    $(fact.elements).inview(@onSomethingChanged)
    FactlinkJailRoot.on 'fast_scrolling_changed', @onSomethingChanged
    @state = 'visible'

  onSomethingChanged: =>
    switch @state
      when 'invisible'
        if @fact.isInView() && ! FactlinkJailRoot.isFastScrolling
          @switchToState 'just_visible'
          @timeout_handler = setTimeout =>
            @switchToState 'visible'
          , highlight_time_on_in_view
      when 'visible', 'just_visible'
        if !@fact.isInView()
          clearTimeout @timeout_handler
          @switchToState 'invisible'

  switchToState: (to_state) =>
    return if to_state == @state

    if to_state == 'just_visible'
      @highlighter.highlight()
    else
      @highlighter.dehighlight()
    @state = to_state

class FactlinkJailRoot.Highlight
  constructor: (@id, @elements) ->
    @show_button = new FactlinkJailRoot.ShowButton @elements, @id
    @fact_promotion = new HighlightScrollPromotion(this)
    @core_highlighter = new Highlighter $(@elements), 'fl-core-highlight'

  isInView: ->
    for element in $(@elements)
      return false unless $(element).data('inview') == 'both'
    true

  destroy: ->
    for el in @elements
      $(el).contents().unwrap()

    @show_button.destroy()

previousCoreHighlightId = null
FactlinkJailRoot.showCoreHighlight = (factId) ->
  for highlight in FactlinkJailRoot.highlightsByFactIds[previousCoreHighlightId] || []
    highlight.core_highlighter.dehighlight()

  for highlight in FactlinkJailRoot.highlightsByFactIds[factId] || []
    highlight.core_highlighter.highlight()

  previousCoreHighlightId = factId
