import React, { useEffect } from 'react';
import { Button, message } from 'antd';
import Editor, { useMonaco } from '@monaco-editor/react';

function App() {
  const monaco = useMonaco();
  const valRef = React.useRef<string>();
  useEffect(() => {
    if (monaco) {
      console.log(`monaco`, monaco)
    }
  }, [monaco])
  const handleEditorChange = (value: string) => {
    valRef.current = value;
  }
  const showValue = () => {
    // copy to clipboard
    const v = valRef.current;
    const input = document.createElement('textarea');
    input.value = v!;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    message.success('复制成功');
  }
  const Main = <Editor
    onChange={ handleEditorChange }
    theme="vs-dark"
    height="90vh" defaultLanguage="javascript" />;
  return <div
    style={ {
      width: 800,
      border: "1px solid #000",
    } }

  >
    <h3>LeetCode Hint</h3>
    { Main }
    <hr />
    <Button onClick={ showValue }>复制代码</Button>
  </div>
}
export default App;