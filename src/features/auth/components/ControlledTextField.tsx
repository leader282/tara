import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { TextField, type TextFieldProps } from "@/components/ui";

type ControlledTextFieldProps<TFieldValues extends FieldValues> = Omit<
  TextFieldProps,
  "value" | "onBlur" | "onChangeText" | "errorMessage"
> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

export function ControlledTextField<TFieldValues extends FieldValues>({
  control,
  name,
  ...textFieldProps
}: ControlledTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          errorMessage={fieldState.error?.message}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          value={field.value ?? ""}
        />
      )}
    />
  );
}
