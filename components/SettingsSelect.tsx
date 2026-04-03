'use client';

interface SettingsSelectProps {
	label: string;
	value: string | number;
	onChange: (value: string) => void;
	options: { value: string | number; label: string }[];
	disabled?: boolean;
}

export default function SettingsSelect({ label, value, onChange, options, disabled }: SettingsSelectProps) {
	return (
		<div>
			<label style={{
				display: 'block',
				fontSize: 12,
				fontWeight: 600,
				color: '#6C6D6F',
				marginBottom: 6,
			}}>
				{label}
			</label>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid #D0D0D0',
					borderRadius: 4,
					fontSize: 14,
					backgroundColor: disabled ? '#F9F9F9' : '#FFFFFF',
				}}
			>
				{options.map(opt => (
					<option key={opt.value} value={opt.value}>{opt.label}</option>
				))}
			</select>
		</div>
	);
}
