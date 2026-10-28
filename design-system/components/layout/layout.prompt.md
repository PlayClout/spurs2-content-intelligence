Clout layout & data-display primitives. `Surface` is the card everything sits on.

```jsx
<Surface variant="accent" padding="lg">…</Surface>
<Surface interactive selected={picked} onClick={fn}>…</Surface>
<ListRow leading={<Avatar name="Jordan M" size="sm"/>} title="Jordan M." subtitle="14-week streak" value="1,240" valueTone="value" chevron />
<Chip tone="accent" selectable selected={on} onSelect={fn}>NFL</Chip>
<Avatar name="Jordan M" ring="action" live /> <AvatarGroup users={u} max={4} />
<StatBlock value="$2.4M" label="Prizes awarded" delta="+12%" tone="value" />
<Modal presentation="sheet" title="Confirm pick" footer={<Button>Lock it in</Button>} onClose={fn}>…</Modal>
<DataTable columns={cols} rows={rows} highlightRow="me" />
<Tooltip label="XP awarded if correct"><Icon name="target"/></Tooltip>
```

Rules: mobile (<768px) presents dialogs as `presentation="sheet"`, tablet/web as `modal`. Never side-scroll a `DataTable` on mobile — render a `ListRow` stack. Tooltips are pointer-only. Rows are 48px minimum.
