/** The list of input keys will become optional, everything else will remain the same. */
export type PickPartial<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/** Makes everything optional except the list of input keys */
export type PickRequired<T, K extends keyof T> = Partial<Omit<T, K>> &
  Required<Pick<T, K>>;

/** Auto ignore isa */
export type SansIsa<T> = Omit<T, "isa">;

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type EntriesAnyValue<T> = {
  [K in keyof T]: [K, any];
}[keyof T][];

/** Like `keysof` but for values. */
export type ValueOf<T> = T[keyof T];

export type OmitType<
  T,
  V,
  WithNevers = {
    [K in keyof T]: Exclude<T[K], undefined> extends V
      ? never
      : T[K] extends Record<string, unknown>
      ? OmitType<T[K], V>
      : T[K];
  }
> = Pick<
  WithNevers,
  {
    [K in keyof WithNevers]: WithNevers[K] extends never ? never : K;
  }[keyof WithNevers]
>;

export type OnlyValuesOfType<
  T,
  V,
  WithNevers = {
    [K in keyof T]: Exclude<T[K], undefined> extends V
      ? T[K] extends Record<string, unknown>
        ? OnlyValuesOfType<T[K], V>
        : T[K]
      : never;
  }
> = Pick<
  WithNevers,
  {
    [K in keyof WithNevers]: WithNevers[K] extends never ? never : K;
  }[keyof WithNevers]
>;
