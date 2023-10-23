import React, { useEffect } from 'react';
import { Button, Divider, message, Select, Typography } from 'antd';
import Editor, { useMonaco } from '@monaco-editor/react';
const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'c'];
function App() {
  const monaco = useMonaco();
  const valRef = React.useRef<string>();
  const [theme, setTheme] = React.useState<string>('vs-dark');
  const [font, setFont] = React.useState<number>(26);
  const [currentLanguage, setCurrentLanguage] =
    React.useState<string>('javascript'); // 'javascript
  useEffect(() => {
    if (monaco) {
      console.log(`monaco`, monaco);
    }
  }, [monaco]);
  const handleEditorChange = (value: string) => {
    valRef.current = value;
  };
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
  };
  const handleSelectTheme = (value: string) => {
    setTheme(value);
  };
  const handleSelectFont = (value: number) => {
    setFont(font + value);
  };
  const Main = (
    <Editor
      options={{
        fontSize: font,
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      }}
      onChange={handleEditorChange}
      theme={theme}
      height="90vh"
      language={currentLanguage}
      defaultValue={'// 请在此处输入代码 https://q-peppa.github.io/'}
    />
  );
  return (
    <div
      style={{
        width: '80%',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <section
        style={{
          width: '100%',
        }}
      >
        <Typography.Title>LeetCode Hint</Typography.Title>
        <Divider />
        {Main}
      </section>
      <aside>
        <p className={'my-2'}>选择主题 </p>
        <Select
          onSelect={handleSelectTheme}
          placeholder="please select theme"
          options={[
            {
              label: 'vs-dark',
              value: 'vs-dark',
            },
            {
              label: 'vs-light',
              value: 'vs-light',
            },
            {
              label: 'hc-black',
              value: 'hc-black',
            },
          ]}
        />
        <p className={'my-2'}>选择字体大小 </p>
        <Button onClick={() => handleSelectFont(1)}> + </Button>
        <span>{font}</span>
        <Button onClick={() => handleSelectFont(-1)}> - </Button>
        <p>选择你的语言</p>
        <Select
          value={currentLanguage}
          onSelect={setCurrentLanguage}
          style={{
            minWidth: 200,
          }}
          options={languages.map((e) => ({
            label: e,
            value: e,
          }))}
        />
        <Button
          style={{
            marginTop: 20,
          }}
          type={'primary'}
          onClick={showValue}
        >
          写完了 , 复制代码到剪切板
        </Button>
      </aside>
    </div>
  );
}
export default App;
