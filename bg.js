chrome.runtime.onMessage.addListener(function (msg, sender) {
  // First, validate the message's structure
  console.log(sender.tab.id);
  if ((msg.from === 'content') && (msg.subject === 'showPageAction')) {
    // Enable the page-action for the requesting tab
    chrome.pageAction.show(sender.tab.id);
    chrome.pageAction.setTitle({
        tabId: sender.tab.id,
        title: 'You will send this'
    });
  }
});
