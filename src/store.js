function initStore(){
  const text = '千甲德也扛不住'
  Alpine.data('data', () => ({
    val:"",
    btnClass:"btn",
    copy:'Copy',
    showMsg(){
      if (this.val?.trim().length === 0){
        return "输入点东西看看吧~"
      }
      let cur = '真是'
      for (let char of this.val) {
        cur+=char.repeat(2) + '又'
      }
      return cur.slice(0, -1) + '啊'
    },
    copyWithin(dom = {}){
      const v = dom?.innerText ?? ''
      navigator.clipboard.writeText(v).then(()=>{
        this.copy = 'Copied ✔'
        setTimeout(()=>{
          this.copy = 'Copy'
        }, 1000)
        })
      },
      fatigue: {
        start : 0,
        end: 0 ,
        startFatigue:0,
        times:0,
        calcTotal(){
          const s = Number(this.start) || 0;
          const e = Number(this.end) || 0;
          if (e > 200 ) return text
          if (!s || !e ) return "输入点东西看看吧~"
          if (s > e ) return  "输入的疲劳好像不对~"
          let total = 0;
          for (let i=s  ; i<=e ; i++) {
              total+= Number(i)
          }
          if (total > 10000)  return text
        return `总共的疲劳为：  <span style="color: red">${total}</span>`
      },
        calcTotal2(){
          const t = Number(this.times) || 0
          const f = Number(this.startFatigue) || 0
          if ( t > 200) return  text
          if (!f ) return "输入点东西看看吧~"
          let total = 0
          for (let i=0 ; i< t ; i++) {
            total += Number(f) + i
          }
          return `总共的疲劳为：  <span style="color: red">${total}</span>`
        }
    }
  }))
}

export default initStore
