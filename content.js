// Here You can type your custom JavaScript...


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
        if(affectedInputs.indexOf(originElement) == -1) {
            affectedInputs.unshift(originElement);
        }
        var inputBoundingRect = originElement.getBoundingClientRect();
        var d = document.getElementById('autofill-checker-tooltip');
        if(!d) {
           d = document.createElement("div");
           d.id = 'autofill-checker-tooltip';
        }
        d.textContent = affectedInputs.length+' inputs automatically filled';
        d.style.top = (inputBoundingRect.top+document.body.scrollTop)+'px';
        d.style.left = (5+inputBoundingRect.left+inputBoundingRect.width+document.body.scrollLeft)+'px';
        d.style.opacity = 1;
        document.body.appendChild(d);
        setTimeout(function() {
          fadeOut(d);
        }, 2000);
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
function fadeOut(el) {
  el.style.opacity = 1;

  var last = +new Date();
  var tick = function() {
    el.style.opacity = +el.style.opacity - (new Date() - last) / 400;
    last = +new Date();

    if (+el.style.opacity > 0) {
      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
    }
  };

  tick();
}
