Clout navigation. Pick by scope: **TabBar** (app destinations, mobile) → **NavBar** (screen chrome) → **Tabs** (in-page sections) → **SegmentedControl** (2–4 view switch) → **Menu** (actions from a trigger).

```jsx
<NavBar title="Sunday Slate" onBack={fn} actions={<NavIconButton icon="bell" label="Notifications" badge />} />
<Tabs items={[{id:'live',label:'Live',count:3},{id:'upcoming',label:'Upcoming'}]} active={t} onChange={setT} />
<SegmentedControl items={[{id:'d',label:'Daily'},{id:'w',label:'Weekly'}]} value={v} onChange={setV} />
<Menu items={[{id:'share',label:'Share',icon:'share'},{divider:true},{id:'leave',label:'Leave contest',tone:'danger'}]} onSelect={fn} />
<TabBar items={[{id:'home',label:'Home',icon:'bolt'},{id:'picks',label:'Picks',icon:'target'}]} active={a} onChange={setA} />
```

Rules: TabBar carries 3–5 labelled destinations and respects `--safe-bottom`; NavBar is sticky with blur so cinematic heroes read through; icon-only buttons always take an `aria-label`; on mobile a Menu is presented as a bottom `Sheet`, never a floating popover.
