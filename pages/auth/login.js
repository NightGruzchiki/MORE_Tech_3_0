import React from 'react'
import { TextField } from '@mui/material'

import Link from '../../client/Link'
import AuthContainer from '../../client/AuthContainer'
import AuthForm from '../../client/AuthForm'
import AuthFormControl from '../../client/AuthFormControl'
import AuthButton from '../../client/AuthButton'

const Login = () => {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')

  const onChangeUsername = (e) => setUsername(e.target.value)
  const onChangePassword = (e) => setPassword(e.target.value)

  return (
    <AuthContainer>
      <AuthForm autoComplete="off" noValidate action="/api/login" method="post">
        <AuthFormControl variant="outlined">
          <TextField
            id="username"
            name="username"
            type="text"
            label="ЛОГИН"
            value={username}
            onChange={onChangeUsername}
            variant="outlined"
            margin="normal"
          />
        </AuthFormControl>
        <AuthFormControl variant="outlined">
          <TextField
            id="password"
            name="password"
            type="password"
            label="ПАРОЛЬ"
            value={password}
            onChange={onChangePassword}
            variant="outlined"
            margin="normal"
          />
        </AuthFormControl>
        <AuthButton
          type="submit"
          variant="outlined"
          color="primary"
          size="large"
        >
          ВОЙТИ
        </AuthButton>
        <br />
        <Link href="/auth/register" color="secondary">
          Создать аккаунт
        </Link>
      </AuthForm>
    </AuthContainer>
  )
}

export default Login
