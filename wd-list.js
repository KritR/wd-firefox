async function loadList() {
  const store = await browser.storage.sync.get();
  const warpPoints = Object.keys(store).sort();
  let pointList = document.createElement("ul");
  for (let point of warpPoints) {
    const text = document.createTextNode(`wd ${point} &#8594 ${store[point]}`);
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
