import { ZodObject, type ZodTypeAny } from "zod"

export namespace Util {
  /**
   * Define a struct that must have tokens in `T` as key and value as well.  
   * e.g. `type Test = KeyAsValue<"foo"|"bar">` equals `type Test = { foo: "foo", bar: "bar" }`.
   */
  export type KeyAsValue<T extends string> = { [K in T]: K }

  /**
   * Define an array that has finite set of value out of `T`
   */
  export type KeyAsArray<T> = Array<T>

  /**
   * Define a type as subset of non-object `T`
   */
  export type KeySubset<T, K extends T> = K

  /**
   * Define a Zod object type that must have tokens in `T` as key.
   */
  export type KeyAsZod<T extends string> = ZodObject<{ [K in T]: ZodTypeAny }>
  
  /**
   * Pick preferred keys `K` out of object `T` (result is just `K`)
   */
  export type KPick<T, K extends keyof T> = K

  /**
   * Get combined type of values by selected keys `K`
   */
  export type VPick<T, K extends keyof T> = T[K]

  /**
   * Works as `Pick` but all value types are changed (optional property preserved)
   */
  export type XPick<T, K extends keyof T, V = any> = { [k in K]: V }

  /**
   * Works as `Pick` but all optional and nullable properties are removed
   */
  export type DefinitePick<T, K extends keyof T> = { [key in K]-?: NonNullable<T[key]> }

  /**
   * Works as `Pick` but all value types are changed (optional and nullable property removed)
   */
  export type DefiniteXPick<T, K extends keyof T, V = any> = { [k in K]-?: NonNullable<V> }

  /**
   * Works as `Pick` but all entries are optional (instead, nullable properties are removed)
   */
  export type IndefinitePick<T, K extends keyof T> = { [key in K]?: NonNullable<T[key]> }

  /**
   * Example: `z.enum(zodEnum(["true", "false"]))`
   */
  export function zodEnum<T>(arr: T[]): [T, ...T[]] {
    return arr as [T, ...T[]]
  }

  /**
   * Get element type from array
   */
  export type ArrayElement<ArrayType extends readonly unknown[]> = 
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

}
