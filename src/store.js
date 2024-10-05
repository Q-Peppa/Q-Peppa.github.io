function initStore(){
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
    }
  }))
}

export default initStore
