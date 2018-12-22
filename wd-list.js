const winId = browser.windows.WINDOW_ID_CURRENT;
async function loadList() {
  const store = await browser.storage.sync.get();
  const warpPoints = Object.keys(store).sort();
  let pointList = document.createElement("ul");
  pointList.setAttribute("id", "wd-list");
  for (let point of warpPoints) {
    const text = document.createTextNode(`wd ${point} \u2192 ${store[point]}`);
    const pointNode = document.createElement("li");
    pointNode.appendChild(text);
    pointList.appendChild(pointNode);
    pointNode.onclick = () => {
      browser.runtime.sendMessage(store[point]);
      const winId = browser.windows.WINDOW_ID_CURRENT;
      browser.windows.remove(winId);
    };
  }
  document.body.appendChild(pointList);
}
loadList();
browser.windows.onFocusChanged.addListener((windowId) => {
  if(windowId != winId) {
    browser.windows.remove(winId);
  }
});
