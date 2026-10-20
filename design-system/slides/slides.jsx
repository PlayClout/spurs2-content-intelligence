/* Clout slide kit — reusable 16:9 layouts (1280×720). Self-contained: tokens + asset SVGs +
   inline styles that mirror the component library. Shared primitives exported to window. */
const D = 'var(--font-display)', B = 'var(--font-body)';
const frame = { position:'relative', width:1280, height:720, background:'var(--clout-black)', color:'var(--clout-white)', overflow:'hidden', fontFamily:B, flex:'none' };
const splitBg = { position:'absolute', inset:0, background:'var(--clout-splitlight)' };
const vignette = { position:'absolute', inset:0, background:'var(--vignette)', pointerEvents:'none' };
const pad = 88;

function Kicker({ children, color='var(--clout-hyper-blue)' }){
  return <div style={{ fontFamily:B, fontWeight:700, fontSize:18, letterSpacing:'0.16em', textTransform:'uppercase', color }}>{children}</div>;
}
function Display({ children, size=110, gradient=false, style }){
  return <div style={{ fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:size, lineHeight:0.9, textTransform:'uppercase', letterSpacing:'0.01em',
    ...(gradient ? { background:'var(--clout-gradient-action)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' } : {}), ...style }}>{children}</div>;
}
function Mark({ h=30, src='wordmark' }){
  return <img src={`../assets/logo/clout_${src}_white.svg`} style={{ height:h }} alt="Clout" />;
}
function CTA({ children='Join Now' }){
  return <span style={{ display:'inline-flex', alignItems:'center', gap:14, height:64, padding:'0 22px 0 30px', borderRadius:999,
    background:'var(--clout-gradient-action)', boxShadow:'var(--glow-action)', fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:20, textTransform:'uppercase', letterSpacing:'0.02em' }}>
    {children}
    <span style={{ width:40, height:40, borderRadius:999, background:'var(--clout-black)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--clout-pink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15"/><path d="M13 6l6 6-6 6"/></svg>
    </span></span>;
}
function Foot({ n, label }){
  return <div style={{ position:'absolute', left:pad, right:pad, bottom:36, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:B, fontSize:13, color:'var(--clout-slate-dim)', letterSpacing:'0.06em' }}>
    <Mark h={20} /><span style={{ textTransform:'uppercase' }}>{label}</span><span style={{ fontVariantNumeric:'tabular-nums' }}>{n}</span></div>;
}

/* 1 · Title */
function TitleSlide(){
  return <div style={frame}><div style={splitBg}/><div style={vignette}/>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'flex', flexDirection:'column', justifyContent:'center', gap:20 }}>
      <Kicker>Fan Engagement · Gamified</Kicker>
      <Display size={150} style={{ letterSpacing:'0.02em' }}>Compete.<br/>Win.<br/><span style={{ color:'var(--clout-pink)' }}>Be Clout.</span></Display>
      <div style={{ fontFamily:B, fontSize:22, color:'var(--clout-slate)', maxWidth:640, marginTop:8 }}>The premium, cinematic platform where competing to win is the point — across every sport and screen.</div>
    </div>
    <div style={{ position:'absolute', top:pad, right:pad }}><Mark h={34}/></div>
    <Foot n="01" label="Investor Overview · Confidential" />
  </div>;
}

/* 2 · Section Divider */
function SectionSlide(){
  return <div style={frame}>
    <div style={{ position:'absolute', inset:0, background:'var(--clout-gradient-atmosphere)', opacity:0.92 }}/>
    <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 80% 110%, rgba(5,8,17,.7), rgba(5,8,17,0) 60%)' }}/>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'flex', flexDirection:'column', justifyContent:'center' }}>
      <div style={{ fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:220, lineHeight:0.8, color:'rgba(255,255,255,.22)' }}>02</div>
      <Display size={92} style={{ marginTop:-20 }}>The Opportunity</Display>
      <div style={{ width:200, height:6, borderRadius:3, background:'var(--clout-white)', marginTop:24 }}/>
    </div>
    <div style={{ position:'absolute', top:pad, right:pad }}><Mark h={30}/></div>
  </div>;
}

