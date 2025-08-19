import { createRoot } from 'react-dom/client'
import './global.css'
import '@radix-ui/themes/styles.css'
import App from './App.tsx'
import { Theme } from '@radix-ui/themes'
import '@ant-design/v5-patch-for-react-19'
import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider } from 'antd'

createRoot(document.getElementById('root')!).render(
  <Theme>
    <StyleProvider layer>
      <ConfigProvider>
        <App/>
      </ConfigProvider>
    </StyleProvider>
  </Theme>,
)
