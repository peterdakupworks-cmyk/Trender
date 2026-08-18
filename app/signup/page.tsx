"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "../../components/Brand";
import { PasswordInput } from "../../components/PasswordInput";
import { useAuth } from "../../contexts/AuthProvider";

export default function Signup(){
 const {signUp}=useAuth(); const router=useRouter();
 const [fullName,setFullName]=useState(""); const [country,setCountry]=useState("Nigeria"); const [state,setState]=useState(""); const [gender,setGender]=useState<"male"|"female"|"prefer_not_to_say">("male"); const [dateOfBirth,setDateOfBirth]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [confirmPassword,setConfirmPassword]=useState(""); const [error,setError]=useState(""); const [submitting,setSubmitting]=useState(false);
 const today=new Date().toISOString().split("T")[0];
 async function handleSubmit(){
  if(!fullName.trim()||!country.trim()||!state.trim()||!dateOfBirth||!email.trim()||!password||!confirmPassword){setError("Please complete all fields.");return;}
  if(password.length<6){setError("Password must be at least 6 characters.");return;}
  if(password!==confirmPassword){setError("Passwords do not match.");return;}
  if(dateOfBirth>=today){setError("Enter a valid date of birth.");return;}
  setSubmitting(true);const {error:signUpError}=await signUp(email.trim(),password,{fullName:fullName.trim(),country:country.trim(),state:state.trim(),gender,dateOfBirth});setSubmitting(false);
  if(signUpError){setError(signUpError);return;} router.push("/choose-role");
 }
 return <main className="center"><div className="form"><Brand/><div className="card card-pad" style={{marginTop:24}}><h1>Create an account</h1><p className="muted">Create one universal Trender account. Your basic information is saved once and reused when you advertise or apply as a Creator.</p>{error&&<div className="warning-box" style={{marginBottom:14}}>{error}</div>}
 <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name"/></div>
 <div className="grid grid-2"><div className="field"><label htmlFor="country">Country</label><input id="country" value={country} onChange={e=>setCountry(e.target.value)} autoComplete="country-name"/></div><div className="field"><label htmlFor="state">State</label><input id="state" value={state} onChange={e=>setState(e.target.value)} autoComplete="address-level1"/></div></div>
 <div className="grid grid-2"><div className="field"><label htmlFor="gender">Gender</label><select id="gender" value={gender} onChange={e=>setGender(e.target.value as typeof gender)}><option value="male">Male</option><option value="female">Female</option><option value="prefer_not_to_say">Prefer not to say</option></select></div><div className="field"><label htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" value={dateOfBirth} max={today} autoComplete="bday" onChange={e=>setDateOfBirth(e.currentTarget.value)} onInput={e=>setDateOfBirth(e.currentTarget.value)}/></div></div>
 <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div>
 <div className="grid grid-2"><div className="field"><label>Password</label><PasswordInput value={password} onChange={setPassword} autoComplete="new-password"/></div><div className="field"><label>Confirm password</label><PasswordInput value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password"/></div></div>
 <div className="form-actions"><button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>{submitting?"Creating account…":"Create an Account"}</button><Link className="btn secondary" href="/login">Log In</Link></div></div></div></main>;
}
