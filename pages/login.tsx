import React, { useRef, useEffect } from "react";
import AuthProvider, { useAuth } from "../utils/contexts/auth";
function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [SignInStatus, setSignInStatus] = React.useState(false);
  const { user, loading, error, signIn, signUp } = useAuth();
  // console.log(user, loading, error);
  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // console.log(emailRef.current?.value, passwordRef.current?.value);
    try {
      if (emailRef.current && passwordRef.current) {
        if (!SignInStatus)
          signIn(emailRef.current.value, passwordRef.current.value);
        else signUp(emailRef.current.value, passwordRef.current.value);
      }
    } catch (error: any) {
      // console.log(error.message);
    } finally {
      emailRef.current!.value = "";
      passwordRef.current!.value = "";
    }
  };
  useEffect(() => {
    if (!user) return;
    window.location.href = "/";
  }, [user]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#FFC000] flex justify-center items-center">
        <div className="absolute w-60 h-60 rounded-xl bg-[#FF7F50] -top-5 -left-16 z-0 transform rotate-45 hidden md:block"></div>
        <div className="py-12 px-12 bg-white rounded-2xl shadow-xl z-20">
          <div>
            <h1 className="text-3xl font-bold text-center mb-4 cursor-pointer">
              {SignInStatus ? "Create An Account" : "Sign In"}
            </h1>
            <p className="w-80 text-center text-sm mb-8 font-semibold text-gray-700 tracking-wide cursor-pointer">
              {SignInStatus &&
                "Create an account to enjoy all the services without any ads for free!"}
            </p>
          </div>
          <form onSubmit={handleSignUp}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Email Addres"
                className="block text-sm py-3 px-4 rounded-lg w-full border outline-none"
                ref={emailRef}
              />
              <input
                type="password"
                placeholder="Password"
                autoComplete="off"
                className="block text-sm py-3 px-4 rounded-lg w-full border outline-none"
                ref={passwordRef}
              />
            </div>
            <div className="text-center mt-6">
              <button
                type="submit"
                className="py-3 w-64 text-xl text-white bg-[#FF7F50] rounded-2xl"
              >
                {SignInStatus ? "Create Account" : "Sign In"}
              </button>
              <p className="mt-4 text-sm">
                {SignInStatus
                  ? "Already Have An Account?"
                  : "Don't Have An Account?"}
                <span
                  className="underline cursor-pointer"
                  onClick={() => setSignInStatus(!SignInStatus)}
                >
                  {SignInStatus ? "Sign In" : "Create Account"}
                </span>
              </p>
            </div>
          </form>
        </div>
        <div className="w-40 h-40 absolute bg-[#F28C28] rounded-full top-0 right-12 hidden md:block" />
        <div className="w-20 h-40 absolute bg-[#F88379] rounded-full bottom-20 left-10 transform rotate-45 hidden md:block"></div>
      </div>
    </AuthProvider>
  );
}

export default Login;
