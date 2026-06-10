import {useState} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import Taro from '@tarojs/taro'

export default function Login() {
  const {signInWithUsername, signUpWithUsername, signInWithWechat} = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username.trim()) {
      Taro.showToast({title: '请输入用户名', icon: 'none'})
      return
    }

    // 验证用户名格式：只能包含英文字母和数字
    const usernameRegex = /^[a-zA-Z0-9]+$/
    if (!usernameRegex.test(username)) {
      Taro.showToast({title: '用户名只能包含英文字母和数字', icon: 'none'})
      return
    }

    if (!password.trim()) {
      Taro.showToast({title: '请输入密码', icon: 'none'})
      return
    }

    if (!agreed) {
      Taro.showToast({title: '请阅读并同意用户协议和隐私政策', icon: 'none'})
      return
    }

    setLoading(true)

    try {
      const {error} = isLogin
        ? await signInWithUsername(username, password)
        : await signUpWithUsername(username, password)

      if (error) {
        Taro.showToast({
          title: isLogin ? '登录失败' : '注册失败',
          icon: 'none'
        })
        return
      }

      Taro.showToast({
        title: isLogin ? '登录成功' : '注册成功',
        icon: 'success'
      })

      // 检查是否有重定向路径
      const redirectPath = Taro.getStorageSync('loginRedirectPath')
      if (redirectPath) {
        Taro.removeStorageSync('loginRedirectPath')
        // 判断是否为tabBar页面
        if (redirectPath.includes('/pages/home/index')) {
          Taro.switchTab({url: redirectPath})
        } else {
          Taro.navigateTo({url: redirectPath})
        }
      } else {
        Taro.switchTab({url: '/pages/home/index'})
      }
    } catch (err) {
      console.error('登录/注册错误:', err)
      Taro.showToast({title: '操作失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    if (!agreed) {
      Taro.showToast({title: '请阅读并同意用户协议和隐私政策', icon: 'none'})
      return
    }

    setLoading(true)

    try {
      const {error} = await signInWithWechat()

      if (error) {
        Taro.showToast({
          title: error.message || '微信登录失败',
          icon: 'none'
        })
        return
      }

      Taro.showToast({title: '登录成功', icon: 'success'})

      const redirectPath = Taro.getStorageSync('loginRedirectPath')
      if (redirectPath) {
        Taro.removeStorageSync('loginRedirectPath')
        if (redirectPath.includes('/pages/home/index')) {
          Taro.switchTab({url: redirectPath})
        } else {
          Taro.navigateTo({url: redirectPath})
        }
      } else {
        Taro.switchTab({url: '/pages/home/index'})
      }
    } catch (err) {
      console.error('微信登录错误:', err)
      Taro.showToast({title: '微信登录失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo区域 */}
      <div className="mb-12 text-center">
        <div className="text-6xl font-bold gradient-text mb-4">勋章待办</div>
        <div className="text-xl text-muted-foreground">将每次完成转化为可视化成就</div>
      </div>

      {/* 登录表单 */}
      <div className="w-full max-w-md bg-card rounded-lg p-8 shadow-elegant">
        <div className="flex gap-4 mb-8">
          <button
            type="button"
            className={`flex-1 py-3 text-2xl font-bold transition-all flex items-center justify-center leading-none ${
              isLogin ? 'text-primary border-b-4 border-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setIsLogin(true)}>
            登录
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-2xl font-bold transition-all flex items-center justify-center leading-none ${
              !isLogin ? 'text-primary border-b-4 border-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setIsLogin(false)}>
            注册
          </button>
        </div>

        {/* 用户名输入 */}
        <div className="mb-6">
          <div className="text-xl text-foreground mb-3 font-bold">用户名</div>
          <div className="border-2 border-input rounded-lg px-4 py-4 bg-background overflow-hidden">
            <input
              className="w-full text-xl text-foreground bg-transparent outline-none"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onInput={(e) => {
                const ev = e as unknown
                setUsername((ev as {detail?: {value?: string}}).detail?.value ?? (ev as {target?: {value?: string}}).target?.value ?? '')
              }}
            />
          </div>
          <div className="text-base text-muted-foreground mt-2">
            用户名只能包含英文字母和数字
          </div>
        </div>

        {/* 密码输入 */}
        <div className="mb-6">
          <div className="text-xl text-foreground mb-3 font-bold">密码</div>
          <div className="border-2 border-input rounded-lg px-4 py-4 bg-background overflow-hidden">
            <input
              className="w-full text-xl text-foreground bg-transparent outline-none"
              type="password"
              placeholder="请输入密码"
              value={password}
              onInput={(e) => {
                const ev = e as unknown
                setPassword((ev as {detail?: {value?: string}}).detail?.value ?? (ev as {target?: {value?: string}}).target?.value ?? '')
              }}
            />
          </div>
        </div>

        {/* 协议勾选 */}
        <div className="mb-8 flex items-center gap-3" onClick={() => setAgreed(!agreed)}>
          <div
            className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${
              agreed ? 'bg-primary border-primary' : 'border-input'
            }`}>
            {agreed && <div className="i-mdi-check text-2xl text-primary-foreground" />}
          </div>
          <span className="text-lg text-muted-foreground">
            我已阅读并同意《用户协议》和《隐私政策》
          </span>
        </div>

        {/* 登录按钮 */}
        <button
          type="button"
          className={`w-full py-4 rounded-lg text-2xl font-bold transition-all mb-4 flex items-center justify-center leading-none ${
            loading ? 'bg-primary/50' : 'bg-gradient-primary shadow-elegant'
          }`}
          onClick={handleSubmit}
          disabled={loading}>
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>

        {/* 微信登录按钮 */}
        <button
          type="button"
          className={`w-full py-4 rounded-lg text-2xl font-bold transition-all border-2 border-primary flex items-center justify-center gap-3 leading-none ${
            loading ? 'opacity-50' : ''
          }`}
          onClick={handleWechatLogin}
          disabled={loading}>
          <div className="i-mdi-wechat text-3xl text-primary" />
          <span className="text-primary">微信登录</span>
        </button>
      </div>

      {/* 底部提示 */}
      <div className="mt-8 text-lg text-muted-foreground">
        {isLogin ? '还没有账号？' : '已有账号？'}
        <span className="text-primary ml-2" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '立即注册' : '立即登录'}
        </span>
      </div>
    </div>
  )
}
