browser.omnibox.setDefaultSuggestion({
  description: `wd [command] [point]
    (commands: add|rm|ls|path|show|help)`
});

// Eventually add suggestions based on input
browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
});
browser.omnibox.onInputEntered.addListener((text, disposition) => {
  let input = text.split(" ")
  let currentTab = browser.tabs.getCurrent()
  let getStore = browser.storage.sync.get();
  console.log(text);
  switch(input[0]) {
    case "add":
      if(input.length > 2) {
        let point = input[1]
        let url = input[2]
        getStore.then(store => {
          store = {} || store;
          store[point] = url;
          browser.storage.sync.set(store)
        });
      } 
      else if(input.length == 2) {
        let point = input[1]
        currentTab.then(url => {
          getStore.then(store => {
            store[point] = url;
            browser.storage.sync.set(store)
          });
        });
      }
      else {
        console.log('add takes 1 or 2 inputs. a warp point name and an optional url');
      }
      break;
    case "rm":
      if(input.length > 1 ) {
        getStore.then(store => {
          input.shift().forEach((point) => {
            delete store[point];
          });
          browser.storage.sync.set(store);
        });
      } 
      break;
    case "ls":
    case "list":
      getStore.then( store => {
        console.log('Warps points include: ' + Object.keys(store))
      });
      break;
    case "show":
      if(input.length > 1) {
        let url = input[1];
        getStore.then( store => { 
         console.log(Object.keys(warps).find(key => object[key] === url) );
        });
      } else {
        currentTab.then(url => {
          getStore.then( store => { 
           console.log(Object.keys(warps).find(key => object[key] === url));
          });
        });
      }
      break;
    case "path":
      if(input.length > 1) {
        let point = input[1];
        getStore.then( store => {
          let url = store[point] || 'none';
          console.log('Warp Point ' + point + ' is set to ' + url);
        });
      }
      break;
    default:
      if(input.length > 0) {
        let point = input[0];
        getStore.then( store => {
          let url = store[point];
          if(url != null) {
            browser.tabs.update({url});
          }
        });
      }
  }
});

