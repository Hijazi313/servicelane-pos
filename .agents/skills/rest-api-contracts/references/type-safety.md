# Type-safe API contracts

Apply the [canonical requirements](../../../../docs/architecture/rest-api-convention.md#type-safety). These examples illustrate the pattern; they are not existing endpoints or authorization to add dependencies. Use the repository's selected validation integration. DTO classes with validation decorators and schema-based pipes are alternatives, not layers to stack together.

## Validate the value, not just the annotation

```ts
// Bad: neither the annotation nor this DTO class validates JSON.
class QuantityDto {
  constructor(readonly quantity: number) {}
}

function receive(body: unknown): QuantityDto {
  return body as QuantityDto;
}
```

```ts
// Good: a Nest pipe narrows unknown input and returns a validated DTO.
import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

class QuantityDto {
  constructor(readonly quantity: number) {}
}

@Injectable()
class QuantityPipe implements PipeTransform<unknown, QuantityDto> {
  transform(value: unknown): QuantityDto {
    if (typeof value !== 'object' || value === null || Array.isArray(value)
      || Object.keys(value).length !== 1 || !('quantity' in value)) {
      throw new BadRequestException();
    }
    const quantity = value.quantity;
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity)
      || quantity < 1 || quantity > 100) {
      throw new BadRequestException();
    }
    return new QuantityDto(quantity);
  }
}
```

The 1–100 range is illustrative, not a POS business limit. A controller binds the pipe with `@Body(QuantityPipe) input: QuantityDto`. Its application operation receives the validated DTO or an intentionally mapped application input. A response annotation such as `Promise<QuantityResponseDto>` provides a compile-time contract, not runtime field removal.

This small hand-written pipe demonstrates narrowing without installing a library. For real nested payloads, reuse a supported configured DTO/schema integration instead of copying manual parsers across endpoints. Validate query/path/header inputs too; query strings require deliberate parsing. Keep business invariants in the application/domain even when transport structure was checked.

## Check response fields deliberately

```ts
interface QuantityResponseDto {
  quantity: number;
}

// Bad: structural typing permits extra properties to escape at runtime.
function unsafeResponse(): QuantityResponseDto {
  const internal = { quantity: 2, internalNote: 'private' };
  return internal;
}

// Good: select the public representation.
function publicResponse(quantity: number): QuantityResponseDto {
  return { quantity };
}
```

Return this DTO inside the standard success envelope. Mapping is useful when field selection is needed; do not create mapping classes when the application result already intentionally matches the public contract.

## Make finite outcomes exhaustive

```ts
type CaptureOutcome =
  | { kind: 'created'; orderId: string }
  | { kind: 'replayed'; orderId: string }
  | { kind: 'price-changed'; currentUnitMinor: string };

function assertNever(value: never): never {
  throw new Error('Unhandled capture outcome');
}

function outcomeLabel(result: CaptureOutcome): string {
  switch (result.kind) {
    case 'created': return 'created';
    case 'replayed': return 'replayed';
    case 'price-changed': return 'confirmation-required';
    default: return assertNever(result);
  }
}
```

Add another union member and compilation fails until the switch handles it. Apply this to finite error mappings and recommendation unions too. The label function is only an exhaustiveness example, not the order response contract. Unexpected runtime values still need safe fallback handling.

## Await work and preserve failure

```ts
// Bad: failure becomes success; the write promise was not awaited.
async function unsafeSave(save: () => Promise<void>): Promise<boolean> {
  try {
    void save();
    return true;
  } catch {
    return true;
  }
}

// Good: completion and rejection remain visible to the caller.
async function saveAndConfirm(save: () => Promise<void>): Promise<boolean> {
  await save();
  return true;
}
```

Catch only to recover deliberately, add safe context or translate a known failure. Catch values stay unknown until narrowed. The HTTP boundary maps expected semantic errors and returns a safe 500 with correlated diagnostics for unexpected request failures. Do not repeat logging at every layer. Background work needs an owned completion/error path; an HTTP filter cannot handle detached work or process failures. This skill does not introduce background processing or process recovery behavior.

## Verification

Typecheck public contracts and exhaustive handling. Runtime checks must also exercise malformed input, forbidden extra fields, response field exclusion and rejected asynchronous operations. TypeScript cannot guarantee that no unexpected event occurs. The goal is explicit expected behavior plus contained, observable failure.
