Clout feedback surfaces. Choose by persistence: **FormField message** (one field) → **InlineAlert** (page region, persistent) → **Toast** (transient confirmation) → **EmptyState** (no data).

```jsx
<InlineAlert status="warning" title="Picks lock in 12 minutes" onDismiss={fn}>Lock them in to be eligible.</InlineAlert>
<Toast status="success" title="Pick submitted" onDismiss={fn}>You're in the Sunday Slate.</Toast>
<Progress label="Pass progress" valueLabel="1,240 / 2,000 XP" value={62} />
<Spinner size={20} />
<Skeleton height={20} width="70%" /> <SkeletonText lines={3} />
<EmptyState icon={<Icon name="target" size={28}/>} title="No picks yet" description="Enter a contest to start building your streak." action={<Button size="small">Browse contests</Button>} />
```

Rules: never signal with color alone — every status ships an icon (`StatusIcon`) and text. Loading a content region uses `Skeleton` (reserves layout), not `Spinner`. `error` status is red `--danger-default`; brand pink is reserved for value.
