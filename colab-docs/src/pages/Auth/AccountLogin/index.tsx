import logo from '../../assets/logo.png'
import styles from './index.module.less'
import { useState } from 'react'
import { Button, Form, Input } from 'react-vant'
import axios from '@/api'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router'

export default function AccountLogin () {

  const { state } = useLocation()  // 从注册页传过来的参数
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const onFinish = async values => {
    console.log(values)
    const endpoint = isRegisterMode ? '/user/register' : '/user/login'
    if (endpoint === '/user/login') {
      axios.post(endpoint, values)
           .then(res => {
             // 如果现在是登录模式，调用登录接口
             console.log(res)
             // 将token存储到localStorage中
             localStorage.setItem('access_token', res.access_token)
             localStorage.setItem('refresh_token', res.refresh_token)
             // 将data转成json字符串存储到浏览器中方便后续使用用户信息
             localStorage.setItem('userInfo', JSON.stringify(res.data))
             // 登录成功弹窗
             toast.success(res.message)
             navigate('/noteClass')
           })
    }
    if (endpoint === '/user/register') { // 如果现在是注册模式，调用注册接口
      const res = await axios.post('/user/register', values)
      toast.success(res.message)
      setIsRegisterMode(false) // 切换回登录模式
      // 直接设置表单字段值
      form.setFieldsValue({
        username: values.username,
        password: values.password,
      })
    }

  }

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode)
    // 切换模式后重置表单
    form.resetFields()
  }

  return (
    <div className={styles.login}>
      <h1 className={styles.title}>
        {isRegisterMode ? '注册' : '登录'}
      </h1>

      <div className={styles['login-wrapper']}>
        <div className={styles.avatar}>
          <img className={styles['avatar-img']} src={logo} alt="日记本logo"/>
        </div>
        <Form
          form={form}
          onFinish={onFinish}
          footer={
            <div style={{ margin: '16px 16px 0' }}>
              <Button
                round
                nativeType="submit"
                type="primary"
                block
                style={isRegisterMode ? {
                  backgroundColor: '#28a745',
                  borderColor: '#28a745',
                } : {}}
              >
                {isRegisterMode ? '注册' : '登录'}
              </Button>
            </div>
          }
        >
          <Form.Item
            rules={[{ required: true, message: '请填写用户名' }]}
            name="username"
            label="用户名"
            labelWidth={120}
            labelAlign={'center'}
            initialValue={state?.username}
          >
            <Input placeholder="请输入用户名"/>
          </Form.Item>
          <Form.Item
            rules={[{ required: true, message: '请填写密码' }]}
            name="password"
            label="密码"
            labelWidth={120}
            labelAlign={'center'}
            initialValue={state?.password}
          >
            <Input placeholder="请输入密码"/>
          </Form.Item>

          {isRegisterMode && (
            <Form.Item
              rules={[{ required: true, message: '请填写昵称' }]}
              name="nickname"
              label="昵称"
              labelWidth={120}
              labelAlign={'center'}
            >
              <Input placeholder="请输入昵称"/>
            </Form.Item>
          )}
        </Form>
      </div>

      <p className={styles['login-tip']}>
        {isRegisterMode ? '已有账号？' : '没有账号？'}
        <a href="#" onClick={(e) => {
          e.preventDefault()
          toggleMode()
        }}>
          {isRegisterMode ? '点这登录' : '点这注册'}
        </a>
      </p>
    </div>
  )
}