/* 3 · Prize / Product */
function PrizeSlide(){
  return <div style={frame}><div style={{position:'absolute',inset:0,background:'var(--wash-blue)'}}/><div style={vignette}/>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Kicker>Win a</Kicker>
        <Display size={120} gradient>$10,000</Display>
        <div style={{ fontFamily:D, fontStyle:'italic', fontWeight:600, fontSize:34, textTransform:'uppercase' }}>PGA Superstore Gift Card</div>
        <div style={{ marginTop:14 }}><CTA>Join the Open Pass</CTA></div>
      </div>
      <div style={{ background:'var(--clout-carbon)', border:'2px solid var(--border-blue)', borderRadius:22, boxShadow:'var(--shadow-card)', padding:'34px 40px', display:'flex', flexDirection:'column', gap:22 }}>
        <div style={{ fontFamily:B, fontWeight:700, fontSize:14, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--clout-blue-tint)' }}>What you get</div>
        {['Free entry to every weekly contest','Predict · compete · climb the board','Real prizes, paid instantly'].map((t,i)=>
          <div key={i} style={{ display:'flex', gap:14, alignItems:'center', fontFamily:B, fontSize:18 }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--clout-hyper-blue)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>{t}</div>)}
      </div>
    </div>
    <Foot n="03" label="Product" />
  </div>;
}

/* 4 · Stat / KPI */
function StatSlide(){
  const stats = [['$2.4M','Prizes awarded','var(--clout-pink)'],['480K','Active players','var(--clout-white)'],['92%','Weekly retention','var(--clout-hyper-blue)'],['38','Sports & leagues','var(--clout-signal-orange)']];
  return <div style={frame}><div style={{position:'absolute',inset:0,background:'var(--wash-warm)'}}/>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'flex', flexDirection:'column', justifyContent:'center', gap:44 }}>
      <div><Kicker>Traction</Kicker><Display size={72} style={{ marginTop:12 }}>The numbers compound</Display></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
        {stats.map(([v,l,c],i)=>
          <div key={i} style={{ background:'var(--clout-black)', border:'1.5px solid var(--border-hairline)', borderRadius:14, padding:'26px 24px', display:'flex', flexDirection:'column', gap:8 }}>
            <span style={{ fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:56, lineHeight:0.9, color:c }}>{v}</span>
            <span style={{ fontFamily:B, fontWeight:600, fontSize:15, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--clout-slate)' }}>{l}</span>
          </div>)}
      </div>
    </div>
    <Foot n="04" label="Traction" />
  </div>;
}

/* 5 · Comparison */
function CompareSlide(){
  const rows = [['Rewards real participation',true,false],['Cinematic, premium feel',true,false],['Every sport & screen',true,false],['Predatory monetization',false,true]];
  return <div style={frame}>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'flex', flexDirection:'column', justifyContent:'center', gap:34 }}>
      <div><Kicker>Why Clout</Kicker><Display size={72} style={{ marginTop:12 }}>Not another sportsbook</Display></div>
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr', gap:0, border:'1.5px solid var(--border-hairline)', borderRadius:18, overflow:'hidden' }}>
        <div style={{ padding:'20px 26px', background:'var(--clout-carbon)' }}/>
        <div style={{ padding:'20px 26px', background:'var(--clout-carbon)', fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:26, textTransform:'uppercase', textAlign:'center', color:'var(--clout-pink)' }}>Clout</div>
        <div style={{ padding:'20px 26px', background:'var(--clout-carbon)', fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:26, textTransform:'uppercase', textAlign:'center', color:'var(--clout-slate)' }}>Generic</div>
        {rows.map(([label,a,b],i)=>[
          <div key={i+'l'} style={{ padding:'18px 26px', fontFamily:B, fontSize:18, borderTop:'1px solid var(--border-hairline)' }}>{label}</div>,
          <Mk key={i+'a'} on={a}/>, <Mk key={i+'b'} on={b} dim/>
        ])}
      </div>
    </div>
    <Foot n="05" label="Comparison" />
  </div>;
}
function Mk({ on, dim }){
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', borderTop:'1px solid var(--border-hairline)' }}>
    {on ? <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={dim?'var(--clout-slate)':'var(--clout-hyper-blue)'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
        : <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--clout-slate-dim)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>}
  </div>;
}

