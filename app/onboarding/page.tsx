import Link from "next/link";
import { Brand } from "../../components/Brand";

const slides = [
  ["Creators", "Find campaigns that match your niche and earn for approved content."],
  ["Affordable promotion", "Artists can spread campaign budgets across many relevant creators."],
  ["One connected platform", "Campaigns, submissions, earnings and analytics live in one place."]
];

export default function Onboarding() {
  return <main className="center"><div style={{width:"min(820px,100%)"}}>
    <Brand />
    <div className="grid grid-3" style={{marginTop:30}}>
      {slides.map(([title, text]) => <div className="card choice" key={title}><span className="badge">TRENDER</span><strong>{title}</strong><span>{text}</span></div>)}
    </div>
    <div style={{textAlign:"center",marginTop:24}}><Link className="btn" href="/choose-role">Continue</Link></div>
  </div></main>;
}
