const commands = [{name: 'add', description: 'Add a New Warp Point | wd add <point> <optional url>'}, {name: 'rm', description: 'Delete a Warp Point | wd rm <point>'}];
const defaultSuggestion = 'wd [add|rm]? [point] [url]?';
const blankRegexp = /^\s*$/;

browser.omnibox.setDefaultSuggestion({
  description: defaultSuggestion
});

browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
  const getStore = browser.storage.sync.get();
  const textRegexp = new RegExp('^' + text.trim(), 'i');
  const blankInput = blankRegexp.test(text);
  const commandSuggestions = commands
    .filter(command => textRegexp.test(command.name)||blankInput)
    .map(command => {
      return {content: command.name, description: command.description}
    });
  getStore.then(store => {
    const warpSuggestions = Object.keys(store)
      .filter(key => textRegexp.test(key)||blankInput)
      .map(key => {
        return {content: key, description: 'wd ' + key + ' --> ' + store[key]}
      });
    const suggestions = commandSuggestions.concat(warpSuggestions);
    addSuggestions(suggestions);
  });
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  let input = tokenize(text);
  const currentTab = browser.tabs.getCurrent();
  const getStore = browser.storage.sync.get();
  switch(input[0]) {
    case "add":
      let point = input[1]
      let url = input[2]
      addWarpPoint(point, url);
      break;
    case "rm":
      if(input.length > 1 ) {
        input.shift();
        input.forEach(point => browser.storage.sync.remove(point));
      } 
      break;
    default:
      if(input.length > 0) {
        let point = input[0];
        openWarpPoint(point, disposition);
      }
  }
});

function tokenize(string) {
  return string.replace(/ +(?= )/g,'').trim().split(" ");
}

function makeURL(string) {
  const protocol = /(^\w+:\/\/).*/
  if(!protocol.test(string)) {
    string = 'https://' + string
  }
  return string
}

async function addWarpPoint(point, url) {
  if(url == null) {
    const [tab] = await browser.tabs.query({currentWindow: true, active:true});
    url = tab.url;
  } else {
    url = makeURL(url)
  }
  const store = await browser.storage.sync.get();
  store[point] = url;
  browser.storage.sync.set(store);
}

async function openWarpPoint(point, disposition) {
  const store = await browser.storage.sync.get();
  const url = store[point] 
  if(url != null) {
    openURL(url, disposition);
  }
}

function openURL(url, disposition) {
  switch (disposition) {
  case "currentTab":
    browser.tabs.update({url});
    break;
  case "newForegroundTab":
    browser.tabs.create({url});
    break;
  case "newBackgroundTab":
    browser.tabs.create({url, active: false});
    break;
  }
}
