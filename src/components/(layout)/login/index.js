'use client'
import { useState } from 'react';
import { Svg_ArowRight, Svg_Eye, Svg_unEye } from '@/components/(icon)/svg';

const isValidEmail = (email) => { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); };

const InputField = ({ label, type, value, setValue }) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleFocus = () => setFocused(true)
  const handleBlur = (e) => {
    if (e.target.value === '') setFocused(false)
  };
  const inputType = type === 'password' ? showPassword ? 'text' : 'password' : type;
  return (
    <div
      style={{
        position: 'relative',
        border: focused ? '2px solid #626262' : '2px solid var(--bg-primary)',
        backgroundColor: focused ? 'white' : '#f5f5f5',
        borderRadius: '3px',
        marginBottom: '16px',
      }}
    >
      <input
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: 'calc(100% - 32px)',
          padding: '16px',
          paddingTop: focused || value !== '' ? 22 : 16,
          paddingBottom: focused || value !== '' ? 10 : 16,
          border: 'none',
          outline: 'none',
          fontSize: '16px',
          color: '#333',
          borderRadius: 5,
          background: 'var(--bg-primary)',
        }}
      />
      <label
        htmlFor={label}
        style={{
          position: 'absolute',
          top: '16px',
          left: '12px',
          transform: `translateY(${focused || value !== '' ? '-14px' : '0'
            }) scale(${focused || value !== '' ? '0.75' : '1'})`,
          transition: 'all 0.3s ease',
          color: focused || value !== '' ? '#626262' : '#999',
          pointerEvents: 'none',
        }}
      >
        {label}
      </label>
      {type === 'password' && (
        <div
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            top: '50%',
            right: '12px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: '#626262',
          }}
          className='flex items-center justify-center'
        >
          {showPassword ? <Svg_Eye  w={18} h={18} c={'gray'}/> : <Svg_unEye  w={18} h={18} c={'gray'}/>}
        </div>
      )}
    </div>
  );
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setloading] = useState(false)
  const [error, setError] = useState('')
  const emailIsValid = isValidEmail(username);
  const passwordIsNotEmpty = password.trim() !== '';
  const isFormValid = emailIsValid && passwordIsNotEmpty;
  const handleSubmit = async () => {
    setloading(true)
    setError('')
    try {
      const data = { email: username, password, re: rememberMe };
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.mes || 'Đăng nhập thất bại');
      }
      const result = await response.json();
      window.location.reload()
    } catch (err) {
      setError(err.message)
    }
    setloading(false)
  };

  return (
    <>
      {loading ? <p className='text-xl font-semibold text-[var(--text-primary)]'>Đang đăng nhập</p> : <p className='text-xl font-semibold text-[var(--text-primary)]'>Đăng nhập</p>}
      <div
        style={{
          backgroundColor: 'white',
          padding: '32px 32px 0 32px',
          borderRadius: '8px',
          width: 'calc(100% - 64px)',
        }}
      >
        {loading ?
          <div style={{ width: '100%', aspectRatio: 1, height: 'auto' }} className='flex items-center justify-center'>
            {/* <CircularProgress color="inherit" /> */}
          </div> :
          <>
            <InputField label="Email" type="text" value={username} setValue={setUsername} />
            <InputField label="Mật khẩu" type="password" value={password} setValue={setPassword} />

            <div className="flex items-center justify-center" style={{ justifyContent: 'start', gap: 8 }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <p className="text-xs font-normal text-[var(--text-primary)]">Ghi nhớ tôi</p>
              </label>
            </div>

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            <div className="flex items-center justify-center" style={{ margin: '40px 0' }}>
              <div
                style={{
                  height: 60,
                  width: 60,
                  borderRadius: 16,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={isFormValid ? handleSubmit : undefined}
                className={isFormValid ? 'px-4 py-2.5 bg-[var(--main_d)] text-white rounded font-medium cursor-pointer border-none w-full text-center' : 'px-4 py-2.5 bg-[var(--main_d)] text-white rounded font-medium border-none w-full text-center opacity-50 cursor-not-allowed'}
              >
                <Svg_ArowRight w={28} h={28} c={'white'}/>
              </div>
            </div>
          </>}
      </div>
    </>
  );
};

export default LoginPage;
