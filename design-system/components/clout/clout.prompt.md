Clout domain patterns — the product-specific compositions. Built from the primitives; don't fork them.

**Model:** free-to-play engagement → earn **XP** (progression) + **Coins** (redemption currency) → redeem real prizes, gated by eligibility **at redemption**. Optional pass upgrades add premium content. **No stakes, no cash-out.**

```jsx
<PassCard name="Clout Pass" sport="NFL · Week 12" tier="free" prizes="$50K" actionsLeft="3" progress={62} progressLabel="4 / 7 actions" />
<PickemCard subject="P. Mahomes" meta="KC @ BUF · Sun 4:25pm" line="Passing yards 274.5" xpValue="120 XP"
  options={[{id:'o',label:'Over',detail:'120 XP'},{id:'u',label:'Under',detail:'120 XP'}]} selected="o" state="open" lockLabel="Locks 4:25pm" />
<ChallengeCard title="Make 5 predictions" reward="250" rewardType="xp" state="in-progress" progress={60} progressLabel="3 of 5" timeLeft="6h left" />
<RewardCard title="PGA Superstore Gift Card" value="$500" state="unlocked" requiresEligibility onRedeem={fn} />
<MarketplaceItem brand="Nike" name="Dri-FIT Training Tee" cost="2,500" currency="coin" stock="12 left" />
<ProfileHeader name="Jordan M." handle="@jmvp" tier="Gold" rank="#1,204" xp={1240} xpMax={2000} level={7} stats={s} />
<LeaderboardRow rank={1} name="Jordan M." score="1,240" delta={2} prize="$500" />
<OnboardingStep step={2} total={3} eyebrow="How it works" title="Make your picks" primaryAction={<Button>Continue</Button>} />
<Modal presentation="sheet" dismissible={false} title="Verify to redeem">
  <EligibilityGate prizeName="$500 Gift Card" steps={[{label:"Confirm you're 18+",state:'complete'},{label:'Verify your location',state:'active'}]} />
</Modal>
```

**Vocabulary — enforced.** Use: *predict, pick, action, challenge, earn, XP, Coins, redeem, reward, correct/incorrect, streak.* **Never:** bet, wager, stake, odds, payout, bankroll, parlay, entry fee, buy-in. "Action" is the primitive; a pick'em/prediction is the flagship action *type*, not the whole product.

State vocabulary is fixed — reuse it, don't invent synonyms: Pass `free|upgrade|locked`; Pick'em `open|locked|correct|incorrect`; Challenge `available|in-progress|complete|claimed|expired`; Reward `locked|unlocked|redeemed|shipped`; Marketplace `available|low-stock|sold-out|owned`; Eligibility step `pending|active|complete|blocked`.

**Eligibility placement:** `EligibilityGate` belongs in the redemption flow only. Never gate signup or play.
