"use client";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "../../components/Brand";
import { PasswordInput } from "../../components/PasswordInput";
import { useAuth } from "../../contexts/AuthProvider";

export default function Signup(){
 const {signUp}=useAuth();
 const [fullName,setFullName]=useState(""); const [country,setCountry]=useState("Nigeria"); const [state,setState]=useState(""); const [gender,setGender]=useState<"male"|"female"|"prefer_not_to_say">("male"); const [dateOfBirth,setDateOfBirth]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [confirmPassword,setConfirmPassword]=useState(""); const [error,setError]=useState(""); const [submitting,setSubmitting]=useState(false); const [created,setCreated]=useState(false); const [needsLogin,setNeedsLogin]=useState(false);
 async function handleSubmit(){
  setError("");
  if(!fullName.trim()||!country.trim()||!state.trim()||!dateOfBirth||!email.trim()||!password||!confirmPassword){setError("Please complete all fields.");return;}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)){setError("Enter your date of birth as YYYY-MM-DD.");return;}
  const parsedDate=new Date(`${dateOfBirth}T00:00:00`);
  if(Number.isNaN(parsedDate.getTime())||parsedDate>=new Date()){setError("Enter a valid date of birth.");return;}
  if(password.length<6){setError("Password must be at least 6 characters.");return;}
  if(password!==confirmPassword){setError("Passwords do not match.");return;}
  setSubmitting(true);
  const result=await signUp(email.trim(),password,{fullName:fullName.trim(),country:country.trim(),state:state.trim(),gender,dateOfBirth});
  setSubmitting(false);
  if(result.error){setError(result.error);return;}
  setCreated(true); setNeedsLogin(!result.hasSession);
 }
 if(created){return <main className="center"><div className="form"><Brand/><div className="card card-pad" style={{marginTop:24,textAlign:"center"}}><div className="badge purple">✓ ACCOUNT CREATED</div><h1 style={{marginTop:14}}>Account created successfully</h1>{needsLogin?<><p className="muted">Your Trender account has been created. Please log in to continue.</p><Link className="btn" href="/login">Log In</Link></>:<><p className="muted">Your universal Trender account is ready. What would you like to do?</p><div className="grid grid-2" style={{marginTop:20,textAlign:"left"}}><div className="card card-pad"><span className="badge purple">📢 ADVERTISE / PROMOTE</span><h3 style={{marginTop:10}}>Business / Brand</h3><p className="muted">Promote your business, brand, artist/music, products or services.</p><Link className="btn" href="/business">Open Business / Brand</Link></div><div className="card card-pad"><span className="badge purple">🎥 CREATOR</span><h3 style={{marginTop:10}}>Become a Creator</h3><p className="muted">Apply with your Creator-specific information and start working toward eligibility.</p><Link className="btn secondary" href="/creator">Open Creator</Link></div></div></>}</div></div></main>}
 return <main className="center"><div className="form"><Brand/><div className="card card-pad" style={{marginTop:24}}><h1>Create an account</h1><p className="muted">Create one universal Trender account. Your basic information is saved once and reused when you advertise or apply as a Creator.</p>{error&&<div className="warning-box" style={{marginBottom:14}}>{error}</div>}<div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name"/></div><div className="grid grid-2"><div className="field"><label htmlFor="country">Country</label><input id="country" value={country} onChange={e=>setCountry(e.target.value)} autoComplete="country-name"/></div><div className="field"><label htmlFor="state">State</label><input id="state" value={state} onChange={e=>setState(e.target.value)} autoComplete="address-level1"/></div></div><div className="grid grid-2"><div className="field"><label htmlFor="gender">Gender</label><select id="gender" value={gender} onChange={e=>setGender(e.target.value as typeof gender)}><option value="male">Male</option><option value="female">Female</option><option value="prefer_not_to_say">Prefer not to say</option></select></div><div className="field"><label htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="text" inputMode="numeric" value={dateOfBirth} onChange={e=>setDateOfBirth(e.currentTarget.value)} placeholder="YYYY-MM-DD" maxLength={10} autoComplete="bday" aria-label="Date of birth"/></div></div><div className="field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div><div className="grid grid-2"><div className="field"><label>Password</label><PasswordInput value={password} onChange={setPassword} autoComplete="new-password"/></div><div className="field"><label>Confirm password</label><PasswordInput value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password"/></div></div><div className="form-actions"><button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>{submitting?"Creating account…":"Create an Account"}</button><Link className="btn secondary" href="/login">Log In</Link></div></div></div></main>;
}
