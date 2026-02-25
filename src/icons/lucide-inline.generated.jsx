/**
 * Generated file. Do not edit by hand.
 *
 * Source: lucide-react iconNode arrays extracted from node_modules at generation time.
 * Generator: scripts/generate-inline-lucide.mjs
 */

function createInlineLucideIcon(iconNode) {
  const Component = ({
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    children,
    ...rest
  }) => {
    const resolvedSize = Number(size) || 24;
    const resolvedStrokeWidth = absoluteStrokeWidth
      ? (Number(strokeWidth) * 24) / resolvedSize
      : strokeWidth;

    const hasLabel = rest['aria-label'] != null || rest['aria-labelledby'] != null;
    const ariaHidden = rest['aria-hidden'] ?? (!hasLabel ? true : undefined);

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={resolvedSize}
        height={resolvedSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={ariaHidden}
        focusable="false"
        {...rest}
      >
        {iconNode.map(([tag, attrs]) => {
          const Tag = tag;
          const { key: keyProp, ...rest } = attrs;
          return <Tag key={keyProp} {...rest} />;
        })}
        {children}
      </svg>
    );
  };

  Component.displayName = 'InlineLucideIcon';
  return Component;
}

export const AlertTriangle = createInlineLucideIcon([["path",{"d":"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z","key":"c3ski4"}],["path",{"d":"M12 9v4","key":"juzpu7"}],["path",{"d":"M12 17h.01","key":"p32p05"}]]);
export const ArrowDown = createInlineLucideIcon([["path",{"d":"M12 5v14","key":"s699le"}],["path",{"d":"m19 12-7 7-7-7","key":"1idqje"}]]);
export const Award = createInlineLucideIcon([["circle",{"cx":"12","cy":"8","r":"6","key":"1vp47v"}],["path",{"d":"M15.477 12.89 17 22l-5-3-5 3 1.523-9.11","key":"em7aur"}]]);
export const Banknote = createInlineLucideIcon([["rect",{"width":"20","height":"12","x":"2","y":"6","rx":"2","key":"9lu3g6"}],["circle",{"cx":"12","cy":"12","r":"2","key":"1c9p78"}],["path",{"d":"M6 12h.01M18 12h.01","key":"113zkx"}]]);
export const Building2 = createInlineLucideIcon([["path",{"d":"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z","key":"1b4qmf"}],["path",{"d":"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2","key":"i71pzd"}],["path",{"d":"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2","key":"10jefs"}],["path",{"d":"M10 6h4","key":"1itunk"}],["path",{"d":"M10 10h4","key":"tcdvrf"}],["path",{"d":"M10 14h4","key":"kelpxr"}],["path",{"d":"M10 18h4","key":"1ulq68"}]]);
export const Check = createInlineLucideIcon([["polyline",{"points":"20 6 9 17 4 12","key":"10jjfj"}]]);
export const ChevronDown = createInlineLucideIcon([["path",{"d":"m6 9 6 6 6-6","key":"qrunsl"}]]);
export const ChevronLeft = createInlineLucideIcon([["path",{"d":"m15 18-6-6 6-6","key":"1wnfg3"}]]);
export const ChevronRight = createInlineLucideIcon([["path",{"d":"m9 18 6-6-6-6","key":"mthhwq"}]]);
export const ChevronUp = createInlineLucideIcon([["path",{"d":"m18 15-6-6-6 6","key":"153udz"}]]);
export const Clock = createInlineLucideIcon([["circle",{"cx":"12","cy":"12","r":"10","key":"1mglay"}],["polyline",{"points":"12 6 12 12 16 14","key":"68esgv"}]]);
export const Cookie = createInlineLucideIcon([["path",{"d":"M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5","key":"laymnq"}],["path",{"d":"M8.5 8.5v.01","key":"ue8clq"}],["path",{"d":"M16 15.5v.01","key":"14dtrp"}],["path",{"d":"M12 12v.01","key":"u5ubse"}],["path",{"d":"M11 17v.01","key":"1hyl5a"}],["path",{"d":"M7 14v.01","key":"uct60s"}]]);
export const DollarSign = createInlineLucideIcon([["line",{"x1":"12","x2":"12","y1":"2","y2":"22","key":"7eqyqh"}],["path",{"d":"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6","key":"1b0p4s"}]]);
export const Edit3 = createInlineLucideIcon([["path",{"d":"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z","key":"5qss01"}],["path",{"d":"m15 5 4 4","key":"1mk7zo"}]]);
export const Factory = createInlineLucideIcon([["path",{"d":"M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z","key":"159hny"}],["path",{"d":"M17 18h1","key":"uldtlt"}],["path",{"d":"M12 18h1","key":"s9uhes"}],["path",{"d":"M7 18h1","key":"1neino"}]]);
export const FileText = createInlineLucideIcon([["path",{"d":"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z","key":"1nnpy2"}],["polyline",{"points":"14 2 14 8 20 8","key":"1ew0cm"}],["line",{"x1":"16","x2":"8","y1":"13","y2":"13","key":"14keom"}],["line",{"x1":"16","x2":"8","y1":"17","y2":"17","key":"17nazh"}],["line",{"x1":"10","x2":"8","y1":"9","y2":"9","key":"1a5vjj"}]]);
export const Flame = createInlineLucideIcon([["path",{"d":"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z","key":"96xj49"}]]);
export const Frown = createInlineLucideIcon([["circle",{"cx":"12","cy":"12","r":"10","key":"1mglay"}],["path",{"d":"M16 16s-1.5-2-4-2-4 2-4 2","key":"epbg0q"}],["line",{"x1":"9","x2":"9.01","y1":"9","y2":"9","key":"yxxnd0"}],["line",{"x1":"15","x2":"15.01","y1":"9","y2":"9","key":"1p4y9e"}]]);
export const Globe = createInlineLucideIcon([["circle",{"cx":"12","cy":"12","r":"10","key":"1mglay"}],["line",{"x1":"2","x2":"22","y1":"12","y2":"12","key":"1dnqot"}],["path",{"d":"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z","key":"nb9nel"}]]);
export const Heart = createInlineLucideIcon([["path",{"d":"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z","key":"c3ymky"}]]);
export const Hourglass = createInlineLucideIcon([["path",{"d":"M5 22h14","key":"ehvnwv"}],["path",{"d":"M5 2h14","key":"pdyrp9"}],["path",{"d":"M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22","key":"1d314k"}],["path",{"d":"M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2","key":"1vvvr6"}]]);
export const Info = createInlineLucideIcon([["circle",{"cx":"12","cy":"12","r":"10","key":"1mglay"}],["path",{"d":"M12 16v-4","key":"1dtifu"}],["path",{"d":"M12 8h.01","key":"e9boi3"}]]);
export const Landmark = createInlineLucideIcon([["line",{"x1":"3","x2":"21","y1":"22","y2":"22","key":"j8o0r"}],["line",{"x1":"6","x2":"6","y1":"18","y2":"11","key":"10tf0k"}],["line",{"x1":"10","x2":"10","y1":"18","y2":"11","key":"54lgf6"}],["line",{"x1":"14","x2":"14","y1":"18","y2":"11","key":"380y"}],["line",{"x1":"18","x2":"18","y1":"18","y2":"11","key":"1kevvc"}],["polygon",{"points":"12 2 20 7 4 7","key":"jkujk7"}]]);
export const LayoutGrid = createInlineLucideIcon([["rect",{"width":"7","height":"7","x":"3","y":"3","rx":"1","key":"1g98yp"}],["rect",{"width":"7","height":"7","x":"14","y":"3","rx":"1","key":"6d4xhi"}],["rect",{"width":"7","height":"7","x":"14","y":"14","rx":"1","key":"nxv5o0"}],["rect",{"width":"7","height":"7","x":"3","y":"14","rx":"1","key":"1bb6yr"}]]);
export const Leaf = createInlineLucideIcon([["path",{"d":"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z","key":"nnexq3"}],["path",{"d":"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12","key":"mt58a7"}]]);
export const List = createInlineLucideIcon([["line",{"x1":"8","x2":"21","y1":"6","y2":"6","key":"7ey8pc"}],["line",{"x1":"8","x2":"21","y1":"12","y2":"12","key":"rjfblc"}],["line",{"x1":"8","x2":"21","y1":"18","y2":"18","key":"c3b1m8"}],["line",{"x1":"3","x2":"3.01","y1":"6","y2":"6","key":"1g7gq3"}],["line",{"x1":"3","x2":"3.01","y1":"12","y2":"12","key":"1pjlvk"}],["line",{"x1":"3","x2":"3.01","y1":"18","y2":"18","key":"28t2mc"}]]);
export const Loader2 = createInlineLucideIcon([["path",{"d":"M21 12a9 9 0 1 1-6.219-8.56","key":"13zald"}]]);
export const Map = createInlineLucideIcon([["polygon",{"points":"3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21","key":"ok2ie8"}],["line",{"x1":"9","x2":"9","y1":"3","y2":"18","key":"w34qz5"}],["line",{"x1":"15","x2":"15","y1":"6","y2":"21","key":"volv9a"}]]);
export const MapPin = createInlineLucideIcon([["path",{"d":"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z","key":"2oe9fu"}],["circle",{"cx":"12","cy":"10","r":"3","key":"ilqhr7"}]]);
export const Maximize2 = createInlineLucideIcon([["polyline",{"points":"15 3 21 3 21 9","key":"mznyad"}],["polyline",{"points":"9 21 3 21 3 15","key":"1avn1i"}],["line",{"x1":"21","x2":"14","y1":"3","y2":"10","key":"ota7mn"}],["line",{"x1":"3","x2":"10","y1":"21","y2":"14","key":"1atl0r"}]]);
export const Medal = createInlineLucideIcon([["path",{"d":"M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15","key":"143lza"}],["path",{"d":"M11 12 5.12 2.2","key":"qhuxz6"}],["path",{"d":"m13 12 5.88-9.8","key":"hbye0f"}],["path",{"d":"M8 7h8","key":"i86dvs"}],["circle",{"cx":"12","cy":"17","r":"5","key":"qbz8iq"}],["path",{"d":"M12 18v-2h-.5","key":"fawc4q"}]]);
export const Minimize2 = createInlineLucideIcon([["polyline",{"points":"4 14 10 14 10 20","key":"11kfnr"}],["polyline",{"points":"20 10 14 10 14 4","key":"rlmsce"}],["line",{"x1":"14","x2":"21","y1":"10","y2":"3","key":"o5lafz"}],["line",{"x1":"3","x2":"10","y1":"21","y2":"14","key":"1atl0r"}]]);
export const Moon = createInlineLucideIcon([["path",{"d":"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z","key":"a7tn18"}]]);
export const Mountain = createInlineLucideIcon([["path",{"d":"m8 3 4 8 5-5 5 15H2L8 3z","key":"otkl63"}]]);
export const RotateCcw = createInlineLucideIcon([["path",{"d":"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8","key":"1357e3"}],["path",{"d":"M3 3v5h5","key":"1xhq8a"}]]);
export const Scale = createInlineLucideIcon([["path",{"d":"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z","key":"7g6ntu"}],["path",{"d":"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z","key":"ijws7r"}],["path",{"d":"M7 21h10","key":"1b0cd5"}],["path",{"d":"M12 3v18","key":"108xh3"}],["path",{"d":"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2","key":"3gwbw2"}]]);
export const Search = createInlineLucideIcon([["circle",{"cx":"11","cy":"11","r":"8","key":"4ej97u"}],["path",{"d":"m21 21-4.3-4.3","key":"1qie3q"}]]);
export const Settings = createInlineLucideIcon([["path",{"d":"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z","key":"1qme2f"}],["circle",{"cx":"12","cy":"12","r":"3","key":"1v7zrd"}]]);
export const Skull = createInlineLucideIcon([["circle",{"cx":"9","cy":"12","r":"1","key":"1vctgf"}],["circle",{"cx":"15","cy":"12","r":"1","key":"1tmaij"}],["path",{"d":"M8 20v2h8v-2","key":"ded4og"}],["path",{"d":"m12.5 17-.5-1-.5 1h1z","key":"3me087"}],["path",{"d":"M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20","key":"xq9p5u"}]]);
export const Snowflake = createInlineLucideIcon([["line",{"x1":"2","x2":"22","y1":"12","y2":"12","key":"1dnqot"}],["line",{"x1":"12","x2":"12","y1":"2","y2":"22","key":"7eqyqh"}],["path",{"d":"m20 16-4-4 4-4","key":"rquw4f"}],["path",{"d":"m4 8 4 4-4 4","key":"12s3z9"}],["path",{"d":"m16 4-4 4-4-4","key":"1tumq1"}],["path",{"d":"m8 20 4-4 4 4","key":"9p200w"}]]);
export const Soup = createInlineLucideIcon([["path",{"d":"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z","key":"4rw317"}],["path",{"d":"M7 21h10","key":"1b0cd5"}],["path",{"d":"M19.5 12 22 6","key":"shfsr5"}],["path",{"d":"M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62","key":"rpc6vp"}],["path",{"d":"M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62","key":"1lf63m"}],["path",{"d":"M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62","key":"97tijn"}]]);
export const Sparkles = createInlineLucideIcon([["path",{"d":"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z","key":"17u4zn"}],["path",{"d":"M5 3v4","key":"bklmnn"}],["path",{"d":"M19 17v4","key":"iiml17"}],["path",{"d":"M3 5h4","key":"nem4j1"}],["path",{"d":"M17 19h4","key":"lbex7p"}]]);
export const Sprout = createInlineLucideIcon([["path",{"d":"M7 20h10","key":"e6iznv"}],["path",{"d":"M10 20c5.5-2.5.8-6.4 3-10","key":"161w41"}],["path",{"d":"M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z","key":"9gtqwd"}],["path",{"d":"M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z","key":"bkxnd2"}]]);
export const Sun = createInlineLucideIcon([["circle",{"cx":"12","cy":"12","r":"4","key":"4exip2"}],["path",{"d":"M12 2v2","key":"tus03m"}],["path",{"d":"M12 20v2","key":"1lh1kg"}],["path",{"d":"m4.93 4.93 1.41 1.41","key":"149t6j"}],["path",{"d":"m17.66 17.66 1.41 1.41","key":"ptbguv"}],["path",{"d":"M2 12h2","key":"1t8f8n"}],["path",{"d":"M20 12h2","key":"1q8mjw"}],["path",{"d":"m6.34 17.66-1.41 1.41","key":"1m8zz5"}],["path",{"d":"m19.07 4.93-1.41 1.41","key":"1shlcs"}]]);
export const Timer = createInlineLucideIcon([["line",{"x1":"10","x2":"14","y1":"2","y2":"2","key":"14vaq8"}],["line",{"x1":"12","x2":"15","y1":"14","y2":"11","key":"17fdiu"}],["circle",{"cx":"12","cy":"14","r":"8","key":"1e1u0o"}]]);
export const Trophy = createInlineLucideIcon([["path",{"d":"M6 9H4.5a2.5 2.5 0 0 1 0-5H6","key":"17hqa7"}],["path",{"d":"M18 9h1.5a2.5 2.5 0 0 0 0-5H18","key":"lmptdp"}],["path",{"d":"M4 22h16","key":"57wxv0"}],["path",{"d":"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22","key":"1nw9bq"}],["path",{"d":"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22","key":"1np0yb"}],["path",{"d":"M18 2H6v7a6 6 0 0 0 12 0V2Z","key":"u46fv3"}]]);
export const Utensils = createInlineLucideIcon([["path",{"d":"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2","key":"cjf0a3"}],["path",{"d":"M7 2v20","key":"1473qp"}],["path",{"d":"M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7","key":"1ogz0v"}]]);
export const UtensilsCrossed = createInlineLucideIcon([["path",{"d":"m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8","key":"n7qcjb"}],["path",{"d":"M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7","key":"d0u48b"}],["path",{"d":"m2.1 21.8 6.4-6.3","key":"yn04lh"}],["path",{"d":"m19 5-7 7","key":"194lzd"}]]);
export const Waves = createInlineLucideIcon([["path",{"d":"M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1","key":"knzxuh"}],["path",{"d":"M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1","key":"2jd2cc"}],["path",{"d":"M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1","key":"rd2r6e"}]]);
export const Wheat = createInlineLucideIcon([["path",{"d":"M2 22 16 8","key":"60hf96"}],["path",{"d":"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z","key":"1rdhi6"}],["path",{"d":"M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z","key":"1sdzmb"}],["path",{"d":"M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z","key":"eoatbi"}],["path",{"d":"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z","key":"19rau1"}],["path",{"d":"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z","key":"tc8ph9"}],["path",{"d":"M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z","key":"2m8kc5"}],["path",{"d":"M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z","key":"vex3ng"}]]);
export const X = createInlineLucideIcon([["path",{"d":"M18 6 6 18","key":"1bl5f8"}],["path",{"d":"m6 6 12 12","key":"d8bk6v"}]]);
export const Zap = createInlineLucideIcon([["polygon",{"points":"13 2 3 14 12 14 11 22 21 10 12 10 13 2","key":"45s27k"}]]);
