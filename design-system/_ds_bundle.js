/* @ds-bundle: {"format":4,"namespace":"CloutDesignSystem_49ec9a","components":[{"name":"Badge","sourcePath":"components/badges/Badge.jsx"},{"name":"ChallengeCard","sourcePath":"components/clout/ChallengeCard.jsx"},{"name":"EligibilityGate","sourcePath":"components/clout/EligibilityGate.jsx"},{"name":"LeaderboardRow","sourcePath":"components/clout/LeaderboardRow.jsx"},{"name":"MarketplaceItem","sourcePath":"components/clout/MarketplaceItem.jsx"},{"name":"OnboardingStep","sourcePath":"components/clout/OnboardingStep.jsx"},{"name":"PassCard","sourcePath":"components/clout/PassCard.jsx"},{"name":"PickemCard","sourcePath":"components/clout/PickemCard.jsx"},{"name":"ProfileHeader","sourcePath":"components/clout/ProfileHeader.jsx"},{"name":"RewardCard","sourcePath":"components/clout/RewardCard.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ICON_NAMES","sourcePath":"components/core/Icon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"InlineAlert","sourcePath":"components/feedback/InlineAlert.jsx"},{"name":"Progress","sourcePath":"components/feedback/Progress.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"SkeletonText","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"STATUS","sourcePath":"components/feedback/StatusIcon.jsx"},{"name":"StatusIcon","sourcePath":"components/feedback/StatusIcon.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"FormField","sourcePath":"components/forms/FormField.jsx"},{"name":"STATUS_COLOR","sourcePath":"components/forms/Input.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TextArea","sourcePath":"components/forms/TextArea.jsx"},{"name":"Avatar","sourcePath":"components/layout/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/layout/Avatar.jsx"},{"name":"Chip","sourcePath":"components/layout/Chip.jsx"},{"name":"DataTable","sourcePath":"components/layout/DataTable.jsx"},{"name":"ListRow","sourcePath":"components/layout/ListRow.jsx"},{"name":"Modal","sourcePath":"components/layout/Modal.jsx"},{"name":"StatBlock","sourcePath":"components/layout/StatBlock.jsx"},{"name":"Surface","sourcePath":"components/layout/Surface.jsx"},{"name":"Tooltip","sourcePath":"components/layout/Tooltip.jsx"},{"name":"Countdown","sourcePath":"components/marketing/Countdown.jsx"},{"name":"Divider","sourcePath":"components/marketing/Divider.jsx"},{"name":"PassTag","sourcePath":"components/marketing/PassTag.jsx"},{"name":"PriceTag","sourcePath":"components/marketing/PriceTag.jsx"},{"name":"PrizeCard","sourcePath":"components/marketing/PrizeCard.jsx"},{"name":"StatChip","sourcePath":"components/marketing/StatChip.jsx"},{"name":"StatusBadge","sourcePath":"components/marketing/StatusBadge.jsx"},{"name":"Menu","sourcePath":"components/navigation/Menu.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"},{"name":"NavIconButton","sourcePath":"components/navigation/NavBar.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/badges/Badge.jsx":"490b12f28d6c","components/clout/ChallengeCard.jsx":"d79f73fc90b3","components/clout/EligibilityGate.jsx":"20391c807c00","components/clout/LeaderboardRow.jsx":"321e057aab33","components/clout/MarketplaceItem.jsx":"4675ef23b9c0","components/clout/OnboardingStep.jsx":"f781affc27e2","components/clout/PassCard.jsx":"f092c7db43cf","components/clout/PickemCard.jsx":"94159c8d12f1","components/clout/ProfileHeader.jsx":"0b269f37aa02","components/clout/RewardCard.jsx":"e92172c2d2ad","components/core/Button.jsx":"c86c54dda7ff","components/core/Icon.jsx":"de98300b08dc","components/feedback/EmptyState.jsx":"e044242d50d5","components/feedback/InlineAlert.jsx":"c6ccade0b476","components/feedback/Progress.jsx":"a819452d8d13","components/feedback/Skeleton.jsx":"50e2edcce56a","components/feedback/Spinner.jsx":"05971127947e","components/feedback/StatusIcon.jsx":"de1a43888f34","components/feedback/Toast.jsx":"6cd40c0bc313","components/forms/Checkbox.jsx":"09dfbba027c3","components/forms/FormField.jsx":"f66c8a018cdd","components/forms/Input.jsx":"3c846e437c67","components/forms/Radio.jsx":"74388b8d6f2d","components/forms/Select.jsx":"aba2036e751a","components/forms/Switch.jsx":"0215eb3ef3e4","components/forms/TextArea.jsx":"8126880ec594","components/layout/Avatar.jsx":"c453fc014995","components/layout/Chip.jsx":"ef3da557a2fc","components/layout/DataTable.jsx":"a3ecac94e885","components/layout/ListRow.jsx":"8b4d73695f6c","components/layout/Modal.jsx":"ac6f9e3a3d57","components/layout/StatBlock.jsx":"1955acdcdc4a","components/layout/Surface.jsx":"615c3e8c4aff","components/layout/Tooltip.jsx":"9c48a9d5f2d8","components/marketing/Countdown.jsx":"d0846f9b3530","components/marketing/Divider.jsx":"6bde5bd8a970","components/marketing/PassTag.jsx":"bd372995a486","components/marketing/PriceTag.jsx":"b28694694f61","components/marketing/PrizeCard.jsx":"722ff7c434fc","components/marketing/StatChip.jsx":"5b57619942d1","components/marketing/StatusBadge.jsx":"1027ff01df86","components/navigation/Menu.jsx":"7ae152091c47","components/navigation/NavBar.jsx":"a24863f0af9f","components/navigation/SegmentedControl.jsx":"267149fd5ec6","components/navigation/TabBar.jsx":"fe154da748ff","components/navigation/Tabs.jsx":"5de56144037f","slides/slides.jsx":"e61c7d88c5a0","ui_kits/clout-app/screens.jsx":"141624937107"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CloutDesignSystem_49ec9a = window.CloutDesignSystem_49ec9a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/badges/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Badge — achievement / status award for the gamified engagement system. Five shapes:
   circle (achievement), square (rank tier), shield (verification), ribbon (placement),
   hexagon (XP/milestone). Rim gradient: 'action' (warm/achievement) or 'atmosphere' (status/tier).
   Carbon fill, inner hairline ring, italic title over a wide-tracked subtitle. */

const CLIP = {
  shield: 'polygon(50% 0%, 100% 15%, 100% 60%, 50% 100%, 0% 60%, 0% 15%)',
  hexagon: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
};
const RADIUS = {
  circle: '50%',
  square: '24%',
  ribbon: '50%'
};
function Badge({
  shape = 'circle',
  title = 'MVP',
  subtitle = 'AWARD',
  rim = 'action',
  size = 200,
  style,
  ...rest
}) {
  const rimBg = rim === 'atmosphere' ? 'var(--clout-gradient-atmosphere)' : 'var(--clout-gradient-action)';
  const clipPath = CLIP[shape];
  const borderRadius = RADIUS[shape] || 0;
  const rimW = Math.max(5, Math.round(size * 0.03));
  const shell = {
    position: 'relative',
    width: size,
    height: size,
    background: rimBg,
    clipPath,
    borderRadius,
    padding: rimW,
    boxSizing: 'border-box',
    filter: rim === 'atmosphere' ? 'drop-shadow(var(--glow-blue))' : 'drop-shadow(var(--glow-pink))'
  };
  const inner = {
    width: '100%',
    height: '100%',
    background: 'var(--clout-carbon)',
    clipPath,
    borderRadius,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1.5px var(--border-hairline)',
    boxSizing: 'border-box',
    textAlign: 'center',
    padding: 8
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...shell,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: inner
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: size * 0.17,
      lineHeight: 0.95,
      textTransform: 'uppercase',
      color: 'var(--clout-white)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 6,
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: size * 0.065,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--clout-slate)'
    }
  }, subtitle)), shape === 'ribbon' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: -size * 0.12,
      left: '32%',
      width: size * 0.12,
      height: size * 0.28,
      background: rimBg,
      transform: 'skewX(12deg)',
      zIndex: -1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: -size * 0.12,
      right: '32%',
      width: size * 0.12,
      height: size * 0.28,
      background: rimBg,
      transform: 'skewX(-12deg)',
      zIndex: -1
    }
  })));
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/Badge.jsx", error: String((e && e.message) || e) }); }

// components/clout/OnboardingStep.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout OnboardingStep — a full-screen step in a first-run flow.
   Composition: progress dots → cinematic hero slot → headline → body → actions pinned to base. */
function OnboardingStep({
  step = 1,
  total = 3,
  eyebrow,
  title,
  description,
  hero,
  primaryAction,
  secondaryAction,
  onSkip,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: 'radial-gradient(100% 80% at 15% 5%, rgba(18,107,255,0.35), rgba(18,107,255,0) 55%), radial-gradient(90% 70% at 90% 95%, rgba(255,49,87,0.28), rgba(255,49,87,0) 55%), var(--bg-canvas)',
      padding: `calc(var(--safe-top) + 20px) var(--screen-pad-mobile) calc(var(--safe-bottom) + 24px)`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6,
      flex: 1
    },
    role: "progressbar",
    "aria-valuenow": step,
    "aria-valuemin": 1,
    "aria-valuemax": total
  }, Array.from({
    length: total
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 3,
      borderRadius: 3,
      background: i < step ? 'var(--action-default)' : 'var(--interactive-bg-active)',
      transition: 'background var(--motion-base) var(--ease-standard)'
    }
  }))), onSkip && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onSkip,
    style: {
      flex: 'none',
      minHeight: 'var(--touch-min)',
      padding: '0 12px',
      background: 'transparent',
      border: 'none',
      color: 'var(--fg-muted)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, "Skip")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 0'
    }
  }, hero), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--accent-bright)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-4xl)',
      lineHeight: 0.95,
      textTransform: 'uppercase',
      color: 'var(--fg-default)',
      textWrap: 'pretty'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-base)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--fg-secondary)',
      textWrap: 'pretty'
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 10
    }
  }, primaryAction, secondaryAction)));
}
Object.assign(__ds_scope, { OnboardingStep });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/OnboardingStep.jsx", error: String((e && e.message) || e) }); }

// components/clout/PickemCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout PickemCard — the flagship ACTION type: a prediction on a real-world outcome.
   FREE TO PLAY. There is no stake, entry fee or wager. Fans predict and earn XP.
   Options carry an XP VALUE (never odds, never a payout multiplier).
   States: open · locked (event started) · correct · incorrect (graded against the result). */
