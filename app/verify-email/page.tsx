"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "../../components/Brand";
import { useAuth } from "../../contexts/AuthProvider";

export default function VerifyEmail(){
 const params=useSearchParams(); const router=useRouter(); const {verifyEmailOtp,resendEmailVerification}=useAuth();
 const email=params.get("email")??""; const [token,setToken]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const [sent,setSent]=useState(false);
 async function verify(){setError(""); if(!/^\d{6}$/.test(token)){setError("Enter the 6-digit code from your email.");return;} setBusy(true); const result=await verifyEmailOtp(email,token); setBusy(false); if(result.error){setError(result.error);return;} router.push("/choose-role");}
 async function resend(){setError(""); setBusy(true); const result=await resendEmailVerification(email); setBusy(false); if(result.error){setError(result.error);return;} setSent(true);}
 return <main className="center"><div className="form"><Brand/><div className="card card-pad" style={{marginTop:24}}><h1>Verify your email</h1><p className="muted">We sent a 6-digit verification code to <strong>{email}</strong>. Enter the code below to activate your universal Trender account.</p>{error&&<div className="warning-box" style={{marginBottom:14}}>{error}</div>}{sent&&<div className="warning-box" style={{marginBottom:14}}>A new verification code has been sent.</div>}<div className="field"><label htmlFor="token">Verification code</label><input id="token" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={token} onChange={e=>setToken(e.currentTarget.value.replace(/\D/g,""))} placeholder="000000"/></div><div className="form-actions"><button className="btn" type="button" onClick={verify} disabled={busy}>{busy?"Verifying…":"Verify Email"}</button><button className="btn secondary" type="button" onClick={resend} disabled={busy}>Resend Code</button></div><p className="muted" style={{marginTop:16,fontSize:13}}>Already verified? <Link href="/login">Log in</Link></p></div></div></main>;
}
