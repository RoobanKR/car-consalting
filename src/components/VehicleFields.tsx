'use client';
import { useMemo, useState } from 'react';
import type { Car } from '@/lib/api';
import { bodyForModel, bodyTypes, brands, modelsForBrand } from '@/lib/vehicleCatalog';

type Values = Pick<Car, 'brand' | 'model' | 'bodyType'>;

export default function VehicleFields({ value, inventory, onChange }: { value: Values; inventory: Car[]; onChange: (value: Values) => void }) {
  const brandOptions = useMemo(() => [...new Set([...brands, ...inventory.map(car => car.brand)])].sort((a, b) => a.localeCompare(b)), [inventory]);
  const modelOptions = useMemo(() => [...new Set([...modelsForBrand(value.brand), ...inventory.filter(car => car.brand === value.brand).map(car => car.model)])].sort((a, b) => a.localeCompare(b)), [inventory, value.brand]);
  const [otherBrand, setOtherBrand] = useState(Boolean(value.brand && !brandOptions.includes(value.brand)));
  const [otherModel, setOtherModel] = useState(Boolean(value.model && !modelOptions.includes(value.model)));

  return <>
    <label>Brand
      <select required value={otherBrand ? '__other__' : value.brand} onChange={event => {
        const choice = event.target.value;
        setOtherBrand(choice === '__other__'); setOtherModel(false);
        onChange({ brand: choice === '__other__' ? '' : choice, model: '', bodyType: '' });
      }}><option value="" disabled>Select brand</option>{brandOptions.map(brand => <option key={brand} value={brand}>{brand}</option>)}<option value="__other__">Other brand</option></select>
      {otherBrand && <input required autoFocus maxLength={80} value={value.brand} onChange={event => onChange({ brand: event.target.value, model: '', bodyType: '' })} placeholder="Enter brand name"/>}
    </label>
    <label>Model
      <select required disabled={!value.brand} value={otherModel ? '__other__' : value.model} onChange={event => {
        const choice = event.target.value;
        setOtherModel(choice === '__other__');
        onChange({ ...value, model: choice === '__other__' ? '' : choice, bodyType: bodyForModel(value.brand, choice) });
      }}><option value="" disabled>{value.brand ? 'Select model' : 'Select brand first'}</option>{modelOptions.map(model => <option key={model} value={model}>{model}</option>)}<option value="__other__">Other model</option></select>
      {otherModel && <input required autoFocus maxLength={80} value={value.model} onChange={event => onChange({ ...value, model: event.target.value, bodyType: '' })} placeholder="Enter model name"/>}
    </label>
    <label>Body type
      <select required value={value.bodyType || ''} onChange={event => onChange({ ...value, bodyType: event.target.value })}><option value="" disabled>Select body type</option>{[...new Set([...bodyTypes, value.bodyType].filter(Boolean))].map(body => <option key={body} value={body}>{body}</option>)}</select>
    </label>
  </>;
}
