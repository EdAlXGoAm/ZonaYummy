// Vendored from edalxgoam_components/src/components/two_option_switch for CRA.
import React from 'react';

import './TwoOptionSwitch.css';

export function TwoOptionSwitch({
  value,
  onChange,
  leftLabel,
  rightLabel,
  textColor = '#111827',
  trackColor = '#e5e7eb',
  thumbColor = '#ffffff',
  bordered = true,
  className,
  ariaLabel = 'Toggle',
}) {
  const toggle = () => onChange(value === 'left' ? 'right' : 'left');

  return (
    <div
      className={`two-option-switch ${className ?? ''}`.trim()}
      data-value={value}
      data-bordered={bordered ? 'true' : 'false'}
      style={{
        '--tos-text': textColor,
        '--tos-track': trackColor,
        '--tos-thumb': thumbColor,
      }}
    >
      <span
        className="two-option-switch__label"
        role="presentation"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange('left')}
      >
        {leftLabel}
      </span>
      <button
        type="button"
        className="two-option-switch__track"
        role="switch"
        aria-checked={value === 'right'}
        aria-label={ariaLabel}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        <span className="two-option-switch__thumb" aria-hidden />
      </button>
      <span
        className="two-option-switch__label"
        role="presentation"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange('right')}
      >
        {rightLabel}
      </span>
    </div>
  );
}
