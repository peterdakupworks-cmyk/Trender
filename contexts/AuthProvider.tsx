"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import type { ProfileRow } from "../lib/supabase/types";
import { resolveAndCheckCreatorCapability } from "../lib/supabase/creatorRegistration";
import { completeAdvertiserRegistration } from "../lib/supabase/advertiserRegistration";
import { getPendingAdvertiserRegistration, clearPendingAdvertiserRegistration } from "../lib/pendingAdvertiserRegistration";

export type UniversalSignupData = {
  fullName: string;
  country: string;
  state: string;
  gender: "male" | "female" | "prefer_not_to_say";
  dateOfBirth: string;
};

type AuthContextValue = {
  session: Session | null; user: User | null; profile: ProfileRow | null; loading: boolean; error: string | null;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, data?: UniversalSignupData) => Promise<{ error: string | null; userId: string | null; hasSession: boolean; needsEmailVerification: boolean }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resendEmailVerification: (email: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
function friendlyAuthError(message: string): string { const m=message.toLowerCase(); if(m.includes("invalid login credentials"))return "Incorrect email or password."; if(m.includes("already registered")||m.includes("already exists"))return "An account with this email already exists."; if(m.includes("password")&&m.includes("least"))return "Password is too short — Supabase requires at least 6 characters."; if(m.includes("email")&&m.includes("invalid"))return "That doesn't look like a valid email address."; return "Something went wrong. Please try again."; }

export function AuthProvider({children}:{children:React.ReactNode}) {
 const [session,setSession]=useState<Session|null>(null); const [profile,setProfile]=useState<ProfileRow|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null); const [configError,setConfigError]=useState<string|null>(null);
 const loadProfile=useCallback(async(userId:string)=>{try{const supabase=getSupabaseBrowserClient(); const {data,error:fetchError}=await supabase.from("profiles").select("*").eq("id",userId).single(); if(fetchError){setError("Couldn't load your profile. Please refresh the page.");return;} setProfile(data as ProfileRow); const {hasProfile:creatorResolved}=await resolveAndCheckCreatorCapability(supabase,userId); if(creatorResolved){const {data:refreshed}=await supabase.from("profiles").select("*").eq("id",userId).single();if(refreshed)setProfile(refreshed as ProfileRow);} const pendingAdvertiser=getPendingAdvertiserRegistration(); if(pendingAdvertiser){const {error:completeError}=await completeAdvertiserRegistration(supabase,{userId,advertiserType:pendingAdvertiser.accountType,name:pendingAdvertiser.name,country:"Nigeria",state:pendingAdvertiser.state,city:pendingAdvertiser.city,category:pendingAdvertiser.category,description:pendingAdvertiser.description,websiteUrl:pendingAdvertiser.websiteUrl,logoUrl:pendingAdvertiser.logoUrl,contactInfo:pendingAdvertiser.contact,spotifyUrl:pendingAdvertiser.spotifyUrl});if(!completeError)clearPendingAdvertiserRegistration();}}catch{setConfigError("Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");}},[]);
 useEffect(()=>{let supabase;try{supabase=getSupabaseBrowserClient();}catch{setConfigError("Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");setLoading(false);return;}supabase.auth.getSession().then(({data})=>{setSession(data.session);if(data.session?.user)loadProfile(data.session.user.id);setLoading(false);});const {data:listener}=supabase.auth.onAuthStateChange((_event,newSession)=>{setSession(newSession);if(newSession?.user)loadProfile(newSession.user.id);else setProfile(null);});return()=>listener.subscription.unsubscribe();},[loadProfile]);
 async function signUp(email:string,password:string,data?:UniversalSignupData){setError(null);if(configError)return{error:configError,userId:null,hasSession:false,needsEmailVerification:false};try{const supabase=getSupabaseBrowserClient();const {data:result,error:signUpError}=await supabase.auth.signUp({email,password,options:{data:data?{full_name:data.fullName,country:data.country,state:data.state,gender:data.gender,date_of_birth:data.dateOfBirth}:undefined}});if(signUpError){const friendly=friendlyAuthError(signUpError.message);setError(friendly);return{error:friendly,userId:null,hasSession:false,needsEmailVerification:false};}return{error:null,userId:result.user?.id??null,hasSession:!!result.session,needsEmailVerification:!result.session};}catch{const friendly="Couldn't reach Trender's servers. Check your connection and try again.";setError(friendly);return{error:friendly,userId:null,hasSession:false,needsEmailVerification:false};}}
 async function verifyEmailOtp(email:string,token:string){setError(null);try{const {data,error:verifyError}=await getSupabaseBrowserClient().auth.verifyOtp({email,token,type:"email"});if(verifyError){const friendly="That verification code is invalid or has expired. Please request a new code.";setError(friendly);return{error:friendly};}if(data.session)await loadProfile(data.session.user.id);return{error:null};}catch{return{error:"Couldn't verify your email. Please try again."};}}
 async function resendEmailVerification(email:string){setError(null);try{const {error:resendError}=await getSupabaseBrowserClient().auth.resend({type:"signup",email});if(resendError){setError("We couldn't resend the verification code yet. Please wait a moment and try again.");return{error:"We couldn't resend the verification code yet. Please wait a moment and try again."};}return{error:null};}catch{return{error:"Couldn't resend the verification code. Please try again."};}}
 async function signIn(email:string,password:string){setError(null);if(configError)return{error:configError};try{const supabase=getSupabaseBrowserClient();const {error:signInError}=await supabase.auth.signInWithPassword({email,password});if(signInError){const friendly=friendlyAuthError(signInError.message);setError(friendly);return{error:friendly};}return{error:null};}catch{return{error:"Couldn't reach Trender's servers. Check your connection and try again."};}}
 async function signOut(){try{await getSupabaseBrowserClient().auth.signOut();}catch{}setSession(null);setProfile(null);} async function refreshProfile(){if(session?.user)await loadProfile(session.user.id);}
 return <AuthContext.Provider value={{session,user:session?.user??null,profile,loading,error:error??configError,refreshProfile,signUp,verifyEmailOtp,resendEmailVerification,signIn,signOut}}>{children}</AuthContext.Provider>;
}
export function useAuth():AuthContextValue{const ctx=useContext(AuthContext);if(!ctx)throw new Error("useAuth must be used within an AuthProvider");return ctx;}
