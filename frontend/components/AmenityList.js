export default function AmenityList({ amenities, className = 'gap-3' }) {
  return (
    <ul className={`flex flex-wrap ${className}`}>
      {amenities.map(({ icon: IconComp, label }) => (
        <li key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
          <IconComp className="h-3.5 w-3.5 text-brand-500" />
          {label}
        </li>
      ))}
    </ul>
  );
}
