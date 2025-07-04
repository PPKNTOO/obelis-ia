// edit-img/js/app.js

import { initGlobalApp } from "../../js/global.js";
import { initApp as initEditorApp } from "./main.js";

document.addEventListener("DOMContentLoaded", () => {
  initGlobalApp();
  initEditorApp();
});
