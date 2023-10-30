import {
  HTMLProps,
} from 'react';
import {
  CustomizableSelect,
  OnSelectedValueChangeHandler,
  SimpleOptions,
} from '../CustomizableSelect';

export enum PlayerType {
  Human = 'Human',
  Bot = 'Bot',
}

export function PlayerTypeSelector(
  {
    label = 'Player Type',
    playerType,
    onPlayerTypeChange,
    ...props
  }: {
    id: string,
    label?: string,
    playerType?: PlayerType,
    value?: PlayerType,
    defaultValue?: PlayerType,
    onPlayerTypeChange: OnSelectedValueChangeHandler<PlayerType>,
    divProps?: HTMLProps<HTMLDivElement>,
    labelProps?: HTMLProps<HTMLLabelElement>,
    selectProps?: HTMLProps<HTMLSelectElement>,
    optionProps?: HTMLProps<HTMLOptionElement>,
  },
) {
  return (
    <CustomizableSelect
      {...props}
      label={label}
      options={SimpleOptions(Object.values(PlayerType))}
      onSelectedValueChange={onPlayerTypeChange}
      defaultValue={PlayerType.Human}
    />
  )
}
