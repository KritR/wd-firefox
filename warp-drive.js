const commands = [{name: 'add', description: 'Add a New Warp Point | wd add <point> <optional url>'}, {name: 'rm', description: 'Delete a Warp Point | wd rm <point>'}, {name: 'list', description: 'List all existing warp points | wd list'}];
const defaultSuggestion = 'wd [list|add|rm]? [point] [url]?';
const blankRegexp = /^\s*$/;


browser.omnibox.setDefaultSuggestion({
  description: defaultSuggestion
});

browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
  createSuggestions(text).then(suggestions => addSuggestions(suggestions));
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  let input = tokenize(text);
  let command = input[0];
  switch(command) {
    case "add":
      let point = input[1]
      let url = input[2]
      addWarpPoint(point, url);
      break;
    case "rm":
      if(input.length > 1 ) {
        input.shift();
        input.forEach(removeWarpPoint);
      } 
      break;
    case "list":
      showListPage();
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

async function removeWarpPoint(point) {
  browser.storage.sync.remove(point);
}

async function showListPage() {
  const store = await browser.storage.sync.get();
  browser.tabs.insertCSS({file: "/wd-list.css"});
  browser.tabs.executeScript({
    code: `
    (function() {
      const oldList = document.querySelector('#wd-list');
      if(oldList) {
        oldList.remove();
      }
      const store = ${JSON.stringify(store)};

      const warpPoints = Object.keys(store).sort();
      const pointList = document.createElement("ul");

      pointList.setAttribute("id", "wd-list");
      for (let point of warpPoints) {
        const text = document.createTextNode("wd " + point + " \u2192 " + store[point]);
        const pointNode = document.createElement("li");
        pointNode.appendChild(text);
        pointList.appendChild(pointNode);
        pointNode.onclick = () => {
          window.location.href = store[point];
        };
      }
      const invisibleCover = document.createElement("div");
      invisibleCover.setAttribute("id", "wd-invisible-cover");
      invisibleCover.onclick = () => {
        pointList.remove();
        invisibleCover.remove();
      }
      document.body.appendChild(invisibleCover);
      document.body.appendChild(pointList);
    })();
    `
  });
  /*const listPageData = {
    type: "detached_panel",
    url: "wd-list.html",
    width: 250,
  };
  browser.windows.create(listPageData);*/
}

async function openWarpPoint(point, disposition) {
  const store = await browser.storage.sync.get();
  const url = store[point]; 
  if(url != null) {
    openURL(url, disposition);
  }
}

async function createSuggestions(text) {
  const store = await browser.storage.sync.get();
  const blankInput = blankRegexp.test(text);
  const commandSuggestions = commands
    .filter(command => command.name.toLowerCase().startsWith(text.toLowerCase()) || blankInput)
    .map(command => {
      return {content: command.name, description: command.description}
    });
  const warpSuggestions = Object.keys(store)
    .filter(key => key.toLowerCase().startsWith(text.toLowerCase()) || blankInput)
    .map(key => {
      return {content: key, description: 'wd ' + key + ' --> ' + store[key]}
    })
    .sort();
  const suggestions = commandSuggestions.concat(warpSuggestions);
  return suggestions
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