const OUTCOME = {
  open: {
    border: 'var(--border-default)'
  },
  locked: {
    border: 'var(--border-subtle)'
  },
  correct: {
    border: 'var(--success-border)'
  },
  incorrect: {
    border: 'var(--danger-border)'
  }
};
function PickemCard({
  subject,
  meta,
  line,
  options = [],
  selected,
  onSelect,
  state = 'open',
  xpValue,
  lockLabel,
  style,
  ...rest
}) {
  const s = OUTCOME[state] || OUTCOME.open;
  const graded = state === 'correct' || state === 'incorrect';
  const disabled = state === 'locked' || graded;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      boxSizing: 'border-box',
      width: '100%',
      padding: 16,
      background: 'var(--bg-surface)',
      border: `var(--border-w-default) solid ${s.border}`,
      borderRadius: 'var(--radius-xl)',
      opacity: state === 'locked' ? 0.6 : 1,
      transition: 'var(--transition-colors)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-xl)',
      textTransform: 'uppercase',
      color: 'var(--fg-default)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, subject), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)'
    }
  }, meta)), xpValue && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '5px 10px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--accent-subtle)',
      color: 'var(--accent-bright)',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 9l3 6 3-6"
  })), xpValue)), line && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: '8px 12px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-surface-sunken)',
      textAlign: 'center',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--fg-secondary)'
    }
  }, line), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.max(1, options.length)}, 1fr)`,
      gap: 10,
      marginTop: 12
    }
  }, options.map(o => {
    const on = o.id === selected;
    const right = graded && on && state === 'correct';
    const wrong = graded && on && state === 'incorrect';
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      type: "button",
      disabled: disabled,
      onClick: () => onSelect && onSelect(o.id),
      "aria-pressed": on,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: 'var(--touch-min)',
        padding: '10px 8px',
        boxSizing: 'border-box',
        background: right ? 'var(--success-subtle)' : wrong ? 'var(--danger-subtle)' : on ? 'var(--accent-subtle)' : 'var(--interactive-bg)',
        border: `var(--border-w-strong) solid ${right ? 'var(--success-default)' : wrong ? 'var(--danger-default)' : on ? 'var(--accent-default)' : 'transparent'}`,
        borderRadius: 'var(--radius-md)',
        color: right ? 'var(--success-fg)' : wrong ? 'var(--danger-fg)' : on ? 'var(--fg-default)' : 'var(--fg-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'var(--transition-colors)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 700,
        fontSize: 'var(--text-lg)',
        textTransform: 'uppercase'
      }
    }, o.label), o.detail && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-2xs)',
        opacity: 0.75
      }
    }, o.detail));
  })), (lockLabel || graded) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      textAlign: 'center',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: state === 'correct' ? 'var(--success-fg)' : state === 'incorrect' ? 'var(--danger-fg)' : 'var(--fg-muted)'
    }
  }, graded ? state === 'correct' ? 'Correct' : 'Incorrect' : lockLabel));
}
Object.assign(__ds_scope, { PickemCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/PickemCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout line-icon registry — 24px grid, 2px stroke, round caps/joins (authoritative geometry
   copied from the production SVG masters). Rendered with `currentColor` so any icon recolors
   via the parent `color`. White by default; use Electric Blue or Action gradient for emphasis. */
const ICONS = {
  'arrow-left': '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
  'arrow-right': '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  'chevron-right': '<path d="M9 5l7 7-7 7"/>',
  'chevron-down': '<path d="M5 9l7 7 7-7"/>',
  'external': '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  'close': '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  'menu': '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  'play': '<path d="M7 5l12 7-12 7z"/>',
  'pause': '<path d="M8 5v14"/><path d="M16 5v14"/>',
  'live': '<circle cx="12" cy="12" r="3"/><path d="M6.5 6.5a8 8 0 0 0 0 11"/><path d="M17.5 6.5a8 8 0 0 1 0 11"/>',
  'stream': '<path d="M4 8a10 10 0 0 1 16 0"/><path d="M7 12a6 6 0 0 1 10 0"/><circle cx="12" cy="16" r="1.5"/>',
  'controller': '<path d="M8 10h.01"/><path d="M6 10v4"/><path d="M4 10h4"/><path d="M15 11h.01"/><path d="M18 13h.01"/><rect x="2.5" y="7" width="19" height="10" rx="5"/>',
  'trophy': '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a2 2 0 0 0 0 4h1"/><path d="M16 6h3a2 2 0 0 1 0 4h-1"/><path d="M10 15h4"/><path d="M12 15v3"/><path d="M9 20h6"/>',
  'medal': '<circle cx="12" cy="14" r="6"/><path d="M9 3l3 5 3-5"/><path d="M12 11.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 13.8l2-.3z"/>',
  'target': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  'fire': '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c1.5 0 1-4 2-5 0-1-1-3-2-4z"/>',
  'gift': '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M4 13h16"/><path d="M12 9v11"/><path d="M12 9S10 4 7.5 5.5 12 9 12 9z"/><path d="M12 9s2-5 4.5-3.5S12 9 12 9z"/>',
  'coin': '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M9.5 10.5a2.5 2 0 0 1 5 0c0 2.5-5 1-5 3.5a2.5 2 0 0 0 5 0"/>',
  'star': '<path d="M12 3l2.6 5.6L20 9.3l-4 4 1 6-5-2.8L7 19.3l1-6-4-4 5.4-.7z"/>',
  'xp': '<circle cx="12" cy="12" r="9"/><path d="M9 9l3 6 3-6"/>',
  'bolt': '<path d="M13 3L5 13h5l-1 8 8-10h-5z"/>',
  'heart': '<path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5c0 5-7 9.5-7 9.5z"/>',
  'clock': '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  'user': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  'share': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4"/><path d="M8.2 13.2l7.6 4.4"/>',
  'check': '<path d="M5 13l4 4L19 7"/>',
  'bell': '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10.5 20a2 2 0 0 0 3 0"/>'
};
const ICON_NAMES = Object.keys(ICONS);
function Icon({
  name,
  size = 24,
  color = 'var(--clout-white)',
  strokeWidth = 2,
  style,
  ...rest
}) {
  const inner = ICONS[name];
  if (!inner) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      color,
      display: 'inline-block',
      flex: 'none',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: inner
    }
  }, rest));
}
Object.assign(__ds_scope, { ICON_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/clout/ChallengeCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout ChallengeCard — a time-boxed ACTION that awards XP or Coins for participation.
   Free to enter; nothing is staked. Coins are earned, never purchased, and never cash out.
   States: available · in-progress (shows bar) · complete (claimable) · claimed · expired. */
const STATE = {
  available: {
    label: 'Available',
    color: 'var(--fg-secondary)',
    border: 'var(--border-default)'
  },
  'in-progress': {
    label: 'In progress',
    color: 'var(--accent-bright)',
    border: 'var(--border-accent)'
  },
  complete: {
    label: 'Claim reward',
    color: 'var(--success-fg)',
    border: 'var(--success-border)'
  },
  claimed: {
    label: 'Claimed',
    color: 'var(--fg-muted)',
    border: 'var(--border-subtle)'
  },
  expired: {
    label: 'Expired',
    color: 'var(--fg-muted)',
    border: 'var(--border-subtle)'
  }
};
function ChallengeCard({
  title,
  description,
  icon = 'target',
  reward,
  rewardType = 'xp',
  state = 'available',
  progress,
  progressLabel,
  timeLeft,
  onAction,
  style,
  ...rest
}) {
  const s = STATE[state] || STATE.available;
  const dim = state === 'claimed' || state === 'expired';
  const claimable = state === 'complete';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 14,
      boxSizing: 'border-box',
      width: '100%',
      padding: 16,
      background: 'var(--bg-surface)',
      border: `var(--border-w-default) solid ${s.border}`,
      borderRadius: 'var(--radius-xl)',
      opacity: dim ? 0.55 : 1,
      transition: 'var(--transition-colors)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 44,
      height: 44,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-md)',
      background: claimable ? 'var(--success-subtle)' : 'var(--accent-subtle)',
      color: claimable ? 'var(--success-fg)' : 'var(--accent-bright)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: state === 'claimed' ? 'check' : icon,
    size: 22,
    color: "currentColor"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      fontWeight: 700,
      color: 'var(--fg-default)'
    }
  }, title), reward && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      color: rewardType === 'coins' ? 'var(--value-default)' : 'var(--accent-bright)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: rewardType === 'coins' ? 'coin' : 'xp',
    size: 15,
    color: "currentColor"
  }), reward)), description && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)',
      lineHeight: 'var(--leading-snug)'
    }
  }, description), progress != null && state === 'in-progress' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--interactive-bg-active)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${Math.min(100, progress)}%`,
      background: 'var(--action-default)',
      transition: 'width var(--motion-slow) var(--ease-out)'
    }
  })), progressLabel && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--fg-muted)'
    }
  }, progressLabel)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 10
    }
  }, claimable && onAction ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      minHeight: 'var(--touch-min)',
      padding: '0 18px',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--action-default)',
      color: 'var(--fg-on-action)',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      boxShadow: 'var(--glow-action)'
    }
  }, "Claim") : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: s.color
    }
  }, s.label), timeLeft && !dim && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
      color: 'var(--fg-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 13,
    color: "currentColor"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)'
    }
  }, timeLeft)))));
}
Object.assign(__ds_scope, { ChallengeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/ChallengeCard.jsx", error: String((e && e.message) || e) }); }

// components/clout/EligibilityGate.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout EligibilityGate — the age / geo / KYC verification step in the REDEMPTION flow.
   PLACEMENT RULE (non-negotiable): this gate belongs at the point a fan redeems a real-world
   prize, NEVER at signup or before play. Participation is always free and open; eligibility is
   a prize-fulfilment requirement (sweepstakes compliance), not an entry condition.
   Render inside a Modal (presentation="sheet" on mobile) with dismissible={false}. */

const STEP_STATE = {
  pending: {
    color: 'var(--fg-muted)',
    icon: 'clock'
  },
  active: {
    color: 'var(--accent-bright)',
    icon: 'target'
  },
  complete: {
    color: 'var(--success-fg)',
    icon: 'check'
  },
  blocked: {
    color: 'var(--danger-fg)',
    icon: 'close'
  }
};
function EligibilityGate({
  prizeName,
  steps = [],
  note,
  blockedReason,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--warning-subtle)',
      border: 'var(--border-w-hairline) solid var(--warning-border)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "medal",
    size: 20,
    color: "var(--warning-fg)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 'var(--text-md)',
      color: 'var(--fg-default)'
    }
  }, "Verify to redeem"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--fg-secondary)',
      lineHeight: 'var(--leading-snug)'
    }
  }, prizeName ? /*#__PURE__*/React.createElement(React.Fragment, null, "Real-world prizes like ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--fg-default)'
    }
  }, prizeName), " require a one-time eligibility check. Your XP, Coins and streak are unaffected.") : 'Real-world prizes require a one-time eligibility check. Your XP, Coins and streak are unaffected.'))), steps.length > 0 && /*#__PURE__*/React.createElement("ol", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, steps.map((s, i) => {
    const st = STEP_STATE[s.state] || STEP_STATE.pending;
    return /*#__PURE__*/React.createElement("li", {
      key: s.id ?? i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 'var(--touch-min)',
        padding: '8px 0',
        borderBottom: i === steps.length - 1 ? 'none' : 'var(--border-w-hairline) solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 'none',
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        background: 'var(--interactive-bg)',
        color: st.color
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: st.icon,
      size: 17,
      color: "currentColor"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-md)',
        fontWeight: s.state === 'active' ? 700 : 600,
        color: s.state === 'pending' ? 'var(--fg-secondary)' : 'var(--fg-default)'
      }
    }, s.label), s.detail && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-2xs)',
        color: 'var(--fg-muted)'
      }
    }, s.detail)), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 'none',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: st.color
      }
    }, s.state));
  })), blockedReason && /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      display: 'flex',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--danger-subtle)',
      border: 'var(--border-w-hairline) solid var(--danger-border)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--danger-fg)',
      lineHeight: 'var(--leading-snug)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 18,
    color: "currentColor"
  }), /*#__PURE__*/React.createElement("span", null, blockedReason)), children, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--fg-muted)',
      lineHeight: 'var(--leading-snug)'
    }
  }, note || 'Clout is free to play. No purchase is necessary to earn or redeem. Eligibility is required only to fulfil real-world prizes and varies by jurisdiction. 18+.'));
}
Object.assign(__ds_scope, { EligibilityGate });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/EligibilityGate.jsx", error: String((e && e.message) || e) }); }

// components/clout/MarketplaceItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout MarketplaceItem — an item redeemable with earned Coins. Coins cannot be
   purchased and never cash out; the marketplace is redemption, not commerce.
   Vertical tile for grids (2-col mobile, 3–4-col web). States: available · low-stock · sold-out · owned. */
