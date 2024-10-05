import "./styles/reset.css"
import "./styles/page/indedx.css"
import Alpine from 'alpinejs'
import initStore from "./store.js";
const root = document.getElementById("root")
const con = window && root && Alpine

if (con) {
  window.Alpine = Alpine
  Alpine.start()
  initStore();
  root.setAttribute("x-data" , "data");
  const str = `
            <h1>xx又xx生成器</h1>
            <label>
              <input type="text" placeholder="please input some word" style="width: 200px" x-model="val">
            </label>
            <div class="flex">
              <span x-text="showMsg" x-ref="msg"></span>
              <button type="button" @click="copyWithin($refs.msg)" :class="btnClass" x-text="copy" x-transition.duration.333ms></button>
            </div>
            <hr>
          `
  root.innerHTML = str
}

