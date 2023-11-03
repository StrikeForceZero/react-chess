import {
  HTMLProps,
} from 'react';
import {
  CustomizableSelect,
  OnSelectedValueChangeHandler,
  SimpleOptions,
} from '../CustomizableSelect';

export enum BotType {
  Random = 'Random',
  Basic = 'Basic',
}

export function BotTypeSelector(
  {
    label = 'Bot Type',
    botType,
    onBotTypeChange,
    ...props
  }: {
    id: string,
    label?: string,
    botType?: BotType,
    value?: BotType,
    defaultValue?: BotType,
    onBotTypeChange: OnSelectedValueChangeHandler<BotType>,
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
      options={SimpleOptions(Object.values(BotType))}
      onSelectedValueChange={onBotTypeChange}
      defaultValue={BotType.Random}
    />
  )
}