function MarketplaceItem({
  name,
  brand,
  image,
  cost,
  currency = 'coin',
  stock,
  state = 'available',
  onClick,
  style,
  ...rest
}) {
  const [press, setPress] = React.useState(false);
  const soldOut = state === 'sold-out';
  const owned = state === 'owned';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: soldOut ? undefined : onClick,
    role: onClick ? 'button' : undefined,
    tabIndex: onClick && !soldOut ? 0 : undefined,
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    onMouseLeave: () => setPress(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      width: '100%',
      overflow: 'hidden',
      background: 'var(--bg-surface)',
      border: 'var(--border-w-default) solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      opacity: soldOut ? 0.5 : 1,
      transform: press && !soldOut ? 'scale(var(--press-scale-tile))' : 'scale(1)',
      cursor: soldOut ? 'not-allowed' : onClick ? 'pointer' : 'default',
      transition: 'var(--transition-transform), var(--transition-shadow)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '1 / 1',
      width: '100%',
      background: 'radial-gradient(70% 70% at 50% 40%, rgba(18,107,255,0.18), rgba(18,107,255,0) 60%), var(--bg-surface-sunken)',
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "gift",
    size: 34,
    color: "var(--fg-muted)"
  }), (state === 'low-stock' || soldOut || owned) && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 8,
      left: 8,
      padding: '4px 9px',
      borderRadius: 'var(--radius-pill)',
      background: owned ? 'var(--success-subtle)' : soldOut ? 'var(--interactive-bg-active)' : 'var(--warning-subtle)',
      border: `1px solid ${owned ? 'var(--success-border)' : soldOut ? 'var(--border-strong)' : 'var(--warning-border)'}`,
      color: owned ? 'var(--success-fg)' : soldOut ? 'var(--fg-secondary)' : 'var(--warning-fg)',
      fontFamily: 'var(--font-body)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, owned ? 'Owned' : soldOut ? 'Sold out' : 'Low stock')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      padding: 12
    }
  }, brand && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--accent-bright)'
    }
  }, brand), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--fg-default)',
      lineHeight: 'var(--leading-snug)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: currency === 'xp' ? 'xp' : 'coin',
    size: 15,
    color: currency === 'xp' ? 'var(--accent-bright)' : 'var(--value-default)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      color: 'var(--fg-default)'
    }
  }, cost)), stock && !soldOut && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--fg-muted)'
    }
  }, stock))));
}
Object.assign(__ds_scope, { MarketplaceItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/MarketplaceItem.jsx", error: String((e && e.message) || e) }); }

// components/clout/PassCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout PassCard — a Pass groups a set of free actions and challenges.
   The free Clout Pass is ALWAYS available; upgrade passes are an optional CONTENT purchase
   (more actions, challenges and marketplace access) — never an entry fee, stake or wager.
   Tiers: free · upgrade (Action-gradient rim) · locked. Shows progress toward completion. */
const TIER = {
  free: {
    border: 'var(--border-default)',
    glow: 'none',
    label: 'var(--fg-secondary)'
  },
  upgrade: {
    border: 'transparent',
    glow: 'var(--glow-action)',
    label: 'var(--value-default)'
  },
  locked: {
    border: 'var(--border-subtle)',
    glow: 'none',
    label: 'var(--fg-muted)'
  }
};
function PassCard({
  name = 'Clout Pass',
  sport,
  tier = 'free',
  status = 'Active',
  progress,
  progressLabel,
  prizes,
  actionsLeft,
  expiresIn,
  locked = false,
  onClick,
  style,
  ...rest
}) {
  const t = TIER[locked ? 'locked' : tier] || TIER.free;
  const [press, setPress] = React.useState(false);
  const premium = tier === 'upgrade' && !locked;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: locked ? undefined : onClick,
    role: onClick ? 'button' : undefined,
    tabIndex: onClick && !locked ? 0 : undefined,
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    onMouseLeave: () => setPress(false),
    style: {
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      overflow: 'hidden',
      padding: premium ? 2 : 0,
      borderRadius: 'var(--radius-xl)',
      background: premium ? 'var(--action-default)' : 'transparent',
      boxShadow: t.glow,
      opacity: locked ? 0.55 : 1,
      transform: press && !locked ? 'scale(var(--press-scale-tile))' : 'scale(1)',
      transition: 'var(--transition-transform), var(--transition-shadow)',
      cursor: locked ? 'not-allowed' : onClick ? 'pointer' : 'default',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: 18,
      borderRadius: premium ? 'calc(var(--radius-xl) - 2px)' : 'var(--radius-xl)',
      background: 'var(--bg-surface)',
      border: premium ? 'none' : `var(--border-w-default) solid ${t.border}`,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(80% 90% at 85% 0%, rgba(18,107,255,0.22), rgba(18,107,255,0) 60%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, sport && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--accent-bright)'
    }
  }, sport), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-2xl)',
      textTransform: 'uppercase',
      lineHeight: 'var(--leading-tight)',
      color: 'var(--fg-default)'
    }
  }, name)), locked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 22,
    color: "var(--fg-muted)"
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)',
      background: premium ? 'var(--value-subtle)' : 'var(--interactive-bg)',
      color: t.label,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, premium ? 'Upgrade' : status)), (prizes || actionsLeft || expiresIn) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      gap: 18,
      marginTop: 14,
      flexWrap: 'wrap'
    }
  }, prizes && /*#__PURE__*/React.createElement(Meta, {
    icon: "trophy",
    label: "In prizes",
    value: prizes,
    tone: "value"
  }), actionsLeft && /*#__PURE__*/React.createElement(Meta, {
    icon: "target",
    label: "Actions left",
    value: actionsLeft
  }), expiresIn && /*#__PURE__*/React.createElement(Meta, {
    icon: "clock",
    label: "Expires",
    value: expiresIn
  })), progress != null && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--fg-muted)'
    }
  }, "Progress"), progressLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      color: 'var(--fg-default)'
    }
  }, progressLabel)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--interactive-bg-active)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${Math.min(100, progress)}%`,
      background: 'var(--action-default)',
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--motion-slow) var(--ease-out)'
    }
  })))));
}
function Meta({
  icon,
  label,
  value,
  tone
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14,
    color: "var(--fg-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--fg-muted)'
    }
  }, label)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      color: tone === 'value' ? 'var(--value-default)' : 'var(--fg-default)'
    }
  }, value));
}
Object.assign(__ds_scope, { PassCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/PassCard.jsx", error: String((e && e.message) || e) }); }

// components/clout/RewardCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout RewardCard — a prize earned through participation and redeemed with Coins/XP.
   This is the celebratory moment in the product; split-light treatment and one glow.
   States: locked (not yet earned) · unlocked (redeemable) · redeemed · shipped.
   ELIGIBILITY: age/geo/KYC is checked at REDEMPTION, never at signup. Pass
   requiresEligibility to surface that the next step is a verification gate. */
function RewardCard({
  title,
  value,
  image,
  state = 'unlocked',
  requirement,
  redeemedOn,
  requiresEligibility = false,
  onRedeem,
  compact = false,
  style,
  ...rest
}) {
  const claimable = state === 'unlocked';
  const dim = state === 'locked';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      overflow: 'hidden',
      padding: compact ? 14 : 18,
      borderRadius: 'var(--radius-xl)',
      background: claimable ? 'radial-gradient(90% 100% at 15% 0%, rgba(18,107,255,0.28), rgba(18,107,255,0) 55%), radial-gradient(90% 100% at 90% 100%, rgba(255,49,87,0.22), rgba(255,49,87,0) 55%), var(--bg-surface)' : 'var(--bg-surface)',
      border: `var(--border-w-default) solid ${claimable ? 'var(--border-accent)' : 'var(--border-default)'}`,
      boxShadow: claimable ? 'var(--shadow-card)' : 'none',
      opacity: dim ? 0.5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: compact ? 52 : 64,
      height: compact ? 52 : 64,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--bg-surface-sunken)',
      border: 'var(--border-w-hairline) solid var(--border-default)'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: dim ? 'clock' : 'gift',
    size: compact ? 24 : 28,
    color: claimable ? 'var(--value-default)' : 'var(--fg-muted)'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, value && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: compact ? 'var(--text-2xl)' : 'var(--text-3xl)',
      lineHeight: 0.95,
      background: 'var(--action-default)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      paddingRight: '0.14em',
      marginRight: '-0.14em'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: compact ? 'var(--text-md)' : 'var(--text-lg)',
      textTransform: 'uppercase',
      color: 'var(--fg-default)',
      lineHeight: 'var(--leading-tight)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, title), (requirement || redeemedOn) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)'
    }
  }, state === 'redeemed' || state === 'shipped' ? redeemedOn : requirement), claimable && requiresEligibility && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--warning-fg)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 12,
    color: "currentColor"
  }), "18+ \xB7 verification required to redeem")), claimable && onRedeem && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRedeem,
    style: {
      flex: 'none',
      minHeight: 'var(--touch-min)',
      padding: '0 18px',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--action-default)',
      color: 'var(--fg-on-action)',
      cursor: 'pointer',
      boxShadow: 'var(--glow-action)',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-md)',
      textTransform: 'uppercase',
      letterSpacing: '0.03em'
    }
  }, "Redeem"), (state === 'redeemed' || state === 'shipped') && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--success-fg)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    color: "currentColor"
  }), state)));
}
Object.assign(__ds_scope, { RewardCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/RewardCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout CTA button — the strongest ACTIONABLE element (not necessarily the dominant visual).
   Families: primary (solid Action-gradient), secondary (dark fill + gradient stroke),
   dark (Carbon fill + hairline), outline (transparent + white outline). Full-radius pill,
   athletic italic caps, ONE glow, trailing circular arrow badge. */

const SIZES = {
  large: {
    h: 64,
    px: 30,
    fs: 20,
    gap: 14,
    badge: 40,
    iconSize: 20
  },
  small: {
    h: 48,
    px: 22,
    fs: 15,
    gap: 10,
    badge: 30,
    iconSize: 15
  }
};
function Button({
  children,
  family = 'primary',
  size = 'large',
  icon = 'arrow-right',
  showArrow = true,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.large;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    height: s.h,
    padding: `0 ${showArrow ? s.px - 8 : s.px}px 0 ${s.px}px`,
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontWeight: 700,
    fontSize: s.fs,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    transition: 'transform var(--dur-fast) var(--ease-standard), filter var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
    transform: press ? 'scale(0.975)' : 'scale(1)',
    opacity: disabled ? 0.4 : 1,
    WebkitFontSmoothing: 'antialiased',
    ...style
  };
  const families = {
    primary: {
      background: 'var(--clout-gradient-action)',
      color: 'var(--clout-white)',
      boxShadow: disabled ? 'none' : hover ? '0 10px 38px rgba(255,49,87,0.55)' : 'var(--glow-action)',
      filter: hover && !disabled ? 'brightness(1.06)' : 'none'
    },
    secondary: {
      background: 'var(--clout-carbon)',
      color: 'var(--clout-white)',
      boxShadow: `inset 0 0 0 2px transparent`,
      backgroundImage: 'linear-gradient(var(--clout-carbon),var(--clout-carbon)), var(--clout-gradient-action)',
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      border: '2px solid transparent',
      filter: hover && !disabled ? 'brightness(1.15)' : 'none'
    },
    dark: {
      background: 'var(--clout-carbon)',
      color: 'var(--clout-white)',
      border: '1.5px solid var(--border-hairline)',
      boxShadow: hover && !disabled ? 'var(--shadow-panel)' : 'none',
      filter: hover && !disabled ? 'brightness(1.2)' : 'none'
    },
    outline: {
      background: 'transparent',
      color: 'var(--clout-white)',
      border: '2px solid rgba(245,245,243,0.85)',
      filter: hover && !disabled ? 'brightness(1.1)' : 'none',
      backgroundColor: hover && !disabled ? 'rgba(245,245,243,0.08)' : 'transparent'
    }
  };

  // trailing circular arrow badge
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: s.badge,
    height: s.badge,
    borderRadius: 'var(--radius-pill)',
    flex: 'none'
  };
  const badgeBg = {
    primary: {
      background: 'var(--clout-black)'
    },
    secondary: {
      background: 'var(--clout-gradient-action)'
    },
    dark: {
      background: 'var(--clout-gradient-action)'
    },
    outline: {
      background: 'transparent',
      border: '1.5px solid rgba(245,245,243,0.7)'
    }
  }[family];
  const arrowColor = family === 'primary' ? 'var(--clout-pink)' : family === 'outline' ? 'var(--clout-white)' : 'var(--clout-white)';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      ...base,
      ...families[family]
    }
  }, rest), /*#__PURE__*/React.createElement("span", null, children), showArrow && /*#__PURE__*/React.createElement("span", {
    style: {
      ...badgeStyle,
      ...badgeBg
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.iconSize,
    color: arrowColor,
    strokeWidth: 2.4
  })));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout EmptyState — zero-data, no-results and error-recovery screens.
   Always give the user one clear next action. */
function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: compact ? 10 : 16,
      padding: compact ? '28px 20px' : '56px 24px',
      maxWidth: 420,
      margin: '0 auto',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: compact ? 48 : 64,
      height: compact ? 48 : 64,
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      background: 'var(--accent-subtle)',
      color: 'var(--accent-bright)',
      marginBottom: 2
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: compact ? 'var(--text-xl)' : 'var(--text-2xl)',
      textTransform: 'uppercase',
      color: 'var(--fg-default)',
      lineHeight: 'var(--leading-tight)'
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      color: 'var(--fg-secondary)',
      lineHeight: 'var(--leading-normal)'
    }
  }, description), (action || secondaryAction) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
      marginTop: 6
    }
  }, action, secondaryAction));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Progress.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Progress — determinate bar. Action gradient by default; status colors for outcomes.
   Use for XP, pass progress, challenge completion, upload state. */
const H = {
  sm: 4,
  md: 8,
  lg: 12
};
const FILL = {
  action: 'var(--action-default)',
  accent: 'var(--accent-default)',
  success: 'var(--success-default)',
  warning: 'var(--warning-default)',
  danger: 'var(--danger-default)'
};
function Progress({
  value = 0,
  max = 100,
  size = 'md',
  tone = 'action',
  label,
  valueLabel,
  indeterminate = false,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      ...style
    }
  }, rest), (label || valueLabel) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--fg-secondary)'
    }
  }, label), valueLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      color: 'var(--fg-default)'
    }
  }, valueLabel)), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": indeterminate ? undefined : Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": label,
    style: {
      position: 'relative',
      width: '100%',
      height: H[size],
      borderRadius: 'var(--radius-pill)',
      background: 'var(--interactive-bg-active)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      width: indeterminate ? '40%' : `${pct}%`,
      background: FILL[tone],
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--motion-slow) var(--ease-out)',
      animation: indeterminate ? 'clout-indet 1200ms var(--ease-standard) infinite' : 'none'
    }
  }), /*#__PURE__*/React.createElement("style", null, '@keyframes clout-indet{0%{left:-40%}100%{left:100%}}')));
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Progress.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Skeleton — loading placeholder that reserves final layout so nothing jumps.
   Default for any content region that fetches. */
function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-xs)',
  circle = false,
  style,
  ...rest
}) {
  const size = circle ? {
    width: height,
    height,
    borderRadius: '50%'
  } : {
    width,
    height,
    borderRadius: radius
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    style: {
      display: 'block',
      ...size,
      background: 'linear-gradient(90deg, rgba(245,245,243,0.05) 0%, rgba(245,245,243,0.11) 50%, rgba(245,245,243,0.05) 100%)',
      backgroundSize: '200% 100%',
      animation: 'clout-shimmer var(--skeleton-duration) linear infinite',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, '@keyframes clout-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'));
}

/* SkeletonText — n shimmer lines with a short last line. */
function SkeletonText({
  lines = 3,
  gap = 8,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap,
      ...style
    }
  }, Array.from({
    length: lines
  }).map((_, i) => /*#__PURE__*/React.createElement(Skeleton, {
    key: i,
    height: 12,
    width: i === lines - 1 ? '60%' : '100%'
  })));
}
Object.assign(__ds_scope, { Skeleton, SkeletonText });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Spinner — indeterminate loading. Only for waits under ~2s or inside buttons;
   use Skeleton for content areas so layout doesn't jump. */
function Spinner({
  size = 24,
  tone = 'accent',
  label = 'Loading',
  style,
  ...rest
}) {
  const color = tone === 'action' ? 'var(--value-default)' : tone === 'neutral' ? 'var(--fg-secondary)' : 'var(--accent-bright)';
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "status",
    "aria-label": label,
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      flex: 'none',
      borderRadius: '50%',
      border: `${Math.max(2, Math.round(size / 10))}px solid rgba(245,245,243,0.14)`,
      borderTopColor: color,
      animation: 'clout-spin 800ms linear infinite',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, '@keyframes clout-spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusIcon.jsx
try { (() => {
/* Clout status system — shared config for every feedback surface.
   Pink (#FF006B) is VALUE, never error. Each status carries an icon so meaning
   never depends on color alone (WCAG 1.4.1). */
const STATUS = {
  success: {
    fg: 'var(--success-fg)',
    solid: 'var(--success-default)',
    subtle: 'var(--success-subtle)',
    border: 'var(--success-border)',
    glyph: 'M5 13l4 4L19 7'
  },
  warning: {
    fg: 'var(--warning-fg)',
    solid: 'var(--warning-default)',
    subtle: 'var(--warning-subtle)',
    border: 'var(--warning-border)',
    glyph: 'M12 3l9 17H3zM12 10v4M12 17h.01'
  },
  error: {
    fg: 'var(--danger-fg)',
    solid: 'var(--danger-default)',
    subtle: 'var(--danger-subtle)',
    border: 'var(--danger-border)',
    glyph: 'M12 8v5M12 17h.01M12 3a9 9 0 100 18 9 9 0 000-18z'
  },
  info: {
    fg: 'var(--info-fg)',
    solid: 'var(--info-default)',
    subtle: 'var(--info-subtle)',
    border: 'var(--info-border)',
    glyph: 'M12 11v6M12 7h.01M12 3a9 9 0 100 18 9 9 0 000-18z'
  }
};
function StatusIcon({
  status = 'info',
  size = 20
}) {
  const s = STATUS[status] || STATUS.info;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      color: s.fg,
      flex: 'none'
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: s.glyph
  }));
}
Object.assign(__ds_scope, { STATUS, StatusIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusIcon.jsx", error: String((e && e.message) || e) }); }

// components/feedback/InlineAlert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout InlineAlert — persistent, in-flow message tied to a region of the page.
   Use Toast for transient confirmations; use FormField messages for single fields. */
function InlineAlert({
  status = 'info',
  title,
  children,
  onDismiss,
  action,
  style,
  ...rest
}) {
  const s = __ds_scope.STATUS[status] || __ds_scope.STATUS.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: status === 'error' ? 'alert' : 'status',
    style: {
      display: 'flex',
      gap: 12,
      width: '100%',
      boxSizing: 'border-box',
      padding: '14px 16px',
      background: s.subtle,
      border: `var(--border-w-hairline) solid ${s.border}`,
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatusIcon, {
    status: status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 'var(--text-md)',
      color: 'var(--fg-default)'
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--fg-secondary)',
      lineHeight: 'var(--leading-snug)'
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      flex: 'none',
      width: 28,
      height: 28,
      display: 'grid',
      placeItems: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-xs)',
      color: 'var(--fg-muted)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6L6 18"
  }))));
}
Object.assign(__ds_scope, { InlineAlert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/InlineAlert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Toast — transient confirmation. Raised surface, status-tinted left edge,
   auto-dismiss. Mobile: full-width above the tab bar. Web: bottom-right. */
function Toast({
  status = 'success',
  title,
  children,
  onDismiss,
  style,
  ...rest
}) {
  const s = __ds_scope.STATUS[status] || __ds_scope.STATUS.success;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    "aria-live": "polite",
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      width: '100%',
      maxWidth: 420,
      boxSizing: 'border-box',
      padding: '14px 16px',
      background: 'var(--bg-surface-raised)',
      border: `var(--border-w-hairline) solid var(--border-default)`,
      borderLeft: `var(--border-w-emphasis) solid ${s.solid}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-float)',
      zIndex: 'var(--z-toast)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatusIcon, {
    status: status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 'var(--text-md)',
      color: 'var(--fg-default)'
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--fg-secondary)',
      lineHeight: 'var(--leading-snug)'
    }
  }, children)), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      flex: 'none',
      width: 28,
      height: 28,
      display: 'grid',
      placeItems: 'center',
      background: 'transparent',
      border: 'none',
      color: 'var(--fg-muted)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6L6 18"
  }))));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Checkbox — 24px box, accent fill when checked, supports indeterminate. */
function Checkbox({
  checked,
  defaultChecked,
  indeterminate = false,
  label,
  description,
  disabled = false,
  status,
  onChange,
  id,
  name,
  style,
  ...rest
}) {
  const [on, setOn] = React.useState(defaultChecked ?? false);
  const isOn = checked ?? on;
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const errored = status === 'error';
  const toggle = e => {
    if (disabled) return;
    if (checked === undefined) setOn(!isOn);
    onChange && onChange(!isOn, e);
  };
  const box = {
    width: 24,
    height: 24,
    flex: 'none',
    borderRadius: 'var(--radius-xs)',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isOn || indeterminate ? 'var(--accent-default)' : 'var(--bg-surface-sunken)',
    border: `var(--border-w-default) solid ${errored ? 'var(--danger-border)' : isOn || indeterminate ? 'var(--accent-default)' : hover && !disabled ? 'var(--border-input-hover)' : 'var(--border-input)'}`,
    boxShadow: focus ? 'var(--focus-ring)' : 'none',
    transition: 'var(--transition-colors), var(--transition-shadow)'
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 12,
      minHeight: 'var(--touch-min)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    name: name,
    type: "checkbox",
    checked: isOn,
    disabled: disabled,
    onChange: toggle,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    "aria-invalid": errored || undefined,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      ...box,
      marginTop: description ? 2 : 0
    },
    "aria-hidden": "true"
  }, indeterminate ? /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "var(--fg-on-action)",
    strokeWidth: "3",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 12h12"
  })) : isOn && /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "var(--fg-on-action)",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4L19 7"
  }))), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      color: 'var(--fg-default)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)',
      lineHeight: 'var(--leading-snug)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/FormField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout FormField — the labelled wrapper every input must ship inside.
   Owns label, required marker, helper text, and the status message.
   ACCESSIBILITY: the message is text + icon, never color alone. */
