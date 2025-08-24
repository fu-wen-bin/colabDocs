import logo from '@/assets/logo.png'
import { useState } from 'react'
import { Button, Form, Input} from 'antd'
import axios from '@/api'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router'
import { Lock, ShieldCheck, User } from 'lucide-react'

interface LogoutResponse {
  success: boolean;
  code: string;
  message: string;
}

export default function AccountLogin () {

  const { state } = useLocation()  // 从注册页传过来的参数
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const onFinish = async (values: { name: string; password: string }) => {
    console.log(values)
    const endpoint = isRegisterMode ? '/user/accountRegister' : '/user/accountLogin'
    if (endpoint === '/user/accountLogin') {
      const logoutRes = await axios.post<LogoutResponse>('/user/logout')
      console.log('自动退出Github账号：',logoutRes.data.message)
      axios.post(endpoint, values)
           .then(res => {
             // 如果现在是登录模式，调用登录接口
             console.log(res)
             // 将token存储到localStorage中
             localStorage.setItem('access_token', res.data.access_token)
             localStorage.setItem('refresh_token', res.data.refresh_token)
             // 将data转成json字符串存储到浏览器中方便后续使用用户信息
             localStorage.setItem('userInfo', JSON.stringify(res.data.userdata))
             // 登录成功弹窗
             toast.success(res.data.message)
             navigate('/doc')
           })
    }
    if (endpoint === '/user/accountRegister') { // 如果现在是注册模式，调用注册接口
      const res = await axios.post(endpoint, values)
      toast.success(res.data.message)
      setIsRegisterMode(false) // 切换回登录模式
      // 直接设置表单字段值
      form.setFieldsValue({
        name: values.name,
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
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div
        className="w-full max-w-md p-10 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center">
          <img className="w-20 h-20 rounded-full" src={logo} alt="logo"/>
          <h1 className="text-3xl font-bold text-gray-800 mt-4">
            {isRegisterMode ? '账户注册' : '账户登录'}
          </h1>
        </div>

          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            className="space-y-4"
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请填写用户名' }]}
              initialValue={state?.name}
              className="mb-[30px]"
              hasFeedback
            >

              <Input prefix={<User className="mr-2 h-5 w-5 text-gray-500" />}
                     placeholder="请输入用户名" size="large"/>

            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请填写密码' }]}
              initialValue={state?.password}
              className="mb-[30px]"
              hasFeedback
            >
              <Input.Password prefix={<Lock className="mr-2 h-4 w-5 text-gray-500" />}
                              placeholder="请输入密码" size="large"/>
            </Form.Item>

            {isRegisterMode && (
              <Form.Item
                name="confirm"
                dependencies={['password']}
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: '请确认密码',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次密码输入不同！'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<ShieldCheck className="mr-2 h-4.5 w-5 text-gray-500" />}
                                placeholder="请确认密码" size="large" />
              </Form.Item>
            )}
            <Form.Item className="pt-2">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-md"
              >
                {isRegisterMode ? '注册' : '登录'}
              </Button>
            </Form.Item>
          </Form>
        <p className="text-sm text-center text-gray-600">
          {isRegisterMode ? '已有账号？' : '没有账号？'}
          <a href="#" onClick={(e) => {
            e.preventDefault()
            toggleMode()
          }} className="font-medium text-indigo-600 hover:text-indigo-500 ml-1">
            {isRegisterMode ? '立即登录' : '免费注册'}
          </a>
        </p>
      </div>
    </div>
  )
}