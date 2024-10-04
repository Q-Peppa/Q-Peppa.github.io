import * as React from 'react';
import { createRoot } from 'react-dom/client';
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

function App(){
  const [value , setValue] = React.useState("");
  const msg = React.useMemo(()=>{
    let inner = "真是"
    for(let c in value){
      const ele = value[c].repeat(2)
      inner += ele+"又"
    }
    return inner.slice(0 ,-1) + "啊"

  }, [value])
  return <div>
    <input type={"text"} placeholder={"please input some word"} onChange={(e)=>{
      setValue(e.target.value)
    }}/>
    <h2>{msg}</h2>
    <button type={"button"} onClick={()=>{
      navigator.clipboard.writeText(msg)
    }}> copy </button>
  </div>
}
root.render(
  <React.StrictMode>
    <React.Fragment>
       <h2>xx又xx生成器</h2>
       <App/>
       <hr />
    </React.Fragment>
  </React.StrictMode>,
);
