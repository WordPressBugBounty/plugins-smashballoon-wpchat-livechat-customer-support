import React, { useState } from 'react';

// 🛠️ Testing if React Compiler is working

// ✅ Steps to Test:
// 1️⃣ Import the "TestReactCompiler" component into your file.
// 2️⃣ Open the Console (F12 → Console tab).
// 3️⃣ Click the button → It should log "Counter re-rendered".
// 4️⃣ Type in the input field:
//    - If "Counter re-rendered" appears, React Compiler is NOT optimizing the component.
//    - If the Counter does NOT re-render while typing, the compiler is working! 🚀

// 🔧 Comment this section inside vite.config.js file to disable React Compiler:
// react({
//   babel: {
//     plugins: [
//       ["babel-plugin-react-compiler", ReactCompilerConfig],
//     ],
//   },
// });

export default function IsReactCompilerWorking() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState(''); // Unrelated state change

  return (
    <div>
      <Counter value={count} onIncrement={() => setCount(count + 1)} />
      <input
        type='text'
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Type here'
      />
    </div>
  );
}

function Counter({ value, onIncrement }) {
  return <button onClick={onIncrement}>Count: {value}</button>;
}