const MSG = {
  success: {
    color: 'var(--success-fg)',
    glyph: 'M5 13l4 4L19 7'
  },
  warning: {
    color: 'var(--warning-fg)',
    glyph: 'M12 8v5M12 17h.01'
  },
  error: {
    color: 'var(--danger-fg)',
    glyph: 'M12 8v5M12 17h.01'
  },
  info: {
    color: 'var(--info-fg)',
    glyph: 'M12 11v6M12 7h.01'
  }
};
function FormField({
  label,
  htmlFor,
  required = false,
  optional = false,
  helper,
  status,
  message,
  disabled = false,
  children,
  style,
  ...rest
}) {
  const st = status ? MSG[status] : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      letterSpacing: '0.02em',
      color: 'var(--fg-default)',
      textTransform: 'uppercase'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--value-default)'
    },
    "aria-hidden": "true"
  }, "*"), optional && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-muted)',
      fontWeight: 400,
      textTransform: 'none',
      letterSpacing: 0
    }
  }, "(optional)")), children, message && st && /*#__PURE__*/React.createElement("div", {
    role: status === 'error' ? 'alert' : undefined,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 6,
      color: st.color,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      lineHeight: 'var(--leading-snug)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flex: 'none',
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: st.glyph
  })), /*#__PURE__*/React.createElement("span", null, message)), helper && !message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)',
      lineHeight: 'var(--leading-snug)'
    }
  }, helper));
}
Object.assign(__ds_scope, { FormField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FormField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Input — text field with the full product state set.
   States: default · hover · focus · filled · disabled · readOnly · loading · success · warning · error
   Height follows --control-h-*; 48px default so it clears Android's 48dp target. */

const H = {
  sm: 'var(--control-h-sm)',
  md: 'var(--control-h-md)',
  lg: 'var(--control-h-lg)'
};
const FS = {
  sm: 'var(--text-sm)',
  md: 'var(--text-md)',
  lg: 'var(--text-base)'
};
const STATUS_COLOR = {
  success: {
    border: 'var(--success-border)',
    fg: 'var(--success-fg)',
    ring: 'rgba(0,217,130,0.35)'
  },
  warning: {
    border: 'var(--warning-border)',
    fg: 'var(--warning-fg)',
    ring: 'rgba(255,176,32,0.35)'
  },
  error: {
    border: 'var(--danger-border)',
    fg: 'var(--danger-fg)',
    ring: 'rgba(255,41,66,0.35)'
  },
  info: {
    border: 'var(--info-border)',
    fg: 'var(--info-fg)',
    ring: 'rgba(0,163,255,0.35)'
  }
};
function Input({
  value,
  defaultValue,
  placeholder = '',
  type = 'text',
  size = 'md',
  status,
  disabled = false,
  readOnly = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  onChange,
  onFocus,
  onBlur,
  id,
  name,
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const st = status ? STATUS_COLOR[status] : null;
  const borderColor = disabled ? 'var(--border-subtle)' : st ? st.border : focus ? 'var(--border-input-focus)' : hover ? 'var(--border-input-hover)' : 'var(--border-input)';
  const shell = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    boxSizing: 'border-box',
    height: H[size],
    padding: '0 14px',
    background: disabled ? 'var(--interactive-bg-disabled)' : 'var(--bg-surface-sunken)',
    border: `var(--border-w-default) solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    boxShadow: focus && !disabled ? st ? `0 0 0 3px ${st.ring}` : 'var(--focus-ring)' : 'none',
    transition: 'var(--transition-colors), var(--transition-shadow)',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
    ...style
  };
  const field = {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: disabled ? 'var(--fg-disabled)' : 'var(--fg-default)',
    fontFamily: 'var(--font-body)',
    fontSize: FS[size],
    fontWeight: 400,
    cursor: disabled ? 'not-allowed' : 'text',
    ...inputStyle
  };
  return /*#__PURE__*/React.createElement("div", {
    style: shell,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, leadingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: st ? st.fg : 'var(--fg-muted)',
      flex: 'none'
    }
  }, leadingIcon), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    name: name,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    readOnly: readOnly,
    "aria-invalid": status === 'error' || undefined,
    onChange: onChange,
    onFocus: e => {
      setFocus(true);
      onFocus && onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      onBlur && onBlur(e);
    },
    style: field
  }, rest)), loading ? /*#__PURE__*/React.createElement(Spinner16, null) : trailingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: st ? st.fg : 'var(--fg-muted)',
      flex: 'none'
    }
  }, trailingIcon));
}
function Spinner16() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      flex: 'none',
      borderRadius: '50%',
      border: '2px solid rgba(245,245,243,0.18)',
      borderTopColor: 'var(--accent-bright)',
      animation: 'clout-spin 800ms linear infinite'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes clout-spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { STATUS_COLOR, Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Radio — single-select within a named group. Use RadioGroup for the set. */
function Radio({
  checked,
  label,
  description,
  disabled = false,
  value,
  name,
  onChange,
  id,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 12,
      minHeight: 'var(--touch-min)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(value, e),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 24,
      height: 24,
      flex: 'none',
      borderRadius: '50%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-surface-sunken)',
      border: `var(--border-w-strong) solid ${checked ? 'var(--accent-default)' : hover && !disabled ? 'var(--border-input-hover)' : 'var(--border-input)'}`,
      boxShadow: focus ? 'var(--focus-ring)' : 'none',
      transition: 'var(--transition-colors), var(--transition-shadow)',
      marginTop: description ? 2 : 0
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: 'var(--accent-default)'
    }
  })), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      color: 'var(--fg-default)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)',
      lineHeight: 'var(--leading-snug)'
    }
  }, description)));
}

/* RadioGroup — owns selection for a set of Radios. */
function RadioGroup({
  name,
  value,
  options = [],
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "radiogroup",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      ...style
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement(Radio, {
    key: o.value,
    id: `${name}-${o.value}`,
    name: name,
    value: o.value,
    label: o.label,
    description: o.description,
    checked: value === o.value,
    disabled: disabled || o.disabled,
    onChange: onChange
  })));
}
Object.assign(__ds_scope, { Radio, RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Select — native select styled to match Input (native picker on iOS/Android is correct;
   do not hand-roll a listbox for simple option sets). */
const H = {
  sm: 'var(--control-h-sm)',
  md: 'var(--control-h-md)',
  lg: 'var(--control-h-lg)'
};
function Select({
  value,
  defaultValue,
  options = [],
  placeholder = 'Select…',
  size = 'md',
  status,
  disabled = false,
  onChange,
  id,
  name,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const borderColor = disabled ? 'var(--border-subtle)' : status === 'error' ? 'var(--danger-border)' : status === 'success' ? 'var(--success-border)' : focus ? 'var(--border-input-focus)' : hover ? 'var(--border-input-hover)' : 'var(--border-input)';
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      boxSizing: 'border-box',
      height: H[size],
      background: disabled ? 'var(--interactive-bg-disabled)' : 'var(--bg-surface-sunken)',
      border: `var(--border-w-default) solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus && !disabled ? 'var(--focus-ring)' : 'none',
      transition: 'var(--transition-colors), var(--transition-shadow)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: id,
    name: name,
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    "aria-invalid": status === 'error' || undefined,
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: '100%',
      padding: '0 40px 0 14px',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: disabled ? 'var(--fg-disabled)' : 'var(--fg-default)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value,
    disabled: o.disabled
  }, o.label))), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "20",
    height: "20",
    fill: "none",
    stroke: "var(--fg-muted)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      position: 'absolute',
      right: 12,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 9l7 7 7-7"
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Switch — immediate-effect binary toggle (settings, notifications).
   Use Checkbox instead when the change only applies on form submit. */
const SIZES = {
  sm: {
    w: 40,
    h: 24,
    k: 18
  },
  md: {
    w: 52,
    h: 30,
    k: 24
  }
};
function Switch({
  checked,
  defaultChecked,
  size = 'md',
  label,
  description,
  disabled = false,
  loading = false,
  onChange,
  id,
  name,
  style,
  ...rest
}) {
  const [on, setOn] = React.useState(defaultChecked ?? false);
  const isOn = checked ?? on;
  const [focus, setFocus] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const toggle = e => {
    if (disabled || loading) return;
    if (checked === undefined) setOn(!isOn);
    onChange && onChange(!isOn, e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 14,
      minHeight: 'var(--touch-min)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      justifyContent: 'space-between',
      ...style
    }
  }, (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      color: 'var(--fg-default)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)',
      lineHeight: 'var(--leading-snug)'
    }
  }, description)), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    name: name,
    type: "checkbox",
    role: "switch",
    checked: isOn,
    disabled: disabled || loading,
    onChange: toggle,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'relative',
      width: s.w,
      height: s.h,
      flex: 'none',
      borderRadius: 'var(--radius-pill)',
      background: isOn ? 'var(--action-default)' : 'var(--interactive-bg-active)',
      boxShadow: focus ? 'var(--focus-ring)' : isOn ? 'var(--glow-action)' : 'none',
      transition: 'background var(--motion-base) var(--ease-standard), box-shadow var(--motion-base) var(--ease-standard)',
      marginTop: description ? 2 : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: (s.h - s.k) / 2,
      left: isOn ? s.w - s.k - (s.h - s.k) / 2 : (s.h - s.k) / 2,
      width: s.k,
      height: s.k,
      borderRadius: '50%',
      background: loading ? 'transparent' : 'var(--fg-default)',
      border: loading ? '2px solid rgba(245,245,243,0.3)' : 'none',
      borderTopColor: loading ? 'var(--fg-default)' : undefined,
      boxSizing: 'border-box',
      animation: loading ? 'clout-spin 800ms linear infinite' : 'none',
      transition: 'left var(--motion-base) var(--ease-standard)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
    }
  }), /*#__PURE__*/React.createElement("style", null, '@keyframes clout-spin{to{transform:rotate(360deg)}}')));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextArea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout TextArea — multi-line input. Same state model as Input. */
const STATUS = {
  success: {
    border: 'var(--success-border)',
    ring: 'rgba(0,217,130,0.35)'
  },
  warning: {
    border: 'var(--warning-border)',
    ring: 'rgba(255,176,32,0.35)'
  },
  error: {
    border: 'var(--danger-border)',
    ring: 'rgba(255,41,66,0.35)'
  },
  info: {
    border: 'var(--info-border)',
    ring: 'rgba(0,163,255,0.35)'
  }
};
function TextArea({
  value,
  defaultValue,
  placeholder = '',
  rows = 4,
  status,
  disabled = false,
  readOnly = false,
  maxLength,
  showCount = false,
  onChange,
  id,
  name,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [len, setLen] = React.useState((value ?? defaultValue ?? '').length);
  const st = status ? STATUS[status] : null;
  const borderColor = disabled ? 'var(--border-subtle)' : st ? st.border : focus ? 'var(--border-input-focus)' : hover ? 'var(--border-input-hover)' : 'var(--border-input)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      ...style
    }
  }, /*#__PURE__*/React.createElement("textarea", _extends({
    id: id,
    name: name,
    rows: rows,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    readOnly: readOnly,
    maxLength: maxLength,
    "aria-invalid": status === 'error' || undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    onChange: e => {
      setLen(e.target.value.length);
      onChange && onChange(e);
    },
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px 14px',
      resize: 'vertical',
      background: disabled ? 'var(--interactive-bg-disabled)' : 'var(--bg-surface-sunken)',
      border: `var(--border-w-default) solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus && !disabled ? st ? `0 0 0 3px ${st.ring}` : 'var(--focus-ring)' : 'none',
      color: disabled ? 'var(--fg-disabled)' : 'var(--fg-default)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      lineHeight: 'var(--leading-normal)',
      outline: 'none',
      transition: 'var(--transition-colors), var(--transition-shadow)',
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? 0.6 : 1
    }
  }, rest)), showCount && maxLength && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      textAlign: 'right',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: len > maxLength * 0.9 ? 'var(--warning-fg)' : 'var(--fg-muted)'
    }
  }, len, " / ", maxLength));
}
Object.assign(__ds_scope, { TextArea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextArea.jsx", error: String((e && e.message) || e) }); }

// components/layout/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Avatar — user/team identity. Initials fallback, optional status ring and live dot. */
const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80
};
const RING = {
  none: null,
  accent: 'var(--accent-default)',
  action: 'var(--action-default)',
  success: 'var(--success-default)'
};
function Avatar({
  src,
  name = '',
  size = 'md',
  ring = 'none',
  live = false,
  style,
  ...rest
}) {
  const px = SIZES[size] || SIZES.md;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const ringBg = RING[ring];
  const pad = ringBg ? Math.max(2, Math.round(px * 0.06)) : 0;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      flex: 'none',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: px,
      height: px,
      borderRadius: '50%',
      background: ringBg || 'transparent',
      padding: pad,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      overflow: 'hidden',
      background: 'var(--bg-surface-raised)',
      border: ringBg ? '2px solid var(--bg-canvas)' : 'var(--border-w-hairline) solid var(--border-default)',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: px * 0.38,
      color: 'var(--fg-secondary)',
      letterSpacing: '0.02em'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials || '?')), live && /*#__PURE__*/React.createElement("span", {
    "aria-label": "Live",
    style: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: Math.max(8, px * 0.24),
      height: Math.max(8, px * 0.24),
      borderRadius: '50%',
      background: 'var(--value-default)',
      border: '2px solid var(--bg-canvas)',
      boxShadow: 'var(--glow-pink)',
      boxSizing: 'border-box'
    }
  }));
}

/* AvatarGroup — overlapping stack with an overflow count. */
function AvatarGroup({
  users = [],
  size = 'sm',
  max = 4,
  style
}) {
  const px = SIZES[size] || SIZES.sm;
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      ...style
    }
  }, shown.map((u, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i === 0 ? 0 : -px * 0.3,
      border: '2px solid var(--bg-canvas)',
      borderRadius: '50%',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    src: u.src,
    name: u.name,
    size: size
  }))), rest > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: -px * 0.3,
      width: px,
      height: px,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--bg-surface-raised)',
      border: '2px solid var(--bg-canvas)',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-body)',
      fontSize: px * 0.34,
      fontWeight: 700,
      color: 'var(--fg-secondary)'
    }
  }, "+", rest));
}
Object.assign(__ds_scope, { Avatar, AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/clout/LeaderboardRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout LeaderboardRow — ranked standing. Top 3 get medal coloring; the current user's
   row is highlighted and should stay pinned when scrolled out of view. */
const MEDAL = {
  1: '#FFC53D',
  2: '#C7D0DB',
  3: '#E08A4B'
};
function LeaderboardRow({
  rank,
  name,
  avatar,
  meta,
  score,
  delta,
  isCurrentUser = false,
  prize,
  onClick,
  style,
  ...rest
}) {
  const medal = MEDAL[rank];
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    role: onClick ? 'button' : undefined,
    tabIndex: onClick ? 0 : undefined,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      boxSizing: 'border-box',
      width: '100%',
      minHeight: 'var(--touch-min)',
      padding: '10px 12px',
      background: isCurrentUser ? 'var(--interactive-bg-selected)' : 'transparent',
      border: isCurrentUser ? 'var(--border-w-hairline) solid var(--border-accent)' : 'var(--border-w-hairline) solid transparent',
      borderBottom: isCurrentUser ? undefined : 'var(--border-w-hairline) solid var(--border-subtle)',
      borderRadius: isCurrentUser ? 'var(--radius-md)' : 0,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 26,
      textAlign: 'center',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: medal ? 'var(--text-xl)' : 'var(--text-md)',
      color: medal || 'var(--fg-muted)'
    }
  }, rank), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: avatar,
    size: "sm",
    ring: rank === 1 ? 'action' : 'none'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 0%',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      fontWeight: isCurrentUser ? 700 : 600,
      color: 'var(--fg-default)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name, isCurrentUser && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-bright)',
      fontWeight: 700
    }
  }, " \xB7 You")), (meta || prize) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 0
    }
  }, prize && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-xs)',
      color: 'var(--value-default)'
    }
  }, prize), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--fg-muted)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, meta))), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      color: delta > 0 ? 'var(--success-fg)' : delta < 0 ? 'var(--danger-fg)' : 'var(--fg-muted)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700
    }
  }, delta !== 0 && /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "11",
    height: "11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      transform: delta < 0 ? 'rotate(180deg)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 19V6M6 12l6-6 6 6"
  })), delta === 0 ? '–' : Math.abs(delta)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      textAlign: 'right',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      color: 'var(--fg-default)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, score));
}
Object.assign(__ds_scope, { LeaderboardRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/LeaderboardRow.jsx", error: String((e && e.message) || e) }); }

// components/clout/ProfileHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout ProfileHeader — identity + rank + XP progress at the top of the profile screen.
   Sits on the split-light treatment; the only place a large avatar appears. */
function ProfileHeader({
  name,
  handle,
  avatar,
  tier = 'Rookie',
  rank,
  xp,
  xpMax,
  level,
  stats = [],
  onEdit,
  style,
  ...rest
}) {
  const pct = xp != null && xpMax ? Math.min(100, xp / xpMax * 100) : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      overflow: 'hidden',
      padding: '24px 20px',
      borderRadius: 'var(--radius-xl)',
      background: 'radial-gradient(90% 100% at 15% 0%, rgba(18,107,255,0.3), rgba(18,107,255,0) 55%), radial-gradient(80% 100% at 90% 100%, rgba(255,49,87,0.2), rgba(255,49,87,0) 55%), var(--bg-surface)',
      border: 'var(--border-w-default) solid var(--border-default)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: avatar,
    size: "xl",
    ring: "action"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-3xl)',
      textTransform: 'uppercase',
      lineHeight: 'var(--leading-tight)',
      color: 'var(--fg-default)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 5,
      flexWrap: 'wrap'
    }
  }, handle && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--fg-muted)'
    }
  }, handle), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--value-subtle)',
      color: 'var(--value-default)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "medal",
    size: 13,
    color: "currentColor"
  }), tier), rank && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--fg-secondary)'
    }
  }, "Rank ", rank))), onEdit && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onEdit,
    "aria-label": "Edit profile",
    style: {
      flex: 'none',
      width: 44,
      height: 44,
      display: 'grid',
      placeItems: 'center',
      background: 'var(--interactive-bg)',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      color: 'var(--fg-secondary)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "user",
    size: 20,
    color: "currentColor"
  }))), pct != null && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--fg-muted)'
    }
  }, level ? `Level ${level}` : 'XP'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      color: 'var(--fg-default)'
    }
  }, xp.toLocaleString(), " / ", xpMax.toLocaleString(), " XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--interactive-bg-active)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${pct}%`,
      background: 'var(--action-default)',
      borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--glow-action)',
      transition: 'width var(--motion-slow) var(--ease-out)'
    }
  }))), stats.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 20,
      flexWrap: 'wrap'
    }
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-2xl)',
      lineHeight: 0.95,
      color: s.tone === 'value' ? 'var(--value-default)' : 'var(--fg-default)'
    }
  }, s.value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--fg-muted)'
    }
  }, s.label)))));
}
Object.assign(__ds_scope, { ProfileHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/clout/ProfileHeader.jsx", error: String((e && e.message) || e) }); }

// components/layout/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Chip — compact metadata / filter token. Distinct from Button (an action)
   and StatusBadge (a state flag). Tones map to the semantic palette. */
const TONE = {
  neutral: {
    bg: 'var(--interactive-bg)',
    fg: 'var(--fg-secondary)',
    border: 'var(--border-default)'
  },
  accent: {
    bg: 'var(--accent-subtle)',
    fg: 'var(--accent-bright)',
    border: 'var(--border-accent)'
  },
  value: {
    bg: 'var(--value-subtle)',
    fg: 'var(--value-default)',
    border: 'rgba(255,0,107,0.4)'
  },
  success: {
    bg: 'var(--success-subtle)',
    fg: 'var(--success-fg)',
    border: 'var(--success-border)'
  },
  warning: {
    bg: 'var(--warning-subtle)',
    fg: 'var(--warning-fg)',
    border: 'var(--warning-border)'
  },
  danger: {
    bg: 'var(--danger-subtle)',
    fg: 'var(--danger-fg)',
    border: 'var(--danger-border)'
  }
};
function Chip({
  children,
  tone = 'neutral',
  size = 'md',
  selectable = false,
  selected = false,
  onSelect,
  onRemove,
  leadingIcon,
  style,
  ...rest
}) {
  const t = TONE[tone] || TONE.neutral;
  const sm = size === 'sm';
  const active = selected;
  const Tag = selectable ? 'button' : 'span';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    type: selectable ? 'button' : undefined,
    onClick: selectable ? onSelect : undefined,
    "aria-pressed": selectable ? active : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      boxSizing: 'border-box',
      height: sm ? 26 : 32,
      padding: sm ? '0 10px' : '0 12px',
      background: active ? 'var(--accent-default)' : t.bg,
      border: `var(--border-w-hairline) solid ${active ? 'var(--accent-default)' : t.border}`,
      borderRadius: 'var(--radius-pill)',
      color: active ? 'var(--fg-on-action)' : t.fg,
      fontFamily: 'var(--font-body)',
      fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      cursor: selectable ? 'pointer' : 'default',
      transition: 'var(--transition-colors)',
      ...style
    }
  }, rest), leadingIcon, children, onRemove && /*#__PURE__*/React.createElement("span", {
    role: "button",
    "aria-label": "Remove",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: 'flex',
      marginRight: -2,
      cursor: 'pointer',
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "12",
    height: "12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6L6 18"
  }))));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Chip.jsx", error: String((e && e.message) || e) }); }

