import React, { useEffect } from 'react';
import { Button, Divider, message, Select, Typography } from 'antd';
import Editor, { useMonaco } from '@monaco-editor/react';

function App() {
  const monaco = useMonaco();
  const valRef = React.useRef<string>();
  const [theme, setTheme] = React.useState<string>('vs-dark');
  const [font, setFont] = React.useState<number>(26);
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
      defaultLanguage="javascript"
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
        <Button type={'primary'} onClick={showValue}>
          复制代码
        </Button>
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
      </aside>
    </div>
  );
}
export default App;
