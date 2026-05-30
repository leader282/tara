export function assertNever(value: never, context = "Unexpected object"): never {
  throw new Error(`${context}: ${JSON.stringify(value)}`);
}