// components/layout/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout DataTable — compact tabular data (leaderboards, transactions, admin).
   MOBILE RULE: below --bp-md, do not scroll a table sideways — render the same data
   as a ListRow stack. This component is for tablet/desktop widths. */
function DataTable({
  columns = [],
  rows = [],
  highlightRow,
  dense = false,
  style,
  ...rest
}) {
  const cellPad = dense ? '10px 12px' : '14px 16px';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      overflowX: 'auto',
      background: 'var(--bg-surface)',
      border: 'var(--border-w-hairline) solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    scope: "col",
    style: {
      textAlign: c.align || 'left',
      padding: cellPad,
      whiteSpace: 'nowrap',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--fg-muted)',
      borderBottom: 'var(--border-w-hairline) solid var(--border-default)',
      width: c.width
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => {
    const hl = highlightRow != null && (r.id ?? i) === highlightRow;
    return /*#__PURE__*/React.createElement("tr", {
      key: r.id ?? i,
      style: {
        background: hl ? 'var(--interactive-bg-selected)' : 'transparent'
      }
    }, columns.map(c => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      style: {
        textAlign: c.align || 'left',
        padding: cellPad,
        fontSize: 'var(--text-sm)',
        fontFamily: c.emphasis ? 'var(--font-display)' : 'var(--font-body)',
        fontStyle: c.emphasis ? 'italic' : 'normal',
        fontWeight: c.emphasis ? 700 : 400,
        color: c.emphasis ? 'var(--fg-default)' : 'var(--fg-secondary)',
        borderBottom: i === rows.length - 1 ? 'none' : 'var(--border-w-hairline) solid var(--border-subtle)',
        fontVariantNumeric: c.numeric ? 'tabular-nums' : 'normal'
      }
    }, r[c.key])));
  }))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/layout/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout ListRow — the workhorse row for settings, leaderboards, transactions, menus.
   48px minimum height. Leading slot / title+subtitle / trailing value / chevron. */
function ListRow({
  leading,
  title,
  subtitle,
  value,
  valueTone = 'default',
  trailing,
  chevron = false,
  selected = false,
  disabled = false,
  onClick,
  divider = true,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const clickable = !!onClick;
  const valueColor = {
    default: 'var(--fg-default)',
    muted: 'var(--fg-muted)',
    value: 'var(--value-default)',
    success: 'var(--success-fg)',
    danger: 'var(--danger-fg)'
  }[valueTone];
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: disabled ? undefined : onClick,
    role: clickable ? 'button' : undefined,
    tabIndex: clickable && !disabled ? 0 : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      boxSizing: 'border-box',
      minHeight: 'var(--touch-min)',
      padding: '12px 16px',
      background: selected ? 'var(--interactive-bg-selected)' : clickable && hover && !disabled ? 'var(--interactive-bg-hover)' : 'transparent',
      borderBottom: divider ? 'var(--border-w-hairline) solid var(--border-subtle)' : 'none',
      cursor: disabled ? 'not-allowed' : clickable ? 'pointer' : 'default',
      opacity: disabled ? 0.5 : 1,
      transform: clickable && press && !disabled ? 'scale(var(--press-scale-tile))' : 'scale(1)',
      transition: 'var(--transition-colors), var(--transition-transform)',
      ...style
    }
  }, rest), leading && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flex: 'none'
    }
  }, leading), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      fontWeight: 600,
      color: 'var(--fg-default)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, subtitle)), value != null && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      color: valueColor
    }
  }, value), trailing, chevron && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 20,
    color: "var(--fg-muted)"
  }));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/layout/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Modal & Sheet — the same dialog primitive with two presentations.
   PLATFORM RULE: mobile (<768px) presents as a bottom Sheet; tablet/web as a centered Modal. */
function Modal({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  presentation = 'modal',
  size = 'md',
  dismissible = true,
  style,
  ...rest
}) {
  if (!open) return null;
  const sheet = presentation === 'sheet';
  const maxW = {
    sm: 400,
    md: 520,
    lg: 720
  }[size];
  return /*#__PURE__*/React.createElement("div", {
    role: "presentation",
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: sheet ? 'flex-end' : 'center',
      justifyContent: 'center',
      background: 'var(--bg-overlay)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      padding: sheet ? 0 : 20,
      boxSizing: 'border-box',
      zIndex: 'var(--z-modal)'
    },
    onClick: dismissible && onClose ? onClose : undefined
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: sheet ? 'none' : maxW,
      boxSizing: 'border-box',
      maxHeight: sheet ? '88%' : '90%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface-raised)',
      border: 'var(--border-w-hairline) solid var(--border-default)',
      borderRadius: sheet ? 'var(--radius-sheet) var(--radius-sheet) 0 0' : 'var(--radius-xl)',
      boxShadow: 'var(--shadow-float)',
      paddingBottom: sheet ? 'var(--safe-bottom)' : 0,
      animation: `${sheet ? 'clout-sheet-in' : 'clout-modal-in'} var(--motion-slow) var(--ease-out)`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, '@keyframes clout-sheet-in{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes clout-modal-in{from{transform:scale(0.97);opacity:0}to{transform:scale(1);opacity:1}}'), sheet && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '10px auto 2px',
      flex: 'none'
    }
  }), (title || dismissible) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '18px 20px 0',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-2xl)',
      textTransform: 'uppercase',
      lineHeight: 'var(--leading-tight)',
      color: 'var(--fg-default)'
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      color: 'var(--fg-secondary)',
      lineHeight: 'var(--leading-normal)'
    }
  }, description)), dismissible && onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      flex: 'none',
      width: 36,
      height: 36,
      display: 'grid',
      placeItems: 'center',
      background: 'var(--interactive-bg)',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      color: 'var(--fg-secondary)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6L6 18"
  })))), children && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '18px 20px'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      padding: '14px 20px 20px',
      flex: 'none',
      borderTop: 'var(--border-w-hairline) solid var(--border-subtle)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Modal.jsx", error: String((e && e.message) || e) }); }

// components/layout/StatBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout StatBlock — product-side KPI display (distinct from the marketing StatChip).
   Italic value, uppercase label, optional delta with direction. */
function StatBlock({
  value,
  label,
  delta,
  deltaDirection = 'up',
  tone = 'default',
  icon,
  size = 'md',
  style,
  ...rest
}) {
  const valueColor = {
    default: 'var(--fg-default)',
    value: 'var(--value-default)',
    accent: 'var(--accent-bright)',
    success: 'var(--success-fg)'
  }[tone];
  const fs = size === 'lg' ? 'var(--text-4xl)' : size === 'sm' ? 'var(--text-xl)' : 'var(--text-3xl)';
  const deltaColor = deltaDirection === 'up' ? 'var(--success-fg)' : deltaDirection === 'down' ? 'var(--danger-fg)' : 'var(--fg-muted)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: fs,
      lineHeight: 0.95,
      color: valueColor,
      letterSpacing: '0.01em'
    }
  }, value), delta && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      color: deltaColor,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "12",
    height: "12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      transform: deltaDirection === 'down' ? 'rotate(180deg)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 19V6M6 12l6-6 6 6"
  })), delta)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--fg-muted)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, label));
}
Object.assign(__ds_scope, { StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/StatBlock.jsx", error: String((e && e.message) || e) }); }

// components/layout/Surface.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Surface — the product card primitive. Carbon fill, hairline border, brand radii.
   Variants: default · raised (menus/popovers) · sunken (wells) · accent (blue hairline, featured)
   · interactive (hover lift + press compress, for tappable cards). */
const VARIANT = {
  default: {
    bg: 'var(--bg-surface)',
    border: 'var(--border-default)',
    shadow: 'none'
  },
  raised: {
    bg: 'var(--bg-surface-raised)',
    border: 'var(--border-default)',
    shadow: 'var(--shadow-panel)'
  },
  sunken: {
    bg: 'var(--bg-surface-sunken)',
    border: 'var(--border-subtle)',
    shadow: 'none'
  },
  accent: {
    bg: 'var(--bg-surface)',
    border: 'var(--border-accent)',
    shadow: 'var(--shadow-card)'
  }
};
const PAD = {
  none: 0,
  sm: 14,
  md: 18,
  lg: 24
};
function Surface({
  variant = 'default',
  padding = 'md',
  radius = 'var(--radius-xl)',
  interactive = false,
  selected = false,
  disabled = false,
  onClick,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const v = VARIANT[variant] || VARIANT.default;
  const clickable = interactive || !!onClick;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: disabled ? undefined : onClick,
    role: clickable ? 'button' : undefined,
    tabIndex: clickable && !disabled ? 0 : undefined,
    "aria-disabled": disabled || undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      position: 'relative',
      boxSizing: 'border-box',
      padding: PAD[padding],
      background: v.bg,
      border: `var(--border-w-default) solid ${selected ? 'var(--accent-default)' : v.border}`,
      borderRadius: radius,
      boxShadow: selected ? '0 0 0 1px var(--accent-default), var(--shadow-card)' : clickable && hover && !disabled ? 'var(--shadow-card)' : v.shadow,
      transform: clickable && press && !disabled ? 'scale(var(--press-scale-tile))' : 'scale(1)',
      cursor: disabled ? 'not-allowed' : clickable ? 'pointer' : 'default',
      opacity: disabled ? 0.5 : 1,
      transition: 'var(--transition-colors), var(--transition-shadow), var(--transition-transform)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Surface });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Surface.jsx", error: String((e && e.message) || e) }); }

// components/layout/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Tooltip — brief label on hover/focus. POINTER ONLY: never put essential
   information here, and never rely on it for touch — mobile uses inline helper text. */
function Tooltip({
  label,
  placement = 'top',
  children,
  style,
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translate(-50%, -8px)'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translate(-50%, 8px)'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translate(-8px, -50%)'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translate(8px, -50%)'
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, rest), children, show && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos,
      zIndex: 'var(--z-tooltip)',
      padding: '7px 11px',
      maxWidth: 240,
      width: 'max-content',
      background: 'var(--bg-surface-raised)',
      border: 'var(--border-w-hairline) solid var(--border-strong)',
      borderRadius: 'var(--radius-xs)',
      boxShadow: 'var(--shadow-float)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      lineHeight: 'var(--leading-snug)',
      color: 'var(--fg-default)',
      pointerEvents: 'none'
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/marketing/Countdown.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Countdown — urgency. Three Carbon blocks (days / hrs / min) with italic numerals. */
function Block({
  n,
  unit
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      background: 'var(--clout-carbon)',
      border: '1.5px solid var(--border-hairline)',
      borderRadius: 'var(--radius-chip)',
      padding: '16px 20px',
      minWidth: 88
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 44,
      lineHeight: 0.9,
      color: 'var(--clout-white)'
    }
  }, String(n).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 12,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--clout-slate)'
    }
  }, unit));
}
function Countdown({
  days = 2,
  hours = 14,
  minutes = 30,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      gap: 12,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(Block, {
    n: days,
    unit: "Days"
  }), /*#__PURE__*/React.createElement(Block, {
    n: hours,
    unit: "Hrs"
  }), /*#__PURE__*/React.createElement(Block, {
    n: minutes,
    unit: "Min"
  }));
}
Object.assign(__ds_scope, { Countdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/Countdown.jsx", error: String((e && e.message) || e) }); }

// components/marketing/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Divider — Action-gradient section separator. Optional centered diamond node. */
function Divider({
  node = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 3,
      borderRadius: 3,
      background: 'var(--clout-gradient-action)'
    }
  }), node && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      transform: 'rotate(45deg)',
      background: 'var(--clout-hot-coral)',
      boxShadow: 'var(--glow-pink)'
    }
  }), node && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 3,
      borderRadius: 3,
      background: 'var(--clout-gradient-action)'
    }
  }));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/Divider.jsx", error: String((e && e.message) || e) }); }

