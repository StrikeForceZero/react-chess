import React, {
  HTMLProps,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Result } from '../../engine/src/utils/Result';

export type OnSelectedValueChangeHandler<T> = (selectedValue: T) => void;

export type OptionData<V> = {
  value: V,
  key: string,
  label: string,
}

export function SimpleOptions<const T extends { toString(): string; }>(values: T[]): OptionData<T>[] {
  return values.map(v => (
    {
      key: v.toString(),
      label: v.toString(),
      value: v,
    }
  ))
}

export function CustomizableSelect<T>(
  {
    mapValueToString = String,
    ...props
  }: {
    id: string,
    label: string,
    options: OptionData<T>[],
    value?: T,
    // TODO: should only be required if value is not provided
    defaultValue: T,
    mapValueToString?: (value: T) => string,
    onSelectedValueChange: OnSelectedValueChangeHandler<T>,
    divProps?: HTMLProps<HTMLDivElement>,
    labelProps?: HTMLProps<HTMLLabelElement>,
    selectProps?: HTMLProps<HTMLSelectElement>,
    optionProps?: HTMLProps<HTMLOptionElement>,
  },
) {
  const [selectedValue, setSelectedValue] = useState(props.value ?? props.defaultValue);

  useEffect(() => {
    setSelectedValue(selectedValue => props.value ?? selectedValue);
  }, [props.value]);

  const options = props.options.map(option => {
    return (
      <option {...props.optionProps} key={option.key} value={mapValueToString(option.value)}>{option.label}</option>
    )
  });

  // TODO: we need Option.Some(T)/Option.None but for now we can use Result<T, E>
  const resolveValue = useCallback((value: string): Result<T, Error> => {
    const option = props.options.find(option => mapValueToString(option.value) === value);
    if (!option) {
      return Result.Err(new Error(`no option found for ${value}`));
    }
    return Result.Ok(option.value);
  }, [props])

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = useCallback((event) => {
    const value = event.currentTarget.value;
    const resolvedValueResult = resolveValue(value);
    if (resolvedValueResult.isErr()) {
      throw resolvedValueResult.unwrapErr();
    }
    const resolvedValue = resolvedValueResult.unwrap();
    setSelectedValue(resolvedValue);
    props.onSelectedValueChange(resolvedValue);
  }, [props, resolveValue]);

  return (
    <div {...props.divProps}>
      <label {...props.labelProps} htmlFor={props.id}>{props.label}</label>
      <select {...props.selectProps} id={props.id} value={mapValueToString(selectedValue)} onChange={handleChange}>
        {options}
      </select>
    </div>
  )
}