/* 6 · Big Quote */
function QuoteSlide(){
  return <div style={frame}><div style={{position:'absolute',inset:0,background:'var(--wash-blue)'}}/><div style={vignette}/>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'flex', flexDirection:'column', justifyContent:'center', gap:36 }}>
      <div style={{ fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:64, lineHeight:1.02, textTransform:'uppercase', maxWidth:960 }}>
        "It finally feels like <span style={{ color:'var(--clout-pink)' }}>the game rewards me</span> for showing up every week."</div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:6, height:48, background:'var(--clout-gradient-action)', borderRadius:3 }}/>
        <div><div style={{ fontFamily:B, fontWeight:700, fontSize:18 }}>Jordan M.</div><div style={{ fontFamily:B, fontSize:15, color:'var(--clout-slate)' }}>Open Pass member · 14-week streak</div></div>
      </div>
    </div>
    <Foot n="06" label="Voice of the fan" />
  </div>;
}

/* 7 · Roadmap / Timeline */
function RoadmapSlide(){
  const items = [['Q1','Open Pass launch','var(--clout-hyper-blue)'],['Q2','Creator clans','var(--clout-electric-blue)'],['Q3','World Cup Pass','var(--clout-violet)'],['Q4','Partner hubs','var(--clout-pink)']];
  return <div style={frame}>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'flex', flexDirection:'column', justifyContent:'center', gap:56 }}>
      <div><Kicker>Roadmap · 2026</Kicker><Display size={72} style={{ marginTop:12 }}>Where we're going</Display></div>
      <div style={{ position:'relative', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
        <div style={{ position:'absolute', top:11, left:'6%', right:'6%', height:3, background:'var(--clout-gradient-atmosphere)' }}/>
        {items.map(([q,t,c],i)=>
          <div key={i} style={{ display:'flex', flexDirection:'column', gap:16, position:'relative' }}>
            <span style={{ width:24, height:24, borderRadius:999, background:c, boxShadow:`0 0 18px ${c}`, border:'3px solid var(--clout-black)' }}/>
            <span style={{ fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:36, color:c }}>{q}</span>
            <span style={{ fontFamily:B, fontSize:18, color:'var(--clout-white)' }}>{t}</span>
          </div>)}
      </div>
    </div>
    <Foot n="07" label="Roadmap" />
  </div>;
}

/* 8 · Partnership / CTA close */
function CloseSlide(){
  return <div style={frame}><div style={splitBg}/><div style={vignette}/>
    <div style={{ position:'absolute', inset:0, padding:pad, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', gap:26 }}>
      <Mark h={44}/>
      <Display size={100}>Let's build the<br/>default layer of<br/>fandom together</Display>
      <div style={{ display:'flex', gap:18, alignItems:'center', marginTop:10 }}>
        <CTA>Partner with Clout</CTA>
        <span style={{ display:'inline-flex', padding:'14px 30px', borderRadius:999, border:'3px solid transparent', background:'linear-gradient(var(--clout-black),var(--clout-black)) padding-box, var(--clout-gradient-action) border-box', fontFamily:D, fontStyle:'italic', fontWeight:700, fontSize:20, textTransform:'uppercase' }}>partners@clout.gg</span>
      </div>
    </div>
    <Foot n="08" label="Compete · Win · Be Clout" />
  </div>;
}

const SLIDES = [TitleSlide, SectionSlide, PrizeSlide, StatSlide, CompareSlide, QuoteSlide, RoadmapSlide, CloseSlide];
Object.assign(window, { SLIDES, TitleSlide, SectionSlide, PrizeSlide, StatSlide, CompareSlide, QuoteSlide, RoadmapSlide, CloseSlide });