// components/marketing/PassTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Pass Tag — campaign / pass label as a gradient-OUTLINE pill (secondary-CTA style) so it never
   competes with the primary CTA. Name pattern: "[Event/Partner] Pass". */
function PassTag({
  name = 'OPEN PASS',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 34px',
      borderRadius: 'var(--radius-pill)',
      border: '3px solid transparent',
      background: 'linear-gradient(var(--clout-black),var(--clout-black)) padding-box, var(--clout-gradient-action) border-box',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 26,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      color: 'var(--clout-white)',
      ...style
    }
  }, rest), name);
}
Object.assign(__ds_scope, { PassTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/PassTag.jsx", error: String((e && e.message) || e) }); }

// components/marketing/PriceTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Prize Tag — solid Action-gradient tag with dark (Clout Black) text. High-emphasis value
   presentation for total prize value available; do not use as a button. Prizes are earned
   through free participation — never a pooled stake. */
function PriceTag({
  label = 'IN PRIZES',
  value = '$10,000',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      background: 'var(--clout-gradient-action)',
      borderRadius: 'var(--radius-tag)',
      padding: '16px 40px',
      boxShadow: 'var(--glow-action)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 18,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--clout-black)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 1,
      color: 'var(--clout-black)'
    }
  }, value));
}
Object.assign(__ds_scope, { PriceTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/PriceTag.jsx", error: String((e && e.message) || e) }); }

// components/marketing/PrizeCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Prize Card — hero prize presentation. Carbon surface, low-opacity blue hairline, blue "WIN A"
   kicker chip, dominant italic prize value, Action-gradient underline, product label. */
function PrizeCard({
  kicker = 'WIN A',
  value = '$500',
  label = 'GIFT CARD',
  valueGradient = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: 460,
      boxSizing: 'border-box',
      background: 'var(--clout-carbon)',
      border: '2px solid var(--border-blue)',
      borderRadius: 'var(--radius-card)',
      padding: '28px 32px 34px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      background: 'rgba(18,107,255,0.18)',
      color: 'var(--clout-hyper-blue)',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.12em'
    }
  }, kicker), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'clamp(56px, 9vw, 88px)',
      lineHeight: 0.9,
      textTransform: 'uppercase',
      color: valueGradient ? 'transparent' : 'var(--clout-white)',
      background: valueGradient ? 'var(--clout-gradient-action)' : 'none',
      WebkitBackgroundClip: valueGradient ? 'text' : 'border-box',
      backgroundClip: valueGradient ? 'text' : 'border-box'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 160,
      height: 6,
      borderRadius: 3,
      background: 'var(--clout-gradient-action)',
      margin: '18px 0 16px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: 26,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      color: 'var(--clout-white)'
    }
  }, label));
}
Object.assign(__ds_scope, { PrizeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/PrizeCard.jsx", error: String((e && e.message) || e) }); }

// components/marketing/StatChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Stat Chip — proof / engagement stat. Clout Black surface, white hairline, italic value
   (pink for prize value, white/blue otherwise) over a wide-tracked label. */
function StatChip({
  value = '$50K',
  label = 'TOTAL PRIZES',
  valueColor = 'var(--clout-pink)',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 200,
      boxSizing: 'border-box',
      background: 'var(--clout-black)',
      border: '1.5px solid var(--border-hairline)',
      borderRadius: 'var(--radius-chip)',
      padding: '18px 24px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 34,
      lineHeight: 1,
      color: valueColor
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--clout-slate)'
    }
  }, label));
}
Object.assign(__ds_scope, { StatChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/StatChip.jsx", error: String((e && e.message) || e) }); }

// components/marketing/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Status Badge — small status flag. live (pink, pulsing dot), new (blue), ending (orange). */
const CFG = {
  live: {
    color: 'var(--clout-pink)',
    label: 'LIVE',
    dot: true
  },
  new: {
    color: 'var(--clout-electric-blue)',
    label: 'NEW',
    dot: false
  },
  ending: {
    color: 'var(--clout-signal-orange)',
    label: 'ENDING SOON',
    dot: false
  }
};
function StatusBadge({
  status = 'live',
  label,
  style,
  ...rest
}) {
  const c = CFG[status] || CFG.live;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      background: 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${c.color}`,
      color: c.color,
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      ...style
    }
  }, rest), c.dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: c.color,
      boxShadow: `0 0 8px ${c.color}`
    }
  }), label || c.label);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Menu.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Menu — action list surfaced from a trigger (overflow menu, profile menu).
   On mobile present it as a bottom Sheet; on web anchor it as a popover. */
function Menu({
  items = [],
  onSelect,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "menu",
    style: {
      minWidth: 220,
      padding: 6,
      boxSizing: 'border-box',
      background: 'var(--bg-surface-raised)',
      border: 'var(--border-w-hairline) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-float)',
      zIndex: 'var(--z-popover)',
      ...style
    }
  }, rest), items.map((it, i) => it.divider ? /*#__PURE__*/React.createElement("div", {
    key: `d${i}`,
    style: {
      height: 1,
      background: 'var(--border-default)',
      margin: '6px 4px'
    }
  }) : /*#__PURE__*/React.createElement(MenuItem, {
    key: it.id,
    item: it,
    onSelect: onSelect
  })));
}
function MenuItem({
  item,
  onSelect
}) {
  const [hover, setHover] = React.useState(false);
  const danger = item.tone === 'danger';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "menuitem",
    disabled: item.disabled,
    onClick: () => onSelect && onSelect(item.id),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      boxSizing: 'border-box',
      minHeight: 44,
      padding: '0 12px',
      textAlign: 'left',
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      background: hover && !item.disabled ? 'var(--interactive-bg-hover)' : 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-xs)',
      color: item.disabled ? 'var(--fg-disabled)' : danger ? 'var(--danger-fg)' : 'var(--fg-default)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      transition: 'var(--transition-colors)'
    }
  }, item.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: item.icon,
    size: 20,
    color: "currentColor"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, item.label), item.meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)'
    }
  }, item.meta), item.checked && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 18,
    color: "var(--accent-bright)"
  }));
}
Object.assign(__ds_scope, { Menu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Menu.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout NavBar — top app bar. Mobile: back/title/action. Web: logo/nav/actions.
   Sticky with a translucent blur so cinematic backgrounds stay visible behind it. */
function NavBar({
  title,
  onBack,
  leading,
  actions,
  transparent = false,
  centerTitle = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      boxSizing: 'border-box',
      height: `calc(var(--navbar-h-mobile) + var(--safe-top))`,
      paddingTop: 'var(--safe-top)',
      padding: `var(--safe-top) 8px 0 8px`,
      background: transparent ? 'transparent' : 'rgba(5,8,17,0.82)',
      backdropFilter: transparent ? 'none' : 'blur(18px)',
      WebkitBackdropFilter: transparent ? 'none' : 'blur(18px)',
      borderBottom: transparent ? 'none' : 'var(--border-w-hairline) solid var(--border-default)',
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-navbar)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      flex: centerTitle ? '0 0 auto' : 1,
      minWidth: centerTitle ? 44 : undefined
    }
  }, onBack && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    "aria-label": "Back",
    style: navBtn
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-left",
    size: 24,
    color: "currentColor"
  })), leading), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: centerTitle ? 'center' : 'left',
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      color: 'var(--fg-default)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      flex: centerTitle ? '0 0 auto' : undefined,
      minWidth: centerTitle ? 44 : undefined,
      justifyContent: 'flex-end'
    }
  }, actions));
}
const navBtn = {
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  color: 'var(--fg-default)',
  cursor: 'pointer'
};

/* NavIconButton — 44px icon action for the bar (meets iOS target). */
function NavIconButton({
  icon,
  label,
  badge,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-label": label,
    style: {
      ...navBtn,
      position: 'relative',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22,
    color: "currentColor"
  }), badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--danger-default)',
      boxShadow: '0 0 0 2px var(--bg-canvas)'
    }
  }) : null);
}
Object.assign(__ds_scope, { NavBar, NavIconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout SegmentedControl — 2–4 mutually exclusive options in a single track.
   Use for view switches (Daily / Weekly / Season). More options → Tabs. */
function SegmentedControl({
  items = [],
  value,
  onChange,
  size = 'md',
  fullWidth = true,
  style,
  ...rest
}) {
  // Track min-height grows to keep inner buttons at the 44/48px touch minimum.
  const inner = size === 'sm' ? 44 : 'var(--touch-min)';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'inline-flex',
      width: fullWidth ? '100%' : 'auto',
      boxSizing: 'border-box',
      padding: 3,
      gap: 2,
      background: 'var(--bg-surface-sunken)',
      border: 'var(--border-w-hairline) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      role: "tab",
      "aria-selected": on,
      disabled: it.disabled,
      onClick: () => onChange && onChange(it.id),
      style: {
        flex: 1,
        minWidth: 0,
        minHeight: inner,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 'calc(var(--radius-md) - 3px)',
        cursor: it.disabled ? 'not-allowed' : 'pointer',
        background: on ? 'var(--interactive-bg-active)' : 'transparent',
        boxShadow: on ? 'inset 0 0 0 1px var(--border-default)' : 'none',
        color: on ? 'var(--fg-default)' : 'var(--fg-muted)',
        opacity: it.disabled ? 0.4 : 1,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: on ? 700 : 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        transition: 'var(--transition-colors)'
      }
    }, it.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout TabBar — primary mobile navigation (iOS tab bar / Android bottom nav).
   3–5 destinations, always labelled, active item uses the brand pink + glow dot.
   Respects the bottom safe-area inset. */
function TabBar({
  items = [],
  active,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      alignItems: 'stretch',
      width: '100%',
      boxSizing: 'border-box',
      height: `calc(var(--tabbar-h) + var(--safe-bottom))`,
      paddingBottom: 'var(--safe-bottom)',
      background: 'rgba(16,19,28,0.92)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      borderTop: 'var(--border-w-hairline) solid var(--border-default)',
      zIndex: 'var(--z-tabbar)',
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => onChange && onChange(it.id),
      "aria-current": on ? 'page' : undefined,
      style: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        background: 'transparent',
        border: 'none',
        minHeight: 'var(--touch-min)',
        cursor: 'pointer',
        padding: '6px 2px',
        position: 'relative',
        color: on ? 'var(--value-default)' : 'var(--fg-muted)',
        transition: 'var(--transition-colors)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 24,
      color: "currentColor"
    }), it.badge ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -3,
        right: -6,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--danger-default)',
        color: '#fff',
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        fontWeight: 700,
        display: 'grid',
        placeItems: 'center',
        boxSizing: 'border-box'
      }
    }, it.badge) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-2xs)',
        fontWeight: on ? 700 : 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%'
      }
    }, it.label), on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 28,
        height: 3,
        borderRadius: '0 0 3px 3px',
        background: 'var(--action-default)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout Tabs — in-page section switcher. Underline indicator in the Action gradient.
   Scrollable when the set overflows (sport filters, contest types). */
function Tabs({
  items = [],
  active,
  onChange,
  scrollable = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      width: '100%',
      boxSizing: 'border-box',
      overflowX: scrollable ? 'auto' : 'visible',
      scrollbarWidth: 'none',
      borderBottom: 'var(--border-w-hairline) solid var(--border-default)',
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(it.id),
      style: {
        position: 'relative',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 'var(--control-h-md)',
        padding: '0 14px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: on ? 700 : 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: on ? 'var(--fg-default)' : 'var(--fg-muted)',
        transition: 'var(--transition-colors)'
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        padding: '2px 7px',
        borderRadius: 'var(--radius-pill)',
        background: on ? 'var(--value-subtle)' : 'var(--interactive-bg)',
        color: on ? 'var(--value-default)' : 'var(--fg-muted)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 700,
        letterSpacing: 0
      }
    }, it.count), on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        bottom: -1,
        left: 8,
        right: 8,
        height: 3,
        borderRadius: '3px 3px 0 0',
        background: 'var(--action-default)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// slides/slides.jsx
try { (() => {
/* Clout slide kit — reusable 16:9 layouts (1280×720). Self-contained: tokens + asset SVGs +
   inline styles that mirror the component library. Shared primitives exported to window. */
const D = 'var(--font-display)',
  B = 'var(--font-body)';
const frame = {
  position: 'relative',
  width: 1280,
  height: 720,
  background: 'var(--clout-black)',
  color: 'var(--clout-white)',
  overflow: 'hidden',
  fontFamily: B,
  flex: 'none'
};
const splitBg = {
  position: 'absolute',
  inset: 0,
  background: 'var(--clout-splitlight)'
};
const vignette = {
  position: 'absolute',
  inset: 0,
  background: 'var(--vignette)',
  pointerEvents: 'none'
};
const pad = 88;
function Kicker({
  children,
  color = 'var(--clout-hyper-blue)'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: B,
      fontWeight: 700,
      fontSize: 18,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color
    }
  }, children);
}
function Display({
  children,
  size = 110,
  gradient = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: size,
      lineHeight: 0.9,
      textTransform: 'uppercase',
      letterSpacing: '0.01em',
      ...(gradient ? {
        background: 'var(--clout-gradient-action)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent'
      } : {}),
      ...style
    }
  }, children);
}
function Mark({
  h = 30,
  src = 'wordmark'
}) {
  return /*#__PURE__*/React.createElement("img", {
    src: `../assets/logo/clout_${src}_white.svg`,
    style: {
      height: h
    },
    alt: "Clout"
  });
}
function CTA({
  children = 'Join Now'
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      height: 64,
      padding: '0 22px 0 30px',
      borderRadius: 999,
      background: 'var(--clout-gradient-action)',
      boxShadow: 'var(--glow-action)',
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 20,
      textTransform: 'uppercase',
      letterSpacing: '0.02em'
    }
  }, children, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: 'var(--clout-black)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "20",
    height: "20",
    fill: "none",
    stroke: "var(--clout-pink)",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 12h15"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 6l6 6-6 6"
  }))));
}
function Foot({
  n,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: pad,
      right: pad,
      bottom: 36,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: B,
      fontSize: 13,
      color: 'var(--clout-slate-dim)',
      letterSpacing: '0.06em'
    }
  }, /*#__PURE__*/React.createElement(Mark, {
    h: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: 'uppercase'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, n));
}

/* 1 · Title */
function TitleSlide() {
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: splitBg
  }), /*#__PURE__*/React.createElement("div", {
    style: vignette
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Kicker, null, "Fan Engagement \xB7 Gamified"), /*#__PURE__*/React.createElement(Display, {
    size: 150,
    style: {
      letterSpacing: '0.02em'
    }
  }, "Compete.", /*#__PURE__*/React.createElement("br", null), "Win.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--clout-pink)'
    }
  }, "Be Clout.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: B,
      fontSize: 22,
      color: 'var(--clout-slate)',
      maxWidth: 640,
      marginTop: 8
    }
  }, "The premium, cinematic platform where competing to win is the point \u2014 across every sport and screen.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: pad,
      right: pad
    }
  }, /*#__PURE__*/React.createElement(Mark, {
    h: 34
  })), /*#__PURE__*/React.createElement(Foot, {
    n: "01",
    label: "Investor Overview \xB7 Confidential"
  }));
}

/* 2 · Section Divider */
function SectionSlide() {
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--clout-gradient-atmosphere)',
      opacity: 0.92
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(120% 90% at 80% 110%, rgba(5,8,17,.7), rgba(5,8,17,0) 60%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 220,
      lineHeight: 0.8,
      color: 'rgba(255,255,255,.22)'
    }
  }, "02"), /*#__PURE__*/React.createElement(Display, {
    size: 92,
    style: {
      marginTop: -20
    }
  }, "The Opportunity"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200,
      height: 6,
      borderRadius: 3,
      background: 'var(--clout-white)',
      marginTop: 24
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: pad,
      right: pad
    }
  }, /*#__PURE__*/React.createElement(Mark, {
    h: 30
  })));
}

/* 3 · Prize / Product */
function PrizeSlide() {
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--wash-blue)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: vignette
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Kicker, null, "Win a"), /*#__PURE__*/React.createElement(Display, {
    size: 120,
    gradient: true
  }, "$10,000"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: 34,
      textTransform: 'uppercase'
    }
  }, "PGA Superstore Gift Card"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(CTA, null, "Join the Open Pass"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--clout-carbon)',
      border: '2px solid var(--border-blue)',
      borderRadius: 22,
      boxShadow: 'var(--shadow-card)',
      padding: '34px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: B,
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--clout-blue-tint)'
    }
  }, "What you get"), ['Free entry to every weekly contest', 'Predict · compete · climb the board', 'Real prizes, paid instantly'].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      fontFamily: B,
      fontSize: 18
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "24",
    height: "24",
    fill: "none",
    stroke: "var(--clout-hyper-blue)",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4L19 7"
  })), t)))), /*#__PURE__*/React.createElement(Foot, {
    n: "03",
    label: "Product"
  }));
}

/* 4 · Stat / KPI */
function StatSlide() {
  const stats = [['$2.4M', 'Prizes awarded', 'var(--clout-pink)'], ['480K', 'Active players', 'var(--clout-white)'], ['92%', 'Weekly retention', 'var(--clout-hyper-blue)'], ['38', 'Sports & leagues', 'var(--clout-signal-orange)']];
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--wash-warm)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 44
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kicker, null, "Traction"), /*#__PURE__*/React.createElement(Display, {
    size: 72,
    style: {
      marginTop: 12
    }
  }, "The numbers compound")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 20
    }
  }, stats.map(([v, l, c], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: 'var(--clout-black)',
      border: '1.5px solid var(--border-hairline)',
      borderRadius: 14,
      padding: '26px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 56,
      lineHeight: 0.9,
      color: c
    }
  }, v), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: B,
      fontWeight: 600,
      fontSize: 15,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--clout-slate)'
    }
  }, l))))), /*#__PURE__*/React.createElement(Foot, {
    n: "04",
    label: "Traction"
  }));
}

/* 5 · Comparison */
function CompareSlide() {
  const rows = [['Rewards real participation', true, false], ['Cinematic, premium feel', true, false], ['Every sport & screen', true, false], ['Predatory monetization', false, true]];
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 34
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kicker, null, "Why Clout"), /*#__PURE__*/React.createElement(Display, {
    size: 72,
    style: {
      marginTop: 12
    }
  }, "Not another sportsbook")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr 1fr',
      gap: 0,
      border: '1.5px solid var(--border-hairline)',
      borderRadius: 18,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 26px',
      background: 'var(--clout-carbon)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 26px',
      background: 'var(--clout-carbon)',
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 26,
      textTransform: 'uppercase',
      textAlign: 'center',
      color: 'var(--clout-pink)'
    }
  }, "Clout"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 26px',
      background: 'var(--clout-carbon)',
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 26,
      textTransform: 'uppercase',
      textAlign: 'center',
      color: 'var(--clout-slate)'
    }
  }, "Generic"), rows.map(([label, a, b], i) => [/*#__PURE__*/React.createElement("div", {
    key: i + 'l',
    style: {
      padding: '18px 26px',
      fontFamily: B,
      fontSize: 18,
      borderTop: '1px solid var(--border-hairline)'
    }
  }, label), /*#__PURE__*/React.createElement(Mk, {
    key: i + 'a',
    on: a
  }), /*#__PURE__*/React.createElement(Mk, {
    key: i + 'b',
    on: b,
    dim: true
  })]))), /*#__PURE__*/React.createElement(Foot, {
    n: "05",
    label: "Comparison"
  }));
}
function Mk({
  on,
  dim
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderTop: '1px solid var(--border-hairline)'
    }
  }, on ? /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "26",
    height: "26",
    fill: "none",
    stroke: dim ? 'var(--clout-slate)' : 'var(--clout-hyper-blue)',
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4L19 7"
  })) : /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "26",
    height: "26",
    fill: "none",
    stroke: "var(--clout-slate-dim)",
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 6L6 18"
  })));
}

/* 6 · Big Quote */
function QuoteSlide() {
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--wash-blue)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: vignette
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 64,
      lineHeight: 1.02,
      textTransform: 'uppercase',
      maxWidth: 960
    }
  }, "\"It finally feels like ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--clout-pink)'
    }
  }, "the game rewards me"), " for showing up every week.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 48,
      background: 'var(--clout-gradient-action)',
      borderRadius: 3
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: B,
      fontWeight: 700,
      fontSize: 18
    }
  }, "Jordan M."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: B,
      fontSize: 15,
      color: 'var(--clout-slate)'
    }
  }, "Open Pass member \xB7 14-week streak")))), /*#__PURE__*/React.createElement(Foot, {
    n: "06",
    label: "Voice of the fan"
  }));
}

/* 7 · Roadmap / Timeline */
function RoadmapSlide() {
  const items = [['Q1', 'Open Pass launch', 'var(--clout-hyper-blue)'], ['Q2', 'Creator clans', 'var(--clout-electric-blue)'], ['Q3', 'World Cup Pass', 'var(--clout-violet)'], ['Q4', 'Partner hubs', 'var(--clout-pink)']];
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kicker, null, "Roadmap \xB7 2026"), /*#__PURE__*/React.createElement(Display, {
    size: 72,
    style: {
      marginTop: 12
    }
  }, "Where we're going")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '6%',
      right: '6%',
      height: 3,
      background: 'var(--clout-gradient-atmosphere)'
    }
  }), items.map(([q, t, c], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 999,
      background: c,
      boxShadow: `0 0 18px ${c}`,
      border: '3px solid var(--clout-black)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 36,
      color: c
    }
  }, q), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: B,
      fontSize: 18,
      color: 'var(--clout-white)'
    }
  }, t))))), /*#__PURE__*/React.createElement(Foot, {
    n: "07",
    label: "Roadmap"
  }));
}

/* 8 · Partnership / CTA close */
function CloseSlide() {
  return /*#__PURE__*/React.createElement("div", {
    style: frame
  }, /*#__PURE__*/React.createElement("div", {
    style: splitBg
  }), /*#__PURE__*/React.createElement("div", {
    style: vignette
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: 26
    }
  }, /*#__PURE__*/React.createElement(Mark, {
    h: 44
  }), /*#__PURE__*/React.createElement(Display, {
    size: 100
  }, "Let's build the", /*#__PURE__*/React.createElement("br", null), "default layer of", /*#__PURE__*/React.createElement("br", null), "fandom together"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'center',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(CTA, null, "Partner with Clout"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      padding: '14px 30px',
      borderRadius: 999,
      border: '3px solid transparent',
      background: 'linear-gradient(var(--clout-black),var(--clout-black)) padding-box, var(--clout-gradient-action) border-box',
      fontFamily: D,
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 20,
      textTransform: 'uppercase'
    }
  }, "partners@clout.gg"))), /*#__PURE__*/React.createElement(Foot, {
    n: "08",
    label: "Compete \xB7 Win \xB7 Be Clout"
  }));
}
const SLIDES = [TitleSlide, SectionSlide, PrizeSlide, StatSlide, CompareSlide, QuoteSlide, RoadmapSlide, CloseSlide];
Object.assign(window, {
  SLIDES,
  TitleSlide,
  SectionSlide,
  PrizeSlide,
  StatSlide,
  CompareSlide,
  QuoteSlide,
  RoadmapSlide,
  CloseSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "slides/slides.jsx", error: String((e && e.message) || e) }); }

// ui_kits/clout-app/screens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Clout product UI kit — screen compositions built ONLY from design-system components.
   Mobile-first: these are the 390×844 canonical phone screens. */
const DS = window.CloutDesignSystem_49ec9a;
const {
  Button,
  Icon,
  NavBar,
  NavIconButton,
  TabBar,
  Tabs,
  SegmentedControl,
  Surface,
  Chip,
  Avatar,
  StatBlock,
  ListRow,
  Modal,
  Progress,
  InlineAlert,
  EmptyState,
  Skeleton,
  SkeletonText,
  FormField,
  Input,
  Checkbox,
  PassCard,
  PickemCard,
  ChallengeCard,
  RewardCard,
  MarketplaceItem,
  ProfileHeader,
  LeaderboardRow,
  OnboardingStep,
  EligibilityGate
} = DS;
const screen = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'var(--bg-canvas)',
  overflow: 'hidden'
};
/* Scroll region: a plain block so children overflow (and scroll) instead of being
   compressed by flex-shrink. The flex column lives in an auto-height wrapper inside. */
const body = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 'var(--screen-pad-mobile)'
};
const stack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};
function Body({
  center = false,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: body
  }, /*#__PURE__*/React.createElement("div", {
    style: center ? {
      ...stack,
      minHeight: '100%',
      justifyContent: 'center'
    } : stack
  }, children));
}
const SectionTitle = ({
  children,
  action
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontWeight: 700,
    fontSize: 'var(--text-xl)',
    textTransform: 'uppercase',
    color: 'var(--fg-default)'
  }
}, children), action && /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-2xs)',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--fg-accent)'
  }
}, action));

/* ── HOME ─────────────────────────────────────────────────── */
function HomeScreen({
  nav
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: screen
  }, /*#__PURE__*/React.createElement(NavBar, {
    centerTitle: false,
    leading: /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo/clout_wordmark_white.svg",
      alt: "Clout",
      style: {
        height: 18,
        marginLeft: 8
      }
    }),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(NavIconButton, {
      icon: "bell",
      label: "Notifications",
      badge: true
    }), /*#__PURE__*/React.createElement(NavIconButton, {
      icon: "user",
      label: "Profile",
      onClick: () => nav('profile')
    }))
  }), /*#__PURE__*/React.createElement(Body, null, /*#__PURE__*/React.createElement(InlineAlert, {
    status: "warning",
    title: "Picks lock in 12 minutes"
  }, "Lock them in to stay eligible for the Sunday Slate."), /*#__PURE__*/React.createElement(SectionTitle, {
    action: "See all"
  }, "Your passes"), /*#__PURE__*/React.createElement(PassCard, {
    name: "Open Pass",
    sport: "NFL \xB7 Week 12",
    tier: "upgrade",
    prizes: "$50K",
    actionsLeft: "3",
    progress: 62,
    progressLabel: "4 / 7 actions",
    onClick: () => nav('picks')
  }), /*#__PURE__*/React.createElement(PassCard, {
    name: "World Cup Pass",
    sport: "Soccer \xB7 Group stage",
    prizes: "$25K",
    expiresIn: "6d",
    status: "Active"
  }), /*#__PURE__*/React.createElement(SectionTitle, {
    action: "All challenges"
  }, "Daily challenges"), /*#__PURE__*/React.createElement(ChallengeCard, {
    title: "Make 5 predictions",
    description: "Any sport counts.",
    icon: "target",
    reward: "250",
    state: "in-progress",
    progress: 60,
    progressLabel: "3 of 5 predictions",
    timeLeft: "6h left"
  }), /*#__PURE__*/React.createElement(ChallengeCard, {
    title: "Weekend streak",
    description: "Get 3 predictions correct in a row.",
    icon: "fire",
    reward: "$10",
    rewardType: "coins",
    state: "complete",
    onAction: () => nav('rewards'),
    timeLeft: "2d left"
  }), /*#__PURE__*/React.createElement(SectionTitle, null, "This week"), /*#__PURE__*/React.createElement(Surface, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(StatBlock, {
    size: "sm",
    value: "62%",
    label: "Win rate",
    delta: "+4%"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    size: "sm",
    value: "14",
    label: "Streak",
    tone: "value"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    size: "sm",
    value: "1,240",
    label: "XP",
    tone: "accent"
  })))), /*#__PURE__*/React.createElement(TabBar, {
    active: "home",
    onChange: nav,
    items: TABS
  }));
}

/* ── PICK'EM ──────────────────────────────────────────────── */
function PicksScreen({
  nav
}) {
  const [sel, setSel] = React.useState({
    mahomes: 'o'
  });
  const [confirm, setConfirm] = React.useState(false);
  const [tab, setTab] = React.useState('open');
  const pick = k => v => setSel(s => ({
    ...s,
    [k]: v
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: screen
  }, /*#__PURE__*/React.createElement(NavBar, {
    title: "Sunday Slate",
    onBack: () => nav('home'),
    actions: /*#__PURE__*/React.createElement(NavIconButton, {
      icon: "share",
      label: "Share"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--screen-pad-mobile)'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    active: tab,
    onChange: setTab,
    items: [{
      id: 'open',
      label: 'Open',
      count: 3
    }, {
      id: 'locked',
      label: 'Locked'
    }, {
      id: 'settled',
      label: 'Settled',
      count: 12
    }]
  })), /*#__PURE__*/React.createElement(Body, null, /*#__PURE__*/React.createElement(Surface, {
    variant: "sunken",
    padding: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-secondary)'
    }
  }, "Entry"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    tone: "accent"
  }, "4 / 7 picks"), /*#__PURE__*/React.createElement(Chip, {
    tone: "value"
  }, "Up to 900 XP")))), /*#__PURE__*/React.createElement(PickemCard, {
    subject: "P. Mahomes",
    meta: "KC @ BUF \xB7 Sun 4:25pm",
    line: "Passing yards 274.5",
    xpValue: "120 XP",
    options: [{
      id: 'o',
      label: 'Over',
      detail: '120 XP'
    }, {
      id: 'u',
      label: 'Under',
      detail: '120 XP'
    }],
    selected: sel.mahomes,
    onSelect: pick('mahomes'),
    lockLabel: "Locks 4:25pm"
  }), /*#__PURE__*/React.createElement(PickemCard, {
    subject: "J. Jefferson",
    meta: "MIN @ GB \xB7 Sun 1:00pm",
    line: "Receiving yards 88.5",
    xpValue: "150 XP",
    options: [{
      id: 'o',
      label: 'Over',
      detail: '150 XP'
    }, {
      id: 'u',
      label: 'Under',
      detail: '150 XP'
    }],
    selected: sel.jj,
    onSelect: pick('jj'),
    lockLabel: "Locks 1:00pm"
  }), /*#__PURE__*/React.createElement(PickemCard, {
    subject: "C. McCaffrey",
    meta: "SF @ SEA \xB7 Settled",
    line: "Rushing yards 78.5",
    options: [{
      id: 'o',
      label: 'Over'
    }, {
      id: 'u',
      label: 'Under'
    }],
    selected: "o",
    state: "correct"
  }), /*#__PURE__*/React.createElement(PickemCard, {
    subject: "T. Hill",
    meta: "MIA @ NYJ \xB7 Settled",
    line: "Receptions 6.5",
    options: [{
      id: 'o',
      label: 'Over'
    }, {
      id: 'u',
      label: 'Under'
    }],
    selected: "u",
    state: "incorrect"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--screen-pad-mobile)',
      borderTop: '1px solid var(--border-default)',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    style: {
      width: '100%'
    },
    onClick: () => setConfirm(true)
  }, "Submit 4 picks")), /*#__PURE__*/React.createElement(TabBar, {
    active: "picks",
    onChange: nav,
    items: TABS
  }), confirm && /*#__PURE__*/React.createElement(Modal, {
    presentation: "sheet",
    title: "Confirm your picks",
    description: "Free to play \u2014 no entry needed. Picks lock at kickoff and can't be changed.",
    onClose: () => setConfirm(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      family: "dark",
      size: "small",
      showArrow: false,
      onClick: () => setConfirm(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      size: "small",
      onClick: () => setConfirm(false)
    }, "Lock it in"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    title: "P. Mahomes \xB7 Over 274.5",
    subtitle: "KC @ BUF",
    value: "120 XP",
    valueTone: "value"
  }), /*#__PURE__*/React.createElement(ListRow, {
    title: "J. Jefferson \xB7 Over 88.5",
    subtitle: "MIN @ GB",
    value: "150 XP",
    valueTone: "value",
    divider: false
  }), /*#__PURE__*/React.createElement(Checkbox, {
    id: "ack",
    label: "I understand picks are final"
  }))));
}

/* ── REWARDS ──────────────────────────────────────────────── */
function RewardsScreen({
  nav
}) {
  const [view, setView] = React.useState('rewards');
  const [redeem, setRedeem] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: screen
  }, /*#__PURE__*/React.createElement(NavBar, {
    title: "Rewards",
    actions: /*#__PURE__*/React.createElement(NavIconButton, {
      icon: "clock",
      label: "History"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--screen-pad-mobile) 12px'
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    value: view,
    onChange: setView,
    items: [{
      id: 'rewards',
      label: 'Rewards'
    }, {
      id: 'shop',
      label: 'Shop'
    }]
  })), /*#__PURE__*/React.createElement(Body, null, view === 'rewards' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Surface, {
    variant: "accent",
    padding: "lg"
  }, /*#__PURE__*/React.createElement(Progress, {
    label: "Season pass",
    valueLabel: "1,240 / 2,000 XP",
    value: 62
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--fg-muted)'
    }
  }, "760 XP to Tier 3 \u2014 unlocks the jersey drop.")), /*#__PURE__*/React.createElement(SectionTitle, null, "Ready to redeem"), /*#__PURE__*/React.createElement(RewardCard, {
    title: "PGA Superstore Gift Card",
    value: "$500",
    state: "unlocked",
    requiresEligibility: true,
    onRedeem: () => setRedeem(true)
  }), /*#__PURE__*/React.createElement(SectionTitle, null, "Locked"), /*#__PURE__*/React.createElement(RewardCard, {
    compact: true,
    title: "Official Team Jersey",
    state: "locked",
    requirement: "Reach Tier 3 to unlock"
  }), /*#__PURE__*/React.createElement(RewardCard, {
    compact: true,
    title: "Courtside Experience",
    state: "locked",
    requirement: "Reach Tier 5 to unlock"
  }), /*#__PURE__*/React.createElement(SectionTitle, null, "Redeemed"), /*#__PURE__*/React.createElement(RewardCard, {
    compact: true,
    title: "Nike Gift Card",
    value: "$50",
    state: "redeemed",
    redeemedOn: "Redeemed Mar 4"
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    selectable: true,
    selected: true
  }, "All"), /*#__PURE__*/React.createElement(Chip, {
    selectable: true
  }, "Apparel"), /*#__PURE__*/React.createElement(Chip, {
    selectable: true
  }, "Tech"), /*#__PURE__*/React.createElement(Chip, {
    selectable: true
  }, "Experiences")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(MarketplaceItem, {
    brand: "Nike",
    name: "Dri-FIT Training Tee",
    cost: "2,500",
    stock: "12 left"
  }), /*#__PURE__*/React.createElement(MarketplaceItem, {
    brand: "Clout",
    name: "Signature Hoodie",
    cost: "6,000",
    state: "low-stock",
    stock: "3 left"
  }), /*#__PURE__*/React.createElement(MarketplaceItem, {
    brand: "Beats",
    name: "Studio Pro Headphones",
    cost: "18,000",
    state: "sold-out"
  }), /*#__PURE__*/React.createElement(MarketplaceItem, {
    brand: "Clout",
    name: "Team Cap",
    cost: "1,800",
    state: "owned"
  })))), /*#__PURE__*/React.createElement(TabBar, {
    active: "rewards",
    onChange: nav,
    items: TABS
  }), redeem && /*#__PURE__*/React.createElement(Modal, {
    presentation: "sheet",
    dismissible: false,
    title: "Verify to redeem",
    onClose: () => setRedeem(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      family: "dark",
      size: "small",
      showArrow: false,
      onClick: () => setRedeem(false)
    }, "Not now"), /*#__PURE__*/React.createElement(Button, {
      size: "small",
      onClick: () => setRedeem(false)
    }, "Verify location"))
  }, /*#__PURE__*/React.createElement(EligibilityGate, {
    prizeName: "$500 PGA Superstore Gift Card",
    steps: [{
      id: 'age',
      label: "Confirm you're 18+",
      detail: 'Completed at first redemption',
      state: 'complete'
    }, {
      id: 'geo',
      label: 'Verify your location',
      detail: 'Required in your region',
      state: 'active'
    }, {
      id: 'kyc',
      label: 'Verify identity',
      detail: 'Needed to ship physical prizes',
      state: 'pending'
    }]
  })));
}

/* ── PROFILE ──────────────────────────────────────────────── */
function ProfileScreen({
  nav
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: screen
  }, /*#__PURE__*/React.createElement(NavBar, {
    title: "Profile",
    onBack: () => nav('home'),
    actions: /*#__PURE__*/React.createElement(NavIconButton, {
      icon: "menu",
      label: "Settings"
    })
  }), /*#__PURE__*/React.createElement(Body, null, /*#__PURE__*/React.createElement(ProfileHeader, {
    name: "Jordan M.",
    handle: "@jmvp",
    tier: "Gold",
    rank: "#1,204",
    xp: 1240,
    xpMax: 2000,
    level: 7,
    onEdit: () => {},
    stats: [{
      value: '62%',
      label: 'Win rate'
    }, {
      value: '14',
      label: 'Streak',
      tone: 'value'
    }, {
      value: '$1.2K',
      label: 'Won',
      tone: 'value'
    }]
  }), /*#__PURE__*/React.createElement(SectionTitle, {
    action: "Full board"
  }, "Leaderboard"), /*#__PURE__*/React.createElement(Surface, {
    padding: "sm"
  }, /*#__PURE__*/React.createElement(LeaderboardRow, {
    rank: 1,
    name: "Alex R.",
    meta: "18-week streak",
    score: "1,480",
    delta: 1,
    prize: "$500"
  }), /*#__PURE__*/React.createElement(LeaderboardRow, {
    rank: 2,
    name: "Jordan M.",
    meta: "14-week streak",
    score: "1,240",
    delta: 2,
    prize: "$250",
    isCurrentUser: true
  }), /*#__PURE__*/React.createElement(LeaderboardRow, {
    rank: 3,
    name: "Sam K.",
    score: "1,105",
    delta: -1,
    prize: "$100"
  })), /*#__PURE__*/React.createElement(SectionTitle, null, "Account"), /*#__PURE__*/React.createElement(Surface, {
    padding: "none",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "gift",
      size: 20,
      color: "var(--fg-secondary)"
    }),
    title: "Redeemed rewards",
    value: "6",
    chevron: true
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "coin",
      size: 20,
      color: "var(--fg-secondary)"
    }),
    title: "Coin balance",
    value: "8,420",
    valueTone: "value",
    chevron: true
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "bell",
      size: 20,
      color: "var(--fg-secondary)"
    }),
    title: "Notifications",
    chevron: true
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement(Icon, {
      name: "external",
      size: 20,
      color: "var(--fg-secondary)"
    }),
    title: "Responsible play",
    chevron: true,
    divider: false
  }))), /*#__PURE__*/React.createElement(TabBar, {
    active: "me",
    onChange: nav,
    items: TABS
  }));
}

/* ── ONBOARDING ───────────────────────────────────────────── */
function OnboardingScreen({
  nav
}) {
  const [step, setStep] = React.useState(1);
  const heroes = [/*#__PURE__*/React.createElement("div", {
    key: "1",
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 180,
      height: 180,
      borderRadius: '50%',
      background: 'var(--clout-gradient-atmosphere)',
      boxShadow: 'var(--glow-blue)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/clout_symbol_white.svg",
    alt: "",
    style: {
      width: 84
    }
  })), /*#__PURE__*/React.createElement("div", {
    key: "2",
    style: {
      width: '100%',
      maxWidth: 300
    }
  }, /*#__PURE__*/React.createElement(PickemCard, {
    subject: "P. Mahomes",
    line: "Passing yards 274.5",
    xpValue: "120 XP",
    options: [{
      id: 'o',
      label: 'Over'
    }, {
      id: 'u',
      label: 'Under'
    }],
    selected: "o"
  })), /*#__PURE__*/React.createElement("div", {
    key: "3",
    style: {
      width: '100%',
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement(RewardCard, {
    title: "PGA Superstore Gift Card",
    value: "$500",
    state: "unlocked"
  }))];
  const copy = [{
    eyebrow: 'Welcome to Clout',
    title: 'Fandom, but competitive',
    description: 'Turn watching into playing. Every pick, every week, across every sport.'
  }, {
    eyebrow: 'How it works',
    title: 'Make your picks',
    description: 'Choose over or under on the players you follow. Build a streak, climb the board.'
  }, {
    eyebrow: 'Why it pays',
    title: 'Win real prizes',
    description: 'Cash, gear and experiences from partners you actually want.'
  }][step - 1];
  return /*#__PURE__*/React.createElement(OnboardingStep, _extends({
    step: step,
    total: 3
  }, copy, {
    hero: heroes[step - 1],
    onSkip: () => nav('home'),
    primaryAction: /*#__PURE__*/React.createElement(Button, {
      style: {
        width: '100%'
      },
      onClick: () => step < 3 ? setStep(step + 1) : nav('home')
    }, step < 3 ? 'Continue' : 'Create account'),
    secondaryAction: step === 3 ? /*#__PURE__*/React.createElement(Button, {
      family: "outline",
      showArrow: false,
      style: {
        width: '100%'
      },
      onClick: () => nav('home')
    }, "I already have an account") : null
  }));
}

/* ── LOADING / EMPTY reference states ─────────────────────── */
function LoadingScreen() {
  return /*#__PURE__*/React.createElement("div", {
    style: screen
  }, /*#__PURE__*/React.createElement(NavBar, {
    title: "Sunday Slate"
  }), /*#__PURE__*/React.createElement(Body, null, [0, 1, 2].map(i => /*#__PURE__*/React.createElement(Surface, {
    key: i,
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    circle: true,
    height: 44
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(SkeletonText, {
    lines: 2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    height: 48,
    radius: "var(--radius-md)"
  }), /*#__PURE__*/React.createElement(Skeleton, {
    height: 48,
    radius: "var(--radius-md)"
  }))))));
}
function EmptyScreen({
  nav
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: screen
  }, /*#__PURE__*/React.createElement(NavBar, {
    title: "Your picks",
    onBack: () => nav('home')
  }), /*#__PURE__*/React.createElement(Body, {
    center: true
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "target",
      size: 28,
      color: "currentColor"
    }),
    title: "No picks yet",
    description: "Enter a contest to start building your streak. Your first pick is on us.",
    action: /*#__PURE__*/React.createElement(Button, {
      size: "small",
      onClick: () => nav('picks')
    }, "Browse contests")
  })), /*#__PURE__*/React.createElement(TabBar, {
    active: "picks",
    onChange: nav,
    items: TABS
  }));
}
const TABS = [{
  id: 'home',
  label: 'Home',
  icon: 'bolt'
}, {
  id: 'picks',
  label: 'Picks',
  icon: 'target'
}, {
  id: 'rewards',
  label: 'Rewards',
  icon: 'gift',
  badge: 2
}, {
  id: 'profile',
  label: 'Me',
  icon: 'user'
}];
Object.assign(window, {
  HomeScreen,
  PicksScreen,
  RewardsScreen,
  ProfileScreen,
  OnboardingScreen,
  LoadingScreen,
  EmptyScreen,
  TABS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/clout-app/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.ChallengeCard = __ds_scope.ChallengeCard;

__ds_ns.EligibilityGate = __ds_scope.EligibilityGate;

__ds_ns.LeaderboardRow = __ds_scope.LeaderboardRow;

__ds_ns.MarketplaceItem = __ds_scope.MarketplaceItem;

__ds_ns.OnboardingStep = __ds_scope.OnboardingStep;

__ds_ns.PassCard = __ds_scope.PassCard;

__ds_ns.PickemCard = __ds_scope.PickemCard;

__ds_ns.ProfileHeader = __ds_scope.ProfileHeader;

__ds_ns.RewardCard = __ds_scope.RewardCard;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.InlineAlert = __ds_scope.InlineAlert;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.SkeletonText = __ds_scope.SkeletonText;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.STATUS = __ds_scope.STATUS;

__ds_ns.StatusIcon = __ds_scope.StatusIcon;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FormField = __ds_scope.FormField;

__ds_ns.STATUS_COLOR = __ds_scope.STATUS_COLOR;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextArea = __ds_scope.TextArea;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.Surface = __ds_scope.Surface;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Countdown = __ds_scope.Countdown;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.PassTag = __ds_scope.PassTag;

__ds_ns.PriceTag = __ds_scope.PriceTag;

__ds_ns.PrizeCard = __ds_scope.PrizeCard;

__ds_ns.StatChip = __ds_scope.StatChip;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Menu = __ds_scope.Menu;

__ds_ns.NavBar = __ds_scope.NavBar;

__ds_ns.NavIconButton = __ds_scope.NavIconButton;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
