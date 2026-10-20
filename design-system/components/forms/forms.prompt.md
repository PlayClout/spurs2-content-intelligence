Clout form controls — every control ships inside a `FormField` and carries the full state set (default / hover / focus / disabled / loading / success / warning / error).

```jsx
<FormField label="Email" htmlFor="email" required status="error" message="That address isn't valid.">
  <Input id="email" type="email" status="error" placeholder="you@clout.gg" />
</FormField>

<FormField label="Region" htmlFor="region">
  <Select id="region" options={[{value:'us',label:'United States'}]} />
</FormField>

<Checkbox id="tos" label="I'm 18 or older" description="Required to enter contests." />
<RadioGroup name="pick" value={v} options={opts} onChange={setV} />
<Switch label="Contest reminders" description="Push before each lock." defaultChecked />
<TextArea rows={4} maxLength={280} showCount />
```

Rules: 48px minimum control height on mobile (`--control-h-md`); never signal validation with color alone — always pass `message`; `aria-invalid` is set automatically for `status="error"`; label `htmlFor` is mandatory.
