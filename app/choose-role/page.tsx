import Link from "next/link";
import { Brand } from "../../components/Brand";

export default function ChooseRole() {
  return <main className="center"><div style={{width:"min(760px,100%)"}}>
    <Brand />
    <div className="card card-pad" style={{marginTop:30}}>
      <h1>Choose your account</h1>
      <p className="muted">You can create a Trender account as a creator or as an artist/brand.</p>
      <div className="grid grid-2" style={{marginTop:22}}>
        <Link className="choice" href="/creator/register"><strong>Creator</strong><span>Discover campaigns, create content and earn rewards.</span></Link>
        <Link className="choice" href="/artist/register"><strong>Artist / Brand</strong><span>Launch campaigns and reach creators.</span></Link>
      </div>
      <p className="muted" style={{textAlign:"center",marginTop:18}}>Already have an account? <Link href="/login">Log in</Link></p>
    </div>
  </div></main>;
}
