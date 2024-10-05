<script>
   let model = ""

   let showMsg = function (str){
     let ans = ""
     for (let c in str){
       ans += str[c].toUpperCase().repeat(2) + "又"
     }
     return "真是" + ans.slice(0, -1) + "啊"
   }
   let copyText = async  function (){
     const text = showMsg(model)
     await navigator.clipboard.writeText(text)
     alert("Copied!")
   }
</script>
<main>
  <h1> xx又xx生成器</h1>
  <input type="text" bind:value={model} placeholder="please input some words">
  <div class="grid">
    <p>{showMsg(model)}</p>
    <button on:click={copyText}>copy</button>
  </div>
  <hr>
</main>
<style>
  .grid {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
