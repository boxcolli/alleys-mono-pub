import { Outlet, useNavigate } from "@remix-run/react";
import { $PATH } from "~/config";

export default function Page() {
  const navigate = useNavigate()
  
  return (
    <>
      <h2>비밀번호 재설정</h2>
      <div className="row">
        <a href={$PATH.auth.login}
          onClick={e => {
            e.preventDefault()
            navigate($PATH.auth.login, { preventScrollReset: true, replace: true })
          }}
        >
          <p className="primary-text"><strong>로그인</strong></p>
        </a>

        <a href={$PATH.auth.signup}
          onClick={e => {
            e.preventDefault()
            navigate($PATH.auth.signup, { preventScrollReset: true, replace: true })
          }}
        >
          <p className="primary-text"><strong>회원가입</strong></p>
        </a>
      </div>
      <Outlet />
    </>
  )
}