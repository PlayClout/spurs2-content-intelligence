/* Clout product UI kit — screen compositions built ONLY from design-system components.
   Mobile-first: these are the 390×844 canonical phone screens. */
const DS = window.CloutDesignSystem_49ec9a;
const { Button, Icon, NavBar, NavIconButton, TabBar, Tabs, SegmentedControl, Surface,
  Chip, Avatar, StatBlock, ListRow, Modal, Progress, InlineAlert, EmptyState, Skeleton,
  SkeletonText, FormField, Input, Checkbox, PassCard, PickemCard, ChallengeCard, RewardCard,
  MarketplaceItem, ProfileHeader, LeaderboardRow, OnboardingStep, EligibilityGate } = DS;

const screen = {
  display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-canvas)', overflow: 'hidden',
};
/* Scroll region: a plain block so children overflow (and scroll) instead of being
   compressed by flex-shrink. The flex column lives in an auto-height wrapper inside. */
const body = {
  flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--screen-pad-mobile)',
};
const stack = { display: 'flex', flexDirection: 'column', gap: 16 };
function Body({ center = false, children }) {
  return (
    <div style={body}>
      <div style={center ? { ...stack, minHeight: '100%', justifyContent: 'center' } : stack}>{children}</div>
    </div>
  );
}
const SectionTitle = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'var(--text-xl)', textTransform: 'uppercase', color: 'var(--fg-default)' }}>{children}</span>
    {action && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-accent)' }}>{action}</span>}
  </div>
);

/* ── HOME ─────────────────────────────────────────────────── */
function HomeScreen({ nav }) {
  return (
    <div style={screen}>
      <NavBar centerTitle={false}
        leading={<img src="../../assets/logo/clout_wordmark_white.svg" alt="Clout" style={{ height: 18, marginLeft: 8 }} />}
        actions={<><NavIconButton icon="bell" label="Notifications" badge /><NavIconButton icon="user" label="Profile" onClick={() => nav('profile')} /></>} />
      <Body>
        <InlineAlert status="warning" title="Picks lock in 12 minutes">Lock them in to stay eligible for the Sunday Slate.</InlineAlert>

        <SectionTitle action="See all">Your passes</SectionTitle>
        <PassCard name="Open Pass" sport="NFL · Week 12" tier="upgrade" prizes="$50K" actionsLeft="3"
          progress={62} progressLabel="4 / 7 actions" onClick={() => nav('picks')} />
        <PassCard name="World Cup Pass" sport="Soccer · Group stage" prizes="$25K" expiresIn="6d" status="Active" />

        <SectionTitle action="All challenges">Daily challenges</SectionTitle>
        <ChallengeCard title="Make 5 predictions" description="Any sport counts." icon="target" reward="250"
          state="in-progress" progress={60} progressLabel="3 of 5 predictions" timeLeft="6h left" />
        <ChallengeCard title="Weekend streak" description="Get 3 predictions correct in a row." icon="fire" reward="$10"
          rewardType="coins" state="complete" onAction={() => nav('rewards')} timeLeft="2d left" />

        <SectionTitle>This week</SectionTitle>
        <Surface padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <StatBlock size="sm" value="62%" label="Win rate" delta="+4%" />
            <StatBlock size="sm" value="14" label="Streak" tone="value" />
            <StatBlock size="sm" value="1,240" label="XP" tone="accent" />
          </div>
        </Surface>
      </Body>
      <TabBar active="home" onChange={nav} items={TABS} />
    </div>
  );
}

