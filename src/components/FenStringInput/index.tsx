import React, {
  HTMLProps,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { SetRequired } from 'type-fest';
import {
  FENString,
  isFen,
  StandardStartPositionFEN,
} from '../../engine/src/fen/FENString';

type InputOnChange = Required<HTMLProps<HTMLInputElement>>['onChange'];
type InputOnKeyDown = Required<HTMLProps<HTMLInputElement>>['onKeyDown'];
type ButtonOnClick = Required<HTMLProps<HTMLButtonElement>>['onClick'];

export type MaybeFENString = string | FENString;
export type FenStringApplyOrOnEnterHandler<T extends MaybeFENString = MaybeFENString> = (...args: [T, ...Parameters<InputOnKeyDown | ButtonOnClick>]) => void;
export type FenStringOnChangeHandler<T extends MaybeFENString = MaybeFENString> = (...args: [T, ...Parameters<InputOnChange>]) => void;

type FenStringInputPropsBase<T extends MaybeFENString = MaybeFENString> = {
  id?: string,
  enforceValidFenOnApplyOrOnEnter?: boolean,
  value?: MaybeFENString,
  onChange?: FenStringOnChangeHandler<T>,
  onApply?: FenStringApplyOrOnEnterHandler<T>,
  divProps?: HTMLProps<HTMLDivElement>,
  inputProps?: HTMLProps<HTMLInputElement>,
  labelProps?: HTMLProps<HTMLLabelElement>,
  spanProps?: HTMLProps<HTMLSpanElement>,
  buttonProps?: HTMLProps<HTMLButtonElement> & { type: never },
};
type FenStringInputPropsEnforceRequired = Omit<FenStringInputPropsBase<FENString>, 'enforceValidFenOnApplyOrOnEnter'> & { enforceValidFenOnApplyOrOnEnter: true };

export type FenStringInputProps<T extends MaybeFENString> =
  T extends FENString ? FenStringInputPropsEnforceRequired
    : FenStringInputPropsBase;

type IsTypeFn<T> = (value: any) => value is T;
function typeCheck<T>(
  checkFn: IsTypeFn<T>,
  value: unknown,
  onOk: (value: T) => void,
  onError: (value: unknown) => void = () => {},
  skipCheck: boolean = false,
): void {
  if (!skipCheck && !checkFn(value)) {
    onError(value);
    return;
  }
  onOk(value as T);
}

export function FenStringInput<T extends MaybeFENString>(
  props: FenStringInputProps<T>,
) {
  const [value, setValue] = useState(props.value ?? '');

  const id = props.id ?? 'default';

  useEffect(() => {
    setValue(props.value as T);
  }, [props.value]);

  // TODO: add test to make sure this always runs when enforceValidFenOnApplyOrOnEnter is true
  const typeCheckFenString = useCallback((
    eventName: string,
    value: unknown,
    onOk: (value: FENString) => void,
  ) => {
    typeCheck<FENString>(
      isFen,
      value,
      onOk,
      nextValue => console.error(`enforceValidFenOnApplyOrOnEnter is set for ${id} - not propagating ${eventName} for invalid fen: ${nextValue}`),
      !!props.enforceValidFenOnApplyOrOnEnter,
    );
  }, [id, props]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.currentTarget.value;
    setValue(nextValue);
    typeCheckFenString(
      'onChange',
      nextValue,
      nextValue => props.onChange?.(nextValue, e),
    );
  }, [props, typeCheckFenString]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const nextValue = e.currentTarget.value;
    if (e.key === 'Enter') {
      typeCheckFenString(
        'onApply',
        nextValue,
        nextValue => props.onApply?.(nextValue, e),
      );
    }
  }, [props, typeCheckFenString]);

  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    typeCheckFenString(
      'onApply',
      value,
      nextValue => props.onApply?.(nextValue, e),
    );
  }, [props, value, typeCheckFenString]);

  const isValidFen = isFen(value);

  return (
    <div>
      <label
        {...props.labelProps}
        htmlFor={`fen-input_${id}`}
        style={{
          marginRight: '1rem',
          ...props.labelProps?.style,
        }}
      >
        Fen:
      </label>
      <input
        {...props.inputProps}
        id={`fen-input_${id}`}
        style={{ width: '30rem', ...props.inputProps?.style }}
        value={value}
        placeholder={StandardStartPositionFEN}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
      />
      <span
        hidden={isValidFen}
        {...props.spanProps}
        style={{
          color: 'red',
          marginLeft: '1rem',
          ...props.spanProps?.style,
        }}
      >
        Invalid FEN!
      </span>
      <button
        hidden={!isValidFen && props.enforceValidFenOnApplyOrOnEnter}
        {...props.buttonProps}
        style={{
          marginLeft: '1rem',
          ...props.buttonProps?.style,
        }}
        onClick={handleButtonClick}
      >
        Apply
      </button>
    </div>
  );
}
