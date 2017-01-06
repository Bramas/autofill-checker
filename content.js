
function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}


ready(function() {
    var lastChange = 0;
    var inputs = document.querySelectorAll('form input');
    var autofillTriggered = false;
    var affectedInputs = [];
    var originElement = null;


    function onAutofill() {
        if(affectedInputs.indexOf(originElement) == -1) {
            affectedInputs.unshift(originElement);
        }
        chrome.runtime.sendMessage({
          from:    'content',
          subject: 'showPageAction'
        });
    }

    chrome.runtime.onMessage.addListener(function (msg, sender, response) {

      if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {

        var values = [];
        for(var j = 0 ; j < affectedInputs.length; ++j) {
            values.push(affectedInputs[j].value);
        }

        // Directly respond to the sender (popup),
        // through the specified callback
        response(values);
      }
    });

    function inputChangedEvent(input) {
        return function(e) {
            // if the autofill has already been triggered and we
            // are changing an affected Input
            if(affectedInputs.indexOf(input) != -1) {
                debounce(onAutofill, 11)();
                return;
            }
            // otherwise check if the autofill has been triggered
            var now = new Date().getTime();
            if(now - lastChange < 10) {
                autofillTriggered = true;
                affectedInputs.push(input);
                debounce(onAutofill, 11)();
            } else if(!autofillTriggered) {
                originElement = input;
            }
            lastChange = now;

        }
    }

    // apply the event to every input in the page
    for(var i = 0 ; i < inputs.length; ++i) {
        inputs[i].addEventListener('change', inputChangedEvent(inputs[i]), false);
    }


});

// utility

var debounceTimeout = null;
function debounce(f, wait) {
    return function() {
        if(debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null
        }
        debounceTimeout = setTimeout(f, wait);
    }
}