/* ── PICK'EM ──────────────────────────────────────────────── */
function PicksScreen({ nav }) {
  const [sel, setSel] = React.useState({ mahomes: 'o' });
  const [confirm, setConfirm] = React.useState(false);
  const [tab, setTab] = React.useState('open');
  const pick = (k) => (v) => setSel((s) => ({ ...s, [k]: v }));
  return (
    <div style={screen}>
      <NavBar title="Sunday Slate" onBack={() => nav('home')}
        actions={<NavIconButton icon="share" label="Share" />} />
      <div style={{ padding: '0 var(--screen-pad-mobile)' }}>
        <Tabs active={tab} onChange={setTab} items={[{ id: 'open', label: 'Open', count: 3 }, { id: 'locked', label: 'Locked' }, { id: 'settled', label: 'Settled', count: 12 }]} />
      </div>
      <Body>
        <Surface variant="sunken" padding="sm">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)' }}>Entry</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Chip tone="accent">4 / 7 picks</Chip><Chip tone="value">Up to 900 XP</Chip>
            </span>
          </div>
        </Surface>

        <PickemCard subject="P. Mahomes" meta="KC @ BUF · Sun 4:25pm" line="Passing yards 274.5" xpValue="120 XP"
          options={[{ id: 'o', label: 'Over', detail: '120 XP' }, { id: 'u', label: 'Under', detail: '120 XP' }]}
          selected={sel.mahomes} onSelect={pick('mahomes')} lockLabel="Locks 4:25pm" />
        <PickemCard subject="J. Jefferson" meta="MIN @ GB · Sun 1:00pm" line="Receiving yards 88.5" xpValue="150 XP"
          options={[{ id: 'o', label: 'Over', detail: '150 XP' }, { id: 'u', label: 'Under', detail: '150 XP' }]}
          selected={sel.jj} onSelect={pick('jj')} lockLabel="Locks 1:00pm" />
        <PickemCard subject="C. McCaffrey" meta="SF @ SEA · Settled" line="Rushing yards 78.5"
          options={[{ id: 'o', label: 'Over' }, { id: 'u', label: 'Under' }]} selected="o" state="correct" />
        <PickemCard subject="T. Hill" meta="MIA @ NYJ · Settled" line="Receptions 6.5"
          options={[{ id: 'o', label: 'Over' }, { id: 'u', label: 'Under' }]} selected="u" state="incorrect" />
      </Body>
      <div style={{ padding: 'var(--screen-pad-mobile)', borderTop: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
        <Button style={{ width: '100%' }} onClick={() => setConfirm(true)}>Submit 4 picks</Button>
      </div>
      <TabBar active="picks" onChange={nav} items={TABS} />
      {confirm && (
        <Modal presentation="sheet" title="Confirm your picks"
          description="Free to play — no entry needed. Picks lock at kickoff and can't be changed."
          onClose={() => setConfirm(false)}
          footer={<><Button family="dark" size="small" showArrow={false} onClick={() => setConfirm(false)}>Cancel</Button><Button size="small" onClick={() => setConfirm(false)}>Lock it in</Button></>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ListRow title="P. Mahomes · Over 274.5" subtitle="KC @ BUF" value="120 XP" valueTone="value" />
            <ListRow title="J. Jefferson · Over 88.5" subtitle="MIN @ GB" value="150 XP" valueTone="value" divider={false} />
            <Checkbox id="ack" label="I understand picks are final" />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── REWARDS ──────────────────────────────────────────────── */
function RewardsScreen({ nav }) {
  const [view, setView] = React.useState('rewards');
  const [redeem, setRedeem] = React.useState(false);
  return (
    <div style={screen}>
      <NavBar title="Rewards" actions={<NavIconButton icon="clock" label="History" />} />
      <div style={{ padding: '0 var(--screen-pad-mobile) 12px' }}>
        <SegmentedControl value={view} onChange={setView}
          items={[{ id: 'rewards', label: 'Rewards' }, { id: 'shop', label: 'Shop' }]} />
      </div>
      <Body>
        {view === 'rewards' ? (
          <>
            <Surface variant="accent" padding="lg">
              <Progress label="Season pass" valueLabel="1,240 / 2,000 XP" value={62} />
              <div style={{ marginTop: 14, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-muted)' }}>
                760 XP to Tier 3 — unlocks the jersey drop.
              </div>
            </Surface>
            <SectionTitle>Ready to redeem</SectionTitle>
            <RewardCard title="PGA Superstore Gift Card" value="$500" state="unlocked" requiresEligibility onRedeem={() => setRedeem(true)} />
            <SectionTitle>Locked</SectionTitle>
            <RewardCard compact title="Official Team Jersey" state="locked" requirement="Reach Tier 3 to unlock" />
            <RewardCard compact title="Courtside Experience" state="locked" requirement="Reach Tier 5 to unlock" />
            <SectionTitle>Redeemed</SectionTitle>
            <RewardCard compact title="Nike Gift Card" value="$50" state="redeemed" redeemedOn="Redeemed Mar 4" />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip selectable selected>All</Chip><Chip selectable>Apparel</Chip><Chip selectable>Tech</Chip><Chip selectable>Experiences</Chip>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MarketplaceItem brand="Nike" name="Dri-FIT Training Tee" cost="2,500" stock="12 left" />
              <MarketplaceItem brand="Clout" name="Signature Hoodie" cost="6,000" state="low-stock" stock="3 left" />
              <MarketplaceItem brand="Beats" name="Studio Pro Headphones" cost="18,000" state="sold-out" />
              <MarketplaceItem brand="Clout" name="Team Cap" cost="1,800" state="owned" />
            </div>
          </>
        )}
      </Body>
      <TabBar active="rewards" onChange={nav} items={TABS} />
      {redeem && (
        <Modal presentation="sheet" dismissible={false} title="Verify to redeem"
          onClose={() => setRedeem(false)}
          footer={<><Button family="dark" size="small" showArrow={false} onClick={() => setRedeem(false)}>Not now</Button><Button size="small" onClick={() => setRedeem(false)}>Verify location</Button></>}>
          <EligibilityGate prizeName="$500 PGA Superstore Gift Card" steps={[
            { id: 'age', label: "Confirm you're 18+", detail: 'Completed at first redemption', state: 'complete' },
            { id: 'geo', label: 'Verify your location', detail: 'Required in your region', state: 'active' },
            { id: 'kyc', label: 'Verify identity', detail: 'Needed to ship physical prizes', state: 'pending' },
          ]} />
        </Modal>
      )}
    </div>
  );
}

/* ── PROFILE ──────────────────────────────────────────────── */
function ProfileScreen({ nav }) {
  return (
    <div style={screen}>
      <NavBar title="Profile" onBack={() => nav('home')} actions={<NavIconButton icon="menu" label="Settings" />} />
      <Body>
        <ProfileHeader name="Jordan M." handle="@jmvp" tier="Gold" rank="#1,204" xp={1240} xpMax={2000} level={7}
          onEdit={() => {}}
          stats={[{ value: '62%', label: 'Win rate' }, { value: '14', label: 'Streak', tone: 'value' }, { value: '$1.2K', label: 'Won', tone: 'value' }]} />
        <SectionTitle action="Full board">Leaderboard</SectionTitle>
        <Surface padding="sm">
          <LeaderboardRow rank={1} name="Alex R." meta="18-week streak" score="1,480" delta={1} prize="$500" />
          <LeaderboardRow rank={2} name="Jordan M." meta="14-week streak" score="1,240" delta={2} prize="$250" isCurrentUser />
          <LeaderboardRow rank={3} name="Sam K." score="1,105" delta={-1} prize="$100" />
        </Surface>
        <SectionTitle>Account</SectionTitle>
        <Surface padding="none" style={{ overflow: 'hidden' }}>
          <ListRow leading={<Icon name="gift" size={20} color="var(--fg-secondary)" />} title="Redeemed rewards" value="6" chevron />
          <ListRow leading={<Icon name="coin" size={20} color="var(--fg-secondary)" />} title="Coin balance" value="8,420" valueTone="value" chevron />
          <ListRow leading={<Icon name="bell" size={20} color="var(--fg-secondary)" />} title="Notifications" chevron />
          <ListRow leading={<Icon name="external" size={20} color="var(--fg-secondary)" />} title="Responsible play" chevron divider={false} />
        </Surface>
      </Body>
      <TabBar active="me" onChange={nav} items={TABS} />
    </div>
  );
}

/* ── ONBOARDING ───────────────────────────────────────────── */
function OnboardingScreen({ nav }) {
  const [step, setStep] = React.useState(1);
  const heroes = [
    <div key="1" style={{ display: 'grid', placeItems: 'center', width: 180, height: 180, borderRadius: '50%', background: 'var(--clout-gradient-atmosphere)', boxShadow: 'var(--glow-blue)' }}>
      <img src="../../assets/logo/clout_symbol_white.svg" alt="" style={{ width: 84 }} />
    </div>,
    <div key="2" style={{ width: '100%', maxWidth: 300 }}>
      <PickemCard subject="P. Mahomes" line="Passing yards 274.5" xpValue="120 XP"
        options={[{ id: 'o', label: 'Over' }, { id: 'u', label: 'Under' }]} selected="o" />
    </div>,
    <div key="3" style={{ width: '100%', maxWidth: 320 }}>
      <RewardCard title="PGA Superstore Gift Card" value="$500" state="unlocked" />
    </div>,
  ];
  const copy = [
    { eyebrow: 'Welcome to Clout', title: 'Fandom, but competitive', description: 'Turn watching into playing. Every pick, every week, across every sport.' },
    { eyebrow: 'How it works', title: 'Make your picks', description: 'Choose over or under on the players you follow. Build a streak, climb the board.' },
    { eyebrow: 'Why it pays', title: 'Win real prizes', description: 'Cash, gear and experiences from partners you actually want.' },
  ][step - 1];
  return (
    <OnboardingStep step={step} total={3} {...copy} hero={heroes[step - 1]}
      onSkip={() => nav('home')}
      primaryAction={<Button style={{ width: '100%' }} onClick={() => (step < 3 ? setStep(step + 1) : nav('home'))}>{step < 3 ? 'Continue' : 'Create account'}</Button>}
      secondaryAction={step === 3 ? <Button family="outline" showArrow={false} style={{ width: '100%' }} onClick={() => nav('home')}>I already have an account</Button> : null} />
  );
}

/* ── LOADING / EMPTY reference states ─────────────────────── */
function LoadingScreen() {
  return (
    <div style={screen}>
      <NavBar title="Sunday Slate" />
      <Body>
        {[0, 1, 2].map((i) => (
          <Surface key={i} padding="md">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Skeleton circle height={44} />
              <div style={{ flex: 1 }}><SkeletonText lines={2} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <Skeleton height={48} radius="var(--radius-md)" /><Skeleton height={48} radius="var(--radius-md)" />
            </div>
          </Surface>
        ))}
      </Body>
    </div>
  );
}
function EmptyScreen({ nav }) {
  return (
    <div style={screen}>
      <NavBar title="Your picks" onBack={() => nav('home')} />
      <Body center>
        <EmptyState icon={<Icon name="target" size={28} color="currentColor" />} title="No picks yet"
          description="Enter a contest to start building your streak. Your first pick is on us."
          action={<Button size="small" onClick={() => nav('picks')}>Browse contests</Button>} />
      </Body>
      <TabBar active="picks" onChange={nav} items={TABS} />
    </div>
  );
}

const TABS = [
  { id: 'home', label: 'Home', icon: 'bolt' },
  { id: 'picks', label: 'Picks', icon: 'target' },
  { id: 'rewards', label: 'Rewards', icon: 'gift', badge: 2 },
  { id: 'profile', label: 'Me', icon: 'user' },
];

Object.assign(window, { HomeScreen, PicksScreen, RewardsScreen, ProfileScreen, OnboardingScreen, LoadingScreen, EmptyScreen, TABS });
