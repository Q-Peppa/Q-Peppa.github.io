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
              <button type="button"
              @click="copyWithin($refs.msg)"
              :class="btnClass"
              x-text="copy"
              x-transition.duration.300ms
              ></button>
            </div>
            <h1>疲劳计算器</h1>
            <h2>模式1， 起始疲劳 到 终止疲劳</h2>
            <div>
              <label for="fatigueStart">
                起始疲劳: <input type="text" placeholder="起始疲劳" id="fatigueStart" x-model="fatigue.start">
              </label>
              <label for="fatigueEnd">
                终止疲劳: <input type="text" placeholder="终止疲劳" id="fatigueEnd" x-model="fatigue.end">
              </label>
              <h3 x-html="fatigue.calcTotal()"></h3>
            </div>
            <h2>模式2， 起始疲劳 加 疲劳次数</h2>
            <div>
              <label for="fatigueStart2">
                起始疲劳: <input type="text" placeholder="起始疲劳" id="fatigueStart2" x-model="fatigue.startFatigue">
              </label>
               <label for="fatigueTimes">
                疲劳次数: <input type="text" placeholder="疲劳次数" id="fatigueTimes" x-model="fatigue.times">
              </label>
               <h3 x-html="fatigue.calcTotal2()"></h3>
            </div>
            <hr>
          `
  root.innerHTML = str.trim()
}

