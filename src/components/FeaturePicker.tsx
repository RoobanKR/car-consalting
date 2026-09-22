'use client';
import { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

const commonFeatures = ['Air conditioning', 'Climate control', 'Power steering', 'Power windows', 'ABS', 'Airbags', 'Bluetooth', 'Touchscreen', 'Reverse camera', 'Parking sensors', 'Sunroof', 'Cruise control', 'Keyless entry', 'Rear air vents', 'Alloy wheels', 'Leather seats', 'Apple CarPlay', 'Android Auto'];

export default function FeaturePicker({ value, onChange }: { value: string[]; onChange: (features: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [other, setOther] = useState('');
  function toggle(feature: string) { onChange(value.includes(feature) ? value.filter(item => item !== feature) : [...value, feature]); }
  function addOther() {
    const feature = other.trim();
    if (!feature) return;
    if (!value.some(item => item.toLowerCase() === feature.toLowerCase())) onChange([...value, feature]);
    setOther(''); setShowOther(false);
  }
  return <div className="feature-picker">
    <span className="feature-picker-label">Features <small>Select multiple</small></span>
    <button type="button" className="feature-picker-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>Choose features <span>{value.length ? `${value.length} selected` : 'Select' } <ChevronDown size={16}/></span></button>
    {open && <div className="feature-picker-menu">
      <div className="feature-picker-options">{commonFeatures.map(feature => <label key={feature} className="feature-picker-option"><input type="checkbox" checked={value.includes(feature)} onChange={() => toggle(feature)}/><span>{feature}</span></label>)}</div>
      <button type="button" className="feature-other-button" onClick={() => setShowOther(!showOther)}><Plus size={15}/> Other feature</button>
      {showOther && <div className="feature-other-entry"><input value={other} maxLength={100} onChange={event => setOther(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addOther(); } }} placeholder="Type a feature" aria-label="Other feature"/><button type="button" onClick={addOther}>Add</button></div>}
    </div>}
    {!!value.length && <div className="feature-chips">{value.map(feature => <span key={feature}>{feature}<button type="button" onClick={() => toggle(feature)} aria-label={`Remove ${feature}`}><X size={13}/></button></span>)}</div>}
  </div>;
}
