'use client'

import clsx from 'clsx'
import ReactSelect, { components as defaultComponents } from 'react-select'
import { useMemo, useState } from 'react'

function DropdownIndicator(props) {
  const { selectProps } = props
  const isOpen = selectProps.menuIsOpen

  return (
    <defaultComponents.DropdownIndicator {...props}>
      <span
        aria-hidden="true"
        className={clsx(
          'block h-[8px] w-[8px] shrink-0 border-r-2 border-b-2 border-foreground-faint transition-transform duration-200 ease-out',
          isOpen
            ? '-translate-y-[1px] rotate-[225deg]'
            : 'translate-y-[-1px] rotate-45',
        )}
      />
    </defaultComponents.DropdownIndicator>
  )
}

export default function Select({
  id,
  label,
  error,
  hint,
  className,
  labelClassName,
  helpClassName,
  options = [],
  value = null,
  onChange,
  placeholder = 'Select option',
  isSearchable = false,
  isClearable = false,
  isDisabled = false,
  isOptionDisabled,
  required = false,
  menuPlacement = 'bottom',
  hideHelp = false,

  classNamePrefix = 'sg-select',
  components,
  formatOptionLabel,
  getOptionLabel,
  getOptionValue,
  noOptionsMessage,
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [menuIsOpen, setMenuIsOpen] = useState(false)

  const describedById = id ? `${id}__help` : undefined
  const isActive = isFocused || menuIsOpen
  const showErrorState = Boolean(error) && !isActive

  const mergedComponents = useMemo(
    () => ({
      DropdownIndicator,
      IndicatorSeparator: null,
      ...(components || {}),
    }),
    [components],
  )

  const styles = useMemo(
    () => ({
      menuPortal: (base) => ({
        ...base,
        zIndex: 20000,
      }),

      control: (base) => ({
        ...base,
        minHeight: '40px',
        borderRadius: '1rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: isActive
          ? '1px solid rgba(124, 92, 255, 0.9)'
          : showErrorState
            ? '1px solid rgba(239, 68, 68, 0.6)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isActive
          ? '0 0 0 4px rgba(124, 92, 255, 0.12)'
          : showErrorState
            ? '0 0 0 1px rgba(239, 68, 68, 0.12)'
            : 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: isActive
            ? 'rgba(124, 92, 255, 0.9)'
            : showErrorState
              ? 'rgba(239, 68, 68, 0.6)'
              : 'rgba(255, 255, 255, 0.12)',
        },
      }),

      valueContainer: (base) => ({
        ...base,
        padding: '0 0.875rem',
      }),

      placeholder: (base) => ({
        ...base,
        color: 'var(--text-faint)',
      }),

      singleValue: (base) => ({
        ...base,
        color: 'var(--text)',
        fontSize: '1rem',
        fontWeight: 500,
      }),

      input: (base) => ({
        ...base,
        color: 'var(--text)',
      }),

      indicatorSeparator: () => ({
        display: 'none',
      }),

      dropdownIndicator: (base) => ({
        ...base,
        color: 'var(--text-faint)',
        paddingLeft: '0.5rem',
        paddingRight: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          color: 'var(--text-soft)',
        },
      }),

      clearIndicator: (base) => ({
        ...base,
        color: 'var(--text-faint)',
        '&:hover': {
          color: 'var(--text-soft)',
        },
      }),

      menu: (base) => ({
        ...base,
        marginTop: 8,
        overflow: 'hidden',
        borderRadius: '1rem',
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(180deg, rgba(20, 23, 32, 0.96), rgba(17, 19, 26, 0.98))',
        boxShadow:
          '0 18px 40px rgba(0,0,0,0.38), 0 0 0 1px rgba(124,92,255,0.08)',
      }),

      menuList: (base) => ({
        ...base,
        padding: '0.5rem',
        maxHeight: 280,
      }),

      option: (base, state) => ({
        ...base,
        borderRadius: '0.875rem',
        padding: '0.75rem 0.875rem',
        fontSize: '0.95rem',
        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        color: state.isDisabled ? 'rgba(255, 255, 255, 0.38)' : 'var(--text)',
        background: state.isDisabled
          ? 'transparent'
          : state.isSelected
            ? 'rgba(124, 92, 255, 0.16)'
            : state.isFocused
              ? 'rgba(255, 255, 255, 0.06)'
              : 'transparent',
        transition: 'all 0.16s ease',
        ':active': {
          background: state.isDisabled
            ? 'transparent'
            : 'rgba(124, 92, 255, 0.18)',
        },
      }),

      noOptionsMessage: (base) => ({
        ...base,
        color: 'var(--text-faint)',
        fontSize: '0.875rem',
      }),
    }),
    [showErrorState, isActive, isDisabled],
  )

  return (
    <div className={clsx('input-group', className)}>
      {label ? (
        <label
          htmlFor={id}
          className={clsx(
            'mb-2 block text-sm font-medium text-foreground-soft',
            labelClassName,
          )}
        >
          {label}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}

      <ReactSelect
        instanceId={id}
        inputId={id}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isOptionDisabled={isOptionDisabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedById}
        menuPortalTarget={
          typeof document !== 'undefined' ? document.body : null
        }
        menuPosition="fixed"
        menuPlacement={menuPlacement}
        unstyled
        classNamePrefix={classNamePrefix}
        components={mergedComponents}
        styles={styles}
        formatOptionLabel={formatOptionLabel}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        noOptionsMessage={noOptionsMessage}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
      />

      {!hideHelp && (
        <span
          id={describedById}
          className={clsx(
            'mt-2 block min-h-5 text-xs leading-5 text-foreground-faint',
            error && 'text-danger',
            helpClassName,
          )}
        >
          {error || hint || '\u00A0'}
        </span>
      )}
    </div>
  )
}
